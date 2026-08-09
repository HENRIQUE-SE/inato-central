import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { listarEventosAuditoria, type RegistroAuditoria } from "@/core/auditoria";
import { limparEventosAuditoriaParaTestes } from "@/core/auditoria/service";
import { obterContextoIdentidadeAtual } from "@/core/identidade";
import { CODIGOS_PERFIL_ACESSO, CODIGOS_PERMISSAO_ACESSO, type ContextoAcesso } from "@/core/acesso";
import type { Oportunidade } from "@/types/oportunidade";
import { registrarAuditoriaAlteracaoOportunidade, registrarAuditoriaCriacaoOportunidade, registrarAuditoriaExclusaoOportunidade } from "./oportunidades.auditoria";

const oportunidade: Oportunidade = { id: "00000000-0000-4000-8000-000000000201", proprietario_nome: "Proprietário", telefone: "34999999999", cidade: "Patrocínio", veiculo_informado: "Veículo", placa: "ABC1D23", origem: "teste", status: "novo", created_at: "2026-08-07T00:00:00.000Z" };
const usuario = { id: "00000000-0000-4000-8000-000000000999", email: "usuario@inato.test" };
let persistidos: RegistroAuditoria[];
const contextoAcesso: ContextoAcesso = {
  vinculo: { id: "v", usuarioId: usuario.id, empresaId: "00000000-0000-4000-8000-000000000001", unidadeId: "00000000-0000-4000-8000-000000000002", perfilId: "perfil", ativo: true, criadoEm: "2026-08-07T00:00:00.000Z" },
  perfil: { id: "perfil", codigo: CODIGOS_PERFIL_ACESSO.CONSULTOR, nome: "Consultor", descricao: null, ativo: true, criadoEm: "2026-08-07T00:00:00.000Z" },
  permissoes: [{ id: "p", codigo: CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR, nome: "Visualizar", descricao: null, criadoEm: "2026-08-07T00:00:00.000Z" }],
};
const dependencias = { obterUsuario: async () => usuario, obterContextoAcesso: async () => contextoAcesso, persistir: async (evento: RegistroAuditoria) => { persistidos.push(evento); return evento; } };

beforeEach(() => { limparEventosAuditoriaParaTestes(); persistidos = []; });

test("criação usa usuário real, contexto, perfil e persiste", async () => {
  await registrarAuditoriaCriacaoOportunidade(oportunidade, dependencias);
  const [evento] = persistidos; const contexto = obterContextoIdentidadeAtual();
  assert.equal(evento.usuarioId, usuario.id); assert.equal(evento.empresaId, contexto.organizacao.empresaId); assert.equal(evento.unidadeId, contexto.organizacao.unidadeId);
  assert.equal(evento.acao, "criar"); assert.equal(evento.resultado, "sucesso"); assert.equal(evento.origem, "usuario");
  assert.equal(evento.modulo, "oportunidades"); assert.equal(evento.recursoTipo, "oportunidade"); assert.equal(evento.recursoId, oportunidade.id);
  assert.deepEqual(evento.detalhes, { placa: "ABC1D23", proprietario: "Proprietário", veiculo: "Veículo", perfilCodigo: "consultor", usuarioEmail: "usuario@inato.test" });
  assert.equal(listarEventosAuditoria().length, 1); assert.equal(listarEventosAuditoria()[0].usuarioId, null);
});

test("alteração persiste o evento", async () => { await registrarAuditoriaAlteracaoOportunidade(oportunidade, dependencias); assert.equal(persistidos[0].acao, "alterar"); });
test("exclusão persiste o evento", async () => { await registrarAuditoriaExclusaoOportunidade(oportunidade, dependencias); assert.equal(persistidos[0].acao, "excluir"); });

test("usuário ausente mantém evento em memória sem persistir ou criar identificador falso", async () => {
  await registrarAuditoriaCriacaoOportunidade(oportunidade, { ...dependencias, obterUsuario: async () => null });
  assert.equal(persistidos.length, 0); assert.equal(listarEventosAuditoria().length, 1); assert.equal(listarEventosAuditoria()[0].usuarioId, null);
  assert.equal("usuarioEmail" in (listarEventosAuditoria()[0].detalhes ?? {}), false);
});

test("auditoria não contém senha nem token", async () => {
  await registrarAuditoriaCriacaoOportunidade(oportunidade, dependencias);
  const texto = JSON.stringify(persistidos[0]);
  assert.equal(/senha|password|token|access_token/i.test(texto), false);
});
