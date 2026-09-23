import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { ACOES_AUDITORIA, ORIGENS_AUDITORIA, RESULTADOS_AUDITORIA } from "@/core/auditoria";
import { CODIGOS_PERMISSAO_ACESSO, type CodigoPerfilAcesso, type ContextoAcesso } from "@/core/acesso";
import { obterUnidadeAtual } from "@/core/organizacao";
import type { RegistroAuditoria } from "@/core/auditoria";
import {
  criarCarregadorAuditoriaParaTela,
  ehErroConsultaAuditoriaCancelada,
  ErroConsultaAuditoriaCancelada,
  listarAuditoria,
  obterDadosAuditoriaParaTela,
} from "./auditoria.service";

function registro(sobrescrever: Partial<RegistroAuditoria> = {}): RegistroAuditoria {
  return {
    id: "00000000-0000-4000-8000-000000000301",
    empresaId: "00000000-0000-4000-8000-000000000001",
    unidadeId: null,
    usuarioId: "usuario-auth-1",
    modulo: "oportunidades",
    acao: ACOES_AUDITORIA.CRIAR,
    recursoTipo: "oportunidade",
    recursoId: "oportunidade-1",
    resultado: RESULTADOS_AUDITORIA.SUCESSO,
    origem: ORIGENS_AUDITORIA.USUARIO,
    detalhes: { perfilCodigo: "consultor", placa: "ABC1D23" },
    criadoEm: "2026-08-07T12:30:00.000Z",
    ...sobrescrever,
  };
}

function consultaCom(dados: RegistroAuditoria[], total = dados.length) {
  return async (parametros: { pagina?: number; itensPorPagina?: number }) => ({
    dados,
    total,
    pagina: parametros.pagina ?? 1,
    itensPorPagina: parametros.itensPorPagina ?? 10,
  });
}

const resolverUsuario = async () => ({
  id: "usuario-auth-1",
  email: "charles@inato.com",
});

test("transforma registro persistido, resolve e-mail e extrai perfil e placa", async () => {
  const resultado = await listarAuditoria({}, consultaCom([registro()]), resolverUsuario);
  assert.deepEqual(resultado.dados[0], {
    id: "00000000-0000-4000-8000-000000000301",
    data: "07/08/2026",
    hora: "09:30:00",
    usuario: "charles@inato.com",
    perfil: "consultor",
    modulo: "Oportunidades",
    acao: "Criou",
    resultado: "Sucesso",
    recurso: "oportunidade",
    placa: "ABC1D23",
  });
});

test("administrador autenticado é identificado pelo snapshot confiável", async () => {
  const evento = registro({ detalhes: { perfilCodigo: "administrador", placa: "ADM1A23", usuarioEmail: "administrador@inato.test" } });
  const resultado = await listarAuditoria({}, consultaCom([evento]), async () => ({ id: "outro-visualizador", email: "visualizador@inato.test" }));
  assert.equal(resultado.dados[0].usuario, "administrador@inato.test");
  assert.equal(resultado.dados[0].perfil, "administrador");
});

test("consultor autenticado é identificado mesmo quando administrador consulta", async () => {
  const evento = registro({ usuarioId: "consultor-id", detalhes: { perfilCodigo: "consultor", placa: "CON1S23", usuarioEmail: "consultor@inato.test" } });
  const resultado = await listarAuditoria({}, consultaCom([evento]), resolverUsuario);
  assert.equal(resultado.dados[0].usuario, "consultor@inato.test");
  assert.equal(resultado.dados[0].perfil, "consultor");
});

for (const usuario of [
  { id: "administrador-id", email: "administrador@inato.test" },
  { id: "consultor-id", email: "consultor@inato.test" },
]) {
  test(`expiração automática disparada por ${usuario.id} é apresentada como Sistema`, async () => {
    const evento = registro({
      usuarioId: usuario.id,
      modulo: "reservas",
      acao: ACOES_AUDITORIA.ALTERAR,
      origem: ORIGENS_AUDITORIA.SISTEMA,
      recursoTipo: "reserva",
      detalhes: { autoria: "sistema", motivo: "expiracao_24_horas", statusAnterior: "ativa", statusNovo: "expirada" },
    });
    const resultado = await listarAuditoria({}, consultaCom([evento]), async () => usuario);
    assert.equal(resultado.dados[0].usuario, "Sistema");
    assert.equal(resultado.dados[0].acao, "Expirou");
  });
}

test("evento manual continua atribuído ao usuário real", async () => {
  const evento = registro({ detalhes: { perfilCodigo: "consultor", usuarioEmail: "consultor@inato.test" } });
  const resultado = await listarAuditoria({}, consultaCom([evento]), resolverUsuario);
  assert.equal(resultado.dados[0].usuario, "consultor@inato.test");
  assert.equal(resultado.dados[0].acao, "Criou");
});

test("calcula total de páginas", async () => {
  assert.equal((await listarAuditoria({}, consultaCom([], 21), resolverUsuario)).totalPaginas, 3);
});

test("utiliza página 1 e 10 itens por padrão", async () => {
  let recebidos: { pagina?: number; itensPorPagina?: number } = {};
  await listarAuditoria({}, async (parametros) => {
    recebidos = parametros;
    return { dados: [], total: 0, pagina: parametros.pagina ?? 1, itensPorPagina: parametros.itensPorPagina ?? 10 };
  }, resolverUsuario);
  assert.equal(recebidos.pagina, 1);
  assert.equal(recebidos.itensPorPagina, 10);
});

test("encaminha filtros e preserva ordenação recebida", async () => {
  let recebidos: Record<string, unknown> = {};
  const recente = registro({ id: "recente", criadoEm: "2026-08-07T13:00:00.000Z" });
  const antigo = registro({ id: "antigo" });
  const resultado = await listarAuditoria(
    { modulo: "oportunidades", acao: ACOES_AUDITORIA.ALTERAR, resultado: RESULTADOS_AUDITORIA.FALHA },
    async (parametros) => {
      recebidos = parametros;
      return { dados: [recente, antigo], total: 2, pagina: 1, itensPorPagina: 10 };
    },
    resolverUsuario
  );
  assert.equal(recebidos.modulo, "oportunidades");
  assert.equal(recebidos.acao, "alterar");
  assert.equal(recebidos.resultado, "falha");
  assert.deepEqual(resultado.dados.map(({ id }) => id), ["recente", "antigo"]);
});

test("trata ausência de placa", async () => {
  const resultado = await listarAuditoria({}, consultaCom([registro({ detalhes: { perfilCodigo: "administrador" } })]), resolverUsuario);
  assert.equal(resultado.dados[0].placa, "—");
});

test("trata usuário diferente como não identificado", async () => {
  const resultado = await listarAuditoria({}, consultaCom([registro({ usuarioId: "outro" })]), resolverUsuario);
  assert.equal(resultado.dados[0].usuario, "Usuário não identificado");
});

test("trata resultado vazio", async () => {
  const resultado = await listarAuditoria({}, consultaCom([]), resolverUsuario);
  assert.deepEqual(resultado.dados, []);
  assert.equal(resultado.totalPaginas, 1);
});

test("converte erro em mensagem controlada", async () => {
  await assert.rejects(
    listarAuditoria({}, async () => { throw new Error("erro técnico"); }, resolverUsuario),
    new Error("Não foi possível carregar a auditoria.")
  );
});

function contexto(perfil: CodigoPerfilAcesso, autorizado: boolean): ContextoAcesso {
  const unidade = obterUnidadeAtual();
  return {
    vinculo: { id: "vinculo", usuarioId: "usuario-auth-1", redeId: "rede-matriz", operacaoId: "operacao-matriz", areaOperacionalId: "area-patrocinio", escopoTipo: "unidade", empresaId: unidade.empresaId, unidadeId: unidade.id, perfilId: "perfil", ativo: true, criadoEm: "2026-08-07T12:00:00.000Z" },
    perfil: { id: "perfil", codigo: perfil, nome: perfil, descricao: null, ativo: true, criadoEm: "2026-08-07T12:00:00.000Z" },
    permissoes: autorizado ? [{ id: "permissao", codigo: CODIGOS_PERMISSAO_ACESSO.AUDITORIA_VISUALIZAR, nome: "Visualizar auditoria", descricao: null, criadoEm: "2026-08-07T12:00:00.000Z" }] : [],
  };
}

test("abertura resolve uma única autoridade e deriva dela usuário e cabeçalho", async () => {
  const usuario = await resolverUsuario();
  const acesso = contexto("administrador", true);
  let resolucoes = 0;
  let usuarioRecebido: unknown;
  const resultado = await obterDadosAuditoriaParaTela({ pagina: 2, termoPesquisa: "ABC" }, {
    obterAutoridade: async () => { resolucoes += 1; return { usuario, contexto: acesso }; },
    obterContextoOperacional: async () => ({ redeId: "rede-matriz", operacaoId: "operacao-matriz", areaOperacionalId: "area-patrocinio", empresaId: acesso.vinculo.empresaId!, unidadeId: acesso.vinculo.unidadeId! }),
    listar: async (parametros, recebido) => { usuarioRecebido = recebido; assert.equal(parametros.pagina, 2); assert.equal(parametros.termoPesquisa, "ABC"); return { dados: [], total: 0, pagina: 2, itensPorPagina: 10, totalPaginas: 1 }; },
  });
  assert.equal(resolucoes, 1);
  assert.equal(usuarioRecebido, usuario);
  assert.equal(resultado.estado, "carregado");
  if (resultado.estado === "carregado") assert.deepEqual(resultado.usuarioVisivel, { email: usuario.email, perfil: "administrador", unidade: obterUnidadeAtual().nome });
});

for (const [perfil, autorizado] of [["administrador", true], ["consultor", false], ["teste", false], ["financeiro", false]] as const) {
  test(`abertura preserva acesso do perfil ${perfil}`, async () => {
    let consultas = 0;
    const resultado = await obterDadosAuditoriaParaTela({}, {
      obterAutoridade: async () => ({ usuario: await resolverUsuario(), contexto: contexto(perfil, autorizado) }),
      obterContextoOperacional: async () => ({ redeId: "rede-matriz", operacaoId: "operacao-matriz", areaOperacionalId: "area-patrocinio", empresaId: obterUnidadeAtual().empresaId, unidadeId: obterUnidadeAtual().id }),
      listar: async () => { consultas += 1; return { dados: [], total: 0, pagina: 1, itensPorPagina: 10, totalPaginas: 1 }; },
    });
    assert.equal(resultado.estado, autorizado ? "carregado" : "acesso_negado");
    assert.equal(consultas, autorizado ? 1 : 0);
  });
}

test("ausência de autoridade redirecionável não consulta eventos", async () => {
  let consultou = false;
  const resultado = await obterDadosAuditoriaParaTela({}, { obterAutoridade: async () => null, obterContextoOperacional: async () => { throw new Error(); }, listar: async () => { consultou = true; throw new Error(); } });
  assert.deepEqual(resultado, { estado: "nao_autenticado" });
  assert.equal(consultou, false);
});

test("carregador compartilha somente carga idêntica em andamento", async () => {
  let liberar!: () => void;
  const espera = new Promise<void>((resolve) => { liberar = resolve; });
  let chamadas = 0;
  const carregar = criarCarregadorAuditoriaParaTela(async () => { chamadas += 1; await espera; return { estado: "acesso_negado" }; });
  const primeira = carregar({ pagina: 1, termoPesquisa: "ABC", modulo: "reservas" });
  const segunda = carregar({ pagina: 1, termoPesquisa: "ABC", modulo: "reservas" });
  assert.equal(primeira, segunda);
  liberar();
  await Promise.all([primeira, segunda]);
  assert.equal(chamadas, 1);
});

test("filtros e páginas diferentes não compartilham carga", async () => {
  let chamadas = 0;
  const carregar = criarCarregadorAuditoriaParaTela(async () => { chamadas += 1; return { estado: "acesso_negado" }; });
  await Promise.all([carregar({ pagina: 1, modulo: "reservas" }), carregar({ pagina: 2, modulo: "reservas" }), carregar({ pagina: 1, modulo: "veiculos" })]);
  assert.equal(chamadas, 3);
});

test("carga concluída não vira cache persistente", async () => {
  let chamadas = 0;
  const carregar = criarCarregadorAuditoriaParaTela(async () => { chamadas += 1; return { estado: "acesso_negado" }; });
  await carregar({ pagina: 1 });
  await carregar({ pagina: 1 });
  assert.equal(chamadas, 2);
});

test("falha limpa a Promise e permite nova tentativa", async () => {
  let chamadas = 0;
  const carregar = criarCarregadorAuditoriaParaTela(async () => { chamadas += 1; if (chamadas === 1) throw new Error("falha"); return { estado: "acesso_negado" }; });
  await assert.rejects(carregar({ pagina: 1 }), new Error("falha"));
  assert.deepEqual(await carregar({ pagina: 1 }), { estado: "acesso_negado" });
  assert.equal(chamadas, 2);
});

test("abertura encaminha o sinal de cancelamento ate a consulta persistente", async () => {
  const controlador = new AbortController();
  let sinalRecebido: AbortSignal | undefined;
  await obterDadosAuditoriaParaTela({}, {
    obterAutoridade: async () => ({ usuario: await resolverUsuario(), contexto: contexto("administrador", true) }),
    obterContextoOperacional: async () => ({ redeId: "rede-matriz", operacaoId: "operacao-matriz", areaOperacionalId: "area-patrocinio", empresaId: obterUnidadeAtual().empresaId, unidadeId: obterUnidadeAtual().id }),
    listar: async (_parametros, _usuario, _contexto, sinal) => {
      sinalRecebido = sinal;
      return { dados: [], total: 0, pagina: 1, itensPorPagina: 10, totalPaginas: 1 };
    },
  }, controlador.signal);
  assert.equal(sinalRecebido, controlador.signal);
});

test("carga identica em andamento preserva a mesma Promise e nao aborta", async () => {
  let liberar!: () => void;
  const espera = new Promise<void>((resolve) => { liberar = resolve; });
  const sinais: AbortSignal[] = [];
  const carregar = criarCarregadorAuditoriaParaTela(async (_parametros, sinal) => {
    assert.ok(sinal);
    sinais.push(sinal);
    await espera;
    return { estado: "acesso_negado" };
  });
  const primeira = carregar({ pagina: 1, termoPesquisa: "ABC" });
  const segunda = carregar({ pagina: 1, termoPesquisa: "ABC" });
  assert.equal(primeira, segunda);
  assert.equal(sinais.length, 1);
  assert.equal(sinais[0].aborted, false);
  liberar();
  await primeira;
});

test("nova chave cancela fisicamente a consulta anterior e preserva a atual", async () => {
  const sinais = new Map<string, AbortSignal>();
  const carregar = criarCarregadorAuditoriaParaTela(async (parametros, sinal) => {
    assert.ok(sinal);
    const termo = parametros.termoPesquisa ?? "";
    sinais.set(termo, sinal);
    if (termo === "A") {
      await new Promise<void>((_resolve, reject) => {
        sinal.addEventListener("abort", () => reject(new ErroConsultaAuditoriaCancelada()), { once: true });
      });
    }
    return { estado: "acesso_negado" };
  });
  const anterior = carregar({ pagina: 1, termoPesquisa: "A" });
  const atual = carregar({ pagina: 1, termoPesquisa: "AB" });
  await assert.rejects(anterior, ErroConsultaAuditoriaCancelada);
  assert.deepEqual(await atual, { estado: "acesso_negado" });
  assert.equal(sinais.get("A")?.aborted, true);
  assert.equal(sinais.get("AB")?.aborted, false);
});

test("mudancas de pagina, modulo, acao e resultado cancelam a chave obsoleta", async () => {
  const sinais: AbortSignal[] = [];
  const pendentes: Array<() => void> = [];
  const carregar = criarCarregadorAuditoriaParaTela(async (_parametros, sinal) => {
    assert.ok(sinal);
    sinais.push(sinal);
    await new Promise<void>((resolve) => {
      pendentes.push(resolve);
      sinal.addEventListener("abort", () => resolve(), { once: true });
    });
    return { estado: "acesso_negado" };
  });
  const pagina = carregar({ pagina: 1, modulo: "reservas" });
  const filtro = carregar({ pagina: 2, modulo: "reservas" });
  const modulo = carregar({ pagina: 2, modulo: "veiculos" });
  const acao = carregar({ pagina: 2, modulo: "veiculos", acao: ACOES_AUDITORIA.ALTERAR });
  const resultado = carregar({ pagina: 2, modulo: "veiculos", acao: ACOES_AUDITORIA.ALTERAR, resultado: RESULTADOS_AUDITORIA.FALHA });
  assert.equal(sinais[0].aborted, true);
  assert.equal(sinais[1].aborted, true);
  assert.equal(sinais[2].aborted, true);
  assert.equal(sinais[3].aborted, true);
  assert.equal(sinais[4].aborted, false);
  pendentes.at(-1)?.();
  await Promise.all([pagina, filtro, modulo, acao, resultado]);
});

test("voltar a chave anterior depois do aborto cria consulta nova", async () => {
  const sinais: AbortSignal[] = [];
  const carregar = criarCarregadorAuditoriaParaTela(async (parametros, sinal) => {
    assert.ok(sinal);
    sinais.push(sinal);
    if (parametros.termoPesquisa !== "A" || sinais.length > 2) return { estado: "acesso_negado" };
    await new Promise<void>((resolve) => sinal.addEventListener("abort", () => resolve(), { once: true }));
    return { estado: "acesso_negado" };
  });
  const primeiraA = carregar({ termoPesquisa: "A" });
  await carregar({ termoPesquisa: "B" });
  await primeiraA;
  await carregar({ termoPesquisa: "A" });
  assert.equal(sinais.length, 3);
  assert.notEqual(sinais[0], sinais[2]);
  assert.equal(sinais[2].aborted, false);
});

test("cancelamento esperado e distinguido de falha real", async () => {
  const controlador = new AbortController();
  const consulta = listarAuditoria({}, async (_parametros, sinal) => {
    await new Promise<void>((_resolve, reject) => {
      sinal?.addEventListener("abort", () => reject(new Error("AbortError")), { once: true });
    });
    return { dados: [], total: 0, pagina: 1, itensPorPagina: 10 };
  }, resolverUsuario, controlador.signal);
  controlador.abort();
  await assert.rejects(consulta, (erro) => ehErroConsultaAuditoriaCancelada(erro));
});

test("interface preserva debounce de 400 ms e ignora cancelamento esperado", () => {
  const componente = readFileSync(join(process.cwd(), "src/components/auditoria/AuditoriaContainer.tsx"), "utf8");
  assert.match(componente, /setTimeout\([\s\S]*?,\s*400\)/);
  assert.match(componente, /clearTimeout\(temporizador\)/);
  assert.match(componente, /const \[termoPesquisa, setTermoPesquisa\]/);
  assert.match(componente, /if \(!ativo\) return/);
  assert.match(componente, /ehErroConsultaAuditoriaCancelada\(erroAtual\)/);
});
