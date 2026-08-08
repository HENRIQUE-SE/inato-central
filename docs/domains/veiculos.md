# Domínio de Veículos

## Finalidade

Veículo representa o cadastro automotivo oficial da Plataforma INATO. É a entidade-base que será referenciada futuramente por Estoque, Anúncios, Fotos, Histórico Comprovado, Vistorias, Documentos, Negociações, Vendas, Marketplace e Franquias.

## Entidade definitiva

O modelo público possui: `id`, `empresaId`, `unidadeId`, `oportunidadeId`, `proprietarioNome`, `placa`, `renavam`, `chassi`, `marca`, `modelo`, `versao`, `anoFabricacao`, `anoModelo`, `cor`, `quilometragem`, `codigoFipe`, `status`, `criadoEm`, `atualizadoEm` e `arquivadoEm`.

Os identificadores do domínio são strings preparadas para UUID. O identificador próprio do veículo e `public.oportunidades.id` são UUID no banco. `oportunidade_id` é obrigatório e possui a chave estrangeira `veiculos_oportunidade_fk`, com exclusão da Oportunidade restringida enquanto houver Veículo relacionado.

## Origem comercial e proprietário

Todo Veículo possui obrigatoriamente `oportunidadeId`, que registra por chave estrangeira a Oportunidade que originou sua entrada, sem copiar a entidade Oportunidade. O tipo persistido da relação foi confirmado como UUID. `proprietarioNome` registra obrigatoriamente o nome operacional do proprietário nesse momento. CPF, RG, endereço, documentos pessoais e dados bancários não integram o Veículo.

## Empresa e unidade

Todo Veículo pertence obrigatoriamente a uma empresa e a uma unidade operacional por meio de seus identificadores. Dados de Empresa ou Unidade não são duplicados. Não há chaves estrangeiras artificiais enquanto não existirem tabelas persistentes oficiais correspondentes.

## Status operacional

Os status oficiais são `em_preparacao`, `disponivel`, `reservado`, `vendido` e `cancelado`. O status inicial persistido é `em_preparacao`; disponibilidade depende de fluxo futuro.

## Status e arquivamento

Status representa o ciclo comercial. Arquivamento lógico é independente e possui `arquivadoEm` como única fonte da verdade: `null` significa não arquivado e uma data significa arquivado. Não existem estado `arquivado` nem booleano `ativo`. A listagem padrão retorna somente `arquivado_em is null`.

## Identificação automotiva

Placa é obrigatória e não vazia, sem regex nacional rígida. Renavam, chassi e versão são opcionais. Para registros não arquivados, placa, Renavam informado e chassi informado são únicos por empresa. Não são impostas regras brasileiras de comprimento.

## Anos e quilometragem

Os anos de fabricação e modelo ficam entre 1886 e 2100. O ano do modelo deve ser igual ao ano de fabricação ou um ano posterior. Quilometragem é obrigatória, inteira, não negativa e não recebe valor padrão.

## FIPE

Somente `codigoFipe` opcional integra a identidade do Veículo. Preço FIPE, mês de referência, avaliação e valor de venda não pertencem a esta fundação.

## Contrato de criação

`DadosCriacaoVeiculo` é a entrada oficial da futura funcionalidade de cadastro. Contém exatamente os dados que precisam ser informados e omite identificador, status inicial, datas de criação e atualização e arquivamento. A Sprint 13 apenas estabelece o contrato; não implementa o cadastro da Sprint 14.

## Índices

- placa não arquivada única por empresa;
- Renavam informado e não arquivado único por empresa;
- chassi informado e não arquivado único por empresa;
- listagem por empresa, unidade e criação decrescente dos não arquivados;
- localização pelo identificador de Oportunidade.

## RLS

A tabela possui RLS habilitada e apenas política de leitura para `authenticated`. A leitura exige vínculo organizacional ativo, empresa correspondente e, quando o vínculo possui unidade, a mesma unidade. Vínculo empresarial sem unidade pode visualizar unidades da empresa. Não existem políticas de escrita ou para `anon` nesta Sprint.

## Dependências

O Core de Veículos é puro e não depende de React, Supabase, componentes, repositório nem implementação de Oportunidades. A interface chama o serviço público; o serviço coordena a listagem; somente o repositório acessa o Supabase e mapeia persistência para o contrato público.

## Invariantes

- Veículo possui empresa, unidade, Oportunidade de origem e proprietário.
- Placa não pode ser vazia.
- Quilometragem não pode ser negativa e deve ser informada.
- Anos respeitam os limites e a diferença máxima aprovada.
- Status pertence ao conjunto oficial.
- Arquivamento não é status comercial.
- A listagem não expõe referências mutáveis mantidas pelo chamador.
- O domínio não armazena coleções pertencentes a outros domínios.

## Funcionalidades futuras

Cadastro, alteração, arquivamento, auditoria específica e integração operacional com Oportunidades ficam para Sprints autorizadas. Fotos, Histórico, Vistoria, Contrato e Venda não ficam dentro de Veículo; possuirão estruturas próprias relacionadas futuramente por `veiculoId`.
