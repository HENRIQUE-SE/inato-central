import type { ContextoOrganizacional } from "../organizacao";
import type {
  CodigoPerfilIdentidade,
  EstadoIdentidade,
  EstadoSessaoIdentidade,
} from "./constants";

export type UsuarioIdentidade = {
  readonly id: string;
  readonly nome: string;
  readonly email: string;
  readonly estado: EstadoIdentidade;
  readonly criadoEm: string;
  readonly atualizadoEm: string;
  readonly arquivadoEm: string | null;
};

export type PerfilIdentidade = {
  readonly id: string;
  readonly codigo: CodigoPerfilIdentidade;
  readonly nome: string;
  readonly descricao: string;
  readonly estado: EstadoIdentidade;
  readonly criadoEm: string;
  readonly atualizadoEm: string;
};

export type SessaoIdentidade = {
  readonly id: string;
  readonly usuarioId: string;
  readonly perfilId: string;
  readonly empresaId: string;
  readonly unidadeId: string | null;
  readonly estado: EstadoSessaoIdentidade;
  readonly iniciadaEm: string;
  readonly encerradaEm: string | null;
};

export type ContextoIdentidadeAtual = {
  readonly usuario: UsuarioIdentidade;
  readonly perfil: PerfilIdentidade;
  readonly sessao: SessaoIdentidade;
  readonly organizacao: ContextoOrganizacional;
};
