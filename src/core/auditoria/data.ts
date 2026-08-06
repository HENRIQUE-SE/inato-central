import type { RegistroAuditoria } from "./types";

const registrosAuditoria: Readonly<RegistroAuditoria>[] = [];

export function adicionarRegistroAuditoriaInterno(
  registro: Readonly<RegistroAuditoria>
): void {
  registrosAuditoria.unshift(registro);
}

export function listarRegistrosAuditoriaInternos(): readonly Readonly<RegistroAuditoria>[] {
  return [...registrosAuditoria];
}

export function obterRegistroAuditoriaInternoPorId(
  id: string
): Readonly<RegistroAuditoria> | null {
  return registrosAuditoria.find((registro) => registro.id === id) ?? null;
}

export function limparRegistrosAuditoriaInternos(): void {
  registrosAuditoria.length = 0;
}
