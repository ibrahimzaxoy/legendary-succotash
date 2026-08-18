import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Staff } from './entities/staff.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import { Role } from '../../common/enums/role.enum';

// Shared tablets (waiter, cashier, kitchen, rider) authenticate with a PIN,
// not email+password - see PIN_LOGIN_ROLES below.
const PIN_LOGIN_ROLES = [Role.WAITER, Role.CASHIER, Role.KITCHEN, Role.RIDER];

export interface StaffLoginOption {
  id: string;
  fullName: string;
  role: Role;
}

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

  // Public-but-scoped: a shared device (Waiter POS, KDS) already knows its
  // branchId from setup, and needs a "tap your name" picker before a PIN
  // login - this reveals only name/role, never a secret, so it's safe to
  // expose without requiring the staff member to already be authenticated
  // (which would be circular - that's the whole point of logging in).
  async findLoginOptionsForBranch(branchId: string): Promise<StaffLoginOption[]> {
    const staff = await this.staffRepo.find({
      where: { branchId, role: In(PIN_LOGIN_ROLES), active: true },
      order: { fullName: 'ASC' },
    });
    return staff.map((s) => ({ id: s.id, fullName: s.fullName, role: s.role }));
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
