import { possuiPermissao, type CodigoPermissaoAcesso, type ContextoAcesso } from "@/core/acesso";
import { obterUsuarioAtualAutenticado, type UsuarioAutenticado } from "./auth.service";

type DependenciasAcesso = {
  obterUsuario: () => Promise<UsuarioAutenticado | null>;
  obterContextoPersistido: (usuarioId: string) => Promise<ContextoAcesso | null>;
};

export type ContextoAcessoAutenticado = {
  readonly usuario: UsuarioAutenticado;
  readonly contexto: ContextoAcesso;
};

async function obterContextoPersistido(usuarioId: string): Promise<ContextoAcesso | null> {
  const { obterContextoPersistidoDoUsuario } = await import("@/lib/acesso/acesso.repository");
  return obterContextoPersistidoDoUsuario(usuarioId);
}

const DEPENDENCIAS_PADRAO: DependenciasAcesso = { obterUsuario: obterUsuarioAtualAutenticado, obterContextoPersistido };
const contextosEmResolucao = new WeakMap<DependenciasAcesso, Promise<ContextoAcessoAutenticado | null>>();

async function resolverContextoAcesso(dependencias: DependenciasAcesso): Promise<ContextoAcessoAutenticado | null> {
  try {
    const usuario = await dependencias.obterUsuario();
    if (usuario === null) return null;
    const contexto = await dependencias.obterContextoPersistido(usuario.id);
    return contexto !== null && contexto.vinculo.usuarioId === usuario.id ? { usuario, contexto } : null;
  } catch {
    throw new Error("Não foi possível verificar o acesso.");
  }
}

export function obterContextoAcessoAutenticadoAtual(dependencias: DependenciasAcesso = DEPENDENCIAS_PADRAO): Promise<ContextoAcessoAutenticado | null> {
  const existente = contextosEmResolucao.get(dependencias);
  if (existente) return existente;
  const resolucaoAtual = resolverContextoAcesso(dependencias);
  contextosEmResolucao.set(dependencias, resolucaoAtual);
  return resolucaoAtual.finally(() => {
    if (contextosEmResolucao.get(dependencias) === resolucaoAtual) contextosEmResolucao.delete(dependencias);
  });
}

export async function obterContextoAcessoAtual(dependencias: DependenciasAcesso = DEPENDENCIAS_PADRAO): Promise<ContextoAcesso | null> {
  return (await obterContextoAcessoAutenticadoAtual(dependencias))?.contexto ?? null;
}

export async function usuarioAtualPossuiPermissao(codigo: CodigoPermissaoAcesso, dependencias: DependenciasAcesso = DEPENDENCIAS_PADRAO): Promise<boolean> {
  const contexto = await obterContextoAcessoAtual(dependencias);
  return contexto !== null && possuiPermissao(contexto, codigo);
}

export async function exigirPermissao(codigo: CodigoPermissaoAcesso, dependencias: DependenciasAcesso = DEPENDENCIAS_PADRAO): Promise<ContextoAcesso> {
  try {
    const contexto = await obterContextoAcessoAtual(dependencias);
    if (contexto === null || !possuiPermissao(contexto, codigo)) throw new Error("negado");
    return contexto;
  } catch {
    throw new Error("Acesso não autorizado.");
  }
}
