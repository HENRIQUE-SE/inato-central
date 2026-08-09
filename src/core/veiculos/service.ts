import type {
  DadosCriacaoVeiculo,
  ListagemVeiculos,
  ResultadoValidacaoVeiculo,
  Veiculo,
} from "./types";

export function criarListagemVeiculos(
  veiculos: readonly Veiculo[]
): ListagemVeiculos {
  const dados = veiculos.map((veiculo) => Object.freeze({ ...veiculo }));
  return Object.freeze({ dados: Object.freeze(dados), total: dados.length });
}

function invalido(campo: string, mensagem: string): ResultadoValidacaoVeiculo {
  return { valido: false, campo, mensagem };
}

export function validarDadosCriacaoVeiculo(
  dados: DadosCriacaoVeiculo
): ResultadoValidacaoVeiculo {
  if (!dados.oportunidadeId.trim()) return invalido("oportunidadeId", "Selecione a oportunidade de origem.");
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
