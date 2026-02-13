import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTokensService, TokenScope } from './api-tokens.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('v1/tokens')
export class ApiTokensController {
  constructor(private apiTokensService: ApiTokensService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @CurrentUser('userId') userId: string,
    @Body() body: { name: string; scopes: TokenScope[]; expiresAt?: string | null }
  ) {
    const { token, tokenMeta } = await this.apiTokensService.createToken({
      userId,
      name: body?.name || 'token',
      scopes: body?.scopes || [],
      expiresAt: body?.expiresAt || null,
    });

    return {
      success: true,
      data: {
        token,
        tokenMeta,
      },
    };
  }

  @Get()
  @UseGuards(AuthGuard)
  async list(@CurrentUser('userId') userId: string) {
    const data = await this.apiTokensService.listTokens(userId);
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async revoke(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    const data = await this.apiTokensService.revokeToken(userId, id);
    return { success: true, data };
  }
}
