import { IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
  @ApiProperty({
    description: 'Número de cédula del usuario',
    example: '1234567890',
  })
  @IsString()
  @Matches(/^\d{5,10}$/, { message: 'La cédula debe tener entre 5 y 10 dígitos' })
  cedula: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: '123456',
  })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
