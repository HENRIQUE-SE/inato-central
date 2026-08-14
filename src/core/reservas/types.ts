import type { MotivoCancelamentoReserva, MotivoCancelamentoReservaPersistido, StatusReserva } from "./constants";
export type Reserva = { id: string; empresaId: string; unidadeId: string; negociacaoId: string; veiculoId: string; status: StatusReserva; criadoPorUsuarioId: string; reservadoEm: string; expiraEm: string; atualizadoEm: string; encerradoEm: string | null; motivoCancelamento:MotivoCancelamentoReservaPersistido|null; motivoCancelamentoDetalhes:string|null };
export type DadosCancelamentoReserva={motivo:MotivoCancelamentoReserva;detalhes:string|null};
export type ResultadoValidacaoReserva = { valido: true } | { valido: false; mensagem: string };
export type ListagemReservas = { dados: readonly Reserva[]; total: number };
