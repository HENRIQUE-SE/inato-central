import { supabase } from "@/lib/supabase";
import { obterContextoOrganizacional } from "@/core/organizacao";
import type { CodigoEscopoAcesso, CodigoPerfilAcesso, CodigoPermissaoAcesso, ContextoAcesso, PerfilAcesso, PermissaoAcesso, VinculoAcesso } from "@/core/acesso";

type LinhaVinculo = { id: string; usuario_id: string; rede_id: string; operacao_id: string | null; area_operacional_id: string | null; empresa_id: string; unidade_id: string | null; escopo_tipo: CodigoEscopoAcesso; perfil_id: string; ativo: boolean; criado_em: string };
type LinhaPerfil = { id: string; codigo: CodigoPerfilAcesso; nome: string; descricao: string | null; ativo: boolean; criado_em: string };
type LinhaPermissao = { id: string; codigo: CodigoPermissaoAcesso; nome: string; descricao: string | null; criado_em: string };
type LinhaPerfilPermissao = { permissao_id: string };
type LinhaRelacaoPermissao = { permissao: LinhaPermissao | null };
type LinhaPerfilRelacional = LinhaPerfil & { relacoes_permissoes: LinhaRelacaoPermissao[] | null };
type LinhaContextoRelacional = LinhaVinculo & { perfil: LinhaPerfilRelacional | null };
type ResultadoConsultaContextoRelacional = { data: LinhaContextoRelacional | null; error: unknown };
type ConsultarContextoRelacional = (usuarioId: string, empresaId: string) => Promise<ResultadoConsultaContextoRelacional>;

const SELECAO_CONTEXTO_RELACIONAL = `
  id,
  usuario_id,
  rede_id,
  operacao_id,
  area_operacional_id,
  empresa_id,
  unidade_id,
  escopo_tipo,
  perfil_id,
  ativo,
  criado_em,
  perfil:perfis!usuarios_perfis_perfil_id_fkey(
    id,
    codigo,
    nome,
    descricao,
    ativo,
    criado_em,
    relacoes_permissoes:perfil_permissoes!perfil_permissoes_perfil_id_fkey(
      permissao:permissoes!perfil_permissoes_permissao_id_fkey(
        id,
        codigo,
        nome,
        descricao,
        criado_em
      )
    )
  )
`;

function mapearVinculo(linha: LinhaVinculo): VinculoAcesso { return { id: linha.id, usuarioId: linha.usuario_id, redeId: linha.rede_id, operacaoId: linha.operacao_id, areaOperacionalId: linha.area_operacional_id, empresaId: linha.empresa_id, unidadeId: linha.unidade_id, escopoTipo: linha.escopo_tipo, perfilId: linha.perfil_id, ativo: linha.ativo, criadoEm: linha.criado_em }; }
function mapearPerfil(linha: LinhaPerfil): PerfilAcesso { return { id: linha.id, codigo: linha.codigo, nome: linha.nome, descricao: linha.descricao, ativo: linha.ativo, criadoEm: linha.criado_em }; }
function mapearPermissao(linha: LinhaPermissao): PermissaoAcesso { return { id: linha.id, codigo: linha.codigo, nome: linha.nome, descricao: linha.descricao, criadoEm: linha.criado_em }; }

async function consultarContextoRelacional(usuarioId: string, empresaId: string): Promise<ResultadoConsultaContextoRelacional> {
  const { data, error } = await supabase
    .from("usuarios_perfis")
    .select(SELECAO_CONTEXTO_RELACIONAL)
    .eq("usuario_id", usuarioId)
    .eq("empresa_id", empresaId)
    .eq("ativo", true)
    .eq("perfil.ativo", true)
    .maybeSingle();
  return { data: data as unknown as LinhaContextoRelacional | null, error };
}

function mapearContextoRelacional(linha: LinhaContextoRelacional, usuarioId: string, empresaId: string): ContextoAcesso | null {
  if (!linha.ativo || linha.usuario_id !== usuarioId || linha.empresa_id !== empresaId) return null;
  const perfil = linha.perfil;
  if (perfil === null || !perfil.ativo || perfil.id !== linha.perfil_id || !Array.isArray(perfil.relacoes_permissoes)) return null;
  const permissoes: PermissaoAcesso[] = [];
  for (const relacao of perfil.relacoes_permissoes) {
    if (relacao?.permissao === null || relacao?.permissao === undefined) return null;
    permissoes.push(mapearPermissao(relacao.permissao));
  }
  permissoes.sort((a, b) => a.codigo.localeCompare(b.codigo));
  return { vinculo: mapearVinculo(linha), perfil: mapearPerfil(perfil), permissoes };
}

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

export async function obterContextoPersistidoDoUsuario(usuarioId: string, consultar: ConsultarContextoRelacional = consultarContextoRelacional): Promise<ContextoAcesso | null> {
  const { empresaId } = obterContextoOrganizacional();
  const { data, error } = await consultar(usuarioId, empresaId);
  if (error) throw error;
  if (data === null) return null;
  const contexto = mapearContextoRelacional(data, usuarioId, empresaId);
  return contexto;
}
