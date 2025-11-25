import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /**
   * GET /api
   * Root health check endpoint
   */
  @Get()
  healthCheck() {
    return {
      success: true,
      message: 'Gimme Idea API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
