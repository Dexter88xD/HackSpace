import {
  ExecutionContext,
  INestApplication,
  NotFoundException,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Server } from 'http';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

// Keep HTTP validation and guard wiring real; replace token verification and persistence.
describe('SkillsController', () => {
  let app: INestApplication;
  let server: Server;
  const service = {
    findAll: jest.fn(),
    findByName: jest.fn(),
    findOne: jest.fn(),
    findByProfile: jest.fn(),
    add: jest.fn(),
    addBatch: jest.fn(),
    removeFromProfile: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [SkillsController],
      providers: [{ provide: SkillsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
          if (req.headers.authorization !== 'Bearer test')
            throw new UnauthorizedException();
          req.user = { userId: 7 };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    server = app.getHttpServer() as Server;
  });

  beforeEach(() => jest.resetAllMocks());
  afterAll(async () => {
    await app?.close();
  });

  it.each([
    ['get', '/skills'],
    ['get', '/skills/1'],
    ['get', '/skills/by-name?name=TypeScript'],
    ['get', '/skills/profiles/10'],
    ['post', '/skills'],
    ['post', '/skills/batch'],
    ['delete', '/skills/profiles/10'],
    ['patch', '/skills/1'],
    ['delete', '/skills/1'],
  ] as const)('requires authentication for %s %s', async (method, path) => {
    await request(server)[method](path).expect(401);
  });

  it('lists skills and passes optional name filters', async () => {
    service.findAll.mockResolvedValue([]);
    await request(server)
      .get('/skills')
      .auth('test', { type: 'bearer' })
      .expect(200, []);
    expect(service.findAll).toHaveBeenCalled();
    service.findAll.mockResolvedValue([{ id: 1, name: 'TypeScript' }]);
    await request(server)
      .get('/skills')
      .query({ name: 'typescript' })
      .auth('test', { type: 'bearer' })
      .expect(200, [{ id: 1, name: 'TypeScript' }]);
    expect(service.findAll).toHaveBeenCalledWith({ name: 'typescript' });
    expect(service.findByName).not.toHaveBeenCalled();
  });

  it('finds an exact name through its dedicated route before ID lookup', async () => {
    const skill = { id: 1, name: 'Machine Learning' };
    service.findByName.mockResolvedValue(skill);
    await request(server)
      .get('/skills/by-name')
      .query({ name: ' Machine  Learning ' })
      .auth('test', { type: 'bearer' })
      .expect(200, skill);
    expect(service.findByName).toHaveBeenCalledWith('Machine Learning');
    expect(service.findOne).not.toHaveBeenCalled();
    expect(service.findAll).not.toHaveBeenCalled();
  });

  it.each([
    '/skills/by-name',
    '/skills/by-name?name=',
    '/skills/by-name?name=%20%20',
    `/skills/by-name?name=${'a'.repeat(51)}`,
    `/skills/by-name?name=${encodeURIComponent('İ'.repeat(26))}`,
    '/skills/by-name?name=one&name=two',
  ])('rejects missing or invalid exact names: %s', async (path) => {
    await request(server)
      .get(path)
      .auth('test', { type: 'bearer' })
      .expect(400);
    expect(service.findByName).not.toHaveBeenCalled();
  });

  it('returns 404 when an exact name is absent', async () => {
    service.findByName.mockRejectedValue(
      new NotFoundException('Skill not found'),
    );
    await request(server)
      .get('/skills/by-name')
      .query({ name: 'unknown' })
      .auth('test', { type: 'bearer' })
      .expect(404);
  });

  it('routes profile reads before skill ID lookups', async () => {
    service.findByProfile.mockResolvedValue([]);
    await request(server)
      .get('/skills/profiles/10')
      .auth('test', { type: 'bearer' })
      .expect(200, []);
    expect(service.findByProfile).toHaveBeenCalledWith(10);
    expect(service.findOne).not.toHaveBeenCalled();
  });

  it('finds a skill by parsed ID', async () => {
    service.findOne.mockResolvedValue({ id: 1 });
    await request(server)
      .get('/skills/1')
      .auth('test', { type: 'bearer' })
      .expect(200);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it.each([
    { profileId: 10, id: 1 },
    { profileId: 10, name: 'TypeScript' },
    { profileId: 10, id: null, name: 'TypeScript' },
    { profileId: 10, id: 1, name: 'Other Name' },
    { id: 1 },
    { name: 'TypeScript' },
    { id: null, name: 'TypeScript' },
  ])('accepts a single DTO: %p', async (body) => {
    service.add.mockResolvedValue({ id: 1 });
    await request(server)
      .post('/skills')
      .auth('test', { type: 'bearer' })
      .send(body)
      .expect(201, { id: 1 });
    expect(service.add).toHaveBeenCalledWith(body, 7);
    expect(service.addBatch).not.toHaveBeenCalled();
  });

  it('normalizes single skill names in DTO transformation', async () => {
    await request(server)
      .post('/skills')
      .auth('test', { type: 'bearer' })
      .send({ profileId: 10, id: null, name: '  Machine \n Learning  ' })
      .expect(201);
    expect(service.add).toHaveBeenCalledWith(
      { profileId: 10, id: null, name: 'Machine Learning' },
      7,
    );
  });

  const malformed = [
    {},
    { profileId: 10 },
    { profileId: 10, id: null },
    { profileId: 10, id: 0 },
    { profileId: 10, id: '1' },
    { profileId: 10, id: 1.5 },
    { profileId: 0, id: 1 },
    { profileId: '10', id: 1 },
    { profileId: null, id: 1 },
    { profileId: 10, name: '  ' },
    { profileId: 10, name: null },
    { profileId: 10, name: 'a'.repeat(51) },
    { profileId: 10, name: 'İ'.repeat(26) },
    { profileId: 10, id: 1, name: '' },
    { profileId: 10, id: 1, name: null },
    { profileId: 10, id: 1, extra: true },
    { profileId: Number.MAX_SAFE_INTEGER + 1, id: 1 },
    { profileId: 10, id: Number.MAX_SAFE_INTEGER + 1 },
  ];

  it.each(malformed)('rejects invalid single DTO %p', async (body) => {
    await request(server)
      .post('/skills')
      .auth('test', { type: 'bearer' })
      .send(body)
      .expect(400);
    expect(service.add).not.toHaveBeenCalled();
  });

  it('accepts a raw batch spanning profiles and normalizes each DTO', async () => {
    service.addBatch.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    await request(server)
      .post('/skills/batch')
      .auth('test', { type: 'bearer' })
      .send([
        { profileId: 10, id: 1 },
        { profileId: 20, id: null, name: ' New  Name ' },
      ])
      .expect(201, [{ id: 1 }, { id: 2 }]);
    expect(service.addBatch).toHaveBeenCalledWith(
      [
        { profileId: 10, id: 1 },
        { profileId: 20, id: null, name: 'New Name' },
      ],
      7,
    );
    expect(service.add).not.toHaveBeenCalled();
  });

  it('accepts a batch mixing catalog-only and profile additions', async () => {
    const body = [{ name: 'TypeScript' }, { profileId: 10, id: 1 }];
    service.addBatch.mockResolvedValue([{ id: 1 }, { id: 1 }]);
    await request(server)
      .post('/skills/batch')
      .auth('test', { type: 'bearer' })
      .send(body)
      .expect(201, [{ id: 1 }, { id: 1 }]);
    expect(service.addBatch).toHaveBeenCalledWith(body, 7);
  });

  it.each(malformed)(
    'rejects a batch containing invalid DTO %p before calling the service',
    async (body) => {
      await request(server)
        .post('/skills/batch')
        .auth('test', { type: 'bearer' })
        .send([{ profileId: 10, id: 1 }, body])
        .expect(400);
      expect(service.addBatch).not.toHaveBeenCalled();
    },
  );

  it.each([
    { body: [] },
    { body: {} },
    { body: { skills: [{ profileId: 10, id: 1 }] } },
    { body: [null] },
    { body: [[]] },
    { body: [1] },
    { body: ['bad'] },
  ])('rejects malformed batch shape %p', async ({ body }) => {
    await request(server)
      .post('/skills/batch')
      .auth('test', { type: 'bearer' })
      .send(body)
      .expect(400);
    expect(service.addBatch).not.toHaveBeenCalled();
  });

  it('rejects an array at the single-add endpoint', async () => {
    await request(server)
      .post('/skills')
      .auth('test', { type: 'bearer' })
      .send([{ profileId: 10, id: 1 }])
      .expect(400);
    expect(service.add).not.toHaveBeenCalled();
  });

  it('accepts the display and normalized name length boundaries', async () => {
    for (const name of ['a'.repeat(50), '😀'.repeat(50), 'İ'.repeat(25)]) {
      await request(server)
        .post('/skills')
        .auth('test', { type: 'bearer' })
        .send({ profileId: 10, name })
        .expect(201);
    }
  });

  it('passes the actor and IDs to profile detachment', async () => {
    await request(server)
      .delete('/skills/profiles/10')
      .auth('test', { type: 'bearer' })
      .send({ skillIds: [1, 2] })
      .expect(204);
    expect(service.removeFromProfile).toHaveBeenCalledWith(10, [1, 2], 7);
  });

  it.each([
    { skillIds: [] },
    { skillIds: [0] },
    { skillIds: [1.5] },
    { skillIds: [Number.MAX_SAFE_INTEGER + 1] },
    { skillIds: ['1'] },
    {},
  ])('rejects invalid detachment input %p', async (body) => {
    await request(server)
      .delete('/skills/profiles/10')
      .auth('test', { type: 'bearer' })
      .send(body)
      .expect(400);
    expect(service.removeFromProfile).not.toHaveBeenCalled();
  });

  it('passes the actor and normalized display name to rename', async () => {
    await request(server)
      .patch('/skills/1')
      .auth('test', { type: 'bearer' })
      .send({ name: ' New  Name ' })
      .expect(200);
    expect(service.update).toHaveBeenCalledWith(1, { name: 'New Name' }, 7);
  });

  it.each([
    {},
    { name: '' },
    { name: null },
    { name: 'TS', id: 2 },
    { name: 'a'.repeat(51) },
    { name: 'İ'.repeat(26) },
  ])('rejects invalid rename input %p', async (body) => {
    await request(server)
      .patch('/skills/1')
      .auth('test', { type: 'bearer' })
      .send(body)
      .expect(400);
    expect(service.update).not.toHaveBeenCalled();
  });

  it('passes the actor to catalog deletion', async () => {
    await request(server)
      .delete('/skills/1')
      .auth('test', { type: 'bearer' })
      .expect(204);
    expect(service.remove).toHaveBeenCalledWith(1, 7);
  });

  it.each(['nope', '0', '-1', '1.5', '9007199254740992'])(
    'rejects invalid skill IDs across routes: %s',
    async (id) => {
      for (const method of ['get', 'patch', 'delete'] as const) {
        await request(server)
          [method](`/skills/${id}`)
          .auth('test', { type: 'bearer' })
          .send(method === 'patch' ? { name: 'TS' } : undefined)
          .expect(400);
      }
      expect(service.findOne).not.toHaveBeenCalled();
      expect(service.update).not.toHaveBeenCalled();
      expect(service.remove).not.toHaveBeenCalled();
    },
  );

  it.each(['nope', '0', '-1', '1.5', '9007199254740992'])(
    'rejects invalid profile IDs across routes: %s',
    async (id) => {
      await request(server)
        .get(`/skills/profiles/${id}`)
        .auth('test', { type: 'bearer' })
        .expect(400);
      await request(server)
        .delete(`/skills/profiles/${id}`)
        .auth('test', { type: 'bearer' })
        .send({ skillIds: [1] })
        .expect(400);
      expect(service.findByProfile).not.toHaveBeenCalled();
      expect(service.removeFromProfile).not.toHaveBeenCalled();
    },
  );

  it.each(['', '  ', 'a'.repeat(51), 'İ'.repeat(26)])(
    'rejects invalid name query %p',
    async (name) => {
      await request(server)
        .get('/skills')
        .query({ name })
        .auth('test', { type: 'bearer' })
        .expect(400);
      expect(service.findByName).not.toHaveBeenCalled();
    },
  );

  it('normalizes name queries and rejects repeated name parameters', async () => {
    await request(server)
      .get('/skills')
      .query({ name: ' Machine  Learning ' })
      .auth('test', { type: 'bearer' })
      .expect(200);
    expect(service.findAll).toHaveBeenCalledWith({ name: 'Machine Learning' });
    await request(server)
      .get('/skills?name=one&name=two')
      .auth('test', { type: 'bearer' })
      .expect(400);
  });
});
