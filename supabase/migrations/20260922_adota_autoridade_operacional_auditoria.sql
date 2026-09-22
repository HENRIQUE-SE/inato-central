begin;

drop policy auditoria_eventos_select_authenticated
on public.auditoria_eventos;

create policy auditoria_eventos_select_authenticated
on public.auditoria_eventos
for select
to authenticated
using (
  public.usuario_tem_acesso_territorial(
    auditoria_eventos.unidade_id,
    auditoria_eventos.empresa_id
  )
  and public.usuario_tem_permissao('auditoria.visualizar')
);

commit;
