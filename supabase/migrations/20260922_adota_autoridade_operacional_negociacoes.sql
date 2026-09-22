begin;

drop policy negociacoes_select_contexto on public.negociacoes;
drop policy negociacoes_insert_contexto on public.negociacoes;
drop policy negociacoes_update_contexto on public.negociacoes;

create policy negociacoes_select_contexto on public.negociacoes
for select to authenticated
using (
  public.usuario_tem_acesso_territorial(
    negociacoes.unidade_id,
    negociacoes.empresa_id
  )
  and public.usuario_tem_permissao('negociacoes.visualizar')
);

create policy negociacoes_insert_contexto on public.negociacoes
for insert to authenticated
with check (
  negociacoes.status = 'em_andamento'
  and negociacoes.encerrado_em is null
  and negociacoes.criado_por_usuario_id = (select auth.uid())
  and public.usuario_tem_acesso_territorial(
    negociacoes.unidade_id,
    negociacoes.empresa_id
  )
  and public.usuario_tem_permissao('negociacoes.criar')
  and exists (
    select 1
    from public.veiculos v
    where v.id = negociacoes.veiculo_id
      and v.empresa_id = negociacoes.empresa_id
      and v.unidade_id = negociacoes.unidade_id
      and v.status = 'disponivel'
      and v.arquivado_em is null
  )
);

create policy negociacoes_update_contexto on public.negociacoes
for update to authenticated
using (
  negociacoes.status = 'em_andamento'
  and public.usuario_tem_acesso_territorial(
    negociacoes.unidade_id,
    negociacoes.empresa_id
  )
  and public.usuario_tem_permissao('negociacoes.alterar')
)
with check (
  negociacoes.status = 'em_andamento'
  and public.usuario_tem_acesso_territorial(
    negociacoes.unidade_id,
    negociacoes.empresa_id
  )
  and public.usuario_tem_permissao('negociacoes.alterar')
);

create or replace function public.marcar_negociacao_convertida(
  p_negociacao_id uuid
)
returns public.negociacoes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid;
  v_negociacao public.negociacoes%rowtype;
begin
  v_usuario := auth.uid();

  if v_usuario is null then
    raise exception 'Acesso não autorizado.';
  end if;

  select n.*
    into v_negociacao
    from public.negociacoes n
    where n.id = p_negociacao_id
      and public.usuario_tem_acesso_territorial(
        n.unidade_id,
        n.empresa_id
      )
      and public.usuario_tem_permissao('negociacoes.encerrar')
    for update;

  if not found or v_negociacao.status <> 'em_andamento' then
    raise exception 'Negociação não pode ser encerrada.';
  end if;

  update public.negociacoes
    set status = 'convertida',
        encerrado_em = now(),
        atualizado_em = now()
    where id = p_negociacao_id
      and status = 'em_andamento'
    returning * into v_negociacao;

  if not found then
    raise exception 'Negociação não pode ser encerrada.';
  end if;

  return v_negociacao;
end;
$$;

create or replace function public.marcar_negociacao_perdida(
  p_negociacao_id uuid
)
returns public.negociacoes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid;
  v_negociacao public.negociacoes%rowtype;
begin
  v_usuario := auth.uid();

  if v_usuario is null then
    raise exception 'Acesso não autorizado.';
  end if;

  select n.*
    into v_negociacao
    from public.negociacoes n
    where n.id = p_negociacao_id
      and public.usuario_tem_acesso_territorial(
        n.unidade_id,
        n.empresa_id
      )
      and public.usuario_tem_permissao('negociacoes.encerrar')
    for update;

  if not found or v_negociacao.status <> 'em_andamento' then
    raise exception 'Negociação não pode ser encerrada.';
  end if;

  update public.negociacoes
    set status = 'perdida',
        encerrado_em = now(),
        atualizado_em = now()
    where id = p_negociacao_id
      and status = 'em_andamento'
    returning * into v_negociacao;

  if not found then
    raise exception 'Negociação não pode ser encerrada.';
  end if;

  return v_negociacao;
end;
$$;

create or replace function public.cancelar_negociacao(
  p_negociacao_id uuid
)
returns public.negociacoes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid;
  v_negociacao public.negociacoes%rowtype;
begin
  v_usuario := auth.uid();

  if v_usuario is null then
    raise exception 'Acesso não autorizado.';
  end if;

  select n.*
    into v_negociacao
    from public.negociacoes n
    where n.id = p_negociacao_id
      and public.usuario_tem_acesso_territorial(
        n.unidade_id,
        n.empresa_id
      )
      and public.usuario_tem_permissao('negociacoes.encerrar')
    for update;

  if not found or v_negociacao.status <> 'em_andamento' then
    raise exception 'Negociação não pode ser encerrada.';
  end if;

  update public.negociacoes
    set status = 'cancelada',
        encerrado_em = now(),
        atualizado_em = now()
    where id = p_negociacao_id
      and status = 'em_andamento'
    returning * into v_negociacao;

  if not found then
    raise exception 'Negociação não pode ser encerrada.';
  end if;

  return v_negociacao;
end;
$$;

commit;
