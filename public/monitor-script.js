let monitoringInterval = null
let activeStreams = []
let violations = []
let examCode = null
let examId = null // Added examId to store the actual database ID
let selectedStudentId = null
const studentActivities = new Map()

document.addEventListener("DOMContentLoaded", async () => {
  console.log("[v0] Monitor script loaded, initializing...")
  await initializeMonitor()
  startMonitoring()

  // Set up event listeners
  document.getElementById("refresh-btn").onclick = refreshMonitoring
  document.getElementById("clear-violations-btn").onclick = clearViolations

  const toggleViolationsBtn = document.getElementById("toggle-violations-btn")
  if (toggleViolationsBtn) {
    toggleViolationsBtn.onclick = toggleViolationsPanel
  }

  const closeActivityBtn = document.getElementById("close-activity-panel")
  if (closeActivityBtn) {
    closeActivityBtn.onclick = closeStudentActivityPanel
  }
})

async function initializeMonitor() {
  console.log("[v0] Initializing monitor...")

  // Get exam info from URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  examCode = urlParams.get("examId")
  console.log("[v0] Exam code from URL:", examCode)

  if (examCode && window.supabaseClient) {
    try {
      const { data: examData, error } = await window.supabaseClient
        .from("exams")
        .select("id, title")
        .eq("exam_code", examCode)
        .single()

      if (error || !examData) {
        console.error("[v0] Error fetching exam data:", error)
        document.getElementById("exam-title").textContent = "Unknown Exam"
        document.getElementById("exam-code").textContent = `Code: ${examCode || "----"}`
        return
      }

      examId = examData.id
      document.getElementById("exam-title").textContent = examData.title || "Unknown Exam"
      document.getElementById("exam-code").textContent = `Code: ${examCode || "----"}`

      console.log("[v0] Exam ID resolved:", examId)
    } catch (error) {
      console.error("[v0] Error initializing monitor:", error)
    }
  } else {
    // Fallback to localStorage for demo
    const examData = JSON.parse(localStorage.getItem("examData") || "{}")
    console.log("[v0] Exam data from localStorage:", examData)

    document.getElementById("exam-title").textContent = examData.title || "Unknown Exam"
    document.getElementById("exam-code").textContent = `Code: ${examCode || "----"}`
  }

  try {
    console.log("[v0] Checking if videoMonitor is available:", !!window.videoMonitor)
    if (window.videoMonitor && examCode) {
      console.log("[v0] Initializing video monitor with exam code:", examCode)
      await window.videoMonitor.initialize(examCode)
      updateConnectionStatus("connected", "Monitoring Active")
      console.log("[v0] Video monitor initialized successfully")
    } else {
      console.warn("[v0] Video monitor not available or no exam code")
      updateConnectionStatus("error", "Video Monitor Unavailable")
    }
  } catch (error) {
    console.error("[v0] Failed to initialize video monitoring:", error)
    updateConnectionStatus("error", "Connection Failed")
  }
}

function startMonitoring() {
  refreshMonitoring()

  // Refresh every 5 seconds
  monitoringInterval = setInterval(refreshMonitoring, 5000)
}

async function refreshMonitoring() {
  console.log("[v0] Refreshing monitoring connections...")

  try {
    if (!window.supabaseClient) {
      console.error("[v0] Supabase client not available")
      return
    }

    if (!examId) {
      console.error("[v0] Exam ID not available")
      activeStreams = []
      violations = []
      updateStats()
      updateViolationsList()
      return
    }

    // Get active exam sessions for this exam using the correct exam ID
    const { data: examSessions, error: sessionsError } = await window.supabaseClient
      .from("exam_sessions")
      .select("*")
      .eq("exam_id", examId)
      .eq("status", "active")

    if (sessionsError) {
      console.error("[v0] Error fetching exam sessions:", sessionsError)
      activeStreams = []
    } else {
      activeStreams = examSessions || []
      console.log("[v0] Active exam sessions:", activeStreams.length)
    }

    // Get violations from exam_sessions violations column
    violations = []
    activeStreams.forEach((session) => {
      if (session.violations && Array.isArray(session.violations)) {
        session.violations.forEach((violation) => {
          violations.push({
            ...violation,
            student: {
              id: session.id,
              name: session.student_name,
              studentNumber: session.student_number,
            },
            timestamp: violation.timestamp || session.created_at,
          })
        })
      }
    })

    // Sort violations by timestamp (newest first)
    violations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    violations = violations.slice(-50) // Keep last 50 violations
  } catch (error) {
    console.error("[v0] Error in refreshMonitoring:", error)
    activeStreams = []
    violations = []
  }

  updateStats()
  updateViolationsList()

  // Refresh video monitoring connections
  if (window.videoMonitor && window.videoMonitor.isActive) {
    try {
      await window.videoMonitor.refreshConnections()
      updateConnectionStatus("connected", "Connections Refreshed")
    } catch (error) {
      console.error("[v0] Error refreshing video connections:", error)
      updateConnectionStatus("error", "Refresh Failed")
    }
  }
}

function updateStats() {
  document.getElementById("active-students").textContent = activeStreams.length
  document.getElementById("total-violations").textContent = violations.length

  const flaggedStudents = violations.filter((v) => v.type === "Manual Flag").length
  const flagsElement = document.getElementById("total-flags")
  if (flagsElement) {
    flagsElement.textContent = flaggedStudents
  }
}

function updateConnectionStatus(status, message) {
  const connectionDot = document.getElementById("connection-dot")
  const connectionStatus = document.getElementById("connection-status")

  if (connectionDot && connectionStatus) {
    connectionDot.className = `status-dot ${status}`
    connectionStatus.textContent = message
  }
}

function updateViolationsList() {
  const violationsList = document.getElementById("violations-list")

  if (violations.length === 0) {
    violationsList.innerHTML = `
      <div class="no-violations">
        <p>No security alerts yet. Monitoring active...</p>
      </div>
    `
    return
  }

  // Sort violations by timestamp (newest first)
  const sortedViolations = violations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  violationsList.innerHTML = sortedViolations
    .map(
      (violation) => `
      <div class="violation-item" onclick="showStudentActivity('${violation.student?.id}')">
        <div class="violation-header">
          <span class="violation-type">${formatViolationType(violation.type)}</span>
          <span class="violation-time">${formatTime(violation.timestamp)}</span>
        </div>
        <div class="violation-details">
          <strong>${violation.student?.surname || "Unknown"}, ${violation.student?.name || "Student"}</strong>
          ${violation.student?.studentNumber ? `(${violation.student.studentNumber})` : ""}
        </div>
        <div class="violation-message">${violation.description || violation.message || "Security violation detected"}</div>
      </div>
    `,
    )
    .join("")
}

function formatViolationType(type) {
  const types = {
    tab_switch: "Tab/Window Switch",
    dev_tools: "Developer Tools Access",
    suspicious_activity: "Suspicious Activity",
    multiple_people: "Multiple People Detected",
    camera_blocked: "Camera Blocked",
    "Manual Flag": "Instructor Flag",
    face_not_detected: "Face Not Detected",
    unauthorized_device: "Unauthorized Device",
  }

  return types[type] || type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) {
    // Less than 1 minute
    return "Just now"
  } else if (diff < 3600000) {
    // Less than 1 hour
    const minutes = Math.floor(diff / 60000)
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  } else {
    return date.toLocaleTimeString()
  }
}

function toggleViolationsPanel() {
  const panel = document.getElementById("violations-panel")
  const main = document.querySelector(".zoom-main")

  if (panel && main) {
    const isHidden = panel.style.display === "none"

    if (isHidden) {
      panel.style.display = "flex"
      main.style.height = "calc(100vh - 60px - 80px)"
    } else {
      panel.style.display = "none"
      main.style.height = "calc(100vh - 60px)"
    }
  }
}

async function clearViolations() {
  if (confirm("Are you sure you want to clear all violations from the display?")) {
    try {
      if (!window.supabaseClient) {
        console.error("[v0] Supabase client not available")
        return
      }

      if (!examId) {
        console.error("[v0] Exam ID not available")
        return
      }

      // Update all exam sessions to clear violations
      const { error } = await window.supabaseClient
        .from("exam_sessions")
        .update({ violations: [] })
        .eq("exam_id", examId)

      if (error) {
        console.error("[v0] Error clearing violations:", error)
        alert("Failed to clear violations. Please try again.")
        return
      }

      violations = []
      updateViolationsList()
      updateStats()

      console.log("[v0] Violations cleared from database")
    } catch (error) {
      console.error("[v0] Error clearing violations:", error)
      alert("Failed to clear violations. Please try again.")
    }
  }
}

function monitorExam(examCode) {
  console.log("[v0] Opening monitor for exam:", examCode)
  const monitorUrl = `monitor.html?examId=${examCode}`
  window.open(monitorUrl, "_blank", "width=1200,height=800")
}

// Make functions available globally for button onclick handlers
window.monitorExam = monitorExam

// Clean up on page unload
window.addEventListener("beforeunload", () => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
  }

  if (window.videoMonitor && window.videoMonitor.isActive) {
    window.videoMonitor.cleanup()
  }
})

window.addEventListener("studentStreamReceived", (event) => {
  console.log("[v0] Student stream received in monitor:", event.detail.studentId)
  updateConnectionStatus("connected", `${activeStreams.length} Students Connected`)
})

window.addEventListener("studentDisconnected", (event) => {
  console.log("[v0] Student disconnected from monitor:", event.detail.studentId)
  updateConnectionStatus("connected", `${activeStreams.length - 1} Students Connected`)
})

window.addEventListener("load", async () => {
  console.log("[v0] Window loaded, checking video monitor availability...")

  // Small delay to ensure all scripts are loaded
  setTimeout(async () => {
    console.log("[v0] Delayed initialization check...")
    console.log("[v0] videoMonitor available:", !!window.videoMonitor)
    console.log("[v0] examCode:", examCode)

    if (window.videoMonitor && examCode) {
      try {
        console.log("[v0] Attempting to initialize video monitoring...")
        await window.videoMonitor.initialize(examCode)
        updateConnectionStatus("connected", "Video Monitoring Active")
        console.log("[v0] Video monitoring initialized successfully")
      } catch (error) {
        console.error("[v0] Failed to initialize video monitoring:", error)
        updateConnectionStatus("error", "Video Monitoring Failed")
      }
    } else {
      console.warn("[v0] Cannot initialize video monitoring - missing requirements")
      if (!window.videoMonitor) console.warn("[v0] - videoMonitor not available")
      if (!examCode) console.warn("[v0] - examCode not available")
    }
  }, 1000)
})

function showStudentActivity(studentId) {
  console.log("[v0] Showing activity for student:", studentId)
  selectedStudentId = studentId

  const panel = document.getElementById("student-activity-panel")
  const main = document.querySelector(".zoom-main")

  if (panel && main) {
    panel.classList.add("open")
    main.classList.add("with-side-panel")

    updateStudentActivityPanel(studentId)
  }
}

function closeStudentActivityPanel() {
  const panel = document.getElementById("student-activity-panel")
  const main = document.querySelector(".zoom-main")

  if (panel && main) {
    panel.classList.remove("open")
    main.classList.remove("with-side-panel")
  }

  selectedStudentId = null
}

function updateStudentActivityPanel(studentId) {
  const activityList = document.getElementById("student-activity-list")

  const studentInfo = activeStreams.find((stream) => stream.id === Number.parseInt(studentId))

  if (!activityList || !studentInfo) return

  const activities = []

  // Add violations as activities
  if (studentInfo.violations && Array.isArray(studentInfo.violations)) {
    studentInfo.violations.forEach((violation) => {
      activities.push({
        timestamp: violation.timestamp || studentInfo.created_at,
        name: violation.type || "security_violation",
        description: violation.description || violation.message,
      })
    })
  }

  // Add exam start activity
  activities.push({
    timestamp: studentInfo.start_time || studentInfo.created_at,
    name: "exam_started",
    description: "Started the exam",
  })

  // Add answer activities if available
  if (studentInfo.answers && typeof studentInfo.answers === "object") {
    Object.keys(studentInfo.answers).forEach((questionId) => {
      activities.push({
        timestamp: studentInfo.updated_at || studentInfo.created_at,
        name: "question_answered",
        description: `Answered question ${questionId}`,
        question_number: questionId,
      })
    })
  }

  // Sort activities by timestamp (newest first)
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  if (activities.length === 0) {
    activityList.innerHTML = `
      <div class="no-activity">
        <h4>${studentInfo.student_name}</h4>
        <p>No recent activity recorded</p>
      </div>
    `
    return
  }

  activityList.innerHTML = `
    <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #404040;">
      <h4 style="margin: 0; color: white;">${studentInfo.student_name}</h4>
      <p style="margin: 0.25rem 0 0 0; color: #a1a1aa; font-size: 0.875rem;">${studentInfo.student_number}</p>
      <p style="margin: 0.25rem 0 0 0; color: #a1a1aa; font-size: 0.875rem;">Status: ${studentInfo.status}</p>
    </div>
    ${activities
      .slice(0, 20) // Show last 20 activities
      .map(
        (activity) => `
      <div class="activity-item">
        <div class="activity-timestamp">${formatTime(activity.timestamp)}</div>
        <div class="activity-description">${formatActivityDescription(activity)}</div>
      </div>
    `,
      )
      .join("")}
  `
}

function formatActivityDescription(activity) {
  const descriptions = {
    exam_started: "Started the exam",
    question_answered: `Answered question ${activity.question_number || "N/A"}`,
    tab_switch: "Switched browser tab/window",
    dev_tools: "Opened developer tools",
    camera_blocked: "Camera was blocked",
    face_not_detected: "Face not detected in camera",
    multiple_people: "Multiple people detected",
    suspicious_activity: "Suspicious activity detected",
    exam_submitted: "Submitted the exam",
    connection_lost: "Lost connection",
    connection_restored: "Connection restored",
  }

  return descriptions[activity.name] || activity.description || "Unknown activity"
}

window.showStudentActivity = showStudentActivity
