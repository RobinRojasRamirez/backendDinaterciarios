import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../../database/prisma.service';
import { LoginRequestDto } from '../dto/login-request.dto';

const mockUsuario = {
  id: 'uuid-123',
  cedula: '1234567890',
  nombre: 'Juan Pérez',
  email: 'juan@ecopetrol.com',
  passwordHash: bcrypt.hashSync('123456', 10),
  rol: 'ADMIN',
  activo: true,
  deletedAt: null,
  ultimoAcceso: null,
};

const mockPrisma = {
  usuario: {
    findUnique: jest.fn().mockResolvedValue(mockUsuario),
    update: jest.fn().mockResolvedValue(mockUsuario),
  },
  refreshToken: {
    findUnique: jest.fn().mockResolvedValue({
      id: 'rt-uuid',
      usuarioId: 'uuid-123',
      tokenHash: 'abc123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false,
    }),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({
    sub: 'uuid-123',
    cedula: '1234567890',
    role: 'ADMIN',
  }),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      'jwt.secret': 'test-secret',
      'jwt.expiration': '15m',
      'jwt.refreshSecret': 'test-refresh-secret',
      'jwt.refreshExpiration': '7d',
    };
    return config[key] ?? null;
  }),
  getOrThrow: jest.fn((key: string) => {
    const config: Record<string, string> = {
      'jwt.secret': 'test-secret',
      'jwt.expiration': '15m',
      'jwt.refreshSecret': 'test-refresh-secret',
      'jwt.refreshExpiration': '7d',
    };
    const value = config[key];
    if (value === undefined) throw new Error(`Config key "${key}" not found`);
    return value;
  }),
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('login', () => {
    const validDto: LoginRequestDto = {
      cedula: '1234567890',
      password: '123456',
    };

    it('should return token and user on valid credentials', async () => {
      const result = await service.login(validDto);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual({
        id: 'uuid-123',
        cedula: '1234567890',
        nombre: 'Juan Pérez',
        email: 'juan@ecopetrol.com',
        rol: 'ADMIN',
      });
      expect(mockPrisma.usuario.update).toHaveBeenCalled();
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValueOnce(null);

      await expect(service.login(validDto)).rejects.toThrow(
        new UnauthorizedException('Credenciales inválidas. Verifica tu cédula y contraseña.'),
      );
    });

    it('should throw UnauthorizedException if user is deleted', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValueOnce({
        ...mockUsuario,
        deletedAt: new Date(),
      });

      await expect(service.login(validDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValueOnce({
        ...mockUsuario,
        activo: false,
      });

      await expect(service.login(validDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      const wrongDto = { ...validDto, password: 'wrong-password' };

      await expect(service.login(wrongDto)).rejects.toThrow(
        new UnauthorizedException('Credenciales inválidas. Verifica tu cédula y contraseña.'),
      );
    });
  });

  describe('refresh', () => {
    it('should return new tokens on valid refresh token', async () => {
      const result = await service.refresh('valid-refresh-token');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.cedula).toBe('1234567890');
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rt-uuid' },
          data: { revoked: true },
        }),
      );
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockJwtService.verify.mockImplementationOnce(() => {
        throw new Error('invalid token');
      });

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        new UnauthorizedException('Refresh token inválido o expirado'),
      );
    });

    it('should throw UnauthorizedException if stored token is revoked', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValueOnce({
        id: 'rt-uuid',
        usuarioId: 'uuid-123',
        tokenHash: 'abc123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: true,
      });

      await expect(service.refresh('revoked-token')).rejects.toThrow(
        new UnauthorizedException('Refresh token inválido o expirado'),
      );
    });

    it('should throw UnauthorizedException if stored token is expired', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValueOnce({
        id: 'rt-uuid',
        usuarioId: 'uuid-123',
        tokenHash: 'abc123',
        expiresAt: new Date(Date.now() - 1000),
        revoked: false,
      });

      await expect(service.refresh('expired-token')).rejects.toThrow(
        new UnauthorizedException('Refresh token inválido o expirado'),
      );
    });

    it('should throw generic error if user is inactive (catch-all)', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValueOnce({
        ...mockUsuario,
        activo: false,
      });

      await expect(service.refresh('valid-token')).rejects.toThrow(
        new UnauthorizedException('Refresh token inválido o expirado'),
      );
    });
  });

  describe('logout', () => {
    it('should revoke all active refresh tokens', async () => {
      await service.logout('uuid-123');

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { usuarioId: 'uuid-123', revoked: false },
        data: { revoked: true },
      });
    });
  });
});
