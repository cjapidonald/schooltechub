-- Secure SELECT access for newsletter subscribers
-- Drops any existing SELECT policies and replaces them with a service-role only policy

DO $$
DECLARE
  _policy record;
BEGIN
  FOR _policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'newsletter_subscribers'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.newsletter_subscribers', _policy.policyname);
  END LOOP;
END
$$;

CREATE POLICY "Service role can read newsletter subscribers"
ON public.newsletter_subscribers
FOR SELECT
USING (auth.role() = 'service_role');
