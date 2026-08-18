import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KitchenStation } from './entities/kitchen-station.entity';
import { CreateKitchenStationDto } from './dto/create-kitchen-station.dto';

@Injectable()
export class KitchenService {
  constructor(
    @InjectRepository(KitchenStation)
    private readonly stations: Repository<KitchenStation>,
  ) {}

  create(dto: CreateKitchenStationDto): Promise<KitchenStation> {
    return this.stations.save(this.stations.create(dto));
  }

  findAllForBranch(branchId: string): Promise<KitchenStation[]> {
    return this.stations.find({ where: { branchId }, order: { sortOrder: 'ASC' } });
  }

  async findOne(id: string): Promise<KitchenStation> {
    const station = await this.stations.findOne({ where: { id } });
    if (!station) {
      throw new NotFoundException(`Kitchen station ${id} not found`);
    }
    return station;
  }
}
