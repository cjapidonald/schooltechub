-- Drop the retired worksheets table and related helper
DROP TABLE IF EXISTS public.worksheets CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at();
