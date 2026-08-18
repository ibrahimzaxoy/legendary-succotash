import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KitchenStation } from './entities/kitchen-station.entity';
import { KitchenService } from './kitchen.service';
import { KitchenController } from './kitchen.controller';
import { KitchenGateway } from './kitchen.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([KitchenStation])],
  providers: [KitchenService, KitchenGateway],
  controllers: [KitchenController],
  exports: [KitchenService],
})
export class KitchenModule {}
