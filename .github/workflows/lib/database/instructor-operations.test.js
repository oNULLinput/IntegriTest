// Unit tests for instructor-operations.js

require("../../../public/lib/supabase/client.js")
require("../../../public/lib/database/instructor-operations.js")

describe("Instructor Operations", () => {
  let mockSupabase

  beforeEach(() => {
    mockSupabase = window.createSupabaseClient()
  })

  describe("authenticateInstructor", () => {
    it("should authenticate instructor with valid credentials", async () => {
      const mockInstructor = {
        id: "instructor-123",
        username: "testuser",
        password: "testpass",
        full_name: "Test User",
        email: "test@example.com",
      }

      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: mockInstructor,
        error: null,
      })

      const result = await window.instructorOperations.authenticateInstructor("testuser", "testpass")

      expect(result).toBeDefined()
      expect(result.username).toBe("testuser")
      expect(result.password).toBeUndefined() // Password should be excluded
    })

    it("should return null for invalid credentials", async () => {
      mockSupabase
        .from()
        .select()
        .eq()
        .eq()
        .single.mockResolvedValue({
          data: null,
          error: { code: "PGRST116" },
        })

      const result = await window.instructorOperations.authenticateInstructor("invalid", "invalid")

      expect(result).toBeNull()
    })

    it("should handle missing instructors table", async () => {
      mockSupabase
        .from()
        .select()
        .eq()
        .eq()
        .single.mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: 'relation "instructors" does not exist' },
        })

      const result = await window.instructorOperations.authenticateInstructor("testuser", "testpass")

      expect(result).toBeNull()
    })
  })

  describe("createInstructor", () => {
    it("should create new instructor", async () => {
      const instructorData = {
        username: "newuser",
        password: "newpass",
        full_name: "New User",
        email: "new@example.com",
      }

      localStorage.getItem.mockReturnValue("[]")

      const result = await window.instructorOperations.createInstructor(instructorData)

      expect(result).toBeDefined()
      expect(result.username).toBe("newuser")
      expect(result.password).toBeUndefined()
      expect(localStorage.setItem).toHaveBeenCalled()
    })
  })

  describe("getInstructor", () => {
    it("should retrieve instructor by ID", async () => {
      const mockInstructor = {
        id: "instructor-123",
        username: "testuser",
        password: "testpass",
        full_name: "Test User",
      }

      localStorage.getItem.mockReturnValue(JSON.stringify([mockInstructor]))

      const result = await window.instructorOperations.getInstructor("instructor-123")

      expect(result).toBeDefined()
      expect(result.username).toBe("testuser")
      expect(result.password).toBeUndefined()
    })

    it("should return null for non-existent instructor", async () => {
      localStorage.getItem.mockReturnValue("[]")

      const result = await window.instructorOperations.getInstructor("invalid-id")

      expect(result).toBeNull()
    })
  })

  describe("getInstructorStats", () => {
    it("should calculate instructor statistics", async () => {
      const mockExams = [
        { id: "exam-1", instructor_id: "instructor-123", is_active: true },
        { id: "exam-2", instructor_id: "instructor-123", is_active: false },
      ]

      const mockSessions = [
        { id: "session-1", exam_id: "exam-1", status: "active" },
        { id: "session-2", exam_id: "exam-1", status: "completed" },
      ]

      localStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockExams))
        .mockReturnValueOnce(JSON.stringify(mockSessions))

      const result = await window.instructorOperations.getInstructorStats("instructor-123")

      expect(result.total_exams).toBe(2)
      expect(result.active_exams).toBe(1)
      expect(result.total_sessions).toBe(2)
      expect(result.completed_sessions).toBe(1)
      expect(result.active_sessions).toBe(1)
    })
  })
})
