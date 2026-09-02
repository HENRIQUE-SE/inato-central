export type Oportunidade = {
  id: string;
  empresa_id: string;
  unidade_id: string;
  proprietario_nome: string;
  telefone: string;
  cidade: string;
  veiculo_informado: string;
  placa: string;
  origem: string;
  status: string;
  created_at: string;
};

export type DadosOportunidade = Omit<
  Oportunidade,
  "id" | "empresa_id" | "unidade_id" | "created_at"
>;
