# Autenticação

## Objetivo

Identificar tecnicamente o usuário da Plataforma INATO por e-mail e senha usando Supabase Auth.

## Responsabilidades

Supabase Auth valida credenciais e mantém a sessão técnica. O Core Identidade continua responsável por perfil, organização e sessão organizacional conceitual. O Core não depende do Supabase.

Não existe cadastro público nem recuperação de senha nesta fase. Senhas não são armazenadas, registradas, devolvidas ou impressas pela aplicação; tokens permanecem sob responsabilidade do cliente oficial do Supabase e não integram os contratos do serviço.

## Sessão e auditoria

Durante a transição, o CRUD de Oportunidades não é bloqueado sem login. O evento continua registrado em memória com `usuarioId` nulo e não é persistido. Quando há usuário autenticado, seu UUID real é usado na persistência; perfil, empresa e unidade continuam vindo do contexto organizacional.

## Evolução futura

Persistir associações organizacionais, perfis e permissões, tornar a autenticação obrigatória após validação funcional, validar autorização no servidor e no banco e substituir a política transitória de empresa única por vínculos organizacionais reais.
