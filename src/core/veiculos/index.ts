export { ROTULOS_STATUS_VEICULO, STATUS_VEICULO } from "./constants";
export type { StatusVeiculo } from "./constants";
export {
  criarListagemVeiculos,
  detectarCamposAlteradosVeiculo,
  validarDadosAtualizacaoVeiculo,
  validarDadosCriacaoVeiculo,
  validarTransicaoStatusVeiculo,
} from "./service";
export type {
  CampoAtualizavelVeiculo,
  DadosAtualizacaoVeiculo,
  DadosCriacaoVeiculo,
  ListagemVeiculos,
  ResultadoValidacaoVeiculo,
  ResultadoValidacaoTransicaoStatusVeiculo,
  Veiculo,
} from "./types";
