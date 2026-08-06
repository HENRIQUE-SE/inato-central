import { obterContextoOrganizacional } from "../organizacao";
import {
  CODIGOS_PERFIL_IDENTIDADE,
  ESTADOS_IDENTIDADE,
  ESTADOS_SESSAO_IDENTIDADE,
} from "./constants";
import type {
  PerfilIdentidade,
  SessaoIdentidade,
  UsuarioIdentidade,
} from "./types";

const usuarioAtual = Object.freeze<UsuarioIdentidade>({
  id: "00000000-0000-4000-8000-000000000101",
  nome: "Charles Henrique",
  email: "",
  estado: ESTADOS_IDENTIDADE.ATIVO,
  criadoEm: "2026-08-06T00:00:00.000Z",
  atualizadoEm: "2026-08-06T00:00:00.000Z",
  arquivadoEm: null,
});

const perfilAtual = Object.freeze<PerfilIdentidade>({
  id: "00000000-0000-4000-8000-000000000102",
  codigo: CODIGOS_PERFIL_IDENTIDADE.ADMINISTRADOR,
  nome: "Administrador",
  descricao: "Acesso administrativo inicial da Plataforma INATO",
  estado: ESTADOS_IDENTIDADE.ATIVO,
  criadoEm: "2026-08-06T00:00:00.000Z",
  atualizadoEm: "2026-08-06T00:00:00.000Z",
});

const contextoOrganizacionalAtual = obterContextoOrganizacional();

const sessaoAtual = Object.freeze<SessaoIdentidade>({
  id: "00000000-0000-4000-8000-000000000103",
  usuarioId: usuarioAtual.id,
  perfilId: perfilAtual.id,
  empresaId: contextoOrganizacionalAtual.empresaId,
  unidadeId: contextoOrganizacionalAtual.unidadeId,
  estado: ESTADOS_SESSAO_IDENTIDADE.ATIVA,
  iniciadaEm: "2026-08-06T00:00:00.000Z",
  encerradaEm: null,
});

export function obterUsuarioAtualInterno(): Readonly<UsuarioIdentidade> {
  return usuarioAtual;
}

export function obterPerfilAtualInterno(): Readonly<PerfilIdentidade> {
  return perfilAtual;
}

export function obterSessaoAtualInterna(): Readonly<SessaoIdentidade> {
  return sessaoAtual;
}
