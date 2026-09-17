begin;

alter table public.operacoes
    add column empresa_id uuid null;

do $$
begin
    if exists (
        select up.operacao_id
        from public.usuarios_perfis up
        where up.operacao_id is not null
          and up.empresa_id is not null
        group by up.operacao_id
        having count(distinct up.empresa_id) > 1
    ) then
        raise exception
            'Backfill de operacoes.empresa_id abortado: uma Operação possui mais de uma Empresa histórica.';
    end if;
end
$$;

update public.operacoes op
set empresa_id = origem.empresa_id
from (
    select distinct
        up.operacao_id,
        up.empresa_id
    from public.usuarios_perfis up
    where up.operacao_id is not null
      and up.empresa_id is not null
) origem
where op.id = origem.operacao_id
  and op.empresa_id is null;

do $$
begin
    if exists (
        select 1
        from public.operacoes
        where empresa_id is null
    ) then
        raise exception
            'Backfill de operacoes.empresa_id abortado: existe Operação sem Empresa operacional persistida.';
    end if;
end
$$;

alter table public.operacoes
    alter column empresa_id set not null;

comment on column public.operacoes.empresa_id is
    'Empresa operacional explícita usada pelos registros vinculados à Operação; não implica igualdade com operacoes.id.';

commit;
