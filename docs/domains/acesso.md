# Controle de Acesso

## Objetivo e separação

O domínio define perfis, permissões, vínculos e autorização pura. Supabase Auth identifica tecnicamente o usuário; Core Identidade mantém conceitos organizacionais temporários; Acesso resolve o vínculo persistido. O Core Acesso não depende de React nem Supabase.

## Perfis e matriz inicial

- Administrador: todas as quatro permissões de Oportunidades e `auditoria.visualizar`.
- Consultor: as quatro permissões de Oportunidades, sem Auditoria.
- Financeiro: nenhuma permissão operacional desta fase.
- Teste: somente `oportunidades.visualizar`.

## Vínculos e negação

`usuarios_perfis` associa o UUID real do Supabase Auth a empresa, unidade e perfil. Usuário sem autenticação, vínculo ativo ou permissão é negado. O erro público é `Acesso não autorizado.`.

## RLS

Não há acesso para `anon` nem políticas de escrita pela aplicação. `authenticated` consulta apenas o próprio vínculo, o perfil associado e suas permissões. A migração não cadastra usuários automaticamente e não foi aplicada pelo Codex.

## Situação transitória e evolução

O CRUD de Oportunidades ainda não é bloqueado por permissões nesta fase. Após validação, o domínio evoluirá para administração de vínculos, múltiplas empresas e unidades, revogação e aplicação integral das permissões operacionais.
