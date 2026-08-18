import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Staff } from './entities/staff.entity';
import { CreateStaffDto } from './dto/create-staff.dto';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepo: Repository<Staff>,
  ) {}

  async create(dto: CreateStaffDto): Promise<Staff> {
    const staff = this.staffRepo.create({
      restaurantId: dto.restaurantId,
      branchId: dto.branchId ?? null,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      role: dto.role,
      passwordHash: dto.password ? await bcrypt.hash(dto.password, 10) : null,
      pinHash: dto.pin ? await bcrypt.hash(dto.pin, 10) : null,
    });
    const saved = await this.staffRepo.save(staff);
    // save() returns the in-memory entity including hashes even though
    // they're `select: false` - strip them before handing back to the caller.
    return this.findOne(saved.id);
  }

  findAllForBranch(branchId: string): Promise<Staff[]> {
    return this.staffRepo.find({ where: { branchId } });
  }

  async findOne(id: string): Promise<Staff> {
    const staff = await this.staffRepo.findOne({ where: { id } });
    if (!staff) {
      throw new NotFoundException(`Staff ${id} not found`);
    }
    return staff;
  }

  findByEmailWithSecrets(email: string): Promise<Staff | null> {
    return this.staffRepo
      .createQueryBuilder('staff')
      .addSelect('staff.passwordHash')
      .addSelect('staff.pinHash')
      .where('staff.email = :email', { email })
      .getOne();
  }

  findByIdWithSecrets(id: string): Promise<Staff | null> {
    return this.staffRepo
      .createQueryBuilder('staff')
      .addSelect('staff.passwordHash')
      .addSelect('staff.pinHash')
      .where('staff.id = :id', { id })
      .getOne();
  }
}
