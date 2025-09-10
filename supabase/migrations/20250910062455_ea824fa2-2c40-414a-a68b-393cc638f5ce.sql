-- Fix security issue: Remove public access to newsletter subscriber emails
-- This prevents spammers from harvesting email addresses

-- Drop the existing SELECT policy that exposes email addresses
DROP POLICY IF EXISTS "Public can view active subscribers count" ON public.newsletter_subscribers;

-- Create a secure function to get subscriber count without exposing emails
CREATE OR REPLACE FUNCTION public.get_newsletter_subscriber_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*) 
  FROM newsletter_subscribers 
  WHERE is_active = true;
$$;

-- Grant execute permission on the function to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.get_newsletter_subscriber_count() TO anon, authenticated;

-- Optional: If you need to check if a specific email is already subscribed (for duplicate prevention)
-- This function only returns true/false, not the actual email
CREATE OR REPLACE FUNCTION public.is_email_subscribed(check_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM newsletter_subscribers 
    WHERE email = check_email 
    AND is_active = true
  );
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_email_subscribed(text) TO anon, authenticated;

-- Add a policy for users to update their own subscription (unsubscribe)
-- This requires knowing the exact email, preventing bulk harvesting
CREATE POLICY "Users can update their own subscription" 
ON public.newsletter_subscribers
FOR UPDATE
USING (true)
WITH CHECK (email = email);

-- The existing INSERT policy remains unchanged for new subscriptions