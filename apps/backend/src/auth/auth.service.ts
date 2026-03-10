import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (!user) throw new UnauthorizedException('用户不存在');
    const valid = await bcrypt.compare(password, (user as any).password ?? '');
    if (!valid) throw new UnauthorizedException('密码错误');
    const result: any = { ...user };
    delete result.password;
    return result;
  }

  login(user: any) {
    const payload: any = {
      sub: user.id,
      username: user.username,
      role: user.role ?? 'guest',
    };
    if (user.storeId != null) payload.storeId = user.storeId;
    if (user.staffId != null) payload.staffId = user.staffId;
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, username: user.username, role: payload.role, storeId: payload.storeId ?? null },
    };
  }

  async googleLogin(profile: any) {
    let user = await this.usersService.findByEmail(profile.email);
    if (!user) user = await this.usersService.createFromGoogle(profile);
    return this.login(user);
  }
}
