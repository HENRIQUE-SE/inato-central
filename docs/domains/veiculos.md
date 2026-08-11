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

Os status oficiais reconhecidos são `em_preparacao`, `pronto_para_anunciar`, `disponivel`, `reservado`, `vendido` e `cancelado`. O status inicial persistido é `em_preparacao`. A única transição implementada é `em_preparacao` para `pronto_para_anunciar`; os demais valores históricos continuam reconhecidos, mas não possuem novas transições nesta fase.

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

Alteração, exclusão, arquivamento, upload, mudança manual de status e integrações com Fotos, Histórico, Anúncios, Vistoria e Venda ficam para Sprints autorizadas. Fotos, Histórico, Vistoria, Contrato e Venda não ficam dentro de Veículo; possuirão estruturas próprias relacionadas futuramente por `veiculoId`.

## Fluxo de criação

Um usuário autenticado e autorizado abre o formulário em `/veiculos`, seleciona uma Oportunidade existente e complementa os dados automotivos. O serviço obtém empresa e unidade do vínculo de acesso, normaliza e valida os dados, persiste o Veículo com status inicial `em_preparacao` e registra a auditoria somente depois da criação bem-sucedida. A Oportunidade permanece inalterada.

## Formulário e preenchimento automático

O formulário contém somente Oportunidade de origem, proprietário, placa, marca, modelo, versão, anos, cor, quilometragem, Renavam, chassi e código FIPE. Empresa, unidade, status, identificadores técnicos, arquivamento e datas não são apresentados. A seleção identifica a Oportunidade por proprietário, veículo informado e placa, preenchendo proprietário e placa quando disponíveis, sem decompor `veiculo_informado`.

## Normalização e validação

Textos recebem `trim`; placa e chassi também recebem uppercase. Opcionais vazios tornam-se `null`. O serviço exige Oportunidade, proprietário, placa, marca, modelo e cor não vazios, quilometragem inteira não negativa, ano de fabricação entre 1886 e 2100 e ano/modelo igual ou até um ano posterior à fabricação, limitado a 2100. Não existem regex nacional de placa nem validações rígidas de Renavam ou chassi.

## Autorização transitória

Enquanto não existem permissões específicas de Veículos, `/veiculos` exige `oportunidades.visualizar` e a criação exige `oportunidades.criar`, inclusive no serviço. Administrador e Consultor podem visualizar e criar; Teste pode apenas visualizar; Financeiro não possui acesso. Essa associação é transitória e não altera a matriz de permissões.

## Auditoria da criação

Cada criação persistida registra evento `veiculos`/`criar`, com resultado `sucesso`, origem `usuario`, recurso `veiculo` e o identificador criado. Os detalhes são limitados a placa, proprietário, marca, modelo, status, Oportunidade e código do perfil. Renavam, chassi, contexto organizacional e dados brutos não são copiados.

## RLS de criação e unicidade da origem

A migração da Sprint 14 adiciona unicidade parcial de `oportunidade_id` para registros não arquivados e uma política de `INSERT` para `authenticated`. A criação persistente exige simultaneamente autenticação, vínculo organizacional ativo, unidade definida, mesma empresa, mesma unidade, permissão `oportunidades.criar` pertencente exatamente ao perfil do vínculo ativo e Oportunidade existente. A associação com `oportunidades.criar` é transitória até existirem permissões próprias do módulo Veículos. Como Oportunidades ainda não persiste empresa ou unidade, a RLS não inventa uma validação organizacional impossível para essa tabela. Não existe política de exclusão.

## Consulta individual

A rota `/veiculos/[id]` apresenta o Veículo individual sem expor empresa, unidade, UUIDs técnicos ou arquivamento. Exibe os dados automotivos, proprietário, status, Oportunidade de origem em formato amigável e datas de criação e atualização. Renavam, chassi e código FIPE aparecem somente quando informados. Identificador inexistente ou inacessível resulta em `Veículo não encontrado.`.

## Edição em preparação

Durante a fase `em_preparacao`, a página individual permite editar exclusivamente `proprietarioNome`, `placa`, `marca`, `modelo`, `versao`, `anoFabricacao`, `anoModelo`, `cor`, `quilometragem`, `renavam`, `chassi` e `codigoFipe`. O formulário de criação é reutilizado em modo de edição. Identificador, empresa, unidade, Oportunidade de origem, status, criação e arquivamento são imutáveis nesse fluxo.

A atualização reutiliza as regras de normalização e validação da criação. O contrato `DadosAtualizacaoVeiculo` contém somente os campos editáveis. O repositório envia somente essas colunas, atualiza `atualizado_em`, restringe o registro a `arquivado_em is null` e devolve o Veículo mapeado.

A imutabilidade estrutural possui proteção dupla. Na aplicação, `DadosAtualizacaoVeiculo` não aceita `id`, `empresaId`, `unidadeId`, `oportunidadeId`, `status`, `criadoEm` ou `arquivadoEm`. No banco, um trigger `BEFORE UPDATE` rejeita qualquer alteração de `id`, `empresa_id`, `unidade_id`, `oportunidade_id`, `status`, `criado_em` ou `arquivado_em`, usando comparação `IS DISTINCT FROM`. `atualizado_em` e os campos operacionais editáveis permanecem atualizáveis.

## Autorização da consulta e edição

A consulta individual exige autenticação e `oportunidades.visualizar`. A edição exige autenticação e `oportunidades.alterar` na interface, no serviço e na política RLS. Administrador e Consultor visualizam e editam; Teste visualiza sem editar; Financeiro não acessa. A associação continua transitória e não cria permissões novas.

## RLS de atualização

A migração da Sprint 15 cria uma política `UPDATE` somente para `authenticated`, com `USING` e `WITH CHECK`. Ambos exigem `arquivado_em is null`, `auth.uid()` não nulo, vínculo ativo, empresa correspondente, unidade definida e correspondente e a permissão transitória `oportunidades.alterar` pertencente ao perfil do vínculo. Dessa forma, um Veículo arquivado não pode ser editado e a linha resultante deve permanecer não arquivada. Não há política para `anon`, `DELETE` ou mudança de contexto organizacional. A migração é criada para aplicação separada pelo Product Owner e não é executada pelo Codex.

## Auditoria da alteração

Após persistência bem-sucedida, a atualização registra `veiculos`/`alterar`, resultado `sucesso`, origem `usuario` e o identificador do Veículo. Os detalhes contêm apenas placa, proprietário, marca, modelo, status, perfil, snapshot do e-mail autenticado e `camposAlterados`. Essa lista possui ordem estável e somente nomes de campos editáveis que realmente mudaram. Renavam, chassi, valores anteriores e novos e identificadores organizacionais não são registrados.

## Mensagens controladas

Falhas de carregamento, ausência do Veículo e falhas de atualização não expõem mensagens técnicas do Supabase. Conflitos de placa, Renavam ou chassi são apresentados como `Já existe outro veículo com esses dados.`.

## Fora do escopo da edição atual

Outras mudanças de status, fotos, checklist, histórico, vistoria, anúncio público, publicação automática, negociação, reserva, venda, cancelamento operacional, arquivamento e exclusão permanecem não implementados. A Oportunidade de origem não pode ser modificada.

## Conclusão da preparação

A operação pública `marcarVeiculoProntoParaAnunciar(id)` representa exclusivamente a transição `em_preparacao` para `pronto_para_anunciar`. Status não é campo livre, não integra o formulário e não é recebido como parâmetro da operação. Uma função pura do Core valida a matriz, que possui somente essa transição.

O serviço exige usuário autenticado e `veiculos.preparacao.concluir`, carrega o Veículo, rejeita registros ausentes, arquivados ou em status incompatível, chama o repositório específico, registra auditoria depois da persistência e devolve o Veículo atualizado. Administrador e Consultor possuem a permissão; Financeiro e Teste não possuem.

## RPC da preparação

O repositório chama `public.marcar_veiculo_pronto_para_anunciar` enviando somente `p_veiculo_id`. A função é `SECURITY DEFINER`, possui `search_path` controlado, não aceita status nem contexto organizacional do cliente e pode ser executada somente por `authenticated`.

A RPC obtém `auth.uid()`, bloqueia a linha durante a operação, valida vínculo ativo, empresa, unidade não nula e correspondente, perfil e a permissão `veiculos.preparacao.concluir`. O Veículo deve estar não arquivado e em `em_preparacao`. O `UPDATE` condicional define `pronto_para_anunciar` e `atualizado_em = now()`, impedindo duas transições concorrentes válidas.

## Proteção contra bypass de status

O papel `authenticated` perde o privilégio genérico de `UPDATE` e recebe concessão por coluna apenas para os campos operacionais editáveis da Sprint 15 e `atualizado_em`; `status` não integra essa concessão. O trigger estrutural continua protegendo identificador, empresa, unidade, oportunidade, criação e arquivamento e aceita mudança de status somente no par aprovado. A combinação de privilégio por coluna, RPC específica e trigger impede atualização direta de status pelo REST autenticado.

## Auditoria da conclusão

Depois da transição persistida, a aplicação registra evento `veiculos`/`alterar`, resultado `sucesso` e origem `usuario`. Os detalhes contêm somente placa, `statusAnterior`, `statusNovo`, `perfilCodigo` e `usuarioEmail`. Renavam, chassi, contexto organizacional, credenciais e payload bruto não são registrados.

## Interface da conclusão

Na ficha individual, usuários autorizados visualizam `Marcar como pronto para anunciar` somente quando o status é `em_preparacao`. A confirmação permite confirmar ou cancelar sem biblioteca adicional. Durante a execução, cliques repetidos são bloqueados. Após sucesso, a ficha passa a exibir `Pronto para anunciar` e a ação desaparece.
