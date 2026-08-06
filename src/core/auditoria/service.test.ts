import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  ACOES_AUDITORIA,
  ORIGENS_AUDITORIA,
  RESULTADOS_AUDITORIA,
} from "./constants";
import {
  limparEventosAuditoriaParaTestes,
  listarEventosAuditoria,
  obterEventoAuditoriaPorId,
  registrarEventoAuditoria,
} from "./service";
import type { EntradaRegistroAuditoria, ValorAuditoria } from "./types";

function criarEntrada(
  detalhes: Readonly<Record<string, ValorAuditoria>> | null = null
): EntradaRegistroAuditoria {
  return {
    empresaId: "00000000-0000-4000-8000-000000000001",
    unidadeId: "00000000-0000-4000-8000-000000000002",
    usuarioId: null,
    modulo: "testes",
    acao: ACOES_AUDITORIA.CRIAR,
    recursoTipo: "registro_teste",
    recursoId: null,
    resultado: RESULTADOS_AUDITORIA.SUCESSO,
    origem: ORIGENS_AUDITORIA.SISTEMA,
    detalhes,
  };
}

beforeEach(() => {
  limparEventosAuditoriaParaTestes();
});

test("registra um evento com identificador e data gerados", () => {
  const registro = registrarEventoAuditoria(criarEntrada());

  assert.equal(registro.modulo, "testes");
  assert.match(
    registro.id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  );
  assert.equal(Number.isNaN(Date.parse(registro.criadoEm)), false);
});

test("gera identificadores únicos", () => {
  const primeiro = registrarEventoAuditoria(criarEntrada());
  const segundo = registrarEventoAuditoria(criarEntrada());

  assert.notEqual(primeiro.id, segundo.id);
});

test("lista os eventos registrados", () => {
  registrarEventoAuditoria(criarEntrada());
  registrarEventoAuditoria(criarEntrada());

  assert.equal(listarEventosAuditoria().length, 2);
});

test("busca um evento pelo identificador", () => {
  const registrado = registrarEventoAuditoria(criarEntrada());

  assert.deepEqual(obterEventoAuditoriaPorId(registrado.id), registrado);
});

test("retorna null para um identificador inexistente", () => {
  assert.equal(obterEventoAuditoriaPorId("inexistente"), null);
});

test("ordena eventos do mais recente para o mais antigo", async () => {
  const maisAntigo = registrarEventoAuditoria(criarEntrada());
  await new Promise((resolve) => setTimeout(resolve, 2));
  const maisRecente = registrarEventoAuditoria(criarEntrada());

  const eventos = listarEventosAuditoria();

  assert.deepEqual(
    eventos.map((evento) => evento.id),
    [maisRecente.id, maisAntigo.id]
  );
});

test("alterar um registro devolvido não modifica o estado interno", () => {
  const devolvido = registrarEventoAuditoria(criarEntrada());
  devolvido.modulo = "alterado externamente";

  const armazenado = obterEventoAuditoriaPorId(devolvido.id);

  assert.equal(armazenado?.modulo, "testes");
});

test("alterar a lista devolvida não modifica a coleção interna", () => {
  registrarEventoAuditoria(criarEntrada());
  const eventos = listarEventosAuditoria();
  eventos.length = 0;

  assert.equal(listarEventosAuditoria().length, 1);
});

test("copia os detalhes recebidos e desvincula o objeto de entrada", () => {
  const detalhes: Record<string, ValorAuditoria> = { campo: "original" };
  const registrado = registrarEventoAuditoria(criarEntrada(detalhes));
  detalhes.campo = "alterado";

  const armazenado = obterEventoAuditoriaPorId(registrado.id);

  assert.deepEqual(armazenado?.detalhes, { campo: "original" });
});

test("desvincula objetos aninhados do objeto de entrada", () => {
  const detalhes = { objeto: { campo: "original" } };
  const registrado = registrarEventoAuditoria(criarEntrada(detalhes));
  detalhes.objeto.campo = "alterado";

  const armazenado = obterEventoAuditoriaPorId(registrado.id);

  assert.deepEqual(armazenado?.detalhes, {
    objeto: { campo: "original" },
  });
});

test("desvincula listas aninhadas do objeto de entrada", () => {
  const detalhes = { lista: [{ campo: "original" }] };
  const registrado = registrarEventoAuditoria(criarEntrada(detalhes));
  detalhes.lista[0].campo = "alterado";

  const armazenado = obterEventoAuditoriaPorId(registrado.id);

  assert.deepEqual(armazenado?.detalhes, {
    lista: [{ campo: "original" }],
  });
});

test("alterar objeto aninhado devolvido não modifica o estado interno", () => {
  const registrado = registrarEventoAuditoria(
    criarEntrada({ objeto: { campo: "original" } })
  );
  const detalhesDevolvidos = registrado.detalhes as {
    objeto: { campo: string };
  };
  detalhesDevolvidos.objeto.campo = "alterado";

  const armazenado = obterEventoAuditoriaPorId(registrado.id);

  assert.deepEqual(armazenado?.detalhes, {
    objeto: { campo: "original" },
  });
});

test("alterar lista aninhada devolvida não modifica o estado interno", () => {
  const registrado = registrarEventoAuditoria(
    criarEntrada({ lista: [{ campo: "original" }] })
  );
  const detalhesDevolvidos = registrado.detalhes as {
    lista: Array<{ campo: string }>;
  };
  detalhesDevolvidos.lista[0].campo = "alterado";

  const armazenado = obterEventoAuditoriaPorId(registrado.id);

  assert.deepEqual(armazenado?.detalhes, {
    lista: [{ campo: "original" }],
  });
});
