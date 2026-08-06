# Regras do Projeto — Plataforma INATO Central

## 1. Finalidade

Este documento estabelece a governança operacional para o desenvolvimento da Plataforma INATO Central. Ele deve ser observado por integrantes humanos e agentes de inteligência artificial.

As regras deste documento complementam o `AGENTS.md`, o `BLUEPRINT.md` e o `ARCHITECTURE.md`. Nenhuma disposição aqui autoriza alteração de arquitetura, banco de dados, segurança ou escopo sem a aprovação correspondente.

## 2. Papéis da equipe

### 2.1 CEO e Product Owner — Charles Henrique

Responsabilidades:

- definir visão, objetivos e prioridades do produto;
- aprovar escopo e critérios de negócio;
- ordenar o backlog;
- aceitar ou rejeitar entregas funcionais;
- aprovar impactos relevantes em prazo, custo, risco e operação;
- autorizar commit, push, publicação ou outras ações externas quando exigido pelas regras da tarefa.

### 2.2 Arquiteto-Chefe e Líder Técnico — ChatGPT

Responsabilidades:

- definir e proteger a arquitetura técnica;
- transformar objetivos do produto em diretrizes técnicas;
- aprovar estruturas, padrões, dependências e integrações;
- revisar propostas de alteração arquitetural;
- aprovar ADRs técnicos;
- estabelecer critérios de qualidade, segurança e validação;
- resolver conflitos entre implementação e arquitetura.

### 2.3 Engenheiro Executor — Codex

Responsabilidades:

- analisar o repositório antes de implementar;
- executar exclusivamente o escopo autorizado;
- preservar arquitetura, estrutura e alterações preexistentes;
- seguir os documentos oficiais e os ADRs aprovados;
- validar a entrega de acordo com a autorização recebida;
- relatar arquivos alterados, verificações, riscos e pendências;
- interromper e solicitar decisão quando houver necessidade de ampliar o escopo ou alterar arquitetura.

O Codex pode identificar problemas e propor soluções, mas não pode aprovar sua própria proposta arquitetural.

## 3. Ordem de autoridade documental

Quando houver conflito, deve ser observada a seguinte ordem:

1. decisão expressa do CEO/Product Owner sobre produto e prioridade;
2. decisão expressa do Arquiteto-Chefe sobre arquitetura e técnica;
3. ADR aprovado;
4. `BLUEPRINT.md`;
5. `ARCHITECTURE.md`;
6. `AGENTS.md`;
7. `PROJECT_RULES.md`;
8. documento da Sprint;
9. convenções locais do módulo.

Conflitos entre autoridade de produto e autoridade técnica devem ser explicitados e resolvidos antes da implementação. Nenhum agente deve escolher silenciosamente qual regra ignorar.

## 4. Fluxo oficial de desenvolvimento

O fluxo oficial é:

1. **Demanda:** o Product Owner define o problema, objetivo e prioridade.
2. **Análise:** o repositório, impactos, dependências e riscos são avaliados.
3. **Definição técnica:** o Arquiteto-Chefe estabelece solução, limites e validações.
4. **Autorização:** escopo, arquivos e ações permitidas são confirmados.
5. **Execução:** o Codex realiza somente as mudanças autorizadas.
6. **Validação:** são executadas apenas as verificações autorizadas e proporcionais ao risco.
7. **Revisão:** a entrega é comparada com critérios funcionais, técnicos e arquiteturais.
8. **Aprovação:** responsáveis aceitam ou solicitam correções.
9. **Integração:** commit, push, merge ou publicação ocorrem somente quando autorizados.
10. **Encerramento:** a entrega e as pendências são registradas.

Qualquer descoberta fora do escopo deve ser reportada separadamente. Ela não deve ser incorporada à implementação sem autorização.

## 5. Processo de Sprint

Cada Sprint deve possuir:

- identificador e período;
- objetivo de negócio;
- escopo incluído e excluído;
- itens de trabalho;
- responsável por cada item;
- arquivos ou módulos envolvidos;
- critérios de aceitação;
- restrições técnicas;
- dependências e riscos;
- ADRs relacionados;
- plano de validação;
- estado e resultado final.

Etapas da Sprint:

1. definição pelo Product Owner;
2. refinamento técnico pelo Arquiteto-Chefe;
3. autorização para execução;
4. implementação pelo Codex;
5. revisão técnica;
6. aceite funcional;
7. relatório e encerramento.

Uma tarefa está pronta para execução somente quando objetivo, escopo, critérios de aceitação e limites de autoridade forem suficientemente claros. Mudanças relevantes durante a Sprint devem ser registradas como alteração de escopo.

## 6. Processo de revisão

Toda revisão deve verificar, conforme aplicável:

- aderência ao objetivo e aos critérios de aceitação;
- respeito ao `BLUEPRINT.md` e ao `ARCHITECTURE.md`;
- manutenção das fronteiras entre camadas e domínios;
- ausência de mudanças não autorizadas;
- segurança, autorização e proteção de dados;
- necessidade de auditoria;
- tratamento de erros e estados de interface;
- reutilização adequada e ausência de duplicação relevante;
- impactos em consumidores existentes;
- evidências das validações realizadas;
- clareza da documentação e do relatório de entrega.

O autor da implementação não deve considerar sua própria avaliação como aprovação arquitetural. Divergências devem retornar ao Arquiteto-Chefe.

## 7. Processo de aprovação

### 7.1 Aprovação do Product Owner

É obrigatória para:

- prioridade e escopo funcional;
- critérios de negócio;
- mudanças com impacto relevante em operação, prazo, custo ou experiência do usuário;
- aceite final da entrega;
- ações externas quando assim determinado.

### 7.2 Aprovação do Arquiteto-Chefe

É obrigatória para:

- mudança de arquitetura ou estrutura de diretórios;
- criação de módulo ou camada;
- nova dependência, provedor ou padrão técnico;
- mudança de contrato público ou integração;
- alteração de autenticação, autorização ou auditoria;
- exceção às regras em camadas;
- ADR técnico.

### 7.3 Aprovação conjunta

Mudanças de banco, segurança ou arquitetura com impacto no produto exigem avaliação conjunta do Product Owner e do Arquiteto-Chefe.

Ausência de objeção não representa aprovação. A autorização deve ser explícita e vinculada ao escopo.

## 8. Processo para ADR

ADR é obrigatório para decisões arquiteturais relevantes, difíceis de reverter ou que criem precedente.

Cada ADR deve conter:

- número e título;
- data e status;
- responsáveis;
- contexto e problema;
- restrições;
- alternativas consideradas;
- decisão proposta ou adotada;
- justificativa;
- consequências positivas e negativas;
- riscos e impactos;
- plano de migração, quando aplicável;
- documentos e Sprints relacionados.

Status permitidos:

- Proposto;
- Em análise;
- Aprovado;
- Rejeitado;
- Substituído;
- Obsoleto.

O Codex pode redigir uma proposta de ADR quando autorizado. Somente o Arquiteto-Chefe pode conceder aprovação técnica, com participação do Product Owner quando houver impacto de produto. Um ADR aprovado não deve ser reescrito para ocultar decisões anteriores; uma mudança deve gerar novo ADR que substitua o anterior.

## 9. Regras para Git

- consultar o estado do Git antes e depois de uma implementação;
- preservar alterações preexistentes e não relacionadas;
- não usar comandos destrutivos para descartar trabalho sem autorização expressa;
- não executar commit, push, merge, rebase, criação de tag ou publicação sem autorização;
- manter cada mudança limitada ao escopo da tarefa;
- não incluir credenciais, segredos, arquivos de ambiente ou artefatos locais;
- não alterar histórico para esconder problemas;
- relatar arquivos criados, modificados, movidos ou removidos;
- usar mensagens de commit rastreáveis à Sprint quando o commit for autorizado;
- interromper o trabalho se alterações concorrentes tornarem insegura a continuação.

## 10. Regras de segurança

- nunca ler, exibir, registrar ou versionar segredos sem autorização específica e necessidade legítima;
- nunca acessar `.env`, `.env.local` ou arquivos de credenciais quando isso estiver proibido pela tarefa;
- não inserir chaves, tokens ou senhas no código ou na documentação;
- aplicar autenticação e autorização também no servidor e no banco quando aplicável;
- não tratar ocultação visual como controle de acesso;
- respeitar isolamento entre empresas, unidades e usuários;
- utilizar privilégio mínimo;
- registrar operações críticas por meio de auditoria;
- evitar exposição de dados pessoais em logs, erros e relatórios;
- não executar migrações, alterar schema ou políticas RLS sem autorização explícita;
- comunicar imediatamente qualquer possível vulnerabilidade ou exposição identificada.

## 11. Regras para o Codex

Antes da implementação, o Codex deve:

- Antes de iniciar qualquer Sprint, o Codex deve ler obrigatoriamente AGENTS.md, BLUEPRINT.md, ARCHITECTURE.md e PROJECT_RULES.md, salvo se o documento da própria Sprint declarar explicitamente que algum deles não é aplicável.
- ler as instruções aplicáveis, incluindo `AGENTS.md`;
- identificar o diretório exato do projeto;
- consultar a documentação arquitetural relevante;
- verificar o estado do Git;
- confirmar o escopo e as proibições da tarefa;
- identificar alterações preexistentes sem modificá-las.

Durante a implementação, o Codex deve:

- executar apenas ações autorizadas;
- evitar mudanças cosméticas ou refatorações fora do escopo;
- não alterar arquitetura, banco ou estrutura por iniciativa própria;
- não instalar dependências nem iniciar serviços sem autorização;
- não modificar arquivos que pertençam a outro trabalho;
- comunicar qualquer bloqueio ou necessidade de decisão;
- preservar o estilo e os contratos existentes.

Ao finalizar, o Codex deve informar:

- resultado alcançado;
- arquivos alterados;
- resumo das mudanças;
- validações executadas e não executadas;
- estado do Git;
- riscos, limitações e pendências;
- confirmação sobre código, banco, dependências, commit e push, quando pertinente.

## 12. Regras para evitar retrabalho

- cada tarefa deve possuir identificador, objetivo e responsável claros;
- tarefas paralelas devem ter fronteiras de arquivos ou módulos não sobrepostas;
- antes de criar algo, deve-se verificar se já existe solução equivalente;
- decisões relevantes devem ser documentadas, não mantidas apenas em conversa;
- trabalhos incompletos devem registrar estado atual, decisões, riscos e próximo passo;
- mudanças fora do escopo devem virar novas tarefas;
- não reimplementar funcionalidade existente sem justificativa aprovada;
- não promover abstrações compartilhadas antes de confirmar uso e responsabilidade comuns;
- comunicar conflitos de arquivos ou requisitos antes de continuar;
- relacionar entregas à Sprint e aos ADRs aplicáveis;
- manter uma única fonte oficial para cada regra permanente;
- atualizar documentação afetada quando a mudança correspondente for autorizada.

## 13. Proteção da arquitetura

O Codex deve interromper a execução e solicitar aprovação quando identificar necessidade de:

- criar, remover ou reorganizar diretórios estruturais;
- criar módulo, camada ou padrão transversal;
- adicionar dependência ou serviço externo;
- alterar contratos públicos;
- estabelecer dependência entre domínios;
- mudar schema, migração, política RLS ou estratégia de persistência;
- alterar autenticação, autorização, auditoria ou tratamento de dados sensíveis;
- contrariar o `BLUEPRINT.md`, o `ARCHITECTURE.md` ou um ADR aprovado.

A solicitação deve apresentar contexto, impacto, alternativas, recomendação e aprovação necessária. Nenhuma proposta se converte automaticamente em autorização para implementação.
