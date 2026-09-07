CREATE POLICY "Anyone can upload library images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'library-images');
CREATE POLICY "Anyone can read library images" ON storage.objects
  FOR SELECT USING (bucket_id = 'library-images');
CREATE POLICY "Admins can update library images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'library-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'library-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete library images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'library-images' AND public.has_role(auth.uid(), 'admin'));