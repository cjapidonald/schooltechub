-- Restrict profile visibility to owner or service role
DROP POLICY "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR auth.role() = 'service_role');
