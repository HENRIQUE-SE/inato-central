import { CODIGOS_ESCOPO_ACESSO, type CodigoPermissaoAcesso } from "./constants";
import type { ContextoOperacionalAtivo } from "@/core/organizacao";
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
