import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

describe('Teams HTTP', () => {
  let app: INestApplication;
  let authenticated = false;

  const getTestServer = (): Server => app.getHttpServer() as Server;
  const mockTeamsService = {
    create: jest.fn(),
    findOne: jest.fn(),
    findMine: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    requestToJoin: jest.fn(),
    findRequests: jest.fn(),
    acceptRequest: jest.fn(),
    rejectRequest: jest.fn(),
    removeMember: jest.fn(),
  };
  const mockJwtGuard: CanActivate = {
    canActivate(context: ExecutionContext): boolean {
      if (!authenticated) {
        throw new UnauthorizedException();
      }
      const req = context.switchToHttp().getRequest<{
        user?: { userId: number };
      }>();
      req.user = { userId: 5 };
      return true;
    },
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [{ provide: TeamsService, useValue: mockTeamsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    authenticated = false;
    mockTeamsService.create.mockResolvedValue({ id: 3 });
    mockTeamsService.findOne.mockResolvedValue({ id: 3 });
    mockTeamsService.findMine.mockResolvedValue({ team: null });
  });

  afterAll(async () => {
    await app?.close();
  });

  it.each([
    ['post', '/hackathons/1/teams'],
    ['get', '/hackathons/1/teams/me'],
    ['get', '/teams/3'],
    ['patch', '/teams/3'],
    ['delete', '/teams/3'],
    ['post', '/teams/3/join-requests'],
    ['get', '/teams/3/join-requests'],
    ['post', '/join-requests/10/accept'],
    ['post', '/join-requests/10/reject'],
    ['delete', '/join-requests/10'],
    ['delete', '/teams/3/members/6'],
  ] as const)('returns 401 for %s %s without a login', async (method, path) => {
    await request(getTestServer())[method](path).expect(401);
  });

  it('creates a team for the logged-in user', async () => {
    authenticated = true;

    await request(getTestServer())
      .post('/hackathons/1/teams')
      .send({ name: 'Team Rocket' })
      .expect(201)
      .expect({ id: 3 });

    expect(mockTeamsService.create).toHaveBeenCalledWith(
      1,
      { name: 'Team Rocket' },
      5,
    );
  });

  it.each([
    [{}],
    [{ name: '   ' }],
    [{ name: 'a'.repeat(51) }],
    [{ name: 'Team', description: 'a'.repeat(501) }],
  ])('returns 400 for an invalid body %j', async (body) => {
    authenticated = true;

    await request(getTestServer())
      .post('/hackathons/1/teams')
      .send(body)
      .expect(400);

    expect(mockTeamsService.create).not.toHaveBeenCalled();
  });

  it('returns 400 for a non-numeric hackathon id', async () => {
    authenticated = true;

    await request(getTestServer()).get('/hackathons/abc/teams/me').expect(400);
  });

  it("returns the user's team for a hackathon", async () => {
    authenticated = true;

    await request(getTestServer())
      .get('/hackathons/1/teams/me')
      .expect(200)
      .expect({ team: null });

    expect(mockTeamsService.findMine).toHaveBeenCalledWith(1, 5);
  });

  it('returns a team by id', async () => {
    authenticated = true;

    await request(getTestServer()).get('/teams/3').expect(200);

    expect(mockTeamsService.findOne).toHaveBeenCalledWith(3);
  });

  it('sends a join request for the logged-in user', async () => {
    authenticated = true;
    mockTeamsService.requestToJoin.mockResolvedValue({ id: 10 });

    await request(getTestServer()).post('/teams/3/join-requests').expect(201);

    expect(mockTeamsService.requestToJoin).toHaveBeenCalledWith(3, 5);
  });

  it('passes the request id and user to accept', async () => {
    authenticated = true;

    await request(getTestServer()).post('/join-requests/10/accept').expect(201);

    expect(mockTeamsService.acceptRequest).toHaveBeenCalledWith(10, 5);
  });

  it('passes the member and the leader to removeMember', async () => {
    authenticated = true;

    await request(getTestServer()).delete('/teams/3/members/6').expect(200);

    expect(mockTeamsService.removeMember).toHaveBeenCalledWith(3, 6, 5);
  });

  it('updates a team with a valid body', async () => {
    authenticated = true;

    await request(getTestServer())
      .patch('/teams/3')
      .send({ description: 'New plan' })
      .expect(200);

    expect(mockTeamsService.update).toHaveBeenCalledWith(
      3,
      { description: 'New plan' },
      5,
    );
  });

  it('returns 400 for an invalid team update', async () => {
    authenticated = true;

    await request(getTestServer())
      .patch('/teams/3')
      .send({ name: '   ' })
      .expect(400);

    expect(mockTeamsService.update).not.toHaveBeenCalled();
  });
});
