import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { ApiResponse, User } from '../shared/types';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * GET /api/users/:username
   * Get user by username (public)
   */
  @Get(':username')
  async findByUsername(@Param('username') username: string): Promise<ApiResponse<User>> {
    return this.usersService.findByUsername(username);
  }

  /**
   * GET /api/users/:username/projects
   * Get user's projects
   */
  @Get(':username/projects')
  async getUserProjects(@Param('username') username: string): Promise<ApiResponse<any[]>> {
    return this.usersService.getUserProjects(username);
  }

  /**
   * PATCH /api/users/profile
   * Update current user's profile (requires authentication)
   */
  @Patch('profile')
  @UseGuards(AuthGuard)
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateDto: UpdateProfileDto
  ): Promise<ApiResponse<User>> {
    return this.usersService.updateProfile(userId, updateDto);
  }
}
