# PLATAFORMA INATO

**Versão:** 1.0 (Blueprint Oficial)

---

# VISÃO

A Plataforma INATO é um ERP especializado no mercado automotivo, desenvolvido para administrar integralmente a operação da INATO Veículos e sua futura rede de franquias.

O objetivo da plataforma é eliminar processos manuais, garantir total rastreabilidade das operações e oferecer uma base tecnológica escalável para expansão nacional e internacional.

A plataforma foi concebida para operar desde pequenas equipes até centenas de unidades simultaneamente, mantendo segurança, auditoria e padronização em todos os processos.

---

# MISSÃO

Conectar pessoas à compra e venda de veículos com transparência absoluta, utilizando tecnologia para eliminar fraudes, aumentar a produtividade operacional e padronizar todos os processos da empresa.

---

# VISÃO DE LONGO PRAZO

Ser a maior plataforma tecnológica especializada na comercialização de veículos particulares do mundo.

---

# PRINCÍPIOS

## Transparência

Toda informação relevante deverá ser registrada e auditada.

Nenhuma alteração importante poderá ocorrer sem rastreabilidade.

---

## Segurança

Todos os dados deverão possuir controle de acesso.

Toda operação será protegida por autenticação e autorização.

---

## Escalabilidade

Todo módulo deverá funcionar para:

- uma empresa
- dezenas de unidades
- centenas de colaboradores
- milhões de registros

Sem necessidade de reestruturação da arquitetura.

---

## Modularidade

Cada módulo deverá possuir responsabilidades próprias.

Nenhum módulo poderá depender diretamente da implementação interna de outro módulo.

---

## Performance

A plataforma deverá consultar apenas os dados necessários.

Filtros, paginação e ordenação deverão ocorrer preferencialmente no banco de dados.

---

## Auditoria

Toda alteração crítica deverá registrar:

- quem realizou
- quando realizou
- qual informação foi alterada
- valor anterior
- valor novo

---

## Reutilização

Sempre que possível componentes, serviços e regras deverão ser reutilizados.

Duplicação de código não será aceita.

---

## Evolução
---

# ARQUITETURA GERAL DA PLATAFORMA

## Visão arquitetural

A Plataforma INATO será construída como uma aplicação modular, preparada para atender múltiplas empresas, unidades, colaboradores e perfis de acesso.

Cada módulo terá responsabilidades próprias, mas compartilhará uma base comum de identidade, segurança, auditoria e dados organizacionais.

A arquitetura deverá permitir que novas funcionalidades sejam adicionadas sem exigir a reconstrução dos módulos existentes.

---

## Camadas da aplicação

A Plataforma INATO será organizada nas seguintes camadas:

### 1. Interface

Responsável pela interação com os usuários.

Inclui:

- páginas;
- formulários;
- listas;
- tabelas;
- dashboards;
- componentes visuais;
- mensagens de carregamento e erro.

A interface não deverá acessar diretamente o banco de dados.

---

### 2. Aplicação

Responsável por coordenar os fluxos de cada funcionalidade.

Exemplos:

- cadastrar uma oportunidade;
- editar um veículo;
- aprovar uma avaliação;
- iniciar uma negociação;
- gerar um contrato;
- registrar uma comissão.

Essa camada conecta a interface às regras de negócio.

---

### 3. Domínio

Responsável pelas regras do negócio da INATO.

Exemplos:

- critérios de recusa de veículos;
- regras de comissão;
- progressão de status;
- permissões por função;
- critérios do Selo INATO Verificado;
- exigências do checklist fotográfico;
- regras de bonificação dos colaboradores.

As regras do domínio não deverão depender diretamente da interface.

---

### 4. Serviços

Responsáveis por executar operações relacionadas aos módulos.

Exemplos:

- buscar oportunidades;
- atualizar veículos;
- registrar negociações;
- gerar contratos;
- consultar indicadores financeiros;
- carregar históricos.

Os componentes e páginas deverão utilizar serviços em vez de acessar diretamente o Supabase.

---

### 5. Dados

Responsável pela persistência e recuperação das informações.

Inicialmente será utilizada a infraestrutura do Supabase, incluindo:

- PostgreSQL;
- autenticação;
- armazenamento de arquivos;
- Row Level Security;
- funções de banco;
- atualizações em tempo real quando necessárias.

A arquitetura deverá evitar dependência desnecessária da implementação específica do provedor.

---

### 6. Segurança

Responsável por:

- autenticação;
- autorização;
- perfis;
- permissões;
- isolamento entre empresas e unidades;
- proteção de dados pessoais;
- políticas RLS;
- controle de acesso aos arquivos;
- auditoria de ações.

Nenhuma informação protegida deverá ser liberada apenas por controle visual da interface.

A autorização deverá ser validada também no banco de dados.

---

### 7. Auditoria

Responsável por registrar operações relevantes realizadas na plataforma.

A auditoria deverá identificar:

- usuário;
- empresa;
- unidade;
- módulo;
- ação;
- registro afetado;
- data e hora;
- dados anteriores;
- dados posteriores;
- origem da operação.

---

## Fluxo padrão de uma operação

O fluxo recomendado será:

```text
Usuário
   ↓
Página ou componente
   ↓
Camada de aplicação
   ↓
Serviço do módulo
   ↓
Regras do domínio
   ↓
Banco de dados
   ↓
Auditoria
   ↓
Resposta para a interface
A arquitetura deverá permitir inclusão de novos módulos sem necessidade de reescrever módulos existentes.
---

# MODELO DE DOMÍNIO DA PLATAFORMA

A Plataforma INATO será organizada em domínios independentes.

Cada domínio será responsável exclusivamente por seu próprio conjunto de regras de negócio.

Nenhum domínio poderá depender diretamente da implementação interna de outro domínio.

Toda comunicação ocorrerá através de serviços bem definidos.

---

# DOMÍNIOS

## 01 — Núcleo

É o coração da plataforma.

Sem este domínio nenhum outro poderá funcionar.

Responsabilidades:

- Empresas
- Unidades
- Usuários
- Perfis
- Permissões
- Auditoria
- Configurações
- Logs

Este domínio será utilizado por absolutamente todos os demais módulos.

---

## 02 — CRM

Responsável por todo relacionamento comercial antes da venda.

Entidades:

- Oportunidades
- Clientes
- Histórico de contatos
- Agenda
- Follow-up
- Status comerciais

---

## 03 — Veículos

Responsável pela administração completa dos veículos.

Entidades:

- Veículos
- Fotos
- Vídeos
- Histórico Comprovado
- Documentação
- Checklist
- Avaliação
- Vistorias

---

## 04 — Comercial

Responsável pelo processo de venda.

Entidades:

- Negociações
- Propostas
- Reservas
- Aprovações
- Venda

---

## 05 — Contratos

Responsável pelos documentos legais.

Entidades:

- Contratos
- Assinaturas
- Procurações
- Autorizações
- Histórico documental

---

## 06 — Financeiro

Responsável pela movimentação financeira.

Entidades:

- Comissões
- Contas
- Recebimentos
- Pagamentos
- Fluxo de Caixa
- Conciliação

---

## 07 — Serviços

Produtos adicionais.

Entidades:

- Seguro
- Consórcio
- Garantia Estendida
- Despachante
- Outros parceiros

---

## 08 — Marketplace

Responsável pela publicação.

Entidades:

- Catálogo
- Portal do Proprietário
- Portal do Comprador
- APIs
- Integrações

---

## 09 — Franquias

Responsável pela expansão.

Entidades:

- Franqueados
- PDVs
- Equipes
- Metas
- Royalties
- Auditoria operacional

---

## 10 — Business Intelligence

Responsável pela inteligência da plataforma.

Entidades:

- Dashboards
- KPIs
- Bonificações
- Metas
- Ranking
- Indicadores

---

# REGRA FUNDAMENTAL

Todos os módulos deverão depender apenas do Núcleo.

Jamais um módulo poderá acessar diretamente a implementação interna de outro módulo.

Exemplo correto:

CRM
↓
Serviço do Núcleo
↓
Usuário

Exemplo incorreto:

CRM
↓
Tabela do Financeiro

---

# BENEFÍCIOS

Esta arquitetura permitirá:

- crescimento contínuo;
- manutenção simples;
- testes independentes;
- expansão internacional;
- APIs públicas;
- novos produtos;
- aplicativos móveis;
- novas unidades;
- novas franquias;
- milhões de registros sem reestruturação arquitetural.
---

# MODELO DE DADOS MESTRE

## Diretrizes gerais

O banco de dados da Plataforma INATO deverá ser preparado para:

- múltiplas empresas;
- múltiplas unidades;
- múltiplos usuários;
- isolamento de dados por organização;
- auditoria completa;
- arquivamento lógico;
- expansão para franquias;
- operação internacional futura.

As entidades principais utilizarão UUID como identificador.

Datas e horários deverão utilizar campos compatíveis com fuso horário.

Registros operacionais importantes não deverão ser excluídos definitivamente sem autorização e auditoria.

---

# DOMÍNIO NÚCLEO

O domínio Núcleo fornece identidade, estrutura organizacional, acesso e auditoria para todos os outros domínios.

## Tabela: empresas

Representa cada organização que utiliza a Plataforma INATO.

Campos iniciais:

- id
- nome_fantasia
- razao_social
- documento
- email
- telefone
- pais
- moeda
- fuso_horario
- ativo
- created_at
- updated_at
- arquivado_em

---

## Tabela: unidades

Representa lojas, franquias, escritórios, PDVs ou centros operacionais.

Campos iniciais:

- id
- empresa_id
- nome
- codigo
- tipo
- documento
- email
- telefone
- cidade
- estado
- pais
- endereco
- cep
- ativo
- created_at
- updated_at
- arquivado_em

Relacionamento:

```text
empresa
   └── várias unidades