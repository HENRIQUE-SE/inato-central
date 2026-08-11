import assert from "node:assert/strict";
import { test } from "node:test";
import { STATUS_VEICULO } from "./constants";
import { criarListagemVeiculos, detectarCamposAlteradosVeiculo, validarDadosAtualizacaoVeiculo, validarDadosCriacaoVeiculo, validarTransicaoStatusVeiculo } from "./service";
import type { DadosAtualizacaoVeiculo, DadosCriacaoVeiculo, Veiculo } from "./types";

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

test("define exatamente os seis status oficiais", () => {
  assert.deepEqual(Object.values(STATUS_VEICULO), [
    "em_preparacao", "pronto_para_anunciar", "disponivel", "reservado", "vendido", "cancelado",
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

const ATUALIZACAO: DadosAtualizacaoVeiculo = {
  proprietarioNome: DADOS.proprietarioNome, placa: DADOS.placa, marca: DADOS.marca,
  modelo: DADOS.modelo, versao: DADOS.versao, anoFabricacao: DADOS.anoFabricacao,
  anoModelo: DADOS.anoModelo, cor: DADOS.cor, quilometragem: DADOS.quilometragem,
  renavam: DADOS.renavam, chassi: DADOS.chassi, codigoFipe: DADOS.codigoFipe,
};

test("aprova atualização válida com opcionais nulos", () => assert.deepEqual(validarDadosAtualizacaoVeiculo(ATUALIZACAO), { valido: true }));
test("atualização rejeita proprietário vazio", () => assert.equal(validarDadosAtualizacaoVeiculo({ ...ATUALIZACAO, proprietarioNome: " " }).valido, false));
test("atualização rejeita placa vazia", () => assert.equal(validarDadosAtualizacaoVeiculo({ ...ATUALIZACAO, placa: " " }).valido, false));
test("atualização rejeita quilometragem negativa", () => assert.equal(validarDadosAtualizacaoVeiculo({ ...ATUALIZACAO, quilometragem: -1 }).valido, false));
test("atualização aplica a mesma regra de anos", () => assert.equal(validarDadosAtualizacaoVeiculo({ ...ATUALIZACAO, anoModelo: 2027 }).valido, false));
test("validação da atualização não altera a entrada", () => { const antes = structuredClone(ATUALIZACAO); validarDadosAtualizacaoVeiculo(ATUALIZACAO); assert.deepEqual(ATUALIZACAO, antes); });
test("detecta somente campos efetivamente alterados em ordem estável", () => assert.deepEqual(detectarCamposAlteradosVeiculo(VEICULO, { ...ATUALIZACAO, proprietarioNome: "Outro", cor: "Branco", quilometragem: 456 }), ["proprietarioNome", "cor", "quilometragem"]));
test("ignora campos que permaneceram iguais", () => assert.deepEqual(detectarCamposAlteradosVeiculo(VEICULO, ATUALIZACAO), []));

test("reconhece pronto_para_anunciar", () => assert.equal(STATUS_VEICULO.PRONTO_PARA_ANUNCIAR, "pronto_para_anunciar"));
test("mantém em_preparacao para pronto_para_anunciar", () => assert.deepEqual(validarTransicaoStatusVeiculo(STATUS_VEICULO.EM_PREPARACAO, STATUS_VEICULO.PRONTO_PARA_ANUNCIAR), { valido: true }));
test("permite pronto_para_anunciar para disponivel", () => assert.deepEqual(validarTransicaoStatusVeiculo(STATUS_VEICULO.PRONTO_PARA_ANUNCIAR, STATUS_VEICULO.DISPONIVEL), { valido: true }));
test("rejeita origem igual ao destino", () => assert.equal(validarTransicaoStatusVeiculo(STATUS_VEICULO.EM_PREPARACAO, STATUS_VEICULO.EM_PREPARACAO).valido, false));
test("rejeita regressão para em_preparacao", () => assert.equal(validarTransicaoStatusVeiculo(STATUS_VEICULO.PRONTO_PARA_ANUNCIAR, STATUS_VEICULO.EM_PREPARACAO).valido, false));
test("rejeita disponível para pronto_para_anunciar", () => assert.equal(validarTransicaoStatusVeiculo(STATUS_VEICULO.DISPONIVEL, STATUS_VEICULO.PRONTO_PARA_ANUNCIAR).valido, false));
test("rejeita em_preparacao para disponivel", () => assert.equal(validarTransicaoStatusVeiculo(STATUS_VEICULO.EM_PREPARACAO, STATUS_VEICULO.DISPONIVEL).valido, false));
test("rejeita disponível para disponível", () => assert.equal(validarTransicaoStatusVeiculo(STATUS_VEICULO.DISPONIVEL, STATUS_VEICULO.DISPONIVEL).valido, false));
test("rejeita reservado para disponível", () => assert.equal(validarTransicaoStatusVeiculo(STATUS_VEICULO.RESERVADO, STATUS_VEICULO.DISPONIVEL).valido, false));
test("rejeita vendido para disponível", () => assert.equal(validarTransicaoStatusVeiculo(STATUS_VEICULO.VENDIDO, STATUS_VEICULO.DISPONIVEL).valido, false));
test("rejeita cancelado para disponível", () => assert.equal(validarTransicaoStatusVeiculo(STATUS_VEICULO.CANCELADO, STATUS_VEICULO.DISPONIVEL).valido, false));
test("validação de transição não altera as entradas e tem resultado previsível", () => {
  const atual = STATUS_VEICULO.EM_PREPARACAO; const novo = STATUS_VEICULO.PRONTO_PARA_ANUNCIAR;
  const primeiro = validarTransicaoStatusVeiculo(atual, novo); const segundo = validarTransicaoStatusVeiculo(atual, novo);
  assert.equal(atual, "em_preparacao"); assert.equal(novo, "pronto_para_anunciar"); assert.deepEqual(primeiro, segundo);
});
