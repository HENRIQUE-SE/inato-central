import assert from "node:assert/strict";
import { test } from "node:test";
import { listarReservasComDadosRelacionadosPersistidas, obterReservaPersistidaPorId } from "./reservas.repository";
import { obterPlacaVeiculoPersistidaPorId } from "@/lib/veiculos/veiculos.repository";

const linha = {
  id: "reserva-1", empresa_id: "empresa-1", unidade_id: "unidade-1", negociacao_id: "negociacao-1501", veiculo_id: "veiculo-1",
  status: "ativa" as const, criado_por_usuario_id: "usuario-1", reservado_em: "2026-08-13T12:00:00Z", expira_em: "2026-08-14T12:00:00Z",
  atualizado_em: "2026-08-13T12:00:00Z", encerrado_em: null, motivo_cancelamento: null, motivo_cancelamento_detalhes: null,
  negociacao: { interessado_nome: "Ana" }, veiculo: { placa: "ABC1234", marca: "Volkswagen", modelo: "Polo", versao: null },
};

test("mapeia listagem enriquecida sem depender de catálogos gerais", async () => {
  const resultado = await listarReservasComDadosRelacionadosPersistidas(async () => ({ data: [linha], error: null, count: 1 }));
  assert.equal(resultado.dados[0].interessadoNome, "Ana");
  assert.deepEqual(resultado.dados[0].veiculoResumo, { placa: "ABC1234", marca: "Volkswagen", modelo: "Polo", versao: null });
  assert.equal(resultado.dados[0].negociacaoId, "negociacao-1501");
});

test("aceita formato relacional em lista retornado pelo cliente", async () => {
  const resultado = await listarReservasComDadosRelacionadosPersistidas(async () => ({ data: [{ ...linha, negociacao: [linha.negociacao], veiculo: [linha.veiculo] }], error: null, count: 1 }));
  assert.equal(resultado.dados[0].interessadoNome, "Ana");
  assert.equal(resultado.dados[0].veiculoResumo?.placa, "ABC1234");
});

test("preserva reserva quando relacionamentos não são retornados", async () => {
  const resultado = await listarReservasComDadosRelacionadosPersistidas(async () => ({ data: [{ ...linha, negociacao: null, veiculo: null }], error: null, count: 1 }));
  assert.equal(resultado.dados[0].id, "reserva-1");
  assert.equal(resultado.dados[0].interessadoNome, null);
  assert.equal(resultado.dados[0].veiculoResumo, null);
});

test("preserva contexto, estados e compatibilidade histórica", async () => {
  const cancelada = { ...linha, status: "cancelada" as const, encerrado_em: "2026-08-13T18:00:00Z", motivo_cancelamento: "anterior_a_regra" as const };
  const expirada = { ...linha, id: "reserva-2", status: "expirada" as const, encerrado_em: "2026-08-14T12:00:00Z" };
  const resultado = await listarReservasComDadosRelacionadosPersistidas(async () => ({ data: [cancelada, expirada], error: null, count: 2 }));
  assert.deepEqual(resultado.dados.map(({ empresaId, unidadeId, status }) => ({ empresaId, unidadeId, status })), [
    { empresaId: "empresa-1", unidadeId: "unidade-1", status: "cancelada" },
    { empresaId: "empresa-1", unidadeId: "unidade-1", status: "expirada" },
  ]);
  assert.equal(resultado.dados[0].motivoCancelamento, "anterior_a_regra");
});

test("retorna lista vazia", async () => {
  const resultado = await listarReservasComDadosRelacionadosPersistidas(async () => ({ data: [], error: null, count: 0 }));
  assert.deepEqual(resultado, { dados: [], total: 0 });
});

test("não transforma falha persistente em dados autorizados", async () => {
  await assert.rejects(listarReservasComDadosRelacionadosPersistidas(async () => ({ data: null, error: new Error("RLS"), count: null })), new Error("RLS"));
});
test("obtém somente a Reserva específica pelo ID",async()=>{let idRecebido="";const resultado=await obterReservaPersistidaPorId("reserva-1",async id=>{idRecebido=id;return{data:linha,error:null}});assert.equal(idRecebido,"reserva-1");assert.equal(resultado?.negociacaoId,"negociacao-1501");assert.equal(resultado?.veiculoId,"veiculo-1")});
test("consulta mínima do Veículo devolve somente a placa",async()=>{let idRecebido="";const placa=await obterPlacaVeiculoPersistidaPorId("veiculo-1",async id=>{idRecebido=id;return{data:{placa:"ABC1234"},error:null}});assert.equal(idRecebido,"veiculo-1");assert.equal(placa,"ABC1234")});
