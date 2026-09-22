import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const caminho = resolve(
  process.cwd(),
  "supabase/migrations/20260922_adota_autoridade_operacional_auditoria.sql",
);
const migration = readFileSync(caminho, "utf8");

test("migration substitui somente a policy SELECT factual de Auditoria", () => {
  assert.equal((migration.match(/drop policy /gi) ?? []).length, 1);
  assert.equal((migration.match(/create policy /gi) ?? []).length, 1);
  assert.match(
    migration,
    /drop policy auditoria_eventos_select_authenticated\s+on public\.auditoria_eventos/i,
  );
  assert.match(
    migration,
    /create policy auditoria_eventos_select_authenticated\s+on public\.auditoria_eventos\s+for select\s+to authenticated/i,
  );
  assert.doesNotMatch(migration, /for\s+(insert|update|delete)\b/i);
  assert.doesNotMatch(migration, /auditoria_eventos_insert_authenticated/i);
});

test("SELECT separa autoridade territorial da permissao funcional real", () => {
  assert.match(
    migration,
    /usuario_tem_acesso_territorial\s*\(\s*auditoria_eventos\.unidade_id,\s*auditoria_eventos\.empresa_id\s*\)/i,
  );
  assert.match(
    migration,
    /usuario_tem_permissao\s*\(\s*'auditoria\.visualizar'\s*\)/i,
  );
  assert.equal((migration.match(/auditoria\.[a-z_]+/gi) ?? []).length, 1);
});

test("territorialidade falha fechada sem wildcard, fallback ou bypass", () => {
  assert.doesNotMatch(migration, /unidade_id\s+is\s+null/i);
  assert.doesNotMatch(migration, /\bcoalesce\s*\(/i);
  assert.doesNotMatch(migration, /usuarios_perfis|perfil_permissoes|perfil\.codigo/i);
  assert.doesNotMatch(migration, /super_admin|gerente|admin\s+bypass/i);
  assert.doesNotMatch(
    migration,
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );
});

test("migration nao altera schema, grants, funcoes ou imutabilidade", () => {
  assert.doesNotMatch(
    migration,
    /\b(alter table|create table|drop table|create function|replace function|grant|revoke|create trigger)\b/i,
  );
  assert.doesNotMatch(migration, /unidade_id\s+(set\s+not\s+null|uuid\s+not\s+null)/i);
  assert.doesNotMatch(migration, /create policy[\s\S]*for\s+(update|delete)\b/i);
});

test("migration permanece atomica e restrita a Auditoria", () => {
  assert.equal((migration.match(/^begin;/gim) ?? []).length, 1);
  assert.equal((migration.match(/^commit;/gim) ?? []).length, 1);
  assert.doesNotMatch(
    migration,
    /public\.(oportunidades|veiculos|negociacoes|reservas|usuarios_perfis|perfis|permissoes)\b/i,
  );
});

test("migrations canonicas anteriores continuam presentes e separadas", () => {
  for (const arquivo of [
    "20260922_create_motor_autoridade_operacional.sql",
    "20260922_adota_autoridade_operacional_oportunidades.sql",
    "20260922_adota_autoridade_operacional_veiculos.sql",
    "20260922_adota_autoridade_operacional_negociacoes.sql",
    "20260922_adota_autoridade_operacional_reservas.sql",
  ]) {
    assert.ok(
      readFileSync(resolve(process.cwd(), "supabase/migrations", arquivo), "utf8").length > 0,
    );
  }
});
