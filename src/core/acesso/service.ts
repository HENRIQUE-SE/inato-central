import { CODIGOS_ESCOPO_ACESSO, type CodigoPermissaoAcesso } from "./constants";
import type { ContextoOperacionalAtivo, UnidadeOperacionalPermitida } from "@/core/organizacao";
import type { ContextoAcesso, VinculoAcesso } from "./types";

export function possuiPermissao(contexto: ContextoAcesso, codigoPermissao: CodigoPermissaoAcesso): boolean {
  return contexto.vinculo.ativo && contexto.perfil.ativo && contexto.permissoes.some(({ codigo }) => codigo === codigoPermissao);
}

export function derivarContextoOperacionalAtivo(
  vinculo: VinculoAcesso
): ContextoOperacionalAtivo | null {
  if (
    !vinculo.ativo
    || vinculo.escopoTipo !== CODIGOS_ESCOPO_ACESSO.UNIDADE
    || !vinculo.redeId
    || vinculo.operacaoId === null
    || vinculo.areaOperacionalId === null
    || vinculo.empresaId === null
    || vinculo.unidadeId === null
  ) {
    return null;
  }

  return {
    redeId: vinculo.redeId,
    operacaoId: vinculo.operacaoId,
    areaOperacionalId: vinculo.areaOperacionalId,
    empresaId: vinculo.empresaId,
    unidadeId: vinculo.unidadeId,
  };
}

export function vinculoPossuiTerritorioValido(vinculo: VinculoAcesso): boolean {
  if (!vinculo.ativo || !vinculo.redeId) return false;
  switch (vinculo.escopoTipo) {
    case CODIGOS_ESCOPO_ACESSO.REDE:
      return true;
    case CODIGOS_ESCOPO_ACESSO.OPERACAO:
      return vinculo.operacaoId !== null;
    case CODIGOS_ESCOPO_ACESSO.AREA_OPERACIONAL:
      return vinculo.operacaoId !== null && vinculo.areaOperacionalId !== null;
    case CODIGOS_ESCOPO_ACESSO.UNIDADE:
      return derivarContextoOperacionalAtivo(vinculo) !== null;
  }
}

export function unidadePertenceAoTerritorio(
  vinculo: VinculoAcesso,
  unidade: UnidadeOperacionalPermitida
): boolean {
  if (!vinculoPossuiTerritorioValido(vinculo) || unidade.redeId !== vinculo.redeId) return false;
  switch (vinculo.escopoTipo) {
    case CODIGOS_ESCOPO_ACESSO.REDE:
      return true;
    case CODIGOS_ESCOPO_ACESSO.OPERACAO:
      return unidade.operacaoId === vinculo.operacaoId;
    case CODIGOS_ESCOPO_ACESSO.AREA_OPERACIONAL:
      return unidade.operacaoId === vinculo.operacaoId
        && unidade.areaOperacionalId === vinculo.areaOperacionalId;
    case CODIGOS_ESCOPO_ACESSO.UNIDADE:
      return unidade.operacaoId === vinculo.operacaoId
        && unidade.areaOperacionalId === vinculo.areaOperacionalId
        && unidade.empresaId === vinculo.empresaId
        && unidade.unidadeId === vinculo.unidadeId;
  }
}

export function contextoOperacionalCorrespondeAUnidade(
  contexto: ContextoOperacionalAtivo,
  unidade: UnidadeOperacionalPermitida
): boolean {
  return contexto.redeId === unidade.redeId
    && contexto.operacaoId === unidade.operacaoId
    && contexto.areaOperacionalId === unidade.areaOperacionalId
    && contexto.empresaId === unidade.empresaId
    && contexto.unidadeId === unidade.unidadeId;
}
