// Instructor Operations for IntegriTest System
// Handles all instructor-related database operations

window.instructorOperations = {
  // Authenticate instructor using Supabase
  async authenticateInstructor(username, password) {
    try {
      console.log("[v0] Authenticating instructor with Supabase:", username)

      if (!window.supabase) {
        console.error("[v0] Supabase client not initialized - check credentials in client.js")
        throw new Error("Supabase client not available")
      }

      console.log("[v0] Supabase client initialized, querying instructors table...")

      const { data: instructors, error } = await window.supabase
        .from("instructors")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single()

      if (error) {
        console.error("[v0] Supabase authentication error:", error)
        console.log("[v0] Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })

        if (error.code === "PGRST116" || error.message.includes('relation "instructors" does not exist')) {
          console.log("[v0] Instructors table doesn't exist. Please create the table first.")
          return null
        }

        return null
      }

      if (instructors) {
        console.log("[v0] Instructor authenticated successfully from Supabase:", instructors.username)
        // Don't return password in response
        const { password: _, ...instructorData } = instructors
        return instructorData
      }

      console.log("[v0] No instructor found in Supabase with provided credentials")
      return null
    } catch (error) {
      console.error("[v0] Error authenticating instructor:", error)
      console.log("[v0] Authentication failed. Please check your database connection and credentials.")
      return null
    }
  },

  // Create new instructor
  async createInstructor(instructorData) {
    try {
      console.log("[v0] Creating instructor:", instructorData.username)

      const instructor = {
        id: Date.now().toString(),
        username: instructorData.username,
        password: instructorData.password, // In real app, this should be hashed
        full_name: instructorData.full_name,
        email: instructorData.email,
        created_at: new Date().toISOString(),
      }

      const instructors = JSON.parse(localStorage.getItem("instructors") || "[]")
      instructors.push(instructor)
      localStorage.setItem("instructors", JSON.stringify(instructors))

      // Return without password
      const { password: _, ...instructorResponse } = instructor
      return instructorResponse
    } catch (error) {
      console.error("[v0] Error creating instructor:", error)
      throw error
    }
  },

  // Get instructor by ID
  async getInstructor(instructorId) {
    try {
      const instructors = JSON.parse(localStorage.getItem("instructors") || "[]")
      const instructor = instructors.find((i) => i.id === instructorId)

      if (instructor) {
        const { password: _, ...instructorData } = instructor
        return instructorData
      }

      return null
    } catch (error) {
      console.error("[v0] Error getting instructor:", error)
      return null
    }
  },

  // Update instructor
  async updateInstructor(instructorId, updateData) {
    try {
      const instructors = JSON.parse(localStorage.getItem("instructors") || "[]")
      const instructorIndex = instructors.findIndex((i) => i.id === instructorId)

      if (instructorIndex !== -1) {
        instructors[instructorIndex] = { ...instructors[instructorIndex], ...updateData }
        localStorage.setItem("instructors", JSON.stringify(instructors))

        const { password: _, ...instructorData } = instructors[instructorIndex]
        return instructorData
      }

      return null
    } catch (error) {
      console.error("[v0] Error updating instructor:", error)
      throw error
    }
  },

  // Delete instructor
  async deleteInstructor(instructorId) {
    try {
      const instructors = JSON.parse(localStorage.getItem("instructors") || "[]")
      const filteredInstructors = instructors.filter((i) => i.id !== instructorId)

      localStorage.setItem("instructors", JSON.stringify(filteredInstructors))
      return true
    } catch (error) {
      console.error("[v0] Error deleting instructor:", error)
      return false
    }
  },

  // Get instructor statistics
  async getInstructorStats(instructorId) {
    try {
      const exams = JSON.parse(localStorage.getItem("exams") || "[]")
      const sessions = JSON.parse(localStorage.getItem("examSessions") || "[]")

      const instructorExams = exams.filter((e) => e.instructor_id === instructorId)
      const examIds = instructorExams.map((e) => e.id)
      const instructorSessions = sessions.filter((s) => examIds.includes(s.exam_id))

      return {
        total_exams: instructorExams.length,
        active_exams: instructorExams.filter((e) => e.is_active).length,
        total_sessions: instructorSessions.length,
        completed_sessions: instructorSessions.filter((s) => s.status === "completed").length,
        active_sessions: instructorSessions.filter((s) => s.status === "active").length,
      }
    } catch (error) {
      console.error("[v0] Error getting instructor stats:", error)
      return {
        total_exams: 0,
        active_exams: 0,
        total_sessions: 0,
        completed_sessions: 0,
        active_sessions: 0,
      }
    }
  },
}

console.log("[v0] Instructor operations loaded successfully")
