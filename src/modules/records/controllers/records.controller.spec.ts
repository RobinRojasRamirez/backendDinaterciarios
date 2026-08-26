import { Test, TestingModule } from '@nestjs/testing';
import { RecordsController } from './records.controller';
import { RecordsService } from '../services/records.service';
import { CreateRecordDto } from '../dto/create-record.dto';
import { UpdateRecordDto } from '../dto/update-record.dto';

const USUARIO_A = 'uuid-user-A';

const mockRecordsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  getCharts: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('RecordsController', () => {
  let controller: RecordsController;
  let service: RecordsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordsController],
      providers: [
        { provide: RecordsService, useValue: mockRecordsService },
      ],
    }).compile();

    controller = module.get<RecordsController>(RecordsController);
    service = module.get<RecordsService>(RecordsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateRecordDto = {
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

    it('should pass the authenticated user id to the service', async () => {
      mockRecordsService.create.mockResolvedValue({ id: 'uuid-reg-1' });

      await controller.create(dto, USUARIO_A);

      expect(service.create).toHaveBeenCalledWith(dto, USUARIO_A);
    });
  });

  describe('findAll', () => {
    it('should pass the authenticated user id and the query to the service', async () => {
      mockRecordsService.findAll.mockResolvedValue({ data: [], total: 0 });

      await controller.findAll({ pozo: 'CHICHIMENE' }, USUARIO_A);

      expect(service.findAll).toHaveBeenCalledWith(
        { pozo: 'CHICHIMENE' },
        USUARIO_A,
      );
    });
  });

  describe('getCharts', () => {
    it('should pass the authenticated user id and the query to the service', async () => {
      mockRecordsService.getCharts.mockResolvedValue({ pozo: 'POZO', variables: [] });

      await controller.getCharts({ pozo: 'POZO CHICHIMENE-01' }, USUARIO_A);

      expect(service.getCharts).toHaveBeenCalledWith(
        { pozo: 'POZO CHICHIMENE-01' },
        USUARIO_A,
      );
    });
  });

  describe('findById', () => {
    it('should pass the authenticated user id and the id to the service', async () => {
      mockRecordsService.findById.mockResolvedValue({ id: 'uuid-reg-1' });

      await controller.findById('uuid-reg-1', USUARIO_A);

      expect(service.findById).toHaveBeenCalledWith('uuid-reg-1', USUARIO_A);
    });
  });

  describe('update', () => {
    const dto: UpdateRecordDto = { operador: 'Nuevo Operador' };

    it('should pass the authenticated user id, id and dto to the service', async () => {
      mockRecordsService.update.mockResolvedValue({ id: 'uuid-reg-1' });

      await controller.update('uuid-reg-1', dto, USUARIO_A);

      expect(service.update).toHaveBeenCalledWith('uuid-reg-1', dto, USUARIO_A);
    });
  });

  describe('remove', () => {
    it('should pass the authenticated user id and the id to the service', async () => {
      mockRecordsService.remove.mockResolvedValue(undefined);

      await controller.remove('uuid-reg-1', USUARIO_A);

      expect(service.remove).toHaveBeenCalledWith('uuid-reg-1', USUARIO_A);
    });
  });
});
