import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const typeOrmDataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'restaurant',
  password: process.env.DB_PASSWORD || 'restaurant',
  database: process.env.DB_DATABASE || 'restaurant',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  // Never true in production - migrations are the source of truth for schema
  // changes; synchronize is only convenient for early local development.
  synchronize: process.env.NODE_ENV === 'development' && process.env.DB_SYNC === 'true',
  logging: process.env.NODE_ENV === 'development',
};

// Used both by NestJS bootstrap (via TypeOrmModule.forRootAsync) and by the
// `typeorm` CLI (migration:generate/run/revert) so schema stays in one place.
export default new DataSource(typeOrmDataSourceOptions);
