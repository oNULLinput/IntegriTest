// Environment Configuration for Production Deployment
// This file provides environment variables for client-side JavaScript when deployed

window.ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "https://nsxuvuhrofqjyqunfzlk.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeHV2dWhyb2ZxanlxdW5memxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NDEwMjAsImV4cCI6MjA3NDIxNzAyMH0.iZ1imeqGu9V7bm2QdiXTWdmA18DkBBq9Rsa9aNAcMKw",
}

// Log configuration status
console.log("[v0] Environment configuration loaded:", {
  supabaseUrl: window.ENV.NEXT_PUBLIC_SUPABASE_URL,
  hasAnonKey: !!window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY,
})
