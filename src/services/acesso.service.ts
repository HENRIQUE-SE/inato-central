import { contextoOperacionalCorrespondeAUnidade, criarContextoOperacionalDaUnidade, derivarContextoOperacionalAtivo, possuiPermissao, type CodigoPermissaoAcesso, type ContextoAcesso } from "@/core/acesso";
import type { ContextoOperacionalAtivo, SelecaoContextoOperacional, UnidadeOperacionalPermitida } from "@/core/organizacao";
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

export class ErroSelecaoContextoOperacionalNaoAutorizada extends Error {
  constructor() {
    super("Seleção de contexto não autorizada.");
    this.name = "ErroSelecaoContextoOperacionalNaoAutorizada";
  }
}

export function ehErroSelecaoContextoOperacionalNaoAutorizada(
  erro: unknown
): erro is ErroSelecaoContextoOperacionalNaoAutorizada {
  return erro instanceof ErroSelecaoContextoOperacionalNaoAutorizada;
}

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

export async function obterContextoOperacionalAtivoAtual(
  dependencias: DependenciasAcesso = DEPENDENCIAS_PADRAO
): Promise<ContextoOperacionalAtivo | null> {
  const contexto = await obterContextoAcessoAtual(dependencias);
  return contexto === null ? null : derivarContextoOperacionalAtivo(contexto.vinculo);
}

async function listarUnidadesPersistidas(vinculo: ContextoAcesso["vinculo"]): Promise<UnidadeOperacionalPermitida[]> {
  const { listarUnidadesOperacionaisPermitidas } = await import("@/lib/organizacao/organizacao.repository");
  return listarUnidadesOperacionaisPermitidas(vinculo);
}

async function obterUnidadePersistida(
  vinculo: ContextoAcesso["vinculo"],
  unidadeId: string
): Promise<UnidadeOperacionalPermitida | null> {
  const { obterUnidadeOperacionalPermitida } = await import("@/lib/organizacao/organizacao.repository");
  return obterUnidadeOperacionalPermitida(vinculo, unidadeId);
}

export async function obterUnidadesOperacionaisPermitidasAtuais(
  dependencias: DependenciasAcesso = DEPENDENCIAS_PADRAO,
  listar: (vinculo: ContextoAcesso["vinculo"]) => Promise<UnidadeOperacionalPermitida[]> = listarUnidadesPersistidas
): Promise<UnidadeOperacionalPermitida[]> {
  const contexto = await obterContextoAcessoAtual(dependencias);
  return contexto === null ? [] : listar(contexto.vinculo);
}

export async function contextoOperacionalSolicitadoEhPermitido(
  contextoSolicitado: ContextoOperacionalAtivo,
  dependencias: DependenciasAcesso = DEPENDENCIAS_PADRAO,
  listar: (vinculo: ContextoAcesso["vinculo"]) => Promise<UnidadeOperacionalPermitida[]> = listarUnidadesPersistidas
): Promise<boolean> {
  const unidades = await obterUnidadesOperacionaisPermitidasAtuais(dependencias, listar);
  return unidades.some((unidade) => contextoOperacionalCorrespondeAUnidade(contextoSolicitado, unidade));
}

export async function resolverContextoOperacionalAtivoAtual(
  selecao: SelecaoContextoOperacional | undefined,
  dependencias: DependenciasAcesso = DEPENDENCIAS_PADRAO,
  obter: (vinculo: ContextoAcesso["vinculo"], unidadeId: string) => Promise<UnidadeOperacionalPermitida | null> = obterUnidadePersistida
): Promise<ContextoOperacionalAtivo | null> {
  const contexto = await obterContextoAcessoAtual(dependencias);
  if (contexto === null) throw new Error("Acesso não autorizado.");

  const contextoAutomatico = derivarContextoOperacionalAtivo(contexto.vinculo);
  if (contextoAutomatico !== null) {
    if (selecao !== undefined && selecao.unidadeId !== contextoAutomatico.unidadeId) {
      throw new ErroSelecaoContextoOperacionalNaoAutorizada();
    }
    return contextoAutomatico;
  }

  if (selecao === undefined) return null;
  const unidadeId = selecao.unidadeId.trim();
  if (!unidadeId) throw new ErroSelecaoContextoOperacionalNaoAutorizada();

  const unidade = await obter(contexto.vinculo, unidadeId);
  if (unidade === null) throw new ErroSelecaoContextoOperacionalNaoAutorizada();
  return criarContextoOperacionalDaUnidade(unidade);
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
