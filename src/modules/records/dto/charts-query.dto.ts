import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChartsQueryDto {
  @ApiProperty({ description: 'Nombre del pozo', example: 'POZO CHICHIMENE-01' })
  @IsString()
  pozo: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}
