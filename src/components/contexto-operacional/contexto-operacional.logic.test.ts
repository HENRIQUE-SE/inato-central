import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import type { ContextoOperacionalAtivo, UnidadeOperacionalPermitida } from "@/core/organizacao";
import type { ResultadoContextoOperacionalAtivo } from "@/services/contexto-operacional.service";
import {
  childrenPodemSerMontados,
  deveRecarregarPaginaAposSelecao,
  escopoPermiteTrocaUnidade,
  resolverEstadoContextoOperacional,
  selecionarContextoOperacional,
  type ContextoResolvidoVisual,
  type DependenciasContextoOperacionalVisual,
  type EstadoContextoOperacionalVisual,
} from "./contexto-operacional.logic";

const contexto: ContextoOperacionalAtivo = {
  redeId: "rede-1",
  operacaoId: "operacao-1",
  areaOperacionalId: "area-1",
  empresaId: "empresa-1",
  unidadeId: "unidade-1",
};

const unidade: UnidadeOperacionalPermitida = {
  ...contexto,
  codigo: "U001",
  numero: 1,
  nome: "Unidade 1",
  nomeExibicao: "Unidade Centro",
  cidade: "Cidade",
  uf: "MG",
};

function dependencias(
  resultado: ResultadoContextoOperacionalAtivo,
  unidades: readonly UnidadeOperacionalPermitida[] = [unidade]
) {
  const chamadas = { contexto: 0, catalogo: 0, selecao: [] as string[] };
  const deps: DependenciasContextoOperacionalVisual = {
    obterContexto: async () => { chamadas.contexto += 1; return resultado; },
    definirContexto: async (unidadeId) => { chamadas.selecao.push(unidadeId); return resultado; },
    obterUnidades: async () => { chamadas.catalogo += 1; return unidades; },
  };
  return { deps, chamadas };
}

test("carregando, não autenticado e seleção necessária não liberam children", () => {
  const estados: EstadoContextoOperacionalVisual[] = [
    { estado: "carregando" },
    { estado: "nao_autenticado" },
    { estado: "selecao_necessaria", unidades: [], erro: null, contextoAnterior: null },
    { estado: "erro_infraestrutura", mensagem: "erro" },
  ];
  assert.ok(estados.every((estado) => !childrenPodemSerMontados(estado)));
});

test("contexto resolvido libera children", () => {
  assert.equal(childrenPodemSerMontados({ estado: "contexto_resolvido", contexto, unidade, unidades: [unidade] }), true);
});

test("não autenticado não carrega catálogo", async () => {
  const base = dependencias({ estado: "nao_autenticado" });
  assert.deepEqual(await resolverEstadoContextoOperacional(base.deps), { estado: "nao_autenticado" });
  assert.equal(base.chamadas.catalogo, 0);
});

test("escopo superior sem preferência recebe somente o catálogo autorizado", async () => {
  const base = dependencias({ estado: "selecao_necessaria" });
  assert.deepEqual(await resolverEstadoContextoOperacional(base.deps), {
    estado: "selecao_necessaria", unidades: [unidade], erro: null, contextoAnterior: null,
  });
  assert.equal(base.chamadas.catalogo, 1);
});

test("contexto automático de Unidade encontra sua apresentação no catálogo", async () => {
  const base = dependencias({ estado: "contexto_resolvido", contexto });
  const estado = await resolverEstadoContextoOperacional(base.deps);
  assert.deepEqual(estado, { estado: "contexto_resolvido", contexto, unidade, unidades: [unidade] });
});

test("Unidade ativa usa nomeExibicao, cidade e uf do catálogo", async () => {
  const estado = await resolverEstadoContextoOperacional(
    dependencias({ estado: "contexto_resolvido", contexto }).deps
  );
  assert.equal(estado.estado === "contexto_resolvido" ? estado.unidade.nomeExibicao : null, "Unidade Centro");
  assert.equal(estado.estado === "contexto_resolvido" ? estado.unidade.cidade : null, "Cidade");
  assert.equal(estado.estado === "contexto_resolvido" ? estado.unidade.uf : null, "MG");
});

test("ausência inconsistente da Unidade resolvida falha fechado", async () => {
  const outra = { ...unidade, unidadeId: "unidade-2" };
  const estado = await resolverEstadoContextoOperacional(
    dependencias({ estado: "contexto_resolvido", contexto }, [outra]).deps
  );
  assert.equal(estado.estado, "erro_infraestrutura");
});

test("erro real permanece erro de infraestrutura", async () => {
  const base = dependencias({ estado: "selecao_necessaria" });
  const deps = { ...base.deps, obterContexto: async () => { throw new Error("serviço indisponível"); } };
  assert.deepEqual(await resolverEstadoContextoOperacional(deps), {
    estado: "erro_infraestrutura", mensagem: "serviço indisponível",
  });
});

test("seleção envia somente unidadeId e libera contexto válido", async () => {
  const base = dependencias({ estado: "contexto_resolvido", contexto });
  const estado = await selecionarContextoOperacional("unidade-1", [unidade], null, base.deps);
  assert.deepEqual(base.chamadas.selecao, ["unidade-1"]);
  assert.equal(childrenPodemSerMontados(estado), true);
});

test("seleção inválida não libera contexto", async () => {
  const base = dependencias({ estado: "selecao_necessaria" });
  const estado = await selecionarContextoOperacional("unidade-fora", [unidade], null, base.deps);
  assert.equal(estado.estado, "selecao_necessaria");
  assert.equal(childrenPodemSerMontados(estado), false);
});

test("falha na seleção não é convertida em seleção necessária", async () => {
  const base = dependencias({ estado: "selecao_necessaria" });
  const deps = { ...base.deps, definirContexto: async () => { throw new Error("falha persistente"); } };
  const estado = await selecionarContextoOperacional("unidade-1", [unidade], null, deps);
  assert.deepEqual(estado, { estado: "erro_infraestrutura", mensagem: "falha persistente" });
});

test("reload é reservado à troca validada e não à seleção inicial", () => {
  const resolvido: EstadoContextoOperacionalVisual = { estado: "contexto_resolvido", contexto, unidade, unidades: [unidade] };
  const anterior: ContextoResolvidoVisual = { contexto, unidade, unidades: [unidade] };
  assert.equal(deveRecarregarPaginaAposSelecao(resolvido, null), false);
  assert.equal(deveRecarregarPaginaAposSelecao(resolvido, anterior), true);
  assert.equal(deveRecarregarPaginaAposSelecao({ estado: "erro_infraestrutura", mensagem: "erro" }, anterior), false);
});

test("gate impede duplo envio e não implementa sincronização entre abas", () => {
  const fonte = readFileSync(resolve("src/components/contexto-operacional/ContextoOperacionalGate.tsx"), "utf8");
  assert.match(fonte, /envioEmAndamento\.current/);
  assert.doesNotMatch(fonte, /BroadcastChannel|localStorage|storage\s*event/);
  assert.match(fonte, /window\.location\.reload\(\)/);
});

test("oito limites operacionais usam o gate e login permanece fora", () => {
  const paginas = [
    "src/app/page.tsx",
    "src/app/oportunidades/page.tsx",
    "src/app/veiculos/page.tsx",
    "src/app/veiculos/[id]/page.tsx",
    "src/app/negociacoes/page.tsx",
    "src/app/negociacoes/[id]/page.tsx",
    "src/app/reservas/page.tsx",
    "src/app/auditoria/page.tsx",
  ];
  for (const pagina of paginas) assert.match(readFileSync(resolve(pagina), "utf8"), /ContextoOperacionalGate/);
  assert.doesNotMatch(readFileSync(resolve("src/app/login/page.tsx"), "utf8"), /ContextoOperacionalGate/);
});

test("componentes de interface não acessam sessionStorage diretamente", () => {
  for (const arquivo of [
    "ContextoOperacionalGate.tsx",
    "SeletorContextoOperacional.tsx",
    "UnidadeAtiva.tsx",
  ]) {
    const fonte = readFileSync(resolve("src/components/contexto-operacional", arquivo), "utf8");
    assert.doesNotMatch(fonte, /sessionStorage|localStorage/);
  }
});

test("Auditoria deixa a identificação visual da Unidade exclusivamente para o gate", () => {
  const usuarioAtual = readFileSync(resolve("src/components/auth/UsuarioAtual.tsx"), "utf8");
  const auditoria = readFileSync(resolve("src/components/auditoria/AuditoriaContainer.tsx"), "utf8");
  const unidadeAtiva = readFileSync(resolve("src/components/contexto-operacional/UnidadeAtiva.tsx"), "utf8");
  assert.doesNotMatch(usuarioAtual, /Unidade:/);
  assert.match(auditoria, /<UsuarioAtual\s+\{\.\.\.usuarioVisivel\}/);
  assert.match(unidadeAtiva, /Unidade ativa/);
});

test("escopo Unidade não permite exibir Trocar unidade", () => {
  assert.equal(escopoPermiteTrocaUnidade("unidade"), false);
});

for (const escopo of ["area_operacional", "operacao", "rede"] as const) {
  test(`escopo ${escopo} permite exibir Trocar unidade`, () => {
    assert.equal(escopoPermiteTrocaUnidade(escopo), true);
  });
}

test("regra de troca depende do escopo e não da quantidade de Unidades", () => {
  const catalogoComUmaUnidade = [unidade];
  assert.equal(catalogoComUmaUnidade.length, 1);
  assert.equal(escopoPermiteTrocaUnidade("rede"), true);
  assert.equal(escopoPermiteTrocaUnidade("unidade"), false);
});

test("ocultar troca não altera resolução automática do escopo Unidade", async () => {
  const base = dependencias({ estado: "contexto_resolvido", contexto });
  const estado = await resolverEstadoContextoOperacional(base.deps);
  assert.equal(childrenPodemSerMontados(estado), true);
  assert.equal(escopoPermiteTrocaUnidade("unidade"), false);
});

test("UnidadeAtiva condiciona a ação ao escopo resolvido", () => {
  const fonte = readFileSync(resolve("src/components/contexto-operacional/UnidadeAtiva.tsx"), "utf8");
  assert.match(fonte, /permiteTroca\s*&&/);
  assert.doesNotMatch(fonte, /unidades\.length/);
});
