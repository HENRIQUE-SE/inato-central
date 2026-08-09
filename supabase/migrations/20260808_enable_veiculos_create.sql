create unique index veiculos_oportunidade_nao_arquivado_unique
on public.veiculos (oportunidade_id)
where arquivado_em is null;

create policy veiculos_insert_contexto on public.veiculos
for insert to authenticated
with check (
  (select auth.uid()) is not null
  and exists (
    select 1
    from public.usuarios_perfis up
    join public.perfil_permissoes pp on pp.perfil_id = up.perfil_id
    join public.permissoes p on p.id = pp.permissao_id
    where up.usuario_id = (select auth.uid())
      and up.empresa_id = veiculos.empresa_id
      and up.unidade_id is not null
      and up.unidade_id = veiculos.unidade_id
      and up.ativo
      and p.codigo = 'oportunidades.criar'
  )
  and exists (
    select 1
    from public.oportunidades o
    where o.id = veiculos.oportunidade_id
  )
);
