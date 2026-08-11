import type { StatusVeiculo } from "./constants";

export type Veiculo = {
  id: string;
  empresaId: string;
  unidadeId: string;
  oportunidadeId: string;
  proprietarioNome: string;
  placa: string;
  renavam: string | null;
  chassi: string | null;
  marca: string;
  modelo: string;
  versao: string | null;
  anoFabricacao: number;
  anoModelo: number;
  cor: string;
  quilometragem: number;
  codigoFipe: string | null;
  status: StatusVeiculo;
  criadoEm: string;
  atualizadoEm: string;
  arquivadoEm: string | null;
};

export type DadosCriacaoVeiculo = Omit<
  Veiculo,
  "id" | "status" | "criadoEm" | "atualizadoEm" | "arquivadoEm"
>;

export type DadosAtualizacaoVeiculo = Pick<
  Veiculo,
  | "proprietarioNome"
  | "placa"
  | "marca"
  | "modelo"
  | "versao"
  | "anoFabricacao"
  | "anoModelo"
  | "cor"
  | "quilometragem"
  | "renavam"
  | "chassi"
  | "codigoFipe"
>;

export type CampoAtualizavelVeiculo = keyof DadosAtualizacaoVeiculo;

export type ListagemVeiculos = Readonly<{
  dados: readonly Veiculo[];
  total: number;
}>;

export type ResultadoValidacaoVeiculo =
  | { valido: true }
  | { valido: false; campo: string; mensagem: string };

export type ResultadoValidacaoTransicaoStatusVeiculo =
  | { valido: true }
  | { valido: false; mensagem: string };
