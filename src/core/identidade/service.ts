import { obterContextoOrganizacional } from "../organizacao";
import {
  obterPerfilAtualInterno,
  obterSessaoAtualInterna,
  obterUsuarioAtualInterno,
} from "./data";
import type {
  ContextoIdentidadeAtual,
  PerfilIdentidade,
  SessaoIdentidade,
  UsuarioIdentidade,
} from "./types";

export function obterUsuarioAtual(): UsuarioIdentidade {
  return { ...obterUsuarioAtualInterno() };
}

export function obterPerfilAtual(): PerfilIdentidade {
  return { ...obterPerfilAtualInterno() };
}

export function obterSessaoAtual(): SessaoIdentidade {
  return { ...obterSessaoAtualInterna() };
}

export function obterContextoIdentidadeAtual(): ContextoIdentidadeAtual {
  return {
    usuario: obterUsuarioAtual(),
    perfil: obterPerfilAtual(),
    sessao: obterSessaoAtual(),
    organizacao: { ...obterContextoOrganizacional() },
  };
}
