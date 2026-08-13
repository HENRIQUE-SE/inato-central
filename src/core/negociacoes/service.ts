import { ORIGENS_NEGOCIACAO, STATUS_NEGOCIACAO, type StatusNegociacao } from "./constants";
import type { CampoAtualizavelNegociacao, DadosAtualizacaoNegociacao, DadosCriacaoNegociacao, Negociacao, ResultadoValidacaoNegociacao, ResultadoValidacaoTransicaoNegociacao } from "./types";

const CAMPOS: readonly CampoAtualizavelNegociacao[] = ["interessadoNome", "interessadoTelefone", "origem", "observacoes"];
function invalido(campo: string, mensagem: string): ResultadoValidacaoNegociacao { return { valido: false, campo, mensagem }; }
function validarEditaveis(dados: DadosAtualizacaoNegociacao): ResultadoValidacaoNegociacao {
  if (!dados.interessadoNome.trim()) return invalido("interessadoNome", "Informe o interessado.");
  if (!dados.interessadoTelefone.trim()) return invalido("interessadoTelefone", "Informe o telefone.");
  if (!Object.values(ORIGENS_NEGOCIACAO).includes(dados.origem)) return invalido("origem", "Informe uma origem válida.");
  return { valido: true };
}
export function validarDadosCriacaoNegociacao(dados: DadosCriacaoNegociacao): ResultadoValidacaoNegociacao {
  if (!dados.veiculoId.trim()) return invalido("veiculoId", "Selecione o veículo.");
  return validarEditaveis(dados);
}
export function validarDadosAtualizacaoNegociacao(dados: DadosAtualizacaoNegociacao): ResultadoValidacaoNegociacao { return validarEditaveis(dados); }
export function detectarCamposAlteradosNegociacao(anterior: Negociacao, dados: DadosAtualizacaoNegociacao): readonly CampoAtualizavelNegociacao[] { return CAMPOS.filter((campo) => anterior[campo] !== dados[campo]); }
export function validarTransicaoStatusNegociacao(atual: StatusNegociacao, novo: StatusNegociacao): ResultadoValidacaoTransicaoNegociacao {
  if (atual === STATUS_NEGOCIACAO.EM_ANDAMENTO && [STATUS_NEGOCIACAO.CONVERTIDA, STATUS_NEGOCIACAO.PERDIDA, STATUS_NEGOCIACAO.CANCELADA].includes(novo as "convertida" | "perdida" | "cancelada")) return { valido: true };
  return { valido: false, mensagem: "A negociação não pode ser encerrada nesse estado." };
}
