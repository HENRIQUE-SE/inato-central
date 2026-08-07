# Persistência da Auditoria

## Objetivo

Persistir e consultar o histórico de auditoria sem transferir regras do Core para a infraestrutura ou para a interface.

## Tabela e campos

`auditoria_eventos` contém exclusivamente `id`, contexto organizacional, usuário, módulo, ação, tipo e identificador do recurso, resultado, origem, detalhes permitidos e data de criação. Os estados textuais possuem restrições coerentes com os contratos públicos do Core.

## Índices

Há índices para data, empresa, unidade, usuário, módulo, ação e resultado. A chave primária já indexa `id`, portanto não há índice redundante para ela.

## Imutabilidade

O repositório oferece somente inserção e consulta. Não existem operações de atualização ou exclusão do histórico.

A persistência é condicionada a uma sessão Supabase autenticada. Sem login, o evento permanece somente na auditoria em memória como contingência transitória, com `usuarioId` nulo e sem tentativa de persistência.

## Relação com Core e Identidade

O Core define os contratos e invariantes. A persistência converte esses contratos para o formato PostgreSQL. A Identidade permite apresentar o nome do usuário atual quando seu identificador coincide com o evento, sem cadastro paralelo ou `join` inexistente.

## Política de consulta

Consultas são paginadas, ordenadas da mais recente para a mais antiga e podem filtrar módulo, ação e resultado. A pesquisa simples consulta a placa em `detalhes`; pesquisa conjunta por proprietário e veículo exigiria composição adicional e permanece fora desta etapa.

## RLS autenticada e política transitória

A migração habilita RLS sem acesso para `anon`. Usuários `authenticated` podem inserir somente eventos cujo `usuario_id = auth.uid()` e cuja empresa seja o UUID oficial da INATO. Usuários autenticados podem consultar somente os eventos dessa empresa.

Não existem políticas de UPDATE ou DELETE. A política de empresa única é transitória e deverá ser substituída por autorização baseada em vínculos organizacionais persistidos. É proibido criar política aberta apenas para facilitar desenvolvimento. A migração deve ser revisada e aplicada separadamente; ela não foi executada nesta Sprint.

## Evolução futura

1. persistir associações entre usuários autenticados e organizações;
2. substituir as políticas transitórias por contexto e permissão;
3. validar revogação de sessão e vínculos;
4. validar isolamento multiempresa e multiunidade;
5. ampliar pesquisas somente com solução SQL segura e aprovada.
