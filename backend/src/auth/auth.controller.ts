import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { ApiResponse, User } from '../shared/types';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/auth/login
   * Login with Solana wallet signature
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.authService.login(loginDto);
  }

  /**
   * GET /api/auth/me
   * Get current authenticated user
   * Requires: Authorization header with JWT token
   */
  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(@CurrentUser('userId') userId: string): Promise<ApiResponse<User>> {
    return this.authService.getCurrentUser(userId);
  }

  /**
   * GET /api/auth/health
   * Health check endpoint
   */
  @Get('health')
  health() {
    return {
      success: true,
      message: 'Auth service is running',
      timestamp: new Date().toISOString(),
    };
  }
}
