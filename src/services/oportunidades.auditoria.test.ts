import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  ACOES_AUDITORIA,
  ORIGENS_AUDITORIA,
  RESULTADOS_AUDITORIA,
  listarEventosAuditoria,
} from "@/core/auditoria";
import { limparEventosAuditoriaParaTestes } from "@/core/auditoria/service";
import { obterContextoIdentidadeAtual } from "@/core/identidade";
import type { Oportunidade } from "@/types/oportunidade";
import {
  registrarAuditoriaAlteracaoOportunidade,
  registrarAuditoriaCriacaoOportunidade,
  registrarAuditoriaExclusaoOportunidade,
} from "./oportunidades.auditoria";

const oportunidade: Oportunidade = {
  id: "00000000-0000-4000-8000-000000000201",
  proprietario_nome: "Proprietário Teste",
  telefone: "34999999999",
  cidade: "Patrocínio",
  veiculo_informado: "Veículo Teste",
  placa: "ABC1D23",
  origem: "teste",
  status: "novo",
  created_at: "2026-08-07T00:00:00.000Z",
};

beforeEach(() => {
  limparEventosAuditoriaParaTestes();
});

test("criação registra ação CRIAR e os detalhes permitidos", () => {
  registrarAuditoriaCriacaoOportunidade(oportunidade);

  const [evento] = listarEventosAuditoria();
  assert.equal(evento.acao, ACOES_AUDITORIA.CRIAR);
  assert.deepEqual(evento.detalhes, {
    placa: oportunidade.placa,
    proprietario: oportunidade.proprietario_nome,
    veiculo: oportunidade.veiculo_informado,
    perfilCodigo: obterContextoIdentidadeAtual().perfil.codigo,
  });
});

test("alteração registra ação ALTERAR e os detalhes permitidos", () => {
  registrarAuditoriaAlteracaoOportunidade(oportunidade);

  const [evento] = listarEventosAuditoria();
  assert.equal(evento.acao, ACOES_AUDITORIA.ALTERAR);
  assert.deepEqual(evento.detalhes, {
    placa: oportunidade.placa,
    proprietario: oportunidade.proprietario_nome,
    perfilCodigo: obterContextoIdentidadeAtual().perfil.codigo,
  });
});

test("exclusão registra ação EXCLUIR e os detalhes permitidos", () => {
  registrarAuditoriaExclusaoOportunidade(oportunidade);

  const [evento] = listarEventosAuditoria();
  assert.equal(evento.acao, ACOES_AUDITORIA.EXCLUIR);
  assert.deepEqual(evento.detalhes, {
    placa: oportunidade.placa,
    perfilCodigo: obterContextoIdentidadeAtual().perfil.codigo,
  });
});

test("evento utiliza metadados obrigatórios da auditoria", () => {
  registrarAuditoriaCriacaoOportunidade(oportunidade);

  const [evento] = listarEventosAuditoria();
  assert.equal(evento.resultado, RESULTADOS_AUDITORIA.SUCESSO);
  assert.equal(evento.origem, ORIGENS_AUDITORIA.USUARIO);
  assert.equal(evento.modulo, "oportunidades");
  assert.equal(evento.recursoTipo, "oportunidade");
  assert.equal(evento.recursoId, oportunidade.id);
});

test("evento utiliza identidade e organização atuais", () => {
  registrarAuditoriaAlteracaoOportunidade(oportunidade);

  const contexto = obterContextoIdentidadeAtual();
  const [evento] = listarEventosAuditoria();
  assert.equal(evento.empresaId, contexto.organizacao.empresaId);
  assert.equal(evento.unidadeId, contexto.organizacao.unidadeId);
  assert.equal(evento.usuarioId, contexto.usuario.id);
  assert.equal(evento.detalhes?.perfilCodigo, contexto.perfil.codigo);
});

test("nenhuma operação inclui detalhes sensíveis adicionais", () => {
  registrarAuditoriaCriacaoOportunidade(oportunidade);
  registrarAuditoriaAlteracaoOportunidade(oportunidade);
  registrarAuditoriaExclusaoOportunidade(oportunidade);

  const chavesPermitidas = new Set([
    "placa",
    "proprietario",
    "veiculo",
    "perfilCodigo",
  ]);

  for (const evento of listarEventosAuditoria()) {
    const chaves = Object.keys(evento.detalhes ?? {});
    assert.equal(chaves.every((chave) => chavesPermitidas.has(chave)), true);
  }
});
