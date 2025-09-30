import { VideoMonitor } from "../../../public/lib/monitoring/video-monitor.js"
import jest from "jest" // Import jest to fix the undeclared variable error

describe("VideoMonitor", () => {
  let videoMonitor
  let mockPeerManager

  beforeEach(() => {
    videoMonitor = new VideoMonitor()

    // Mock DOM elements
    document.body.innerHTML = `
      <div id="video-grid"></div>
      <div id="no-students"></div>
      <div id="active-students">0</div>
      <div id="violations-list"></div>
      <div id="total-violations">0</div>
      <button id="refresh-btn"></button>
    `

    // Mock PeerConnectionManager
    mockPeerManager = {
      initializeAsInstructor: jest.fn().mockResolvedValue(undefined),
      startSignalingPolling: jest.fn(),
      cleanup: jest.fn(),
    }

    window.PeerConnectionManager = jest.fn(() => mockPeerManager)

    localStorage.clear()
  })

  afterEach(() => {
    videoMonitor.cleanup()
  })

  describe("Initialization", () => {
    test("should initialize with exam code", async () => {
      await videoMonitor.initialize("EXAM123")

      expect(videoMonitor.examCode).toBe("EXAM123")
      expect(videoMonitor.isActive).toBe(true)
      expect(mockPeerManager.initializeAsInstructor).toHaveBeenCalledWith("EXAM123")
      expect(mockPeerManager.startSignalingPolling).toHaveBeenCalled()
    })

    test("should setup event listeners", async () => {
      const addEventListenerSpy = jest.spyOn(window, "addEventListener")

      await videoMonitor.initialize("EXAM123")

      expect(addEventListenerSpy).toHaveBeenCalledWith("studentStreamReceived", expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith("studentDisconnected", expect.any(Function))
    })
  })

  describe("Student Stream Management", () => {
    test("should handle new student stream", async () => {
      await videoMonitor.initialize("EXAM123")

      const mockStream = new MediaStream()
      videoMonitor.handleNewStudentStream("student-1", mockStream)

      expect(videoMonitor.studentStreams.has("student-1")).toBe(true)
      expect(videoMonitor.studentData.has("student-1")).toBe(true)
      expect(document.getElementById("active-students").textContent).toBe("1")
    })

    test("should handle student disconnection", async () => {
      await videoMonitor.initialize("EXAM123")

      const mockStream = new MediaStream()
      videoMonitor.handleNewStudentStream("student-1", mockStream)
      videoMonitor.handleStudentDisconnection("student-1")

      expect(videoMonitor.studentStreams.has("student-1")).toBe(false)
      expect(videoMonitor.studentData.has("student-1")).toBe(false)
      expect(document.getElementById("active-students").textContent).toBe("0")
    })

    test("should handle multiple students", async () => {
      await videoMonitor.initialize("EXAM123")

      const stream1 = new MediaStream()
      const stream2 = new MediaStream()

      videoMonitor.handleNewStudentStream("student-1", stream1)
      videoMonitor.handleNewStudentStream("student-2", stream2)

      expect(videoMonitor.studentStreams.size).toBe(2)
      expect(document.getElementById("active-students").textContent).toBe("2")
    })
  })

  describe("Student Info Generation", () => {
    test("should generate student info from localStorage", async () => {
      const sessions = [
        {
          student_number: "student-1",
          name: "John",
          surname: "Doe",
        },
      ]
      localStorage.setItem("examSessions", JSON.stringify(sessions))

      await videoMonitor.initialize("EXAM123")
      const info = videoMonitor.generateStudentInfo("student-1")

      expect(info.name).toBe("John")
      expect(info.surname).toBe("Doe")
      expect(info.studentNumber).toBe("student-1")
    })

    test("should generate fallback info for unknown student", async () => {
      await videoMonitor.initialize("EXAM123")
      const info = videoMonitor.generateStudentInfo("unknown-123")

      expect(info.name).toBe("Student")
      expect(info.studentNumber).toBe("unknown-123")
    })
  })

  describe("Video Grid Rendering", () => {
    test("should render video grid with students", async () => {
      await videoMonitor.initialize("EXAM123")

      const mockStream = new MediaStream()
      videoMonitor.handleNewStudentStream("student-1", mockStream)

      const videoGrid = document.getElementById("video-grid")
      expect(videoGrid.innerHTML).toContain("video-student-1")
      expect(videoGrid.innerHTML).toContain("student-1")
    })

    test("should show no students message when empty", async () => {
      await videoMonitor.initialize("EXAM123")

      videoMonitor.renderVideoGrid()

      const noStudents = document.getElementById("no-students")
      expect(noStudents.style.display).toBe("flex")
    })

    test("should apply correct grid class based on student count", async () => {
      await videoMonitor.initialize("EXAM123")

      expect(videoMonitor.getGridClass(1)).toBe("grid-1")
      expect(videoMonitor.getGridClass(2)).toBe("grid-2")
      expect(videoMonitor.getGridClass(4)).toBe("grid-4")
      expect(videoMonitor.getGridClass(6)).toBe("grid-6")
      expect(videoMonitor.getGridClass(9)).toBe("grid-9")
      expect(videoMonitor.getGridClass(12)).toBe("grid-12")
    })
  })

  describe("Violation Management", () => {
    test("should add violation to list", async () => {
      await videoMonitor.initialize("EXAM123")

      const violation = {
        type: "Face Not Detected",
        student: {
          name: "John",
          surname: "Doe",
          studentNumber: "12345",
        },
        message: "Face not visible in camera",
        timestamp: new Date().toISOString(),
      }

      videoMonitor.addViolation(violation)

      const violationsList = document.getElementById("violations-list")
      expect(violationsList.innerHTML).toContain("Face Not Detected")
      expect(violationsList.innerHTML).toContain("John")

      const totalCount = document.getElementById("total-violations")
      expect(totalCount.textContent).toBe("1")
    })

    test("should store violations in localStorage", async () => {
      await videoMonitor.initialize("EXAM123")

      const violation = {
        type: "Test Violation",
        student: { name: "Test", surname: "Student", studentNumber: "123" },
        message: "Test message",
        timestamp: new Date().toISOString(),
      }

      videoMonitor.addViolation(violation)

      const stored = JSON.parse(localStorage.getItem("sessionViolations"))
      expect(stored).toHaveLength(1)
      expect(stored[0].type).toBe("Test Violation")
    })
  })

  describe("Student Actions", () => {
    test("should flag student for attention", async () => {
      await videoMonitor.initialize("EXAM123")

      const mockStream = new MediaStream()
      videoMonitor.handleNewStudentStream("student-1", mockStream)

      const addViolationSpy = jest.spyOn(videoMonitor, "addViolation")
      videoMonitor.flagStudent("student-1")

      expect(addViolationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "Manual Flag",
        }),
      )
    })

    test("should focus on specific student", async () => {
      await videoMonitor.initialize("EXAM123")

      const mockStream = new MediaStream()
      videoMonitor.handleNewStudentStream("student-1", mockStream)
      videoMonitor.renderVideoGrid()

      videoMonitor.focusStudent("student-1")

      const studentTile = document.querySelector('[data-student-id="student-1"]')
      expect(studentTile.classList.contains("focused")).toBe(true)
    })
  })

  describe("Connection Refresh", () => {
    test("should refresh all connections", async () => {
      await videoMonitor.initialize("EXAM123")

      const mockStream = new MediaStream()
      videoMonitor.handleNewStudentStream("student-1", mockStream)

      await videoMonitor.refreshConnections()

      expect(videoMonitor.studentStreams.size).toBe(0)
      expect(mockPeerManager.cleanup).toHaveBeenCalled()
      expect(mockPeerManager.initializeAsInstructor).toHaveBeenCalledTimes(2)
    })
  })

  describe("Cleanup", () => {
    test("should cleanup all resources", async () => {
      await videoMonitor.initialize("EXAM123")

      const mockStream = new MediaStream()
      videoMonitor.handleNewStudentStream("student-1", mockStream)

      videoMonitor.cleanup()

      expect(videoMonitor.isActive).toBe(false)
      expect(videoMonitor.studentStreams.size).toBe(0)
      expect(mockPeerManager.cleanup).toHaveBeenCalled()
    })
  })
})
