// Dashboard state management
let instructorSession = null
let dashboardData = {
  activeExams: 0,
  studentsOnline: 0,
  totalSubmissions: 0,
  securityAlerts: 0,
}

let realtimeSubscriptions = []
let periodicUpdateInterval = null
const connectionState = {
  isConnected: false,
  retryCount: 0,
  maxRetries: 5,
  retryDelay: 2000,
}

// DOM elements
const logoutBtn = document.getElementById("logout-btn")
const instructorNameElement = document.getElementById("instructor-name")

// Initialize dashboard
document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("[v0] Initializing instructor dashboard")

    // Check instructor authentication
    if (!checkInstructorAuth()) {
      return
    }

    // Initialize Supabase connection
    await initializeSupabase()

    // Load initial data
    await loadDashboardData()

    // Setup event listeners
    setupEventListeners()

    // Start real-time updates
    startRealTimeUpdates()

    console.log("[v0] Dashboard initialized successfully")
  } catch (error) {
    console.error("[v0] Error initializing dashboard:", error)
    showError("Failed to initialize dashboard. Please refresh the page.")
  }
})

function checkInstructorAuth() {
  const instructorData = localStorage.getItem("instructorSession")
  if (!instructorData) {
    console.log("[v0] No instructor session found")
    alert("Please log in as an instructor first.")
    window.location.href = "index.html"
    return false
  }

  try {
    instructorSession = JSON.parse(instructorData)
    if (!instructorSession.isAuthenticated || !instructorSession.id) {
      throw new Error("Invalid session data")
    }

    // Update UI with instructor info
    if (instructorNameElement) {
      instructorNameElement.textContent = instructorSession.fullName || instructorSession.username
    }

    console.log("[v0] Instructor authenticated:", instructorSession.username)
    return true
  } catch (error) {
    console.error("[v0] Invalid instructor session:", error)
    localStorage.removeItem("instructorSession")
    alert("Your session has expired. Please log in again.")
    window.location.href = "index.html"
    return false
  }
}

async function initializeSupabase() {
  try {
    if (!window.supabaseClient) {
      console.log("[v0] Creating Supabase client...")
      window.supabaseClient = window.createSupabaseClient()
    }

    if (!window.supabaseClient) {
      throw new Error("Failed to create Supabase client")
    }

    console.log("[v0] Supabase client initialized")
    return true
  } catch (error) {
    console.error("[v0] Supabase initialization failed:", error)
    throw error
  }
}

async function loadDashboardData() {
  try {
    console.log("[v0] Loading dashboard data")

    // Load exams and statistics in parallel
    await Promise.all([loadExams(), loadDashboardStats(), loadRecentActivity()])

    console.log("[v0] Dashboard data loaded successfully")
  } catch (error) {
    console.error("[v0] Error loading dashboard data:", error)
    showError("Failed to load dashboard data. Please refresh the page.")
  }
}

async function loadExams() {
  try {
    console.log("[v0] Loading exams for instructor:", instructorSession.id)

    if (!window.supabaseClient) {
      console.error("[v0] Supabase client not available")
      return
    }

    const { data: exams, error } = await window.supabaseClient
      .from("exams")
      .select("*")
      .eq("instructor_id", instructorSession.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error loading exams:", error)
      const examsList = document.getElementById("exams-list")
      examsList.innerHTML = `
        <div class="error-message">
          <p>Error loading exams: ${error.message}</p>
          <button onclick="loadExams()" class="btn btn-primary btn-sm">Retry</button>
        </div>
      `
      return
    }

    console.log("[v0] Loaded", exams?.length || 0, "exams")
    displayExams(exams || [])

    // Update active exams count
    const activeExams = exams?.filter((exam) => exam.is_active) || []
    dashboardData.activeExams = activeExams.length
    updateActiveExamsDisplay()
  } catch (error) {
    console.error("[v0] Unexpected error loading exams:", error)
    const examsList = document.getElementById("exams-list")
    examsList.innerHTML = `
      <div class="error-message">
        <p>Unexpected error: ${error.message}</p>
        <button onclick="loadExams()" class="btn btn-primary btn-sm">Retry</button>
      </div>
    `
  }
}

async function displayExams(exams) {
  const examsList = document.getElementById("exams-list")

  if (!examsList) {
    console.error("[v0] Exams list element not found")
    return
  }

  if (!exams || exams.length === 0) {
    examsList.innerHTML = `
      <div class="no-exams-message">
        <div class="no-exams-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <h4>No Exams Created Yet</h4>
        <p>Create your first exam to get started</p>
        <button class="btn btn-primary" onclick="window.location.href='create-exam.html'">
          <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Create New Exam
        </button>
      </div>
    `
    return
  }

  // Generate exam cards with enhanced statistics
  const examCards = await Promise.all(
    exams.map(async (exam) => {
      const stats = await getExamStatistics(exam.exam_code)
      const questionsCount = exam.questions ? exam.questions.length : 0

      return `
      <div class="exam-card ${exam.is_active ? "active" : "inactive"}" data-exam-code="${exam.exam_code}">
        <div class="exam-header">
          <div class="exam-info">
            <h3 class="exam-title font-heading">${exam.title}</h3>
            <div class="exam-meta">
              <span class="exam-code">Code: ${exam.exam_code}</span>
              <span class="exam-duration">Duration: ${exam.duration} minutes</span>
              <span class="exam-created">Created: ${formatDate(exam.created_at)}</span>
            </div>
          </div>
          <div class="exam-status ${exam.is_active ? "active" : "inactive"}">
            <span class="status-dot"></span>
            ${exam.is_active ? "Active" : "Inactive"}
          </div>
        </div>
        
        <div class="exam-stats">
          <div class="exam-stat">
            <span class="stat-value">${questionsCount}</span>
            <span class="stat-label">Questions</span>
          </div>
          <div class="exam-stat">
            <span class="stat-value" id="students-${exam.exam_code}">${stats.studentsOnline}</span>
            <span class="stat-label">Students</span>
          </div>
          <div class="exam-stat">
            <span class="stat-value" id="submissions-${exam.exam_code}">${stats.submissions}</span>
            <span class="stat-label">Completed</span>
          </div>
          <div class="exam-stat">
            <span class="stat-value" id="violations-${exam.exam_code}">${stats.violations}</span>
            <span class="stat-label">Violations</span>
          </div>
        </div>

        <div class="exam-actions">
          <button class="btn btn-primary btn-sm" onclick="monitorExam('${exam.exam_code}', '${exam.title}')">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            Monitor
          </button>
          <button class="btn btn-secondary btn-sm" onclick="editExam('${exam.exam_code}')">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            Edit
          </button>
          <button class="btn btn-outline btn-sm" onclick="downloadResults('${exam.exam_code}', '${exam.title}')">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Results
          </button>
          <button class="btn btn-danger btn-sm" onclick="toggleExamStatus('${exam.exam_code}', ${exam.is_active})">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${exam.is_active ? "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"}"></path>
            </svg>
            ${exam.is_active ? "Deactivate" : "Activate"}
          </button>
          <button class="btn btn-delete btn-sm" onclick="deleteExam('${exam.exam_code}', '${exam.title}')">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Delete
          </button>
        </div>
      </div>
    `
    }),
  )

  examsList.innerHTML = examCards.join("")
}

async function loadDashboardStats() {
  try {
    console.log("[v0] Loading dashboard statistics")

    // Get all active sessions across all instructor's exams
    const { data: instructorExams, error: examsError } = await window.supabaseClient
      .from("exams")
      .select("id")
      .eq("instructor_id", instructorSession.id)
      .eq("is_active", true)

    if (examsError) {
      console.error("[v0] Error loading instructor exams:", examsError)
      return
    }

    const examIds = instructorExams?.map((exam) => exam.id) || []

    if (examIds.length === 0) {
      // No active exams, reset all stats
      dashboardData = {
        activeExams: 0,
        studentsOnline: 0,
        totalSubmissions: 0,
        securityAlerts: 0,
      }
      updateDashboardDisplay()
      return
    }

    // Get active sessions
    const { data: activeSessions, error: sessionsError } = await window.supabaseClient
      .from("exam_sessions")
      .select("*")
      .in("exam_id", examIds)
      .eq("status", "active")

    if (sessionsError) {
      console.error("[v0] Error loading active sessions:", sessionsError)
    }

    // Get completed sessions (submissions)
    const { data: completedSessions, error: completedError } = await window.supabaseClient
      .from("exam_sessions")
      .select("*")
      .in("exam_id", examIds)
      .eq("status", "completed")

    if (completedError) {
      console.error("[v0] Error loading completed sessions:", completedError)
    }

    // Count violations from all sessions
    const allSessions = [...(activeSessions || []), ...(completedSessions || [])]
    let totalViolations = 0
    allSessions.forEach((session) => {
      if (session.violations && Array.isArray(session.violations)) {
        totalViolations += session.violations.length
      }
    })

    // Update dashboard data
    dashboardData = {
      activeExams: instructorExams?.length || 0,
      studentsOnline: activeSessions?.length || 0,
      totalSubmissions: completedSessions?.length || 0,
      securityAlerts: totalViolations,
    }

    updateDashboardDisplay()
    console.log("[v0] Dashboard stats updated:", dashboardData)
  } catch (error) {
    console.error("[v0] Error loading dashboard stats:", error)
  }
}

function updateDashboardDisplay() {
  // Update stat cards
  updateElement("active-exams-count", dashboardData.activeExams)
  updateElement("students-online-count", dashboardData.studentsOnline)
  updateElement("total-submissions-count", dashboardData.totalSubmissions)
  updateElement("security-alerts-count", dashboardData.securityAlerts)
}

function updateElement(id, value) {
  const element = document.getElementById(id)
  if (element) {
    element.textContent = value
  }
}

function updateActiveExamsDisplay() {
  updateElement("active-exams-count", dashboardData.activeExams)
}

function updateStudentsOnlineDisplay() {
  updateElement("students-online-count", dashboardData.studentsOnline)
}

async function getExamStatistics(examCode) {
  try {
    // First get the exam ID from the exam code
    const { data: examData, error: examError } = await window.supabaseClient
      .from("exams")
      .select("id")
      .eq("exam_code", examCode)
      .single()

    if (examError || !examData) {
      console.error("[v0] Error fetching exam ID:", examError)
      return {
        questionsCount: 0,
        studentsOnline: 0,
        submissions: 0,
        violations: 0,
      }
    }

    // Get exam sessions for this exam using the correct exam ID
    const { data: sessions, error: sessionsError } = await window.supabaseClient
      .from("exam_sessions")
      .select("*")
      .eq("exam_id", examData.id)

    if (sessionsError) {
      console.error("[v0] Error fetching sessions:", sessionsError)
    }

    // Count active students
    const activeSessions = sessions?.filter((session) => session.status === "active") || []

    // Count submissions (completed exams)
    const submissions = sessions?.filter((session) => session.status === "completed") || []

    // Count violations from all sessions
    let totalViolations = 0
    sessions?.forEach((session) => {
      if (session.violations && Array.isArray(session.violations)) {
        totalViolations += session.violations.length
      }
    })

    return {
      questionsCount: 1, // This would come from the exam data
      studentsOnline: activeSessions.length,
      submissions: submissions.length,
      violations: totalViolations,
    }
  } catch (error) {
    console.error("[v0] Error getting exam statistics:", error)
    return {
      questionsCount: 0,
      studentsOnline: 0,
      submissions: 0,
      violations: 0,
    }
  }
}

function setupEventListeners() {
  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout)
  }

  // Window events
  window.addEventListener("beforeunload", () => {
    stopRealTimeUpdates()
  })

  // Visibility change handling
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      console.log("[v0] Dashboard hidden, reducing update frequency")
    } else {
      console.log("[v0] Dashboard visible, resuming normal updates")
      safeRefreshDashboardStats()
    }
  })
}

function startRealTimeUpdates() {
  try {
    console.log("[v0] Starting real-time updates")

    if (!window.supabaseClient) {
      console.error("[v0] Supabase client not available for real-time updates")
      return
    }

    // Clear existing subscriptions
    stopRealTimeUpdates()

    // Subscribe to exam sessions changes (for student online count and submissions)
    const sessionSubscription = window.supabaseClient
      .channel("exam_sessions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "exam_sessions",
        },
        async (payload) => {
          console.log("[v0] Exam session change detected:", payload)
          await handleSessionChange(payload)
        },
      )
      .subscribe()

    // Subscribe to exams changes (for active exams count)
    const examSubscription = window.supabaseClient
      .channel("exams_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "exams",
          filter: `instructor_id=eq.${instructorSession.id}`,
        },
        async (payload) => {
          console.log("[v0] Exam change detected:", payload)
          await handleExamChange(payload)
        },
      )
      .subscribe()

    // Subscribe to exam answers changes (for real-time submission tracking)
    const answerSubscription = window.supabaseClient
      .channel("exam_answers_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "exam_answers",
        },
        async (payload) => {
          console.log("[v0] Answer change detected:", payload)
          await handleAnswerChange(payload)
        },
      )
      .subscribe()

    realtimeSubscriptions = [sessionSubscription, examSubscription, answerSubscription]

    // Also keep periodic updates as backup
    if (periodicUpdateInterval) {
      clearInterval(periodicUpdateInterval)
    }

    periodicUpdateInterval = setInterval(async () => {
      await safeRefreshDashboardStats()
      await refreshExamTileStats()
    }, 30000) // Every 30 seconds as backup

    console.log("[v0] Real-time subscriptions established")
  } catch (error) {
    console.error("[v0] Error starting real-time updates:", error)
  }
}

async function handleSessionChange(payload) {
  try {
    const { eventType, new: newRecord, old: oldRecord } = payload

    // Refresh dashboard stats for any session change
    await safeRefreshDashboardStats()

    // Update specific exam tile if we can identify the exam
    if (newRecord?.exam_id || oldRecord?.exam_id) {
      const examId = newRecord?.exam_id || oldRecord?.exam_id
      await updateExamTileStats(examId)
    }

    // Show real-time notification for significant changes
    if (eventType === "INSERT" && newRecord?.status === "active") {
      showNotification(`New student joined exam`, "info")
    } else if (eventType === "UPDATE" && newRecord?.status === "completed" && oldRecord?.status === "active") {
      showNotification(`Student completed exam`, "success")
    }
  } catch (error) {
    console.error("[v0] Error handling session change:", error)
  }
}

async function handleExamChange(payload) {
  try {
    const { eventType, new: newRecord, old: oldRecord } = payload

    // Refresh exam list and stats
    await loadExams()
    await safeRefreshDashboardStats()

    // Show notifications for exam status changes
    if (eventType === "UPDATE") {
      if (newRecord?.is_active && !oldRecord?.is_active) {
        showNotification(`Exam "${newRecord.title}" activated`, "success")
      } else if (!newRecord?.is_active && oldRecord?.is_active) {
        showNotification(`Exam "${newRecord.title}" deactivated`, "info")
      }
    }
  } catch (error) {
    console.error("[v0] Error handling exam change:", error)
  }
}

async function handleAnswerChange(payload) {
  try {
    // Refresh dashboard stats when answers are submitted
    await safeRefreshDashboardStats()

    // Update exam tile stats if we can identify the exam
    if (payload.new?.exam_session_id) {
      const { data: session } = await window.supabaseClient
        .from("exam_sessions")
        .select("exam_id")
        .eq("id", payload.new.exam_session_id)
        .single()

      if (session?.exam_id) {
        await updateExamTileStats(session.exam_id)
      }
    }
  } catch (error) {
    console.error("[v0] Error handling answer change:", error)
  }
}

async function updateExamTileStats(examId) {
  try {
    const { data: exam } = await window.supabaseClient.from("exams").select("exam_code").eq("id", examId).single()

    if (exam?.exam_code) {
      const stats = await getExamStatistics(exam.exam_code)

      // Update the specific exam tile
      const studentsElement = document.getElementById(`students-${exam.exam_code}`)
      const submissionsElement = document.getElementById(`submissions-${exam.exam_code}`)
      const violationsElement = document.getElementById(`violations-${exam.exam_code}`)

      if (studentsElement) studentsElement.textContent = stats.studentsOnline
      if (submissionsElement) submissionsElement.textContent = stats.submissions
      if (violationsElement) violationsElement.textContent = stats.violations
    }
  } catch (error) {
    console.error("[v0] Error updating exam tile stats:", error)
  }
}

async function refreshExamTileStats() {
  try {
    const examCards = document.querySelectorAll(".exam-card")

    for (const card of examCards) {
      const examCode = card.dataset.examCode
      if (examCode) {
        const stats = await getExamStatistics(examCode)

        const studentsElement = document.getElementById(`students-${examCode}`)
        const submissionsElement = document.getElementById(`submissions-${examCode}`)
        const violationsElement = document.getElementById(`violations-${examCode}`)

        if (studentsElement) studentsElement.textContent = stats.studentsOnline
        if (submissionsElement) submissionsElement.textContent = stats.submissions
        if (violationsElement) violationsElement.textContent = stats.violations
      }
    }
  } catch (error) {
    console.error("[v0] Error refreshing exam tile stats:", error)
  }
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `

  // Add to page
  document.body.appendChild(notification)

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove()
    }
  }, 5000)
}

function stopRealTimeUpdates() {
  console.log("[v0] Stopping real-time updates")

  // Unsubscribe from all channels
  realtimeSubscriptions.forEach((subscription) => {
    if (subscription && typeof subscription.unsubscribe === "function") {
      subscription.unsubscribe()
    }
  })
  realtimeSubscriptions = []

  // Clear periodic updates
  if (periodicUpdateInterval) {
    clearInterval(periodicUpdateInterval)
    periodicUpdateInterval = null
  }
}

// Exam management functions
async function editExam(examCode) {
  try {
    console.log("[v0] Editing exam:", examCode)

    // Get exam data
    const { data: examData, error } = await window.supabaseClient
      .from("exams")
      .select("*")
      .eq("exam_code", examCode)
      .eq("instructor_id", instructorSession.id)
      .single()

    if (error || !examData) {
      console.error("[v0] Error fetching exam for editing:", error)
      alert("Failed to load exam data for editing.")
      return
    }

    // Store exam data for editing
    localStorage.setItem("editingExam", JSON.stringify(examData))

    // Navigate to edit page
    window.location.href = "edit-exam.html?examCode=" + examCode
  } catch (error) {
    console.error("[v0] Error preparing exam for editing:", error)
    alert("Failed to prepare exam for editing.")
  }
}

async function toggleExamStatus(examCode, currentStatus) {
  try {
    const newStatus = !currentStatus
    const action = newStatus ? "activate" : "deactivate"

    if (!confirm(`Are you sure you want to ${action} this exam?`)) {
      return
    }

    const { error } = await window.supabaseClient
      .from("exams")
      .update({ is_active: newStatus })
      .eq("exam_code", examCode)
      .eq("instructor_id", instructorSession.id)

    if (error) {
      console.error("[v0] Error toggling exam status:", error)
      alert(`Failed to ${action} exam.`)
      return
    }

    console.log(`[v0] Exam ${examCode} ${action}d successfully`)

    // Refresh the exam list
    await loadExams()
    await safeRefreshDashboardStats()
  } catch (error) {
    console.error("[v0] Error toggling exam status:", error)
    alert("Failed to update exam status.")
  }
}

function monitorExam(examCode, examTitle) {
  console.log("[v0] Opening monitor for exam:", examCode)
  const monitorUrl = `monitor.html?examCode=${examCode}&title=${encodeURIComponent(examTitle)}`
  window.open(monitorUrl, "_blank", "width=1200,height=800")
}

async function downloadResults(examCode, examTitle) {
  try {
    console.log("[v0] Downloading results for exam:", examCode)

    // Get exam data and sessions
    const { data: examData, error: examError } = await window.supabaseClient
      .from("exams")
      .select("*")
      .eq("exam_code", examCode)
      .single()

    if (examError || !examData) {
      alert("Failed to load exam data.")
      return
    }

    const { data: sessions, error: sessionsError } = await window.supabaseClient
      .from("exam_sessions")
      .select("*")
      .eq("exam_id", examData.id)
      .eq("status", "completed")

    if (sessionsError) {
      console.error("[v0] Error loading sessions:", sessionsError)
      alert("Failed to load exam sessions.")
      return
    }

    if (!sessions || sessions.length === 0) {
      alert("No completed submissions found for this exam.")
      return
    }

    await downloadExcelResults(examData, sessions, examTitle)

    console.log("[v0] Results downloaded successfully")
  } catch (error) {
    console.error("[v0] Error downloading results:", error)
    alert("Failed to download results.")
  }
}

async function downloadExcelResults(examData, sessions, examTitle) {
  // Create Excel-compatible HTML table
  const tableData = await generateResultsTable(examData, sessions)

  const excelContent = `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>${examData.title} - Results</h2>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        ${tableData}
      </body>
    </html>
  `

  const blob = new Blob([excelContent], {
    type: "application/vnd.ms-excel",
  })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${examTitle.replace(/[^a-z0-9]/gi, "_")}_results.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

async function generateResultsTable(examData, sessions) {
  const rows = await Promise.all(
    sessions.map(async (session) => {
      const startTime = new Date(session.start_time)
      const endTime = session.end_time ? new Date(session.end_time) : null
      const duration = endTime ? Math.round((endTime - startTime) / (1000 * 60)) : 0
      const violationsCount = session.violations ? session.violations.length : 0

      const { score, percentage } = calculateAccurateScore(examData, session.answers)

      return `
      <tr>
        <td>${session.student_name || "Unknown"}</td>
        <td>${session.student_number || "Unknown"}</td>
        <td>${startTime.toLocaleString()}</td>
        <td>${endTime ? endTime.toLocaleString() : "In Progress"}</td>
        <td>${duration}</td>
        <td>${session.status}</td>
        <td>${violationsCount}</td>
        <td>${score}</td>
        <td>${percentage}%</td>
      </tr>
    `
    }),
  )

  return `
    <table>
      <thead>
        <tr>
          <th>Student Name</th>
          <th>Student Number</th>
          <th>Start Time</th>
          <th>End Time</th>
          <th>Duration (minutes)</th>
          <th>Status</th>
          <th>Violations Count</th>
          <th>Score</th>
          <th>Percentage</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join("")}
      </tbody>
    </table>
  `
}

function calculateAccurateScore(examData, answers) {
  if (!answers || !examData.questions) {
    return { score: "0/0", percentage: "0" }
  }

  let correctAnswers = 0
  const totalQuestions = examData.questions.length

  // Handle both array and object answer formats
  const studentAnswers = Array.isArray(answers) ? answers : Object.values(answers)

  examData.questions.forEach((question, index) => {
    const studentAnswer = studentAnswers[index]
    const correctAnswer = question.correct_answer || question.correctAnswer

    // Compare answers (handle both string and number formats)
    if (String(studentAnswer).toLowerCase() === String(correctAnswer).toLowerCase()) {
      correctAnswers++
    }
  })

  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

  return {
    score: `${correctAnswers}/${totalQuestions}`,
    percentage: percentage.toString(),
  }
}

function logout() {
  console.log("[v0] Logging out instructor")

  // Stop real-time updates
  stopRealTimeUpdates()

  // Clear session data
  localStorage.removeItem("instructorSession")
  localStorage.removeItem("editingExam")

  // Redirect to login
  window.location.href = "index.html"
}

function showError(message) {
  const errorDiv = document.createElement("div")
  errorDiv.className = "error-banner"
  errorDiv.innerHTML = `
    <div class="error-content">
      <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="btn btn-sm btn-outline">Dismiss</button>
    </div>
  `

  document.body.insertBefore(errorDiv, document.body.firstChild)

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (errorDiv.parentElement) {
      errorDiv.remove()
    }
  }, 10000)
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  return `${Math.floor(diffInSeconds / 86400)} days ago`
}

async function deleteExam(examCode, examTitle) {
  try {
    // Confirm deletion
    if (
      !confirm(
        `Are you sure you want to permanently delete "${examTitle}"?\n\nThis action cannot be undone and will remove all associated data including student submissions.`,
      )
    ) {
      return
    }

    console.log("[v0] Deleting exam:", examCode)

    // First get the exam ID
    const { data: examData, error: examError } = await window.supabaseClient
      .from("exams")
      .select("id")
      .eq("exam_code", examCode)
      .eq("instructor_id", instructorSession.id)
      .single()

    if (examError || !examData) {
      console.error("[v0] Error fetching exam for deletion:", examError)
      alert("Failed to find exam for deletion.")
      return
    }

    // Delete associated exam sessions first (to maintain referential integrity)
    const { error: sessionsError } = await window.supabaseClient
      .from("exam_sessions")
      .delete()
      .eq("exam_id", examData.id)

    if (sessionsError) {
      console.error("[v0] Error deleting exam sessions:", sessionsError)
      alert("Failed to delete exam sessions. Please try again.")
      return
    }

    // Delete the exam
    const { error: deleteError } = await window.supabaseClient
      .from("exams")
      .delete()
      .eq("exam_code", examCode)
      .eq("instructor_id", instructorSession.id)

    if (deleteError) {
      console.error("[v0] Error deleting exam:", deleteError)
      alert("Failed to delete exam. Please try again.")
      return
    }

    console.log(`[v0] Exam ${examCode} deleted successfully`)

    // Show success message
    showSuccessMessage(`Exam "${examTitle}" has been deleted successfully.`)

    // Refresh the exam list and dashboard stats
    await loadExams()
    await loadDashboardStats()
    await loadRecentActivity()
  } catch (error) {
    console.error("[v0] Error deleting exam:", error)
    alert("An unexpected error occurred while deleting the exam.")
  }
}

function showSuccessMessage(message) {
  const successDiv = document.createElement("div")
  successDiv.className = "success-banner"
  successDiv.innerHTML = `
    <div class="success-content">
      <svg class="success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="btn btn-sm btn-outline">Dismiss</button>
    </div>
  `

  document.body.insertBefore(successDiv, document.body.firstChild)

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (successDiv.parentElement) {
      successDiv.remove()
    }
  }, 5000)
}

async function loadRecentActivity() {
  // Placeholder for loadRecentActivity function
  console.log("[v0] Loading recent activity")
}

async function safeRefreshDashboardStats() {
  // Placeholder for safeRefreshDashboardStats function
  console.log("[v0] Safely refreshing dashboard stats")
}

console.log("[v0] Dashboard script loaded successfully")
