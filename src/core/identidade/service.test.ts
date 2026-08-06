import assert from "node:assert/strict";
import { test } from "node:test";
import { obterContextoOrganizacional } from "../organizacao";
import {
  CODIGOS_PERFIL_IDENTIDADE,
  ESTADOS_SESSAO_IDENTIDADE,
  obterContextoIdentidadeAtual,
  obterPerfilAtual,
  obterSessaoAtual,
  obterUsuarioAtual,
} from "./index";

const UUID_VALIDO =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function possuiFormatoIsoValido(valor: string): boolean {
  const data = new Date(valor);
  return !Number.isNaN(data.getTime()) && data.toISOString() === valor;
}

test("obtém o usuário atual", () => {
  assert.equal(obterUsuarioAtual().nome, "Charles Henrique");
});

test("obtém o perfil atual", () => {
  assert.equal(obterPerfilAtual().nome, "Administrador");
});

test("obtém a sessão atual", () => {
  assert.equal(obterSessaoAtual().encerradaEm, null);
});

test("obtém o contexto completo", () => {
  const contexto = obterContextoIdentidadeAtual();
  assert.equal(contexto.usuario.id, contexto.sessao.usuarioId);
  assert.equal(contexto.perfil.id, contexto.sessao.perfilId);
});

test("o usuário possui UUID válido", () => {
  assert.match(obterUsuarioAtual().id, UUID_VALIDO);
});

test("o perfil possui UUID válido", () => {
  assert.match(obterPerfilAtual().id, UUID_VALIDO);
});

test("a sessão possui UUID válido", () => {
  assert.match(obterSessaoAtual().id, UUID_VALIDO);
});

test("as datas possuem formato ISO válido", () => {
  const usuario = obterUsuarioAtual();
  const perfil = obterPerfilAtual();
  const sessao = obterSessaoAtual();
  const datas = [
    usuario.criadoEm,
    usuario.atualizadoEm,
    perfil.criadoEm,
    perfil.atualizadoEm,
    sessao.iniciadaEm,
  ];

  assert.equal(datas.every(possuiFormatoIsoValido), true);
});

test("o perfil atual é administrador", () => {
  assert.equal(
    obterPerfilAtual().codigo,
    CODIGOS_PERFIL_IDENTIDADE.ADMINISTRADOR
  );
});

test("a sessão está ativa", () => {
  assert.equal(obterSessaoAtual().estado, ESTADOS_SESSAO_IDENTIDADE.ATIVA);
});

test("a sessão referencia o usuário atual", () => {
  assert.equal(obterSessaoAtual().usuarioId, obterUsuarioAtual().id);
});

test("a sessão referencia o perfil atual", () => {
  assert.equal(obterSessaoAtual().perfilId, obterPerfilAtual().id);
});

test("a sessão utiliza a empresa do contexto organizacional", () => {
  assert.equal(
    obterSessaoAtual().empresaId,
    obterContextoOrganizacional().empresaId
  );
});

test("a sessão utiliza a unidade do contexto organizacional", () => {
  assert.equal(
    obterSessaoAtual().unidadeId,
    obterContextoOrganizacional().unidadeId
  );
});

test("alterar o usuário devolvido não modifica o estado interno", () => {
  const usuario = obterUsuarioAtual() as { nome: string };
  usuario.nome = "Alterado";
  assert.equal(obterUsuarioAtual().nome, "Charles Henrique");
});

test("alterar o perfil devolvido não modifica o estado interno", () => {
  const perfil = obterPerfilAtual() as { nome: string };
  perfil.nome = "Alterado";
  assert.equal(obterPerfilAtual().nome, "Administrador");
});

test("alterar a sessão devolvida não modifica o estado interno", () => {
  const sessao = obterSessaoAtual() as { usuarioId: string };
  sessao.usuarioId = "alterado";
  assert.equal(obterSessaoAtual().usuarioId, obterUsuarioAtual().id);
});

test("alterar o contexto completo não modifica o estado interno", () => {
  const contexto = obterContextoIdentidadeAtual() as {
    usuario: { nome: string };
    organizacao: { empresaId: string };
  };
  contexto.usuario.nome = "Alterado";
  contexto.organizacao.empresaId = "alterado";

  const contextoAtual = obterContextoIdentidadeAtual();
  assert.equal(contextoAtual.usuario.nome, "Charles Henrique");
  assert.equal(
    contextoAtual.organizacao.empresaId,
    obterContextoOrganizacional().empresaId
  );
});

test("chamadas diferentes devolvem objetos diferentes", () => {
  const primeiro = obterContextoIdentidadeAtual();
  const segundo = obterContextoIdentidadeAtual();

  assert.notStrictEqual(primeiro, segundo);
  assert.notStrictEqual(primeiro.usuario, segundo.usuario);
  assert.notStrictEqual(primeiro.perfil, segundo.perfil);
  assert.notStrictEqual(primeiro.sessao, segundo.sessao);
  assert.notStrictEqual(primeiro.organizacao, segundo.organizacao);
});
