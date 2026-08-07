-- Substitua somente o marcador de usuario_id abaixo pelo UUID real do usuário no Supabase Auth.
insert into public.usuarios_perfis (
  id,
  usuario_id,
  empresa_id,
  unidade_id,
  perfil_id,
  ativo
) values (
  gen_random_uuid(),
  '<UUID_DO_USUARIO_CONSULTOR>'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  '00000000-0000-4000-8000-000000000002'::uuid,
  '00000000-0000-4000-8000-000000001002'::uuid,
  true
);
