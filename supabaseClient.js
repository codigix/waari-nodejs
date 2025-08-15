// supabaseClient.js
const { createClient } = require('@supabase/supabase-js');

// Use your Supabase project credentials
const SUPABASE_URL = 'https://vstrfntpedputoyymjkm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdHJmbnRwZWRwdXRveXltamttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjUxMzcsImV4cCI6MjA3MDY0MTEzN30.4tt1kIx6Zyh1iiZ1_5mIiVOMOCIUneKn3RGhAqVGLbE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
