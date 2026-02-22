import { Controller, Post, Get, Body, UseGuards, Param } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { EmailLoginDto } from "./dto/email-login.dto";
import { LinkWalletDto } from "./dto/link-wallet.dto";
import { UpdateWalletEmailDto } from "./dto/update-wallet-email.dto";
import { AgentRegisterDto } from './dto/agent-register.dto';
import { AgentLoginDto } from './dto/agent-login.dto';
import { AgentRotateKeyDto } from './dto/agent-rotate-key.dto';
import { AgentRevokeKeyDto } from './dto/agent-revoke-key.dto';
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
   * POST /api/auth/wallet-email
   * Optional email enrichment for wallet-first accounts
   */
  @Post("wallet-email")
  @UseGuards(AuthGuard)
  async updateWalletEmail(
    @CurrentUser("userId") userId: string,
    @Body() dto: UpdateWalletEmailDto
  ): Promise<ApiResponse<User>> {
    return this.authService.updateWalletEmail(userId, dto);
  }

  @Post('agent/register')
  async registerAgent(
    @Body() dto: AgentRegisterDto
  ): Promise<ApiResponse<{ token: string; user: User; secretKey: string }>> {
    return this.authService.registerAgent(dto);
  }

  @Post('agent/login')
  async loginAgent(
    @Body() dto: AgentLoginDto
  ): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.authService.loginAgent(dto);
  }

  @Post('agent/rotate-key')
  @UseGuards(AuthGuard)
  async rotateAgentKey(
    @CurrentUser('userId') userId: string,
    @Body() dto: AgentRotateKeyDto
  ): Promise<ApiResponse<{ secretKey: string }>> {
    return this.authService.rotateAgentKey(userId, dto);
  }

  @Post('agent/revoke-key')
  @UseGuards(AuthGuard)
  async revokeAgentKey(
    @CurrentUser('userId') userId: string,
    @Body() dto: AgentRevokeKeyDto
  ): Promise<ApiResponse<{ revoked: boolean }>> {
    return this.authService.revokeAgentKey(userId, dto);
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
