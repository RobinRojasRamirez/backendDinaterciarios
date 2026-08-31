import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { RecordsService } from '../services/records.service';
import { CreateRecordDto } from '../dto/create-record.dto';
import { UpdateRecordDto } from '../dto/update-record.dto';
import { QueryRecordsDto } from '../dto/query-records.dto';
import { ChartsQueryDto } from '../dto/charts-query.dto';
import { RecordResponseDto } from '../dto/record-response.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PaginatedResponse } from '../../../common/interfaces/api-response.interface';

@ApiTags('Registros')
@ApiBearerAuth()
@Controller('registros')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo registro operativo' })
  async create(
    @Body() dto: CreateRecordDto,
    @CurrentUser('sub') usuarioId: string,
  ): Promise<RecordResponseDto> {
    return this.recordsService.create(dto, usuarioId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar registros (con filtros y paginacion)' })
  @ApiOkResponse({ description: 'Lista paginada de registros' })
  async findAll(
    @Query() query: QueryRecordsDto,
    @CurrentUser('sub') usuarioId: string,
  ): Promise<PaginatedResponse<RecordResponseDto>> {
    return this.recordsService.findAll(query, usuarioId);
  }

  @Get('charts')
  @ApiOperation({ summary: 'Obtener datos para graficas por pozo' })
  @ApiOkResponse({ description: 'Datos de graficas agrupados por variable' })
  async getCharts(
    @Query() query: ChartsQueryDto,
    @CurrentUser('sub') usuarioId: string,
  ) {
    return this.recordsService.getCharts(query, usuarioId);
  }

  @Get('pozos')
  @ApiOperation({ summary: 'Obtener lista de pozos existentes (sin duplicados)' })
  @ApiOkResponse({ description: 'Lista de nombres de pozos distintos' })
  async getPozos(
    @CurrentUser('sub') usuarioId: string,
  ): Promise<string[]> {
    return this.recordsService.getPozos(usuarioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener registro por ID' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') usuarioId: string,
  ): Promise<RecordResponseDto> {
    return this.recordsService.findById(id, usuarioId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar registro' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecordDto,
    @CurrentUser('sub') usuarioId: string,
  ): Promise<RecordResponseDto> {
    return this.recordsService.update(id, dto, usuarioId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar registro (soft delete)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') usuarioId: string,
  ): Promise<void> {
    return this.recordsService.remove(id, usuarioId);
  }
}
