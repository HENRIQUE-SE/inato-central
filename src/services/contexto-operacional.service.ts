import { derivarContextoOperacionalAtivo } from "@/core/acesso";
import type {
  ContextoOperacionalAtivo,
  PreferenciaContextoOperacional,
} from "@/core/organizacao";
import {
  obterPreferenciaContextoOperacional,
  removerPreferenciaContextoOperacional,
  salvarPreferenciaContextoOperacional,
} from "@/lib/organizacao/preferencia-contexto-operacional.repository";
import {
  ehErroSelecaoContextoOperacionalNaoAutorizada,
  obterContextoAcessoAutenticadoAtual,
  resolverContextoOperacionalAtivoAtual,
  type ContextoAcessoAutenticado,
} from "./acesso.service";

export type ResultadoContextoOperacionalAtivo =
  | { readonly estado: "nao_autenticado" }
  | { readonly estado: "selecao_necessaria" }
  | {
      readonly estado: "contexto_resolvido";
      readonly contexto: ContextoOperacionalAtivo;
    };

export type DependenciasContextoOperacional = {
  readonly obterAutoridade: () => Promise<ContextoAcessoAutenticado | null>;
  readonly obterPreferencia: () => PreferenciaContextoOperacional | null;
  readonly salvarPreferencia: (preferencia: PreferenciaContextoOperacional) => boolean;
  readonly removerPreferencia: () => void;
  readonly resolverContexto: (selecao: { readonly unidadeId: string }) => Promise<ContextoOperacionalAtivo | null>;
};

const DEPENDENCIAS_PADRAO: DependenciasContextoOperacional = {
  obterAutoridade: () => obterContextoAcessoAutenticadoAtual(),
  obterPreferencia: obterPreferenciaContextoOperacional,
  salvarPreferencia: salvarPreferenciaContextoOperacional,
  removerPreferencia: removerPreferenciaContextoOperacional,
  resolverContexto: (selecao) => resolverContextoOperacionalAtivoAtual(selecao),
};

function dependencias(
  complemento: Partial<DependenciasContextoOperacional>
): DependenciasContextoOperacional {
  return { ...DEPENDENCIAS_PADRAO, ...complemento };
}

async function resolverPreferencia(
  unidadeId: string,
  deps: DependenciasContextoOperacional
): Promise<ResultadoContextoOperacionalAtivo> {
  try {
    const contexto = await deps.resolverContexto({ unidadeId });
    if (contexto === null) {
      deps.removerPreferencia();
      return { estado: "selecao_necessaria" };
    }
    return { estado: "contexto_resolvido", contexto };
  } catch (erro) {
    if (!ehErroSelecaoContextoOperacionalNaoAutorizada(erro)) throw erro;
    deps.removerPreferencia();
    return { estado: "selecao_necessaria" };
  }
}

export async function obterContextoOperacionalPreferidoAtual(
  complemento: Partial<DependenciasContextoOperacional> = {}
): Promise<ResultadoContextoOperacionalAtivo> {
  const deps = dependencias(complemento);
  const autoridade = await deps.obterAutoridade();
  if (autoridade === null) {
    deps.removerPreferencia();
    return { estado: "nao_autenticado" };
  }

  const contextoAutomatico = derivarContextoOperacionalAtivo(autoridade.contexto.vinculo);
  if (contextoAutomatico !== null) {
    return { estado: "contexto_resolvido", contexto: contextoAutomatico };
  }

  const preferencia = deps.obterPreferencia();
  if (preferencia === null) return { estado: "selecao_necessaria" };
  if (preferencia.usuarioId !== autoridade.usuario.id) {
    deps.removerPreferencia();
    return { estado: "selecao_necessaria" };
  }
  return resolverPreferencia(preferencia.unidadeId, deps);
}

export async function definirPreferenciaContextoOperacionalAtual(
  unidadeId: string,
  complemento: Partial<DependenciasContextoOperacional> = {}
): Promise<ResultadoContextoOperacionalAtivo> {
  const deps = dependencias(complemento);
  const autoridade = await deps.obterAutoridade();
  if (autoridade === null) {
    deps.removerPreferencia();
    return { estado: "nao_autenticado" };
  }

  const resultado = await resolverPreferencia(unidadeId, deps);
  if (resultado.estado !== "contexto_resolvido") return resultado;
  deps.salvarPreferencia({
    usuarioId: autoridade.usuario.id,
    unidadeId: resultado.contexto.unidadeId,
  });
  return resultado;
}

export function limparPreferenciaContextoOperacional(
  complemento: Pick<DependenciasContextoOperacional, "removerPreferencia"> = {
    removerPreferencia: removerPreferenciaContextoOperacional,
  }
): void {
  complemento.removerPreferencia();
}
