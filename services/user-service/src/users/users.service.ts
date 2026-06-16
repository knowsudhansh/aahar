import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, UserStatus } from '@prisma/client';
import { AuditLogService } from '../common/audit/audit-log.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const userInclude = {
  roles: {
    include: {
      role: true
    },
    where: {
      deletedAt: null
    }
  }
} satisfies Prisma.UserInclude;

type UserWithRoles = Prisma.UserGetPayload<{ include: typeof userInclude }>;

interface ActorContext {
  actorId?: string;
  ipAddress?: string;
}

function toUserResponse(user: UserWithRoles) {
  return {
    createdAt: user.createdAt,
    deletedAt: user.deletedAt,
    email: user.email,
    employeeCode: user.employeeCode,
    id: user.id,
    mobile: user.mobile,
    name: user.name,
    roles: user.roles.map((userRole) => ({
      description: userRole.role.description,
      id: userRole.role.id,
      name: userRole.role.name,
      status: userRole.role.status
    })),
    status: user.status,
    updatedAt: user.updatedAt
  };
}

function toUserSnapshot(user: UserWithRoles) {
  return toUserResponse(user);
}

@Injectable()
export class UsersService {
  constructor(
    private readonly auditLog: AuditLogService,
    private readonly prisma: PrismaService,
  ) {}

  async list(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.roleId
        ? {
            roles: {
              some: {
                deletedAt: null,
                roleId: query.roleId
              }
            }
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { employeeCode: { contains: query.search, mode: 'insensitive' } },
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { mobile: { contains: query.search, mode: 'insensitive' } }
            ]
          }
        : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        include: userInclude,
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit,
        where
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      items: items.map(toUserResponse),
      meta: {
        limit,
        page,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id: string) {
    const user = await this.findActiveUser(id);

    return toUserResponse(user);
  }

  async create(dto: CreateUserDto, context: ActorContext) {
    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const role = await this.findActiveRole(dto.roleId, tx);
        const user = await tx.user.create({
          data: {
            createdBy: context.actorId,
            email: dto.email,
            employeeCode: dto.employeeCode,
            mobile: dto.mobile,
            name: dto.name,
            status: dto.status ?? UserStatus.ACTIVE,
            updatedBy: context.actorId
          },
          include: userInclude
        });

        await this.assignUserRole(user.id, role.id, context, tx);

        const userWithRole = await tx.user.findFirstOrThrow({
          include: userInclude,
          where: {
            deletedAt: null,
            id: user.id
          }
        });

        await this.auditLog.record(
          {
            action: 'USER_CREATE',
            actorId: context.actorId,
            entityId: user.id,
            entityName: 'users',
            ipAddress: context.ipAddress,
            newValue: {
              ...toUserSnapshot(userWithRole),
              locationId: dto.locationId
            }
          },
          tx,
        );

        return userWithRole;
      });

      return toUserResponse(created);
    } catch (error) {
      this.handlePrismaError(error, 'User');
    }
  }

  async update(id: string, dto: UpdateUserDto, context: ActorContext) {
    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const existing = await this.findActiveUser(id, tx);
        const data: Prisma.UserUpdateInput = {};

        if (dto.email !== undefined) {
          data.email = dto.email;
        }

        if (dto.mobile !== undefined) {
          data.mobile = dto.mobile;
        }

        if (dto.name !== undefined) {
          data.name = dto.name;
        }

        if (dto.status !== undefined) {
          data.status = dto.status;
        }

        if (Object.keys(data).length > 0) {
          data.updatedBy = context.actorId;
        }

        const user = Object.keys(data).length
          ? await tx.user.update({
              data,
              include: userInclude,
              where: {
                id
              }
            })
          : existing;

        if (dto.roleId !== undefined) {
          const role = await this.findActiveRole(dto.roleId, tx);
          await this.replaceUserRole(id, role.id, context, tx);
        }

        const userWithRoles = await tx.user.findFirstOrThrow({
          include: userInclude,
          where: {
            deletedAt: null,
            id: user.id
          }
        });

        await this.auditLog.record(
          {
            action: 'USER_UPDATE',
            actorId: context.actorId,
            entityId: id,
            entityName: 'users',
            ipAddress: context.ipAddress,
            newValue: {
              ...toUserSnapshot(userWithRoles),
              locationId: dto.locationId
            },
            oldValue: toUserSnapshot(existing)
          },
          tx,
        );

        return userWithRoles;
      });

      return toUserResponse(updated);
    } catch (error) {
      this.handlePrismaError(error, 'User');
    }
  }

  async remove(id: string, context: ActorContext) {
    const existing = await this.findActiveUser(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        data: {
          deletedAt: new Date(),
          status: UserStatus.DISABLED,
          updatedBy: context.actorId
        },
        where: {
          id
        }
      });
      await tx.userRole.updateMany({
        data: {
          deletedAt: new Date(),
          updatedBy: context.actorId
        },
        where: {
          deletedAt: null,
          userId: id
        }
      });
      await this.auditLog.record(
        {
          action: 'USER_DELETE',
          actorId: context.actorId,
          entityId: id,
          entityName: 'users',
          ipAddress: context.ipAddress,
          oldValue: toUserSnapshot(existing)
        },
        tx,
      );
    });

    return {
      id
    };
  }

  async assignRole(id: string, dto: AssignRoleDto, context: ActorContext) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const existing = await this.findActiveUser(id, tx);
      const role = await this.findActiveRole(dto.roleId, tx);

      await this.replaceUserRole(id, role.id, context, tx);

      const userWithRoles = await tx.user.findFirstOrThrow({
        include: userInclude,
        where: {
          deletedAt: null,
          id
        }
      });

      await this.auditLog.record(
        {
          action: 'USER_ROLE_ASSIGN',
          actorId: context.actorId,
          entityId: id,
          entityName: 'user_roles',
          ipAddress: context.ipAddress,
          newValue: {
            roleId: role.id,
            roleName: role.name
          },
          oldValue: {
            roles: existing.roles.map((userRole) => userRole.role.name)
          }
        },
        tx,
      );

      return userWithRoles;
    });

    return toUserResponse(updated);
  }

  private async assignUserRole(
    userId: string,
    roleId: string,
    context: ActorContext,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.userRole.upsert({
      create: {
        createdBy: context.actorId,
        roleId,
        updatedBy: context.actorId,
        userId
      },
      update: {
        deletedAt: null,
        updatedBy: context.actorId
      },
      where: {
        userId_roleId: {
          roleId,
          userId
        }
      }
    });
  }

  private async replaceUserRole(
    userId: string,
    roleId: string,
    context: ActorContext,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.userRole.updateMany({
      data: {
        deletedAt: new Date(),
        updatedBy: context.actorId
      },
      where: {
        deletedAt: null,
        userId
      }
    });
    await this.assignUserRole(userId, roleId, context, tx);
  }

  private async findActiveUser(
    id: string,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<UserWithRoles> {
    const user = await client.user.findFirst({
      include: userInclude,
      where: {
        deletedAt: null,
        id
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async findActiveRole(
    id: string,
    client: Prisma.TransactionClient | PrismaService,
  ): Promise<Role> {
    const role = await client.role.findFirst({
      where: {
        deletedAt: null,
        id
      }
    });

    if (!role) {
      throw new BadRequestException('Role not found');
    }

    return role;
  }

  private handlePrismaError(error: unknown, entityName: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException(`${entityName} already exists`);
    }

    throw error;
  }
}
