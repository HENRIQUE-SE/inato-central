import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const caminho = resolve(
  process.cwd(),
  "supabase/migrations/20260922_adota_autoridade_operacional_oportunidades.sql",
);
const migration = readFileSync(caminho, "utf8");

function policy(nome: string): string {
  const encontrada = migration.match(
    new RegExp(`create policy ${nome} on public\\.oportunidades[\\s\\S]*?;`, "i"),
  );
  assert.ok(encontrada, `Policy ${nome} não encontrada.`);
  return encontrada[0];
}

const select = policy("oportunidades_select_contexto");
const insert = policy("oportunidades_insert_contexto");
const update = policy("oportunidades_update_contexto");
const excluir = policy("oportunidades_delete_contexto");
const policies = [select, insert, update, excluir];

test("migration recria exatamente as quatro policies de Oportunidades", () => {
  assert.equal((migration.match(/create policy /gi) ?? []).length, 4);
  assert.equal((migration.match(/drop policy /gi) ?? []).length, 4);
  assert.match(select, /for select to authenticated/i);
  assert.match(insert, /for insert to authenticated/i);
  assert.match(update, /for update to authenticated/i);
  assert.match(excluir, /for delete to authenticated/i);
});

test("SELECT combina território canônico e permissão de visualização", () => {
  assert.match(select, /using\s*\([\s\S]*usuario_tem_acesso_territorial/i);
  assert.match(select, /usuario_tem_permissao\('oportunidades\.visualizar'\)/i);
});

test("INSERT combina território canônico e permissão de criação", () => {
  assert.match(insert, /with check\s*\([\s\S]*usuario_tem_acesso_territorial/i);
  assert.match(insert, /usuario_tem_permissao\('oportunidades\.criar'\)/i);
});

test("UPDATE protege linhas atuais e novos valores com o motor canônico", () => {
  assert.match(update, /using\s*\([\s\S]*usuario_tem_acesso_territorial/i);
  assert.match(update, /with check\s*\([\s\S]*usuario_tem_acesso_territorial/i);
  assert.equal((update.match(/usuario_tem_acesso_territorial/gi) ?? []).length, 2);
  assert.equal((update.match(/usuario_tem_permissao\('oportunidades\.alterar'\)/gi) ?? []).length, 2);
});

test("DELETE combina território canônico e permissão de exclusão", () => {
  assert.match(excluir, /using\s*\([\s\S]*usuario_tem_acesso_territorial/i);
  assert.match(excluir, /usuario_tem_permissao\('oportunidades\.excluir'\)/i);
});

test("todas as policies usam os campos organizacionais do próprio registro", () => {
  for (const conteudo of policies) {
    assert.match(
      conteudo,
      /usuario_tem_acesso_territorial\s*\(\s*oportunidades\.unidade_id,\s*oportunidades\.empresa_id\s*\)/i,
    );
  }
});

test("policies não reimplementam vínculo, perfil ou hierarquia", () => {
  for (const conteudo of policies) {
    assert.doesNotMatch(conteudo, /usuarios_perfis|perfil_permissoes|\bperfis\b/i);
    assert.doesNotMatch(conteudo, /\b(redes|operacoes|areas_operacionais|unidades)\b/i);
  }
});

test("policies não possuem bypass ou wildcard territorial", () => {
  for (const conteudo of policies) {
    assert.doesNotMatch(conteudo, /super_admin|gerente|admin\s+bypass|empresa\s+bypass/i);
    assert.doesNotMatch(conteudo, /unidade_id\s+is\s+null/i);
    assert.doesNotMatch(conteudo, /empresa_id\s*=|empresa_id\s+is\s+null/i);
    assert.doesNotMatch(
      conteudo,
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
  }
});

test("migration não altera grants, funções, triggers, RPCs ou outros domínios", () => {
  assert.doesNotMatch(migration, /\b(grant|revoke)\b/i);
  assert.doesNotMatch(migration, /create(\s+or\s+replace)?\s+function|drop\s+function/i);
  assert.doesNotMatch(migration, /create\s+trigger|drop\s+trigger|alter\s+trigger/i);
  assert.doesNotMatch(migration, /\b(veiculos|negociacoes|reservas|auditoria_eventos)\b/i);
  assert.doesNotMatch(migration, /\b(call|rpc)\b/i);
});

test("trigger histórico continua protegendo Empresa e Unidade", () => {
  const historica = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20260831_regularize_oportunidades_organizacao_rls.sql",
    ),
    "utf8",
  );
  assert.match(historica, /create function public\.proteger_contexto_organizacional_oportunidade/);
  assert.match(historica, /old\.empresa_id is distinct from new\.empresa_id/);
  assert.match(historica, /old\.unidade_id is distinct from new\.unidade_id/);
  assert.match(historica, /create trigger oportunidades_proteger_contexto_organizacional/);
});

test("motor 4A preserva falha fechada e separação entre ONDE e O QUE", () => {
  const motor = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20260922_create_motor_autoridade_operacional.sql",
    ),
    "utf8",
  );
  assert.match(motor, /create function public\.usuario_tem_acesso_territorial/);
  assert.match(motor, /create function public\.usuario_tem_permissao/);
  assert.equal((motor.match(/quantidade_vinculos_ativos = 1/g) ?? []).length, 2);
  assert.equal((motor.match(/and pf\.ativo/g) ?? []).length, 2);
  assert.match(motor, /where \(select auth\.uid\(\)\) is not null/);
  assert.match(motor, /\(select auth\.uid\(\)\) is not null[\s\S]*permissao_codigo is not null/);
});
