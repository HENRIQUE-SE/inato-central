import { unidadePertenceAoTerritorio, vinculoPossuiTerritorioValido, type VinculoAcesso } from "@/core/acesso";
import type { UnidadeOperacionalPermitida } from "@/core/organizacao";
import { supabase } from "@/lib/supabase";

type LinhaOperacao = { id: string; rede_id: string; empresa_id: string | null; ativo: boolean };
type LinhaAreaOperacional = { id: string; operacao_id: string; ativo: boolean; operacao: LinhaOperacao | null };
type LinhaUnidade = {
  id: string;
  area_operacional_id: string;
  codigo: string;
  numero: number;
  nome: string;
  nome_exibicao: string;
  cidade: string;
  uf: string;
  ativo: boolean;
  area_operacional: LinhaAreaOperacional | null;
};
type ResultadoConsulta = { data: LinhaUnidade[] | null; error: unknown };
export type ConsultarUnidadesOperacionais = (vinculo: VinculoAcesso) => Promise<ResultadoConsulta>;

const SELECAO_UNIDADES = `
  id,
  area_operacional_id,
  codigo,
  numero,
  nome,
  nome_exibicao,
  cidade,
  uf,
  ativo,
  area_operacional:areas_operacionais!inner(
    id,
    operacao_id,
    ativo,
    operacao:operacoes!inner(
      id,
      rede_id,
      empresa_id,
      ativo
    )
  )
`;

async function consultarUnidadesOperacionais(vinculo: VinculoAcesso): Promise<ResultadoConsulta> {
  let consulta = supabase
    .from("unidades")
    .select(SELECAO_UNIDADES)
    .eq("ativo", true)
    .eq("area_operacional.ativo", true)
    .eq("area_operacional.operacao.ativo", true)
    .eq("area_operacional.operacao.rede_id", vinculo.redeId);

  switch (vinculo.escopoTipo) {
    case "unidade":
      consulta = consulta
        .eq("id", vinculo.unidadeId!)
        .eq("area_operacional_id", vinculo.areaOperacionalId!)
        .eq("area_operacional.operacao_id", vinculo.operacaoId!);
      break;
    case "area_operacional":
      consulta = consulta
        .eq("area_operacional_id", vinculo.areaOperacionalId!)
        .eq("area_operacional.operacao_id", vinculo.operacaoId!);
      break;
    case "operacao":
      consulta = consulta.eq("area_operacional.operacao_id", vinculo.operacaoId!);
      break;
  }

  const { data, error } = await consulta
    .order("numero", { ascending: true })
    .order("nome", { ascending: true });
  return { data: data as unknown as LinhaUnidade[] | null, error };
}

function mapearUnidade(linha: LinhaUnidade): UnidadeOperacionalPermitida | null {
  const area = linha.area_operacional;
  const operacao = area?.operacao ?? null;
  if (!linha.ativo || area === null || !area.ativo || operacao === null || !operacao.ativo || !operacao.empresa_id) return null;
  if (linha.area_operacional_id !== area.id || area.operacao_id !== operacao.id) return null;
  return {
    redeId: operacao.rede_id,
    operacaoId: operacao.id,
    areaOperacionalId: area.id,
    empresaId: operacao.empresa_id,
    unidadeId: linha.id,
    codigo: linha.codigo,
    numero: linha.numero,
    nome: linha.nome,
    nomeExibicao: linha.nome_exibicao,
    cidade: linha.cidade,
    uf: linha.uf,
  };
}

export async function listarUnidadesOperacionaisPermitidas(
  vinculo: VinculoAcesso,
  consultar: ConsultarUnidadesOperacionais = consultarUnidadesOperacionais
): Promise<UnidadeOperacionalPermitida[]> {
  if (!vinculoPossuiTerritorioValido(vinculo)) return [];
  const { data, error } = await consultar(vinculo);
  if (error) throw error;
  const unidades: UnidadeOperacionalPermitida[] = [];
  for (const linha of data ?? []) {
    const unidade = mapearUnidade(linha);
    if (unidade === null || !unidadePertenceAoTerritorio(vinculo, unidade)) continue;
    unidades.push(unidade);
  }
  return unidades.sort((a, b) => a.numero - b.numero || a.nome.localeCompare(b.nome) || a.codigo.localeCompare(b.codigo));
}
