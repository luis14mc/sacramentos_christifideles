import { describe, expect, it } from 'vitest';
import {
  configGeneralUpdateSchema,
  grupoCreateSchema,
  permisoPostSchema,
  rolParroquialCreateSchema,
  sectorCreateSchema,
  setupSchema,
  usuarioCreateSchema,
  usuarioUpdateSchema,
} from '@/lib/validators/schemas';

describe('usuarioCreateSchema', () => {
  it('acepta datos válidos', () => {
    expect(
      usuarioCreateSchema.safeParse({
        nombre: 'Admin',
        email: 'admin@test.com',
        password: 'password123',
        rol: 'Admin Parroquia',
      }).success
    ).toBe(true);
  });

  it('rechaza contraseña corta', () => {
    expect(
      usuarioCreateSchema.safeParse({
        nombre: 'Admin',
        email: 'admin@test.com',
        password: '123',
        rol: 'Admin',
      }).success
    ).toBe(false);
  });
});

describe('usuarioUpdateSchema', () => {
  it('requiere id', () => {
    expect(usuarioUpdateSchema.safeParse({ nombre: 'X' }).success).toBe(false);
  });
});

describe('configGeneralUpdateSchema', () => {
  it('acepta parroquia parcial', () => {
    expect(
      configGeneralUpdateSchema.safeParse({
        parroquia: { nombre: 'San José' },
      }).success
    ).toBe(true);
  });
});

describe('sectorCreateSchema', () => {
  it('requiere nombre y tipo', () => {
    expect(
      sectorCreateSchema.safeParse({ id_tipo_sector_parroquial: 1 }).success
    ).toBe(false);
  });
});

describe('permisoPostSchema', () => {
  it('acepta permisos válidos', () => {
    expect(
      permisoPostSchema.safeParse({
        id_rol: 1,
        id_pagina: 2,
        permisos: { leer: true, escribir: false },
      }).success
    ).toBe(true);
  });
});

describe('rolParroquialCreateSchema', () => {
  it('requiere nombre', () => {
    expect(rolParroquialCreateSchema.safeParse({}).success).toBe(false);
  });
});

describe('grupoCreateSchema', () => {
  it('acepta grupo con descripción', () => {
    expect(
      grupoCreateSchema.safeParse({
        nombre: 'Catequesis',
        descripcion: 'Grupo juvenil',
      }).success
    ).toBe(true);
  });
});

describe('setupSchema', () => {
  it('valida instalación inicial', () => {
    expect(
      setupSchema.safeParse({
        nombreParroquia: 'Parroquia Test',
        municipio: '0801',
        direccion: 'Calle 1',
        nombreAdmin: 'Padre',
        emailAdmin: 'padre@test.com',
        passwordAdmin: 'securepass',
      }).success
    ).toBe(true);
  });
});
