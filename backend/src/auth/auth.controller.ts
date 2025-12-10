import { Controller, Post, Get, Body, UseGuards, Param } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { EmailLoginDto } from "./dto/email-login.dto";
import { LinkWalletDto } from "./dto/link-wallet.dto";
import { AuthGuard } from "../common/guards/auth.guard";
import { CurrentUser } from "../common/decorators/user.decorator";
import { ApiResponse, User } from "../shared/types";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/auth/login
   * Login with Solana wallet signature
   */
  @Post("login")
  async login(
    @Body() loginDto: LoginDto
  ): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.authService.login(loginDto);
  }

  /**
   * POST /api/auth/login-email
   * Login with Google OAuth (email)
   */
  @Post("login-email")
  async loginWithEmail(
    @Body() emailLoginDto: EmailLoginDto
  ): Promise<ApiResponse<{ token: string; user: User; isNewUser: boolean }>> {
    return this.authService.loginWithEmail(emailLoginDto);
  }

  /**
   * POST /api/auth/link-wallet
   * Link wallet to current user account
   * Requires: Authorization header with JWT token
   */
  @Post("link-wallet")
  @UseGuards(AuthGuard)
  async linkWallet(
    @CurrentUser("userId") userId: string,
    @Body() linkWalletDto: LinkWalletDto
  ): Promise<ApiResponse<{ user: User; merged: boolean }>> {
    return this.authService.linkWallet(userId, linkWalletDto);
  }

  /**
   * GET /api/auth/me
   * Get current authenticated user
   * Requires: Authorization header with JWT token
   */
  @Get("me")
  @UseGuards(AuthGuard)
  async getCurrentUser(
    @CurrentUser("userId") userId: string
  ): Promise<ApiResponse<User>> {
    return this.authService.getCurrentUser(userId);
  }

  /**
   * GET /api/auth/check-wallet/:walletAddress
   * Check if a wallet is already linked to an account
   */
  @Get("check-wallet/:walletAddress")
  async checkWalletExists(
    @Param("walletAddress") walletAddress: string
  ): Promise<ApiResponse<{ exists: boolean; userId?: string }>> {
    return this.authService.checkWalletExists(walletAddress);
  }

  /**
   * GET /api/auth/health
   * Health check endpoint
   */
  @Get("health")
  health() {
    return {
      success: true,
      message: "Auth service is running",
      timestamp: new Date().toISOString(),
    };
  }
}
