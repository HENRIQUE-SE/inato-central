import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { CODIGOS_ESCOPO_ACESSO, type VinculoAcesso } from "@/core/acesso";
import type { ConsultarUnidadeOperacional, ConsultarUnidadesOperacionais } from "./organizacao.repository";

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "teste-local-sem-credencial";

const vinculoBase: VinculoAcesso = {
  id: "vinculo", usuarioId: "usuario", redeId: "rede-1", operacaoId: "operacao-1",
  areaOperacionalId: "area-1", empresaId: "empresa-1", unidadeId: "unidade-1",
  escopoTipo: CODIGOS_ESCOPO_ACESSO.UNIDADE, perfilId: "perfil", ativo: true, criadoEm: "2026-09-17T00:00:00.000Z",
};

function linha(id: string, redeId: string, operacaoId: string, empresaId: string | null, areaId: string, numero: number) {
  return {
    id, area_operacional_id: areaId, codigo: `codigo-${id}`, numero, nome: `Unidade ${id}`,
    nome_exibicao: `Unidade ${id}`, cidade: "Cidade", uf: "MG", ativo: true,
    area_operacional: { id: areaId, operacao_id: operacaoId, ativo: true, operacao: { id: operacaoId, rede_id: redeId, empresa_id: empresaId, ativo: true } },
  };
}

const unidades = [
  linha("unidade-2", "rede-1", "operacao-1", "empresa-1", "area-1", 2),
  linha("unidade-1", "rede-1", "operacao-1", "empresa-1", "area-1", 1),
  linha("unidade-3", "rede-1", "operacao-1", "empresa-1", "area-2", 3),
  linha("unidade-4", "rede-1", "operacao-2", "empresa-2", "area-3", 4),
  linha("unidade-5", "rede-2", "operacao-3", "empresa-3", "area-4", 5),
];

const consultar = async () => ({ data: unidades, error: null });
async function listar(vinculo: VinculoAcesso, consulta: ConsultarUnidadesOperacionais = consultar) {
  const { listarUnidadesOperacionaisPermitidas } = await import("./organizacao.repository");
  return listarUnidadesOperacionaisPermitidas(vinculo, consulta);
}
async function obter(vinculo: VinculoAcesso, unidadeId: string, consulta: ConsultarUnidadeOperacional) {
  const { obterUnidadeOperacionalPermitida } = await import("./organizacao.repository");
  return obterUnidadeOperacionalPermitida(vinculo, unidadeId, consulta);
}

test("escopo Unidade retorna somente sua Unidade", async () => {
  assert.deepEqual((await listar(vinculoBase)).map((u) => u.unidadeId), ["unidade-1"]);
});
test("escopo Unidade não alcança outra Unidade", async () => {
  assert.equal((await listar({ ...vinculoBase, unidadeId: "inexistente" })).length, 0);
});
test("escopo Área retorna somente Unidades da mesma Área e Operação", async () => {
  const vinculo = { ...vinculoBase, escopoTipo: CODIGOS_ESCOPO_ACESSO.AREA_OPERACIONAL, empresaId: null, unidadeId: null };
  assert.deepEqual((await listar(vinculo)).map((u) => u.unidadeId), ["unidade-1", "unidade-2"]);
});
test("escopo Operação retorna Áreas subordinadas e rejeita outra Operação", async () => {
  const vinculo = { ...vinculoBase, escopoTipo: CODIGOS_ESCOPO_ACESSO.OPERACAO, areaOperacionalId: null, empresaId: null, unidadeId: null };
  assert.deepEqual((await listar(vinculo)).map((u) => u.unidadeId), ["unidade-1", "unidade-2", "unidade-3"]);
});
test("escopo Rede retorna somente Unidades da mesma Rede", async () => {
  const vinculo = { ...vinculoBase, escopoTipo: CODIGOS_ESCOPO_ACESSO.REDE, operacaoId: null, areaOperacionalId: null, empresaId: null, unidadeId: null };
  assert.deepEqual((await listar(vinculo)).map((u) => u.unidadeId), ["unidade-1", "unidade-2", "unidade-3", "unidade-4"]);
});
test("vínculo territorial incompleto falha fechado sem consultar", async () => {
  let consultas = 0;
  const resultado = await listar({ ...vinculoBase, operacaoId: null }, async () => { consultas += 1; return { data: unidades, error: null }; });
  assert.deepEqual(resultado, []);
  assert.equal(consultas, 0);
});
test("lista retornada é determinística por número", async () => {
  const vinculo = { ...vinculoBase, escopoTipo: CODIGOS_ESCOPO_ACESSO.REDE, operacaoId: null, areaOperacionalId: null, empresaId: null, unidadeId: null };
  assert.deepEqual((await listar(vinculo)).map((u) => u.numero), [1, 2, 3, 4]);
});
test("erro persistente é propagado", async () => {
  const erro = new Error("falha");
  await assert.rejects(listar(vinculoBase, async () => ({ data: null, error: erro })), erro);
});
test("empresaId vem de operacao.empresa_id e não de operacao.id", async () => {
  const unidade = (await listar(vinculoBase))[0];
  assert.equal(unidade.empresaId, "empresa-1");
  assert.notEqual(unidade.empresaId, "operacao-1");
});
test("Operação sem empresa_id falha fechado", async () => {
  const semEmpresa = [linha("unidade-1", "rede-1", "operacao-1", null, "area-1", 1)];
  assert.deepEqual(await listar(vinculoBase, async () => ({ data: semEmpresa, error: null })), []);
});
test("Unidade inativa falha fechado", async () => {
  const inativa = [{ ...linha("unidade-1", "rede-1", "operacao-1", "empresa-1", "area-1", 1), ativo: false }];
  assert.deepEqual(await listar(vinculoBase, async () => ({ data: inativa, error: null })), []);
});
for (const escopo of [CODIGOS_ESCOPO_ACESSO.REDE, CODIGOS_ESCOPO_ACESSO.OPERACAO, CODIGOS_ESCOPO_ACESSO.AREA_OPERACIONAL, CODIGOS_ESCOPO_ACESSO.UNIDADE] as const) {
  test(`consulta específica recebe vínculo de escopo ${escopo} e ID exato`, async () => {
    const vinculo = {
      ...vinculoBase,
      escopoTipo: escopo,
      operacaoId: escopo === CODIGOS_ESCOPO_ACESSO.REDE ? null : "operacao-1",
      areaOperacionalId: escopo === CODIGOS_ESCOPO_ACESSO.REDE || escopo === CODIGOS_ESCOPO_ACESSO.OPERACAO ? null : "area-1",
      empresaId: escopo === CODIGOS_ESCOPO_ACESSO.UNIDADE ? "empresa-1" : null,
      unidadeId: escopo === CODIGOS_ESCOPO_ACESSO.UNIDADE ? "unidade-1" : null,
    };
    const unidade = await obter(vinculo, "unidade-1", async (recebido, unidadeId) => {
      assert.equal(recebido, vinculo);
      assert.equal(unidadeId, "unidade-1");
      return { data: linha("unidade-1", "rede-1", "operacao-1", "empresa-1", "area-1", 1), error: null };
    });
    assert.equal(unidade?.unidadeId, "unidade-1");
  });
}
test("consulta específica retorna null sem linha", async () => {
  assert.equal(await obter(vinculoBase, "unidade-1", async () => ({ data: null, error: null })), null);
});
test("consulta específica rejeita Unidade fora do território pela defesa do Core", async () => {
  const externa = linha("unidade-1", "rede-2", "operacao-2", "empresa-2", "area-2", 1);
  assert.equal(await obter(vinculoBase, "unidade-1", async () => ({ data: externa, error: null })), null);
});
test("consulta específica rejeita Unidade inativa", async () => {
  const inativa = { ...linha("unidade-1", "rede-1", "operacao-1", "empresa-1", "area-1", 1), ativo: false };
  assert.equal(await obter(vinculoBase, "unidade-1", async () => ({ data: inativa, error: null })), null);
});
test("consulta específica rejeita Área inativa", async () => {
  const atual = linha("unidade-1", "rede-1", "operacao-1", "empresa-1", "area-1", 1);
  const inativa = { ...atual, area_operacional: { ...atual.area_operacional, ativo: false } };
  assert.equal(await obter(vinculoBase, "unidade-1", async () => ({ data: inativa, error: null })), null);
});
test("consulta específica rejeita Operação inativa", async () => {
  const atual = linha("unidade-1", "rede-1", "operacao-1", "empresa-1", "area-1", 1);
  const inativa = { ...atual, area_operacional: { ...atual.area_operacional, operacao: { ...atual.area_operacional.operacao, ativo: false } } };
  assert.equal(await obter(vinculoBase, "unidade-1", async () => ({ data: inativa, error: null })), null);
});
test("consulta específica rejeita Operação sem empresa_id", async () => {
  assert.equal(await obter(vinculoBase, "unidade-1", async () => ({ data: linha("unidade-1", "rede-1", "operacao-1", null, "area-1", 1), error: null })), null);
});
test("consulta específica preserva empresaId persistido diferente de operacaoId", async () => {
  const unidade = await obter(vinculoBase, "unidade-1", async () => ({ data: linha("unidade-1", "rede-1", "operacao-1", "empresa-1", "area-1", 1), error: null }));
  assert.equal(unidade?.empresaId, "empresa-1");
  assert.notEqual(unidade?.empresaId, unidade?.operacaoId);
});
test("consulta específica propaga erro persistente", async () => {
  const erro = new Error("falha específica");
  await assert.rejects(obter(vinculoBase, "unidade-1", async () => ({ data: null, error: erro })), erro);
});
test("consulta específica falha fechado para vínculo territorial inválido sem consultar", async () => {
  let consultas = 0;
  assert.equal(await obter({ ...vinculoBase, operacaoId: null }, "unidade-1", async () => {
    consultas += 1;
    return { data: linha("unidade-1", "rede-1", "operacao-1", "empresa-1", "area-1", 1), error: null };
  }), null);
  assert.equal(consultas, 0);
});
test("contexto que usa operacaoId como empresaId é rejeitado e empresa persistida é aceita", async () => {
  const [unidade] = await listar(vinculoBase);
  const { contextoOperacionalCorrespondeAUnidade } = await import("@/core/acesso");
  assert.equal(contextoOperacionalCorrespondeAUnidade({ redeId: "rede-1", operacaoId: "operacao-1", areaOperacionalId: "area-1", empresaId: "operacao-1", unidadeId: "unidade-1" }, unidade), false);
  assert.equal(contextoOperacionalCorrespondeAUnidade({ redeId: "rede-1", operacaoId: "operacao-1", areaOperacionalId: "area-1", empresaId: "empresa-1", unidadeId: "unidade-1" }, unidade), true);
});
test("repository usa hierarquia persistida, filtros territoriais e não usa catálogo estático", () => {
  const fonte = readFileSync(resolve(process.cwd(), "src/lib/organizacao/organizacao.repository.ts"), "utf8");
  assert.match(fonte, /\.from\("unidades"\)/);
  assert.match(fonte, /areas_operacionais!inner/);
  assert.match(fonte, /operacoes!inner/);
  assert.match(fonte, /empresa_id/);
  assert.match(fonte, /empresaId: operacao\.empresa_id/);
  assert.doesNotMatch(fonte, /empresaId: operacao\.id/);
  assert.match(fonte, /area_operacional\.operacao\.rede_id/);
  assert.match(fonte, /\.eq\("id", unidadeId\)/);
  assert.match(fonte, /\.maybeSingle\(\)/);
  assert.match(fonte, /unidadePertenceAoTerritorio\(vinculo, unidade\)/);
  assert.doesNotMatch(fonte, /obterContextoOrganizacional|Patrocínio|MATRIZ|Loja 1|00000000-/);
});
test("migration explicita Empresa da Operação sem impor igualdade de IDs", () => {
  const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260917_add_operacoes_empresa_id.sql"), "utf8");
  const fundacao = readFileSync(resolve(process.cwd(), "supabase/migrations/20260903_fundacao_organizacional_matriz.sql"), "utf8");
  assert.match(migration, /add column empresa_id uuid null/);
  assert.match(migration, /set empresa_id = origem\.empresa_id/);
  assert.match(migration, /alter column empresa_id set not null/);
  assert.doesNotMatch(migration, /empresa_id\s*=\s*id/);
  assert.doesNotMatch(migration, /create\s+trigger/i);
  assert.doesNotMatch(migration, /insert\s+into\s+public\.(empresas|operacoes)/i);
  assert.doesNotMatch(migration, /update\s+public\.usuarios_perfis/i);
  assert.match(fundacao, /create table public\.operacoes/);
});
