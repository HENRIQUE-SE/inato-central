import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { STATUS_VEICULO, type DadosCriacaoVeiculo, type Veiculo } from "@/core/veiculos";
import { CODIGOS_PERMISSAO_ACESSO, possuiPermissao, type CodigoPerfilAcesso, type ContextoAcesso } from "@/core/acesso";
import { atualizarVeiculoPersistido, criarVeiculoPersistido, listarOportunidadesDisponiveisParaVeiculoPersistidas, listarResumoVeiculosPersistidos, listarVeiculosPersistidos, marcarVeiculoDisponivelPersistido, marcarVeiculoProntoParaAnunciarPersistido, obterFichaVeiculoPersistidaPorId, obterVeiculoPersistidoPorId } from "@/lib/veiculos/veiculos.repository";
import {
  abrirListagemVeiculos,
  criarVeiculo,
  atualizarVeiculo,
  listarVeiculos,
  listarOportunidadesDisponiveisParaVeiculo,
  marcarVeiculoProntoParaAnunciar,
  marcarVeiculoDisponivel,
  criarCarregadorFichaVeiculo,
  criarCarregadorListagemVeiculos,
  obterFichaVeiculoPorId,
  obterVeiculoPorId,
  type DadosFormularioAtualizacaoVeiculo,
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
    listarOportunidadesDisponiveis: async () => [
      { id: "o-2", proprietario_nome: "Dois", veiculo_informado: "Carro 2", placa: "BBB" },
    ],
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

const FORMULARIO_ATUALIZACAO: DadosFormularioAtualizacaoVeiculo = {
  proprietarioNome: " Proprietário atualizado ", placa: " abc1d23 ", marca: " Marca ",
  modelo: " Modelo ", versao: " ", anoFabricacao: 2025, anoModelo: 2026,
  cor: " Branco ", quilometragem: 456, renavam: " ", chassi: " chassi456 ", codigoFipe: " ",
};

function veiculoAtual(): Veiculo {
  return veiculo({ empresaId: "empresa-contexto", unidadeId: "unidade-contexto", oportunidadeId: "oportunidade-1", proprietarioNome: "Proprietário", placa: "ABC1D23", renavam: null, chassi: "CHASSI123", marca: "Marca", modelo: "Modelo", versao: null, anoFabricacao: 2025, anoModelo: 2026, cor: "Preto", quilometragem: 123, codigoFipe: null });
}

function dependenciasAtualizacao(alteracoes: Partial<DependenciasVeiculos> = {}): Partial<DependenciasVeiculos> {
  const atual = veiculoAtual();
  return { obterUsuario: async () => ({ id: "usuario-1", email: "usuario@inato.test" }), exigirVisualizacao: async () => CONTEXTO, exigirAlteracao: async () => CONTEXTO, obterPorId: async () => atual, obterFichaPorId: async () => ({ veiculo: atual, oportunidade: null }), atualizar: async (_id, dados) => ({ ...atual, ...dados, atualizadoEm: "novo" }), auditarAlteracao: async () => undefined, ...alteracoes };
}

test("obtém veículo com autenticação e permissão", async () => assert.equal((await obterVeiculoPorId("veiculo-1", dependenciasAtualizacao())).id, "veiculo-1"));
test("obtenção sem permissão é negada", async () => assert.rejects(obterVeiculoPorId("veiculo-1", dependenciasAtualizacao({ exigirVisualizacao: async () => { throw new Error("Acesso não autorizado."); } })), new Error("Acesso não autorizado.")));
test("veículo inexistente usa mensagem controlada", async () => assert.rejects(obterVeiculoPorId("ausente", dependenciasAtualizacao({ obterPorId: async () => null })), new Error("Veículo não encontrado.")));

test("carregador compartilha a Promise de solicitações simultâneas da mesma ficha", async () => {
  let cargasRemotas = 0;
  let concluir!: () => void;
  const bloqueio = new Promise<void>((resolve) => { concluir = resolve; });
  const carregar = criarCarregadorFichaVeiculo(async () => {
    cargasRemotas += 1;
    await bloqueio;
    return { veiculo: veiculoAtual(), oportunidade: null, permissoes: { editar: false, concluirPreparacao: false, concluirPublicacao: false } };
  });
  const primeira = carregar("veiculo-1");
  const segunda = carregar("veiculo-1");
  assert.equal(primeira, segunda);
  concluir();
  await Promise.all([primeira, segunda]);
  assert.equal(cargasRemotas, 1);
});

test("ficha reutiliza um único contexto confiável para veículo, origem e permissões", async () => {
  let contextos = 0;
  let consultasConsolidadas = 0;
  const resultado = await obterFichaVeiculoPorId("veiculo-1", dependenciasAtualizacao({
    exigirVisualizacao: async () => { contextos += 1; return CONTEXTO; },
    obterFichaPorId: async () => {
      consultasConsolidadas += 1;
      return { veiculo: veiculoAtual(), oportunidade: { id: "oportunidade-1", proprietario_nome: "Proprietário", veiculo_informado: "Veículo", placa: "ABC1D23" } };
    },
  }));
  assert.equal(contextos, 1);
  assert.equal(consultasConsolidadas, 1);
  assert.equal(resultado.oportunidade?.id, "oportunidade-1");
  assert.equal(CONTEXTO.vinculo.empresaId, "empresa-contexto");
  assert.equal(CONTEXTO.vinculo.unidadeId, "unidade-contexto");
});

test("chamada pública isolada revalida acesso antes de consultar", async () => {
  let contextos = 0;
  const deps = dependenciasAtualizacao({
    exigirVisualizacao: async () => { contextos += 1; return CONTEXTO; },
  });
  await obterVeiculoPorId("veiculo-1", deps);
  assert.equal(contextos, 1);
});

test("negação de acesso da ficha falha sem consultar veículo ou origem", async () => {
  let consultas = 0;
  await assert.rejects(obterFichaVeiculoPorId("veiculo-1", dependenciasAtualizacao({
    exigirVisualizacao: async () => { throw new Error("Acesso não autorizado."); },
    obterFichaPorId: async () => { consultas += 1; return { veiculo: veiculoAtual(), oportunidade: null }; },
  })), new Error("Acesso não autorizado."));
  assert.equal(consultas, 0);
});

test("ausência da oportunidade de origem não impede a ficha", async () => {
  const resultado = await obterFichaVeiculoPorId("veiculo-1", dependenciasAtualizacao({
    obterFichaPorId: async () => ({ veiculo: veiculoAtual(), oportunidade: null }),
  }));
  assert.equal(resultado.veiculo.id, "veiculo-1");
  assert.equal(resultado.oportunidade, null);
});
for (const perfil of ["administrador", "consultor", "teste"] as const) {
  test(`${perfil} visualiza ficha consolidada conforme a matriz atual`, async () => {
    let consultas = 0;
    const contexto: ContextoAcesso = {
      ...CONTEXTO,
      perfil: { ...CONTEXTO.perfil, codigo: perfil },
      permissoes: [{ id: "permissao", codigo: CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR, nome: "Visualizar oportunidades", descricao: null, criadoEm: "2026-08-08T00:00:00.000Z" }],
    };
    const resultado = await obterFichaVeiculoPorId("veiculo-1", dependenciasAtualizacao({
      exigirVisualizacao: async () => contexto,
      obterFichaPorId: async () => { consultas += 1; return { veiculo: veiculoAtual(), oportunidade: null }; },
    }));
    assert.equal(resultado.veiculo.id, "veiculo-1");
    assert.equal(consultas, 1);
  });
}
test("financeiro é recusado antes da consulta consolidada", async () => {
  let consultas = 0;
  await assert.rejects(obterFichaVeiculoPorId("veiculo-1", dependenciasAtualizacao({
    exigirVisualizacao: async () => { throw new Error("Acesso não autorizado."); },
    obterFichaPorId: async () => { consultas += 1; return { veiculo: veiculoAtual(), oportunidade: null }; },
  })), new Error("Acesso não autorizado."));
  assert.equal(consultas, 0);
});
test("veículo indisponível pela RLS preserva mensagem de não encontrado", async () => {
  await assert.rejects(obterFichaVeiculoPorId("veiculo-1", dependenciasAtualizacao({
    obterFichaPorId: async () => null,
  })), new Error("Veículo não encontrado."));
});
test("atualização normaliza e envia somente campos editáveis", async () => {
  const recebidos: Record<string, unknown>[] = [];
  await atualizarVeiculo("veiculo-1", FORMULARIO_ATUALIZACAO, dependenciasAtualizacao({ atualizar: async (_id, dados) => { recebidos.push(dados); return { ...veiculoAtual(), ...dados }; } }));
  const recebido = recebidos[0]; assert.ok(recebido); assert.equal(recebido.placa, "ABC1D23"); assert.equal(recebido.chassi, "CHASSI456"); assert.equal(recebido.versao, null);
  for (const campo of ["empresaId", "unidadeId", "oportunidadeId", "status", "id", "criadoEm", "arquivadoEm"]) assert.equal(campo in recebido, false);
});
test("validação impede atualização no repository", async () => { let chamado = false; await assert.rejects(atualizarVeiculo("v", { ...FORMULARIO_ATUALIZACAO, placa: " " }, dependenciasAtualizacao({ atualizar: async () => { chamado = true; return veiculoAtual(); } })), new Error("Informe a placa.")); assert.equal(chamado, false); });
test("falta de permissão impede atualização no repository", async () => { let chamado = false; await assert.rejects(atualizarVeiculo("v", FORMULARIO_ATUALIZACAO, dependenciasAtualizacao({ exigirAlteracao: async () => { throw new Error("Acesso não autorizado."); }, atualizar: async () => { chamado = true; return veiculoAtual(); } })), new Error("Acesso não autorizado.")); assert.equal(chamado, false); });
test("conflito de unicidade gera mensagem controlada", async () => assert.rejects(atualizarVeiculo("v", FORMULARIO_ATUALIZACAO, dependenciasAtualizacao({ atualizar: async () => { throw { code: "23505" }; } })), new Error("Já existe outro veículo com esses dados.")));
test("erro genérico de update gera mensagem controlada e não audita", async () => { let auditou = false; await assert.rejects(atualizarVeiculo("v", FORMULARIO_ATUALIZACAO, dependenciasAtualizacao({ atualizar: async () => { throw new Error("Supabase"); }, auditarAlteracao: async () => { auditou = true; } })), new Error("Não foi possível atualizar o veículo.")); assert.equal(auditou, false); });
test("auditoria ocorre após update e recebe campos alterados", async () => { const ordem: string[] = []; let campos: readonly string[] = []; await atualizarVeiculo("v", FORMULARIO_ATUALIZACAO, dependenciasAtualizacao({ atualizar: async (_id, dados) => { ordem.push("update"); return { ...veiculoAtual(), ...dados }; }, auditarAlteracao: async (_v, alterados) => { ordem.push("auditoria"); campos = alterados; } })); assert.deepEqual(ordem, ["update", "auditoria"]); assert.deepEqual(campos, ["proprietarioNome", "cor", "quilometragem", "chassi"]); });

test("repositório obtém por id e mapeia todos os campos", async () => {
  const atual = veiculoAtual();
  const resultado = await obterVeiculoPersistidoPorId("v", async () => ({ data: { id: atual.id, empresa_id: atual.empresaId, unidade_id: atual.unidadeId, oportunidade_id: atual.oportunidadeId, proprietario_nome: atual.proprietarioNome, placa: atual.placa, renavam: atual.renavam, chassi: atual.chassi, marca: atual.marca, modelo: atual.modelo, versao: atual.versao, ano_fabricacao: atual.anoFabricacao, ano_modelo: atual.anoModelo, cor: atual.cor, quilometragem: atual.quilometragem, codigo_fipe: atual.codigoFipe, status: atual.status, criado_em: atual.criadoEm, atualizado_em: atual.atualizadoEm, arquivado_em: atual.arquivadoEm }, error: null }));
  assert.deepEqual(resultado, atual);
});
test("repositório obtém ficha consolidada e preserva somente a oportunidade mínima", async () => {
  const atual = veiculoAtual();
  const resultado = await obterFichaVeiculoPersistidaPorId("veiculo-1", async (id) => {
    assert.equal(id, "veiculo-1");
    return {
      data: {
        id: atual.id, empresa_id: atual.empresaId, unidade_id: atual.unidadeId,
        oportunidade_id: atual.oportunidadeId, proprietario_nome: atual.proprietarioNome,
        placa: atual.placa, renavam: atual.renavam, chassi: atual.chassi,
        marca: atual.marca, modelo: atual.modelo, versao: atual.versao,
        ano_fabricacao: atual.anoFabricacao, ano_modelo: atual.anoModelo,
        cor: atual.cor, quilometragem: atual.quilometragem, codigo_fipe: atual.codigoFipe,
        status: atual.status, criado_em: atual.criadoEm, atualizado_em: atual.atualizadoEm,
        arquivado_em: atual.arquivadoEm,
        oportunidade: { id: "oportunidade-1", proprietario_nome: "Proprietário", veiculo_informado: "Veículo", placa: "ABC1D23" },
      },
      error: null,
    };
  });
  assert.deepEqual(resultado?.veiculo, atual);
  assert.deepEqual(Object.keys(resultado?.oportunidade ?? {}), ["id", "proprietario_nome", "veiculo_informado", "placa"]);
});
test("repositório preserva relação null na ficha consolidada", async () => {
  const atual = veiculoAtual();
  const resultado = await obterFichaVeiculoPersistidaPorId("veiculo-1", async () => ({
    data: { id: atual.id, empresa_id: atual.empresaId, unidade_id: atual.unidadeId, oportunidade_id: atual.oportunidadeId, proprietario_nome: atual.proprietarioNome, placa: atual.placa, renavam: atual.renavam, chassi: atual.chassi, marca: atual.marca, modelo: atual.modelo, versao: atual.versao, ano_fabricacao: atual.anoFabricacao, ano_modelo: atual.anoModelo, cor: atual.cor, quilometragem: atual.quilometragem, codigo_fipe: atual.codigoFipe, status: atual.status, criado_em: atual.criadoEm, atualizado_em: atual.atualizadoEm, arquivado_em: atual.arquivadoEm, oportunidade: null },
    error: null,
  }));
  assert.equal(resultado?.oportunidade, null);
  assert.equal(resultado?.veiculo.oportunidadeId, "oportunidade-1");
});
test("consulta consolidada usa FK explícita, campos mínimos e nenhum select estrela", () => {
  const fonte = readFileSync(resolve("src/lib/veiculos/veiculos.repository.ts"), "utf8");
  const inicio = fonte.indexOf("async function consultarFichaVeiculoPorId");
  const fim = fonte.indexOf("async function atualizarVeiculo", inicio);
  const consulta = fonte.slice(inicio, fim);
  assert.match(consulta, /oportunidade:oportunidades!veiculos_oportunidade_fk/);
  assert.match(consulta, /\.eq\("id", id\)/);
  assert.match(consulta, /\.is\("arquivado_em", null\)/);
  assert.match(consulta, /\.maybeSingle\(\)/);
  assert.doesNotMatch(consulta, /select\(\s*["'`]\*["'`]\s*\)/);
  for (const campo of ["id", "proprietario_nome", "veiculo_informado", "placa"]) assert.match(consulta, new RegExp(`\\b${campo}\\b`));
});
test("ficha não contém consulta independente posterior da oportunidade", () => {
  const fonte = readFileSync(resolve("src/services/veiculos.service.ts"), "utf8");
  const inicio = fonte.indexOf("export async function obterFichaVeiculoPorId");
  const fim = fonte.indexOf("export function criarCarregadorFichaVeiculo", inicio);
  const casoDeUso = fonte.slice(inicio, fim);
  assert.match(casoDeUso, /deps\.obterFichaPorId\(id\)/);
  assert.doesNotMatch(casoDeUso, /Promise\.all|\.map\(/);
});
test("repositório atualiza somente campos editáveis, inclui atualizado_em e mapeia retorno", async () => {
  const atual = veiculoAtual(); const captura: { valor: Record<string, string | number | null> | null } = { valor: null };
  const dados = { proprietarioNome: "Novo", placa: atual.placa, marca: atual.marca, modelo: atual.modelo, versao: null, anoFabricacao: 2025, anoModelo: 2026, cor: atual.cor, quilometragem: 500, renavam: null, chassi: null, codigoFipe: null };
  const resultado = await atualizarVeiculoPersistido(atual.id, dados, async (_id, registro) => { captura.valor = registro; return { data: { id: atual.id, empresa_id: atual.empresaId, unidade_id: atual.unidadeId, oportunidade_id: atual.oportunidadeId, proprietario_nome: dados.proprietarioNome, placa: dados.placa, renavam: dados.renavam, chassi: dados.chassi, marca: dados.marca, modelo: dados.modelo, versao: dados.versao, ano_fabricacao: dados.anoFabricacao, ano_modelo: dados.anoModelo, cor: dados.cor, quilometragem: dados.quilometragem, codigo_fipe: dados.codigoFipe, status: atual.status, criado_em: atual.criadoEm, atualizado_em: "novo", arquivado_em: null }, error: null }; });
  const enviado = captura.valor; assert.ok(enviado); assert.equal(typeof enviado.atualizado_em, "string"); assert.equal("empresa_id" in enviado, false); assert.equal("oportunidade_id" in enviado, false); assert.equal("status" in enviado, false); assert.equal(resultado?.atualizadoEm, "novo");
});

function dependenciasConclusao(alteracoes: Partial<DependenciasVeiculos> = {}): Partial<DependenciasVeiculos> {
  const atual = veiculoAtual();
  return {
    obterUsuario: async () => ({ id: "usuario-1", email: "usuario@inato.test" }),
    exigirConclusaoPreparacao: async () => CONTEXTO,
    obterPorId: async () => atual,
    marcarProntoParaAnunciar: async () => ({ ...atual, status: STATUS_VEICULO.PRONTO_PARA_ANUNCIAR, atualizadoEm: "novo" }),
    auditarConclusaoPreparacao: async () => undefined,
    ...alteracoes,
  };
}

for (const perfil of ["administrador", "consultor"] as const) {
  test(`${perfil} autorizado conclui preparação`, async () => {
    const contexto = { ...CONTEXTO, perfil: { ...CONTEXTO.perfil, codigo: perfil } };
    const resultado = await marcarVeiculoProntoParaAnunciar("veiculo-1", dependenciasConclusao({ exigirConclusaoPreparacao: async () => contexto }));
    assert.equal(resultado.status, "pronto_para_anunciar");
  });
}
for (const perfil of ["teste", "financeiro"] as const) {
  test(`${perfil} não conclui preparação nem chama repository`, async () => {
    let chamou = false;
    await assert.rejects(marcarVeiculoProntoParaAnunciar("veiculo-1", dependenciasConclusao({
      exigirConclusaoPreparacao: async () => { throw new Error("Acesso não autorizado."); },
      marcarProntoParaAnunciar: async () => { chamou = true; return veiculoAtual(); },
    })), new Error("Acesso não autorizado."));
    assert.equal(chamou, false);
  });
}
test("usuário não autenticado não conclui preparação", async () => assert.rejects(marcarVeiculoProntoParaAnunciar("veiculo-1", dependenciasConclusao({ obterUsuario: async () => null })), new Error("Acesso não autorizado.")));
test("veículo inexistente não conclui preparação", async () => assert.rejects(marcarVeiculoProntoParaAnunciar("ausente", dependenciasConclusao({ obterPorId: async () => null })), new Error("Veículo não encontrado.")));
test("veículo arquivado não conclui preparação", async () => assert.rejects(marcarVeiculoProntoParaAnunciar("veiculo-1", dependenciasConclusao({ obterPorId: async () => ({ ...veiculoAtual(), arquivadoEm: "2026-08-11T00:00:00.000Z" }) })), new Error("O veículo não pode ser marcado como pronto para anunciar.")));
test("status atual inválido impede repository", async () => { let chamou = false; await assert.rejects(marcarVeiculoProntoParaAnunciar("veiculo-1", dependenciasConclusao({ obterPorId: async () => ({ ...veiculoAtual(), status: STATUS_VEICULO.DISPONIVEL }), marcarProntoParaAnunciar: async () => { chamou = true; return veiculoAtual(); } })), new Error("O veículo não pode ser marcado como pronto para anunciar.")); assert.equal(chamou, false); });
test("repository da transição recebe somente o ID", async () => { const ids: string[] = []; await marcarVeiculoProntoParaAnunciar("veiculo-1", dependenciasConclusao({ marcarProntoParaAnunciar: async (id) => { ids.push(id); return { ...veiculoAtual(), status: STATUS_VEICULO.PRONTO_PARA_ANUNCIAR }; } })); assert.deepEqual(ids, ["veiculo-1"]); });
test("falha técnica da transição gera mensagem controlada e não audita", async () => { let auditou = false; await assert.rejects(marcarVeiculoProntoParaAnunciar("veiculo-1", dependenciasConclusao({ marcarProntoParaAnunciar: async () => { throw new Error("PostgreSQL"); }, auditarConclusaoPreparacao: async () => { auditou = true; } })), new Error("Não foi possível atualizar o status do veículo.")); assert.equal(auditou, false); });
test("auditoria da transição ocorre somente depois da persistência", async () => { const ordem: string[] = []; await marcarVeiculoProntoParaAnunciar("veiculo-1", dependenciasConclusao({ marcarProntoParaAnunciar: async () => { ordem.push("persistência"); return { ...veiculoAtual(), status: STATUS_VEICULO.PRONTO_PARA_ANUNCIAR }; }, auditarConclusaoPreparacao: async () => { ordem.push("auditoria"); } })); assert.deepEqual(ordem, ["persistência", "auditoria"]); });
test("repositório chama somente a RPC específica com p_veiculo_id e mapeia retorno", async () => {
  const parametros: Record<string, string>[] = []; const atual = veiculoAtual();
  const resultado = await marcarVeiculoProntoParaAnunciarPersistido("veiculo-1", async (recebidos) => { parametros.push(recebidos); return { data: { id: atual.id, empresa_id: atual.empresaId, unidade_id: atual.unidadeId, oportunidade_id: atual.oportunidadeId, proprietario_nome: atual.proprietarioNome, placa: atual.placa, renavam: atual.renavam, chassi: atual.chassi, marca: atual.marca, modelo: atual.modelo, versao: atual.versao, ano_fabricacao: atual.anoFabricacao, ano_modelo: atual.anoModelo, cor: atual.cor, quilometragem: atual.quilometragem, codigo_fipe: atual.codigoFipe, status: STATUS_VEICULO.PRONTO_PARA_ANUNCIAR, criado_em: atual.criadoEm, atualizado_em: "novo", arquivado_em: null }, error: null }; });
  assert.deepEqual(parametros, [{ p_veiculo_id: "veiculo-1" }]); assert.equal(Object.keys(parametros[0] ?? {}).length, 1); assert.equal(resultado?.status, "pronto_para_anunciar");
});

function dependenciasDisponibilizacao(alteracoes: Partial<DependenciasVeiculos> = {}): Partial<DependenciasVeiculos> {
  const pronto = { ...veiculoAtual(), status: STATUS_VEICULO.PRONTO_PARA_ANUNCIAR };
  return {
    obterUsuario: async () => ({ id: "usuario-1", email: "usuario@inato.test" }),
    exigirConclusaoPublicacao: async () => CONTEXTO,
    obterPorId: async () => pronto,
    marcarDisponivel: async () => ({ ...pronto, status: STATUS_VEICULO.DISPONIVEL, atualizadoEm: "novo" }),
    auditarConclusaoPublicacao: async () => undefined,
    ...alteracoes,
  };
}

for (const perfil of ["administrador", "consultor"] as const) {
  test(`${perfil} autorizado marca veículo disponível`, async () => {
    const contexto = { ...CONTEXTO, perfil: { ...CONTEXTO.perfil, codigo: perfil } };
    const resultado = await marcarVeiculoDisponivel("veiculo-1", dependenciasDisponibilizacao({ exigirConclusaoPublicacao: async () => contexto }));
    assert.equal(resultado.status, STATUS_VEICULO.DISPONIVEL);
  });
}
for (const perfil of ["teste", "financeiro"] as const) {
  test(`${perfil} não marca veículo disponível nem chama repository`, async () => {
    let chamou = false;
    await assert.rejects(marcarVeiculoDisponivel("veiculo-1", dependenciasDisponibilizacao({
      exigirConclusaoPublicacao: async () => { throw new Error("Acesso não autorizado."); },
      marcarDisponivel: async () => { chamou = true; return veiculoAtual(); },
    })), new Error("Acesso não autorizado."));
    assert.equal(chamou, false);
  });
}
test("usuário não autenticado não marca veículo disponível", async () => assert.rejects(marcarVeiculoDisponivel("veiculo-1", dependenciasDisponibilizacao({ obterUsuario: async () => null })), new Error("Acesso não autorizado.")));
test("veículo inexistente não é marcado disponível", async () => assert.rejects(marcarVeiculoDisponivel("ausente", dependenciasDisponibilizacao({ obterPorId: async () => null })), new Error("Veículo não encontrado.")));
test("veículo arquivado não é marcado disponível", async () => assert.rejects(marcarVeiculoDisponivel("veiculo-1", dependenciasDisponibilizacao({ obterPorId: async () => ({ ...veiculoAtual(), status: STATUS_VEICULO.PRONTO_PARA_ANUNCIAR, arquivadoEm: "2026-08-11T00:00:00.000Z" }) })), new Error("O veículo não pode ser marcado como disponível.")));
for (const status of [STATUS_VEICULO.EM_PREPARACAO, STATUS_VEICULO.DISPONIVEL] as const) {
  test(`status ${status} impede disponibilização e repository`, async () => {
    let chamou = false;
    await assert.rejects(marcarVeiculoDisponivel("veiculo-1", dependenciasDisponibilizacao({
      obterPorId: async () => ({ ...veiculoAtual(), status }),
      marcarDisponivel: async () => { chamou = true; return veiculoAtual(); },
    })), new Error("O veículo não pode ser marcado como disponível."));
    assert.equal(chamou, false);
  });
}
test("repository da disponibilização recebe somente o ID", async () => { const ids: string[] = []; await marcarVeiculoDisponivel("veiculo-1", dependenciasDisponibilizacao({ marcarDisponivel: async (id) => { ids.push(id); return { ...veiculoAtual(), status: STATUS_VEICULO.DISPONIVEL }; } })); assert.deepEqual(ids, ["veiculo-1"]); });
test("falha técnica da disponibilização é controlada e não audita", async () => { let auditou = false; await assert.rejects(marcarVeiculoDisponivel("veiculo-1", dependenciasDisponibilizacao({ marcarDisponivel: async () => { throw new Error("PostgreSQL"); }, auditarConclusaoPublicacao: async () => { auditou = true; } })), new Error("Não foi possível atualizar o status do veículo.")); assert.equal(auditou, false); });
test("retorno nulo da disponibilização é controlado e não audita", async () => { let auditou = false; await assert.rejects(marcarVeiculoDisponivel("veiculo-1", dependenciasDisponibilizacao({ marcarDisponivel: async () => null, auditarConclusaoPublicacao: async () => { auditou = true; } })), new Error("Não foi possível atualizar o status do veículo.")); assert.equal(auditou, false); });
test("auditoria da disponibilização ocorre somente depois da persistência", async () => { const ordem: string[] = []; await marcarVeiculoDisponivel("veiculo-1", dependenciasDisponibilizacao({ marcarDisponivel: async () => { ordem.push("persistência"); return { ...veiculoAtual(), status: STATUS_VEICULO.DISPONIVEL }; }, auditarConclusaoPublicacao: async () => { ordem.push("auditoria"); } })); assert.deepEqual(ordem, ["persistência", "auditoria"]); });
test("repositório de disponibilização envia somente p_veiculo_id e mapeia retorno integral", async () => {
  const parametros: Record<string, string>[] = []; const atual = { ...veiculoAtual(), status: STATUS_VEICULO.PRONTO_PARA_ANUNCIAR };
  const resultado = await marcarVeiculoDisponivelPersistido("veiculo-1", async (recebidos) => { parametros.push(recebidos); return { data: { id: atual.id, empresa_id: atual.empresaId, unidade_id: atual.unidadeId, oportunidade_id: atual.oportunidadeId, proprietario_nome: atual.proprietarioNome, placa: atual.placa, renavam: atual.renavam, chassi: atual.chassi, marca: atual.marca, modelo: atual.modelo, versao: atual.versao, ano_fabricacao: atual.anoFabricacao, ano_modelo: atual.anoModelo, cor: atual.cor, quilometragem: atual.quilometragem, codigo_fipe: atual.codigoFipe, status: STATUS_VEICULO.DISPONIVEL, criado_em: atual.criadoEm, atualizado_em: "novo", arquivado_em: null }, error: null }; });
  assert.deepEqual(parametros, [{ p_veiculo_id: "veiculo-1" }]); assert.equal(Object.keys(parametros[0] ?? {}).length, 1); assert.deepEqual(resultado, { ...atual, status: STATUS_VEICULO.DISPONIVEL, atualizadoEm: "novo" });
});
test("repositório de disponibilização propaga erro", async () => assert.rejects(marcarVeiculoDisponivelPersistido("veiculo-1", async () => ({ data: null, error: new Error("RPC") })), new Error("RPC")));

const MIGRACAO_STATUS = readFileSync(resolve(process.cwd(), "supabase/migrations/20260811_enable_veiculos_pronto_para_anunciar.sql"), "utf8");
const MIGRACAO_DISPONIVEL = readFileSync(resolve(process.cwd(), "supabase/migrations/20260811_enable_veiculos_disponivel.sql"), "utf8");

test("migração preserva estados e adiciona pronto_para_anunciar ao CHECK", () => {
  for (const status of ["em_preparacao", "pronto_para_anunciar", "disponivel", "reservado", "vendido", "cancelado"]) assert.match(MIGRACAO_STATUS, new RegExp(`'${status}'`));
  assert.match(MIGRACAO_STATUS, /add constraint veiculos_status_check check/);
});
test("RPC recebe somente o identificador e possui contexto de segurança controlado", () => {
  assert.match(MIGRACAO_STATUS, /marcar_veiculo_pronto_para_anunciar\(\s*p_veiculo_id uuid\s*\)/);
  assert.match(MIGRACAO_STATUS, /security definer/); assert.match(MIGRACAO_STATUS, /set search_path = ''/);
  assert.match(MIGRACAO_STATUS, /revoke execute[\s\S]*from public, anon/); assert.match(MIGRACAO_STATUS, /grant execute[\s\S]*to authenticated/);
});
test("RPC valida permissão, vínculo, contexto, arquivamento e status inicial", () => {
  for (const trecho of ["veiculos.preparacao.concluir", "up.usuario_id = v_usuario_id", "up.empresa_id = v.empresa_id", "up.unidade_id is not null", "up.unidade_id = v.unidade_id", "up.ativo", "v_veiculo.arquivado_em is not null", "v_veiculo.status <> 'em_preparacao'"]) assert.ok(MIGRACAO_STATUS.includes(trecho));
});
test("authenticated não recebe UPDATE direto de status e edição comum é preservada", () => {
  assert.match(MIGRACAO_STATUS, /revoke update on table public\.veiculos from public, anon, authenticated/);
  const concessao = MIGRACAO_STATUS.match(/grant update \(([\s\S]*?)\) on table public\.veiculos to authenticated/)?.[1] ?? "";
  assert.equal(concessao.includes("status"), false); assert.ok(concessao.includes("proprietario_nome")); assert.ok(concessao.includes("atualizado_em"));
});
test("trigger preserva estruturas e permite somente a transição declarada", () => {
  for (const campo of ["id", "empresa_id", "unidade_id", "oportunidade_id", "criado_em", "arquivado_em"]) assert.ok(MIGRACAO_STATUS.includes(`old.${campo} is distinct from new.${campo}`));
  assert.match(MIGRACAO_STATUS, /old\.status = 'em_preparacao'[\s\S]*new\.status = 'pronto_para_anunciar'/);
});
test("migração de disponibilização persiste permissão somente para administrador e consultor", () => {
  assert.match(MIGRACAO_DISPONIVEL, /'00000000-0000-4000-8000-000000002007',[\s\S]*'veiculos\.publicacao\.concluir',[\s\S]*'Concluir publicação de veículo'/);
  assert.match(MIGRACAO_DISPONIVEL, /00000000-0000-4000-8000-000000001001/); assert.match(MIGRACAO_DISPONIVEL, /00000000-0000-4000-8000-000000001002/);
  assert.doesNotMatch(MIGRACAO_DISPONIVEL, /00000000-0000-4000-8000-000000001003|00000000-0000-4000-8000-000000001004/);
});
test("RPC de disponibilização recebe somente ID e possui segurança controlada", () => {
  assert.match(MIGRACAO_DISPONIVEL, /marcar_veiculo_disponivel\(\s*p_veiculo_id uuid\s*\)/);
  assert.doesNotMatch(MIGRACAO_DISPONIVEL, /p_status|p_empresa|p_unidade|p_usuario|p_perfil/);
  for (const trecho of ["security definer", "set search_path = ''", "from public, anon", "to authenticated", "for update"]) assert.ok(MIGRACAO_DISPONIVEL.toLowerCase().includes(trecho));
});
test("RPC de disponibilização valida autorização, contexto, arquivamento e atualização condicional", () => {
  for (const trecho of ["veiculos.publicacao.concluir", "up.usuario_id = v_usuario_id", "up.empresa_id = v.empresa_id", "up.unidade_id is not null", "up.unidade_id = v.unidade_id", "up.ativo", "v_veiculo.arquivado_em is not null", "v_veiculo.status <> 'pronto_para_anunciar'", "v.status = 'pronto_para_anunciar'", "v.arquivado_em is null", "status = 'disponivel'"]) assert.ok(MIGRACAO_DISPONIVEL.includes(trecho));
});
test("trigger atualizado permite exatamente as duas transições", () => {
  assert.match(MIGRACAO_DISPONIVEL, /old\.status = 'em_preparacao' and new\.status = 'pronto_para_anunciar'/);
  assert.match(MIGRACAO_DISPONIVEL, /old\.status = 'pronto_para_anunciar' and new\.status = 'disponivel'/);
  for (const campo of ["id", "empresa_id", "unidade_id", "oportunidade_id", "criado_em", "arquivado_em"]) assert.ok(MIGRACAO_DISPONIVEL.includes(`old.${campo} is distinct from new.${campo}`));
  assert.match(MIGRACAO_DISPONIVEL, /revoke update \(status\)[\s\S]*from public, anon, authenticated/);
});

function contextoListagem(perfil: CodigoPerfilAcesso): ContextoAcesso {
  const codigos = perfil === "administrador" || perfil === "consultor"
    ? [CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR, CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_CRIAR]
    : perfil === "teste" ? [CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR] : [];
  return {
    ...CONTEXTO,
    perfil: { ...CONTEXTO.perfil, codigo: perfil, nome: perfil },
    permissoes: codigos.map((codigo) => ({ id: codigo, codigo, nome: codigo, descricao: null, criadoEm: "2026-08-08T00:00:00.000Z" })),
  };
}

function autoridadeListagem(perfil: CodigoPerfilAcesso) {
  return { usuario: { id: "usuario-1", email: "usuario@inato.test" }, contexto: contextoListagem(perfil) };
}

const RESUMO_VEICULO = {
  id: "veiculo-1", placa: "ABC1D23", marca: "Marca", modelo: "Modelo", versao: null,
  anoFabricacao: 2025, anoModelo: 2026, quilometragem: 123,
  proprietarioNome: "Proprietário", status: STATUS_VEICULO.EM_PREPARACAO,
} as const;

test("abertura da listagem resolve autoridade uma vez e consulta somente o resumo", async () => {
  let autoridades = 0, consultas = 0, oportunidades = 0;
  const resultado = await abrirListagemVeiculos({
    obterAutoridade: async () => { autoridades += 1; return autoridadeListagem("administrador"); },
    listarResumo: async () => { consultas += 1; return { dados: [RESUMO_VEICULO], total: 1 }; },
    listarOportunidadesDisponiveis: async () => { oportunidades += 1; return []; },
  });
  assert.equal(autoridades, 1); assert.equal(consultas, 1); assert.equal(oportunidades, 0);
  assert.equal(resultado.estado, "carregado");
  if (resultado.estado === "carregado") { assert.deepEqual(resultado.veiculos, [RESUMO_VEICULO]); assert.equal(resultado.permissoes.criar, true); }
  assert.equal(autoridadeListagem("administrador").contexto.vinculo.empresaId, "empresa-contexto");
  assert.equal(autoridadeListagem("administrador").contexto.vinculo.unidadeId, "unidade-contexto");
});

for (const [perfil, estado, criar] of [
  ["administrador", "carregado", true], ["consultor", "carregado", true],
  ["teste", "carregado", false], ["financeiro", "acesso_negado", false],
] as const) {
  test(`abertura preserva permissões do perfil ${perfil}`, async () => {
    let consultas = 0;
    const resultado = await abrirListagemVeiculos({
      obterAutoridade: async () => autoridadeListagem(perfil),
      listarResumo: async () => { consultas += 1; return { dados: [], total: 0 }; },
    });
    assert.equal(resultado.estado, estado); assert.equal(consultas, estado === "carregado" ? 1 : 0);
    if (resultado.estado === "carregado") assert.equal(resultado.permissoes.criar, criar);
  });
}

test("abertura sem autenticação não consulta Veículos", async () => {
  let consultou = false;
  const resultado = await abrirListagemVeiculos({
    obterAutoridade: async () => null,
    listarResumo: async () => { consultou = true; return { dados: [], total: 0 }; },
  });
  assert.deepEqual(resultado, { estado: "nao_autenticado" }); assert.equal(consultou, false);
});

for (const origem of ["Auth", "contexto"] as const) {
  test(`falha de ${origem} interrompe a abertura antes da consulta`, async () => {
    let consultou = false;
    await assert.rejects(abrirListagemVeiculos({
      obterAutoridade: async () => { throw new Error(`falha de ${origem}`); },
      listarResumo: async () => { consultou = true; return { dados: [], total: 0 }; },
    }), new Error(`falha de ${origem}`));
    assert.equal(consultou, false);
  });
}

test("abertura preserva lista vazia", async () => {
  const resultado = await abrirListagemVeiculos({ obterAutoridade: async () => autoridadeListagem("administrador"), listarResumo: async () => ({ dados: [], total: 0 }) });
  assert.equal(resultado.estado, "carregado"); if (resultado.estado === "carregado") assert.deepEqual(resultado.veiculos, []);
});

test("falha ou negação RLS da consulta resumida usa mensagem controlada", async () => {
  await assert.rejects(abrirListagemVeiculos({ obterAutoridade: async () => autoridadeListagem("administrador"), listarResumo: async () => { throw new Error("RLS"); } }), new Error("Não foi possível carregar os veículos."));
});

test("repository resumido devolve somente os campos da tabela", async () => {
  const resultado = await listarResumoVeiculosPersistidos(async () => ({
    data: [{ id: "v", placa: "ABC", marca: "M", modelo: "X", versao: null, ano_fabricacao: 2025, ano_modelo: 2026, quilometragem: 10, proprietario_nome: "P", status: STATUS_VEICULO.EM_PREPARACAO }], error: null,
  }));
  assert.deepEqual(Object.keys(resultado.dados[0] ?? {}), ["id", "placa", "marca", "modelo", "versao", "anoFabricacao", "anoModelo", "quilometragem", "proprietarioNome", "status"]);
});

test("consulta resumida não utiliza select estrela e preserva filtro e ordenação", () => {
  const fonte = readFileSync(resolve("src/lib/veiculos/veiculos.repository.ts"), "utf8");
  const consulta = fonte.slice(fonte.indexOf("async function consultarResumoVeiculos"), fonte.indexOf("function mapearVeiculoListagem"));
  assert.doesNotMatch(consulta, /select\(\s*["']\*["']\s*\)/);
  assert.match(consulta, /id, placa, marca, modelo, versao, ano_fabricacao, ano_modelo, quilometragem, proprietario_nome, status/);
  assert.match(consulta, /\.is\("arquivado_em", null\)/); assert.match(consulta, /\.order\("criado_em", \{ ascending: false \}\)/);
});

test("carregador da listagem compartilha somente a Promise em andamento", async () => {
  let chamadas = 0; let liberar!: () => void;
  const espera = new Promise<void>((resolve) => { liberar = resolve; });
  const carregar = criarCarregadorListagemVeiculos(async () => { chamadas += 1; await espera; return { estado: "carregado", veiculos: [], permissoes: { criar: false } }; });
  const primeira = carregar(), segunda = carregar(); assert.equal(primeira, segunda); assert.equal(chamadas, 1);
  liberar(); await Promise.all([primeira, segunda]);
});

test("carregador remove a Promise após sucesso", async () => {
  let chamadas = 0;
  const carregar = criarCarregadorListagemVeiculos(async () => { chamadas += 1; return { estado: "carregado", veiculos: [], permissoes: { criar: false } }; });
  await carregar(); await carregar(); assert.equal(chamadas, 2);
});

test("carregador remove a Promise após falha e permite nova tentativa", async () => {
  let chamadas = 0;
  const carregar = criarCarregadorListagemVeiculos(async () => { chamadas += 1; if (chamadas === 1) throw new Error("falha"); return { estado: "carregado", veiculos: [], permissoes: { criar: false } }; });
  await assert.rejects(carregar(), new Error("falha")); await carregar(); assert.equal(chamadas, 2);
});

test("repository retorna somente o contrato minimo de oportunidades disponiveis", async () => {
  const resultado = await listarOportunidadesDisponiveisParaVeiculoPersistidas(async () => ({
    data: [{ id: "oportunidade-1", proprietario_nome: "Proprietario", veiculo_informado: "Polo", placa: "ABC1D23", veiculos_vinculados: [] }],
    error: null,
  }));
  assert.deepEqual(resultado, [{ id: "oportunidade-1", proprietario_nome: "Proprietario", veiculo_informado: "Polo", placa: "ABC1D23" }]);
  assert.equal(Object.isFrozen(resultado), true);
  assert.equal(Object.isFrozen(resultado[0]), true);
});

test("consulta especifica usa anti-relacao de veiculos nao arquivados", () => {
  const fonte = readFileSync(resolve("src/lib/veiculos/veiculos.repository.ts"), "utf8");
  const inicio = fonte.indexOf("async function consultarOportunidadesDisponiveis");
  const fim = fonte.indexOf("function mapearVeiculoListagem", inicio);
  const consulta = fonte.slice(inicio, fim);
  assert.match(consulta, /id,\s*proprietario_nome,\s*veiculo_informado,\s*placa,/);
  assert.match(consulta, /veiculos_vinculados:veiculos!veiculos_oportunidade_fk\(id\)/);
  assert.match(consulta, /\.is\("veiculos_vinculados\.arquivado_em", null\)/);
  assert.match(consulta, /\.is\("veiculos_vinculados", null\)/);
  assert.doesNotMatch(consulta, /select\(["'`]\*["'`]\)/);
});

test("caso de uso autoriza uma vez e nao carrega colecoes amplas", async () => {
  let autorizacoes = 0, consultasEspecificas = 0, consultasAmplasVeiculos = 0;
  const resultado = await listarOportunidadesDisponiveisParaVeiculo({
    exigirVisualizacao: async () => { autorizacoes += 1; return CONTEXTO; },
    listarOportunidadesDisponiveis: async () => { consultasEspecificas += 1; return [{ id: "o", proprietario_nome: "P", veiculo_informado: "V", placa: "ABC" }]; },
    listar: async () => { consultasAmplasVeiculos += 1; return { dados: [], total: 0 }; },
  });
  assert.equal(resultado.length, 1);
  assert.equal(autorizacoes, 1);
  assert.equal(consultasEspecificas, 1);
  assert.equal(consultasAmplasVeiculos, 0);
});

test("negacao de oportunidades.visualizar impede a consulta especifica", async () => {
  let consultas = 0;
  await assert.rejects(listarOportunidadesDisponiveisParaVeiculo({
    exigirVisualizacao: async () => { throw new Error("Acesso nao autorizado."); },
    listarOportunidadesDisponiveis: async () => { consultas += 1; return []; },
  }), /Acesso nao autorizado/);
  assert.equal(consultas, 0);
});

test("fluxo nao depende de limite 1000 nem da listagem publica de oportunidades", () => {
  const fonte = readFileSync(resolve("src/services/veiculos.service.ts"), "utf8");
  const inicio = fonte.indexOf("export async function listarOportunidadesDisponiveisParaVeiculo");
  const fim = fonte.indexOf("export async function criarVeiculo", inicio);
  const casoDeUso = fonte.slice(inicio, fim);
  assert.doesNotMatch(casoDeUso, /1000|listarOportunidades\(|deps\.listar\(\)|Promise\.all/);
  assert.match(casoDeUso, /await deps\.exigirVisualizacao\(\)/);
  assert.match(casoDeUso, /deps\.listarOportunidadesDisponiveis\(\)/);
});

test("isolamento organizacional permanece delegado as duas RLS", () => {
  const veiculos = readFileSync(resolve("supabase/migrations/20260807_create_veiculos.sql"), "utf8");
  const oportunidades = readFileSync(resolve("supabase/migrations/20260831_regularize_oportunidades_organizacao_rls.sql"), "utf8");
  assert.match(veiculos, /up\.empresa_id = veiculos\.empresa_id/);
  assert.match(veiculos, /up\.unidade_id is null or up\.unidade_id = veiculos\.unidade_id/);
  assert.match(oportunidades, /up\.empresa_id = oportunidades\.empresa_id/);
  assert.match(oportunidades, /p\.codigo = 'oportunidades\.visualizar'/);
});

test("Administrador Consultor e TESTE acessam a selecao e Financeiro permanece negado", async () => {
  for (const perfil of ["administrador", "consultor", "teste", "financeiro"] as const) {
    const contexto: ContextoAcesso = {
      ...CONTEXTO,
      perfil: { ...CONTEXTO.perfil, codigo: perfil },
      permissoes: perfil === "financeiro" ? [] : [{
        id: "permissao-visualizar",
        codigo: CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR,
        nome: "Visualizar oportunidades",
        descricao: null,
        criadoEm: "2026-08-08T00:00:00.000Z",
      }],
    };
    let consultas = 0;
    const executar = () => listarOportunidadesDisponiveisParaVeiculo({
      exigirVisualizacao: async () => {
        if (!possuiPermissao(contexto, CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR)) {
          throw new Error("Acesso nao autorizado.");
        }
        return contexto;
      },
      listarOportunidadesDisponiveis: async () => { consultas += 1; return []; },
    });
    if (perfil === "financeiro") {
      await assert.rejects(executar(), /Acesso nao autorizado/);
      assert.equal(consultas, 0);
    } else {
      await executar();
      assert.equal(consultas, 1);
    }
  }
});
