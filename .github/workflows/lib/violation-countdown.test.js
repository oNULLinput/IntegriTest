import { ViolationCountdown } from "../../public/lib/violation-countdown.js"
import jest from "jest"

describe("ViolationCountdown", () => {
  let countdown

  beforeEach(() => {
    document.body.innerHTML = ""
    countdown = new ViolationCountdown()
    jest.useFakeTimers()
  })

  afterEach(() => {
    countdown.cleanup()
    jest.useRealTimers()
  })

  describe("Initialization", () => {
    test("should create countdown UI", () => {
      const overlay = document.getElementById("violation-countdown-overlay")
      expect(overlay).toBeTruthy()
      expect(overlay.classList.contains("hidden")).toBe(true)
    })

    test("should initialize with default values", () => {
      expect(countdown.countdownSeconds).toBe(7)
      expect(countdown.isCountdownActive).toBe(false)
      expect(countdown.currentViolations.size).toBe(0)
    })
  })

  describe("Violation Management", () => {
    test("should add violation", () => {
      countdown.addViolation("FACE_NOT_DETECTED", "Face not visible")

      expect(countdown.currentViolations.size).toBe(1)
      expect(countdown.currentViolations.has("FACE_NOT_DETECTED:Face not visible")).toBe(true)
    })

    test("should remove violation", () => {
      countdown.addViolation("FACE_NOT_DETECTED", "Face not visible")
      countdown.removeViolation("FACE_NOT_DETECTED", "Face not visible")

      expect(countdown.currentViolations.size).toBe(0)
    })

    test("should clear all violations", () => {
      countdown.addViolation("FACE_NOT_DETECTED", "Face not visible")
      countdown.addViolation("MULTIPLE_FACES", "Multiple faces detected")

      countdown.clearAllViolations()

      expect(countdown.currentViolations.size).toBe(0)
    })

    test("should handle multiple violations", () => {
      countdown.addViolation("FACE_NOT_DETECTED", "Face not visible")
      countdown.addViolation("MULTIPLE_FACES", "Multiple faces detected")

      expect(countdown.currentViolations.size).toBe(2)
    })
  })

  describe("Countdown Behavior", () => {
    test("should start countdown when violation added", () => {
      countdown.addViolation("FACE_NOT_DETECTED", "Face not visible")

      expect(countdown.isCountdownActive).toBe(true)

      const overlay = document.getElementById("violation-countdown-overlay")
      expect(overlay.classList.contains("hidden")).toBe(false)
    })

    test("should stop countdown when all violations cleared", () => {
      countdown.addViolation("FACE_NOT_DETECTED", "Face not visible")
      countdown.removeViolation("FACE_NOT_DETECTED", "Face not visible")

      expect(countdown.isCountdownActive).toBe(false)

      const overlay = document.getElementById("violation-countdown-overlay")
      expect(overlay.classList.contains("hidden")).toBe(true)
    })

    test("should countdown from 7 to 0", () => {
      countdown.addViolation("FACE_NOT_DETECTED", "Face not visible")

      expect(countdown.countdownSeconds).toBe(7)

      jest.advanceTimersByTime(1000)
      expect(countdown.countdownSeconds).toBe(6)

      jest.advanceTimersByTime(1000)
      expect(countdown.countdownSeconds).toBe(5)
    })

    test("should execute submission at 0", () => {
      const mockSubmit = jest.fn()
      countdown.onSubmit(mockSubmit)

      countdown.addViolation("FACE_NOT_DETECTED", "Face not visible")

      jest.advanceTimersByTime(7000)

      expect(mockSubmit).toHaveBeenCalled()
      expect(countdown.isCountdownActive).toBe(false)
    })

    test("should not restart countdown if already active", () => {
      countdown.addViolation("FACE_NOT_DETECTED", "Face not visible")

      const initialTimer = countdown.countdownTimer

      countdown.addViolation("MULTIPLE_FACES", "Multiple faces")

      expect(countdown.countdownTimer).toBe(initialTimer)
    })
  })

  describe("Display Updates", () => {
    test("should update countdown display", () => {
      countdown.addViolation("FACE_NOT_DETECTED", "Face not visible")

      const timerElement = document.getElementById("countdown-timer")
      expect(timerElement.textContent).toBe("7")

      jest.advanceTimersByTime(1000)
      expect(timerElement.textContent).toBe("6")
    })

    test("should update violation list display", () => {
      countdown.addViolation("FACE_NOT_DETECTED", "Face not visible")

      const violationList = document.getElementById("violation-list")
      expect(violationList.innerHTML).toContain("FACE NOT DETECTED")
      expect(violationList.innerHTML).toContain("Face not visible")
    })

    test("should show final warning at 3 seconds", () => {
      countdown.addViolation("FACE_NOT_DETECTED", "Face not visible")

      jest.advanceTimersByTime(4000) // Down to 3 seconds

      const messageElement = document.getElementById("countdown-message")
      expect(messageElement.textContent).toContain("FINAL WARNING")
    })
  })

  describe("Status Reporting", () => {
    test("should return accurate status", () => {
      countdown.addViolation("FACE_NOT_DETECTED", "Face not visible")

      const status = countdown.getStatus()

      expect(status.isCountdownActive).toBe(true)
      expect(status.remainingSeconds).toBe(7)
      expect(status.violationCount).toBe(1)
      expect(status.violations).toContain("FACE_NOT_DETECTED:Face not visible")
    })
  })

  describe("Submission Callback", () => {
    test("should call custom submission callback", () => {
      const mockCallback = jest.fn()
      countdown.onSubmit(mockCallback)

      countdown.addViolation("FACE_NOT_DETECTED", "Face not visible")
      jest.advanceTimersByTime(7000)

      expect(mockCallback).toHaveBeenCalled()
    })

    test("should fallback to global submitExam function", () => {
      window.submitExam = jest.fn()

      countdown.addViolation("FACE_NOT_DETECTED", "Face not visible")
      jest.advanceTimersByTime(7000)

      expect(window.submitExam).toHaveBeenCalledWith(true)
    })
  })

  describe("Cleanup", () => {
    test("should cleanup all resources", () => {
      countdown.addViolation("FACE_NOT_DETECTED", "Face not visible")

      countdown.cleanup()

      expect(countdown.countdownTimer).toBeNull()
      expect(countdown.currentViolations.size).toBe(0)
      expect(countdown.isCountdownActive).toBe(false)

      const overlay = document.getElementById("violation-countdown-overlay")
      expect(overlay).toBeNull()
    })
  })
})
