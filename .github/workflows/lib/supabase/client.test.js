// Unit tests for Supabase client singleton

require("../../../public/lib/supabase/client.js")

describe("Supabase Client", () => {
  beforeEach(() => {
    // Reset singleton instance
    global.supabaseClientInstance = null
  })

  describe("createSupabaseClient", () => {
    it("should create a Supabase client instance", () => {
      const client = window.createSupabaseClient()

      expect(client).toBeDefined()
      expect(client.from).toBeDefined()
      expect(client.auth).toBeDefined()
    })

    it("should return the same instance on subsequent calls (singleton)", () => {
      const client1 = window.createSupabaseClient()
      const client2 = window.createSupabaseClient()

      expect(client1).toBe(client2)
    })

    it("should configure auth with localStorage", () => {
      const client = window.createSupabaseClient()

      expect(window.supabase.createClient).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          auth: expect.objectContaining({
            storage: window.localStorage,
            storageKey: "integritest-supabase-auth",
            autoRefreshToken: true,
            persistSession: true,
          }),
        }),
      )
    })

    it("should handle missing Supabase CDN gracefully", () => {
      const originalSupabase = window.supabase
      window.supabase = undefined

      const client = window.createSupabaseClient()

      expect(client).toBeNull()
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Supabase CDN not loaded properly"))

      window.supabase = originalSupabase
    })
  })
})
