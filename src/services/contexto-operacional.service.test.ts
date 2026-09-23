import assert from "node:assert/strict";
import { test } from "node:test";
import { CODIGOS_PERFIL_ACESSO, type ContextoAcesso } from "@/core/acesso";
import type { ContextoOperacionalAtivo, PreferenciaContextoOperacional } from "@/core/organizacao";
import { ErroSelecaoContextoOperacionalNaoAutorizada } from "./acesso.service";
import {
  definirPreferenciaContextoOperacionalAtual,
  exigirContextoOperacionalAtivoAtual,
  limparPreferenciaContextoOperacional,
  obterContextoOperacionalPreferidoAtual,
  type DependenciasContextoOperacional,
} from "./contexto-operacional.service";

const contextoResolvido: ContextoOperacionalAtivo = {
  redeId: "rede-1", operacaoId: "operacao-1", areaOperacionalId: "area-1", empresaId: "empresa-1", unidadeId: "unidade-1",
};

function contexto(escopoTipo: "unidade" | "rede" | "operacao" | "area_operacional"): ContextoAcesso {
  return {
    vinculo: {
      id: "vinculo-1", usuarioId: "usuario-1", redeId: "rede-1",
      operacaoId: escopoTipo === "rede" ? null : "operacao-1",
      areaOperacionalId: escopoTipo === "area_operacional" || escopoTipo === "unidade" ? "area-1" : null,
      empresaId: escopoTipo === "unidade" ? "empresa-1" : null,
      unidadeId: escopoTipo === "unidade" ? "unidade-1" : null,
      escopoTipo, perfilId: "perfil-1", ativo: true, criadoEm: "2026-09-23T00:00:00.000Z",
    },
    perfil: { id: "perfil-1", codigo: CODIGOS_PERFIL_ACESSO.ADMINISTRADOR, nome: "Administrador", descricao: null, ativo: true, criadoEm: "2026-09-23T00:00:00.000Z" },
    permissoes: [],
  };
}

function criarDependencias(
  escopoTipo: "unidade" | "rede" | "operacao" | "area_operacional" = "rede",
  preferencia: PreferenciaContextoOperacional | null = null,
) {
  const chamadas = { obter: 0, salvar: 0, remover: 0, resolver: 0 };
  const deps: DependenciasContextoOperacional = {
    obterAutoridade: async () => ({ usuario: { id: "usuario-1", email: "usuario@inato.test" }, contexto: contexto(escopoTipo) }),
    obterPreferencia: () => { chamadas.obter += 1; return preferencia; },
    salvarPreferencia: () => { chamadas.salvar += 1; return true; },
    removerPreferencia: () => { chamadas.remover += 1; },
    resolverContexto: async ({ unidadeId }) => { chamadas.resolver += 1; assert.equal(unidadeId, "unidade-1"); return contextoResolvido; },
  };
  return { deps, chamadas };
}

test("usuário não autenticado remove preferência e não produz contexto", async () => {
  const base = criarDependencias();
  const deps = { ...base.deps, obterAutoridade: async () => null };
  assert.deepEqual(await obterContextoOperacionalPreferidoAtual(deps), { estado: "nao_autenticado" });
  assert.equal(base.chamadas.remover, 1);
  assert.equal(base.chamadas.obter, 0);
  assert.equal(base.chamadas.resolver, 0);
});

test("escopo Unidade continua automático e não depende do storage", async () => {
  const base = criarDependencias("unidade", { usuarioId: "outro", unidadeId: "outra" });
  const deps = { ...base.deps, obterPreferencia: () => { throw new Error("storage não deve ser consultado"); } };
  assert.deepEqual(await obterContextoOperacionalPreferidoAtual(deps), { estado: "contexto_resolvido", contexto: contextoResolvido });
  assert.equal(base.chamadas.resolver, 0);
});

for (const escopo of ["rede", "operacao", "area_operacional"] as const) {
  test(`escopo ${escopo} sem preferência exige seleção sem escolher Unidade`, async () => {
    const base = criarDependencias(escopo);
    assert.deepEqual(await obterContextoOperacionalPreferidoAtual(base.deps), { estado: "selecao_necessaria" });
    assert.equal(base.chamadas.resolver, 0);
    assert.equal(base.chamadas.salvar, 0);
  });
}

test("preferência de outro usuário é descartada sem revalidação", async () => {
  const base = criarDependencias("rede", { usuarioId: "usuario-2", unidadeId: "unidade-1" });
  assert.deepEqual(await obterContextoOperacionalPreferidoAtual(base.deps), { estado: "selecao_necessaria" });
  assert.equal(base.chamadas.remover, 1);
  assert.equal(base.chamadas.resolver, 0);
});

test("preferência autorizada é revalidada e contexto completo vem do resolvedor", async () => {
  const base = criarDependencias("rede", { usuarioId: "usuario-1", unidadeId: "unidade-1" });
  assert.deepEqual(await obterContextoOperacionalPreferidoAtual(base.deps), { estado: "contexto_resolvido", contexto: contextoResolvido });
  assert.equal(base.chamadas.resolver, 1);
});

test("preferência não autorizada é removida e exige nova seleção", async () => {
  const base = criarDependencias("rede", { usuarioId: "usuario-1", unidadeId: "unidade-1" });
  const deps = { ...base.deps, resolverContexto: async () => { throw new ErroSelecaoContextoOperacionalNaoAutorizada(); } };
  assert.deepEqual(await obterContextoOperacionalPreferidoAtual(deps), { estado: "selecao_necessaria" });
  assert.equal(base.chamadas.remover, 1);
});

test("erro real de infraestrutura é propagado e não remove preferência", async () => {
  const base = criarDependencias("rede", { usuarioId: "usuario-1", unidadeId: "unidade-1" });
  const erro = new Error("infraestrutura indisponível");
  const deps = { ...base.deps, resolverContexto: async () => { throw erro; } };
  await assert.rejects(obterContextoOperacionalPreferidoAtual(deps), erro);
  assert.equal(base.chamadas.remover, 0);
});

test("nova preferência só é salva após resolução autorizada", async () => {
  const base = criarDependencias("rede");
  const ordem: string[] = [];
  const deps: DependenciasContextoOperacional = {
    ...base.deps,
    resolverContexto: async ({ unidadeId }) => { ordem.push(`resolver:${unidadeId}`); return contextoResolvido; },
    salvarPreferencia: (valor) => { ordem.push("salvar"); base.chamadas.salvar += 1; assert.deepEqual(valor, { usuarioId: "usuario-1", unidadeId: "unidade-1" }); return true; },
  };
  assert.deepEqual(await definirPreferenciaContextoOperacionalAtual("unidade-1", deps), { estado: "contexto_resolvido", contexto: contextoResolvido });
  assert.deepEqual(ordem, ["resolver:unidade-1", "salvar"]);
});

test("nova preferência arbitrária nunca é salva", async () => {
  const base = criarDependencias("rede");
  const deps = { ...base.deps, resolverContexto: async () => { throw new ErroSelecaoContextoOperacionalNaoAutorizada(); } };
  assert.deepEqual(await definirPreferenciaContextoOperacionalAtual("fora", deps), { estado: "selecao_necessaria" });
  assert.equal(base.chamadas.salvar, 0);
  assert.equal(base.chamadas.remover, 1);
});

test("refresh lógico recupera e revalida novamente a preferência da aba", async () => {
  const base = criarDependencias("rede", { usuarioId: "usuario-1", unidadeId: "unidade-1" });
  await obterContextoOperacionalPreferidoAtual(base.deps);
  await obterContextoOperacionalPreferidoAtual(base.deps);
  assert.equal(base.chamadas.obter, 2);
  assert.equal(base.chamadas.resolver, 2);
});

test("limpeza explícita prepara integração futura com logout", () => {
  let remocoes = 0;
  limparPreferenciaContextoOperacional({ removerPreferencia: () => { remocoes += 1; } });
  assert.equal(remocoes, 1);
});

test("contexto operacional obrigatório preserva resolução automática de Unidade", async () => {
  assert.deepEqual(await exigirContextoOperacionalAtivoAtual(criarDependencias("unidade").deps), contextoResolvido);
});

test("contexto operacional obrigatório falha fechado sem preferência superior", async () => {
  await assert.rejects(exigirContextoOperacionalAtivoAtual(criarDependencias("rede").deps), new Error("Contexto operacional não selecionado."));
});

test("contexto operacional obrigatório propaga erro real de infraestrutura", async () => {
  const base = criarDependencias("rede", { usuarioId: "usuario-1", unidadeId: "unidade-1" });
  const erro = new Error("infraestrutura indisponível");
  await assert.rejects(exigirContextoOperacionalAtivoAtual({ ...base.deps, resolverContexto: async () => { throw erro; } }), erro);
});
