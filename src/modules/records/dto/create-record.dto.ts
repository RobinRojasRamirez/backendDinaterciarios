import { IsString, IsNumber, Min, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRecordDto {
  @ApiProperty({ example: '2026-06-30', description: 'Fecha del registro (YYYY-MM-DD)' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ example: 'POZO CHICHIMENE-01', description: 'Nombre del pozo' })
  @IsString()
  @MaxLength(100)
  pozo: string;

  @ApiProperty({ example: 'Carlos Andres Martinez', description: 'Nombre del operador' })
  @IsString()
  @MaxLength(150)
  operador: string;

  @ApiProperty({ example: 2340, description: 'Presion cabeza (PSI)' })
  @IsNumber()
  @Min(0)
  presionCabeza: number;

  @ApiProperty({ example: 1850, description: 'Presion anular (PSI)' })
  @IsNumber()
  @Min(0)
  presionAnular: number;

  @ApiProperty({ example: 120, description: 'Velocidad (HZ)' })
  @IsNumber()
  @Min(0)
  velocidad: number;

  @ApiProperty({ example: 45.2, description: 'Corriente (A)' })
  @IsNumber()
  @Min(0)
  corriente: number;

  @ApiProperty({ example: 850, description: 'Torque (%)' })
  @IsNumber()
  @Min(0)
  torque: number;

  @ApiProperty({ example: 72, description: 'Carga de pozo (LB/FT)' })
  @IsNumber()
  @Min(0)
  cargaPozo: number;
}
