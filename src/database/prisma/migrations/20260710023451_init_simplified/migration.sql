-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "cedula" VARCHAR(10) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'USER',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acceso" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "pozo" VARCHAR(100) NOT NULL,
    "operador" VARCHAR(150) NOT NULL,
    "fecha" DATE NOT NULL,
    "presion_cabeza" DECIMAL(12,2) NOT NULL,
    "presion_anular" DECIMAL(12,2) NOT NULL,
    "velocidad" DECIMAL(12,2) NOT NULL,
    "corriente" DECIMAL(12,2) NOT NULL,
    "torque" DECIMAL(12,2) NOT NULL,
    "carga_pozo" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "registros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cedula_key" ON "usuarios"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "idx_usuarios_deleted_at" ON "usuarios"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_registros_usuario_id" ON "registros"("usuario_id");

-- CreateIndex
CREATE INDEX "idx_registros_pozo" ON "registros"("pozo");

-- CreateIndex
CREATE INDEX "idx_registros_fecha" ON "registros"("fecha");

-- CreateIndex
CREATE INDEX "idx_registros_pozo_fecha" ON "registros"("pozo", "fecha" DESC);

-- CreateIndex
CREATE INDEX "idx_registros_deleted_at" ON "registros"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_usuario_revocado" ON "refresh_tokens"("usuario_id", "revoked");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_expira" ON "refresh_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
