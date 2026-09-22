import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const caminho = resolve(
  process.cwd(),
  "supabase/migrations/20260922_adota_autoridade_operacional_reservas.sql",
);
const migration = readFileSync(caminho, "utf8");

function funcao(nome: string): string {
  const encontrada = migration.match(
    new RegExp(`create or replace function public\\.${nome}\\([\\s\\S]*?\\n\\$\\$;`, "i"),
  );
  assert.ok(encontrada, `Função ${nome} não encontrada.`);
  return encontrada[0];
}

const criar = funcao("criar_reserva");
const cancelar = funcao("cancelar_reserva");
const expirar = funcao("expirar_reservas_vencidas");

test("migration recria somente a policy SELECT efetiva de Reservas", () => {
  assert.equal((migration.match(/drop policy /gi) ?? []).length, 1);
  assert.equal((migration.match(/create policy /gi) ?? []).length, 1);
  assert.match(migration, /create policy reservas_select_contexto on public\.reservas/i);
  assert.match(migration, /for select to authenticated/i);
  assert.match(migration, /usuario_tem_acesso_territorial\s*\(\s*reservas\.unidade_id,\s*reservas\.empresa_id/i);
  assert.match(migration, /usuario_tem_permissao\('reservas\.visualizar'\)/i);
  assert.doesNotMatch(migration, /for (insert|update|delete) to authenticated/i);
});

test("criação deriva autoridade do Veículo persistido e usa permissão real", () => {
  assert.match(criar, /u := auth\.uid\(\)/i);
  assert.match(criar, /from public\.veiculos[\s\S]*where id = n\.veiculo_id[\s\S]*for update/i);
  assert.match(criar, /usuario_tem_acesso_territorial\(v\.unidade_id, v\.empresa_id\)/i);
  assert.match(criar, /usuario_tem_permissao\('reservas\.criar'\)/i);
  assert.doesNotMatch(criar, /p_(empresa|unidade|perfil|escopo)_id/i);
});

test("criação preserva locks, estados, organização e prazo de 24 horas", () => {
  assert.equal((criar.match(/for update/gi) ?? []).length, 2);
  assert.match(criar, /n\.status <> 'em_andamento'/i);
  assert.match(criar, /v\.empresa_id <> n\.empresa_id/i);
  assert.match(criar, /v\.unidade_id <> n\.unidade_id/i);
  assert.match(criar, /v\.arquivado_em is not null/i);
  assert.match(criar, /v\.status <> 'disponivel'/i);
  assert.match(criar, /t \+ interval '24 hours'/i);
  assert.match(criar, /set status = 'reservado'/i);
});

test("criação preserva autoria e atomicidade entre Reserva e Veículo", () => {
  assert.match(criar, /insert into public\.reservas/i);
  assert.match(criar, /criado_por_usuario_id/i);
  assert.match(criar, /v\.empresa_id,[\s\S]*v\.unidade_id,[\s\S]*n\.id,[\s\S]*v\.id,[\s\S]*u,/i);
  assert.match(criar, /update public\.veiculos[\s\S]*status = 'reservado'/i);
  assert.match(criar, /if not found then[\s\S]*O veículo não pode ser reservado/i);
});

test("cancelamento preserva autenticação, território, permissão e lock", () => {
  assert.match(cancelar, /u := auth\.uid\(\)/i);
  assert.match(cancelar, /from public\.reservas[\s\S]*where id = p_reserva_id[\s\S]*for update/i);
  assert.match(cancelar, /usuario_tem_acesso_territorial\(r\.unidade_id, r\.empresa_id\)/i);
  assert.match(cancelar, /usuario_tem_permissao\('reservas\.cancelar'\)/i);
  assert.match(cancelar, /r\.status <> 'ativa'/i);
});

test("cancelamento preserva motivos, detalhes e limite", () => {
  for (const motivo of [
    "cliente_desistiu",
    "cliente_nao_compareceu",
    "credito_nao_aprovado",
    "cliente_comprou_outro",
    "proprietario_desistiu",
    "veiculo_indisponivel",
    "cancelado_pela_inato",
    "outro",
  ]) {
    assert.match(cancelar, new RegExp(`'${motivo}'`));
  }
  assert.match(cancelar, /p_motivo = 'outro'[\s\S]*length\(d\) > 500/i);
  assert.match(cancelar, /p_motivo <> 'outro'[\s\S]*d := null/i);
});

test("cancelamento encerra Reserva e libera Veículo atomicamente", () => {
  assert.match(cancelar, /set status = 'cancelada'/i);
  assert.match(cancelar, /motivo_cancelamento = p_motivo/i);
  assert.match(cancelar, /motivo_cancelamento_detalhes = d/i);
  assert.match(cancelar, /encerrado_em = t[\s\S]*atualizado_em = t/i);
  assert.match(cancelar, /update public\.veiculos[\s\S]*set status = 'disponivel'/i);
  assert.match(cancelar, /status = 'reservado'/i);
});

test("expiração permanece autenticada, territorial e funcional", () => {
  assert.match(expirar, /if auth\.uid\(\) is null/i);
  assert.match(expirar, /usuario_tem_acesso_territorial\(x\.unidade_id, x\.empresa_id\)/i);
  assert.match(expirar, /usuario_tem_permissao\('reservas\.visualizar'\)/i);
  assert.match(expirar, /x\.status = 'ativa'[\s\S]*x\.expira_em <= t/i);
});

test("expiração preserva lock, idempotência, Veículo e Auditoria", () => {
  assert.match(expirar, /for update skip locked/i);
  assert.match(expirar, /set status = 'expirada'/i);
  assert.match(expirar, /where id = r\.id[\s\S]*status = 'ativa'/i);
  assert.match(expirar, /update public\.veiculos[\s\S]*set status = 'disponivel'/i);
  assert.match(expirar, /insert into public\.auditoria_eventos/i);
  assert.match(expirar, /\borigem,[\s\S]*'sistema'/i);
  assert.match(expirar, /'motivo', 'expiracao_24_horas'/i);
});

test("RPCs mantêm segurança e não recebem território como autoridade", () => {
  for (const conteudo of [criar, cancelar, expirar]) {
    assert.match(conteudo, /security definer[\s\S]*set search_path = ''/i);
    assert.doesNotMatch(conteudo, /usuarios_perfis|perfil_permissoes|\bperfis\b/i);
    assert.doesNotMatch(conteudo, /p_(empresa|unidade|perfil|escopo)_id/i);
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

test("proteções persistentes e migrations anteriores permanecem separadas", () => {
  const historica = readFileSync(
    resolve(process.cwd(), "supabase/migrations/20260813_create_reservas.sql"),
    "utf8",
  );
  assert.match(historica, /unique index reservas_veiculo_ativa_unique/i);
  assert.match(historica, /reservas_duracao_check/i);
  assert.match(historica, /reservas_encerramento_check/i);
  assert.match(historica, /revoke insert,update,delete on public\.reservas/i);

  for (const arquivo of [
    "20260922_create_motor_autoridade_operacional.sql",
    "20260922_adota_autoridade_operacional_oportunidades.sql",
    "20260922_adota_autoridade_operacional_veiculos.sql",
    "20260922_adota_autoridade_operacional_negociacoes.sql",
  ]) {
    assert.ok(readFileSync(resolve(process.cwd(), "supabase/migrations", arquivo), "utf8").length > 0);
  }
});
