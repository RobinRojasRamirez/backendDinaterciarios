import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateRecordDto } from '../dto/create-record.dto';
import { UpdateRecordDto } from '../dto/update-record.dto';
import { QueryRecordsDto } from '../dto/query-records.dto';
import { ChartsQueryDto } from '../dto/charts-query.dto';
import { RecordResponseDto } from '../dto/record-response.dto';

interface VariableConfig {
  id: string;
  nombre: string;
  unidad: string;
  color: string;
  field: keyof Omit<RecordResponseDto, 'id' | 'fecha' | 'hora' | 'pozo' | 'operador'>;
}

interface ChartQueryRow {
  id: string;
  fecha: Date;
  pozo: string;
  presionCabeza: unknown;
  presionAnular: unknown;
  velocidad: unknown;
  corriente: unknown;
  torque: unknown;
  cargaPozo: unknown;
}

const VARIABLES_CONFIG: VariableConfig[] = [
  { id: 'presion-cabeza', nombre: 'Presion cabeza', unidad: 'PSI', color: '#22c55e', field: 'presionCabeza' },
  { id: 'presion-anular', nombre: 'Presion anular', unidad: 'PSI', color: '#f5d413', field: 'presionAnular' },
  { id: 'velocidad', nombre: 'Velocidad', unidad: 'HZ', color: '#3b82f6', field: 'velocidad' },
  { id: 'corriente', nombre: 'Corriente', unidad: 'A', color: '#a855f7', field: 'corriente' },
  { id: 'torque', nombre: 'Torque', unidad: '%', color: '#f97316', field: 'torque' },
  { id: 'carga-pozo', nombre: 'Carga de pozo', unidad: 'LB/FT', color: '#14b8a6', field: 'cargaPozo' },
];

@Injectable()
export class RecordsService {
  private readonly logger = new Logger(RecordsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRecordDto, usuarioId: string): Promise<RecordResponseDto> {
    const fechaDate = new Date(dto.fecha);

    if (fechaDate > new Date()) {
      throw new BadRequestException('La fecha no puede ser futura');
    }

    const registro = await this.prisma.registro.create({
      data: {
        usuarioId,
        pozo: dto.pozo,
        operador: dto.operador,
        fecha: fechaDate,
        presionCabeza: dto.presionCabeza,
        presionAnular: dto.presionAnular,
        velocidad: dto.velocidad,
        corriente: dto.corriente,
        torque: dto.torque,
        cargaPozo: dto.cargaPozo,
      },
    });

    this.logger.log(`Registro creado: ${registro.id} para pozo ${dto.pozo}`);

    return this.mapToResponseDto(registro);
  }

  async findAll(query: QueryRecordsDto, usuarioId: string) {
    const {
      search,
      pozo,
      fechaDesde,
      fechaHasta,
      page = 1,
      pageSize = 10,
      sortBy = 'fecha',
      sortOrder = 'desc',
    } = query;

    const where: Record<string, unknown> = { usuarioId, deletedAt: null };

    if (pozo) {
      where.pozo = { contains: pozo, mode: 'insensitive' };
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) (where.fecha as Record<string, unknown>).gte = new Date(fechaDesde);
      if (fechaHasta) (where.fecha as Record<string, unknown>).lte = new Date(fechaHasta);
    }

    if (search) {
      where.OR = [
        { pozo: { contains: search, mode: 'insensitive' } },
        { operador: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [data, total] = await Promise.all([
      this.prisma.registro.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.registro.count({ where }),
    ]);

    return {
      data: data.map((r: any) => this.mapToResponseDto(r)),
      total,
      page,
      pageSize,
    };
  }

  async getPozos(usuarioId: string): Promise<string[]> {
    const rows = await this.prisma.registro.findMany({
      distinct: ['pozo'],
      select: { pozo: true },
      where: {
        usuarioId,
        deletedAt: null,
        pozo: { not: '' },
      },
      orderBy: { pozo: 'asc' },
    });

    return rows.map((row) => row.pozo);
  }

  async findById(id: string, usuarioId: string): Promise<RecordResponseDto> {
    const registro = await this.prisma.registro.findFirst({
      where: { id, usuarioId, deletedAt: null },
    });

    if (!registro) {
      throw new NotFoundException('Registro no encontrado');
    }

    return this.mapToResponseDto(registro);
  }

  async update(id: string, dto: UpdateRecordDto, usuarioId: string): Promise<RecordResponseDto> {
    const existing = await this.prisma.registro.findFirst({
      where: { id, usuarioId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Registro no encontrado');
    }

    const data: Record<string, unknown> = {};

    if (dto.pozo !== undefined) data.pozo = dto.pozo;
    if (dto.operador !== undefined) data.operador = dto.operador;
    if (dto.fecha !== undefined) data.fecha = new Date(dto.fecha);
    if (dto.presionCabeza !== undefined) data.presionCabeza = dto.presionCabeza;
    if (dto.presionAnular !== undefined) data.presionAnular = dto.presionAnular;
    if (dto.velocidad !== undefined) data.velocidad = dto.velocidad;
    if (dto.corriente !== undefined) data.corriente = dto.corriente;
    if (dto.torque !== undefined) data.torque = dto.torque;
    if (dto.cargaPozo !== undefined) data.cargaPozo = dto.cargaPozo;

    const registro = await this.prisma.registro.update({
      where: { id },
      data,
    });

    return this.mapToResponseDto(registro);
  }

  async remove(id: string, usuarioId: string): Promise<void> {
    const existing = await this.prisma.registro.findFirst({
      where: { id, usuarioId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Registro no encontrado');
    }

    await this.prisma.registro.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Registro eliminado: ${id}`);
  }

  async getCharts(query: ChartsQueryDto, usuarioId: string) {
    const filters: Prisma.Sql[] = [
      Prisma.sql`usuario_id = ${usuarioId}::uuid`,
      Prisma.sql`pozo ILIKE ${`%${query.pozo}%`}`,
      Prisma.sql`deleted_at IS NULL`,
    ];

    if (query.fechaInicio) {
      filters.push(Prisma.sql`fecha >= ${query.fechaInicio}::date`);
    }
    if (query.fechaFin) {
      filters.push(Prisma.sql`fecha <= ${query.fechaFin}::date`);
    }

    const registros = await this.prisma.$queryRaw<ChartQueryRow[]>`
      SELECT
        id,
        fecha,
        pozo,
        presion_cabeza AS "presionCabeza",
        presion_anular AS "presionAnular",
        velocidad,
        corriente,
        torque,
        carga_pozo AS "cargaPozo"
      FROM registros
      WHERE ${Prisma.join(filters, ' AND ')}
      ORDER BY fecha ASC
    `;

    const variables = VARIABLES_CONFIG.map((config) => {
      const datos = registros.map((r) => ({
        fecha: r.fecha.toISOString().split('T')[0],
        valor: Number(r[config.field]),
      }));

      const valorActual = datos.length > 0 ? datos[datos.length - 1].valor : 0;

      return {
        id: config.id,
        nombre: config.nombre,
        unidad: config.unidad,
        color: config.color,
        valorActual,
        datos,
      };
    });

    return { pozo: query.pozo, variables };
  }

  private mapToResponseDto(registro: {
    id: string;
    fecha: Date;
    pozo: string;
    operador: string;
    presionCabeza: unknown;
    presionAnular: unknown;
    velocidad: unknown;
    corriente: unknown;
    torque: unknown;
    cargaPozo: unknown;
    createdAt: Date;
  }): RecordResponseDto {
    const fechaStr = registro.fecha.toISOString().split('T')[0];
    const horaStr = registro.createdAt.toISOString().split('T')[1].substring(0, 5);

    return {
      id: registro.id,
      fecha: fechaStr,
      hora: horaStr,
      pozo: registro.pozo,
      operador: registro.operador,
      presionCabeza: Number(registro.presionCabeza),
      presionAnular: Number(registro.presionAnular),
      velocidad: Number(registro.velocidad),
      corriente: Number(registro.corriente),
      torque: Number(registro.torque),
      cargaPozo: Number(registro.cargaPozo),
    };
  }
}
