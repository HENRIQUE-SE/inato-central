import type { CodigoPermissaoAcesso } from "./constants";
import type { ContextoAcesso } from "./types";

export function possuiPermissao(contexto: ContextoAcesso, codigoPermissao: CodigoPermissaoAcesso): boolean {
  return contexto.vinculo.ativo && contexto.perfil.ativo && contexto.permissoes.some(({ codigo }) => codigo === codigoPermissao);
}
