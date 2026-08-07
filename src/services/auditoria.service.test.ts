import assert from "node:assert/strict";
import { test } from "node:test";
import { ACOES_AUDITORIA, ORIGENS_AUDITORIA, RESULTADOS_AUDITORIA } from "@/core/auditoria";
import type { RegistroAuditoria } from "@/core/auditoria";
import { listarAuditoria } from "./auditoria.service";

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
