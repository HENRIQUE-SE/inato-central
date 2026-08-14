import assert from "node:assert/strict";
import { test } from "node:test";
import type { ContextoAcesso } from "@/core/acesso";
import type { RegistroAuditoria } from "@/core/auditoria";
import type { Negociacao } from "@/core/negociacoes";
import type { Reserva } from "@/core/reservas";
import type { Veiculo } from "@/core/veiculos";
import {
  registrarAuditoriaCancelamentoReserva,
  registrarAuditoriaCriacaoReserva,
  type DependenciasAuditoriaReservas,
} from "./reservas.auditoria";

const contexto: ContextoAcesso = {
  vinculo: { id: "x", usuarioId: "u", empresaId: "e", unidadeId: "un", perfilId: "p", ativo: true, criadoEm: "c" },
  perfil: { id: "p", codigo: "consultor", nome: "Consultor", descricao: null, ativo: true, criadoEm: "c" },
  permissoes: [],
};
const negociacao = { id: "n", interessadoNome: "Ana" } as Negociacao;
const veiculo = { id: "v", placa: "ABC1234" } as Veiculo;
const reserva: Reserva = {
  id: "r", empresaId: "e", unidadeId: "un", veiculoId: "v", negociacaoId: "n", status: "ativa",
  criadoPorUsuarioId: "u", reservadoEm: "2026-08-13T12:00:00Z", expiraEm: "2026-08-14T12:00:00Z",
  atualizadoEm: "2026-08-13T12:00:00Z", encerradoEm: null, motivoCancelamento: null,
  motivoCancelamentoDetalhes: null,
};
function dependencias(eventos: RegistroAuditoria[]): DependenciasAuditoriaReservas {
  return {
    obterUsuario: async () => ({ id: "u", email: "consultor@inato.com" }),
    obterContexto: async () => contexto,
    persistir: async (evento) => { eventos.push(evento); return evento; },
  };
}

test("audita criacao com identidade e dados permitidos", async () => {
  const eventos: RegistroAuditoria[] = [];
  await registrarAuditoriaCriacaoReserva(reserva, negociacao, veiculo, dependencias(eventos));
  assert.equal(eventos[0].acao, "criar");
  assert.equal(eventos[0].modulo, "reservas");
  assert.deepEqual(eventos[0].detalhes, {
    placa: "ABC1234", negociacaoId: "n", statusAnterior: null, statusNovo: "ativa",
    expiraEm: reserva.expiraEm, motivoCancelamento: null, motivoCancelamentoDetalhes: null,
    perfilCodigo: "consultor", usuarioEmail: "consultor@inato.com",
  });
});
test("audita cancelamento como alteracao com motivo", async () => {
  const eventos: RegistroAuditoria[] = [];
  await registrarAuditoriaCancelamentoReserva({
    ...reserva, status: "cancelada", encerradoEm: "fim", motivoCancelamento: "outro",
    motivoCancelamentoDetalhes: "Solicitacao do cliente",
  }, negociacao, veiculo, dependencias(eventos));
  assert.equal(eventos[0].acao, "alterar");
  assert.equal(eventos[0].detalhes?.statusAnterior, "ativa");
  assert.equal(eventos[0].detalhes?.statusNovo, "cancelada");
  assert.equal(eventos[0].detalhes?.motivoCancelamento, "outro");
  assert.equal(eventos[0].detalhes?.motivoCancelamentoDetalhes, "Solicitacao do cliente");
});
test("nao registra identidade ficticia sem usuario", async () => {
  await assert.rejects(
    registrarAuditoriaCriacaoReserva(reserva, negociacao, veiculo, { ...dependencias([]), obterUsuario: async () => null }),
    new Error("Não foi possível registrar a auditoria da reserva."),
  );
});
