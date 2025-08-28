// Exam state variables
let currentExam = null
let currentQuestionIndex = 0
const answers = {}
let timeRemaining = 0
let timerInterval = null
let isExamActive = false
let violationCount = 0
let cameraStream = null
let cameraMonitoringActive = false
const cameraWarningTimeout = null
let warningCountdown = null
let isShowingFullScreenWarning = false
let cameraAbsenceTimer = null
let cameraAbsenceStartTime = null
const CAMERA_ABSENCE_LIMIT = 7000 // 7 seconds in milliseconds
let cameraCountdownInterval = null
let tabNotificationTimeout = null
let tabSwitchInProgress = false
let lastViolationTime = 0
const VIOLATION_COOLDOWN = 2000 // 2 seconds cooldown between violations

const multiplePersonTimer = null
const multiplePersonStartTime = null
const MULTIPLE_PERSON_LIMIT = 7000 // 7 seconds in milliseconds
let multiplePersonCountdownInterval = null

// Added flags to prevent multiple notifications
let isShowingCameraAbsenceNotification = false
let isShowingMultiplePersonNotification = false

// DOM elements
const examTitle = document.getElementById("exam-title")
const studentDetails = document.getElementById("student-details")
const timerDisplay = document.getElementById("timer")
const progressText = document.getElementById("progress-text")
const answeredCount = document.getElementById("answered-count")
const progressFill = document.getElementById("progress-fill")
const questionNumber = document.getElementById("question-number")
const questionText = document.getElementById("question-text")
const questionOptions = document.getElementById("question-options")
const prevBtn = document.getElementById("prev-btn")
const nextBtn = document.getElementById("next-btn")
const submitBtn = document.getElementById("submit-exam-btn")
const webcam = document.getElementById("webcam")
const cameraStatus = document.getElementById("camera-status")
const cameraNotification = document.getElementById("camera-notification")
const cameraCountdown = document.getElementById("camera-countdown")
const tabSwitchNotification = document.getElementById("tab-switch-notification")
const tabWarningTitle = document.getElementById("tab-warning-title")
const tabWarningMessage = document.getElementById("tab-warning-message")
const violationCountDisplay = document.getElementById("violation-count-display")

// Function to detect skin tone
function detectSkinTone(r, g, b) {
  // More strict skin tone detection to prevent false positives
  const isBasicSkin = r > 95 && g > 40 && b > 20 && Math.abs(r - g) > 15 && Math.abs(r - b) > 15 && g > b

  // Additional checks to ensure it's actually skin tone
  const skinRatio = r / Math.max(g, 1)
  const isValidSkinRatio = skinRatio > 1.1 && skinRatio < 2.5

  // Check for typical skin tone ranges
  const isInSkinRange = r > 120 && r < 255 && g > 80 && g < 200 && b > 60 && b < 180

  return isBasicSkin && isValidSkinRatio && isInSkinRange
}

// Function to detect clothing colors
function detectClothingColors(r, g, b) {
  const brightness = (r + g + b) / 3
  const colorVariance = Math.max(r, g, b) - Math.min(r, g, b)

  // Dark clothing - more restrictive
  if (brightness < 60 && colorVariance < 25 && Math.max(r, g, b) > 30) {
    return true
  }

  // Bright/colorful clothing - more restrictive
  if (brightness > 120 && colorVariance > 60 && Math.max(r, g, b) > 150) {
    return true
  }

  // White/light clothing - more restrictive
  if (r > 200 && g > 200 && b > 200 && colorVariance < 30) {
    return true
  }

  return false
}

// Function to detect hair colors
function detectHairColors(r, g, b) {
  // Black/dark brown hair - more restrictive
  if (r < 50 && g < 45 && b < 35 && Math.max(r, g, b) - Math.min(r, g, b) < 20) {
    return true
  }

  // Brown hair - more restrictive
  if (r > 90 && r < 140 && g > 60 && g < 110 && b > 40 && b < 80 && r > g && g > b) {
    return true
  }

  // Blonde hair - more restrictive
  if (r > 160 && g > 140 && b > 90 && r > g && g > b && r - b > 50) {
    return true
  }

  return false
}

// Function to show camera notification
function showCameraNotification(customMessage = null) {
  console.log("[v0] Camera violation detected - showing notification with countdown")
  const notification = document.getElementById("camera-notification")
  const countdownElement = document.getElementById("camera-countdown")
  const messageElement = notification.querySelector(".notification-message")

  // Update message if custom message provided
  if (customMessage && messageElement) {
    messageElement.textContent = customMessage
  }

  notification.classList.add("show")

  let countdown = 7
  countdownElement.textContent = countdown

  const isMultiplePersonViolation = customMessage && customMessage.includes("Multiple people")

  if (isMultiplePersonViolation && multiplePersonStartTime) {
    // Update countdown based on multiple person timer
    multiplePersonCountdownInterval = setInterval(() => {
      const elapsed = Date.now() - multiplePersonStartTime
      const remaining = Math.max(0, MULTIPLE_PERSON_LIMIT - elapsed)
      countdown = Math.ceil(remaining / 1000)
      countdownElement.textContent = countdown

      if (countdown <= 0) {
        clearInterval(multiplePersonCountdownInterval)
      }
    }, 1000)
  } else {
    // Use regular camera countdown
    cameraCountdownInterval = setInterval(() => {
      countdown--
      countdownElement.textContent = countdown

      if (countdown <= 0) {
        clearInterval(cameraCountdownInterval)
      }
    }, 1000)
  }

  const warningType = customMessage && customMessage.includes("Face not visible") ? "warning" : "warning"
  showMessage(`⚠️ ${customMessage || "Camera not detected. Please ensure your face is visible."}`, warningType)
}

// Function to hide camera notification
function hideCameraNotification() {
  console.log("[v0] Camera detected - hiding notification")
  const notification = document.getElementById("camera-notification")
  notification.classList.remove("show")

  // Reset notification flags when hiding
  isShowingCameraAbsenceNotification = false
  isShowingMultiplePersonNotification = false

  if (cameraCountdownInterval) {
    clearInterval(cameraCountdownInterval)
    cameraCountdownInterval = null
  }

  if (multiplePersonCountdownInterval) {
    clearInterval(multiplePersonCountdownInterval)
    multiplePersonCountdownInterval = null
  }
}

// Function to hide full screen warning
function hideFullScreenWarning() {
  if (isShowingFullScreenWarning) {
    const warningOverlay = document.getElementById("camera-warning-overlay")
    if (warningOverlay) {
      warningOverlay.classList.remove("show")
    }
    isShowingFullScreenWarning = false
    clearInterval(warningCountdown)
  }
}

// Initialize exam
document.addEventListener("DOMContentLoaded", () => {
  initializeExam()
  setupEventListeners()
  startCameraMonitoring()
  setupSecurityMonitoring()
})

function initializeExam() {
  console.log("[v0] Initializing exam...")

  // Load student and exam data
  const studentInfo = getStorageItem("studentInfo")
  const examData = getStorageItem("examData")

  if (!studentInfo || !examData) {
    alert("No exam data found. Redirecting to login...")
    window.location.href = "index.html"
    return
  }

  // Set exam data
  currentExam = examData
  timeRemaining = currentExam.duration * 60 // Convert to seconds
  isExamActive = true

  // Update UI
  examTitle.textContent = currentExam.title
  studentDetails.textContent = `Student: ${studentInfo.fullName} (${studentInfo.studentNumber})`

  // Initialize answers object
  currentExam.questions.forEach((q) => {
    answers[q.id] = null
  })

  // Start timer
  startTimer()

  // Load first question
  loadQuestion(0)

  // Create question indicators
  createQuestionIndicators()

  console.log("[v0] Exam initialized successfully")
}

function setupEventListeners() {
  // Navigation buttons
  prevBtn.addEventListener("click", () => navigateQuestion(-1))
  nextBtn.addEventListener("click", () => navigateQuestion(1))
  submitBtn.addEventListener("click", () => showSubmitModal())

  // Submit modal handlers
  document.getElementById("cancel-submit").addEventListener("click", hideSubmitModal)
  document.getElementById("confirm-submit").addEventListener("click", submitExam)
  document.getElementById("return-home").addEventListener("click", () => {
    window.location.href = "index.html"
  })

  // Prevent context menu and common shortcuts
  document.addEventListener("contextmenu", (e) => e.preventDefault())
  document.addEventListener("keydown", handleKeyPress)

  // Tab switching detection
  document.addEventListener("visibilitychange", handleVisibilityChange)
  window.addEventListener("blur", handleWindowBlur)
  window.addEventListener("focus", handleWindowFocus)
}

async function startCameraMonitoring() {
  try {
    console.log("[v0] Starting camera monitoring...")

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 320, height: 240 },
      audio: false,
    })

    webcam.srcObject = cameraStream
    cameraMonitoringActive = true

    updateCameraStatus("Camera active", "active")

    // Start face detection monitoring
    startCameraVisibilityMonitoring()

    console.log("[v0] Camera monitoring started successfully")
  } catch (error) {
    console.error("[v0] Camera access error:", error)
    updateCameraStatus("Camera unavailable", "error")

    // Continue exam without camera (for demo purposes)
    setTimeout(() => {
      updateCameraStatus("Proceeding without camera", "warning")
    }, 3000)
  }
}

function updateCameraStatus(message, status = "active") {
  const statusIndicator = document.querySelector(".status-indicator")
  const statusText = document.querySelector(".status-text")

  if (statusIndicator && statusText) {
    statusIndicator.className = `status-indicator ${status}`
    statusText.textContent = message
  }
}

async function startCameraVisibilityMonitoring() {
  if (!cameraStream) return

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  canvas.width = 160
  canvas.height = 120

  let consecutiveMisses = 0
  let consecutiveBodyOnly = 0
  const missThreshold = 3
  const bodyOnlyThreshold = 2
  const checkInterval = 800

  const monitorInterval = setInterval(() => {
    if (!isExamActive || !cameraMonitoringActive) {
      clearInterval(monitorInterval)
      return
    }

    try {
      ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      const detection = detectFaceInImage(imageData)
      const { faceDetected, bodyDetected, multiplePersonsDetected } = detection

      if (multiplePersonsDetected) {
        // Only show notification if not already showing
        if (!isShowingMultiplePersonNotification) {
          showCameraNotification("Multiple people detected - only one person allowed")
          isShowingMultiplePersonNotification = true
        }
        startMultiplePersonTimer()
        trackCameraAbsence("Multiple persons detected")

        // Reset other counters since this is a different violation
        consecutiveMisses = 0
        consecutiveBodyOnly = 0
        return
      } else {
        resetMultiplePersonTimer()
      }

      if (faceDetected) {
        // Face is properly detected
        consecutiveMisses = 0
        consecutiveBodyOnly = 0
        hideCameraNotification()
        hideFullScreenWarning()
        resetCameraAbsenceTimer()
      } else if (bodyDetected && !faceDetected) {
        // Body parts visible but no face - this is a violation
        consecutiveBodyOnly++

        if (consecutiveBodyOnly >= bodyOnlyThreshold) {
          // Only show notification if not already showing
          if (!isShowingCameraAbsenceNotification) {
            showCameraNotification("Face not visible - please position yourself properly")
            isShowingCameraAbsenceNotification = true
          }
          startCameraAbsenceTimer()
          trackCameraAbsence("Body visible but face not detected")
          consecutiveBodyOnly = 0
        }
      } else {
        // No human presence detected at all
        consecutiveMisses++

        if (consecutiveMisses >= missThreshold) {
          // Only show notification if not already showing
          if (!isShowingCameraAbsenceNotification) {
            showCameraNotification("Student not visible in camera")
            isShowingCameraAbsenceNotification = true
          }
          startCameraAbsenceTimer()

          if (consecutiveMisses >= missThreshold + 3) {
            showFullScreenWarning()
          }

          trackCameraAbsence("Not visible on camera")
          consecutiveMisses = 0
        }
      }
    } catch (error) {
      console.error("[v0] Camera monitoring error:", error)
    }
  }, checkInterval)
}

function startCameraAbsenceTimer() {
  if (cameraAbsenceTimer) return // Timer already running

  cameraAbsenceStartTime = Date.now()

  cameraAbsenceTimer = setTimeout(() => {
    console.log("[v0] Auto-submitting exam due to 7-second camera absence")
    showMessage("❌ Exam auto-submitted: Student not visible on camera for 7 seconds.", "error")
    setTimeout(() => {
      autoSubmitExam()
    }, 2000)
  }, CAMERA_ABSENCE_LIMIT)

  console.log("[v0] Camera absence timer started")
}

function resetCameraAbsenceTimer() {
  if (cameraAbsenceTimer) {
    clearTimeout(cameraAbsenceTimer)
    cameraAbsenceTimer = null
    cameraAbsenceStartTime = null
    // Reset notification flag when timer is reset
    isShowingCameraAbsenceNotification = false
    console.log("[v0] Camera absence timer reset")
  }
}

function trackCameraAbsence(reason) {
  if (window.IntegriTestUtils) {
    window.IntegriTestUtils.AnalyticsUtils.trackEvent("camera_absence", {
      reason,
      timeRemaining,
      questionIndex: currentQuestionIndex,
      timestamp: new Date().toISOString(),
    })
  }
}

function showFullScreenWarning() {
  if (isShowingFullScreenWarning) return

  isShowingFullScreenWarning = true
  const warningOverlay = document.getElementById("camera-warning-overlay")
  const countdownElement = document.getElementById("warning-countdown")

  if (warningOverlay) {
    warningOverlay.classList.add("show")

    let countdown = 10
    if (cameraAbsenceStartTime) {
      const elapsed = Date.now() - cameraAbsenceStartTime
      const remaining = Math.max(0, CAMERA_ABSENCE_LIMIT - elapsed)
      countdown = Math.ceil(remaining / 1000)
    }

    countdownElement.textContent = countdown

    warningCountdown = setInterval(() => {
      countdown--
      countdownElement.textContent = countdown

      if (countdown <= 0) {
        clearInterval(warningCountdown)
        // The auto-submit will be handled by the camera absence timer
      }
    }, 1000)
  }

  if (window.IntegriTestUtils) {
    window.IntegriTestUtils.AnalyticsUtils.trackEvent("severe_camera_warning", {
      reason: "Extended absence from camera view",
      timeRemaining,
      questionIndex: currentQuestionIndex,
    })
  }
}

function finishExam() {
  isExamActive = false

  // Stop timer
  if (timerInterval) {
    clearInterval(timerInterval)
  }

  resetCameraAbsenceTimer()
  resetMultiplePersonTimer()

  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop())
    cameraMonitoringActive = false
  }

  // Clear all warning timers and overlays
  hideFullScreenWarning()
  hideCameraNotification()

  // Calculate results
  const results = calculateResults()

  // Store results
  if (window.IntegriTestUtils) {
    window.IntegriTestUtils.StorageUtils.setItem("examResults", results)
    window.IntegriTestUtils.AnalyticsUtils.trackEvent("exam_completed", results)
  }

  // Show results
  showResults(results)
}

function setupSecurityMonitoring() {
  // Disable common shortcuts
  const disabledKeys = [
    "F12", // Developer tools
    "F5", // Refresh
    "F11", // Fullscreen
    "PrintScreen",
    "Insert",
  ]

  document.addEventListener("keydown", (e) => {
    // Disable Ctrl+Shift+I, Ctrl+U, Ctrl+S, etc.
    if (e.ctrlKey && (e.shiftKey || e.key === "u" || e.key === "s" || e.key === "r")) {
      e.preventDefault()
      triggerSwitchViolation("Attempted to use restricted shortcut")
    }

    // Disable Alt+Tab
    if (e.altKey && e.key === "Tab") {
      e.preventDefault()
      triggerSwitchViolation("Attempted to switch applications")
    }

    // Disable function keys
    if (disabledKeys.includes(e.key)) {
      e.preventDefault()
      triggerSwitchViolation("Attempted to use restricted key")
    }
  })
}

function handleVisibilityChange() {
  if (document.hidden && isExamActive && !tabSwitchInProgress) {
    tabSwitchInProgress = true
    triggerSwitchViolation("Tab switched or window minimized")
  } else if (!document.hidden && tabSwitchInProgress) {
    setTimeout(() => {
      tabSwitchInProgress = false
    }, 500) // Small delay to prevent immediate re-triggering
  }
}

function handleWindowBlur() {
  const currentTime = Date.now()
  if (isExamActive && !tabSwitchInProgress && currentTime - lastViolationTime > VIOLATION_COOLDOWN) {
    tabSwitchInProgress = true
    triggerSwitchViolation("Window lost focus")
  }
}

function handleWindowFocus() {
  if (isExamActive && tabSwitchInProgress) {
    showMessage("Please remain focused on the exam window", "warning")
    // Reset the flag after a short delay
    setTimeout(() => {
      tabSwitchInProgress = false
    }, 500)
  }
}

function triggerSwitchViolation(reason) {
  const currentTime = Date.now()
  if (currentTime - lastViolationTime < VIOLATION_COOLDOWN) {
    console.log("[v0] Violation ignored - too soon after last violation")
    return
  }

  violationCount++
  lastViolationTime = currentTime
  console.warn(`[v0] Security violation #${violationCount}: ${reason}`)

  showTabSwitchNotification(violationCount, reason)

  // Track violation
  if (window.IntegriTestUtils) {
    window.IntegriTestUtils.AnalyticsUtils.trackEvent("security_violation", {
      reason,
      violationCount,
      questionIndex: currentQuestionIndex,
      timeRemaining,
    })
  }
}

function showTabSwitchNotification(violationNumber, reason) {
  const notification = document.getElementById("tab-switch-notification")
  const titleElement = document.getElementById("tab-warning-title")
  const messageElement = document.getElementById("tab-warning-message")
  const countElement = document.getElementById("violation-count-display")

  // Clear existing classes
  notification.className = "tab-switch-notification"

  // Set content based on violation number
  if (violationNumber === 1) {
    notification.classList.add("warning-1")
    titleElement.textContent = "⚠️ First Warning: Tab Switching Detected"
    messageElement.textContent = "Please stay focused on the exam window. Switching tabs/windows is being monitored."
    countElement.textContent = "Warning 1 of 3"
    showMessage("⚠️ First Warning: Stay focused on the exam. Switching tabs/windows is monitored.", "warning")
  } else if (violationNumber === 2) {
    notification.classList.add("warning-2")
    titleElement.textContent = "🚨 Final Warning: Tab Switching Detected"
    messageElement.textContent = "One more violation will automatically submit your exam!"
    countElement.textContent = "Warning 2 of 3 - FINAL WARNING"
    showMessage("⚠️ Final Warning: One more violation will auto-submit your exam!", "error")
  } else if (violationNumber >= 3) {
    notification.classList.add("warning-3")
    titleElement.textContent = "❌ Exam Auto-Submitted"
    messageElement.textContent = "Multiple tab switching violations detected. Your exam has been submitted."
    countElement.textContent = "3 Violations - Auto-Submitted"
    showMessage("❌ Exam auto-submitted due to multiple tab switching violations.", "error")

    setTimeout(() => {
      autoSubmitExam()
    }, 2000)
  }

  // Show notification
  notification.classList.add("show")

  if (tabNotificationTimeout) {
    clearTimeout(tabNotificationTimeout)
  }

  if (violationNumber < 3) {
    tabNotificationTimeout = setTimeout(() => {
      notification.classList.remove("show")
    }, 4000)
  }
}

function handleKeyPress(e) {
  // Allow navigation with arrow keys
  if (e.key === "ArrowLeft" && !prevBtn.disabled) {
    navigateQuestion(-1)
  } else if (e.key === "ArrowRight" && !nextBtn.disabled) {
    navigateQuestion(1)
  }
}

function startTimer() {
  timerInterval = setInterval(() => {
    timeRemaining--

    if (timeRemaining <= 0) {
      timeRemaining = 0 // Prevent negative values
      updateTimerDisplay() // Update display to show 00:00
      clearInterval(timerInterval) // Stop the timer immediately
      autoSubmitExam()
      return
    }

    updateTimerDisplay()

    // Warning when 5 minutes remaining
    if (timeRemaining === 300) {
      showMessage("⏰ 5 minutes remaining!", "warning")
      timerDisplay.classList.add("warning")
    }
  }, 1000)

  updateTimerDisplay()
}

function updateTimerDisplay() {
  const displayTime = Math.max(0, timeRemaining)
  const minutes = Math.floor(displayTime / 60)
  const seconds = displayTime % 60
  timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

function loadQuestion(index) {
  if (index < 0 || index >= currentExam.questions.length) return

  currentQuestionIndex = index
  const question = currentExam.questions[index]

  // Update question display
  questionNumber.textContent = `Question ${index + 1}`
  questionText.textContent = question.question

  // Clear and populate options
  questionOptions.innerHTML = ""

  question.options.forEach((option, optionIndex) => {
    const optionDiv = document.createElement("div")
    optionDiv.className = "option-item"

    const isSelected = answers[question.id] === optionIndex
    if (isSelected) {
      optionDiv.classList.add("selected")
    }

    optionDiv.innerHTML = `
      <input type="radio" name="question-${question.id}" value="${optionIndex}" ${isSelected ? "checked" : ""}>
      <span class="option-text">${option}</span>
    `

    optionDiv.addEventListener("click", () => selectOption(question.id, optionIndex))
    questionOptions.appendChild(optionDiv)
  })

  // Update navigation buttons
  prevBtn.disabled = index === 0
  nextBtn.textContent = index === currentExam.questions.length - 1 ? "Review" : "Next"

  // Update progress
  updateProgress()
  updateQuestionIndicators()
}

function selectOption(questionId, optionIndex) {
  answers[questionId] = optionIndex

  // Update UI
  const options = document.querySelectorAll(".option-item")
  options.forEach((option, index) => {
    option.classList.toggle("selected", index === optionIndex)
    const radio = option.querySelector("input[type='radio']")
    radio.checked = index === optionIndex
  })

  updateProgress()
  updateQuestionIndicators()

  // Track answer
  if (window.IntegriTestUtils) {
    window.IntegriTestUtils.AnalyticsUtils.trackEvent("answer_selected", {
      questionId,
      optionIndex,
      timeRemaining,
    })
  }
}

function navigateQuestion(direction) {
  const newIndex = currentQuestionIndex + direction
  if (newIndex >= 0 && newIndex < currentExam.questions.length) {
    loadQuestion(newIndex)
  }
}

function createQuestionIndicators() {
  const indicatorsContainer = document.querySelector(".question-indicators")
  indicatorsContainer.innerHTML = ""

  currentExam.questions.forEach((question, index) => {
    const indicator = document.createElement("button")
    indicator.className = "question-indicator"
    indicator.textContent = index + 1
    indicator.addEventListener("click", () => loadQuestion(index))
    indicatorsContainer.appendChild(indicator)
  })
}

function updateQuestionIndicators() {
  const indicators = document.querySelectorAll(".question-indicator")
  indicators.forEach((indicator, index) => {
    indicator.classList.remove("current", "answered")

    if (index === currentQuestionIndex) {
      indicator.classList.add("current")
    }

    const questionId = currentExam.questions[index].id
    if (answers[questionId] !== null) {
      indicator.classList.add("answered")
    }
  })
}

function updateProgress() {
  const answeredQuestions = Object.values(answers).filter((answer) => answer !== null).length
  const totalQuestions = currentExam.questions.length
  const progressPercentage = (answeredQuestions / totalQuestions) * 100

  progressText.textContent = `Question ${currentQuestionIndex + 1} of ${totalQuestions}`
  answeredCount.textContent = `${answeredQuestions} answered`
  progressFill.style.width = `${progressPercentage}%`
}

function showSubmitModal() {
  const unansweredCount = Object.values(answers).filter((answer) => answer === null).length
  document.getElementById("unanswered-count").textContent = unansweredCount
  document.getElementById("submit-modal").classList.add("show")
}

function hideSubmitModal() {
  document.getElementById("submit-modal").classList.remove("show")
}

function submitExam() {
  hideSubmitModal()
  finishExam()
}

function autoSubmitExam() {
  console.log("[v0] Auto-submitting exam...")
  finishExam()
}

function calculateResults() {
  let correctAnswers = 0
  const totalQuestions = currentExam.questions.length

  currentExam.questions.forEach((question) => {
    const userAnswer = answers[question.id]
    if (userAnswer === question.correct) {
      correctAnswers++
    }
  })

  const score = Math.round((correctAnswers / totalQuestions) * 100)
  const timeTaken = currentExam.duration - Math.floor(timeRemaining / 60)

  return {
    score,
    correctAnswers,
    totalQuestions,
    timeTaken,
    violationCount,
    completedAt: new Date().toISOString(),
  }
}

function showResults(results) {
  document.getElementById("score-percentage").textContent = `${results.score}%`
  document.getElementById("correct-count").textContent = results.correctAnswers
  document.getElementById("total-questions").textContent = results.totalQuestions
  document.getElementById("time-taken").textContent = `${results.timeTaken} minutes`

  document.getElementById("results-modal").classList.add("show")
}

function showMessage(message, type = "info") {
  if (window.IntegriTestUtils) {
    window.IntegriTestUtils.UIUtils.showMessage(message, type)
  } else {
    alert(message)
  }
}

function getStorageItem(key) {
  if (window.IntegriTestUtils) {
    return window.IntegriTestUtils.StorageUtils.getItem(key)
  } else {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  }
}

function detectFaceInImage(imageData) {
  const { data, width, height } = imageData
  let skinPixels = 0
  let faceRegionPixels = 0
  let bodyRegionPixels = 0
  let brightPixels = 0
  let totalPixels = 0
  let validHumanPixels = 0
  let movementPixels = 0

  const faceRegions = [] // Track multiple face regions

  const centerX = width / 2
  const centerY = height / 2
  const faceRegionSize = Math.min(width, height) * 0.3
  const bodyRegionSize = Math.min(width, height) * 0.55

  const quadrants = [
    { x: 0, y: 0, w: width / 2, h: height / 2, name: "top-left" },
    { x: width / 2, y: 0, w: width / 2, h: height / 2, name: "top-right" },
    { x: 0, y: height / 2, w: width / 2, h: height / 2, name: "bottom-left" },
    { x: width / 2, y: height / 2, w: width / 2, h: height / 2, name: "bottom-right" },
  ]

  const quadrantFaces = quadrants.map(() => ({ skinPixels: 0, facePixels: 0, humanPixels: 0 }))

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      totalPixels++

      // Check brightness with stricter criteria
      const brightness = (r + g + b) / 3
      if (brightness > 60 && brightness < 240) {
        brightPixels++
      }

      // More strict human presence detection
      const isSkin = detectSkinTone(r, g, b)
      const isClothing = detectClothingColors(r, g, b)
      const isHair = detectHairColors(r, g, b)

      const isValidHumanPresence = isSkin || (isClothing && brightness > 40) || (isHair && brightness > 20)

      if (isSkin) {
        skinPixels++

        const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))

        // Face region (center area) - stricter
        if (distanceFromCenter < faceRegionSize) {
          faceRegionPixels++
        }

        // Body region (larger area)
        if (distanceFromCenter < bodyRegionSize) {
          bodyRegionPixels++
        }

        quadrants.forEach((quad, index) => {
          if (x >= quad.x && x < quad.x + quad.w && y >= quad.y && y < quad.y + quad.h) {
            quadrantFaces[index].skinPixels++
            if (distanceFromCenter < faceRegionSize) {
              quadrantFaces[index].facePixels++
            }
            if (isValidHumanPresence) {
              quadrantFaces[index].humanPixels++
            }
          }
        })
      }

      // Count valid human presence pixels
      if (isValidHumanPresence) {
        validHumanPixels++

        quadrants.forEach((quad, index) => {
          if (x >= quad.x && x < quad.x + quad.w && y >= quad.y && y < quad.y + quad.h) {
            quadrantFaces[index].humanPixels++
          }
        })

        // Only count as movement if it's significant
        if (brightness > 50 && brightness < 220) {
          movementPixels++
        }
      }
    }
  }

  const skinPercentage = skinPixels / totalPixels
  const faceRegionPercentage = faceRegionPixels / Math.max(skinPixels, 1)
  const bodyRegionPercentage = bodyRegionPixels / Math.max(skinPixels, 1)
  const brightnessRatio = brightPixels / totalPixels
  const presencePercentage = validHumanPixels / totalPixels

  const activeFaceQuadrants = quadrantFaces.filter((quad, index) => {
    const hasSignificantSkin = quad.skinPixels > 25 // Reduced from 40 to detect multiple faces better
    const hasSignificantHuman = quad.humanPixels > 50 // Reduced from 80
    const hasFaceFeatures = quad.facePixels > 15 // Reduced from 25
    const hasConcentratedPresence = quad.skinPixels > 30 && quad.facePixels > 20 // Reduced thresholds

    const isActive = hasSignificantSkin && hasSignificantHuman && hasFaceFeatures && hasConcentratedPresence

    if (isActive) {
      console.log(
        `[v0] Active quadrant ${quadrants[index].name}: skin=${quad.skinPixels}, human=${quad.humanPixels}, face=${quad.facePixels}`,
      )
    }

    return isActive
  }).length

  const leftSideActivity = quadrantFaces[0].humanPixels + quadrantFaces[2].humanPixels // Left quadrants
  const rightSideActivity = quadrantFaces[1].humanPixels + quadrantFaces[3].humanPixels // Right quadrants
  const topActivity = quadrantFaces[0].humanPixels + quadrantFaces[1].humanPixels // Top quadrants
  const bottomActivity = quadrantFaces[2].humanPixels + quadrantFaces[3].humanPixels // Bottom quadrants

  const hasLeftRightSplit =
    leftSideActivity > 80 && rightSideActivity > 80 && Math.abs(leftSideActivity - rightSideActivity) < 100 // Reduced thresholds for multiple face detection
  const hasTopBottomSplit = topActivity > 100 && bottomActivity > 100 && Math.abs(topActivity - bottomActivity) < 120 // Reduced thresholds
  const hasWideSpread = hasLeftRightSplit || hasTopBottomSplit // Changed to OR - either condition indicates multiple faces

  const multiplePersonsDetected = activeFaceQuadrants >= 2 && hasWideSpread // Reduced from 3 to 2 for better detection

  if (multiplePersonsDetected) {
    console.log(
      `[v0] Multiple faces detected! Active quadrants: ${activeFaceQuadrants}, leftRight: ${hasLeftRightSplit}, topBottom: ${hasTopBottomSplit}`,
    )
  }

  // Enhanced face detection criteria to work with multiple faces
  const hasEnoughSkin = skinPercentage > 0.03 // Further reduced for multiple face scenarios
  const hasConcentratedFace = faceRegionPercentage > 0.2 // Reduced for multiple faces
  const hasGoodLighting = brightnessRatio > 0.2 && brightnessRatio < 0.95
  const hasMinimumFacePixels = faceRegionPixels > 10 // Reduced for multiple faces
  const hasValidSkinDistribution = skinPixels > 20 // Reduced for multiple faces

  // More lenient body/presence detection criteria
  const hasBodyPresence = bodyRegionPixels > 25 && presencePercentage > 0.06 // Reduced thresholds
  const hasSignificantPresence = movementPixels > 40 && validHumanPixels > 60 // Reduced thresholds

  const faceDetected =
    hasEnoughSkin && hasConcentratedFace && hasGoodLighting && hasMinimumFacePixels && hasValidSkinDistribution

  // Body detection requires significant presence
  const bodyDetected = (hasBodyPresence || hasSignificantPresence) && presencePercentage > 0.05 // Reduced from 0.06

  // More lenient minimum presence check for multiple person detection
  if (validHumanPixels < 30 || presencePercentage < 0.03) {
    // Reduced thresholds
    return {
      faceDetected: false,
      bodyDetected: false,
      multiplePersonsDetected: false,
      faceCount: 0,
      skinPercentage,
      presencePercentage,
    }
  }

  let estimatedFaceCount = 1
  if (multiplePersonsDetected) {
    if (activeFaceQuadrants >= 4) {
      estimatedFaceCount = Math.min(4, Math.ceil(activeFaceQuadrants / 1.5))
    } else if (activeFaceQuadrants >= 3) {
      estimatedFaceCount = 3
    } else if (activeFaceQuadrants >= 2) {
      estimatedFaceCount = 2
    }
  }

  return {
    faceDetected,
    bodyDetected,
    multiplePersonsDetected,
    faceCount: estimatedFaceCount,
    skinPercentage,
    presencePercentage,
    activeFaceQuadrants,
    leftSideActivity,
    rightSideActivity,
  }
}

function startMultiplePersonTimer() {
  // Multiple person detection is now informational, not a violation
  console.log("[v0] Multiple faces detected - monitoring continues")

  // Update UI to show multiple face detection status
  const statusElement = document.querySelector(".monitoring-status")
  if (statusElement) {
    statusElement.textContent = `Multiple faces detected (2 people)`
    statusElement.className = "monitoring-status info" // Changed from error to info
  }
}

function resetMultiplePersonTimer() {
  // Reset multiple person timer logic here
  console.log("[v0] Resetting multiple person timer")
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  resetCameraAbsenceTimer()
  resetMultiplePersonTimer()

  if (cameraCountdownInterval) {
    clearInterval(cameraCountdownInterval)
  }

  if (multiplePersonCountdownInterval) {
    clearInterval(multiplePersonCountdownInterval)
  }

  if (tabNotificationTimeout) {
    clearTimeout(tabNotificationTimeout)
  }

  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop())
  }
})

console.log("[v0] Exam script loaded successfully")
