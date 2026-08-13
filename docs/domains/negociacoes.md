# Domínio de Negociações

## Finalidade

Negociação é a tratativa comercial entre a INATO e um potencial comprador interessado em um Veículo disponível. É entidade própria do domínio Comercial e não é status de Veículo.

## Modelo

Possui somente `id`, `empresaId`, `unidadeId`, `veiculoId`, `interessadoNome`, `interessadoTelefone`, `origem`, `observacoes`, `status`, `criadoPorUsuarioId`, `criadoEm`, `atualizadoEm` e `encerradoEm`. Telefone é texto obrigatório; observações são opcionais. Não há Cliente, documentos pessoais, endereço ou dados financeiros nesta fase.

## Status e encerramento

Os estados são `em_andamento`, `convertida`, `perdida` e `cancelada`. Somente são permitidas as transições de `em_andamento` para cada estado final. Ao encerrar, `encerrado_em` e `atualizado_em` recebem a data atual. Não existe reabertura nem troca entre estados finais.

## Origens

As origens fechadas são `whatsapp`, `telefone`, `instagram`, `facebook`, `site`, `indicacao`, `presencial` e `outro`.

## Relação com Veículos

Somente Veículo `disponivel` e não arquivado pode originar Negociação. A criação não altera o Veículo. Múltiplas Negociações, inclusive simultâneas, podem referenciar o mesmo Veículo; Reserva futura será responsável por eventual bloqueio comercial.

## Autorização e contexto

Empresa e unidade vêm exclusivamente do vínculo ativo, com unidade definida. O criador vem do Supabase Auth. Administrador e Consultor visualizam, criam, alteram e encerram. Teste somente visualiza. Financeiro não possui acesso nesta fase.

## Persistência, RLS e RPCs

A tabela possui índices de contexto, veículo e status, sem unicidade por Veículo. RLS separa `SELECT`, `INSERT` e `UPDATE`; não existe `DELETE`. Atualização comum recebe privilégio somente para interessado, telefone, origem, observações e data de atualização. Status e encerramento são exclusivos das RPCs `marcar_negociacao_convertida`, `marcar_negociacao_perdida` e `cancelar_negociacao`, todas com somente ID, `SECURITY DEFINER`, `search_path` controlado, autorização organizacional repetida e bloqueio `FOR UPDATE`.

## Auditoria

Criação, alteração e encerramento são auditados depois da persistência. Os detalhes contêm Veículo, placa, interessado, status, perfil e e-mail autenticado; alteração inclui apenas nomes dos campos modificados. Telefone, observações, contexto organizacional, credenciais e payload bruto não são registrados.

## Interface

`/negociacoes` oferece pesquisa, filtro de status, paginação de dez itens, criação e estado vazio. `/negociacoes/[id]` permite consulta, edição da negociação em andamento e encerramentos explícitos conforme permissão.

## Limitações

Não há Reserva, Venda, Cliente, pagamento, financiamento, sinal, contrato, reabertura ou alteração do status do Veículo nesta Sprint.

## Diretriz visual para evolução futura

Textos apresentados ao usuário devem utilizar nomenclatura humanizada e capitalização adequada em português para nomes de módulos, perfis, status, ações, recursos, botões, títulos e opções de filtros. Identificadores técnicos internos não devem ser alterados apenas por razões visuais.

Em evolução futura controlada, a Auditoria deverá priorizar o nome da pessoa responsável pela ação em vez do e-mail. O e-mail e os identificadores técnicos deverão continuar disponíveis internamente para rastreabilidade.
