import {
  UnauthorizedException,
  ValidationPipe,
  StreamableFile,
  NotFoundException,
} from '@nestjs/common';
import type { INestApplication, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('Avatar HTTP endpoints', () => {
  let app: INestApplication;
  const service = {
    getAvatar: jest.fn(() =>
      Promise.resolve(
        new StreamableFile(Buffer.from('image'), {
          type: 'image/png',
          disposition: 'inline',
        }),
      ),
    ),
    deleteAvatar: jest.fn().mockResolvedValue(undefined),
    uploadAvatar: jest
      .fn()
      .mockResolvedValue('https://storage.example/avatar.png'),
    updateProfile: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context.switchToHttp().getRequest<{
            headers: { authorization?: string };
            user?: { userId: number };
          }>();
          if (req.headers.authorization !== 'Bearer test')
            throw new UnauthorizedException();
          req.user = { userId: 7 };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });
  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => {
    await app.close();
  });

  it.each([undefined, 'Bearer test'])(
    'does not expose the removed generic file routes with auth %s',
    async (authorization) => {
      const upload = request(app.getHttpServer() as Server).post(
        '/api/files/upload',
      );
      if (authorization) upload.set('Authorization', authorization);
      await upload.expect(404);
      const remove = request(app.getHttpServer() as Server).delete(
        '/api/files/2813bd63-e537-427a-a129-d23f24ab5148',
      );
      if (authorization) remove.set('Authorization', authorization);
      await remove.expect(404);
    },
  );

  it('requires authentication for viewing an avatar', async () => {
    await request(app.getHttpServer() as Server)
      .get('/api/users/me/profile/avatar')
      .expect(401);
    expect(service.getAvatar).not.toHaveBeenCalled();
  });

  it('streams an image for the authenticated user without caching or redirecting', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/api/users/me/profile/avatar?file=cache-key')
      .set('Authorization', 'Bearer test')
      .expect(200)
      .expect('Content-Type', 'image/png')
      .expect('Cache-Control', 'private, no-store')
      .expect('X-Content-Type-Options', 'nosniff');
    expect(response.body).toEqual(Buffer.from('image'));
    expect(response.headers.location).toBeUndefined();
    expect(service.getAvatar).toHaveBeenCalledWith(7);
  });

  it('returns 404 when the avatar is absent', async () => {
    service.getAvatar.mockRejectedValueOnce(
      new NotFoundException('Avatar not found'),
    );
    await request(app.getHttpServer() as Server)
      .get('/api/users/me/profile/avatar')
      .set('Authorization', 'Bearer test')
      .expect(404);
  });

  it('requires authentication for deleting an avatar', async () => {
    await request(app.getHttpServer() as Server)
      .delete('/api/users/me/profile/avatar')
      .expect(401);
    expect(service.deleteAvatar).not.toHaveBeenCalled();
  });

  it('returns an empty 204 and deletes for the authenticated user', async () => {
    const result = await request(app.getHttpServer() as Server)
      .delete('/api/users/me/profile/avatar')
      .set('Authorization', 'Bearer test')
      .expect(204);
    expect(result.text).toBe('');
    expect(service.deleteAvatar).toHaveBeenCalledWith(7);
  });

  it('keeps the multipart upload response as a signed URL string', async () => {
    const result = await request(app.getHttpServer() as Server)
      .post('/api/users/me/profile/avatar')
      .set('Authorization', 'Bearer test')
      .attach('file', Buffer.from('image'), 'avatar.png')
      .expect(201);
    expect(result.text).toBe('https://storage.example/avatar.png');
    expect(service.uploadAvatar).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ originalname: 'avatar.png' }),
    );
  });

  it.each([
    { avatarFileId: '2813bd63-e537-427a-a129-d23f24ab5148' },
    { avatarUrl: 'https://example.com/image.png' },
  ])('rejects avatar fields on ordinary profile updates', async (body) => {
    await request(app.getHttpServer() as Server)
      .patch('/api/users/me/profile')
      .set('Authorization', 'Bearer test')
      .send(body)
      .expect(400);
    expect(service.updateProfile).not.toHaveBeenCalled();
  });
});
