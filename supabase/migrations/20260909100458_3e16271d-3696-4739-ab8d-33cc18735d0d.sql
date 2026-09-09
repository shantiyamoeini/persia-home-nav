revoke execute on function public.has_role(uuid, public.app_role) from anon;
revoke execute on function public.is_agency_owner(uuid) from anon;
revoke execute on function public.current_agency_id() from anon;
revoke execute on function public.is_conversation_member(uuid) from anon;
revoke execute on function public.set_updated_at() from anon, authenticated;

alter default privileges in schema public revoke execute on functions from anon;