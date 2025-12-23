import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import cookieParser from 'cookie-parser';

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;
  let mongoConnection: Connection;

  const testUser = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'SecurePassword123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same middleware and pipes as main app
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    mongoConnection = moduleFixture.get<Connection>(getConnectionToken());

    await app.init();
  });

  afterAll(async () => {
    await mongoConnection.close();
    await app.close();
  });

  afterEach(async () => {
    // Clean up users collection after each test
    const collections = mongoConnection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        email: testUser.email,
      });
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).not.toHaveProperty('password');

      // Verify tokens are set as HTTP-only cookies
      const cookies = response.headers['set-cookie'] as string[];
      expect(cookies).toBeDefined();
      expect(cookies.length).toBeGreaterThanOrEqual(2);

      const accessTokenCookie = cookies.find((cookie) =>
        cookie.startsWith('accessToken='),
      );
      const refreshTokenCookie = cookies.find((cookie) =>
        cookie.startsWith('refreshToken='),
      );

      expect(accessTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toBeDefined();
      expect(accessTokenCookie).toContain('HttpOnly');
      expect(refreshTokenCookie).toContain('HttpOnly');
      expect(accessTokenCookie).toContain('SameSite=Strict');
      expect(refreshTokenCookie).toContain('SameSite=Strict');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password,
          // Missing firstName and lastName
        })
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message.length).toBeGreaterThan(0);
    });

    it('should fail with invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should fail with weak password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          password: '123', // Too short
        })
        .expect(400);
    });

    it('should fail when email already exists', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      // Duplicate registration
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body.message).toContain('already in use');
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser);
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);

      // Verify tokens are set as cookies
      const cookies = response.headers['set-cookie'] as string[];
      expect(cookies).toBeDefined();

      const accessTokenCookie = cookies.find((cookie) =>
        cookie.startsWith('accessToken='),
      );
      const refreshTokenCookie = cookies.find((cookie) =>
        cookie.startsWith('refreshToken='),
      );

      expect(accessTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toBeDefined();
    });

    it('should fail with incorrect email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'wrong@example.com',
          password: testUser.password,
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail with missing credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          // Missing password
        })
        .expect(400);
    });
  });

  describe('/auth/refresh (POST)', () => {
    let refreshTokenCookie: string;

    beforeEach(async () => {
      // Register and get refresh token
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser);

      const cookies = response.headers['set-cookie'] as string[];
      refreshTokenCookie = cookies.find((cookie) =>
        cookie.startsWith('refreshToken='),
      )!;
    });

    it('should refresh tokens successfully with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', refreshTokenCookie)
        .expect(201);

      expect(response.body.message).toBe('Tokens refreshed successfully');

      // Verify new tokens are set
      const cookies = response.headers['set-cookie'] as string[];
      expect(cookies).toBeDefined();

      const newAccessTokenCookie = cookies.find((cookie) =>
        cookie.startsWith('accessToken='),
      );
      const newRefreshTokenCookie = cookies.find((cookie) =>
        cookie.startsWith('refreshToken='),
      );

      expect(newAccessTokenCookie).toBeDefined();
      expect(newRefreshTokenCookie).toBeDefined();
    });

    it('should fail without refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .expect(401);

      expect(response.body.message).toContain('Invalid refresh token');
    });

    it('should fail with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', 'refreshToken=invalid.token.here')
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    let accessTokenCookie: string;
    let refreshTokenCookie: string;

    beforeEach(async () => {
      // Register and get tokens
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser);

      const cookies = response.headers['set-cookie'] as string[];
      accessTokenCookie = cookies.find((cookie) =>
        cookie.startsWith('accessToken='),
      )!;
      refreshTokenCookie = cookies.find((cookie) =>
        cookie.startsWith('refreshToken='),
      )!;
    });

    it('should logout successfully and clear cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', [accessTokenCookie, refreshTokenCookie])
        .expect(201);

      expect(response.body.message).toBe('Logged out successfully');

      // Verify cookies are cleared
      const cookies = response.headers['set-cookie'] as string[];
      expect(cookies).toBeDefined();

      const clearedAccessToken = cookies.find((cookie) =>
        cookie.startsWith('accessToken='),
      );
      const clearedRefreshToken = cookies.find((cookie) =>
        cookie.startsWith('refreshToken='),
      );

      // Cleared cookies should have empty value or Max-Age=0
      expect(clearedAccessToken).toBeDefined();
      expect(clearedRefreshToken).toBeDefined();
    });

    it('should logout even without cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(201);

      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('Protected Routes Integration', () => {
    let accessTokenCookie: string;

    beforeEach(async () => {
      // Register and get access token
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser);

      const cookies = response.headers['set-cookie'] as string[];
      accessTokenCookie = cookies.find((cookie) =>
        cookie.startsWith('accessToken='),
      )!;
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Cookie', accessTokenCookie)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fail to access protected route without token', async () => {
      await request(app.getHttpServer()).get('/orders').expect(401);
    });

    it('should fail to access protected route with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/orders')
        .set('Cookie', 'accessToken=invalid.token.here')
        .expect(401);
    });
  });
});
