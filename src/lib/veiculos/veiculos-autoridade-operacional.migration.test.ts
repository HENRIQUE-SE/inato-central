import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const caminho = resolve(
  process.cwd(),
  "supabase/migrations/20260922_adota_autoridade_operacional_veiculos.sql",
);
const migration = readFileSync(caminho, "utf8");

function policy(nome: string): string {
  const encontrada = migration.match(
    new RegExp(`create policy ${nome} on public\\.veiculos[\\s\\S]*?;`, "i"),
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

const select = policy("veiculos_select_contexto");
const insert = policy("veiculos_insert_contexto");
const update = policy("veiculos_update_contexto");
const preparar = funcao("marcar_veiculo_pronto_para_anunciar");
const publicar = funcao("marcar_veiculo_disponivel");

test("migration recria somente as três policies efetivas de Veículos", () => {
  assert.equal((migration.match(/drop policy /gi) ?? []).length, 3);
  assert.equal((migration.match(/create policy /gi) ?? []).length, 3);
  assert.match(select, /for select to authenticated/i);
  assert.match(insert, /for insert to authenticated/i);
  assert.match(update, /for update to authenticated/i);
  assert.doesNotMatch(migration, /create policy veiculos_delete|for delete/i);
});

test("SELECT usa somente território porque não existe veiculos.visualizar", () => {
  assert.match(select, /usuario_tem_acesso_territorial/i);
  assert.doesNotMatch(select, /usuario_tem_permissao/i);
  assert.doesNotMatch(migration, /veiculos\.visualizar/i);
});

test("INSERT preserva permissão real e vínculo com Oportunidades", () => {
  assert.match(insert, /usuario_tem_acesso_territorial/i);
  assert.match(insert, /usuario_tem_permissao\('oportunidades\.criar'\)/i);
  assert.match(insert, /from public\.oportunidades o[\s\S]*o\.id = veiculos\.oportunidade_id/i);
});

test("UPDATE protege linha e novos valores com território e permissão real", () => {
  assert.match(update, /using\s*\([\s\S]*usuario_tem_acesso_territorial/i);
  assert.match(update, /with check\s*\([\s\S]*usuario_tem_acesso_territorial/i);
  assert.equal((update.match(/usuario_tem_acesso_territorial/gi) ?? []).length, 2);
  assert.equal((update.match(/usuario_tem_permissao\('oportunidades\.alterar'\)/gi) ?? []).length, 2);
  assert.equal((update.match(/veiculos\.arquivado_em is null/gi) ?? []).length, 2);
});

test("policies usam campos concretos e não reimplementam autoridade", () => {
  for (const conteudo of [select, insert, update]) {
    assert.match(
      conteudo,
      /usuario_tem_acesso_territorial\s*\(\s*veiculos\.unidade_id,\s*veiculos\.empresa_id\s*\)/i,
    );
    assert.doesNotMatch(conteudo, /usuarios_perfis|perfil_permissoes|\bperfis\b/i);
  }
});

test("RPC de preparação preserva segurança, estado e atualização condicional", () => {
  assert.match(preparar, /security definer[\s\S]*set search_path = ''/i);
  assert.match(preparar, /v_usuario_id := auth\.uid\(\)/i);
  assert.match(preparar, /usuario_tem_acesso_territorial\s*\(\s*v\.unidade_id,\s*v\.empresa_id/i);
  assert.match(preparar, /usuario_tem_permissao\('veiculos\.preparacao\.concluir'\)/i);
  assert.match(preparar, /v_veiculo\.status <> 'em_preparacao'/i);
  assert.match(preparar, /set status = 'pronto_para_anunciar'/i);
  assert.match(preparar, /v\.status = 'em_preparacao'[\s\S]*v\.arquivado_em is null/i);
});

test("RPC de publicação preserva segurança, estado e atualização condicional", () => {
  assert.match(publicar, /security definer[\s\S]*set search_path = ''/i);
  assert.match(publicar, /v_usuario_id := auth\.uid\(\)/i);
  assert.match(publicar, /usuario_tem_acesso_territorial\s*\(\s*v\.unidade_id,\s*v\.empresa_id/i);
  assert.match(publicar, /usuario_tem_permissao\('veiculos\.publicacao\.concluir'\)/i);
  assert.match(publicar, /v_veiculo\.status <> 'pronto_para_anunciar'/i);
  assert.match(publicar, /set status = 'disponivel'/i);
  assert.match(publicar, /v\.status = 'pronto_para_anunciar'[\s\S]*v\.arquivado_em is null/i);
});

test("RPCs recebem somente o ID e não confiam em território do cliente", () => {
  for (const conteudo of [preparar, publicar]) {
    assert.match(conteudo, /\(\s*p_veiculo_id uuid\s*\)/i);
    assert.doesNotMatch(conteudo, /p_(empresa|unidade|perfil|escopo)_id/i);
    assert.doesNotMatch(conteudo, /usuarios_perfis|perfil_permissoes|\bperfis\b/i);
  }
});

test("migration não contém bypass, wildcard ou UUID organizacional", () => {
  assert.doesNotMatch(migration, /super_admin|gerente|admin\s+bypass|perfil\.codigo/i);
  assert.doesNotMatch(migration, /unidade_id\s+is\s+null|empresa_id\s*=/i);
  assert.doesNotMatch(
    migration,
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );
});

test("trigger efetivo preserva Empresa, Unidade e demais campos estruturais", () => {
  const reservas = readFileSync(
    resolve(process.cwd(), "supabase/migrations/20260813_create_reservas.sql"),
    "utf8",
  );
  assert.match(reservas, /create or replace function public\.proteger_campos_estruturais_veiculo/);
  assert.match(reservas, /old\.empresa_id is distinct from new\.empresa_id/);
  assert.match(reservas, /old\.unidade_id is distinct from new\.unidade_id/);
  assert.match(reservas, /old\.oportunidade_id is distinct from new\.oportunidade_id/);
  assert.match(reservas, /old\.arquivado_em is distinct from new\.arquivado_em/);
});

test("motor 4A e adoção em Oportunidades permanecem como dependências separadas", () => {
  const motor = readFileSync(
    resolve(process.cwd(), "supabase/migrations/20260922_create_motor_autoridade_operacional.sql"),
    "utf8",
  );
  const oportunidades = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20260922_adota_autoridade_operacional_oportunidades.sql",
    ),
    "utf8",
  );
  assert.equal((motor.match(/create function public\.usuario_tem_/g) ?? []).length, 2);
  assert.equal((oportunidades.match(/create policy oportunidades_/g) ?? []).length, 4);
  assert.doesNotMatch(migration, /create(\s+or\s+replace)?\s+function public\.usuario_tem_/i);
  assert.doesNotMatch(migration, /\b(negociacoes|reservas|auditoria_eventos)\b/i);
});
