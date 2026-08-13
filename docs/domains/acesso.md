# Controle de Acesso

## Objetivo e separação

O domínio define perfis, permissões, vínculos e autorização pura. Supabase Auth identifica tecnicamente o usuário; Core Identidade mantém conceitos organizacionais temporários; Acesso resolve o vínculo persistido. O Core Acesso não depende de React nem Supabase.

## Perfis e matriz inicial

- Administrador: todas as quatro permissões de Oportunidades e `auditoria.visualizar`.
- Consultor: as quatro permissões de Oportunidades, sem Auditoria.
- Financeiro: nenhuma permissão operacional desta fase.
- Teste: somente `oportunidades.visualizar`.

## Permissão de conclusão da preparação

A permissão específica `veiculos.preparacao.concluir` autoriza exclusivamente a operação que avança um Veículo de `em_preparacao` para `pronto_para_anunciar`. Administrador e Consultor possuem a permissão. Financeiro e Teste não possuem. As permissões anteriores permanecem inalteradas.

A permissão específica `veiculos.publicacao.concluir` autoriza exclusivamente a operação que avança um Veículo de `pronto_para_anunciar` para `disponivel`. Administrador e Consultor possuem a permissão. Financeiro e Teste não possuem. Ela é independente de `veiculos.preparacao.concluir` e das permissões de Oportunidades.

Negociações possuem permissões independentes: `negociacoes.visualizar`, `negociacoes.criar`, `negociacoes.alterar` e `negociacoes.encerrar`. Administrador e Consultor possuem as quatro. Teste possui somente visualização nesta fase transitória. Financeiro não possui acesso ao domínio.

Essa autorização é validada na interface, no serviço e dentro da RPC PostgreSQL. O perfil Teste continua restrito à visualização da operação real; sua futura finalidade de treinamento e simulação dependerá de ambiente e dados isolados.

## Vínculos e negação

`usuarios_perfis` associa o UUID real do Supabase Auth a empresa, unidade e perfil. Usuário sem autenticação, vínculo ativo ou permissão é negado. O erro público é `Acesso não autorizado.`.

## RLS

Não há acesso para `anon` nem políticas de escrita pela aplicação. `authenticated` consulta apenas o próprio vínculo, o perfil associado e suas permissões. A migração não cadastra usuários automaticamente e não foi aplicada pelo Codex.

## Situação transitória e evolução

O CRUD de Oportunidades ainda não é bloqueado por permissões nesta fase. Após validação, o domínio evoluirá para administração de vínculos, múltiplas empresas e unidades, revogação e aplicação integral das permissões operacionais.
