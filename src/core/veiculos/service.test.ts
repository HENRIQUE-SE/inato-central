import assert from "node:assert/strict";
import { test } from "node:test";
import { STATUS_VEICULO } from "./constants";
import { criarListagemVeiculos, validarDadosCriacaoVeiculo } from "./service";
import type { DadosCriacaoVeiculo, Veiculo } from "./types";

const DADOS: DadosCriacaoVeiculo = {
  empresaId: "empresa-1",
  unidadeId: "unidade-1",
  oportunidadeId: "oportunidade-1",
  proprietarioNome: "Proprietário",
  placa: "ABC1D23",
  renavam: null,
  chassi: null,
  marca: "Marca",
  modelo: "Modelo",
  versao: null,
  anoFabricacao: 2025,
  anoModelo: 2026,
  cor: "Preto",
  quilometragem: 123,
  codigoFipe: null,
};

const VEICULO: Veiculo = {
  id: "veiculo-1",
  ...DADOS,
  status: STATUS_VEICULO.EM_PREPARACAO,
  criadoEm: "2026-08-07T00:00:00.000Z",
  atualizadoEm: "2026-08-07T00:00:00.000Z",
  arquivadoEm: null,
};

test("cria lista vazia", () => {
  assert.deepEqual(criarListagemVeiculos([]), { dados: [], total: 0 });
});

test("informa o total correto", () => {
  assert.equal(criarListagemVeiculos([VEICULO]).total, 1);
});

test("devolve cópia independente e imutável da listagem", () => {
  const listagem = criarListagemVeiculos([VEICULO]);
  assert.notEqual(listagem.dados[0], VEICULO);
  assert.equal(Object.isFrozen(listagem.dados[0]), true);
  assert.equal(Object.isFrozen(listagem.dados), true);
  assert.equal(Object.isFrozen(listagem), true);
});

test("define exatamente os cinco status oficiais", () => {
  assert.deepEqual(Object.values(STATUS_VEICULO), [
    "em_preparacao", "disponivel", "reservado", "vendido", "cancelado",
  ]);
});

test("status e arquivamento possuem fontes distintas sem estado ou ativo", () => {
  assert.equal(VEICULO.status, "em_preparacao");
  assert.equal(VEICULO.arquivadoEm, null);
  assert.equal("estado" in VEICULO, false);
  assert.equal("ativo" in VEICULO, false);
});

test("veículo possui origem, proprietário e código FIPE nullable", () => {
  assert.equal(VEICULO.oportunidadeId, "oportunidade-1");
  assert.equal(VEICULO.proprietarioNome, "Proprietário");
  assert.equal(VEICULO.codigoFipe, null);
});

test("quilometragem é informada explicitamente no contrato de criação", () => {
  assert.equal(DADOS.quilometragem, 123);
  assert.equal(Object.hasOwn(DADOS, "quilometragem"), true);
});

function validar(alteracoes: Partial<DadosCriacaoVeiculo>) {
  return validarDadosCriacaoVeiculo({ ...DADOS, ...alteracoes });
}

test("rejeita oportunidade vazia", () => assert.equal(validar({ oportunidadeId: " " }).valido, false));
test("rejeita proprietário vazio", () => assert.equal(validar({ proprietarioNome: " " }).valido, false));
test("rejeita placa vazia", () => assert.equal(validar({ placa: " " }).valido, false));
test("rejeita marca vazia", () => assert.equal(validar({ marca: " " }).valido, false));
test("rejeita modelo vazio", () => assert.equal(validar({ modelo: " " }).valido, false));
test("rejeita cor vazia", () => assert.equal(validar({ cor: " " }).valido, false));
test("rejeita quilometragem negativa", () => assert.equal(validar({ quilometragem: -1 }).valido, false));
test("rejeita ano de fabricação anterior a 1886", () => assert.equal(validar({ anoFabricacao: 1885 }).valido, false));
test("rejeita ano de fabricação posterior a 2100", () => assert.equal(validar({ anoFabricacao: 2101, anoModelo: 2101 }).valido, false));
test("rejeita ano/modelo anterior à fabricação", () => assert.equal(validar({ anoFabricacao: 2025, anoModelo: 2024 }).valido, false));
test("rejeita ano/modelo mais de um ano posterior", () => assert.equal(validar({ anoFabricacao: 2025, anoModelo: 2027 }).valido, false));
test("aprova dados válidos", () => assert.deepEqual(validarDadosCriacaoVeiculo(DADOS), { valido: true }));
test("validação não altera o objeto recebido", () => {
  const antes = structuredClone(DADOS);
  validarDadosCriacaoVeiculo(DADOS);
  assert.deepEqual(DADOS, antes);
});
