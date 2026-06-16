import { CurrentUser, Permissions } from '@aahar/auth';
import type { JwtRequestUser } from '@aahar/auth';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags
} from '@nestjs/swagger';
import { getActorId, getIpAddress, type RequestContextLike } from '../common/request-context';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiBearerAuth('access-token')
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Permissions('USER_VIEW')
  @ApiOperation({ summary: 'Get users' })
  @ApiOkResponse({ description: 'Users returned successfully.' })
  async list(@Query() query: ListUsersQueryDto) {
    return {
      data: await this.users.list(query),
      message: 'Success',
      success: true
    };
  }

  @Get(':id')
  @Permissions('USER_VIEW')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'User returned successfully.' })
  async getById(@Param('id') id: string) {
    return {
      data: await this.users.getById(id),
      message: 'Success',
      success: true
    };
  }

  @Post()
  @Permissions('USER_CREATE')
  @ApiBody({ type: CreateUserDto })
  @ApiOperation({ summary: 'Create user' })
  @ApiOkResponse({ description: 'User created successfully.' })
  async create(
    @Body() body: CreateUserDto,
    @CurrentUser() user: JwtRequestUser | undefined,
    @Req() request: RequestContextLike,
  ) {
    return {
      data: await this.users.create(body, {
        actorId: getActorId(user),
        ipAddress: getIpAddress(request)
      }),
      message: 'Success',
      success: true
    };
  }

  @Put(':id')
  @Permissions('USER_UPDATE')
  @ApiBody({ type: UpdateUserDto })
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'User updated successfully.' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() user: JwtRequestUser | undefined,
    @Req() request: RequestContextLike,
  ) {
    return {
      data: await this.users.update(id, body, {
        actorId: getActorId(user),
        ipAddress: getIpAddress(request)
      }),
      message: 'Success',
      success: true
    };
  }

  @Delete(':id')
  @Permissions('USER_DELETE')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'User deleted successfully.' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtRequestUser | undefined,
    @Req() request: RequestContextLike,
  ) {
    return {
      data: await this.users.remove(id, {
        actorId: getActorId(user),
        ipAddress: getIpAddress(request)
      }),
      message: 'Success',
      success: true
    };
  }

  @Post(':id/roles')
  @Permissions('USER_UPDATE')
  @ApiBody({ type: AssignRoleDto })
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Role assigned successfully.' })
  async assignRole(
    @Param('id') id: string,
    @Body() body: AssignRoleDto,
    @CurrentUser() user: JwtRequestUser | undefined,
    @Req() request: RequestContextLike,
  ) {
    return {
      data: await this.users.assignRole(id, body, {
        actorId: getActorId(user),
        ipAddress: getIpAddress(request)
      }),
      message: 'Success',
      success: true
    };
  }
}
