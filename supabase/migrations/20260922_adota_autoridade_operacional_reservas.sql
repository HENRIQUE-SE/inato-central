begin;

drop policy reservas_select_contexto on public.reservas;

create policy reservas_select_contexto on public.reservas
for select to authenticated
using (
  public.usuario_tem_acesso_territorial(
    reservas.unidade_id,
    reservas.empresa_id
  )
  and public.usuario_tem_permissao('reservas.visualizar')
);

create or replace function public.criar_reserva(
  p_negociacao_id uuid
)
returns public.reservas
language plpgsql
security definer
set search_path = ''
as $$
declare
  u uuid;
  n public.negociacoes%rowtype;
  v public.veiculos%rowtype;
  r public.reservas%rowtype;
  t timestamptz := now();
begin
  u := auth.uid();

  if u is null then
    raise exception 'Acesso não autorizado.';
  end if;

  select *
    into n
    from public.negociacoes
    where id = p_negociacao_id
    for update;

  if not found then
    raise exception 'Negociação não encontrada.';
  end if;

  if n.status <> 'em_andamento' then
    raise exception 'A negociação não pode ser reservada.';
  end if;

  select *
    into v
    from public.veiculos
    where id = n.veiculo_id
    for update;

  if not found
    or v.empresa_id <> n.empresa_id
    or v.unidade_id <> n.unidade_id
    or v.arquivado_em is not null
    or v.status <> 'disponivel'
  then
    raise exception 'O veículo não pode ser reservado.';
  end if;

  if not public.usuario_tem_acesso_territorial(v.unidade_id, v.empresa_id)
    or not public.usuario_tem_permissao('reservas.criar')
  then
    raise exception 'Acesso não autorizado.';
  end if;

  insert into public.reservas (
    empresa_id,
    unidade_id,
    negociacao_id,
    veiculo_id,
    criado_por_usuario_id,
    reservado_em,
    expira_em,
    atualizado_em
  ) values (
    v.empresa_id,
    v.unidade_id,
    n.id,
    v.id,
    u,
    t,
    t + interval '24 hours',
    t
  )
  returning * into r;

  update public.veiculos
    set status = 'reservado',
        atualizado_em = t
    where id = v.id
      and status = 'disponivel'
      and arquivado_em is null;

  if not found then
    raise exception 'O veículo não pode ser reservado.';
  end if;

  return r;
end;
$$;

create or replace function public.cancelar_reserva(
  p_reserva_id uuid,
  p_motivo text,
  p_motivo_detalhes text default null
)
returns public.reservas
language plpgsql
security definer
set search_path = ''
as $$
declare
  u uuid;
  r public.reservas%rowtype;
  t timestamptz := now();
  d text := nullif(btrim(p_motivo_detalhes), '');
begin
  u := auth.uid();

  if u is null then
    raise exception 'Acesso não autorizado.';
  end if;

  if p_motivo not in (
    'cliente_desistiu',
    'cliente_nao_compareceu',
    'credito_nao_aprovado',
    'cliente_comprou_outro',
    'proprietario_desistiu',
    'veiculo_indisponivel',
    'cancelado_pela_inato',
    'outro'
  ) then
    raise exception 'Motivo do cancelamento inválido.';
  end if;

  if p_motivo = 'outro' and (d is null or length(d) > 500) then
    raise exception 'Descrição do motivo inválida.';
  end if;

  if p_motivo <> 'outro' then
    d := null;
  end if;

  select *
    into r
    from public.reservas
    where id = p_reserva_id
    for update;

  if not found or r.status <> 'ativa' then
    raise exception 'A reserva não pode ser cancelada.';
  end if;

  if not public.usuario_tem_acesso_territorial(r.unidade_id, r.empresa_id)
    or not public.usuario_tem_permissao('reservas.cancelar')
  then
    raise exception 'Acesso não autorizado.';
  end if;

  update public.reservas
    set status = 'cancelada',
        motivo_cancelamento = p_motivo,
        motivo_cancelamento_detalhes = d,
        encerrado_em = t,
        atualizado_em = t
    where id = r.id
      and status = 'ativa'
    returning * into r;

  update public.veiculos
    set status = 'disponivel',
        atualizado_em = t
    where id = r.veiculo_id
      and status = 'reservado';

  return r;
end;
$$;

create or replace function public.expirar_reservas_vencidas()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.reservas%rowtype;
  q integer := 0;
  t timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'Acesso não autorizado.';
  end if;

  for r in
    select x.*
    from public.reservas x
    where x.status = 'ativa'
      and x.expira_em <= t
      and public.usuario_tem_acesso_territorial(x.unidade_id, x.empresa_id)
      and public.usuario_tem_permissao('reservas.visualizar')
    for update skip locked
  loop
    update public.reservas
      set status = 'expirada',
          encerrado_em = t,
          atualizado_em = t
      where id = r.id
        and status = 'ativa';

    if found then
      update public.veiculos
        set status = 'disponivel',
            atualizado_em = t
        where id = r.veiculo_id
          and status = 'reservado';

      insert into public.auditoria_eventos (
        id,
        empresa_id,
        unidade_id,
        usuario_id,
        modulo,
        acao,
        recurso_tipo,
        recurso_id,
        resultado,
        origem,
        detalhes
      ) values (
        gen_random_uuid(),
        r.empresa_id,
        r.unidade_id,
        auth.uid(),
        'reservas',
        'alterar',
        'reserva',
        r.id::text,
        'sucesso',
        'sistema',
        jsonb_build_object(
          'autoria', 'sistema',
          'motivo', 'expiracao_24_horas',
          'statusAnterior', 'ativa',
          'statusNovo', 'expirada',
          'expiraEm', r.expira_em
        )
      );

      q := q + 1;
    end if;
  end loop;

  return q;
end;
$$;

commit;
