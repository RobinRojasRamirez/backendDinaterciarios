import { PrismaClient, Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  const adminPassword = await bcrypt.hash('123456', 10);
  const userPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.usuario.upsert({
    where: { cedula: '1234567890' },
    update: {},
    create: {
      cedula: '1234567890',
      nombre: 'Administrador ECOPETROL',
      email: 'admin@ecopetrol.com',
      passwordHash: adminPassword,
      rol: Rol.ADMIN,
    },
  });

  const user = await prisma.usuario.upsert({
    where: { cedula: '9876543210' },
    update: {},
    create: {
      cedula: '9876543210',
      nombre: 'Operador de Campo',
      email: 'operador@ecopetrol.com',
      passwordHash: userPassword,
      rol: Rol.USER,
    },
  });

  console.log(`✓ Usuarios creados: ${admin.nombre}, ${user.nombre}`);

  const registrosData = [
    {
      pozo: 'POZO CHICHIMENE-01',
      operador: 'Carlos Andres Martinez',
      fecha: '2026-06-30',
      presionCabeza: 2340,
      presionAnular: 1850,
      velocidad: 120,
      corriente: 45.2,
      torque: 850,
      cargaPozo: 72,
    },
    {
      pozo: 'POZO CUSIANA-04',
      operador: 'Maria Fernanda Lopez',
      fecha: '2026-06-30',
      presionCabeza: 2180,
      presionAnular: 1720,
      velocidad: 95,
      corriente: 38.7,
      torque: 720,
      cargaPozo: 65,
    },
    {
      pozo: 'POZO APIAY-03',
      operador: 'Jorge Enrique Reyes',
      fecha: '2026-06-29',
      presionCabeza: 2560,
      presionAnular: 1980,
      velocidad: 145,
      corriente: 52.1,
      torque: 940,
      cargaPozo: 85,
    },
    {
      pozo: 'POZO CASTILLA-07',
      operador: 'Diana Patricia Soto',
      fecha: '2026-06-29',
      presionCabeza: 1920,
      presionAnular: 1550,
      velocidad: 88,
      corriente: 32.4,
      torque: 610,
      cargaPozo: 58,
    },
    {
      pozo: 'POZO CHICHIMENE-02',
      operador: 'Andres Felipe Rincon',
      fecha: '2026-06-28',
      presionCabeza: 2410,
      presionAnular: 1900,
      velocidad: 132,
      corriente: 48.9,
      torque: 880,
      cargaPozo: 78,
    },
  ];

  for (const r of registrosData) {
    await prisma.registro.create({
      data: {
        usuarioId: admin.id,
        pozo: r.pozo,
        operador: r.operador,
        fecha: new Date(r.fecha),
        presionCabeza: r.presionCabeza,
        presionAnular: r.presionAnular,
        velocidad: r.velocidad,
        corriente: r.corriente,
        torque: r.torque,
        cargaPozo: r.cargaPozo,
      },
    });
  }

  console.log(`✓ Registros de ejemplo creados: ${registrosData.length}`);
  console.log('✅ Seed completado exitosamente');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
