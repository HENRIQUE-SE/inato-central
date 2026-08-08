import assert from "node:assert/strict";
import { test } from "node:test";
import { STATUS_VEICULO } from "@/core/veiculos";
import { listarVeiculosPersistidos } from "@/lib/veiculos/veiculos.repository";
import { listarVeiculos } from "./veiculos.service";

test("lista veículos pelo repositório configurado", async () => {
  const resultado = await listarVeiculos({
    listar: async () => ({ dados: [], total: 0 }),
  });
  assert.deepEqual(resultado, { dados: [], total: 0 });
});

test("serviço converte erro técnico em mensagem controlada", async () => {
  await assert.rejects(
    listarVeiculos({ listar: async () => { throw new Error("falha técnica"); } }),
    new Error("Não foi possível carregar os veículos.")
  );
});

test("repositório mapeia todos os campos persistidos", async () => {
  const resultado = await listarVeiculosPersistidos(async () => ({
    data: [{
      id: "veiculo-1",
      empresa_id: "empresa-1",
      unidade_id: "unidade-1",
      oportunidade_id: "oportunidade-1",
      proprietario_nome: "Proprietário",
      placa: "ABC1D23",
      renavam: null,
      chassi: null,
      marca: "Marca",
      modelo: "Modelo",
      versao: "Versão",
      ano_fabricacao: 2025,
      ano_modelo: 2026,
      cor: "Preto",
      quilometragem: 123,
      codigo_fipe: null,
      status: STATUS_VEICULO.EM_PREPARACAO,
      criado_em: "2026-08-07T00:00:00.000Z",
      atualizado_em: "2026-08-07T00:00:00.000Z",
      arquivado_em: null,
    }],
    error: null,
  }));

  assert.deepEqual(resultado.dados[0], {
    id: "veiculo-1",
    empresaId: "empresa-1",
    unidadeId: "unidade-1",
    oportunidadeId: "oportunidade-1",
    proprietarioNome: "Proprietário",
    placa: "ABC1D23",
    renavam: null,
    chassi: null,
    marca: "Marca",
    modelo: "Modelo",
    versao: "Versão",
    anoFabricacao: 2025,
    anoModelo: 2026,
    cor: "Preto",
    quilometragem: 123,
    codigoFipe: null,
    status: "em_preparacao",
    criadoEm: "2026-08-07T00:00:00.000Z",
    atualizadoEm: "2026-08-07T00:00:00.000Z",
    arquivadoEm: null,
  });
});
