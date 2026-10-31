import { Test } from '@nestjs/testing';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  INestApplication,
  NotFoundException,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { HackathonsController } from './hackathons.controller';
import { HackathonsService } from './hackathons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Server } from 'node:http';

describe('Hackathons HTTP', () => {
  let app: INestApplication;

  const getTestServer = (): Server => app.getHttpServer() as Server;
  let authenticated = false;
  const mockHackathonsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findMine: jest.fn(),
    findDetails: jest.fn(),
    update: jest.fn(),
  };
  const mockJwtGuard: CanActivate = {
    canActivate(context: ExecutionContext): boolean {
      if (!authenticated) {
        throw new UnauthorizedException();
      }
      const req = context.switchToHttp().getRequest<{
        user?: { userId: number };
      }>();
      req.user = { userId: 1 };
      return true;
    },
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [HackathonsController],
      providers: [
        {
          provide: HackathonsService,
          useValue: mockHackathonsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );

    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    authenticated = false;

    mockHackathonsService.create.mockResolvedValue({ id: 1 });
    mockHackathonsService.update.mockResolvedValue({ id: 1 });
    mockHackathonsService.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 12,
    });
    mockHackathonsService.findMine.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 12,
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  const dto = {
    title: 'AI Challenge',
    description: 'Build an AI application',
    organizationName: 'HackSpace',
    startAt: '2026-11-01T09:00:00Z',
    endAt: '2026-11-03T18:00:00Z',
  };

  it('rejects unauthenticated GET requests with 401', async () => {
    await request(getTestServer()).get('/hackathons').expect(401);
    expect(mockHackathonsService.findAll).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated POST requests with 401', async () => {
    await request(getTestServer()).post('/hackathons').send(dto).expect(401);
    expect(mockHackathonsService.create).not.toHaveBeenCalled();
  });

  it('allows an authenticated user to create hackathons', async () => {
    authenticated = true;
    await request(getTestServer()).post('/hackathons').send(dto).expect(201);
    expect(mockHackathonsService.create).toHaveBeenCalledWith(dto, 1);
  });

  it('rejects a non-organizer updating a hackathon with 403', async () => {
    authenticated = true;
    mockHackathonsService.update.mockRejectedValue(
      new ForbiddenException('Forbidden'),
    );
    await request(getTestServer())
      .patch('/hackathons/1')
      .send({ title: 'Updated Title' })
      .expect(403);
    expect(mockHackathonsService.update).toHaveBeenCalledWith(
      1,
      {
        title: 'Updated Title',
      },
      1,
    );
  });

  it('allows an authenticated organizer to update a hackathon', async () => {
    authenticated = true;
    await request(getTestServer())
      .patch('/hackathons/1')
      .send({ title: 'Updated Title' })
      .expect(200);
    expect(mockHackathonsService.update).toHaveBeenCalledWith(
      1,
      {
        title: 'Updated Title',
      },
      1,
    );
  });

  it('rejects unauthenticated PATCH requests with 401', async () => {
    await request(getTestServer())
      .patch('/hackathons/1')
      .send({ title: 'Updated Title' })
      .expect(401);

    expect(mockHackathonsService.update).not.toHaveBeenCalled();
  });

  it('ignores a client-provided userId when creating a hackathon', async () => {
    authenticated = true;

    await request(getTestServer())
      .post('/hackathons')
      .send({ ...dto, userId: 999 })
      .expect(201);

    expect(mockHackathonsService.create).toHaveBeenCalledWith(dto, 1);
  });

  it('rejects unauthenticated GET /hackathons/mine with 401', async () => {
    await request(getTestServer()).get('/hackathons/mine').expect(401);

    expect(mockHackathonsService.findMine).not.toHaveBeenCalled();
  });

  it('returns hackathons organized by the authenticated user', async () => {
    authenticated = true;

    const response = {
      data: [{ id: 10, title: 'AI Challenge' }],
      total: 1,
      page: 1,
      limit: 12,
    };

    mockHackathonsService.findMine.mockResolvedValue(response);

    await request(getTestServer())
      .get('/hackathons/mine')
      .expect(200)
      .expect(response);

    expect(mockHackathonsService.findMine).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        page: undefined,
        limit: undefined,
      }),
    );
  });

  it('forwards pagination parameters for GET /hackathons/mine', async () => {
    authenticated = true;

    await request(getTestServer())
      .get('/hackathons/mine?page=2&limit=5')
      .expect(200);

    expect(mockHackathonsService.findMine).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        page: 2,
        limit: 5,
      }),
    );
  });

  it('rejects invalid pagination for GET /hackathons/mine', async () => {
    authenticated = true;

    await request(getTestServer())
      .get('/hackathons/mine?page=0&limit=5')
      .expect(400);

    expect(mockHackathonsService.findMine).not.toHaveBeenCalled();
  });

  it.each(['abc', '3.14'])(
    'rejects GET /hackathons/%s with 400',
    async (id) => {
      authenticated = true;

      await request(getTestServer()).get(`/hackathons/${id}`).expect(400);

      expect(mockHackathonsService.findDetails).not.toHaveBeenCalled();
    },
  );

  it.each(['abc', '3.14'])(
    'rejects PATCH /hackathons/%s with 400',
    async (id) => {
      authenticated = true;

      await request(getTestServer())
        .patch(`/hackathons/${id}`)
        .send({ title: 'Updated Title' })
        .expect(400);

      expect(mockHackathonsService.update).not.toHaveBeenCalled();
    },
  );

  it('returns a hackathon by ID', async () => {
    authenticated = true;

    const hackathon = {
      id: 7,
      title: 'AI Challenge',
      canEdit: true,
    };

    mockHackathonsService.findDetails.mockResolvedValue(hackathon);

    await request(getTestServer())
      .get('/hackathons/7')
      .expect(200)
      .expect(hackathon);

    expect(mockHackathonsService.findDetails).toHaveBeenCalledWith(7, 1);
  });

  it('returns 404 when the hackathon does not exist', async () => {
    authenticated = true;

    mockHackathonsService.findDetails.mockRejectedValue(
      new NotFoundException('Hackathon not found'),
    );

    await request(getTestServer()).get('/hackathons/999999').expect(404);

    expect(mockHackathonsService.findDetails).toHaveBeenCalledWith(999999, 1);
  });

  it('rejects unauthenticated requests to hackathon details', async () => {
    await request(getTestServer()).get('/hackathons/7').expect(401);

    expect(mockHackathonsService.findDetails).not.toHaveBeenCalled();
  });
});
