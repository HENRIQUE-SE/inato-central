import type { CodigoPerfilAcesso, CodigoPermissaoAcesso } from "./constants";

export type PerfilAcesso = { readonly id: string; readonly codigo: CodigoPerfilAcesso; readonly nome: string; readonly descricao: string | null; readonly ativo: boolean; readonly criadoEm: string };
export type PermissaoAcesso = { readonly id: string; readonly codigo: CodigoPermissaoAcesso; readonly nome: string; readonly descricao: string | null; readonly criadoEm: string };
export type VinculoAcesso = { readonly id: string; readonly usuarioId: string; readonly empresaId: string; readonly unidadeId: string | null; readonly perfilId: string; readonly ativo: boolean; readonly criadoEm: string };
export type ContextoAcesso = { readonly vinculo: VinculoAcesso; readonly perfil: PerfilAcesso; readonly permissoes: readonly PermissaoAcesso[] };
