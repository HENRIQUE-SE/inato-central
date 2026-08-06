# Domínio Core

## Finalidade

O Core é o núcleo organizacional e de segurança da Plataforma INATO Central. Ele fornece identidade, estrutura empresarial, contexto operacional, controle de acesso, configurações e auditoria para os demais domínios.

Os outros módulos podem consumir os contratos públicos do Core, mas o Core não depende das implementações internas de CRM, Veículos, Comercial, Contratos, Financeiro, Serviços, Marketplace, Franquias ou Business Intelligence.

## Decisão atual

A operação atual possui uma única empresa. Ainda assim, todos os contratos e limites do domínio devem permanecer preparados para múltiplas empresas e múltiplas unidades, sem presumir uma empresa global fixa nem remover o contexto organizacional das operações.

Essa preparação não autoriza a criação antecipada de infraestrutura, tabelas ou fluxos multiempresa que não tenham sido aprovados em uma Sprint específica.

## Entidades aprovadas

### Empresa

Representa uma organização independente na plataforma. É a principal fronteira de isolamento de dados e reúne unidades, associações de usuários, perfis e configurações.

### Unidade

Representa uma matriz, filial, franquia, escritório, PDV ou centro operacional. Pertence a uma única empresa e delimita o contexto local das operações.

### Usuário

Representa a pessoa que utiliza a plataforma. A identidade do usuário é global e não deve conter uma empresa fixa, pois poderá participar de mais de uma organização.

### Identidade de Autenticação

Relaciona o usuário do Core à identidade mantida pelo provedor de autenticação. Credenciais, senhas, tokens e segredos permanecem fora do domínio.

### Associação Empresarial

Representa o vínculo entre um usuário e uma empresa. Controla a participação do usuário na organização e seu estado de acesso.

### Associação à Unidade

Relaciona uma associação empresarial às unidades em que o usuário pode operar. Permite distinguir uma unidade principal de unidades adicionais.

### Perfil de Acesso

Agrupa permissões sob uma função organizacional, como Administrador, Gestor ou Consultor. Um perfil representa capacidades de negócio, não regras visuais.

### Permissão

Representa uma capacidade atômica autorizável e identificada de forma estável, como visualizar, criar, editar ou aprovar determinado recurso.

### Composição do Perfil

Relaciona um perfil às permissões concedidas por ele.

### Atribuição de Perfil

Concede um perfil a uma associação empresarial, com escopo de empresa ou unidade, vigência e possibilidade de revogação.

### Convite de Acesso

Controla o ingresso de uma pessoa em uma empresa, incluindo destinatário, validade, unidades e perfis propostos, aceitação, cancelamento ou expiração.

### Configuração Organizacional

Representa parâmetros não sensíveis aplicáveis a uma empresa ou unidade. Segredos de integração não fazem parte dessa entidade.

### Registro de Auditoria

Registra de forma protegida um fato relevante, identificando responsável, contexto organizacional, ação, recurso, momento, origem e alterações aplicáveis.

### Sessão Organizacional

Representa o contexto confiável selecionado após a autenticação, contendo a empresa e, quando aplicável, a unidade em que a operação será executada.

## Relacionamentos

```text
Usuário
├── possui uma ou mais Identidades de Autenticação
└── possui zero ou mais Associações Empresariais
    ├── pertence a uma Empresa
    ├── possui zero ou mais Associações à Unidade
    │   └── cada associação aponta para uma Unidade da mesma Empresa
    └── possui zero ou mais Atribuições de Perfil
        ├── cada atribuição aponta para um Perfil de Acesso
        └── cada atribuição possui escopo de Empresa ou Unidade

Empresa
├── possui uma ou mais Unidades
├── possui Associações Empresariais
├── possui Perfis de Acesso
├── possui Configurações Organizacionais
├── possui Convites de Acesso
└── delimita seus Registros de Auditoria

Perfil de Acesso
└── possui Permissões por meio da Composição do Perfil

Registro de Auditoria
├── referencia o usuário e a identidade responsável
├── referencia obrigatoriamente a empresa
├── pode referenciar uma unidade
└── referencia conceitualmente o recurso afetado
```

## Invariantes

- Uma unidade pertence a somente uma empresa.
- Uma associação empresarial vincula exatamente um usuário a exatamente uma empresa.
- Não pode existir mais de uma associação empresarial ativa para o mesmo usuário e empresa.
- Uma associação à unidade deve apontar para uma unidade da empresa da associação empresarial.
- Um perfil empresarial pertence a uma única empresa.
- Uma atribuição não pode utilizar um perfil de outra empresa.
- Uma atribuição com escopo de unidade não concede acesso a outras unidades.
- Um usuário autenticado sem associação empresarial ativa não possui acesso operacional.
- Empresa ou unidade inativa não pode receber novas operações, conforme política do caso de uso.
- A revogação de um perfil deve produzir efeito sem depender de um novo login prolongado.
- Alterações de acesso e operações administrativas críticas devem gerar auditoria.
- Registros operacionais relevantes devem utilizar arquivamento lógico quando sua preservação for exigida.
- Empresa e unidade informadas pelo cliente devem sempre ser validadas em ambiente confiável.

## Dependências permitidas

- Associação Empresarial pode depender de Usuário e Empresa.
- Associação à Unidade pode depender de Associação Empresarial e Unidade.
- Composição do Perfil pode depender de Perfil de Acesso e Permissão.
- Atribuição de Perfil pode depender de Associação Empresarial e Perfil de Acesso.
- Sessão Organizacional pode depender de identidade autenticada e associação ativa.
- Auditoria pode utilizar identificadores do Core e contratos públicos dos demais módulos.
- O Core pode depender de contratos aprovados para autenticação, persistência, horário, comunicação e observabilidade.
- Os demais domínios podem depender somente dos contratos públicos do Core.

## Dependências proibidas

- O Core não pode depender da implementação interna de domínios operacionais.
- Usuário, Empresa e Unidade não podem incorporar regras específicas de oportunidades, veículos, vendas ou finanças.
- Um domínio não pode reproduzir cadastros próprios de empresas, unidades, usuários ou permissões.
- A interface não pode decidir sozinha se uma operação está autorizada.
- Autorização não pode confiar em contexto organizacional enviado pelo cliente sem validação.
- Credenciais, tokens e segredos não podem integrar os contratos de organização.
- Os contratos do Core não podem depender de React, Supabase ou componentes de interface.

## Fluxo de autenticação

1. O usuário apresenta sua credencial ao provedor de autenticação.
2. O provedor valida a credencial e emite uma sessão autenticada.
3. A plataforma valida a sessão em ambiente confiável.
4. A identidade externa é relacionada a um Usuário ativo do Core.
5. O Core recupera as associações empresariais ativas.
6. A empresa operacional é selecionada ou validada.
7. Uma unidade autorizada é selecionada quando o caso de uso exigir.
8. O Contexto Organizacional é formado e validado.
9. O resultado de autenticação é registrado conforme a política de segurança.

Autenticação identifica o usuário, mas não autoriza isoladamente uma operação de negócio.

## Fluxo de autorização

1. A operação recebe uma sessão autenticada válida.
2. O sistema identifica o Usuário do Core.
3. Valida usuário, empresa e associação empresarial.
4. Valida que a unidade pertence à empresa selecionada.
5. Valida a associação do usuário à unidade, quando exigida.
6. Identifica a permissão necessária para o caso de uso.
7. Resolve atribuições de perfil vigentes e compatíveis com o escopo.
8. Resolve as permissões concedidas pelos perfis.
9. Aplica as regras específicas do domínio da operação.
10. Autoriza ou recusa a ação e registra a decisão quando necessário.

Uma autorização válida resulta da identidade autenticada, da associação ativa, do contexto organizacional válido, do perfil vigente, do escopo compatível, da permissão requerida e das regras do domínio.

## Fluxo de auditoria

1. O caso de uso recebe o contexto autenticado e organizacional.
2. A autorização é validada.
3. O estado anterior relevante é capturado, quando aplicável.
4. A operação de negócio é executada.
5. O estado posterior relevante é capturado.
6. Um evento registra usuário, empresa, unidade, módulo, ação, recurso, momento, origem, correlação, resultado e alterações permitidas.
7. O registro é persistido de forma protegida contra alteração comum.
8. Falhas de auditoria em operações críticas seguem uma política explícita de bloqueio ou recuperação confiável.
9. O acesso aos registros de auditoria também exige autorização.

Segredos e dados pessoais desnecessários não devem ser copiados para a auditoria.

## Ordem de implementação aprovada

### Fase 1 — Contexto e isolamento organizacional

1. Empresa.
2. Unidade.
3. Invariantes de pertencimento e estado.
4. Contratos públicos do contexto organizacional.

### Fase 2 — Identidade

5. Usuário.
6. Identidade de Autenticação.
7. Correlação com o provedor.
8. Estados de ativação e bloqueio.

### Fase 3 — Participação organizacional

9. Associação Empresarial.
10. Associação à Unidade.
11. Convite de Acesso.
12. Seleção e validação da Sessão Organizacional.

### Fase 4 — Controle de acesso

13. Permissão.
14. Perfil de Acesso.
15. Composição do Perfil.
16. Atribuição de Perfil.
17. Resolução central de autorização.
18. Validação de escopo por empresa e unidade.

### Fase 5 — Auditoria

19. Contrato de evento auditável.
20. Registro de Auditoria.
21. Captura de contexto e correlação.
22. Proteção e consulta autorizada dos registros.
23. Política para falhas de auditoria.

### Fase 6 — Configuração e endurecimento

24. Configuração Organizacional.
25. Herança entre empresa e unidade.
26. Revogação e invalidação de acessos.
27. Validação do isolamento multiempresa.
28. Validação do acesso multiunidade.
29. Revisão de segurança e privilégio mínimo.
30. Estabilização dos contratos consumidos pelos demais domínios.

Esta Sprint implementa somente a documentação e os contratos iniciais de Empresa, Unidade e Contexto Organizacional. Banco de dados, autenticação, autorização, auditoria operacional, serviços e interface permanecem fora do escopo.
