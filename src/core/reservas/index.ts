export { DURACAO_RESERVA_HORAS, LIMITE_DETALHES_MOTIVO_CANCELAMENTO, MOTIVO_CANCELAMENTO_RESERVA_HISTORICO, MOTIVOS_CANCELAMENTO_RESERVA, ROTULOS_MOTIVO_CANCELAMENTO_RESERVA, ROTULOS_STATUS_RESERVA, STATUS_RESERVA } from "./constants";
export type { MotivoCancelamentoReserva, MotivoCancelamentoReservaPersistido, StatusReserva } from "./constants";
export { calcularExpiracaoReserva, normalizarCancelamentoReserva, possuiDuracaoOficialReserva, reservaEstaVencida, validarCancelamentoReserva, validarMotivoCancelamentoReserva } from "./service";
export type { DadosCancelamentoReserva, ListagemReservas, Reserva, ResultadoValidacaoReserva } from "./types";
