export { STATUS_VEICULO } from "./constants";
export type { StatusVeiculo } from "./constants";
export {
  criarListagemVeiculos,
  detectarCamposAlteradosVeiculo,
  validarDadosAtualizacaoVeiculo,
  validarDadosCriacaoVeiculo,
} from "./service";
export type {
  CampoAtualizavelVeiculo,
  DadosAtualizacaoVeiculo,
  DadosCriacaoVeiculo,
  ListagemVeiculos,
  ResultadoValidacaoVeiculo,
  Veiculo,
} from "./types";
