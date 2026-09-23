import type { PreferenciaContextoOperacional } from "@/core/organizacao";

export const CHAVE_PREFERENCIA_CONTEXTO_OPERACIONAL =
  "inato-central:contexto-operacional:preferencia:v1";

export type ArmazenamentoPreferenciaContextoOperacional = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

function obterSessionStorage(): ArmazenamentoPreferenciaContextoOperacional | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function preferenciaValida(valor: unknown): valor is PreferenciaContextoOperacional {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) return false;
  const registro = valor as Record<string, unknown>;
  const chaves = Object.keys(registro).sort();
  return chaves.length === 2
    && chaves[0] === "unidadeId"
    && chaves[1] === "usuarioId"
    && typeof registro.usuarioId === "string"
    && registro.usuarioId.trim().length > 0
    && typeof registro.unidadeId === "string"
    && registro.unidadeId.trim().length > 0;
}

export function removerPreferenciaContextoOperacional(
  armazenamento: ArmazenamentoPreferenciaContextoOperacional | null = obterSessionStorage()
): void {
  try {
    armazenamento?.removeItem(CHAVE_PREFERENCIA_CONTEXTO_OPERACIONAL);
  } catch {
    // Preferência local indisponível não pode interromper a aplicação.
  }
}

export function obterPreferenciaContextoOperacional(
  armazenamento: ArmazenamentoPreferenciaContextoOperacional | null = obterSessionStorage()
): PreferenciaContextoOperacional | null {
  if (armazenamento === null) return null;
  try {
    const serializada = armazenamento.getItem(CHAVE_PREFERENCIA_CONTEXTO_OPERACIONAL);
    if (serializada === null) return null;
    const valor: unknown = JSON.parse(serializada);
    if (!preferenciaValida(valor)) {
      removerPreferenciaContextoOperacional(armazenamento);
      return null;
    }
    return {
      usuarioId: valor.usuarioId.trim(),
      unidadeId: valor.unidadeId.trim(),
    };
  } catch {
    removerPreferenciaContextoOperacional(armazenamento);
    return null;
  }
}

export function salvarPreferenciaContextoOperacional(
  preferencia: PreferenciaContextoOperacional,
  armazenamento: ArmazenamentoPreferenciaContextoOperacional | null = obterSessionStorage()
): boolean {
  const usuarioId = preferencia.usuarioId.trim();
  const unidadeId = preferencia.unidadeId.trim();
  if (armazenamento === null || !usuarioId || !unidadeId) return false;
  try {
    armazenamento.setItem(
      CHAVE_PREFERENCIA_CONTEXTO_OPERACIONAL,
      JSON.stringify({ usuarioId, unidadeId })
    );
    return true;
  } catch {
    return false;
  }
}
