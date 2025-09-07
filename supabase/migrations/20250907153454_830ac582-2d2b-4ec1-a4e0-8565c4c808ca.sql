-- First check what booking types are allowed
SELECT enum_range(NULL::booking_type);