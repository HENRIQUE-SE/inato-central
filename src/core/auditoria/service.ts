import {
  adicionarRegistroAuditoriaInterno,
  limparRegistrosAuditoriaInternos,
  listarRegistrosAuditoriaInternos,
  obterRegistroAuditoriaInternoPorId,
} from "./data";
import type {
  EntradaRegistroAuditoria,
  RegistroAuditoria,
  ValorAuditoria,
} from "./types";

function congelarProfundamente(valor: ValorAuditoria): void {
  if (valor === null || typeof valor !== "object") {
    return;
  }

  if (Array.isArray(valor)) {
    valor.forEach(congelarProfundamente);
  } else {
    Object.values(valor).forEach(congelarProfundamente);
  }

  Object.freeze(valor);
}

function copiarDetalhes(
  detalhes: Readonly<Record<string, ValorAuditoria>> | null
): Readonly<Record<string, ValorAuditoria>> | null {
  return detalhes === null ? null : structuredClone(detalhes);
}

function copiarECongelarDetalhes(
  detalhes: Readonly<Record<string, ValorAuditoria>> | null
): Readonly<Record<string, ValorAuditoria>> | null {
  const copia = copiarDetalhes(detalhes);

  if (copia !== null) {
    congelarProfundamente(copia);
  }

  return copia;
}

function copiarRegistro(
  registro: Readonly<RegistroAuditoria>
): RegistroAuditoria {
  return {
    ...registro,
    detalhes: copiarDetalhes(registro.detalhes),
  };
}

export function registrarEventoAuditoria(
  entrada: EntradaRegistroAuditoria
): RegistroAuditoria {
  const registro = Object.freeze<RegistroAuditoria>({
    ...entrada,
    id: crypto.randomUUID(),
    detalhes: copiarECongelarDetalhes(entrada.detalhes),
    criadoEm: new Date().toISOString(),
  });

  adicionarRegistroAuditoriaInterno(registro);

  return copiarRegistro(registro);
}

export function listarEventosAuditoria(): RegistroAuditoria[] {
  return listarRegistrosAuditoriaInternos()
    .toSorted(
      (primeiro, segundo) =>
        Date.parse(segundo.criadoEm) - Date.parse(primeiro.criadoEm)
    )
    .map(copiarRegistro);
}

export function obterEventoAuditoriaPorId(
  id: string
): RegistroAuditoria | null {
  const registro = obterRegistroAuditoriaInternoPorId(id);

  return registro === null ? null : copiarRegistro(registro);
}

export function limparEventosAuditoriaParaTestes(): void {
  limparRegistrosAuditoriaInternos();
}
