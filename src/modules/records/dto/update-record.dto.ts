import { IsString, IsNumber, IsOptional, IsDateString, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRecordDto {
  @ApiPropertyOptional({ example: 'POZO CHICHIMENE-01' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pozo?: string;

  @ApiPropertyOptional({ example: 'Carlos Andres Martinez' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  operador?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({ example: 2340 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  presionCabeza?: number;

  @ApiPropertyOptional({ example: 1850 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  presionAnular?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  velocidad?: number;

  @ApiPropertyOptional({ example: 45.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  corriente?: number;

  @ApiPropertyOptional({ example: 850 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  torque?: number;

  @ApiPropertyOptional({ example: 72 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cargaPozo?: number;
}
