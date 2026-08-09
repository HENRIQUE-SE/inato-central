import assert from "node:assert/strict";
import { test } from "node:test";
import { STATUS_VEICULO, type DadosCriacaoVeiculo, type Veiculo } from "@/core/veiculos";
import type { ContextoAcesso } from "@/core/acesso";
import { criarVeiculoPersistido, listarVeiculosPersistidos } from "@/lib/veiculos/veiculos.repository";
import {
  criarVeiculo,
  listarVeiculos,
  listarOportunidadesDisponiveisParaVeiculo,
  type DadosFormularioVeiculo,
  type DependenciasVeiculos,
} from "./veiculos.service";

const CONTEXTO: ContextoAcesso = {
  vinculo: { id: "v", usuarioId: "usuario-1", empresaId: "empresa-contexto", unidadeId: "unidade-contexto", perfilId: "p", ativo: true, criadoEm: "2026-08-08T00:00:00.000Z" },
  perfil: { id: "p", codigo: "administrador", nome: "Administrador", descricao: null, ativo: true, criadoEm: "2026-08-08T00:00:00.000Z" },
  permissoes: [],
};

const FORMULARIO: DadosFormularioVeiculo = {
  oportunidadeId: " oportunidade-1 ", proprietarioNome: " Proprietário ", placa: " abc1d23 ",
  marca: " Marca ", modelo: " Modelo ", versao: " ", anoFabricacao: 2025,
  anoModelo: 2026, cor: " Preto ", quilometragem: 123, renavam: " ",
  chassi: " chassi123 ", codigoFipe: " ",
};

function veiculo(dados: DadosCriacaoVeiculo): Veiculo {
  return {
    id: "veiculo-1", ...dados, status: STATUS_VEICULO.EM_PREPARACAO,
    criadoEm: "2026-08-08T00:00:00.000Z", atualizadoEm: "2026-08-08T00:00:00.000Z",
    arquivadoEm: null,
  };
}

function dependenciasCriacao(
  alteracoes: Partial<DependenciasVeiculos> = {}
): Partial<DependenciasVeiculos> {
  return {
    obterUsuario: async () => ({ id: "usuario-1", email: "usuario@inato.test" }),
    exigirCriacao: async () => CONTEXTO,
    criar: async (dados) => veiculo(dados),
    auditarCriacao: async () => undefined,
    ...alteracoes,
  };
}

test("lista veículos após autorização", async () => {
  const resultado = await listarVeiculos({
    exigirVisualizacao: async () => CONTEXTO,
    listar: async () => ({ dados: [], total: 0 }),
  });
  assert.deepEqual(resultado, { dados: [], total: 0 });
});

test("listagem converte erro técnico", async () => {
  await assert.rejects(listarVeiculos({
    exigirVisualizacao: async () => CONTEXTO,
    listar: async () => { throw new Error("falha"); },
  }), new Error("Não foi possível carregar os veículos."));
});

test("criação usa empresa e unidade do contexto, normaliza e retorna status inicial", async () => {
  const recebidos: DadosCriacaoVeiculo[] = [];
  const resultado = await criarVeiculo(FORMULARIO, dependenciasCriacao({
    criar: async (dados) => { recebidos.push(dados); return veiculo(dados); },
  }));
  const recebido = recebidos[0];
  assert.ok(recebido);
  assert.equal(recebido.empresaId, "empresa-contexto");
  assert.equal(recebido.unidadeId, "unidade-contexto");
  assert.equal(recebido.placa, "ABC1D23");
  assert.equal(recebido.chassi, "CHASSI123");
  assert.equal(recebido.versao, null);
  assert.equal(recebido.renavam, null);
  assert.equal(recebido.codigoFipe, null);
  assert.equal(resultado.status, "em_preparacao");
});

test("ausência de permissão impede criação", async () => {
  await assert.rejects(criarVeiculo(FORMULARIO, dependenciasCriacao({
    exigirCriacao: async () => { throw new Error("Acesso não autorizado."); },
  })), new Error("Acesso não autorizado."));
});

for (const perfil of ["administrador", "consultor"] as const) {
  test(`${perfil} autorizado cria veículo`, async () => {
    let criado = false;
    const contexto = { ...CONTEXTO, perfil: { ...CONTEXTO.perfil, codigo: perfil } };
    await criarVeiculo(FORMULARIO, dependenciasCriacao({
      exigirCriacao: async () => contexto,
      criar: async (dados) => { criado = true; return veiculo(dados); },
    }));
    assert.equal(criado, true);
  });
}

for (const perfil of ["teste", "financeiro"] as const) {
  test(`${perfil} sem oportunidades.criar não cria nem audita`, async () => {
    let repositoryChamado = false;
    let auditoriaChamada = false;
    await assert.rejects(criarVeiculo(FORMULARIO, dependenciasCriacao({
      exigirCriacao: async () => { throw new Error("Acesso não autorizado."); },
      criar: async (dados) => { repositoryChamado = true; return veiculo(dados); },
      auditarCriacao: async () => { auditoriaChamada = true; },
    })), new Error("Acesso não autorizado."));
    assert.equal(repositoryChamado, false);
    assert.equal(auditoriaChamada, false);
  });
}

test("vínculo sem unidade não cria veículo", async () => {
  let repositoryChamado = false;
  const contextoSemUnidade = { ...CONTEXTO, vinculo: { ...CONTEXTO.vinculo, unidadeId: null } };
  await assert.rejects(criarVeiculo(FORMULARIO, dependenciasCriacao({
    exigirCriacao: async () => contextoSemUnidade,
    criar: async (dados) => { repositoryChamado = true; return veiculo(dados); },
  })), new Error("Acesso não autorizado."));
  assert.equal(repositoryChamado, false);
});

test("usuário não autenticado impede criação", async () => {
  await assert.rejects(criarVeiculo(FORMULARIO, dependenciasCriacao({
    obterUsuario: async () => null,
  })), new Error("Acesso não autorizado."));
});

test("validação inválida impede repository", async () => {
  let chamado = false;
  await assert.rejects(criarVeiculo({ ...FORMULARIO, placa: " " }, dependenciasCriacao({
    criar: async (dados) => { chamado = true; return veiculo(dados); },
  })), new Error("Informe a placa."));
  assert.equal(chamado, false);
});

test("erro do repository vira mensagem controlada e não audita", async () => {
  let auditado = false;
  await assert.rejects(criarVeiculo(FORMULARIO, dependenciasCriacao({
    criar: async () => { throw new Error("erro Supabase"); },
    auditarCriacao: async () => { auditado = true; },
  })), new Error("Não foi possível cadastrar o veículo."));
  assert.equal(auditado, false);
});

test("auditoria ocorre depois da persistência bem-sucedida", async () => {
  const ordem: string[] = [];
  await criarVeiculo(FORMULARIO, dependenciasCriacao({
    criar: async (dados) => { ordem.push("persistência"); return veiculo(dados); },
    auditarCriacao: async () => { ordem.push("auditoria"); },
  }));
  assert.deepEqual(ordem, ["persistência", "auditoria"]);
});

test("seleção omite oportunidades já vinculadas", async () => {
  const resultado = await listarOportunidadesDisponiveisParaVeiculo({
    exigirVisualizacao: async () => CONTEXTO,
    listarOportunidades: async () => [
      { id: "o-1", proprietario_nome: "Um", veiculo_informado: "Carro 1", placa: "AAA", telefone: "", cidade: "", origem: "", status: "", created_at: "" },
      { id: "o-2", proprietario_nome: "Dois", veiculo_informado: "Carro 2", placa: "BBB", telefone: "", cidade: "", origem: "", status: "", created_at: "" },
    ],
    listar: async () => ({ dados: [veiculo({
      empresaId: "e", unidadeId: "u", oportunidadeId: "o-1", proprietarioNome: "Um",
      placa: "AAA", renavam: null, chassi: null, marca: "M", modelo: "M", versao: null,
      anoFabricacao: 2025, anoModelo: 2025, cor: "C", quilometragem: 1, codigoFipe: null,
    })], total: 1 }),
  });
  assert.deepEqual(resultado.map(({ id }) => id), ["o-2"]);
});

test("repositório mantém listagem e mapeia todos os campos", async () => {
  const resultado = await listarVeiculosPersistidos(async () => ({
    data: [{ id: "v", empresa_id: "e", unidade_id: "u", oportunidade_id: "o", proprietario_nome: "P", placa: "ABC", renavam: null, chassi: null, marca: "M", modelo: "M", versao: null, ano_fabricacao: 2025, ano_modelo: 2026, cor: "C", quilometragem: 1, codigo_fipe: null, status: STATUS_VEICULO.EM_PREPARACAO, criado_em: "c", atualizado_em: "a", arquivado_em: null }],
    error: null,
  }));
  assert.equal(resultado.dados[0]?.oportunidadeId, "o");
  assert.equal(resultado.dados[0]?.status, "em_preparacao");
});

test("repositório de criação envia e mapeia todos os campos", async () => {
  const inseridos: Record<string, string | number | null>[] = [];
  const dados: DadosCriacaoVeiculo = { empresaId: "e", unidadeId: "u", oportunidadeId: "o", proprietarioNome: "P", placa: "ABC", renavam: null, chassi: null, marca: "M", modelo: "M", versao: null, anoFabricacao: 2025, anoModelo: 2026, cor: "C", quilometragem: 1, codigoFipe: null };
  const resultado = await criarVeiculoPersistido(dados, async (registro) => {
    inseridos.push(registro);
    return { data: { id: "v", empresa_id: "e", unidade_id: "u", oportunidade_id: "o", proprietario_nome: "P", placa: "ABC", renavam: null, chassi: null, marca: "M", modelo: "M", versao: null, ano_fabricacao: 2025, ano_modelo: 2026, cor: "C", quilometragem: 1, codigo_fipe: null, status: STATUS_VEICULO.EM_PREPARACAO, criado_em: "c", atualizado_em: "a", arquivado_em: null }, error: null };
  });
  const inserido = inseridos[0];
  assert.ok(inserido);
  assert.equal(inserido.oportunidade_id, "o");
  assert.equal(Object.keys(inserido).length, 15);
  assert.equal(resultado.id, "v");
});
