import type {
  CampoAtualizavelVeiculo,
  DadosAtualizacaoVeiculo,
  DadosCriacaoVeiculo,
  ListagemVeiculos,
  ResultadoValidacaoVeiculo,
  ResultadoValidacaoTransicaoStatusVeiculo,
  Veiculo,
} from "./types";
import { STATUS_VEICULO, type StatusVeiculo } from "./constants";

const CAMPOS_ATUALIZAVEIS: readonly CampoAtualizavelVeiculo[] = [
  "proprietarioNome",
  "placa",
  "marca",
  "modelo",
  "versao",
  "anoFabricacao",
  "anoModelo",
  "cor",
  "quilometragem",
  "renavam",
  "chassi",
  "codigoFipe",
];

export function criarListagemVeiculos(
  veiculos: readonly Veiculo[]
): ListagemVeiculos {
  const dados = veiculos.map((veiculo) => Object.freeze({ ...veiculo }));
  return Object.freeze({ dados: Object.freeze(dados), total: dados.length });
}

function invalido(campo: string, mensagem: string): ResultadoValidacaoVeiculo {
  return { valido: false, campo, mensagem };
}

function validarDadosEditaveis(
  dados: DadosAtualizacaoVeiculo
): ResultadoValidacaoVeiculo {
  if (!dados.proprietarioNome.trim()) return invalido("proprietarioNome", "Informe o proprietário.");
  if (!dados.placa.trim()) return invalido("placa", "Informe a placa.");
  if (!dados.marca.trim()) return invalido("marca", "Informe a marca.");
  if (!dados.modelo.trim()) return invalido("modelo", "Informe o modelo.");
  if (!dados.cor.trim()) return invalido("cor", "Informe a cor.");
  if (!Number.isInteger(dados.quilometragem) || dados.quilometragem < 0) {
    return invalido("quilometragem", "Informe uma quilometragem inteira e não negativa.");
  }
  if (!Number.isInteger(dados.anoFabricacao) || dados.anoFabricacao < 1886 || dados.anoFabricacao > 2100) {
    return invalido("anoFabricacao", "Informe um ano de fabricação entre 1886 e 2100.");
  }
  if (!Number.isInteger(dados.anoModelo) || dados.anoModelo < dados.anoFabricacao || dados.anoModelo > dados.anoFabricacao + 1 || dados.anoModelo > 2100) {
    return invalido("anoModelo", "O ano/modelo deve ser igual ou até um ano posterior ao de fabricação.");
  }
  return { valido: true };
}

export function validarDadosCriacaoVeiculo(
  dados: DadosCriacaoVeiculo
): ResultadoValidacaoVeiculo {
  if (!dados.oportunidadeId.trim()) return invalido("oportunidadeId", "Selecione a oportunidade de origem.");
  return validarDadosEditaveis(dados);
}

export function validarDadosAtualizacaoVeiculo(
  dados: DadosAtualizacaoVeiculo
): ResultadoValidacaoVeiculo {
  return validarDadosEditaveis(dados);
}

export function detectarCamposAlteradosVeiculo(
  veiculoAnterior: Veiculo,
  dadosAtualizados: DadosAtualizacaoVeiculo
): readonly CampoAtualizavelVeiculo[] {
  return CAMPOS_ATUALIZAVEIS.filter(
    (campo) => veiculoAnterior[campo] !== dadosAtualizados[campo]
  );
}

export function validarTransicaoStatusVeiculo(
  statusAtual: StatusVeiculo,
  statusNovo: StatusVeiculo
): ResultadoValidacaoTransicaoStatusVeiculo {
  if (
    (statusAtual === STATUS_VEICULO.EM_PREPARACAO &&
      statusNovo === STATUS_VEICULO.PRONTO_PARA_ANUNCIAR) ||
    (statusAtual === STATUS_VEICULO.PRONTO_PARA_ANUNCIAR &&
      statusNovo === STATUS_VEICULO.DISPONIVEL)
  ) {
    return { valido: true };
  }
  return {
    valido: false,
    mensagem: "Transição de status do veículo não permitida.",
  };
}
