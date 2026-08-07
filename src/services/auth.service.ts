export type UsuarioAutenticado = { readonly id: string; readonly email: string };
export type SessaoAutenticada = { readonly usuarioId: string; readonly expiraEm: number | null };

type UsuarioRepositorio = { id: string; email?: string | null };
type SessaoRepositorio = { user: UsuarioRepositorio; expires_at?: number };
type DependenciasAuth = {
  entrarComEmailSenha: (email: string, senha: string) => Promise<UsuarioRepositorio>;
  sair: () => Promise<void>;
  obterUsuarioAutenticado: () => Promise<UsuarioRepositorio | null>;
  obterSessaoAutenticada: () => Promise<SessaoRepositorio | null>;
};

async function dependenciasPadrao(): Promise<DependenciasAuth> {
  return import("@/lib/auth/auth.repository");
}

function usuarioSeguro(usuario: UsuarioRepositorio): UsuarioAutenticado {
  return { id: usuario.id, email: usuario.email ?? "" };
}

export async function entrar(email: string, senha: string, dependencias?: DependenciasAuth): Promise<UsuarioAutenticado> {
  try {
    const deps = dependencias ?? await dependenciasPadrao();
    return usuarioSeguro(await deps.entrarComEmailSenha(email, senha));
  } catch {
    throw new Error("Não foi possível entrar. Verifique o e-mail e a senha.");
  }
}

export async function sairDaPlataforma(dependencias?: DependenciasAuth): Promise<void> {
  try {
    const deps = dependencias ?? await dependenciasPadrao();
    await deps.sair();
  } catch {
    throw new Error("Não foi possível encerrar a sessão.");
  }
}

export async function obterUsuarioAtualAutenticado(dependencias?: DependenciasAuth): Promise<UsuarioAutenticado | null> {
  try {
    const deps = dependencias ?? await dependenciasPadrao();
    const usuario = await deps.obterUsuarioAutenticado();
    return usuario === null ? null : usuarioSeguro(usuario);
  } catch {
    throw new Error("Não foi possível verificar o usuário autenticado.");
  }
}

export async function obterSessaoAtualAutenticada(dependencias?: DependenciasAuth): Promise<SessaoAutenticada | null> {
  try {
    const deps = dependencias ?? await dependenciasPadrao();
    const sessao = await deps.obterSessaoAutenticada();
    return sessao === null ? null : { usuarioId: sessao.user.id, expiraEm: sessao.expires_at ?? null };
  } catch {
    throw new Error("Não foi possível verificar a sessão autenticada.");
  }
}
