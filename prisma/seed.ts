import { PrismaClient, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

const defaultPermissions = [
  ['USER_CREATE', 'USER', 'CREATE', 'Create users'],
  ['USER_VIEW', 'USER', 'VIEW', 'View users'],
  ['USER_UPDATE', 'USER', 'UPDATE', 'Update users'],
  ['USER_DELETE', 'USER', 'DELETE', 'Disable users'],
  ['ROLE_CREATE', 'ROLE', 'CREATE', 'Create roles'],
  ['ROLE_VIEW', 'ROLE', 'VIEW', 'View roles'],
  ['ROLE_UPDATE', 'ROLE', 'UPDATE', 'Update roles'],
  ['ROLE_DELETE', 'ROLE', 'DELETE', 'Disable roles'],
  ['PERMISSION_VIEW', 'PERMISSION', 'VIEW', 'View permissions'],
  ['HOSPITAL_CREATE', 'HOSPITAL', 'CREATE', 'Create hospitals'],
  ['HOSPITAL_VIEW', 'HOSPITAL', 'VIEW', 'View hospitals'],
  ['HOSPITAL_UPDATE', 'HOSPITAL', 'UPDATE', 'Update hospitals'],
  ['HOSPITAL_DELETE', 'HOSPITAL', 'DELETE', 'Disable hospitals'],
  ['LOCATION_CREATE', 'LOCATION', 'CREATE', 'Create locations'],
  ['LOCATION_VIEW', 'LOCATION', 'VIEW', 'View locations'],
  ['LOCATION_UPDATE', 'LOCATION', 'UPDATE', 'Update locations'],
  ['LOCATION_DELETE', 'LOCATION', 'DELETE', 'Disable locations'],
  ['STORE_CREATE', 'STORE', 'CREATE', 'Create stores'],
  ['STORE_VIEW', 'STORE', 'VIEW', 'View stores'],
  ['STORE_UPDATE', 'STORE', 'UPDATE', 'Update stores'],
  ['STORE_DELETE', 'STORE', 'DELETE', 'Disable stores'],
  ['KITCHEN_CREATE', 'KITCHEN', 'CREATE', 'Create kitchens'],
  ['KITCHEN_VIEW', 'KITCHEN', 'VIEW', 'View kitchens'],
  ['KITCHEN_UPDATE', 'KITCHEN', 'UPDATE', 'Update kitchens'],
  ['KITCHEN_DELETE', 'KITCHEN', 'DELETE', 'Disable kitchens'],
  ['RESTAURANT_CREATE', 'RESTAURANT', 'CREATE', 'Create restaurants'],
  ['RESTAURANT_VIEW', 'RESTAURANT', 'VIEW', 'View restaurants'],
  ['RESTAURANT_UPDATE', 'RESTAURANT', 'UPDATE', 'Update restaurants'],
  ['RESTAURANT_DELETE', 'RESTAURANT', 'DELETE', 'Disable restaurants'],
  ['COUNTER_CREATE', 'COUNTER', 'CREATE', 'Create counters'],
  ['COUNTER_VIEW', 'COUNTER', 'VIEW', 'View counters'],
  ['COUNTER_UPDATE', 'COUNTER', 'UPDATE', 'Update counters'],
  ['COUNTER_DELETE', 'COUNTER', 'DELETE', 'Disable counters'],
  ['AUDIT_LOG_VIEW', 'AUDIT_LOG', 'VIEW', 'View audit logs']
] as const;

async function main() {
  await prisma.$transaction(async (tx) => {
    const permissions = await Promise.all(
      defaultPermissions.map(([code, module, action, description]) =>
        tx.permission.upsert({
          create: {
            action,
            code,
            description,
            module
          },
          update: {
            action,
            deletedAt: null,
            description,
            module
          },
          where: {
            code
          }
        }),
      ),
    );

    await tx.permission.updateMany({
      data: {
        deletedAt: new Date()
      },
      where: {
        module: 'COMPANY'
      }
    });

    const superAdmin = await tx.role.upsert({
      create: {
        description: 'Full platform administration',
        name: 'Super Admin'
      },
      update: {
        deletedAt: null,
        description: 'Full platform administration'
      },
      where: {
        name: 'Super Admin'
      }
    });

    const admin = await tx.role.upsert({
      create: {
        description: 'Administration role for day-to-day management',
        name: 'Admin'
      },
      update: {
        deletedAt: null,
        description: 'Administration role for day-to-day management'
      },
      where: {
        name: 'Admin'
      }
    });

    await tx.rolePermission.createMany({
      data: permissions.map((permission) => ({
        permissionId: permission.id,
        roleId: superAdmin.id
      })),
      skipDuplicates: true
    });

    await tx.rolePermission.createMany({
      data: permissions
        .filter((permission) => !permission.code.endsWith('_DELETE'))
        .map((permission) => ({
          permissionId: permission.id,
          roleId: admin.id
        })),
      skipDuplicates: true
    });

    const hospital = await tx.hospital.upsert({
      create: {
        address: 'Saket, New Delhi',
        billPrefix: 'MAX',
        city: 'New Delhi',
        gstApplicable: true,
        hospitalCode: 'MAX',
        hospitalName: 'Max Healthcare',
        isActive: true,
        state: 'Delhi'
      },
      update: {
        address: 'Saket, New Delhi',
        billPrefix: 'MAX',
        city: 'New Delhi',
        deletedAt: null,
        gstApplicable: true,
        hospitalName: 'Max Healthcare',
        isActive: true,
        state: 'Delhi'
      },
      where: {
        hospitalCode: 'MAX'
      }
    });

    const existingLocation = await tx.location.findFirst({
      where: {
        deletedAt: null,
        hospitalId: hospital.id,
        locationName: 'Max Saket'
      }
    });

    if (existingLocation) {
      await tx.location.update({
          data: {
            address: 'Saket campus',
            area: 'Main Block',
            building: 'Hospital Tower',
            floor: 'Ground Floor',
            isActive: true
          },
          where: {
            id: existingLocation.id
          }
        });
    } else {
      await tx.location.create({
          data: {
            address: 'Saket campus',
            area: 'Main Block',
            building: 'Hospital Tower',
            floor: 'Ground Floor',
            hospitalId: hospital.id,
            isActive: true,
            locationName: 'Max Saket'
          }
        });
    }

    const store = await tx.store.upsert({
      create: {
        address: 'Ground floor service corridor',
        hospitalId: hospital.id,
        isActive: true,
        storeCode: 'FNB-STORE-01',
        storeName: 'Main F&B Store',
        storeType: 'F&B'
      },
      update: {
        address: 'Ground floor service corridor',
        deletedAt: null,
        isActive: true,
        storeName: 'Main F&B Store',
        storeType: 'F&B'
      },
      where: {
        hospitalId_storeCode: {
          hospitalId: hospital.id,
          storeCode: 'FNB-STORE-01'
        }
      }
    });

    const kitchen = await tx.kitchen.upsert({
      create: {
        closingTime: '22:00',
        hospitalId: hospital.id,
        isActive: true,
        kitchenCode: 'MAIN-KITCHEN',
        kitchenName: 'Main Kitchen',
        openingTime: '06:00'
      },
      update: {
        closingTime: '22:00',
        deletedAt: null,
        isActive: true,
        kitchenName: 'Main Kitchen',
        openingTime: '06:00'
      },
      where: {
        hospitalId_kitchenCode: {
          hospitalId: hospital.id,
          kitchenCode: 'MAIN-KITCHEN'
        }
      }
    });

    const restaurant = await tx.restaurant.upsert({
      create: {
        address: 'Ground floor cafeteria',
        b2cQrEnabled: true,
        closingTime: '22:00',
        hospitalId: hospital.id,
        inRoomDiningEnabled: true,
        isActive: true,
        kitchenId: kitchen.id,
        onlineOrderingEnabled: true,
        openingTime: '07:00',
        restaurantCode: 'CAFETERIA',
        restaurantName: 'Main Cafeteria',
        storeId: store.id
      },
      update: {
        address: 'Ground floor cafeteria',
        b2cQrEnabled: true,
        closingTime: '22:00',
        deletedAt: null,
        inRoomDiningEnabled: true,
        isActive: true,
        kitchenId: kitchen.id,
        onlineOrderingEnabled: true,
        openingTime: '07:00',
        restaurantName: 'Main Cafeteria',
        storeId: store.id
      },
      where: {
        hospitalId_restaurantCode: {
          hospitalId: hospital.id,
          restaurantCode: 'CAFETERIA'
        }
      }
    });

    await tx.counter.upsert({
      create: {
        counterCode: 'COUNTER-01',
        counterName: 'Cafeteria Counter 1',
        hospitalId: hospital.id,
        isActive: true,
        restaurantId: restaurant.id
      },
      update: {
        counterName: 'Cafeteria Counter 1',
        deletedAt: null,
        hospitalId: hospital.id,
        isActive: true
      },
      where: {
        restaurantId_counterCode: {
          counterCode: 'COUNTER-01',
          restaurantId: restaurant.id
        }
      }
    });

    const superAdminUser = await tx.user.upsert({
      create: {
        email: 'admin@aahar.local',
        employeeCode: 'SA001',
        hospitalId: hospital.id,
        mobile: '9999999999',
        name: 'Super Admin',
        status: UserStatus.ACTIVE
      },
      update: {
        deletedAt: null,
        email: 'admin@aahar.local',
        hospitalId: hospital.id,
        mobile: '9999999999',
        name: 'Super Admin',
        status: UserStatus.ACTIVE
      },
      where: {
        employeeCode: 'SA001'
      }
    });

    await tx.userRole.upsert({
      create: {
        roleId: superAdmin.id,
        userId: superAdminUser.id
      },
      update: {
        deletedAt: null
      },
      where: {
        userId_roleId: {
          roleId: superAdmin.id,
          userId: superAdminUser.id
        }
      }
    });
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
