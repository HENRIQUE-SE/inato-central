create or replace function public.proteger_campos_estruturais_veiculo()
returns trigger
language plpgsql
as $$
begin
  if old.id is distinct from new.id
    or old.empresa_id is distinct from new.empresa_id
    or old.unidade_id is distinct from new.unidade_id
    or old.oportunidade_id is distinct from new.oportunidade_id
    or old.status is distinct from new.status
    or old.criado_em is distinct from new.criado_em
    or old.arquivado_em is distinct from new.arquivado_em
  then
    raise exception 'Campos estruturais do veículo não podem ser alterados.';
  end if;

  return new;
end;
$$;

create trigger veiculos_proteger_campos_estruturais
before update on public.veiculos
for each row
execute function public.proteger_campos_estruturais_veiculo();

create policy veiculos_update_contexto on public.veiculos
for update to authenticated
using (
  veiculos.arquivado_em is null
  and (select auth.uid()) is not null
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
      and p.codigo = 'oportunidades.alterar'
  )
)
with check (
  veiculos.arquivado_em is null
  and (select auth.uid()) is not null
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
      and p.codigo = 'oportunidades.alterar'
  )
);
