import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { ProfileResponseDto } from '../dto/profile-response.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @SwaggerResponse({ status: 200, description: 'Login exitoso', type: LoginResponseDto })
  @SwaggerResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginRequestDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar token de acceso' })
  @SwaggerResponse({ status: 200, description: 'Token renovado' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<LoginResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @SwaggerResponse({ status: 200, description: 'Perfil obtenido', type: ProfileResponseDto })
  @SwaggerResponse({ status: 401, description: 'Token inválido o expirado' })
  async getProfile(@CurrentUser('sub') usuarioId: string): Promise<ProfileResponseDto> {
    return this.authService.getProfile(usuarioId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión' })
  @SwaggerResponse({ status: 200, description: 'Sesión cerrada' })
  async logout(@CurrentUser('sub') usuarioId: string): Promise<{ message: string }> {
    await this.authService.logout(usuarioId);
    return { message: 'Sesión cerrada exitosamente' };
  }
}
