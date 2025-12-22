import {
  Body,
  Controller,
  Post,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { LoginUseCase } from '../use-cases/login.use-case';
import { RefreshTokenUseCase } from '../use-cases/refresh-token.use-case';
import { RegisterUseCase } from '../use-cases/register.use-case';
import { UserResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { INVALID_REFRESH_TOKEN_MESSAGE } from '../auth.errors';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { CookieExtractor } from '../strategies/cookie-extractor';
import { AuthCookieConfig } from '../config/cookie.config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly cookieConfig: AuthCookieConfig;

  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly configService: ConfigService,
  ) {
    this.cookieConfig = new AuthCookieConfig(
      this.configService.get('NODE_ENV'),
    );
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: UserResponseDto,
  })
  @ApiConflictResponse({ description: 'Email already exists' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.registerUseCase.execute(registerDto);

    this.setTokenCookies(res, accessToken, refreshToken);

    return { user };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({
    description: 'Login successful',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.loginUseCase.execute(loginDto);

    this.setTokenCookies(res, accessToken, refreshToken);

    return { user };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully',
  })
  @ApiUnauthorizedResponse({ description: INVALID_REFRESH_TOKEN_MESSAGE })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = CookieExtractor.extractRefreshToken(req);

    if (!refreshToken) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE);
    }

    const tokens = await this.refreshTokenUseCase.execute({ refreshToken });

    this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

    return { message: 'Tokens refreshed successfully' };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and clear authentication cookies' })
  @ApiOkResponse({
    description: 'Logged out successfully',
  })
  logout(@Res({ passthrough: true }) res: Response) {
    const accessTokenConfig = this.cookieConfig.getAccessTokenConfig();
    const refreshTokenConfig = this.cookieConfig.getRefreshTokenConfig();

    res.clearCookie(accessTokenConfig.name, accessTokenConfig.options);
    res.clearCookie(refreshTokenConfig.name, refreshTokenConfig.options);

    return { message: 'Logged out successfully' };
  }

  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const accessTokenConfig = this.cookieConfig.getAccessTokenConfig();
    const refreshTokenConfig = this.cookieConfig.getRefreshTokenConfig();

    res.cookie(accessTokenConfig.name, accessToken, accessTokenConfig.options);
    res.cookie(
      refreshTokenConfig.name,
      refreshToken,
      refreshTokenConfig.options,
    );
  }
}
