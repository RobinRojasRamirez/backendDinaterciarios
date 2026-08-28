import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RecordsService } from './records.service';
import { PrismaService } from '../../../database/prisma.service';
import { CreateRecordDto } from '../dto/create-record.dto';
import { UpdateRecordDto } from '../dto/update-record.dto';

const USUARIO_A = 'uuid-user-A';
const USUARIO_B = 'uuid-user-B';

const mockRegistro = {
  id: 'uuid-reg-1',
  usuarioId: USUARIO_A,
  pozo: 'POZO CHICHIMENE-01',
  operador: 'Carlos Andres Martinez',
  fecha: new Date('2026-06-30'),
  presionCabeza: 2340,
  presionAnular: 1850,
  velocidad: 120,
  corriente: 45.2,
  torque: 850,
  cargaPozo: 72,
  createdAt: new Date('2026-06-30T14:30:00Z'),
  updatedAt: new Date('2026-06-30T14:30:00Z'),
  deletedAt: null,
};

const mockPrisma = {
  registro: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

describe('RecordsService', () => {
  let service: RecordsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RecordsService>(RecordsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateRecordDto = {
      fecha: '2026-06-30',
      pozo: 'POZO CHICHIMENE-01',
      operador: 'Carlos Andres Martinez',
      presionCabeza: 2340,
      presionAnular: 1850,
      velocidad: 120,
      corriente: 45.2,
      torque: 850,
      cargaPozo: 72,
    };

    it('should create a record assigned to the authenticated user', async () => {
      mockPrisma.registro.create.mockResolvedValue(mockRegistro);

      const result = await service.create(createDto, USUARIO_A);

      expect(result).toHaveProperty('id', 'uuid-reg-1');
      expect(result).toHaveProperty('pozo', 'POZO CHICHIMENE-01');
      expect(result).toHaveProperty('operador', 'Carlos Andres Martinez');
      expect(result).toHaveProperty('presionCabeza', 2340);
      expect(result).toHaveProperty('cargaPozo', 72);

      expect(mockPrisma.registro.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          usuarioId: USUARIO_A,
          pozo: 'POZO CHICHIMENE-01',
          operador: 'Carlos Andres Martinez',
          presionCabeza: 2340,
          cargaPozo: 72,
        }),
      });
    });

    it('should assign the owner from the authenticated user, not from the DTO', async () => {
      mockPrisma.registro.create.mockResolvedValue(mockRegistro);

      await service.create(createDto, USUARIO_B);

      expect(mockPrisma.registro.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          usuarioId: USUARIO_B,
        }),
      });
    });

    it('should throw BadRequestException if fecha is in the future', async () => {
      const futureDto = { ...createDto, fecha: '2099-12-31' };

      await expect(service.create(futureDto, USUARIO_A)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      mockPrisma.registro.findMany.mockResolvedValue([mockRegistro]);
      mockPrisma.registro.count.mockResolvedValue(1);
    });

    it('should return paginated records of the authenticated user', async () => {
      const result = await service.findAll({}, USUARIO_A);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('pozo', 'POZO CHICHIMENE-01');
      expect(result.total).toBe(1);

      expect(mockPrisma.registro.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            usuarioId: USUARIO_A,
            deletedAt: null,
          }),
        }),
      );
      expect(mockPrisma.registro.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            usuarioId: USUARIO_A,
            deletedAt: null,
          }),
        }),
      );
    });

    it('should only query records belonging to the authenticated user', async () => {
      await service.findAll({}, USUARIO_A);

      const findManyArg = mockPrisma.registro.findMany.mock.calls[0][0];
      const where = findManyArg.where as Record<string, unknown>;

      expect(where.usuarioId).toBe(USUARIO_A);
      expect(where.usuarioId).not.toBe(USUARIO_B);
    });

    it('should filter by pozo name and keep the user filter', async () => {
      await service.findAll({ pozo: 'CHICHIMENE' }, USUARIO_A);

      expect(mockPrisma.registro.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            usuarioId: USUARIO_A,
            pozo: expect.objectContaining({ contains: 'CHICHIMENE' }),
          }),
        }),
      );
    });

    it('should keep search filters and pagination', async () => {
      await service.findAll({ search: 'operador', page: 2, pageSize: 5 }, USUARIO_A);

      expect(mockPrisma.registro.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            usuarioId: USUARIO_A,
            OR: [
              { pozo: { contains: 'operador', mode: 'insensitive' } },
              { operador: { contains: 'operador', mode: 'insensitive' } },
            ],
          }),
          skip: 5,
          take: 5,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a record by id when it belongs to the user', async () => {
      mockPrisma.registro.findFirst.mockResolvedValue(mockRegistro);

      const result = await service.findById('uuid-reg-1', USUARIO_A);

      expect(result).toHaveProperty('id', 'uuid-reg-1');
      expect(result).toHaveProperty('pozo', 'POZO CHICHIMENE-01');

      expect(mockPrisma.registro.findFirst).toHaveBeenCalledWith({
        where: { id: 'uuid-reg-1', usuarioId: USUARIO_A, deletedAt: null },
      });
    });

    it('should throw NotFoundException if record does not exist', async () => {
      mockPrisma.registro.findFirst.mockResolvedValue(null);

      await expect(service.findById('non-existent', USUARIO_A)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when the record belongs to another user', async () => {
      mockPrisma.registro.findFirst.mockResolvedValue(null);

      await expect(service.findById('uuid-reg-1', USUARIO_B)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockPrisma.registro.findFirst).toHaveBeenCalledWith({
        where: { id: 'uuid-reg-1', usuarioId: USUARIO_B, deletedAt: null },
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateRecordDto = {
      operador: 'Nuevo Operador',
    };

    beforeEach(() => {
      mockPrisma.registro.findFirst.mockResolvedValue(mockRegistro);
      mockPrisma.registro.update.mockResolvedValue({
        ...mockRegistro,
        operador: 'Nuevo Operador',
      });
    });

    it('should update a record successfully when it belongs to the user', async () => {
      const result = await service.update('uuid-reg-1', updateDto, USUARIO_A);

      expect(result).toHaveProperty('operador', 'Nuevo Operador');

      expect(mockPrisma.registro.findFirst).toHaveBeenCalledWith({
        where: { id: 'uuid-reg-1', usuarioId: USUARIO_A, deletedAt: null },
      });
    });

    it('should not modify the owner of the record', async () => {
      await service.update('uuid-reg-1', updateDto, USUARIO_A);

      const updateArg = mockPrisma.registro.update.mock.calls[0][0];
      expect(updateArg.data).not.toHaveProperty('usuarioId');
    });

    it('should throw NotFoundException if record does not exist', async () => {
      mockPrisma.registro.findFirst.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto, USUARIO_A)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException and not update when the record belongs to another user', async () => {
      mockPrisma.registro.findFirst.mockResolvedValue(null);

      await expect(service.update('uuid-reg-1', updateDto, USUARIO_B)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockPrisma.registro.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      mockPrisma.registro.findFirst.mockResolvedValue(mockRegistro);
      mockPrisma.registro.update.mockResolvedValue({
        ...mockRegistro,
        deletedAt: new Date(),
      });
    });

    it('should soft delete a record when it belongs to the user', async () => {
      await service.remove('uuid-reg-1', USUARIO_A);

      expect(mockPrisma.registro.update).toHaveBeenCalledWith({
        where: { id: 'uuid-reg-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if record does not exist', async () => {
      mockPrisma.registro.findFirst.mockResolvedValue(null);

      await expect(service.remove('non-existent', USUARIO_A)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException and not delete when the record belongs to another user', async () => {
      mockPrisma.registro.findFirst.mockResolvedValue(null);

      await expect(service.remove('uuid-reg-1', USUARIO_B)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockPrisma.registro.update).not.toHaveBeenCalled();
    });
  });

  describe('getCharts', () => {
    const rawRows = [
      {
        id: 'uuid-reg-1',
        fecha: new Date('2026-06-30T00:00:00.000Z'),
        pozo: 'POZO CHICHIMENE-01',
        presionCabeza: 2340,
        presionAnular: 1850,
        velocidad: 120,
        corriente: 45.2,
        torque: 850,
        cargaPozo: 72,
      },
    ];

    function flattenSql(fn: jest.Mock): string {
      const [strings, ...values] = fn.mock.calls[0];
      let sql = '';
      for (let i = 0; i < strings.length; i++) {
        sql += strings[i];
        if (i < values.length) {
          const value = values[i];
          if (
            value &&
            typeof value === 'object' &&
            Array.isArray((value as { strings?: string[] }).strings)
          ) {
            const nested = value as { strings: string[]; values: unknown[] };
            let nestedSql = '';
            for (let j = 0; j < nested.strings.length; j++) {
              nestedSql += nested.strings[j];
              if (j < nested.values.length) {
                nestedSql += JSON.stringify(nested.values[j]);
              }
            }
            sql += nestedSql;
          } else {
            sql += JSON.stringify(value);
          }
        }
      }
      return sql;
    }

    beforeEach(() => {
      mockPrisma.$queryRaw.mockResolvedValue(rawRows);
    });

    afterEach(() => {
      mockPrisma.$queryRaw.mockReset();
    });

    it('should query with $queryRaw scoped to the authenticated user', async () => {
      await service.getCharts({ pozo: 'POZO CHICHIMENE-01' }, USUARIO_A);

      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);

      const sql = flattenSql(mockPrisma.$queryRaw);
      expect(sql).toContain('usuario_id');
      expect(sql).toContain(USUARIO_A);
      expect(sql).toContain('deleted_at IS NULL');
      expect(sql).toContain('pozo ILIKE');
      expect(sql).toContain('%POZO CHICHIMENE-01%');
    });

    it('should filter the date range using date casts without timezone conversion', async () => {
      await service.getCharts(
        { pozo: 'POZO CHICHIMENE-01', fechaInicio: '2026-06-01', fechaFin: '2026-06-30' },
        USUARIO_A,
      );

      const sql = flattenSql(mockPrisma.$queryRaw);
      expect(sql).toContain('2026-06-01');
      expect(sql).toContain('2026-06-30');
      expect(sql).toContain('::date');
      expect(sql).toContain('fecha >=');
      expect(sql).toContain('fecha <=');
    });

    it('should not filter by a date that is not provided', async () => {
      await service.getCharts({ pozo: 'POZO CHICHIMENE-01', fechaInicio: '2026-06-01' }, USUARIO_A);

      const sql = flattenSql(mockPrisma.$queryRaw);
      expect(sql).toContain('2026-06-01');
      expect(sql).toContain('::date');
      expect(sql).not.toContain('fecha <=');
    });

    it('should build variables from the records of the authenticated user', async () => {
      const result = await service.getCharts({ pozo: 'POZO CHICHIMENE-01' }, USUARIO_A);

      expect(result.pozo).toBe('POZO CHICHIMENE-01');
      expect(result.variables).toHaveLength(6);
      expect(result.variables[0]).toMatchObject({ id: 'presion-cabeza' });
      expect(result.variables[0].datos).toHaveLength(1);
      expect(result.variables[0].datos[0]).toEqual({ fecha: '2026-06-30', valor: 2340 });
      expect(result.variables[0].valorActual).toBe(2340);
    });

    it('should return empty datos when there are no records', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.getCharts({ pozo: 'POZO SIN DATOS' }, USUARIO_A);

      expect(result.variables).toHaveLength(6);
      result.variables.forEach((variable) => {
        expect(variable.datos).toHaveLength(0);
        expect(variable.valorActual).toBe(0);
      });
    });
  });
});
