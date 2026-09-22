import assert from "node:assert/strict";
import { test } from "node:test";
import { CODIGOS_PERFIL_ACESSO, CODIGOS_PERMISSAO_ACESSO, type ContextoAcesso } from "@/core/acesso";
import { contextoOperacionalSolicitadoEhPermitido, exigirPermissao, obterContextoAcessoAtual, obterContextoAcessoAutenticadoAtual, obterContextoOperacionalAtivoAtual, obterUnidadesOperacionaisPermitidasAtuais, resolverContextoOperacionalAtivoAtual, usuarioAtualPossuiPermissao } from "./acesso.service";
import type { SelecaoContextoOperacional } from "@/core/organizacao";

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
function dependenciasDeEscopo(escopoTipo: "rede" | "operacao" | "area_operacional") {
  const vinculo = {
    ...contexto.vinculo,
    redeId: "rede-real",
    escopoTipo,
    operacaoId: escopoTipo === "rede" ? null : "operacao-real",
    areaOperacionalId: escopoTipo === "area_operacional" ? "area-real" : null,
    empresaId: null,
    unidadeId: null,
  };
  return { ...dependencias, obterContextoPersistido: async () => ({ ...contexto, vinculo }) };
}
const unidadeReal = {
  redeId: "rede-real", operacaoId: "operacao-real", areaOperacionalId: "area-real", empresaId: "empresa-real", unidadeId: "unidade-1",
  codigo: "unidade-1", numero: 1, nome: "Unidade real", nomeExibicao: "Unidade real", cidade: "Cidade", uf: "MG",
};
test("escopo Unidade válido resolve automaticamente sem consultar seleção", async () => {
  let consultas = 0;
  assert.deepEqual(await resolverContextoOperacionalAtivoAtual(undefined, dependencias, async () => { consultas += 1; return null; }), {
    redeId: "rede", operacaoId: "operacao", areaOperacionalId: "area", empresaId: "empresa", unidadeId: "unidade",
  });
  assert.equal(consultas, 0);
});
test("escopo Unidade não pode trocar de Unidade por seleção externa", async () => {
  await assert.rejects(resolverContextoOperacionalAtivoAtual({ unidadeId: "outra" }, dependencias, async () => unidadeReal), new Error("Seleção de contexto não autorizada."));
});
for (const escopo of ["area_operacional", "operacao", "rede"] as const) {
  test(`escopo ${escopo} sem seleção não produz contexto nem escolhe lista ordenada`, async () => {
    let consultas = 0;
    assert.equal(await resolverContextoOperacionalAtivoAtual(undefined, dependenciasDeEscopo(escopo), async () => { consultas += 1; return unidadeReal; }), null);
    assert.equal(consultas, 0);
  });
  test(`escopo ${escopo} com Unidade autorizada produz contexto persistido`, async () => {
    assert.deepEqual(await resolverContextoOperacionalAtivoAtual({ unidadeId: "unidade-1" }, dependenciasDeEscopo(escopo), async (vinculo, unidadeId) => {
      assert.equal(vinculo.escopoTipo, escopo);
      assert.equal(unidadeId, "unidade-1");
      return unidadeReal;
    }), {
      redeId: "rede-real", operacaoId: "operacao-real", areaOperacionalId: "area-real", empresaId: "empresa-real", unidadeId: "unidade-1",
    });
  });
  test(`escopo ${escopo} não revela Unidade ausente ou fora da autoridade`, async () => {
    await assert.rejects(resolverContextoOperacionalAtivoAtual({ unidadeId: "fora" }, dependenciasDeEscopo(escopo), async () => null), new Error("Seleção de contexto não autorizada."));
  });
}
test("somente unidadeId é consumido e ancestrais externos não substituem dados persistidos", async () => {
  const entradaHostil = { unidadeId: "unidade-1", redeId: "rede-forjada", operacaoId: "operacao-forjada", areaOperacionalId: "area-forjada", empresaId: "empresa-forjada" } as SelecaoContextoOperacional;
  assert.deepEqual(await resolverContextoOperacionalAtivoAtual(entradaHostil, dependenciasDeEscopo("rede"), async () => unidadeReal), {
    redeId: "rede-real", operacaoId: "operacao-real", areaOperacionalId: "area-real", empresaId: "empresa-real", unidadeId: "unidade-1",
  });
});
test("seleção vazia falha sem consultar território", async () => {
  let consultas = 0;
  await assert.rejects(resolverContextoOperacionalAtivoAtual({ unidadeId: "   " }, dependenciasDeEscopo("rede"), async () => { consultas += 1; return null; }), new Error("Seleção de contexto não autorizada."));
  assert.equal(consultas, 0);
});
test("erro de infraestrutura territorial não é convertido em seleção inválida", async () => {
  const erro = new Error("infraestrutura");
  await assert.rejects(resolverContextoOperacionalAtivoAtual({ unidadeId: "unidade-1" }, dependenciasDeEscopo("rede"), async () => { throw erro; }), erro);
});
test("resolução específica independe de listagem, ordenação e paginação do catálogo", async () => {
  let consultas = 0;
  const resultado = await resolverContextoOperacionalAtivoAtual({ unidadeId: "unidade-1" }, dependenciasDeEscopo("rede"), async (vinculo, unidadeId) => {
    consultas += 1;
    assert.equal(vinculo.redeId, "rede-real");
    assert.equal(unidadeId, "unidade-1");
    return unidadeReal;
  });
  assert.equal(consultas, 1);
  assert.deepEqual(resultado, {
    redeId: "rede-real", operacaoId: "operacao-real", areaOperacionalId: "area-real", empresaId: "empresa-real", unidadeId: "unidade-1",
  });
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
