# Domínio de Identidade

## Finalidade

O domínio de Identidade representa o usuário, o perfil e a sessão organizacional atuais da Plataforma INATO. Nesta fase, ele fornece uma identidade temporária em memória para sustentar a evolução controlada do Núcleo, sem implementar autenticação real.

## Responsabilidades

- definir os contratos públicos de usuário, perfil, sessão e contexto de identidade;
- manter dados iniciais imutáveis em memória;
- relacionar a identidade atual ao contexto fornecido pelo módulo Organização;
- entregar cópias independentes dos dados aos consumidores;
- preservar uma interface pública estável para a futura evolução da autenticação.

## Relação entre Identidade e Organização

Identidade depende somente da interface pública de Organização. A sessão utiliza os identificadores da empresa e da unidade fornecidos pelo contexto organizacional atual, sem reproduzir as regras internas de Empresa ou Unidade.

Organização determina onde uma operação ocorre. Identidade representa quem opera, sob qual perfil e em qual sessão. O contexto de identidade reúne essas duas dimensões sem transferir a responsabilidade de uma para a outra.

## Usuário, perfil e sessão

- **Usuário:** representa a pessoa reconhecida pela plataforma, com identificação e estado próprios. Não contém senha, token ou credencial.
- **Perfil:** representa a função organizacional vigente do usuário e prepara o domínio para permissões futuras.
- **Sessão:** associa, durante um período, o usuário e o perfil ao contexto de empresa e unidade em que a operação ocorre.

## Invariantes

- os estados são a fonte única da verdade; não existe campo booleano `ativo`;
- usuário, perfil e sessão possuem identificadores estáveis;
- a sessão referencia exatamente o usuário e o perfil atuais;
- a empresa e a unidade da sessão coincidem com o contexto organizacional atual;
- a unidade da sessão pode ser nula somente quando o contexto organizacional também não definir unidade;
- objetos internos não são exportados nem entregues por referência;
- cada chamada pública devolve cópias independentes;
- credenciais, senhas e tokens não fazem parte deste domínio.

## Dependências permitidas

- contratos e serviços públicos de `src/core/organizacao`;
- recursos nativos de TypeScript e JavaScript necessários aos contratos e à imutabilidade;
- testes locais com `node:test` e `node:assert/strict`.

## Dependências proibidas

- React e componentes de interface;
- Supabase, banco de dados, rede ou autenticação real;
- arquivos de ambiente e credenciais;
- implementações internas de Organização;
- módulos operacionais da plataforma.

## Decisão atual: identidade temporária em memória

A identidade atual é deliberadamente fixa e mantida em memória. Essa decisão oferece uma fundação executável para os contratos do Núcleo, mas não representa autenticação real, persistência, autorização ou gerenciamento completo de usuários.

## Proibição de armazenar credenciais

O domínio não armazena e não deve receber senhas, tokens, chaves, segredos ou outras credenciais. A futura autenticação deverá delegar o tratamento de credenciais a um provedor aprovado e preservar somente as correlações necessárias no Núcleo.

## Preparação futura para Supabase Auth

Os contratos separam usuário, perfil e sessão para permitir futura integração com Supabase Auth. Essa integração ainda não existe e exigirá Sprint própria, validação em ambiente confiável e aprovação das regras de segurança, banco e autorização.

## Ordem futura de evolução

1. integrar um provedor de autenticação aprovado e correlacionar sua identidade ao usuário do Núcleo;
2. persistir usuários e seus estados com isolamento organizacional;
3. modelar associações empresariais e vínculos com unidades;
4. persistir perfis e composições de permissões;
5. atribuir perfis com escopo de empresa ou unidade;
6. resolver autorização centralmente para cada operação;
7. criar e invalidar sessões organizacionais confiáveis;
8. auditar autenticação, alterações de acesso e decisões críticas;
9. validar revogação, privilégio mínimo e isolamento multiempresa e multiunidade.
