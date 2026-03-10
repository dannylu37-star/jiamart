import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(UserEntity) private repo: Repository<UserEntity>) {}

  findAll(page = 1, limit = 20) {
    return this.repo.findAndCount({ order: { createdAt: 'DESC' }, skip: (page-1)*limit, take: limit });
  }

  findByUsername(username: string) {
    return this.repo.findOne({ where: { username }, select: ['id','username','password','role','storeId'] } as any);
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  async createFromGoogle(profile: any) {
    const user = this.repo.create({ email: profile.email, username: profile.email, firstName: profile.name });
    return this.repo.save(user);
  }
}
