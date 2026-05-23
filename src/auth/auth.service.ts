import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  // In-memory deny-list of tokens invalidated by logout.
  private readonly deniedTokens = new Set<string>();

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.usersRepository.findOne({
      where: { username },
      select: ['id', 'username', 'role', 'password'],
    });
    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken, tokenType: 'Bearer', expiresIn: 3600 };
  }

  logout(token?: string): void {
    if (token) this.deniedTokens.add(token);
  }

  isTokenDenied(token: string): boolean {
    return this.deniedTokens.has(token);
  }

  async setPassword(userId: number, plainPassword: string): Promise<void> {
    const hashed = await bcrypt.hash(plainPassword, 10);
    await this.usersRepository.update(userId, { password: hashed });
  }

  getMe(user: any) {
    return user;
  }
}
