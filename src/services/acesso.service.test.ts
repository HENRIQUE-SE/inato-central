import assert from "node:assert/strict";
import { test } from "node:test";
import { CODIGOS_PERFIL_ACESSO, CODIGOS_PERMISSAO_ACESSO, type ContextoAcesso } from "@/core/acesso";
import { contextoOperacionalSolicitadoEhPermitido, exigirPermissao, obterContextoAcessoAtual, obterContextoAcessoAutenticadoAtual, obterContextoOperacionalAtivoAtual, obterUnidadesOperacionaisPermitidasAtuais, usuarioAtualPossuiPermissao } from "./acesso.service";

const contexto: ContextoAcesso = {
  vinculo: { id: "v", usuarioId: "usuario-1", redeId: "rede", operacaoId: "operacao", areaOperacionalId: "area", empresaId: "empresa", unidadeId: "unidade", escopoTipo: "unidade", perfilId: "perfil", ativo: true, criadoEm: "2026-08-07T00:00:00.000Z" },
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
    CODIGOS_PERMISSAO_ACESSO.VEICULOS_PREPARACAO_CONCLUIR,
    CODIGOS_PERMISSAO_ACESSO.VEICULOS_PUBLICACAO_CONCLUIR,
  ].map((codigo) => ({ id: codigo, codigo, nome: codigo, descricao: null, criadoEm: "2026-08-07T00:00:00.000Z" })),
};
const dependenciasConsultor = { ...dependencias, obterContextoPersistido: async () => contextoConsultor };

test("usuário autenticado obtém vínculo, perfil e permissões", async () => { const atual = await obterContextoAcessoAtual(dependencias); assert.equal(atual?.vinculo.id, "v"); assert.equal(atual?.perfil.codigo, "administrador"); assert.deepEqual(atual?.permissoes.map(({ codigo }) => codigo), ["auditoria.visualizar"]); });
test("usuário atual de escopo unidade obtém contexto operacional compatível", async () => {
  assert.deepEqual(await obterContextoOperacionalAtivoAtual(dependencias), {
    redeId: "rede",
    operacaoId: "operacao",
    areaOperacionalId: "area",
    empresaId: "empresa",
    unidadeId: "unidade",
  });
});
const unidadePermitida = {
  redeId: "rede", operacaoId: "operacao", areaOperacionalId: "area", empresaId: "empresa", unidadeId: "unidade",
  codigo: "loja", numero: 1, nome: "Unidade", nomeExibicao: "Unidade", cidade: "Cidade", uf: "MG",
};
test("autoridade autenticada lista Unidades permitidas sem selecionar contexto", async () => {
  assert.deepEqual(await obterUnidadesOperacionaisPermitidasAtuais(dependencias, async (vinculo) => {
    assert.equal(vinculo, contexto.vinculo);
    return [unidadePermitida];
  }), [unidadePermitida]);
});
test("contexto coerente com Unidade persistida é permitido", async () => {
  assert.equal(await contextoOperacionalSolicitadoEhPermitido({ redeId: "rede", operacaoId: "operacao", areaOperacionalId: "area", empresaId: "empresa", unidadeId: "unidade" }, dependencias, async () => [unidadePermitida]), true);
});
test("contexto forjado é rejeitado mesmo com unidadeId correto", async () => {
  for (const campo of ["redeId", "operacaoId", "areaOperacionalId", "empresaId"] as const) {
    const solicitado = { redeId: "rede", operacaoId: "operacao", areaOperacionalId: "area", empresaId: "empresa", unidadeId: "unidade", [campo]: "forjado" };
    assert.equal(await contextoOperacionalSolicitadoEhPermitido(solicitado, dependencias, async () => [unidadePermitida]), false);
  }
});
test("escopo superior lista opções sem criar contexto ativo automaticamente", async () => {
  const superior = { ...contexto, vinculo: { ...contexto.vinculo, escopoTipo: "rede" as const, operacaoId: null, areaOperacionalId: null, empresaId: null, unidadeId: null } };
  const depsSuperior = { ...dependencias, obterContextoPersistido: async () => superior };
  assert.equal(await obterContextoOperacionalAtivoAtual(depsSuperior), null);
  assert.deepEqual(await obterUnidadesOperacionaisPermitidasAtuais(depsSuperior, async () => [unidadePermitida]), [unidadePermitida]);
});
test("usuário e contexto são resolvidos juntos com uma única autenticação", async () => {
  let autenticacoes = 0;
  const atual = await obterContextoAcessoAutenticadoAtual({
    ...dependencias,
    obterUsuario: async () => { autenticacoes += 1; return { id: "usuario-1", email: "admin@inato.com" }; },
  });
  assert.equal(autenticacoes, 1);
  assert.equal(atual?.usuario.id, atual?.contexto.vinculo.usuarioId);
});
test("usuário não autenticado não possui contexto", async () => assert.equal(await obterContextoAcessoAtual({ ...dependencias, obterUsuario: async () => null }), null));
test("vínculo ausente não concede contexto", async () => assert.equal(await obterContextoAcessoAtual({ ...dependencias, obterContextoPersistido: async () => null }), null));
test("vínculo de outro usuário é rejeitado", async () => assert.equal(await obterContextoAcessoAtual({ ...dependencias, obterContextoPersistido: async () => ({ ...contexto, vinculo: { ...contexto.vinculo, usuarioId: "outro" } }) }), null));
test("permissão existente é autorizada", async () => assert.equal(await usuarioAtualPossuiPermissao(CODIGOS_PERMISSAO_ACESSO.AUDITORIA_VISUALIZAR, dependencias), true));
test("exigirPermissao devolve contexto autorizado", async () => assert.equal((await exigirPermissao(CODIGOS_PERMISSAO_ACESSO.AUDITORIA_VISUALIZAR, dependencias)).perfil.codigo, "administrador"));
test("exigirPermissao nega permissão ausente com mensagem controlada", async () => await assert.rejects(exigirPermissao(CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_EXCLUIR, dependencias), new Error("Acesso não autorizado.")));
test("erro técnico é convertido", async () => await assert.rejects(obterContextoAcessoAtual({ ...dependencias, obterContextoPersistido: async () => { throw new Error("técnico"); } }), new Error("Não foi possível verificar o acesso.")));
test("verificações simultâneas reutilizam a mesma resolução de contexto", async () => {
  let usuarios = 0;
  let contextos = 0;
  const compartilhadas = {
    obterUsuario: async () => { usuarios += 1; return { id: "usuario-1", email: "admin@inato.com" }; },
    obterContextoPersistido: async () => { contextos += 1; return contexto; },
  };
  const resultados = await Promise.all([
    usuarioAtualPossuiPermissao(CODIGOS_PERMISSAO_ACESSO.AUDITORIA_VISUALIZAR, compartilhadas),
    exigirPermissao(CODIGOS_PERMISSAO_ACESSO.AUDITORIA_VISUALIZAR, compartilhadas),
    obterContextoAcessoAtual(compartilhadas),
  ]);
  assert.equal(resultados[0], true);
  assert.equal(usuarios, 1);
  assert.equal(contextos, 1);
});
test("consultor não possui auditoria.visualizar", async () => assert.equal(await usuarioAtualPossuiPermissao(CODIGOS_PERMISSAO_ACESSO.AUDITORIA_VISUALIZAR, dependenciasConsultor), false));
test("exigirPermissao nega auditoria ao consultor", async () => await assert.rejects(exigirPermissao(CODIGOS_PERMISSAO_ACESSO.AUDITORIA_VISUALIZAR, dependenciasConsultor), new Error("Acesso não autorizado.")));
test("consultor mantém oportunidades e as permissões operacionais independentes de veículos", async () => {
  const atual = await obterContextoAcessoAtual(dependenciasConsultor);
  assert.deepEqual(atual?.permissoes.map(({ codigo }) => codigo), [
    CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_VISUALIZAR,
    CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_CRIAR,
    CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_ALTERAR,
    CODIGOS_PERMISSAO_ACESSO.OPORTUNIDADES_EXCLUIR,
    CODIGOS_PERMISSAO_ACESSO.VEICULOS_PREPARACAO_CONCLUIR,
    CODIGOS_PERMISSAO_ACESSO.VEICULOS_PUBLICACAO_CONCLUIR,
  ]);
});
