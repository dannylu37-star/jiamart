import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GoodsModule } from './goods/goods.module';
import { OrdersModule } from './orders/orders.module';
import { StockModule } from './stock/stock.module';
import { StaffModule } from './staff/staff.module';
import { OpsModule } from './ops/ops.module';
import { StoreModule } from './store/store.module';
import { ScheduleContextModule } from './schedule-context/schedule-context.module';
import { VendorModule } from './vendor/vendor.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // ── Default connection → jiamart_shop ──────────────────────────
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbHost = config.get('DB_HOST', '34.147.180.155');
        const isSocket = dbHost.startsWith('/');
        return {
          type: 'mysql',
          ...(isSocket
            ? { socketPath: dbHost }
            : { host: dbHost, port: config.get<number>('DB_PORT', 3306), ssl: { rejectUnauthorized: false } }),
          username: config.get('DB_USERNAME', 'jiamart'),
          password: config.get('DB_PASSWORD'),
          database: config.get('DB_NAME', 'jiamart_shop'),
          autoLoadEntities: true,
          synchronize: false,
          connectTimeout: 30000,
          retryAttempts: 3,
          retryDelay: 3000,
        };
      },
    }),
    // ── Ops connection → jiamart_ops ───────────────────────────────
    TypeOrmModule.forRootAsync({
      name: 'ops',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbHost = config.get('DB_HOST', '34.147.180.155');
        const isSocket = dbHost.startsWith('/');
        return {
          name: 'ops',
          type: 'mysql',
          ...(isSocket
            ? { socketPath: dbHost }
            : { host: dbHost, port: config.get<number>('DB_PORT', 3306), ssl: { rejectUnauthorized: false } }),
          username: config.get('DB_USERNAME', 'jiamart'),
          password: config.get('DB_PASSWORD'),
          database: config.get('OPS_DB_NAME', 'jiamart_ops'),
          autoLoadEntities: true,
          synchronize: false,
          connectTimeout: 30000,
          retryAttempts: 3,
          retryDelay: 3000,
        };
      },
    }),
    AuthModule,
    UsersModule,
    GoodsModule,
    OrdersModule,
    StockModule,
    StaffModule,
    OpsModule,
    StoreModule,
    ScheduleContextModule,
    VendorModule,
  ],
})
export class AppModule {}
