import type { DadosAtualizacaoNegociacao, DadosCriacaoNegociacao, FiltrosNegociacoes, ListagemNegociacoes, Negociacao } from "@/core/negociacoes";
import { supabase } from "@/lib/supabase";

type Linha = { id: string; empresa_id: string; unidade_id: string; veiculo_id: string; interessado_nome: string; interessado_telefone: string; origem: Negociacao["origem"]; observacoes: string | null; status: Negociacao["status"]; criado_por_usuario_id: string; criado_em: string; atualizado_em: string; encerrado_em: string | null };
type ResultadoLista = { data: Linha[] | null; error: unknown; count: number | null };
type ResultadoUm = { data: Linha | null; error: unknown };
export type ExecutorListagemNegociacoes = (filtros: Required<FiltrosNegociacoes>) => Promise<ResultadoLista>;
export type ExecutorCriacaoNegociacao = (dados: Record<string, string | null>) => Promise<ResultadoUm>;
export type ExecutorAtualizacaoNegociacao = (id: string, dados: Record<string, string | null>) => Promise<ResultadoUm>;
export type ExecutorObtencaoNegociacao = (id: string) => Promise<ResultadoUm>;
export type ExecutorEncerramentoNegociacao = (parametros: { p_negociacao_id: string }) => Promise<ResultadoUm>;

function mapear(linha: Linha): Negociacao { return { id: linha.id, empresaId: linha.empresa_id, unidadeId: linha.unidade_id, veiculoId: linha.veiculo_id, interessadoNome: linha.interessado_nome, interessadoTelefone: linha.interessado_telefone, origem: linha.origem, observacoes: linha.observacoes, status: linha.status, criadoPorUsuarioId: linha.criado_por_usuario_id, criadoEm: linha.criado_em, atualizadoEm: linha.atualizado_em, encerradoEm: linha.encerrado_em }; }
async function executarLista(f: Required<FiltrosNegociacoes>): Promise<ResultadoLista> {
  const inicio = (f.pagina - 1) * f.itensPorPagina; let q = supabase.from("negociacoes").select("*,veiculos!inner(placa)", { count: "exact" }).order("atualizado_em", { ascending: false }).range(inicio, inicio + f.itensPorPagina - 1);
  if (f.pesquisa) q = q.or(`interessado_nome.ilike.%${f.pesquisa}%,interessado_telefone.ilike.%${f.pesquisa}%,veiculos.placa.ilike.%${f.pesquisa}%`);
  if (f.status !== "todos") q = q.eq("status", f.status);
  return q;
}
async function executarObtencao(id: string): Promise<ResultadoUm> { return supabase.from("negociacoes").select("*").eq("id", id).maybeSingle(); }
async function executarCriacao(dados: Record<string, string | null>): Promise<ResultadoUm> { return supabase.from("negociacoes").insert(dados).select("*").single(); }
async function executarAtualizacao(id: string, dados: Record<string, string | null>): Promise<ResultadoUm> { return supabase.from("negociacoes").update(dados).eq("id", id).eq("status", "em_andamento").select("*").maybeSingle(); }
function executorRpc(nome: string): ExecutorEncerramentoNegociacao { return async (parametros) => supabase.rpc(nome, parametros).single(); }

export async function listarNegociacoesPersistidas(filtros: FiltrosNegociacoes = {}, executar: ExecutorListagemNegociacoes = executarLista): Promise<ListagemNegociacoes> {
  const completos = { pesquisa: filtros.pesquisa?.trim() ?? "", status: filtros.status ?? "todos", pagina: filtros.pagina ?? 1, itensPorPagina: filtros.itensPorPagina ?? 10 };
  const { data, error, count } = await executar(completos); if (error) throw error;
  return { dados: (data ?? []).map(mapear), total: count ?? 0, pagina: completos.pagina, itensPorPagina: completos.itensPorPagina };
}
export async function obterNegociacaoPersistidaPorId(id: string, executar: ExecutorObtencaoNegociacao = executarObtencao): Promise<Negociacao | null> { const { data, error } = await executar(id); if (error) throw error; return data ? mapear(data) : null; }
export async function criarNegociacaoPersistida(dados: DadosCriacaoNegociacao, executar: ExecutorCriacaoNegociacao = executarCriacao): Promise<Negociacao> { const { data, error } = await executar({ empresa_id: dados.empresaId, unidade_id: dados.unidadeId, veiculo_id: dados.veiculoId, interessado_nome: dados.interessadoNome, interessado_telefone: dados.interessadoTelefone, origem: dados.origem, observacoes: dados.observacoes, criado_por_usuario_id: dados.criadoPorUsuarioId }); if (error) throw error; if (!data) throw new Error("Negociação não retornada."); return mapear(data); }
export async function atualizarNegociacaoPersistida(id: string, dados: DadosAtualizacaoNegociacao, executar: ExecutorAtualizacaoNegociacao = executarAtualizacao): Promise<Negociacao | null> { const { data, error } = await executar(id, { interessado_nome: dados.interessadoNome, interessado_telefone: dados.interessadoTelefone, origem: dados.origem, observacoes: dados.observacoes, atualizado_em: new Date().toISOString() }); if (error) throw error; return data ? mapear(data) : null; }
async function encerrar(id: string, executar: ExecutorEncerramentoNegociacao): Promise<Negociacao | null> { const { data, error } = await executar({ p_negociacao_id: id }); if (error) throw error; return data ? mapear(data) : null; }
export function marcarNegociacaoConvertidaPersistida(id: string, executar: ExecutorEncerramentoNegociacao = executorRpc("marcar_negociacao_convertida")) { return encerrar(id, executar); }
export function marcarNegociacaoPerdidaPersistida(id: string, executar: ExecutorEncerramentoNegociacao = executorRpc("marcar_negociacao_perdida")) { return encerrar(id, executar); }
export function cancelarNegociacaoPersistida(id: string, executar: ExecutorEncerramentoNegociacao = executorRpc("cancelar_negociacao")) { return encerrar(id, executar); }
