import type {
  ContextoOperacionalAtivo,
  UnidadeOperacionalPermitida,
} from "@/core/organizacao";
import type { ResultadoContextoOperacionalAtivo } from "@/services/contexto-operacional.service";

export type ContextoResolvidoVisual = {
  readonly contexto: ContextoOperacionalAtivo;
  readonly unidade: UnidadeOperacionalPermitida;
  readonly unidades: readonly UnidadeOperacionalPermitida[];
};

export type EstadoContextoOperacionalVisual =
  | { readonly estado: "carregando" }
  | { readonly estado: "nao_autenticado" }
  | {
      readonly estado: "selecao_necessaria";
      readonly unidades: readonly UnidadeOperacionalPermitida[];
      readonly erro: string | null;
      readonly contextoAnterior: ContextoResolvidoVisual | null;
    }
  | ({ readonly estado: "contexto_resolvido" } & ContextoResolvidoVisual)
  | { readonly estado: "erro_infraestrutura"; readonly mensagem: string };

export type DependenciasContextoOperacionalVisual = {
  readonly obterContexto: () => Promise<ResultadoContextoOperacionalAtivo>;
  readonly definirContexto: (unidadeId: string) => Promise<ResultadoContextoOperacionalAtivo>;
  readonly obterUnidades: () => Promise<readonly UnidadeOperacionalPermitida[]>;
};

function mensagemDoErro(erro: unknown): string {
  return erro instanceof Error && erro.message.trim()
    ? erro.message
    : "Não foi possível resolver o contexto operacional.";
}

function unidadeCorrespondeAoContexto(
  unidade: UnidadeOperacionalPermitida,
  contexto: ContextoOperacionalAtivo
): boolean {
  return unidade.redeId === contexto.redeId
    && unidade.operacaoId === contexto.operacaoId
    && unidade.areaOperacionalId === contexto.areaOperacionalId
    && unidade.empresaId === contexto.empresaId
    && unidade.unidadeId === contexto.unidadeId;
}

function contextoResolvido(
  contexto: ContextoOperacionalAtivo,
  unidades: readonly UnidadeOperacionalPermitida[]
): EstadoContextoOperacionalVisual {
  const unidade = unidades.find((item) => unidadeCorrespondeAoContexto(item, contexto));
  if (!unidade) {
    return {
      estado: "erro_infraestrutura",
      mensagem: "A Unidade ativa não foi encontrada no catálogo autorizado.",
    };
  }
  return { estado: "contexto_resolvido", contexto, unidade, unidades };
}

export async function resolverEstadoContextoOperacional(
  dependencias: DependenciasContextoOperacionalVisual
): Promise<EstadoContextoOperacionalVisual> {
  try {
    const resultado = await dependencias.obterContexto();
    if (resultado.estado === "nao_autenticado") return resultado;
    const unidades = await dependencias.obterUnidades();
    if (resultado.estado === "selecao_necessaria") {
      return {
        estado: "selecao_necessaria",
        unidades,
        erro: null,
        contextoAnterior: null,
      };
    }
    return contextoResolvido(resultado.contexto, unidades);
  } catch (erro) {
    return { estado: "erro_infraestrutura", mensagem: mensagemDoErro(erro) };
  }
}

export async function selecionarContextoOperacional(
  unidadeId: string,
  unidades: readonly UnidadeOperacionalPermitida[],
  contextoAnterior: ContextoResolvidoVisual | null,
  dependencias: DependenciasContextoOperacionalVisual
): Promise<EstadoContextoOperacionalVisual> {
  try {
    const resultado = await dependencias.definirContexto(unidadeId);
    if (resultado.estado === "nao_autenticado") return resultado;
    if (resultado.estado === "selecao_necessaria") {
      return {
        estado: "selecao_necessaria",
        unidades,
        erro: "A Unidade selecionada não está autorizada.",
        contextoAnterior,
      };
    }
    return contextoResolvido(resultado.contexto, unidades);
  } catch (erro) {
    return { estado: "erro_infraestrutura", mensagem: mensagemDoErro(erro) };
  }
}

export function childrenPodemSerMontados(
  estado: EstadoContextoOperacionalVisual
): estado is Extract<EstadoContextoOperacionalVisual, { estado: "contexto_resolvido" }> {
  return estado.estado === "contexto_resolvido";
}

export function deveRecarregarPaginaAposSelecao(
  estado: EstadoContextoOperacionalVisual,
  contextoAnterior: ContextoResolvidoVisual | null
): boolean {
  return estado.estado === "contexto_resolvido" && contextoAnterior !== null;
}
