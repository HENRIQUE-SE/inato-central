import { supabase } from "@/lib/supabase";
import { obterContextoOrganizacional } from "@/core/organizacao";
import type { CodigoPerfilAcesso, CodigoPermissaoAcesso, ContextoAcesso, PerfilAcesso, PermissaoAcesso, VinculoAcesso } from "@/core/acesso";

type LinhaVinculo = { id: string; usuario_id: string; empresa_id: string; unidade_id: string | null; perfil_id: string; ativo: boolean; criado_em: string };
type LinhaPerfil = { id: string; codigo: CodigoPerfilAcesso; nome: string; descricao: string | null; ativo: boolean; criado_em: string };
type LinhaPermissao = { id: string; codigo: CodigoPermissaoAcesso; nome: string; descricao: string | null; criado_em: string };
type LinhaPerfilPermissao = { permissao_id: string };

function mapearVinculo(linha: LinhaVinculo): VinculoAcesso { return { id: linha.id, usuarioId: linha.usuario_id, empresaId: linha.empresa_id, unidadeId: linha.unidade_id, perfilId: linha.perfil_id, ativo: linha.ativo, criadoEm: linha.criado_em }; }
function mapearPerfil(linha: LinhaPerfil): PerfilAcesso { return { id: linha.id, codigo: linha.codigo, nome: linha.nome, descricao: linha.descricao, ativo: linha.ativo, criadoEm: linha.criado_em }; }
function mapearPermissao(linha: LinhaPermissao): PermissaoAcesso { return { id: linha.id, codigo: linha.codigo, nome: linha.nome, descricao: linha.descricao, criadoEm: linha.criado_em }; }

export async function obterVinculoDoUsuario(usuarioId: string): Promise<VinculoAcesso | null> {
  const { empresaId } = obterContextoOrganizacional();
  const { data, error } = await supabase.from("usuarios_perfis").select("*").eq("usuario_id", usuarioId).eq("empresa_id", empresaId).eq("ativo", true).maybeSingle();
  if (error) throw error;
  return data === null ? null : mapearVinculo(data as LinhaVinculo);
}

async function obterPerfilPorId(perfilId: string): Promise<PerfilAcesso | null> {
  const { data, error } = await supabase.from("perfis").select("*").eq("id", perfilId).eq("ativo", true).maybeSingle();
  if (error) throw error;
  return data === null ? null : mapearPerfil(data as LinhaPerfil);
}

async function listarPermissoesPorPerfil(perfilId: string): Promise<PermissaoAcesso[]> {
  const { data: relacoes, error: erroRelacoes } = await supabase.from("perfil_permissoes").select("permissao_id").eq("perfil_id", perfilId);
  if (erroRelacoes) throw erroRelacoes;
  const ids = ((relacoes ?? []) as LinhaPerfilPermissao[]).map(({ permissao_id }) => permissao_id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("permissoes").select("*").in("id", ids).order("codigo", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as LinhaPermissao[]).map(mapearPermissao);
}

export async function obterPerfilDoUsuario(usuarioId: string): Promise<PerfilAcesso | null> {
  const vinculo = await obterVinculoDoUsuario(usuarioId);
  return vinculo === null ? null : obterPerfilPorId(vinculo.perfilId);
}

export async function listarPermissoesDoUsuario(usuarioId: string): Promise<PermissaoAcesso[]> {
  const vinculo = await obterVinculoDoUsuario(usuarioId);
  return vinculo === null ? [] : listarPermissoesPorPerfil(vinculo.perfilId);
}

export async function obterContextoPersistidoDoUsuario(usuarioId: string): Promise<ContextoAcesso | null> {
  const vinculo = await obterVinculoDoUsuario(usuarioId);
  if (vinculo === null) return null;
  const [perfil, permissoes] = await Promise.all([obterPerfilPorId(vinculo.perfilId), listarPermissoesPorPerfil(vinculo.perfilId)]);
  return perfil === null ? null : { vinculo, perfil, permissoes };
}
