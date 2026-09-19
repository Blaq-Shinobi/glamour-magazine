/* =====================================================================
   GLAMOUR — Supabase connection settings
   Fill these in after creating your Supabase project:
     Project Settings -> API -> Project URL, and the "anon public" key
   Both values below are safe to expose in client-side code — the
   database itself is protected by Row Level Security policies (see
   supabase-schema.sql), not by keeping this key secret.
   ===================================================================== */

const SUPABASE_URL = 'https://oovcbttsmuqhxxwvbywq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdmNidHRzbXVxaHh4d3ZieXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNTEzMDUsImV4cCI6MjEwMjgyNzMwNX0.cKyqTLSBW41UgqPZnDCGzsSmGcQQn00zWVtKZaigPs8';

const supabaseClient = (SUPABASE_URL.startsWith('http'))
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
