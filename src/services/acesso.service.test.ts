import assert from "node:assert/strict";
import { test } from "node:test";
import { CODIGOS_PERFIL_ACESSO, CODIGOS_PERMISSAO_ACESSO, type ContextoAcesso } from "@/core/acesso";
import { exigirPermissao, obterContextoAcessoAtual, usuarioAtualPossuiPermissao } from "./acesso.service";

const contexto: ContextoAcesso = {
  vinculo: { id: "v", usuarioId: "usuario-1", empresaId: "empresa", unidadeId: "unidade", perfilId: "perfil", ativo: true, criadoEm: "2026-08-07T00:00:00.000Z" },
  perfil: { id: "perfil", codigo: CODIGOS_PERFIL_ACESSO.ADMINISTRADOR, nome: "Administrador", descricao: null, ativo: true, criadoEm: "2026-08-07T00:00:00.000Z" },
  permissoes: [{ id: "p", codigo: CODIGOS_PERMISSAO_ACESSO.AUDITORIA_VISUALIZAR, nome: "Auditoria", descricao: null, criadoEm: "2026-08-07T00:00:00.000Z" }],
};
const dependencias = { obterUsuario: async () => ({ id: "usuario-1", email: "admin@inato.com" }), obterContextoPersistido: async () => contexto };
const contextoConsultor: ContextoAcesso = {
  vinculo: { ...contexto.vinculo, perfilId: "perfil-consultor" },
  perfil: { ...contexto.perfil, id: "perfil-consultor", codigo: CODIGOS_PERFIL_ACESSO.CONSULTOR, nome: "Consultor" },
  permissoes: [
    CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR,
    CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_CRIAR,
    CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_ALTERAR,
    CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_EXCLUIR,
  ].map((codigo) => ({ id: codigo, codigo, nome: codigo, descricao: null, criadoEm: "2026-08-07T00:00:00.000Z" })),
};
const dependenciasConsultor = { ...dependencias, obterContextoPersistido: async () => contextoConsultor };

test("usuário autenticado obtém vínculo, perfil e permissões", async () => { const atual = await obterContextoAcessoAtual(dependencias); assert.equal(atual?.vinculo.id, "v"); assert.equal(atual?.perfil.codigo, "administrador"); assert.deepEqual(atual?.permissoes.map(({ codigo }) => codigo), ["auditoria.visualizar"]); });
test("usuário não autenticado não possui contexto", async () => assert.equal(await obterContextoAcessoAtual({ ...dependencias, obterUsuario: async () => null }), null));
test("vínculo ausente não concede contexto", async () => assert.equal(await obterContextoAcessoAtual({ ...dependencias, obterContextoPersistido: async () => null }), null));
test("vínculo de outro usuário é rejeitado", async () => assert.equal(await obterContextoAcessoAtual({ ...dependencias, obterContextoPersistido: async () => ({ ...contexto, vinculo: { ...contexto.vinculo, usuarioId: "outro" } }) }), null));
test("permissão existente é autorizada", async () => assert.equal(await usuarioAtualPossuiPermissao(CODIGOS_PERMISSAO_ACESSO.AUDITORIA_VISUALIZAR, dependencias), true));
test("exigirPermissao devolve contexto autorizado", async () => assert.equal((await exigirPermissao(CODIGOS_PERMISSAO_ACESSO.AUDITORIA_VISUALIZAR, dependencias)).perfil.codigo, "administrador"));
test("exigirPermissao nega permissão ausente com mensagem controlada", async () => await assert.rejects(exigirPermissao(CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_EXCLUIR, dependencias), new Error("Acesso não autorizado.")));
test("erro técnico é convertido", async () => await assert.rejects(obterContextoAcessoAtual({ ...dependencias, obterContextoPersistido: async () => { throw new Error("técnico"); } }), new Error("Não foi possível verificar o acesso.")));
test("consultor não possui auditoria.visualizar", async () => assert.equal(await usuarioAtualPossuiPermissao(CODIGOS_PERMISSAO_ACESSO.AUDITORIA_VISUALIZAR, dependenciasConsultor), false));
test("exigirPermissao nega auditoria ao consultor", async () => await assert.rejects(exigirPermissao(CODIGOS_PERMISSAO_ACESSO.AUDITORIA_VISUALIZAR, dependenciasConsultor), new Error("Acesso não autorizado.")));
test("consultor mantém exatamente as quatro permissões de oportunidades", async () => {
  const atual = await obterContextoAcessoAtual(dependenciasConsultor);
  assert.deepEqual(atual?.permissoes.map(({ codigo }) => codigo), [
    CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR,
    CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_CRIAR,
    CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_ALTERAR,
    CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_EXCLUIR,
  ]);
});
