import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "teste-local-sem-credencial";

const USUARIO = "usuario-1";
const EMPRESA = "00000000-0000-4000-8000-000000000001";

function linha(alteracoes: Record<string, unknown> = {}) {
  return {
    id: "vinculo-1", usuario_id: USUARIO,
    rede_id: "rede-1", operacao_id: "operacao-1", area_operacional_id: "area-1",
    empresa_id: EMPRESA, unidade_id: "unidade-1", escopo_tipo: "unidade",
    perfil_id: "perfil-1", ativo: true, criado_em: "2026-08-07T00:00:00.000Z",
    perfil: {
      id: "perfil-1", codigo: "administrador", nome: "Administrador", descricao: null,
      ativo: true, criado_em: "2026-08-07T00:00:00.000Z",
      relacoes_permissoes: [
        { permissao: { id: "p-2", codigo: "oportunidades.criar", nome: "Criar", descricao: null, criado_em: "2026-08-07T00:00:00.000Z" } },
        { permissao: { id: "p-1", codigo: "auditoria.visualizar", nome: "Auditoria", descricao: null, criado_em: "2026-08-07T00:00:00.000Z" } },
      ],
    },
    ...alteracoes,
  };
}

async function obter(data: unknown, error: unknown = null) {
  const { obterContextoPersistidoDoUsuario } = await import("./acesso.repository");
  return obterContextoPersistidoDoUsuario(USUARIO, async (usuarioId) => {
    assert.equal(usuarioId, USUARIO);
    return { data: data as never, error };
  });
}

test("mapeia retorno relacional válido preservando empresa, unidade, perfil e permissões", async () => {
  const contexto = await obter(linha());
  assert.equal(contexto?.vinculo.redeId, "rede-1");
  assert.equal(contexto?.vinculo.operacaoId, "operacao-1");
  assert.equal(contexto?.vinculo.areaOperacionalId, "area-1");
  assert.equal(contexto?.vinculo.empresaId, EMPRESA);
  assert.equal(contexto?.vinculo.unidadeId, "unidade-1");
  assert.equal(contexto?.vinculo.escopoTipo, "unidade");
  assert.equal(contexto?.perfil.codigo, "administrador");
  assert.deepEqual(contexto?.permissoes.map(({ codigo }) => codigo), ["auditoria.visualizar", "oportunidades.criar"]);
});

test("vínculo inexistente retorna ausência", async () => assert.equal(await obter(null), null));
test("vínculo inativo é negado", async () => assert.equal(await obter(linha({ ativo: false })), null));
test("vínculo de outro usuário é negado", async () => assert.equal(await obter(linha({ usuario_id: "outro" })), null));
test("vínculo de outra empresa pode representar autoridade organizacional", async () => assert.equal((await obter(linha({ empresa_id: "outra" })))?.vinculo.empresaId, "outra"));
test("vínculo de rede representa empresa ausente sem inventar contexto", async () => {
  const contexto = await obter(linha({
    empresa_id: null,
    unidade_id: null,
    operacao_id: null,
    area_operacional_id: null,
    escopo_tipo: "rede",
  }));
  assert.equal(contexto?.vinculo.empresaId, null);
  assert.equal(contexto?.vinculo.unidadeId, null);
  assert.equal(contexto?.vinculo.escopoTipo, "rede");
});
test("perfil inexistente é negado", async () => assert.equal(await obter(linha({ perfil: null })), null));
test("perfil inativo é negado", async () => assert.equal(await obter(linha({ perfil: { ...linha().perfil, ativo: false } })), null));
test("perfil inconsistente com o vínculo é negado", async () => assert.equal(await obter(linha({ perfil: { ...linha().perfil, id: "outro-perfil" } })), null));
test("perfil sem permissões preserva contexto com lista vazia", async () => {
  const contexto = await obter(linha({ perfil: { ...linha().perfil, relacoes_permissoes: [] } }));
  assert.deepEqual(contexto?.permissoes, []);
});
test("relações de permissões ausentes são negadas", async () => assert.equal(await obter(linha({ perfil: { ...linha().perfil, relacoes_permissoes: null } })), null));
test("permissão ausente em retorno parcialmente vazio é negada", async () => assert.equal(await obter(linha({ perfil: { ...linha().perfil, relacoes_permissoes: [{ permissao: null }] } })), null));
test("erro por múltiplos vínculos é propagado sem escolher um registro", async () => {
  const erro = new Error("mais de um vínculo");
  await assert.rejects(obter(null, erro), erro);
});

test("repository localiza autoridade pelo usuário ativo sem depender da empresa estática", () => {
  const repository = readFileSync(resolve(process.cwd(), "src/lib/acesso/acesso.repository.ts"), "utf8");
  assert.doesNotMatch(repository, /obterContextoOrganizacional/);
  assert.doesNotMatch(repository, /\.eq\("empresa_id"/);
  assert.match(repository, /\.eq\("usuario_id", usuarioId\)/);
  assert.match(repository, /\.eq\("ativo", true\)/);
  assert.match(repository, /\.maybeSingle\(\)/);
});

test("consulta usa os três relacionamentos comprovados pela migration", () => {
  const repository = readFileSync(resolve(process.cwd(), "src/lib/acesso/acesso.repository.ts"), "utf8");
  const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260807_create_acesso.sql"), "utf8");
  assert.match(repository, /perfis!usuarios_perfis_perfil_id_fkey/);
  assert.match(repository, /perfil_permissoes!perfil_permissoes_perfil_id_fkey/);
  assert.match(repository, /permissoes!perfil_permissoes_permissao_id_fkey/);
  assert.match(migration, /perfil_id uuid not null references public\.perfis\(id\)/);
  assert.match(migration, /permissao_id uuid not null references public\.permissoes\(id\)/);
});
