import { HealthCheckService, Public } from '@aahar/auth';
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthCheck: HealthCheckService) {}

  @Public()
  @Get()
  @ApiOkResponse({ description: 'Organization service is healthy.' })
  async check() {
    const health = await this.healthCheck.getHealth('organization-service');

    return {
      data: health,
      message: 'Success',
      success: health.status === 'ok'
    };
  }
}
