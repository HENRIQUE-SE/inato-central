import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CODIGOS_PERFIL_ACESSO, CODIGOS_PERMISSAO_ACESSO } from "@/core/acesso";
import type { CodigoPerfilAcesso, CodigoPermissaoAcesso, ContextoAcesso } from "@/core/acesso";
import type { ContextoAcessoAutenticado } from "./acesso.service";
import {
  atualizarOportunidade,
  criarOportunidade,
  excluirOportunidade,
  listarOportunidades,
  obterOportunidadePorId,
} from "./oportunidades.service";
import type { DadosOportunidade, Oportunidade } from "@/types/oportunidade";

const dados: DadosOportunidade = {
  proprietario_nome: "Ana",
  telefone: "34999999999",
  cidade: "Patrocínio",
  veiculo_informado: "Polo",
  placa: "ABC1D23",
  origem: "Instagram",
  status: "novo",
};
const oportunidade: Oportunidade = {
  id: "oportunidade-1",
  empresa_id: "empresa-a",
  unidade_id: "unidade-a",
  ...dados,
  created_at: "2026-08-31T00:00:00.000Z",
};

function contexto(
  perfil: CodigoPerfilAcesso,
  permissoes: readonly CodigoPermissaoAcesso[],
  ativo = true
): ContextoAcessoAutenticado {
  const acesso: ContextoAcesso = {
    vinculo: { id: "vinculo", usuarioId: "usuario", redeId: "rede-matriz", operacaoId: "operacao-matriz", areaOperacionalId: "area-patrocinio", escopoTipo: "unidade", empresaId: "empresa-a", unidadeId: "unidade-a", perfilId: "perfil", ativo, criadoEm: "agora" },
    perfil: { id: "perfil", codigo: perfil, nome: perfil, descricao: null, ativo: true, criadoEm: "agora" },
    permissoes: permissoes.map((codigo) => ({ id: codigo, codigo, nome: codigo, descricao: null, criadoEm: "agora" })),
  };
  return { usuario: { id: "usuario", email: "pessoa@inato.test" }, contexto: acesso };
}

function dependencias(contextoAtual: ContextoAcessoAutenticado | null) {
  const chamadas = { criar: 0, atualizar: 0, excluir: 0, listar: 0, obter: 0, auditorias: 0 };
  let payloadCriacao: (DadosOportunidade & { empresa_id: string; unidade_id: string }) | null = null;
  let payloadAtualizacao: DadosOportunidade | null = null;
  return {
    chamadas,
    obterPayloadCriacao: () => payloadCriacao,
    obterPayloadAtualizacao: () => payloadAtualizacao,
    deps: {
      obterContexto: async () => contextoAtual,
      obterContextoOperacional: async () => ({ redeId: "rede-matriz", operacaoId: "operacao-matriz", areaOperacionalId: "area-patrocinio", empresaId: "empresa-a", unidadeId: "unidade-a" }),
      obterPorId: async () => { chamadas.obter += 1; return oportunidade; },
      listar: async () => { chamadas.listar += 1; return { dados: [oportunidade], total: 1 }; },
      criar: async (payload: DadosOportunidade & { empresa_id: string; unidade_id: string }) => { chamadas.criar += 1; payloadCriacao = payload; return oportunidade; },
      atualizar: async (_id: string, payload: DadosOportunidade) => { chamadas.atualizar += 1; payloadAtualizacao = payload; return oportunidade; },
      excluir: async () => { chamadas.excluir += 1; return oportunidade; },
      auditarCriacao: async () => { chamadas.auditorias += 1; },
      auditarAlteracao: async () => { chamadas.auditorias += 1; },
      auditarExclusao: async () => { chamadas.auditorias += 1; },
    },
  };
}

const todas = [
  CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR,
  CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_CRIAR,
  CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_ALTERAR,
  CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_EXCLUIR,
] as const;

test("Administrador e Consultor mantêm as quatro operações de Oportunidades", async () => {
  for (const perfil of [CODIGOS_PERFIL_ACESSO.ADMINISTRADOR, CODIGOS_PERFIL_ACESSO.CONSULTOR]) {
    const d = dependencias(contexto(perfil, todas));
    const resultado = await listarOportunidades({}, d.deps);
    assert.deepEqual(resultado.permissoes, {
      visualizar: true,
      criar: true,
      alterar: true,
      excluir: true,
    });
    await criarOportunidade(dados, d.deps);
    await atualizarOportunidade(oportunidade.id, dados, d.deps);
    await excluirOportunidade(oportunidade.id, d.deps);
    assert.deepEqual(d.chamadas, { criar: 1, atualizar: 1, excluir: 1, listar: 1, obter: 0, auditorias: 3 });
  }
});

test("TESTE somente visualiza e Financeiro permanece sem acesso", async () => {
  const teste = dependencias(contexto(CODIGOS_PERFIL_ACESSO.TESTE, [CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR]));
  const resultadoTeste = await listarOportunidades({}, teste.deps);
  assert.equal(resultadoTeste.total, 1);
  assert.deepEqual(resultadoTeste.permissoes, {
    visualizar: true,
    criar: false,
    alterar: false,
    excluir: false,
  });
  await assert.rejects(criarOportunidade(dados, teste.deps), /Acesso não autorizado/);
  const financeiro = dependencias(contexto(CODIGOS_PERFIL_ACESSO.FINANCEIRO, []));
  await assert.rejects(listarOportunidades({}, financeiro.deps), /Acesso não autorizado/);
});

test("criação deriva empresa e unidade do contexto, sem autoridade do frontend", async () => {
  const d = dependencias(contexto(CODIGOS_PERFIL_ACESSO.CONSULTOR, todas));
  await criarOportunidade(dados, d.deps);
  assert.deepEqual(d.obterPayloadCriacao(), { ...dados, empresa_id: "empresa-a", unidade_id: "unidade-a" });
  assert.equal(d.chamadas.auditorias, 1);
});

test("criação recusa escopo superior sem contexto operacional selecionado", async () => {
  const c = contexto(CODIGOS_PERFIL_ACESSO.ADMINISTRADOR, todas);
  const semUnidade = { ...c, contexto: { ...c.contexto, vinculo: { ...c.contexto.vinculo, unidadeId: null } } };
  const d = dependencias(semUnidade);
  d.deps.obterContextoOperacional = async () => { throw new Error("Contexto operacional não selecionado."); };
  await assert.rejects(criarOportunidade(dados, d.deps), /Contexto operacional não selecionado/);
  assert.equal(d.chamadas.criar, 0);
});

test("edição envia somente campos comerciais e não transfere organização", async () => {
  const d = dependencias(contexto(CODIGOS_PERFIL_ACESSO.ADMINISTRADOR, todas));
  await atualizarOportunidade(oportunidade.id, dados, d.deps);
  assert.deepEqual(d.obterPayloadAtualizacao(), dados);
  assert.equal("empresa_id" in (d.obterPayloadAtualizacao() ?? {}), false);
  assert.equal("unidade_id" in (d.obterPayloadAtualizacao() ?? {}), false);
});

test("usuário não autenticado e contexto ausente são bloqueados antes do repository", async () => {
  const d = dependencias(null);
  await assert.rejects(listarOportunidades({}, d.deps), /Acesso não autorizado/);
  await assert.rejects(criarOportunidade(dados, d.deps), /Acesso não autorizado/);
  assert.equal(d.chamadas.listar + d.chamadas.criar, 0);
});

test("vínculo inativo é bloqueado mesmo que carregue permissão", async () => {
  const d = dependencias(contexto(CODIGOS_PERFIL_ACESSO.CONSULTOR, todas, false));
  await assert.rejects(excluirOportunidade(oportunidade.id, d.deps), /Acesso não autorizado/);
  assert.equal(d.chamadas.excluir, 0);
});

test("consulta por ID exige permissão e contexto ativo antes da consulta", async () => {
  const d = dependencias(contexto(CODIGOS_PERFIL_ACESSO.ADMINISTRADOR, todas));
  assert.equal((await obterOportunidadePorId(oportunidade.id, d.deps))?.id, oportunidade.id);
  assert.equal(d.chamadas.obter, 1);
});

test("erros do repository/RLS são propagados e não geram Auditoria falsa", async () => {
  const d = dependencias(contexto(CODIGOS_PERFIL_ACESSO.ADMINISTRADOR, todas));
  d.deps.criar = async () => { throw new Error("RLS negou a operação"); };
  await assert.rejects(criarOportunidade(dados, d.deps), /RLS negou/);
  assert.equal(d.chamadas.auditorias, 0);
});

test("erros RLS de listagem, edição e exclusão também são propagados", async () => {
  const d = dependencias(contexto(CODIGOS_PERFIL_ACESSO.ADMINISTRADOR, todas));
  d.deps.listar = async () => { throw new Error("RLS listagem"); };
  await assert.rejects(listarOportunidades({}, d.deps), /RLS listagem/);
  d.deps.atualizar = async () => { throw new Error("RLS edição"); };
  await assert.rejects(atualizarOportunidade(oportunidade.id, dados, d.deps), /RLS edição/);
  d.deps.excluir = async () => { throw new Error("RLS exclusão"); };
  await assert.rejects(excluirOportunidade(oportunidade.id, d.deps), /RLS exclusão/);
  assert.equal(d.chamadas.auditorias, 0);
});

test("migration contém isolamento organizacional e remove as policies public permissivas", () => {
  const sql = readFileSync("supabase/migrations/20260831_regularize_oportunidades_organizacao_rls.sql", "utf8");
  assert.match(sql, /add column empresa_id uuid null/);
  assert.match(sql, /add column unidade_id uuid null/);
  assert.match(sql, /for select to authenticated/);
  assert.match(sql, /for insert to authenticated/);
  assert.match(sql, /for update to authenticated/);
  assert.match(sql, /for delete to authenticated/);
  assert.match(sql, /up\.usuario_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /up\.empresa_id = oportunidades\.empresa_id/);
  assert.match(sql, /up\.unidade_id = oportunidades\.unidade_id/);
  assert.match(sql, /and up\.ativo/);
  assert.equal((sql.match(/join public\.perfis pf/g) ?? []).length, 5);
  assert.equal((sql.match(/and pf\.ativo/g) ?? []).length, 5);
  assert.equal((sql.match(/join public\.perfil_permissoes pp/g) ?? []).length, 5);
  assert.equal((sql.match(/join public\.permissoes p/g) ?? []).length, 5);
  assert.match(sql, /p\.codigo = 'oportunidades\.visualizar'/);
  assert.match(sql, /p\.codigo = 'oportunidades\.criar'/);
  assert.equal((sql.match(/p\.codigo = 'oportunidades\.alterar'/g) ?? []).length, 2);
  assert.match(sql, /p\.codigo = 'oportunidades\.excluir'/);
  assert.equal((sql.match(/for (select|insert|update|delete) to authenticated/g) ?? []).length, 4);
  assert.doesNotMatch(sql, /for (select|insert|update|delete) to (public|anon)/);
  assert.match(sql, /revoke all on table public\.oportunidades from public, anon, authenticated/);
  assert.doesNotMatch(sql, /grant .*\b(truncate|references|trigger)\b.* to authenticated/i);
  assert.match(sql, /proteger_contexto_organizacional_oportunidade/);
  assert.doesNotMatch(sql, /references public\.(empresas|unidades)/);
  assert.doesNotMatch(sql, /security definer/i);
});

test("interface inicia restritiva e condiciona os dois controles de criacao", () => {
  const container = readFileSync("src/components/oportunidades/OportunidadesContainer.tsx", "utf8");
  assert.match(container, /const \[permissoes, setPermissoes\] = useState\(\{\s*visualizar: false,\s*criar: false,\s*alterar: false,\s*excluir: false,/);
  assert.equal((container.match(/\{permissoes\.criar && <button/g) ?? []).length, 2);
  assert.match(container, /function abrirCriacao\(\) \{\s*if \(!permissoes\.criar\) return;/);
  assert.match(container, /if \(acessoNegado\) return <AcessoNegado \/>/);
});

test("interface condiciona Editar e Excluir e preserva Ver", () => {
  const container = readFileSync("src/components/oportunidades/OportunidadesContainer.tsx", "utf8");
  const card = readFileSync("src/components/oportunidades/CardOportunidade.tsx", "utf8");
  const botoes = readFileSync("src/components/oportunidades/ActionButtons.tsx", "utf8");
  assert.match(container, /function iniciarEdicao\([^)]*\) \{\s*if \(!permissoes\.alterar\) return;/);
  assert.match(container, /async function excluirOportunidadeSelecionada\([^)]*\) \{\s*if \(!permissoes\.excluir\) return;/);
  assert.match(container, /podeEditar=\{permissoes\.alterar\}/);
  assert.match(container, /podeExcluir=\{permissoes\.excluir\}/);
  assert.match(card, /Visualiza.*em desenvolvimento\./);
  assert.match(botoes, /\{podeEditar && <button/);
  assert.match(botoes, /\{podeExcluir && <button/);
  assert.match(botoes, /onClick=\{onVer\}/);
});

test("handlers fecham os fluxos quando a capacidade efetiva deixa de existir", () => {
  const container = readFileSync("src/components/oportunidades/OportunidadesContainer.tsx", "utf8");
  assert.match(container, /oportunidadeEmEdicao !== null && !permissoes\.alterar/);
  assert.match(container, /oportunidadeEmEdicao === null && !permissoes\.criar/);
  assert.match(container, /setOportunidadeEmEdicao\(null\);\s*setShowForm\(false\);/);
});
