import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import dataSource from '../../config/typeorm.config';
import { Restaurant } from '../../modules/restaurants/entities/restaurant.entity';
import { Branch } from '../../modules/branches/entities/branch.entity';
import { Staff } from '../../modules/staff/entities/staff.entity';
import { RestaurantTable } from '../../modules/tables/entities/table.entity';
import { KitchenStation } from '../../modules/kitchen/entities/kitchen-station.entity';
import { Role } from '../../common/enums/role.enum';
import { TableStatus } from '../../common/enums/order.enum';

// Bootstraps the first Restaurant/Branch/Owner account directly against the
// database, bypassing the API's normal auth (which requires an Owner to
// already exist to create anything). Run once against a fresh database:
//   npm run seed
async function main() {
  await dataSource.initialize();

  const restaurantRepo = dataSource.getRepository(Restaurant);
  const branchRepo = dataSource.getRepository(Branch);
  const staffRepo = dataSource.getRepository(Staff);
  const tableRepo = dataSource.getRepository(RestaurantTable);
  const stationRepo = dataSource.getRepository(KitchenStation);

  const restaurant = await restaurantRepo.save(restaurantRepo.create({ name: 'Demo Restaurant' }));

  const branch = await branchRepo.save(
    branchRepo.create({ restaurantId: restaurant.id, name: 'Main Branch', address: '123 Main St' }),
  );

  const ownerPassword = process.env.SEED_OWNER_PASSWORD || 'change-me-now';
  const owner = await staffRepo.save(
    staffRepo.create({
      restaurantId: restaurant.id,
      branchId: null,
      fullName: 'Owner',
      email: process.env.SEED_OWNER_EMAIL || 'owner@example.com',
      role: Role.OWNER,
      passwordHash: await bcrypt.hash(ownerPassword, 10),
    }),
  );

  const stationNames = ['Pizza', 'Hookah', 'Grill', 'Bar', 'Cold/Salads', 'Dessert'];
  const stations = await stationRepo.save(
    stationNames.map((name) => stationRepo.create({ branchId: branch.id, name })),
  );
  await stationRepo.save(stationRepo.create({ branchId: branch.id, name: 'Expo', isExpo: true }));

  const tables = await tableRepo.save(
    Array.from({ length: 5 }, (_, i) =>
      tableRepo.create({
        branchId: branch.id,
        number: String(i + 1),
        status: TableStatus.FREE,
        qrToken: randomBytes(24).toString('base64url'),
      }),
    ),
  );

  // eslint-disable-next-line no-console
  console.log('Seed complete.');
  // eslint-disable-next-line no-console
  console.log(`Restaurant: ${restaurant.id}`);
  // eslint-disable-next-line no-console
  console.log(`Branch: ${branch.id}`);
  // eslint-disable-next-line no-console
  console.log(`Owner login: ${owner.email} / ${ownerPassword}`);
  // eslint-disable-next-line no-console
  console.log(`Kitchen stations: ${stations.map((s) => s.name).join(', ')}, Expo`);
  // eslint-disable-next-line no-console
  console.log(`Tables: ${tables.map((t) => t.number).join(', ')}`);

  await dataSource.destroy();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
