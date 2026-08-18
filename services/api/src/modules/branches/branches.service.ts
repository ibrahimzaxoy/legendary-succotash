import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branches: Repository<Branch>,
  ) {}

  create(dto: CreateBranchDto): Promise<Branch> {
    return this.branches.save(this.branches.create(dto));
  }

  findAllForRestaurant(restaurantId: string): Promise<Branch[]> {
    return this.branches.find({ where: { restaurantId } });
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branches.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException(`Branch ${id} not found`);
    }
    return branch;
  }
}
