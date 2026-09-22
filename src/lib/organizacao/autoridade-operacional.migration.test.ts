import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const caminho = resolve(process.cwd(), "supabase/migrations/20260922_create_motor_autoridade_operacional.sql");
const migration = readFileSync(caminho, "utf8");

function corpo(nome: string): string {
  const encontrado = migration.match(new RegExp(`create function public\\.${nome}\\([\\s\\S]*?\\n\\$\\$;`, "i"));
  assert.ok(encontrado, `Função ${nome} não encontrada.`);
  return encontrado[0];
}

const territorial = corpo("usuario_tem_acesso_territorial");
const funcional = corpo("usuario_tem_permissao");

test("função territorial usa identidade autenticada, argumentos mínimos e falha fechado", () => {
  assert.match(territorial, /usuario_tem_acesso_territorial\s*\(\s*unidade_alvo uuid,\s*empresa_alvo uuid/);
  assert.match(territorial, /auth\.uid\(\)/);
  assert.match(territorial, /\(select auth\.uid\(\)\) is not null/);
  assert.match(territorial, /unidade_alvo is not null/);
  assert.match(territorial, /empresa_alvo is not null/);
  assert.match(territorial, /coalesce\([\s\S]*false\)/);
  assert.doesNotMatch(territorial, /usuario_id\s+uuid|rede_id\s+uuid|operacao_id\s+uuid|area_operacional_id\s+uuid|escopo_tipo\s+text|perfil_id\s+uuid/);
});

test("função territorial exige exatamente um vínculo ativo e perfil ativo", () => {
  assert.match(territorial, /from public\.usuarios_perfis up/);
  assert.match(territorial, /up\.usuario_id = \(select auth\.uid\(\)\)/);
  assert.match(territorial, /and up\.ativo/);
  assert.match(territorial, /count\(\*\) over \(\) as quantidade_vinculos_ativos/);
  assert.match(territorial, /quantidade_vinculos_ativos = 1/);
  assert.match(territorial, /join public\.perfis pf[\s\S]*and pf\.ativo/);
});

test("função territorial usa hierarquia persistida e exige todos os níveis ativos", () => {
  assert.match(territorial, /join public\.unidades u[\s\S]*u\.id = unidade_alvo[\s\S]*u\.ativo/);
  assert.match(territorial, /join public\.areas_operacionais ao[\s\S]*ao\.id = u\.area_operacional_id[\s\S]*ao\.ativo/);
  assert.match(territorial, /join public\.operacoes op[\s\S]*op\.id = ao\.operacao_id[\s\S]*op\.ativo[\s\S]*op\.empresa_id is not null/);
  assert.match(territorial, /join public\.redes r[\s\S]*r\.id = op\.rede_id[\s\S]*r\.ativo/);
  assert.match(territorial, /op\.empresa_id = empresa_alvo/);
});

test("matriz territorial valida Rede, Operação, Área e Unidade sem usar Empresa como nível superior", () => {
  assert.match(territorial, /when 'rede'[\s\S]*vu\.rede_id = op\.rede_id/);
  assert.match(territorial, /when 'operacao'[\s\S]*vu\.operacao_id = op\.id/);
  assert.match(territorial, /when 'area_operacional'[\s\S]*vu\.area_operacional_id = ao\.id/);
  assert.match(territorial, /when 'unidade'[\s\S]*vu\.unidade_id = u\.id[\s\S]*vu\.empresa_id = op\.empresa_id/);
  const superiores = territorial.slice(territorial.indexOf("when 'rede'"), territorial.indexOf("when 'unidade'"));
  assert.doesNotMatch(superiores, /vu\.empresa_id\s*=\s*empresa_alvo/);
  assert.doesNotMatch(territorial, /vu\.empresa_id\s*=\s*empresa_alvo/);
});

test("estrutura do vínculo falha fechado em cada escopo e não contém bypass por perfil", () => {
  assert.match(territorial, /when 'rede'[\s\S]*vu\.operacao_id is null[\s\S]*vu\.area_operacional_id is null[\s\S]*vu\.empresa_id is null[\s\S]*vu\.unidade_id is null/);
  assert.match(territorial, /when 'operacao'[\s\S]*vu\.operacao_id is not null[\s\S]*vu\.area_operacional_id is null[\s\S]*vu\.unidade_id is null/);
  assert.match(territorial, /when 'area_operacional'[\s\S]*vu\.area_operacional_id is not null[\s\S]*vu\.unidade_id is null/);
  assert.match(territorial, /when 'unidade'[\s\S]*vu\.empresa_id is not null[\s\S]*vu\.unidade_id is not null/);
  assert.doesNotMatch(territorial, /super_admin|gerente|00000000-/);
});

test("função funcional representa apenas permissão e exige vínculo único e perfil ativo", () => {
  assert.match(funcional, /usuario_tem_permissao\s*\(\s*permissao_codigo text/);
  assert.match(funcional, /auth\.uid\(\)/);
  assert.match(funcional, /and up\.ativo/);
  assert.match(funcional, /count\(\*\) over \(\) as quantidade_vinculos_ativos/);
  assert.match(funcional, /quantidade_vinculos_ativos = 1/);
  assert.match(funcional, /join public\.perfis pf[\s\S]*and pf\.ativo/);
  assert.match(funcional, /join public\.perfil_permissoes pp/);
  assert.match(funcional, /join public\.permissoes p[\s\S]*p\.codigo = permissao_codigo/);
  assert.match(funcional, /permissao_codigo is not null/);
  assert.match(funcional, /btrim\(permissao_codigo\) <> ''/);
  assert.doesNotMatch(funcional, /lower\(permissao_codigo\)|upper\(permissao_codigo\)|p\.codigo\s+(?:like|ilike)/i);
  assert.doesNotMatch(funcional, /unidades|areas_operacionais|operacoes|redes|empresa_id|unidade_id|escopo_tipo|super_admin|gerente|00000000-/);
});

test("entrada funcional nula, vazia ou somente com espaços falha fechado sem transformar o código", () => {
  assert.match(funcional, /permissao_codigo is not null/);
  assert.match(funcional, /btrim\(permissao_codigo\) <> ''/);
  assert.match(funcional, /p\.codigo = permissao_codigo/);
  assert.doesNotMatch(funcional, /p\.codigo\s*=\s*btrim\(permissao_codigo\)/);
});

test("contagem inclui todos os vínculos ativos antes de filtrar perfil ativo", () => {
  for (const atual of [territorial, funcional]) {
    const indiceContagem = atual.indexOf("count(*) over () as quantidade_vinculos_ativos");
    const indicePerfil = atual.indexOf("join public.perfis pf");
    assert.ok(indiceContagem >= 0);
    assert.ok(indicePerfil > indiceContagem);
    assert.match(atual, /from public\.usuarios_perfis up[\s\S]*and up\.ativo[\s\S]*\),\s*vinculo_unico[\s\S]*join public\.perfis pf/);
    assert.match(atual, /where va\.quantidade_vinculos_ativos = 1/);
  }
});

test("funções possuem segurança endurecida e privilégios mínimos", () => {
  for (const atual of [territorial, funcional]) {
    assert.match(atual, /security definer/);
    assert.match(atual, /set search_path = ''/);
    assert.doesNotMatch(atual, /execute\s+format|format\s*\(/i);
  }
  assert.match(migration, /revoke all on function public\.usuario_tem_acesso_territorial\(uuid, uuid\)\s+from PUBLIC;/);
  assert.match(migration, /revoke all on function public\.usuario_tem_acesso_territorial\(uuid, uuid\)\s+from anon;/);
  assert.match(migration, /revoke all on function public\.usuario_tem_permissao\(text\)\s+from PUBLIC;/);
  assert.match(migration, /revoke all on function public\.usuario_tem_permissao\(text\)\s+from anon;/);
  assert.match(migration, /grant execute on function public\.usuario_tem_acesso_territorial\(uuid, uuid\)[\s\S]*to authenticated/);
  assert.match(migration, /grant execute on function public\.usuario_tem_permissao\(text\)[\s\S]*to authenticated/);
  assert.equal((migration.match(/grant execute on function/g) ?? []).length, 2);
  assert.doesNotMatch(migration, /service_role/i);
});

test("migration cria somente o motor e não altera policies ou RPCs operacionais", () => {
  assert.doesNotMatch(migration, /create\s+policy|alter\s+policy|drop\s+policy/i);
  assert.doesNotMatch(migration, /create(\s+or\s+replace)?\s+function\s+public\.(marcar_veiculo_pronto_para_anunciar|marcar_veiculo_disponivel|marcar_negociacao_convertida|marcar_negociacao_perdida|cancelar_negociacao|criar_reserva|cancelar_reserva|expirar_reservas_vencidas)/i);
  assert.doesNotMatch(migration, /drop\s+(function|table|policy)|drop\s+cascade/i);
});

test("comentário funcional restringe o parâmetro de permissão a constantes de policies e RPCs", () => {
  assert.match(migration, /Policies e RPCs devem fornecer códigos constantes, nunca parâmetros livres recebidos da interface/);
});
