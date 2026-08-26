import { ApiProperty } from '@nestjs/swagger';

export class RecordResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Fecha del registro (YYYY-MM-DD)' })
  fecha: string;

  @ApiProperty({ description: 'Hora del registro (HH:mm)' })
  hora: string;

  @ApiProperty({ description: 'Nombre del pozo' })
  pozo: string;

  @ApiProperty({ description: 'Nombre del operador' })
  operador: string;

  @ApiProperty({ example: 2340, description: 'Presion cabeza (PSI)' })
  presionCabeza: number;

  @ApiProperty({ example: 1850, description: 'Presion anular (PSI)' })
  presionAnular: number;

  @ApiProperty({ example: 120, description: 'Velocidad (HZ)' })
  velocidad: number;

  @ApiProperty({ example: 45.2, description: 'Corriente (A)' })
  corriente: number;

  @ApiProperty({ example: 850, description: 'Torque (%)' })
  torque: number;

  @ApiProperty({ example: 72, description: 'Carga de pozo (LB/FT)' })
  cargaPozo: number;
}
