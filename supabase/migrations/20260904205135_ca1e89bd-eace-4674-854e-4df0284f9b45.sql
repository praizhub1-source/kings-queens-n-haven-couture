
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

CREATE POLICY "store media read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'store-media');
CREATE POLICY "store media admin write" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'store-media' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'store-media' AND public.has_role(auth.uid(),'admin'));
