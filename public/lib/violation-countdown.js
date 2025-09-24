// Violation Countdown System
// Manages 7-second countdown when violations are detected

class ViolationCountdown {
  constructor() {
    this.countdownTimer = null
    this.countdownSeconds = 7
    this.currentViolations = new Set()
    this.isCountdownActive = false
    this.onSubmitCallback = null

    // Create countdown UI
    this.createCountdownUI()

    console.log("[v0] ViolationCountdown system initialized")
  }

  createCountdownUI() {
    // Create countdown overlay
    const countdownOverlay = document.createElement("div")
    countdownOverlay.id = "violation-countdown-overlay"
    countdownOverlay.className = "violation-countdown-overlay hidden"
    countdownOverlay.innerHTML = `
      <div class="countdown-content">
        <div class="countdown-icon">⚠️</div>
        <div class="countdown-title">VIOLATION DETECTED</div>
        <div class="countdown-message" id="countdown-message">
          Please correct the violation to cancel auto-submission
        </div>
        <div class="countdown-timer" id="countdown-timer">7</div>
        <div class="countdown-subtitle">seconds until auto-submission</div>
        <div class="violation-list" id="violation-list"></div>
      </div>
    `

    document.body.appendChild(countdownOverlay)

    // Add styles
    this.addCountdownStyles()
  }

  addCountdownStyles() {
    const style = document.createElement("style")
    style.textContent = `
      .violation-countdown-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        transition: opacity 0.3s ease;
      }
      
      .violation-countdown-overlay.hidden {
        opacity: 0;
        pointer-events: none;
      }
      
      .countdown-content {
        background: #1a1a1a;
        border: 3px solid #ef4444;
        border-radius: 16px;
        padding: 2rem;
        text-align: center;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 40px rgba(239, 68, 68, 0.3);
        animation: pulse-border 1s infinite;
      }
      
      @keyframes pulse-border {
        0%, 100% { border-color: #ef4444; }
        50% { border-color: #dc2626; }
      }
      
      .countdown-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        animation: shake 0.5s infinite;
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      
      .countdown-title {
        font-size: 2rem;
        font-weight: bold;
        color: #ef4444;
        margin-bottom: 1rem;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      
      .countdown-message {
        font-size: 1.1rem;
        color: #ffffff;
        margin-bottom: 1.5rem;
        line-height: 1.4;
      }
      
      .countdown-timer {
        font-size: 6rem;
        font-weight: bold;
        color: #ef4444;
        margin: 1rem 0;
        text-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
        animation: countdown-pulse 1s infinite;
      }
      
      @keyframes countdown-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      
      .countdown-subtitle {
        font-size: 1.2rem;
        color: #ffffff;
        margin-bottom: 1.5rem;
      }
      
      .violation-list {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid #ef4444;
        border-radius: 8px;
        padding: 1rem;
        margin-top: 1rem;
        text-align: left;
      }
      
      .violation-item {
        color: #ffffff;
        margin-bottom: 0.5rem;
        padding: 0.5rem;
        background: rgba(239, 68, 68, 0.2);
        border-radius: 4px;
        font-size: 0.9rem;
      }
      
      .violation-item:last-child {
        margin-bottom: 0;
      }
      
      .violation-type {
        font-weight: bold;
        color: #ef4444;
        text-transform: uppercase;
        font-size: 0.8rem;
      }
    `
    document.head.appendChild(style)
  }

  addViolation(type, description) {
    const violationKey = `${type}:${description}`
    this.currentViolations.add(violationKey)

    console.log(`[v0] Violation added: ${violationKey}`)
    console.log(`[v0] Current violations:`, Array.from(this.currentViolations))

    this.updateViolationDisplay()

    if (!this.isCountdownActive) {
      this.startCountdown()
    }
  }

  removeViolation(type, description) {
    const violationKey = `${type}:${description}`
    this.currentViolations.delete(violationKey)

    console.log(`[v0] Violation removed: ${violationKey}`)
    console.log(`[v0] Current violations:`, Array.from(this.currentViolations))

    this.updateViolationDisplay()

    if (this.currentViolations.size === 0 && this.isCountdownActive) {
      this.stopCountdown()
    }
  }

  clearAllViolations() {
    this.currentViolations.clear()
    console.log("[v0] All violations cleared")

    if (this.isCountdownActive) {
      this.stopCountdown()
    }
  }

  updateViolationDisplay() {
    const violationList = document.getElementById("violation-list")
    if (!violationList) return

    if (this.currentViolations.size === 0) {
      violationList.innerHTML = '<div class="violation-item">No active violations</div>'
      return
    }

    const violationItems = Array.from(this.currentViolations)
      .map((violation) => {
        const [type, description] = violation.split(":")
        return `
        <div class="violation-item">
          <div class="violation-type">${type.replace(/_/g, " ")}</div>
          <div>${description}</div>
        </div>
      `
      })
      .join("")

    violationList.innerHTML = violationItems
  }

  startCountdown() {
    if (this.isCountdownActive) return

    console.log("[v0] Starting violation countdown")
    this.isCountdownActive = true
    this.countdownSeconds = 7

    // Show countdown overlay
    const overlay = document.getElementById("violation-countdown-overlay")
    if (overlay) {
      overlay.classList.remove("hidden")
    }

    // Update timer display
    this.updateCountdownDisplay()

    // Start countdown timer
    this.countdownTimer = setInterval(() => {
      this.countdownSeconds--
      this.updateCountdownDisplay()

      if (this.countdownSeconds <= 0) {
        this.executeSubmission()
      }
    }, 1000)
  }

  stopCountdown() {
    if (!this.isCountdownActive) return

    console.log("[v0] Stopping violation countdown - violations cleared")
    this.isCountdownActive = false

    // Clear timer
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
      this.countdownTimer = null
    }

    // Hide countdown overlay
    const overlay = document.getElementById("violation-countdown-overlay")
    if (overlay) {
      overlay.classList.add("hidden")
    }

    // Reset countdown
    this.countdownSeconds = 7
  }

  updateCountdownDisplay() {
    const timerElement = document.getElementById("countdown-timer")
    if (timerElement) {
      timerElement.textContent = this.countdownSeconds
    }

    // Update message based on remaining time
    const messageElement = document.getElementById("countdown-message")
    if (messageElement) {
      if (this.countdownSeconds <= 3) {
        messageElement.textContent = "FINAL WARNING: Correct violations immediately!"
        messageElement.style.color = "#ef4444"
        messageElement.style.fontWeight = "bold"
      } else {
        messageElement.textContent = "Please correct the violation to cancel auto-submission"
        messageElement.style.color = "#ffffff"
        messageElement.style.fontWeight = "normal"
      }
    }
  }

  executeSubmission() {
    console.log("[v0] Countdown reached zero - executing auto-submission")
    this.stopCountdown()

    // Call the submission callback if provided
    if (this.onSubmitCallback && typeof this.onSubmitCallback === "function") {
      this.onSubmitCallback()
    } else {
      // Fallback to global submitExam function
      if (typeof window.submitExam === "function") {
        window.submitExam(true) // true indicates auto-submission
      } else {
        console.error("[v0] No submission callback available")
        alert("Exam will be submitted due to violations")
      }
    }
  }

  // Set callback for when submission should occur
  onSubmit(callback) {
    this.onSubmitCallback = callback
  }

  // Get current violation status
  getStatus() {
    return {
      isCountdownActive: this.isCountdownActive,
      remainingSeconds: this.countdownSeconds,
      violationCount: this.currentViolations.size,
      violations: Array.from(this.currentViolations),
    }
  }

  // Cleanup
  cleanup() {
    console.log("[v0] Cleaning up ViolationCountdown")

    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
      this.countdownTimer = null
    }

    // Remove overlay
    const overlay = document.getElementById("violation-countdown-overlay")
    if (overlay) {
      overlay.remove()
    }

    this.currentViolations.clear()
    this.isCountdownActive = false
  }
}

// Export for global use
window.ViolationCountdown = ViolationCountdown
