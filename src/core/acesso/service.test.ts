import assert from "node:assert/strict";
import { test } from "node:test";
import { CODIGOS_PERFIL_ACESSO, CODIGOS_PERMISSAO_ACESSO, PERMISSOES_INICIAIS_POR_PERFIL, type CodigoPerfilAcesso } from "./constants";
import { possuiPermissao } from "./service";
import type { ContextoAcesso } from "./types";

function contexto(codigo: CodigoPerfilAcesso): ContextoAcesso {
  return {
    vinculo: { id: "vinculo", usuarioId: "usuario", empresaId: "empresa", unidadeId: "unidade", perfilId: codigo, ativo: true, criadoEm: "2026-08-07T00:00:00.000Z" },
    perfil: { id: codigo, codigo, nome: codigo, descricao: null, ativo: true, criadoEm: "2026-08-07T00:00:00.000Z" },
    permissoes: PERMISSOES_INICIAIS_POR_PERFIL[codigo].map((permissao) => ({ id: permissao, codigo: permissao, nome: permissao, descricao: null, criadoEm: "2026-08-07T00:00:00.000Z" })),
  };
}

test("administrador possui auditoria.visualizar", () => assert.equal(possuiPermissao(contexto(CODIGOS_PERFIL_ACESSO.ADMINISTRADOR), CODIGOS_PERMISSAO_ACESSO.AUDITORIA_VISUALIZAR), true));
test("consultor não possui auditoria.visualizar", () => assert.equal(possuiPermissao(contexto(CODIGOS_PERFIL_ACESSO.CONSULTOR), CODIGOS_PERMISSAO_ACESSO.AUDITORIA_VISUALIZAR), false));
test("administrador possui todas as permissões de oportunidades", () => { const atual = contexto(CODIGOS_PERFIL_ACESSO.ADMINISTRADOR); for (const codigo of Object.values(CODIGOS_PERMISSAO_ACESSO).filter((valor) => valor.startsWith("oportunidades."))) assert.equal(possuiPermissao(atual, codigo), true); });
test("consultor possui permissões operacionais de oportunidades", () => { const atual = contexto(CODIGOS_PERFIL_ACESSO.CONSULTOR); for (const codigo of PERMISSOES_INICIAIS_POR_PERFIL.consultor) assert.equal(possuiPermissao(atual, codigo), true); });
test("financeiro não possui auditoria", () => assert.equal(possuiPermissao(contexto(CODIGOS_PERFIL_ACESSO.FINANCEIRO), CODIGOS_PERMISSAO_ACESSO.AUDITORIA_VISUALIZAR), false));
test("teste preserva oportunidades.visualizar", () => { const atual = contexto(CODIGOS_PERFIL_ACESSO.TESTE); assert.equal(possuiPermissao(atual, CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR), true); });
test("permissão inexistente retorna false", () => assert.equal(possuiPermissao(contexto(CODIGOS_PERFIL_ACESSO.ADMINISTRADOR), "inexistente" as typeof CODIGOS_PERMISSAO_ACESSO.AUDITORIA_VISUALIZAR), false));
test("verificação não altera o contexto", () => { const atual = contexto(CODIGOS_PERFIL_ACESSO.ADMINISTRADOR); const antes = structuredClone(atual); possuiPermissao(atual, CODIGOS_PERMISSAO_ACESSO.AUDITORIA_VISUALIZAR); assert.deepEqual(atual, antes); });
test("administrador pode concluir preparação de veículo", () => assert.equal(possuiPermissao(contexto(CODIGOS_PERFIL_ACESSO.ADMINISTRADOR), CODIGOS_PERMISSAO_ACESSO.VEICULOS_PREPARACAO_CONCLUIR), true));
test("consultor pode concluir preparação de veículo", () => assert.equal(possuiPermissao(contexto(CODIGOS_PERFIL_ACESSO.CONSULTOR), CODIGOS_PERMISSAO_ACESSO.VEICULOS_PREPARACAO_CONCLUIR), true));
test("teste não pode concluir preparação de veículo", () => assert.equal(possuiPermissao(contexto(CODIGOS_PERFIL_ACESSO.TESTE), CODIGOS_PERMISSAO_ACESSO.VEICULOS_PREPARACAO_CONCLUIR), false));
test("financeiro não pode concluir preparação de veículo", () => assert.equal(possuiPermissao(contexto(CODIGOS_PERFIL_ACESSO.FINANCEIRO), CODIGOS_PERMISSAO_ACESSO.VEICULOS_PREPARACAO_CONCLUIR), false));
test("administrador pode concluir publicação de veículo", () => assert.equal(possuiPermissao(contexto(CODIGOS_PERFIL_ACESSO.ADMINISTRADOR), CODIGOS_PERMISSAO_ACESSO.VEICULOS_PUBLICACAO_CONCLUIR), true));
test("consultor pode concluir publicação de veículo", () => assert.equal(possuiPermissao(contexto(CODIGOS_PERFIL_ACESSO.CONSULTOR), CODIGOS_PERMISSAO_ACESSO.VEICULOS_PUBLICACAO_CONCLUIR), true));
test("teste não pode concluir publicação de veículo", () => assert.equal(possuiPermissao(contexto(CODIGOS_PERFIL_ACESSO.TESTE), CODIGOS_PERMISSAO_ACESSO.VEICULOS_PUBLICACAO_CONCLUIR), false));
test("financeiro não pode concluir publicação de veículo", () => assert.equal(possuiPermissao(contexto(CODIGOS_PERFIL_ACESSO.FINANCEIRO), CODIGOS_PERMISSAO_ACESSO.VEICULOS_PUBLICACAO_CONCLUIR), false));
for (const permissao of [CODIGOS_PERMISSAO_ACESSO.NEGOCIACOES_VISUALIZAR, CODIGOS_PERMISSAO_ACESSO.NEGOCIACOES_CRIAR, CODIGOS_PERMISSAO_ACESSO.NEGOCIACOES_ALTERAR, CODIGOS_PERMISSAO_ACESSO.NEGOCIACOES_ENCERRAR]) {
  test(`administrador possui ${permissao}`, () => assert.equal(possuiPermissao(contexto(CODIGOS_PERFIL_ACESSO.ADMINISTRADOR), permissao), true));
  test(`consultor possui ${permissao}`, () => assert.equal(possuiPermissao(contexto(CODIGOS_PERFIL_ACESSO.CONSULTOR), permissao), true));
  test(`financeiro não possui ${permissao}`, () => assert.equal(possuiPermissao(contexto(CODIGOS_PERFIL_ACESSO.FINANCEIRO), permissao), false));
}
test("teste possui somente visualização de negociações", () => { const atual=contexto(CODIGOS_PERFIL_ACESSO.TESTE); assert.equal(possuiPermissao(atual,CODIGOS_PERMISSAO_ACESSO.NEGOCIACOES_VISUALIZAR),true); assert.equal(possuiPermissao(atual,CODIGOS_PERMISSAO_ACESSO.NEGOCIACOES_CRIAR),false); assert.equal(possuiPermissao(atual,CODIGOS_PERMISSAO_ACESSO.NEGOCIACOES_ALTERAR),false); assert.equal(possuiPermissao(atual,CODIGOS_PERMISSAO_ACESSO.NEGOCIACOES_ENCERRAR),false); });
