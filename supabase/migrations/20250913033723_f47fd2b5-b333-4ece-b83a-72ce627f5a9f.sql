-- Fix security warning: Set search_path for all functions
ALTER FUNCTION update_updated_at_column() SET search_path = public;
ALTER FUNCTION update_events_updated_at() SET search_path = public;
ALTER FUNCTION update_updated_at() SET search_path = public;
ALTER FUNCTION get_newsletter_subscriber_count() SET search_path = public;
ALTER FUNCTION is_email_subscribed(text) SET search_path = public;