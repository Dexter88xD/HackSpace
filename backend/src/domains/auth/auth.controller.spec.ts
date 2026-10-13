import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            getOAuthAuthorizationUrl: jest.fn(),
            authenticateWithOAuth: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('redirects cancelled OAuth authentication to the frontend login page', async () => {
    const response = {
      clearCookie: jest.fn(),
      redirect: jest.fn(),
    };

    await controller.oauthCallback(
      'google',
      undefined,
      undefined,
      'access_denied',
      { cookies: {} } as never,
      response as never,
    );

    expect(response.redirect).toHaveBeenCalledWith(
      'http://localhost:5173/login?oauthError=OAuth%20authentication%20was%20cancelled',
    );
    expect(response.clearCookie).toHaveBeenCalledWith('oauthState');
  });

  it('rejects an OAuth callback with a mismatched state', async () => {
    const response = {
      clearCookie: jest.fn(),
      redirect: jest.fn(),
    };

    await controller.oauthCallback(
      'google',
      'provider-code',
      'provider-state',
      undefined,
      { cookies: { oauthState: 'different-state' } } as never,
      response as never,
    );

    expect(response.clearCookie).toHaveBeenCalledWith('oauthState');
    expect(response.redirect).toHaveBeenCalledWith(
      'http://localhost:5173/login?oauthError=Invalid%20OAuth%20request',
    );
  });
});
