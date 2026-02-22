-- Create authorized_users table
CREATE TABLE public.authorized_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  authorized BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create index for email lookups
CREATE INDEX authorized_users_email_idx ON public.authorized_users(email);

-- Enable RLS
ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read their own record
CREATE POLICY "authorized_users_read" ON public.authorized_users
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- Policy: Public can insert (for new signups)
CREATE POLICY "authorized_users_insert" ON public.authorized_users
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admin can update/delete
CREATE POLICY "authorized_users_admin_update" ON public.authorized_users
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'principal@berelvant.com');

CREATE POLICY "authorized_users_admin_delete" ON public.authorized_users
  FOR DELETE
  USING (auth.jwt() ->> 'email' = 'principal@berelvant.com');

-- Create admin user (principal@berelvant.com)
INSERT INTO public.authorized_users (email, authorized) 
VALUES ('principal@berelvant.com', true)
ON CONFLICT (email) DO NOTHING;
