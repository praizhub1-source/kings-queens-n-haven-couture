REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_owner(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.guard_last_owner() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO authenticated, service_role;