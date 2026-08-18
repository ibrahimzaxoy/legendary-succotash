import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  create(dto: CreateRestaurantDto): Promise<Restaurant> {
    return this.restaurants.save(this.restaurants.create(dto));
  }

  findAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurants.findOne({ where: { id } });
    if (!restaurant) {
      throw new NotFoundException(`Restaurant ${id} not found`);
    }
    return restaurant;
  }
}
