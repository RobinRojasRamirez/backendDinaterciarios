import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  cedula: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  rol: string;

  @ApiProperty({ required: false })
  ultimoAcceso: Date | null;

  @ApiProperty()
  createdAt: Date;
}
