// Dashboard state management
let instructorSession = null
const dashboardData = {
  activeExams: 1,
  studentsOnline: 0,
  totalSubmissions: 0,
  securityAlerts: 0,
  recentActivity: [],
}

// Sample exam data
const SAMPLE_EXAM_DATA = {
  code: "1234",
  title: "Introduction to Computer Science",
  duration: 30,
  questions: 3,
  studentsEnrolled: 0,
  completedSubmissions: 0,
  status: "active",
  createdAt: new Date().toISOString(),
}

const SAMPLE_STUDENT_RESULTS = [
  { surname: "Doe", firstName: "John", studentId: "21-12345", score: 85 },
  { surname: "Smith", firstName: "Jane", studentId: "21-12346", score: 92 },
  { surname: "Johnson", firstName: "Mike", studentId: "21-12347", score: 78 },
  { surname: "Brown", firstName: "Sarah", studentId: "21-12348", score: 95 },
  { surname: "Davis", firstName: "Alex", studentId: "21-12349", score: 88 },
  { surname: "Wilson", firstName: "Emma", studentId: "21-12350", score: 91 },
  { surname: "Anderson", firstName: "Chris", studentId: "21-12351", score: 82 },
  { surname: "Taylor", firstName: "Lisa", studentId: "21-12352", score: 89 },
]

const monitoringState = {
  isMonitoring: false,
  currentExamCode: null,
  connectedStudents: new Map(),
  monitoringInterval: null,
  audioEnabled: false,
}

const DEMO_STUDENTS = []

// DOM elements
const instructorNameEl = document.getElementById("instructor-name")
const logoutBtn = document.getElementById("logout-btn")
const activeExamsCount = document.getElementById("active-exams-count")
const studentsOnlineCount = document.getElementById("students-online-count")
const totalSubmissionsCount = document.getElementById("total-submissions-count")
const securityAlertsCount = document.getElementById("security-alerts-count")
const activityFeed = document.getElementById("activity-feed")
const systemInitTime = document.getElementById("system-init-time")

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard()
})

function initializeDashboard() {
  // Check instructor authentication
  const storedSession = localStorage.getItem("instructorSession")

  if (!storedSession) {
    alert("No instructor session found. Redirecting to login...")
    window.location.href = "index.html"
    return
  }

  try {
    instructorSession = JSON.parse(storedSession)
  } catch (error) {
    console.error("[v0] Error parsing instructor session:", error)
    alert("Invalid session data. Redirecting to login...")
    window.location.href = "index.html"
    return
  }

  // Update UI with instructor info
  updateInstructorInfo()

  // Load dashboard data
  loadDashboardData()

  loadExams()

  // Setup event listeners
  setupEventListeners()

  // Start real-time updates
  startRealTimeUpdates()

  console.log("[v0] Dashboard initialized successfully")
  console.log("[v0] Instructor:", instructorSession.username)

  // Add system initialization activity
  addActivity("system", "Dashboard initialized successfully", "just now")
}

function updateInstructorInfo() {
  instructorNameEl.textContent = instructorSession.username
}

function loadDashboardData() {
  // Update statistics
  activeExamsCount.textContent = dashboardData.activeExams
  studentsOnlineCount.textContent = dashboardData.studentsOnline
  totalSubmissionsCount.textContent = dashboardData.totalSubmissions
  securityAlertsCount.textContent = dashboardData.securityAlerts

  // Update system init time
  const loginTime = new Date(instructorSession.loginTime)
  const timeAgo = getTimeAgo(loginTime)
  systemInitTime.textContent = timeAgo
}

function setupEventListeners() {
  // Logout button
  logoutBtn.addEventListener("click", handleLogout)

  // Create exam button
  const createExamBtn = document.getElementById("create-exam-btn")
  if (createExamBtn) {
    createExamBtn.addEventListener("click", () => {
      window.location.href = "create-exam.html"
    })
  }

  const refreshFeedsBtn = document.getElementById("refresh-feeds-btn")
  const toggleAudioBtn = document.getElementById("toggle-audio-btn")
  const downloadResultsBtn = document.getElementById("download-results-btn")

  if (refreshFeedsBtn) {
    refreshFeedsBtn.addEventListener("click", refreshCameraFeeds)
  }

  if (toggleAudioBtn) {
    toggleAudioBtn.addEventListener("click", toggleAudioMonitoring)
  }

  if (downloadResultsBtn) {
    downloadResultsBtn.addEventListener("click", () => downloadResults(SAMPLE_EXAM_DATA.code, SAMPLE_EXAM_DATA.title))
  }

  // Modal close handlers
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      closeAllModals()
    }
  })

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllModals()
      closeExpandedCamera()
    }
  })
}

function startRealTimeUpdates() {
  // Simulate real-time updates every 30 seconds
  setInterval(() => {
    updateDashboardStats()
    updateActivityTimes()
    checkForSecurityAlerts()
  }, 30000)

  console.log("[v0] Real-time updates started")
}

function updateDashboardStats() {
  // Simulate checking for new data
  // In a real application, this would make API calls

  // Check localStorage for any exam submissions
  const submissions = getStoredSubmissions()
  if (submissions.length !== dashboardData.totalSubmissions) {
    const newSubmissions = submissions.length - dashboardData.totalSubmissions
    dashboardData.totalSubmissions = submissions.length
    totalSubmissionsCount.textContent = dashboardData.totalSubmissions

    if (newSubmissions > 0) {
      addActivity("exam", `${newSubmissions} new exam submission(s) received`, "just now")
    }
  }
}

function getStoredSubmissions() {
  // Check for completed exams in localStorage
  const submissions = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith("examResult_")) {
      submissions.push(key)
    }
  }
  return submissions
}

function updateActivityTimes() {
  // Update relative time displays
  const timeElements = document.querySelectorAll(".activity-time")
  timeElements.forEach((element) => {
    if (element.dataset.timestamp) {
      const timestamp = new Date(element.dataset.timestamp)
      element.textContent = getTimeAgo(timestamp)
    }
  })
}

function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("instructorSession")
    console.log("[v0] Instructor logged out")
    window.location.href = "index.html"
  }
}

let questionCounter = 0
const examQuestions = []

function closeCreateExamModal() {
  const modal = document.getElementById("create-exam-modal")
  modal.classList.remove("show")

  // Reset form data
  questionCounter = 0
  examQuestions.length = 0

  console.log("[v0] Create exam modal closed")
}

function addQuestion(type) {
  questionCounter++
  const questionsContainer = document.getElementById("questions-container")

  // Remove no questions message if it exists
  const noQuestionsMessage = questionsContainer.querySelector(".no-questions-message")
  if (noQuestionsMessage) {
    noQuestionsMessage.remove()
  }

  const questionDiv = document.createElement("div")
  questionDiv.className = "question-item"
  questionDiv.dataset.questionId = questionCounter
  questionDiv.dataset.questionType = type

  let questionHTML = `
    <div class="question-header">
      <div class="question-info">
        <span class="question-number">Question ${questionCounter}</span>
        <span class="question-type-badge ${type}">${getQuestionTypeLabel(type)}</span>
      </div>
      <button type="button" class="remove-question-btn" onclick="removeQuestion(${questionCounter})">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
    <div class="question-content">
  `

  // Add question-specific fields based on type
  switch (type) {
    case "multiple-choice":
      questionHTML += `
        <div class="form-group">
          <label>Question Text *</label>
          <textarea name="question_${questionCounter}_text" required rows="3" placeholder="Enter your question here..."></textarea>
        </div>
        <div class="form-group">
          <label>Points</label>
          <input type="number" name="question_${questionCounter}_points" min="1" max="100" value="1" placeholder="1">
        </div>
        <div class="options-container">
          <label>Answer Options *</label>
          <div class="option-item">
            <input type="radio" name="question_${questionCounter}_correct" value="0" required>
            <input type="text" name="question_${questionCounter}_option_0" required placeholder="Option A">
            <button type="button" class="remove-option-btn" onclick="removeOption(this)" style="display: none;">×</button>
          </div>
          <div class="option-item">
            <input type="radio" name="question_${questionCounter}_correct" value="1" required>
            <input type="text" name="question_${questionCounter}_option_1" required placeholder="Option B">
            <button type="button" class="remove-option-btn" onclick="removeOption(this)" style="display: none;">×</button>
          </div>
          <div class="option-item">
            <input type="radio" name="question_${questionCounter}_correct" value="2" required>
            <input type="text" name="question_${questionCounter}_option_2" required placeholder="Option C">
            <button type="button" class="remove-option-btn" onclick="removeOption(this)">×</button>
          </div>
          <div class="option-item">
            <input type="radio" name="question_${questionCounter}_correct" value="3" required>
            <input type="text" name="question_${questionCounter}_option_3" required placeholder="Option D">
            <button type="button" class="remove-option-btn" onclick="removeOption(this)">×</button>
          </div>
          <button type="button" class="btn btn-outline btn-sm add-option-btn" onclick="addOption(${questionCounter})">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Option
          </button>
        </div>
      `
      break

    case "identification":
      questionHTML += `
        <div class="form-group">
          <label>Question Text *</label>
          <textarea name="question_${questionCounter}_text" required rows="3" placeholder="Enter your identification question here..."></textarea>
        </div>
        <div class="form-group">
          <label>Correct Answer *</label>
          <input type="text" name="question_${questionCounter}_answer" required placeholder="Enter the correct answer">
        </div>
        <div class="form-group">
          <label>Points</label>
          <input type="number" name="question_${questionCounter}_points" min="1" max="100" value="1" placeholder="1">
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" name="question_${questionCounter}_case_sensitive">
            Case sensitive answer
          </label>
        </div>
      `
      break

    case "fill-blanks":
      questionHTML += `
        <div class="form-group">
          <label>Question Text with Blanks *</label>
          <textarea name="question_${questionCounter}_text" required rows="3" placeholder="Use _____ to indicate blanks. Example: The capital of France is _____."></textarea>
          <small class="form-help">Use underscores (____) to indicate where students should fill in answers</small>
        </div>
        <div class="form-group">
          <label>Correct Answers *</label>
          <textarea name="question_${questionCounter}_answers" required rows="2" placeholder="Enter correct answers separated by commas. Example: Paris, paris"></textarea>
          <small class="form-help">Separate multiple acceptable answers with commas</small>
        </div>
        <div class="form-group">
          <label>Points</label>
          <input type="number" name="question_${questionCounter}_points" min="1" max="100" value="1" placeholder="1">
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" name="question_${questionCounter}_case_sensitive">
            Case sensitive answers
          </label>
        </div>
      `
      break

    case "essay":
      questionHTML += `
        <div class="form-group">
          <label>Question Text *</label>
          <textarea name="question_${questionCounter}_text" required rows="4" placeholder="Enter your essay question here..."></textarea>
        </div>
        <div class="form-group">
          <label>Points</label>
          <input type="number" name="question_${questionCounter}_points" min="1" max="100" value="5" placeholder="5">
        </div>
        <div class="form-group">
          <label>Minimum Word Count</label>
          <input type="number" name="question_${questionCounter}_min_words" min="0" placeholder="0">
        </div>
        <div class="form-group">
          <label>Maximum Word Count</label>
          <input type="number" name="question_${questionCounter}_max_words" min="0" placeholder="500">
        </div>
        <div class="form-group">
          <label>Grading Rubric (Optional)</label>
          <textarea name="question_${questionCounter}_rubric" rows="3" placeholder="Describe the grading criteria for this essay question..."></textarea>
        </div>
      `
      break
  }

  questionHTML += `</div>`

  questionDiv.innerHTML = questionHTML
  questionsContainer.appendChild(questionDiv)

  console.log(`[v0] Added ${type} question #${questionCounter}`)
}

function removeQuestion(questionId) {
  const questionDiv = document.querySelector(`[data-question-id="${questionId}"]`)
  if (questionDiv) {
    questionDiv.remove()
    console.log(`[v0] Removed question #${questionId}`)

    // Show no questions message if no questions remain
    const questionsContainer = document.getElementById("questions-container")
    if (questionsContainer.children.length === 0) {
      questionsContainer.innerHTML = `
        <div class="no-questions-message">
          <div class="no-questions-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h4>No Questions Added Yet</h4>
          <p>Click one of the buttons above to add your first question</p>
        </div>
      `
    }
  }
}

function addOption(questionId) {
  const questionDiv = document.querySelector(`[data-question-id="${questionId}"]`)
  const optionsContainer = questionDiv.querySelector(".options-container")
  const existingOptions = optionsContainer.querySelectorAll(".option-item")
  const optionIndex = existingOptions.length

  if (optionIndex >= 6) {
    alert("Maximum 6 options allowed per question")
    return
  }

  const optionDiv = document.createElement("div")
  optionDiv.className = "option-item"
  optionDiv.innerHTML = `
    <input type="radio" name="question_${questionId}_correct" value="${optionIndex}" required>
    <input type="text" name="question_${questionId}_option_${optionIndex}" required placeholder="Option ${String.fromCharCode(65 + optionIndex)}">
    <button type="button" class="remove-option-btn" onclick="removeOption(this)">×</button>
  `

  // Insert before the add option button
  const addButton = optionsContainer.querySelector(".add-option-btn")
  optionsContainer.insertBefore(optionDiv, addButton)

  // Show remove buttons for options beyond the first two
  updateOptionRemoveButtons(questionId)
}

function removeOption(button) {
  const optionDiv = button.parentElement
  const optionsContainer = optionDiv.parentElement
  const questionDiv = optionsContainer.closest(".question-item")
  const questionId = questionDiv.dataset.questionId

  // Don't allow removing if only 2 options remain
  const optionItems = optionsContainer.querySelectorAll(".option-item")
  if (optionItems.length <= 2) {
    alert("Minimum 2 options required")
    return
  }

  optionDiv.remove()
  updateOptionRemoveButtons(questionId)

  // Reindex the remaining options
  reindexOptions(questionId)
}

function updateOptionRemoveButtons(questionId) {
  const questionDiv = document.querySelector(`[data-question-id="${questionId}"]`)
  const optionItems = questionDiv.querySelectorAll(".option-item")

  optionItems.forEach((item, index) => {
    const removeBtn = item.querySelector(".remove-option-btn")
    if (index < 2) {
      removeBtn.style.display = "none"
    } else {
      removeBtn.style.display = "block"
    }
  })
}

function reindexOptions(questionId) {
  const questionDiv = document.querySelector(`[data-question-id="${questionId}"]`)
  const optionItems = questionDiv.querySelectorAll(".option-item")

  optionItems.forEach((item, index) => {
    const radio = item.querySelector('input[type="radio"]')
    const textInput = item.querySelector('input[type="text"]')

    radio.value = index
    textInput.name = `question_${questionId}_option_${index}`
    textInput.placeholder = `Option ${String.fromCharCode(65 + index)}`
  })
}

function getQuestionTypeLabel(type) {
  const labels = {
    "multiple-choice": "Multiple Choice",
    identification: "Identification",
    "fill-blanks": "Fill in Blanks",
    essay: "Essay",
  }
  return labels[type] || type
}

function monitorExam(examCode) {
  console.log("[v0] Monitor button clicked for exam:", examCode)

  const monitorUrl = `monitor.html?examId=${examCode}`
  window.open(monitorUrl, "_blank", "width=1200,height=800")

  console.log("[v0] Opened monitoring page in new tab for exam:", examCode)

  // Add activity log
  addActivity("system", `Started monitoring exam ${examCode}`, "just now")
}

function initializeMonitoringInterface(examCode) {
  // Update exam info in modal title
  const modalTitle = document.querySelector("#monitor-modal .font-heading")
  modalTitle.textContent = `Live Monitoring - ${SAMPLE_EXAM_DATA.title}`

  // Initialize stats
  updateMonitoringStats()

  // Load camera feeds
  loadCameraFeeds()

  // Load student activity
  loadStudentActivity()
}

function updateMonitoringStats() {
  const activeStudents = DEMO_STUDENTS.filter((s) => s.status === "online" || s.status === "violation").length
  const avgProgress = Math.round(DEMO_STUDENTS.reduce((sum, s) => sum + s.progress, 0) / DEMO_STUDENTS.length)
  const totalViolations = DEMO_STUDENTS.reduce((sum, s) => sum + s.violations, 0)

  document.getElementById("monitor-active-students").textContent = activeStudents
  document.getElementById("monitor-avg-progress").textContent = `${avgProgress}%`
  document.getElementById("monitor-violations").textContent = totalViolations

  // Calculate remaining time (demo: 25 minutes remaining)
  const remainingMinutes = 25
  const remainingSeconds = 30
  document.getElementById("monitor-time-remaining").textContent =
    `${remainingMinutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
}

function loadCameraFeeds() {
  const feedsGrid = document.getElementById("camera-feeds-grid")

  if (DEMO_STUDENTS.length === 0) {
    feedsGrid.innerHTML = `
      <div class="no-students-message">
        <div class="no-students-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A2 2 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        </div>
        <h3>NO ONE IS TAKING THE EXAM</h3>
        <p>Camera feeds will appear here when students start the exam</p>
        <small>Monitoring is active and ready</small>
      </div>
    `
    return
  }

  feedsGrid.innerHTML = DEMO_STUDENTS.map((student) => {
    let violationClass = ""
    let violationIndicator = ""

    // Simulate different violation types for demo
    if (student.status === "violation") {
      const violationType = Math.random()
      if (violationType < 0.33) {
        violationClass = "violation-no-face"
        violationIndicator = '<div class="violation-indicator">No Face Detected</div>'
      } else if (violationType < 0.66) {
        violationClass = "violation-multiple-faces"
        violationIndicator = '<div class="violation-indicator">Multiple Faces</div>'
      } else {
        violationClass = "violation-tab-switch"
        violationIndicator = '<div class="violation-indicator">Tab Switch</div>'
      }
    }

    return `
        <div class="student-camera-feed ${violationClass}" 
             data-student-id="${student.id}" 
             onclick="expandCameraFeed('${student.id}', '${student.name}')">
          <div class="camera-placeholder">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A2 2 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            <div>Camera Feed</div>
            <small>Live monitoring active</small>
          </div>
          ${violationIndicator}
          <div class="camera-overlay">
            <div class="student-name">${student.name}</div>
            <div class="student-status">
              <span>Progress: ${student.progress}%</span>
              <div class="status-indicator ${student.status}">
                <span class="status-dot"></span>
                ${student.status === "violation" ? "Violation" : "Online"}
              </div>
            </div>
          </div>
          <div class="expand-hint">Click to expand</div>
        </div>
      `
  }).join("")

  // Simulate camera feed connections
  setTimeout(() => {
    simulateCameraFeeds()
  }, 1000)
}

function simulateCameraFeeds() {
  const cameraFeeds = document.querySelectorAll(".student-camera-feed")

  cameraFeeds.forEach((feed, index) => {
    const placeholder = feed.querySelector(".camera-placeholder")

    // Create video element (placeholder for actual camera feed)
    const video = document.createElement("div")
    video.className = "camera-video"
    video.style.background = `linear-gradient(45deg, #${Math.floor(Math.random() * 16777215).toString(16)}, #${Math.floor(Math.random() * 16777215).toString(16)})`
    video.style.display = "flex"
    video.style.alignItems = "center"
    video.style.justifyContent = "center"
    video.style.color = "white"
    video.style.fontSize = "0.875rem"
    video.innerHTML = `<div style="text-align: center;"><div>📹</div><div>Live Feed</div></div>`

    // Replace placeholder with video
    feed.replaceChild(video, placeholder)
  })
}

function loadStudentActivity() {
  const activityList = document.getElementById("student-activity-list")

  const activities = [
    { student: "John Doe", action: "Started exam", time: "2 minutes ago", avatar: "JD" },
    { student: "Jane Smith", action: "Multiple faces detected", time: "5 minutes ago", avatar: "JS" },
    { student: "Mike Johnson", action: "Tab switch violation", time: "7 minutes ago", avatar: "MJ" },
    { student: "John Doe", action: "Answered question 1", time: "8 minutes ago", avatar: "JD" },
  ]

  if (activities.length === 0) {
    activityList.innerHTML = `
      <div class="no-activity">
        <p>No student activity recorded yet</p>
      </div>
    `
    return
  }

  activityList.innerHTML = activities.map((activity) => ``).join("")
}

function startMonitoringUpdates() {
  if (monitoringState.monitoringInterval) {
    clearInterval(monitoringState.monitoringInterval)
  }

  monitoringState.monitoringInterval = setInterval(() => {
    if (monitoringState.isMonitoring) {
      updateMonitoringStats()

      // Simulate random violations for demo
      if (Math.random() < 0.1) {
        // 10% chance per update
        const randomStudent = DEMO_STUDENTS[Math.floor(Math.random() * DEMO_STUDENTS.length)]
        addStudentActivity(randomStudent.name, "Security check performed", "just now")
      }
    }
  }, 5000) // Update every 5 seconds
}

function addStudentActivity(studentName, action, time) {
  const activityList = document.getElementById("student-activity-list")
  const noActivity = activityList.querySelector(".no-activity")

  if (noActivity) {
    activityList.innerHTML = ""
  }

  const avatar = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
  const activityItem = document.createElement("div")
  activityItem.className = "student-activity-item"
  activityItem.innerHTML = `
    <div class="activity-student-avatar">${avatar}</div>
    <div class="activity-details">
      <div class="activity-student-name">${studentName}</div>
      <div class="activity-description">${action}</div>
    </div>
    <div class="activity-timestamp">${time}</div>
  `

  activityList.insertBefore(activityItem, activityList.firstChild)

  // Limit to 10 activities
  const activities = activityList.querySelectorAll(".student-activity-item")
  if (activities.length > 10) {
    activities[activities.length - 1].remove()
  }
}

function refreshCameraFeeds() {
  console.log("[v0] Refreshing camera feeds...")
  const refreshBtn = document.getElementById("refresh-feeds-btn")

  // Show loading state
  refreshBtn.innerHTML = `
    <svg class="btn-icon animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
    </svg>
    Refreshing...
  `

  setTimeout(() => {
    loadCameraFeeds()
    refreshBtn.innerHTML = `
      <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
      Refresh Feeds
    `
    addStudentActivity("System", "Camera feeds refreshed", "just now")
  }, 2000)
}

function toggleAudioMonitoring() {
  monitoringState.audioEnabled = !monitoringState.audioEnabled
  const toggleBtn = document.getElementById("toggle-audio-btn")

  toggleBtn.innerHTML = `
    <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${
        monitoringState.audioEnabled
          ? "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5 7h4l1 1v8l-1 1H5a2 2 0 01-2-2V9a2 2 0 012-2z"
          : "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
      }"></path>
      ${monitoringState.audioEnabled ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>' : ""}
    </svg>
    Audio: ${monitoringState.audioEnabled ? "On" : "Off"}
  `

  console.log("[v0] Audio monitoring:", monitoringState.audioEnabled ? "enabled" : "disabled")
  addStudentActivity("System", `Audio monitoring ${monitoringState.audioEnabled ? "enabled" : "disabled"}`, "just now")
}

function closeExamDetailsModal() {
  document.getElementById("exam-details-modal").classList.remove("show")
}

function closeMonitorModal() {
  console.log("[v0] Closing monitor modal")

  monitoringState.isMonitoring = false
  monitoringState.currentExamCode = null

  if (monitoringState.monitoringInterval) {
    clearInterval(monitoringState.monitoringInterval)
    monitoringState.monitoringInterval = null
  }

  const modal = document.getElementById("monitor-modal")
  if (modal) {
    modal.classList.remove("show")
    console.log("[v0] Monitor modal closed successfully")
  }

  addActivity("system", "Exited monitoring session", "just now")
  console.log("[v0] Monitoring session ended")
}

function closeAllModals() {
  const modals = document.querySelectorAll(".modal-overlay")
  modals.forEach((modal) => modal.classList.remove("show"))
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString() + " " + date.toLocaleTimeString()
}

window.debugDashboard = () => {
  console.log("[v0] Dashboard state:", {
    instructorSession,
    dashboardData,
    sampleExam: SAMPLE_EXAM_DATA,
    monitoringState,
    demoStudents: DEMO_STUDENTS,
  })
}

function checkForSecurityAlerts() {
  // Check for any security violations from active exams
  const violations = getStoredViolations()
  if (violations.length > dashboardData.securityAlerts) {
    const newAlerts = violations.length - dashboardData.securityAlerts
    dashboardData.securityAlerts = violations.length
    securityAlertsCount.textContent = dashboardData.securityAlerts

    if (newAlerts > 0) {
      addActivity("alert", `${newAlerts} new security violation(s) detected`, "just now")
    }
  }
}

function getStoredViolations() {
  // Check for security violations in localStorage
  const violations = []
  try {
    const analytics = JSON.parse(localStorage.getItem("analytics_events") || "[]")
    violations.push(...analytics.filter((event) => event.name === "security_violation"))
  } catch (error) {
    console.error("[v0] Error reading violations:", error)
  }
  return violations
}

// Expanded camera view functions
function expandCameraFeed(studentId, studentName) {
  const student = DEMO_STUDENTS.find((s) => s.id === studentId)
  if (!student) return

  // Determine violation type for expanded view
  let violationClass = ""
  if (student.status === "violation") {
    const violationType = Math.random()
    if (violationType < 0.33) {
      violationClass = "violation-no-face"
    } else if (violationType < 0.66) {
      violationClass = "violation-multiple-faces"
    } else {
      violationClass = "violation-tab-switch"
    }
  }

  // Create expanded view modal
  const expandedModal = document.createElement("div")
  expandedModal.className = "modal-overlay expanded-camera-modal"
  expandedModal.innerHTML = `
    <div class="expanded-camera-container ${violationClass}">
      <div class="expanded-camera-header">
        <div class="expanded-student-info">
          <h3>${studentName}</h3>
          <div class="expanded-student-stats">
            <span class="progress-badge">Progress: ${student.progress}%</span>
            <span class="status-badge ${student.status}">
              <span class="status-dot"></span>
              ${student.status === "violation" ? "Violation" : "Online"}
            </span>
            <span class="violations-badge">Violations: ${student.violations}</span>
          </div>
        </div>
        <button class="close-expanded-btn" onclick="closeExpandedCamera()">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="expanded-camera-content">
        <div class="expanded-video-container">
          <div class="expanded-camera-video" style="background: linear-gradient(45deg, #${Math.floor(Math.random() * 16777215).toString(16)}, #${Math.floor(Math.random() * 16777215).toString(16)})">
            <div style="text-align: center; color: white; font-size: 2rem;">
              <div>📹</div>
              <div style="font-size: 1.2rem; margin-top: 10px;">Live Camera Feed</div>
              <div style="font-size: 0.9rem; margin-top: 5px; opacity: 0.8;">${studentName}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(expandedModal)
  expandedModal.classList.add("show")

  // Add click outside to close
  expandedModal.addEventListener("click", (e) => {
    if (e.target === expandedModal) {
      closeExpandedCamera()
    }
  })

  console.log(`[v0] Expanded camera view for student: ${studentName}`)
}

function closeExpandedCamera() {
  const expandedModal = document.querySelector(".expanded-camera-modal")
  if (expandedModal) {
    expandedModal.remove()
  }
}

function downloadResults(examCode, examTitle) {
  console.log("[v0] Downloading results for exam:", examCode, examTitle)

  // Sort students alphabetically by surname
  const sortedResults = [...SAMPLE_STUDENT_RESULTS].sort((a, b) => a.surname.localeCompare(b.surname))

  // Create CSV content (Excel compatible)
  let csvContent = "data:text/csv;charset=utf-8,"

  // Add headers
  csvContent += "Student Name,Student ID,Score\n"

  // Add student data
  sortedResults.forEach((student) => {
    const fullName = `${student.surname}, ${student.firstName}`
    csvContent += `"${fullName}","${student.studentId}",${student.score}\n`
  })

  // Create download link
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)

  // Use exam title for filename, sanitize for file system
  const sanitizedTitle = examTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()
  link.setAttribute("download", `${sanitizedTitle}_results.csv`)

  // Trigger download
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Add activity log
  addActivity("exam", `Downloaded results for "${examTitle}"`, "just now")

  console.log("[v0] Results downloaded successfully")
}

function addActivity(type, message, time) {
  const activityItem = document.createElement("div")
  activityItem.className = "activity-item"

  const timestamp = new Date().toISOString()

  activityItem.innerHTML = `
    <div class="activity-icon ${type}">
      ${getActivityIcon(type)}
    </div>
    <div class="activity-content">
      <div class="activity-message">${message}</div>
      <div class="activity-time" data-timestamp="${timestamp}">${time}</div>
    </div>
  `

  // Insert at the beginning of the activity feed
  const firstActivity = activityFeed.querySelector(".activity-item")
  if (firstActivity) {
    activityFeed.insertBefore(activityItem, firstActivity)
  } else {
    activityFeed.appendChild(activityItem)
  }

  // Limit to 10 activities
  const activities = activityFeed.querySelectorAll(".activity-item")
  if (activities.length > 10) {
    activities[activities.length - 1].remove()
  }
}

function getActivityIcon(type) {
  const icons = {
    system:
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    exam: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
    student:
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>',
    alert:
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>',
  }
  return icons[type] || icons.system
}

function getTimeAgo(date) {
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) {
    return "just now"
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? "s" : ""} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? "s" : ""} ago`
  }
}

function loadExams() {
  console.log("[v0] Loading exams from localStorage...")

  const examsList = document.getElementById("exams-list")

  if (!examsList) {
    console.log("[v0] examsList element not found!")
    return
  }

  // Get exams from localStorage
  const exams = []
  console.log("[v0] Checking localStorage for exams...")

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith("exam_")) {
      console.log("[v0] Found exam key:", key)
      try {
        const exam = JSON.parse(localStorage.getItem(key))
        console.log("[v0] Loaded exam:", exam)
        exams.push(exam)
      } catch (error) {
        console.error("[v0] Error parsing exam:", error)
      }
    }
  }

  console.log("[v0] Total exams found:", exams.length)

  if (exams.length === 0) {
    console.log("[v0] No exams found, showing empty state")
    examsList.innerHTML = `
      <div class="no-exams-message">
        <div class="no-exams-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <h3>No Exams Created Yet</h3>
        <p>Click "Create New Exam" to get started</p>
      </div>
    `
    return
  }

  console.log("[v0] Displaying", exams.length, "exams")

  // Display exams
  examsList.innerHTML = exams
    .map(
      (exam) => `
    <div class="exam-card" data-exam-code="${exam.code}">
      <div class="exam-header">
        <div class="exam-info">
          <h3 class="exam-title font-heading">${exam.title}</h3>
          <div class="exam-meta">
            <span class="exam-code">Code: ${exam.code}</span>
            <span class="exam-duration">Duration: ${exam.duration} minutes</span>
          </div>
        </div>
        <div class="exam-status ${exam.status}">
          <span class="status-dot"></span>
          ${exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
        </div>
      </div>
      
      <div class="exam-stats">
        <div class="exam-stat">
          <span class="stat-value">${exam.questions ? exam.questions.length : 0}</span>
          <span class="stat-label">Questions</span>
        </div>
        <div class="exam-stat">
          <span class="stat-value">${exam.studentsEnrolled || 0}</span>
          <span class="stat-label">Students</span>
        </div>
        <div class="exam-stat">
          <span class="stat-value">${exam.completedSubmissions || 0}</span>
          <span class="stat-label">Completed</span>
        </div>
      </div>

      <div class="exam-actions">
        <button class="btn btn-primary btn-sm" onclick="window.open('monitor.html?examId=${exam.code}', '_blank')">
          <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
          Monitor
        </button>
        <button class="btn btn-secondary btn-sm" onclick="downloadResults('${exam.code}', '${exam.title}')">
          <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          View Results
        </button>
        <button class="btn btn-outline btn-sm" onclick="editExam('${exam.code}')">
          <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
          Edit
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteExam('${exam.code}', '${exam.title}')">
          <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          Delete
        </button>
      </div>
      
      <div class="exam-footer">
        <small class="exam-created">Created: ${formatDate(exam.createdAt)}</small>
      </div>
    </div>
  `,
    )
    .join("")

  console.log(`[v0] Loaded ${exams.length} exams`)
}

function editExam(examCode) {
  console.log("[v0] Editing exam:", examCode)

  // Get exam data
  const exam = JSON.parse(localStorage.getItem(`exam_${examCode}`))
  if (!exam) {
    alert("Exam not found!")
    return
  }

  // Store exam data for editing
  localStorage.setItem("editingExam", JSON.stringify(exam))

  // Redirect to create exam page with edit mode
  window.location.href = "create-exam.html?edit=true"
}

function deleteExam(examCode, examTitle) {
  // Show confirmation dialog
  if (confirm(`Are you sure you want to delete the exam "${examTitle}"? This action cannot be undone.`)) {
    try {
      // Remove from localStorage
      localStorage.removeItem(`exam_${examCode}`)

      // Show success message
      alert(`Exam "${examTitle}" has been deleted successfully.`)

      // Reload the exams list to reflect the change
      loadExams()

      // Add activity log
      addActivity("exam", `Exam "${examTitle}" was deleted`, "just now")

      console.log(`[v0] Deleted exam: ${examCode}`)
    } catch (error) {
      console.error("[v0] Error deleting exam:", error)
      alert("Error deleting exam. Please try again.")
    }
  }
}

function viewExamDetails(examCode) {
  const exam = getExamByCode(examCode)
  if (!exam) {
    alert("Exam not found")
    return
  }

  const modal = document.getElementById("exam-details-modal")
  if (!modal) return

  // Update modal content with exam details
  const modalContent = modal.querySelector(".modal-content")
  modalContent.innerHTML = `
    <div class="modal-header">
      <h2>Exam Details</h2>
      <button class="close-btn" onclick="closeExamDetailsModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="exam-info-grid">
        <div class="info-item">
          <label>Title:</label>
          <span>${exam.title}</span>
        </div>
        <div class="info-item">
          <label>Access Code:</label>
          <span class="exam-code-display">${exam.code}</span>
        </div>
        <div class="info-item">
          <label>Duration:</label>
          <span>${exam.duration} minutes</span>
        </div>
        <div class="info-item">
          <label>Total Questions:</label>
          <span>${exam.questions.length}</span>
        </div>
        <div class="info-item">
          <label>Total Points:</label>
          <span>${exam.questions.reduce((sum, q) => sum + (q.points || 1), 0)}</span>
        </div>
        <div class="info-item">
          <label>Status:</label>
          <span class="status-badge ${exam.status}">${exam.status}</span>
        </div>
      </div>
      
      <div class="questions-preview">
        <h3>Questions Preview</h3>
        <div class="questions-list">
          ${exam.questions
            .map(
              (q, index) => `
            <div class="question-preview">
              <div class="question-header">
                <span class="question-number">Q${index + 1}</span>
                <span class="question-type-badge ${q.type}">${getQuestionTypeLabel(q.type)}</span>
                <span class="question-points">${q.points || 1} pts</span>
              </div>
              <div class="question-text">${q.text}</div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    </div>
  `

  modal.classList.add("show")
}

function getExamByCode(examCode) {
  try {
    const examData = localStorage.getItem(`exam_${examCode}`)
    return examData ? JSON.parse(examData) : null
  } catch (error) {
    console.error("[v0] Error getting exam:", error)
    return null
  }
}

function downloadExamResults(examCode) {
  console.log("[v0] Downloading results for exam:", examCode)

  // Get exam data
  const exam = JSON.parse(localStorage.getItem(`exam_${examCode}`))
  if (!exam) {
    alert("Exam not found!")
    return
  }

  // Get student results (mock data for now - in real app this would come from database)
  const studentResults = generateMockResults(exam)

  // Create CSV content (Excel-compatible)
  let csvContent = "Student Name,Student Number,Score,Percentage,Status\n"

  studentResults.forEach((result) => {
    const percentage = ((result.score / exam.totalPoints) * 100).toFixed(1)
    const status = percentage >= 60 ? "Pass" : "Fail"
    csvContent += `"${result.surname}, ${result.firstName}","${result.studentNumber}",${result.score},${percentage}%,${status}\n`
  })

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${exam.title.replace(/[^a-zA-Z0-9]/g, "_")}_Results.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function generateMockResults(exam) {
  const mockStudents = [
    { firstName: "John", surname: "Smith", studentNumber: "21-12345" },
    { firstName: "Sarah", surname: "Johnson", studentNumber: "21-12346" },
    { firstName: "Michael", surname: "Brown", studentNumber: "21-12347" },
    { firstName: "Emily", surname: "Davis", studentNumber: "21-12348" },
    { firstName: "David", surname: "Wilson", studentNumber: "21-12349" },
  ]

  const totalPoints = exam.questions.reduce((sum, q) => sum + (q.points || 1), 0)

  return mockStudents.map((student) => ({
    ...student,
    score: Math.floor(Math.random() * totalPoints) + 1,
    totalPoints: totalPoints,
  }))
}
