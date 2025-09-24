// Supabase Client Configuration for IntegriTest System
// Browser-compatible version using environment variables with singleton pattern

let supabaseClientInstance = null

window.createSupabaseClient = () => {
  // Return existing instance if already created
  if (supabaseClientInstance) {
    console.log("[v0] Returning existing Supabase client instance")
    return supabaseClientInstance
  }

  const SUPABASE_URL = "https://nsxuvuhrofqjyqunfzlk.supabase.co"
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeHV2dWhyb2ZxanlxdW5memxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NDEwMjAsImV4cCI6MjA3NDIxNzAyMH0.iZ1imeqGu9V7bm2QdiXTWdmA18DkBBq9Rsa9aNAcMKw"

  if (typeof window.supabase === "undefined" || typeof window.supabase.createClient !== "function") {
    console.error("[v0] Supabase CDN not loaded properly. Make sure the script tag is included.")
    return null
  }

  try {
    supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: window.localStorage,
        storageKey: "integritest-supabase-auth",
        autoRefreshToken: true,
        persistSession: true,
      },
    })

    console.log("[v0] Supabase client created successfully with singleton pattern")
    return supabaseClientInstance
  } catch (error) {
    console.error("[v0] Error creating Supabase client:", error)
    return null
  }
}

if (typeof window !== "undefined") {
  const initializeSupabase = () => {
    if (typeof window.supabase !== "undefined" && typeof window.supabase.createClient === "function") {
      window.supabaseClient = window.createSupabaseClient()
      if (window.supabaseClient) {
        console.log("[v0] Supabase client initialized successfully")
        // Test connection
        window.supabaseClient
          .from("exams")
          .select("count", { count: "exact", head: true })
          .then(() => console.log("[v0] Database connection verified"))
          .catch((err) => console.error("[v0] Database connection test failed:", err))
      }
    } else {
      console.error("[v0] Supabase CDN not available")
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeSupabase)
  } else {
    initializeSupabase()
  }
}
