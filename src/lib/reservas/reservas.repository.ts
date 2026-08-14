import type { DadosCancelamentoReserva, ListagemReservas, Reserva } from "@/core/reservas";
import { supabase } from "@/lib/supabase";
type Linha = { id:string;empresa_id:string;unidade_id:string;negociacao_id:string;veiculo_id:string;status:Reserva["status"];criado_por_usuario_id:string;reservado_em:string;expira_em:string;atualizado_em:string;encerrado_em:string|null;motivo_cancelamento:Reserva["motivoCancelamento"];motivo_cancelamento_detalhes:string|null };
type Resultado = { data: Linha | null; error: unknown };
type ResultadoLista = { data: Linha[] | null; error: unknown; count: number | null };
const mapear=(l:Linha):Reserva=>({id:l.id,empresaId:l.empresa_id,unidadeId:l.unidade_id,negociacaoId:l.negociacao_id,veiculoId:l.veiculo_id,status:l.status,criadoPorUsuarioId:l.criado_por_usuario_id,reservadoEm:l.reservado_em,expiraEm:l.expira_em,atualizadoEm:l.atualizado_em,encerradoEm:l.encerrado_em,motivoCancelamento:l.motivo_cancelamento,motivoCancelamentoDetalhes:l.motivo_cancelamento_detalhes});
async function expirarPadrao():Promise<{error:unknown}>{return supabase.rpc("expirar_reservas_vencidas");}
async function listarPadrao():Promise<ResultadoLista>{return supabase.from("reservas").select("*",{count:"exact"}).order("reservado_em",{ascending:false});}
async function criarPadrao(negociacaoId:string):Promise<Resultado>{return supabase.rpc("criar_reserva",{p_negociacao_id:negociacaoId}).single();}
async function cancelarPadrao(id:string,dados:DadosCancelamentoReserva):Promise<Resultado>{return supabase.rpc("cancelar_reserva",{p_reserva_id:id,p_motivo:dados.motivo,p_motivo_detalhes:dados.detalhes}).single();}
export async function expirarReservasVencidasPersistidas(executar=expirarPadrao):Promise<void>{const {error}=await executar();if(error)throw error;}
export async function listarReservasPersistidas(executar= listarPadrao):Promise<ListagemReservas>{const {data,error,count}=await executar();if(error)throw error;return {dados:(data??[]).map(mapear),total:count??0};}
export async function criarReservaPersistida(negociacaoId:string,executar=criarPadrao):Promise<Reserva>{const {data,error}=await executar(negociacaoId);if(error)throw error;if(!data)throw new Error("Reserva não retornada.");return mapear(data);}
export async function cancelarReservaPersistida(id:string,dados:DadosCancelamentoReserva,executar=cancelarPadrao):Promise<Reserva>{const {data,error}=await executar(id,dados);if(error)throw error;if(!data)throw new Error("Reserva não retornada.");return mapear(data);}
