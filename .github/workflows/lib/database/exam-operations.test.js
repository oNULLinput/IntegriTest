// Unit tests for exam-operations.js

// Load the module
require("../../../public/lib/supabase/client.js")
require("../../../public/lib/database/exam-operations.js")

describe("Exam Operations", () => {
  let mockSupabase

  beforeEach(() => {
    mockSupabase = window.createSupabaseClient()
  })

  describe("createExam", () => {
    it("should create an exam with valid data", async () => {
      const examData = {
        title: "Test Exam",
        description: "Test Description",
        duration: 60,
        instructor_id: "instructor-123",
        questions: [
          {
            question: "What is 2+2?",
            type: "multiple-choice",
            options: ["2", "3", "4", "5"],
            correctAnswer: "4",
            points: 1,
          },
        ],
      }

      const mockExamResult = {
        id: "exam-123",
        ...examData,
        exam_code: "ABC123",
        is_active: true,
      }

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockExamResult,
        error: null,
      })

      const result = await window.examOperations.createExam(examData)

      expect(result).toBeDefined()
      expect(result.exam_code).toBeDefined()
      expect(result.exam_code).toHaveLength(6)
      expect(mockSupabase.from).toHaveBeenCalledWith("exams")
    })

    it("should normalize question data correctly", async () => {
      const examData = {
        title: "Test Exam",
        description: "Test",
        duration: 60,
        instructor_id: "instructor-123",
        questions: [
          {
            question_text: "Question 1",
            question_type: "multiple-choice",
            options: ["A", "B", "C", "D"],
            correct_answer: "A",
            points: 2,
          },
        ],
      }

      mockSupabase
        .from()
        .insert()
        .select()
        .single.mockResolvedValue({
          data: { ...examData, id: "exam-123", exam_code: "TEST01" },
          error: null,
        })

      const result = await window.examOperations.createExam(examData)

      expect(result).toBeDefined()
    })

    it("should handle database errors", async () => {
      const examData = {
        title: "Test Exam",
        description: "Test",
        duration: 60,
        instructor_id: "instructor-123",
        questions: [],
      }

      mockSupabase
        .from()
        .insert()
        .select()
        .single.mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        })

      await expect(window.examOperations.createExam(examData)).rejects.toThrow()
    })
  })

  describe("getExamByCode", () => {
    it("should retrieve exam by exact code match", async () => {
      const mockExam = {
        id: "exam-123",
        exam_code: "ABC123",
        title: "Test Exam",
        is_active: true,
      }

      mockSupabase
        .from()
        .select()
        .eq.mockResolvedValue({
          data: [mockExam],
          error: null,
        })

      const result = await window.examOperations.getExamByCode("ABC123")

      expect(result).toEqual(mockExam)
      expect(mockSupabase.from).toHaveBeenCalledWith("exams")
    })

    it("should throw error for inactive exam", async () => {
      const mockExam = {
        id: "exam-123",
        exam_code: "ABC123",
        title: "Test Exam",
        is_active: false,
      }

      mockSupabase
        .from()
        .select()
        .eq.mockResolvedValue({
          data: [mockExam],
          error: null,
        })

      await expect(window.examOperations.getExamByCode("ABC123")).rejects.toThrow("inactive")
    })

    it("should throw error for non-existent exam code", async () => {
      mockSupabase.from().select().eq.mockResolvedValue({
        data: [],
        error: null,
      })

      mockSupabase.from().select().ilike.mockResolvedValue({
        data: [],
        error: null,
      })

      mockSupabase.from().select().limit.mockResolvedValue({
        data: [],
        error: null,
      })

      await expect(window.examOperations.getExamByCode("INVALID")).rejects.toThrow("not found")
    })
  })

  describe("createExamSession", () => {
    it("should create exam session with valid data", async () => {
      const studentInfo = {
        fullName: "John Doe",
        studentNumber: "STU123",
      }

      const mockSession = {
        id: "session-123",
        exam_id: "exam-123",
        student_name: "John Doe",
        student_number: "STU123",
        status: "active",
      }

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockSession,
        error: null,
      })

      const result = await window.examOperations.createExamSession("exam-123", studentInfo)

      expect(result).toEqual(mockSession)
      expect(localStorage.setItem).toHaveBeenCalledWith("currentSession", JSON.stringify(mockSession))
    })

    it("should throw error for missing exam ID", async () => {
      const studentInfo = {
        fullName: "John Doe",
        studentNumber: "STU123",
      }

      await expect(window.examOperations.createExamSession(null, studentInfo)).rejects.toThrow("Exam ID is required")
    })

    it("should throw error for incomplete student info", async () => {
      const studentInfo = {
        fullName: "John Doe",
      }

      await expect(window.examOperations.createExamSession("exam-123", studentInfo)).rejects.toThrow(
        "Complete student information",
      )
    })
  })

  describe("submitExam", () => {
    it("should submit exam answers successfully", async () => {
      const answers = { q1: "A", q2: "B" }
      const mockUpdatedSession = {
        id: "session-123",
        answers,
        status: "completed",
      }

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: mockUpdatedSession,
        error: null,
      })

      const result = await window.examOperations.submitExam("session-123", answers)

      expect(result).toEqual(mockUpdatedSession)
      expect(mockSupabase.from).toHaveBeenCalledWith("exam_sessions")
    })
  })

  describe("recordViolation", () => {
    it("should record violation successfully", async () => {
      const existingSession = {
        violations: [{ type: "face_not_detected", timestamp: "2024-01-01" }],
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: existingSession,
        error: null,
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null,
      })

      const result = await window.examOperations.recordViolation("session-123", "multiple_people", "Two faces detected")

      expect(result).toBe(true)
    })

    it("should handle errors gracefully", async () => {
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: null,
          error: { message: "Session not found" },
        })

      const result = await window.examOperations.recordViolation("invalid-session", "test", "test")

      expect(result).toBe(false)
    })
  })
})
