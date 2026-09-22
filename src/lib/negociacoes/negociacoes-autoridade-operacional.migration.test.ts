import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const caminho = resolve(
  process.cwd(),
  "supabase/migrations/20260922_adota_autoridade_operacional_negociacoes.sql",
);
const migration = readFileSync(caminho, "utf8");

function policy(nome: string): string {
  const encontrada = migration.match(
    new RegExp(`create policy ${nome} on public\\.negociacoes[\\s\\S]*?;`, "i"),
  );
  assert.ok(encontrada, `Policy ${nome} não encontrada.`);
  return encontrada[0];
}

function funcao(nome: string): string {
  const encontrada = migration.match(
    new RegExp(`create or replace function public\\.${nome}\\([\\s\\S]*?\\n\\$\\$;`, "i"),
  );
  assert.ok(encontrada, `Função ${nome} não encontrada.`);
  return encontrada[0];
}

const select = policy("negociacoes_select_contexto");
const insert = policy("negociacoes_insert_contexto");
const update = policy("negociacoes_update_contexto");
const convertida = funcao("marcar_negociacao_convertida");
const perdida = funcao("marcar_negociacao_perdida");
const cancelada = funcao("cancelar_negociacao");
const rpcs = [convertida, perdida, cancelada];

test("migration recria somente as três policies efetivas de Negociações", () => {
  assert.equal((migration.match(/drop policy /gi) ?? []).length, 3);
  assert.equal((migration.match(/create policy /gi) ?? []).length, 3);
  assert.match(select, /for select to authenticated/i);
  assert.match(insert, /for insert to authenticated/i);
  assert.match(update, /for update to authenticated/i);
  assert.doesNotMatch(migration, /create policy negociacoes_delete|for delete/i);
});

test("SELECT combina território e permissão real de visualização", () => {
  assert.match(select, /usuario_tem_acesso_territorial/i);
  assert.match(select, /usuario_tem_permissao\('negociacoes\.visualizar'\)/i);
});

test("INSERT preserva autoria, estado inicial, território e permissão", () => {
  assert.match(insert, /status = 'em_andamento'/i);
  assert.match(insert, /encerrado_em is null/i);
  assert.match(insert, /criado_por_usuario_id = \(select auth\.uid\(\)\)/i);
  assert.match(insert, /usuario_tem_acesso_territorial/i);
  assert.match(insert, /usuario_tem_permissao\('negociacoes\.criar'\)/i);
});

test("INSERT preserva vínculo concreto com Veículo disponível", () => {
  assert.match(insert, /from public\.veiculos v/i);
  assert.match(insert, /v\.id = negociacoes\.veiculo_id/i);
  assert.match(insert, /v\.empresa_id = negociacoes\.empresa_id/i);
  assert.match(insert, /v\.unidade_id = negociacoes\.unidade_id/i);
  assert.match(insert, /v\.status = 'disponivel'/i);
  assert.match(insert, /v\.arquivado_em is null/i);
});

test("UPDATE protege registro atual e resultado com território e permissão", () => {
  assert.match(update, /using\s*\([\s\S]*usuario_tem_acesso_territorial/i);
  assert.match(update, /with check\s*\([\s\S]*usuario_tem_acesso_territorial/i);
  assert.equal((update.match(/usuario_tem_acesso_territorial/gi) ?? []).length, 2);
  assert.equal((update.match(/usuario_tem_permissao\('negociacoes\.alterar'\)/gi) ?? []).length, 2);
  assert.equal((update.match(/status = 'em_andamento'/gi) ?? []).length, 2);
});

test("policies usam os campos concretos e não reimplementam autoridade", () => {
  for (const conteudo of [select, insert, update]) {
    assert.match(
      conteudo,
      /usuario_tem_acesso_territorial\s*\(\s*negociacoes\.unidade_id,\s*negociacoes\.empresa_id\s*\)/i,
    );
    assert.doesNotMatch(conteudo, /usuarios_perfis|perfil_permissoes|\bperfis\b/i);
  }
});

test("RPCs preservam segurança, identidade, território, permissão e lock", () => {
  for (const conteudo of rpcs) {
    assert.match(conteudo, /security definer[\s\S]*set search_path = ''/i);
    assert.match(conteudo, /v_usuario := auth\.uid\(\)/i);
    assert.match(conteudo, /usuario_tem_acesso_territorial\s*\(\s*n\.unidade_id,\s*n\.empresa_id/i);
    assert.match(conteudo, /usuario_tem_permissao\('negociacoes\.encerrar'\)/i);
    assert.match(conteudo, /for update/i);
    assert.match(conteudo, /v_negociacao\.status <> 'em_andamento'/i);
  }
});

test("RPCs preservam exatamente as três transições finais", () => {
  assert.match(convertida, /set status = 'convertida'/i);
  assert.match(perdida, /set status = 'perdida'/i);
  assert.match(cancelada, /set status = 'cancelada'/i);
  for (const conteudo of rpcs) {
    assert.match(conteudo, /encerrado_em = now\(\)/i);
    assert.match(conteudo, /atualizado_em = now\(\)/i);
    assert.match(conteudo, /status = 'em_andamento'[\s\S]*returning \* into v_negociacao/i);
  }
});

test("RPCs recebem somente o ID e não confiam em território do cliente", () => {
  for (const conteudo of rpcs) {
    assert.match(conteudo, /\(\s*p_negociacao_id uuid\s*\)/i);
    assert.doesNotMatch(conteudo, /p_(empresa|unidade|perfil|escopo|status|permissao)/i);
    assert.doesNotMatch(conteudo, /usuarios_perfis|perfil_permissoes|\bperfis\b/i);
  }
});

test("migration não contém bypass, wildcard ou UUID organizacional", () => {
  assert.doesNotMatch(migration, /super_admin|gerente|admin\s+bypass|perfil\.codigo/i);
  assert.doesNotMatch(migration, /unidade_id\s+is\s+null|empresa_id\s+is\s+null/i);
  assert.doesNotMatch(
    migration,
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );
});

test("trigger histórico impede troca de organização e preserva transições", () => {
  const historica = readFileSync(
    resolve(process.cwd(), "supabase/migrations/20260812_create_negociacoes.sql"),
    "utf8",
  );
  assert.match(historica, /old\.empresa_id is distinct from new\.empresa_id/);
  assert.match(historica, /old\.unidade_id is distinct from new\.unidade_id/);
  assert.match(historica, /old\.veiculo_id is distinct from new\.veiculo_id/);
  assert.match(historica, /new\.status in \('convertida','perdida','cancelada'\)/);
  assert.match(historica, /create trigger negociacoes_proteger_estrutura/);
});

test("motor e adoções anteriores permanecem dependências separadas", () => {
  const anteriores = [
    "20260922_create_motor_autoridade_operacional.sql",
    "20260922_adota_autoridade_operacional_oportunidades.sql",
    "20260922_adota_autoridade_operacional_veiculos.sql",
  ].map((arquivo) =>
    readFileSync(resolve(process.cwd(), "supabase/migrations", arquivo), "utf8"),
  );
  assert.match(anteriores[0], /create function public\.usuario_tem_acesso_territorial/);
  assert.equal((anteriores[1].match(/create policy oportunidades_/g) ?? []).length, 4);
  assert.equal((anteriores[2].match(/create policy veiculos_/g) ?? []).length, 3);
  assert.doesNotMatch(migration, /\b(reservas|auditoria_eventos)\b/i);
});
