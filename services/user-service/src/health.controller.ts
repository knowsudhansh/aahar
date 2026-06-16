import { HealthCheckService, Public } from '@aahar/auth';
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthCheck: HealthCheckService) {}

  @Public()
  @Get()
  @ApiOkResponse({ description: 'User service is healthy.' })
  async check() {
    const health = await this.healthCheck.getHealth('user-service');

    return {
      data: health,
      message: 'Success',
      success: health.status === 'ok'
    };
  }
}
