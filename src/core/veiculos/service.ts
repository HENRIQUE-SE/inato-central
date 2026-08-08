import type { ListagemVeiculos, Veiculo } from "./types";

export function criarListagemVeiculos(
  veiculos: readonly Veiculo[]
): ListagemVeiculos {
  const dados = veiculos.map((veiculo) => Object.freeze({ ...veiculo }));
  return Object.freeze({ dados: Object.freeze(dados), total: dados.length });
}
