export { CODIGOS_ESCOPO_ACESSO, CODIGOS_PERFIL_ACESSO, CODIGOS_PERMISSAO_ACESSO, PERMISSOES_INICIAIS_POR_PERFIL } from "./constants";
export type { CodigoEscopoAcesso, CodigoPerfilAcesso, CodigoPermissaoAcesso } from "./constants";
export type { ContextoAcesso, PerfilAcesso, PermissaoAcesso, VinculoAcesso } from "./types";
export { contextoOperacionalCorrespondeAUnidade, derivarContextoOperacionalAtivo, possuiPermissao, unidadePertenceAoTerritorio, vinculoPossuiTerritorioValido } from "./service";
