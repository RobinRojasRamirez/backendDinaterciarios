import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@database/prisma.service';
import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { ProfileResponseDto } from '../dto/profile-response.dto';
import { JwtPayload } from '@common/interfaces/jwt-payload.interface';
import { createHash } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginRequestDto): Promise<LoginResponseDto> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { cedula: dto.cedula },
    });

    if (!usuario || usuario.deletedAt || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas. Verifica tu cédula y contraseña.');
    }

    const passwordValid = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas. Verifica tu cédula y contraseña.');
    }

    const payload: JwtPayload = {
      sub: usuario.id,
      cedula: usuario.cedula,
      role: usuario.rol,
    };

    const token = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: (this.configService.get<string>('jwt.refreshExpiration') ?? '7d') as any,
    });

    await this.storeRefreshToken(usuario.id, refreshToken);

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcceso: new Date() },
    });

    this.logger.log(`Usuario ${usuario.cedula} inició sesión`);

    return {
      token,
      refreshToken,
      user: {
        id: usuario.id,
        cedula: usuario.cedula,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
  }

  async refresh(refreshToken: string): Promise<LoginResponseDto> {
    try {
      const refreshSecret = this.configService.getOrThrow<string>('jwt.refreshSecret');
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });

      const tokenHash = this.hashToken(refreshToken);
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token inválido o expirado');
      }

      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });

      const usuario = await this.prisma.usuario.findUnique({
        where: { id: payload.sub },
      });

      if (!usuario || !usuario.activo || usuario.deletedAt) {
        throw new UnauthorizedException('Usuario no encontrado o inactivo');
      }

      const newPayload: JwtPayload = {
        sub: usuario.id,
        cedula: usuario.cedula,
        role: usuario.rol,
      };

      const newToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: (this.configService.get<string>('jwt.refreshExpiration') ?? '7d') as any,
      });

      await this.storeRefreshToken(usuario.id, newRefreshToken);

      return {
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: usuario.id,
          cedula: usuario.cedula,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
      };
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  async getProfile(usuarioId: string): Promise<ProfileResponseDto> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nombre: true,
        cedula: true,
        email: true,
        rol: true,
        ultimoAcceso: true,
        createdAt: true,
        deletedAt: true,
      },
    });

    if (!usuario || usuario.deletedAt) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      cedula: usuario.cedula,
      email: usuario.email,
      rol: usuario.rol,
      ultimoAcceso: usuario.ultimoAcceso,
      createdAt: usuario.createdAt,
    };
  }

  async logout(usuarioId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { usuarioId, revoked: false },
      data: { revoked: true },
    });
    this.logger.log(`Usuario ${usuarioId} cerró sesión`);
  }

  private async storeRefreshToken(usuarioId: string, token: string): Promise<void> {
    const tokenHash = this.hashToken(token);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        usuarioId,
        tokenHash,
        expiresAt,
      },
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
