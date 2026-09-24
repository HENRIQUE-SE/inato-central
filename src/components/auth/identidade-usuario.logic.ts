import type { ContextoAcessoAutenticado } from "@/services/acesso.service";

export type IdentidadeUsuarioVisual = {
  readonly perfil: string;
  readonly identificacao: string;
  readonly inicial: string;
};

function humanizarCodigoPerfil(codigo: string): string {
  return codigo
    .trim()
    .split("_")
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toLocaleUpperCase("pt-BR") + parte.slice(1).toLocaleLowerCase("pt-BR"))
    .join(" ");
}

export function criarIdentidadeUsuarioVisual(
  autoridade: ContextoAcessoAutenticado
): IdentidadeUsuarioVisual | null {
  const identificacao = autoridade.usuario.email.trim();
  const perfilPersistido = autoridade.contexto.perfil.nome.trim();
  const perfil = perfilPersistido || humanizarCodigoPerfil(autoridade.contexto.perfil.codigo);
  if (!identificacao || !perfil) return null;

  return {
    perfil,
    identificacao,
    inicial: Array.from(identificacao)[0]?.toLocaleUpperCase("pt-BR") ?? "?",
  };
}
