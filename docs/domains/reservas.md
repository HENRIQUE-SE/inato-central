# Domínio de Reservas

## Finalidade e modelo

Reserva representa o comprometimento temporário de um Veículo com uma Negociação específica. É entidade persistente e histórica, vinculada obrigatoriamente a empresa, unidade, Negociação e Veículo. Possui estados fechados `ativa`, `expirada` e `cancelada`, apresentados como Ativa, Expirada e Cancelada.

## Duração e expiração

Toda Reserva dura exatamente 24 horas. `reservado_em` e `expira_em` são calculados pelo PostgreSQL na mesma operação, sem confiar no relógio do navegador. A interface apresenta a data e hora exatas em “Reservado até”. Não há cronômetro regressivo.

Não existe scheduler comprovado no projeto. Por isso, a estratégia atual é persistente e idempotente: antes de consultar ou operar Reservas, a RPC `expirar_reservas_vencidas` bloqueia as Reservas Ativas vencidas, muda-as para Expirada e devolve seus Veículos de Reservado para Disponível. A limitação é que a materialização da expiração ocorre na próxima consulta ou operação autorizada após o vencimento, e não necessariamente no segundo exato sem atividade na plataforma.

## Criação, cancelamento e concorrência

`criar_reserva` recebe somente a Negociação. O banco deriva Veículo, empresa, unidade e usuário autenticado; bloqueia Negociação e Veículo; valida contexto, permissão, Negociação Em andamento, Veículo Disponível e não arquivado; cria a Reserva e muda o Veículo para Reservado atomicamente. Um índice parcial exclusivo impede duas Reservas Ativas para o mesmo Veículo mesmo sob concorrência.

`cancelar_reserva` recebe a Reserva, um motivo operacional obrigatório e detalhes quando o motivo for `outro`. Aceita exclusivamente Reserva Ativa e muda atomicamente a Reserva para Cancelada e o Veículo para Disponível. Reservas canceladas antes da obrigatoriedade do motivo são identificadas tecnicamente como `anterior_a_regra`, sem atribuição falsa de motivo operacional; esse valor histórico não pode ser enviado pela interface ou pela RPC. Reservas não são apagadas, reabertas, prorrogadas nem têm Negociação, Veículo, duração ou expiração substituídos.

## Permissões, RLS e auditoria

Administrador e Consultor possuem `reservas.visualizar`, `reservas.criar` e `reservas.cancelar`. Teste possui apenas visualização. Financeiro não possui acesso nesta Sprint. RLS permite somente leitura contextual a `authenticated`; criação, cancelamento e expiração ocorrem por RPCs específicas, sem acesso `anon` e sem `DELETE`.

Criação e cancelamento são auditados pela aplicação somente após persistência bem-sucedida, com Reserva, placa, Negociação, estados, expiração, perfil e identidade autenticada. A expiração é persistida pelo banco com origem `sistema`, autoria `sistema` e motivo `expiracao_24_horas`. Como `auditoria_eventos.usuario_id` é obrigatório, o UUID do usuário que disparou tecnicamente a materialização permanece apenas para rastreabilidade; a interface apresenta o autor como “Sistema” e a ação como “Expirou”, sem atribuir a decisão ao usuário. Renavam, chassi, telefone, observações privadas, credenciais e payload bruto não integram os detalhes.

## Financeiro futuro

A Reserva Oficial futura exigirá sinal de R$ 1.000,00 efetivamente confirmado em conta. Pagamento, sinal, confirmação financeira, conta bancária e lançamento financeiro não foram implementados na Sprint 19. A Reserva permanece entidade própria para receber essa integração futura sem ser reduzida a status do Veículo.
