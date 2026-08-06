# Arquitetura da Plataforma INATO Central

## 1. Objetivo da arquitetura

A arquitetura da Plataforma INATO Central deve sustentar um ERP automotivo modular, seguro, auditável e escalável, preparado para atender múltiplas empresas, unidades, colaboradores e perfis de acesso.

Seus objetivos são:

- preservar as fronteiras entre os domínios de negócio;
- permitir evolução incremental sem reconstrução dos módulos existentes;
- impedir que regras de negócio dependam da interface ou de detalhes de infraestrutura;
- centralizar identidade, organização, segurança e auditoria no domínio Núcleo;
- garantir rastreabilidade das operações críticas;
- favorecer reutilização, testes, manutenção e substituição controlada de integrações externas;
- manter consultas, filtros, paginação e ordenação eficientes, preferencialmente na camada de dados.

Este documento complementa o `BLUEPRINT.md`. Em caso de dúvida ou conflito, a decisão deve ser encaminhada ao Arquiteto-Chefe antes da implementação.

## 2. Estrutura oficial de diretórios

A estrutura atualmente oficial da aplicação é:

```text
src/
├── app/          # Rotas, páginas, layouts e composição da interface
├── components/   # Componentes visuais reutilizáveis e específicos de módulos
├── config/       # Configurações não sensíveis da aplicação
├── constants/    # Constantes compartilhadas e valores estáveis de domínio
├── core/         # Recursos transversais e contratos do domínio Núcleo
├── lib/          # Adaptadores e clientes de infraestrutura
├── services/     # Casos de uso e operações disponibilizadas à interface
└── types/        # Tipos e contratos TypeScript compartilhados
```

Diretórios de suporte existentes na raiz:

```text
docs/             # Documentação complementar
public/           # Recursos estáticos públicos
```

Nenhum diretório principal pode ser criado, removido, renomeado ou ter sua responsabilidade alterada sem aprovação explícita do Arquiteto-Chefe. Esta estrutura descreve a organização vigente; ela não autoriza migrações automáticas de arquivos existentes.

## 3. Responsabilidade de cada camada

### 3.1 Interface

Representada principalmente por `src/app` e `src/components`.

Responsabilidades:

- apresentar páginas, formulários, listas, tabelas e dashboards;
- capturar ações do usuário;
- exibir estados de carregamento, sucesso e erro;
- compor componentes e invocar serviços autorizados.

A interface não deve implementar regras críticas de negócio nem acessar diretamente o banco de dados.

### 3.2 Aplicação e serviços

Representada principalmente por `src/services` e pela coordenação dos fluxos da aplicação.

Responsabilidades:

- executar casos de uso;
- coordenar validações e regras de domínio;
- controlar o fluxo entre interface, domínio e infraestrutura;
- devolver resultados em contratos previsíveis;
- acionar auditoria quando a operação exigir.

### 3.3 Domínio

Representada pelas regras de negócio, tipos, constantes e contratos próprios de cada módulo, respeitando a estrutura aprovada.

Responsabilidades:

- expressar regras e invariantes do negócio;
- validar transições de estado;
- definir políticas, permissões e critérios operacionais;
- permanecer independente de páginas, componentes e detalhes do Supabase.

### 3.4 Núcleo

Representada por `src/core` e pelos contratos transversais aprovados.

Responsabilidades:

- identidade organizacional;
- empresas e unidades;
- usuários, perfis e permissões;
- configurações globais;
- auditoria e logs;
- contratos compartilhados indispensáveis aos demais módulos.

O Núcleo não deve concentrar regras que pertençam exclusivamente a outros domínios.

### 3.5 Infraestrutura e dados

Representada principalmente por `src/lib` e por adaptadores utilizados pelos serviços.

Responsabilidades:

- encapsular clientes externos e mecanismos de persistência;
- integrar a aplicação ao Supabase e a outros provedores aprovados;
- traduzir respostas externas para contratos internos;
- evitar o acoplamento da interface aos detalhes do provedor.

### 3.6 Configurações, constantes e tipos

- `src/config`: somente configurações não sensíveis e aprovadas.
- `src/constants`: valores estáveis, nomes e limites reutilizados.
- `src/types`: contratos TypeScript compartilhados quando houver necessidade real.

Credenciais, segredos e dados sensíveis não podem ser armazenados nesses diretórios.

## 4. Dependências permitidas

O fluxo padrão permitido é:

```text
Página ou componente
    → serviço ou caso de uso
    → regra de domínio
    → adaptador de infraestrutura
    → banco ou serviço externo
    → auditoria
    → resposta para a interface
```

São permitidas as seguintes relações:

- páginas podem compor componentes e chamar serviços;
- componentes podem utilizar outros componentes, tipos, constantes e configurações não sensíveis;
- serviços podem utilizar regras de domínio, contratos do Núcleo e adaptadores de infraestrutura;
- regras de domínio podem utilizar seus próprios tipos, constantes e contratos puros;
- módulos podem depender dos contratos públicos do Núcleo;
- adaptadores podem utilizar bibliotecas e clientes externos previamente aprovados;
- código compartilhado pode ser utilizado quando tiver responsabilidade clara e não criar dependências circulares.

## 5. Dependências proibidas

São proibidos:

- acesso direto ao Supabase, banco de dados ou serviço externo a partir de páginas e componentes;
- regras críticas de negócio implementadas apenas na interface;
- dependência direta de um domínio na implementação interna de outro domínio;
- acesso de um módulo às tabelas, componentes internos ou arquivos privados de outro módulo como forma de integração;
- dependências circulares entre módulos ou camadas;
- importação da camada de interface pelo domínio ou pelos serviços;
- armazenamento de credenciais ou segredos no código-fonte;
- autorização baseada exclusivamente na ocultação de elementos visuais;
- duplicação deliberada de regras de negócio ou integrações já existentes;
- introdução de bibliotecas, provedores, camadas ou padrões arquiteturais sem aprovação.

Quando um módulo precisar de uma capacidade de outro domínio, a integração deverá ser definida por serviço ou contrato público aprovado pelo Arquiteto-Chefe.

## 6. Regras para criação de novos módulos

Um novo módulo somente pode ser criado após:

1. definição do objetivo e do escopo pelo Product Owner;
2. identificação do domínio responsável;
3. definição das fronteiras, entidades e casos de uso;
4. definição dos contratos públicos e dependências;
5. análise dos impactos em segurança, auditoria e dados;
6. aprovação da estrutura pelo Arquiteto-Chefe;
7. criação de ADR quando houver decisão arquitetural relevante.

Todo novo módulo deve:

- possuir uma responsabilidade de negócio clara;
- depender apenas do Núcleo e de contratos formalmente aprovados;
- manter suas regras de domínio isoladas da interface e da infraestrutura;
- utilizar serviços para operações de aplicação;
- prever autorização e auditoria desde o início;
- evitar nomes genéricos ou estruturas paralelas às camadas oficiais;
- incluir critérios de validação e testes definidos na Sprint correspondente.

O Codex não está autorizado a criar módulos ou reorganizar diretórios por iniciativa própria.

## 7. Política de arquitetura em camadas

Cada camada deve conhecer apenas as abstrações necessárias à sua função. Dependências devem apontar da interface para os serviços, dos serviços para o domínio e para contratos de infraestrutura, nunca no sentido inverso.

Regras permanentes:

- a interface apresenta e coordena interação, mas não decide regras críticas;
- os serviços coordenam casos de uso, sem assumir responsabilidades visuais;
- o domínio contém regras independentes de framework e provedor sempre que possível;
- a infraestrutura implementa integrações e persistência por trás de contratos claros;
- segurança deve ser validada no servidor e no banco quando aplicável;
- operações críticas devem produzir registros de auditoria;
- exceções ao fluxo em camadas exigem justificativa e ADR aprovado;
- mudanças arquiteturais não podem ser introduzidas incidentalmente em uma tarefa funcional.

## 8. Política de reutilização de componentes

A reutilização deve reduzir duplicação sem criar abstrações prematuras.

Regras:

- componentes exclusivos de um módulo permanecem no espaço desse módulo;
- componentes devem ser promovidos para uma área compartilhada somente quando houver uso real em mais de um contexto e contrato estável;
- componentes compartilhados devem ser genéricos, documentáveis e livres de regras exclusivas de um domínio;
- regras de negócio não devem ser duplicadas em diferentes componentes;
- variações visuais devem preferir propriedades e composição quando isso preservar clareza;
- componentes excessivamente configuráveis ou com responsabilidades diferentes devem ser separados;
- antes de criar um componente, serviço, tipo ou utilitário, deve-se verificar se já existe solução equivalente;
- alterações em componentes compartilhados devem considerar todos os consumidores e ser revisadas quanto a regressões.

Toda exceção que altere fronteiras, dependências ou responsabilidades descritas neste documento necessita de aprovação formal do Arquiteto-Chefe.
