import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../user/user.entity';
import * as bcrypt from 'bcrypt';

const hashedPassword = bcrypt.hashSync('secret123', 10);

const mockUser = {
  id: 5,
  username: 'jdoe',
  email: 'jdoe@example.com',
  role: 'DEVELOPER',
  password: hashedPassword,
};

const mockUserRepository = {
  findOne: jest.fn().mockResolvedValue(mockUser),
  update: jest.fn().mockResolvedValue(undefined),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should return a token on valid login', async () => {
    const result = await service.login('jdoe', 'secret123');
    expect(result.accessToken).toBe('mock-jwt-token');
    expect(result.tokenType).toBe('Bearer');
  });

  it('should throw UnauthorizedException on wrong password', async () => {
    await expect(service.login('jdoe', 'wrongpassword')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when user not found', async () => {
    mockUserRepository.findOne.mockResolvedValueOnce(null);
    await expect(service.login('unknown', 'secret123')).rejects.toThrow(UnauthorizedException);
  });

  it('should hash and save password', async () => {
    await service.setPassword(5, 'newpassword');
    expect(mockUserRepository.update).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ password: expect.any(String) }),
    );
  });
});
