const { createClient } = require('@supabase/supabase-js');

// Temporarily hardcode for testing
const supabaseUrl = 'https://ipmsdfpxdueumisthrai.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbXNkZnB4ZHVldW1pc3RocmFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwOTIyNzAsImV4cCI6MjA3MjY2ODI3MH0.KdqZbMgdbcc__Xy5F-tjUr6j0cmPaidH4eku1mn40TA';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbXNkZnB4ZHVldW1pc3RocmFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA5MjI3MCwiZXhwIjoyMDcyNjY4MjcwfQ.NA39R82LZ6z40ryR1Sn_24_VoIBYa2NyZKvDz1sBxlk';

// Client for regular operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = {
  supabase,
  supabaseAdmin
};