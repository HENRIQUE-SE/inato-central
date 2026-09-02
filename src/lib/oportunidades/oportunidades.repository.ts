import { supabase } from "@/lib/supabase";
import type {
  DadosOportunidade,
  Oportunidade,
} from "@/types/oportunidade";

type DadosOportunidadePersistida = DadosOportunidade & {
  empresa_id: string;
  unidade_id: string;
};

export type ConsultaOportunidades = {
  pagina: number;
  itensPorPagina: number;
  termoPesquisa: string;
  status: string;
};

export type ResultadoOportunidadesPersistidas = {
  dados: Oportunidade[];
  total: number;
};

export async function obterOportunidadePersistidaPorId(
  id: string
): Promise<Oportunidade | null> {
  const { data, error } = await supabase
    .from("oportunidades")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data === null ? null : (data as Oportunidade);
}

export async function listarOportunidadesPersistidas({
  pagina,
  itensPorPagina,
  termoPesquisa,
  status,
}: ConsultaOportunidades): Promise<ResultadoOportunidadesPersistidas> {
  const inicio = (pagina - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina - 1;
  const termo = termoPesquisa.trim();
  let consulta = supabase
    .from("oportunidades")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(inicio, fim);
  if (termo) {
    consulta = consulta.or(
      `proprietario_nome.ilike.%${termo}%,veiculo_informado.ilike.%${termo}%,placa.ilike.%${termo}%`
    );
  }
  if (status !== "todos") consulta = consulta.eq("status", status);
  const { data, error, count } = await consulta;
  if (error) throw error;
  return { dados: (data ?? []) as Oportunidade[], total: count ?? 0 };
}

export async function criarOportunidadePersistida(
  dados: DadosOportunidadePersistida
): Promise<Oportunidade> {
  const { data, error } = await supabase
    .from("oportunidades")
    .insert([dados])
    .select("*")
    .single();
  if (error) throw error;
  return data as Oportunidade;
}

export async function atualizarOportunidadePersistida(
  id: string,
  dados: DadosOportunidade
): Promise<Oportunidade> {
  const { data, error } = await supabase
    .from("oportunidades")
    .update(dados)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Oportunidade;
}

export async function excluirOportunidadePersistida(
  id: string
): Promise<Oportunidade> {
  const { data, error } = await supabase
    .from("oportunidades")
    .delete()
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Oportunidade;
}
