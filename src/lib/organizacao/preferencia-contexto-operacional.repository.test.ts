import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  CHAVE_PREFERENCIA_CONTEXTO_OPERACIONAL,
  obterPreferenciaContextoOperacional,
  removerPreferenciaContextoOperacional,
  salvarPreferenciaContextoOperacional,
  type ArmazenamentoPreferenciaContextoOperacional,
} from "./preferencia-contexto-operacional.repository";

function armazenamentoEmMemoria() {
  const dados = new Map<string, string>();
  let remocoes = 0;
  const armazenamento: ArmazenamentoPreferenciaContextoOperacional = {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => { dados.set(chave, valor); },
    removeItem: (chave) => { remocoes += 1; dados.delete(chave); },
  };
  return { armazenamento, dados, remocoes: () => remocoes };
}

test("preferência válida serializa somente usuarioId e unidadeId", () => {
  const memoria = armazenamentoEmMemoria();
  assert.equal(salvarPreferenciaContextoOperacional({ usuarioId: " usuario-1 ", unidadeId: " unidade-1 " }, memoria.armazenamento), true);
  assert.equal(memoria.dados.get(CHAVE_PREFERENCIA_CONTEXTO_OPERACIONAL), JSON.stringify({ usuarioId: "usuario-1", unidadeId: "unidade-1" }));
  assert.deepEqual(Object.keys(JSON.parse(memoria.dados.get(CHAVE_PREFERENCIA_CONTEXTO_OPERACIONAL)!)).sort(), ["unidadeId", "usuarioId"]);
});

test("leitura válida recupera a preferência da aba", () => {
  const memoria = armazenamentoEmMemoria();
  memoria.dados.set(CHAVE_PREFERENCIA_CONTEXTO_OPERACIONAL, JSON.stringify({ usuarioId: "usuario-1", unidadeId: "unidade-1" }));
  assert.deepEqual(obterPreferenciaContextoOperacional(memoria.armazenamento), { usuarioId: "usuario-1", unidadeId: "unidade-1" });
});

test("remoção elimina a preferência", () => {
  const memoria = armazenamentoEmMemoria();
  memoria.dados.set(CHAVE_PREFERENCIA_CONTEXTO_OPERACIONAL, "valor");
  removerPreferenciaContextoOperacional(memoria.armazenamento);
  assert.equal(memoria.dados.has(CHAVE_PREFERENCIA_CONTEXTO_OPERACIONAL), false);
});

for (const [nome, valor] of [
  ["JSON corrompido", "{"],
  ["estrutura inválida", JSON.stringify({ usuarioId: "usuario-1" })],
  ["campo adicional", JSON.stringify({ usuarioId: "usuario-1", unidadeId: "unidade-1", empresaId: "empresa" })],
  ["usuarioId vazio", JSON.stringify({ usuarioId: "  ", unidadeId: "unidade-1" })],
  ["unidadeId vazia", JSON.stringify({ usuarioId: "usuario-1", unidadeId: "  " })],
] as const) {
  test(`${nome} resulta em ausência e é removido`, () => {
    const memoria = armazenamentoEmMemoria();
    memoria.dados.set(CHAVE_PREFERENCIA_CONTEXTO_OPERACIONAL, valor);
    assert.equal(obterPreferenciaContextoOperacional(memoria.armazenamento), null);
    assert.equal(memoria.dados.has(CHAVE_PREFERENCIA_CONTEXTO_OPERACIONAL), false);
    assert.equal(memoria.remocoes(), 1);
  });
}

test("IDs vazios não são persistidos", () => {
  const memoria = armazenamentoEmMemoria();
  assert.equal(salvarPreferenciaContextoOperacional({ usuarioId: "", unidadeId: "unidade-1" }, memoria.armazenamento), false);
  assert.equal(salvarPreferenciaContextoOperacional({ usuarioId: "usuario-1", unidadeId: " " }, memoria.armazenamento), false);
  assert.equal(memoria.dados.size, 0);
});

test("ausência de window ou sessionStorage não derruba a aplicação", () => {
  assert.equal(obterPreferenciaContextoOperacional(), null);
  assert.equal(salvarPreferenciaContextoOperacional({ usuarioId: "usuario-1", unidadeId: "unidade-1" }), false);
  assert.doesNotThrow(() => removerPreferenciaContextoOperacional());
});

test("falhas do sessionStorage são tratadas como indisponibilidade local", () => {
  const falho: ArmazenamentoPreferenciaContextoOperacional = {
    getItem: () => { throw new Error("indisponível"); },
    setItem: () => { throw new Error("indisponível"); },
    removeItem: () => { throw new Error("indisponível"); },
  };
  assert.equal(obterPreferenciaContextoOperacional(falho), null);
  assert.equal(salvarPreferenciaContextoOperacional({ usuarioId: "usuario-1", unidadeId: "unidade-1" }, falho), false);
  assert.doesNotThrow(() => removerPreferenciaContextoOperacional(falho));
});

test("duas abas usam armazenamentos independentes e não sincronizam", () => {
  const aba1 = armazenamentoEmMemoria();
  const aba2 = armazenamentoEmMemoria();
  salvarPreferenciaContextoOperacional({ usuarioId: "usuario-1", unidadeId: "loja-a" }, aba1.armazenamento);
  salvarPreferenciaContextoOperacional({ usuarioId: "usuario-1", unidadeId: "loja-b" }, aba2.armazenamento);
  assert.equal(obterPreferenciaContextoOperacional(aba1.armazenamento)?.unidadeId, "loja-a");
  assert.equal(obterPreferenciaContextoOperacional(aba2.armazenamento)?.unidadeId, "loja-b");
});

test("adapter não usa localStorage, cookies, rede ou banco", () => {
  const fonte = readFileSync(resolve(process.cwd(), "src/lib/organizacao/preferencia-contexto-operacional.repository.ts"), "utf8");
  assert.doesNotMatch(fonte, /localStorage|document\.cookie|cookies\(|supabase|\.from\(|\.rpc\(/);
  assert.match(fonte, /window\.sessionStorage/);
});
