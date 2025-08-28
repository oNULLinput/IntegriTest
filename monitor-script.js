// Monitor page functionality
let currentStudents = []
let expandedCameraModal = null
let monitoringInterval = null

// Initialize monitor page
document.addEventListener("DOMContentLoaded", () => {
  initializeMonitor()
  startMonitoring()
})

function initializeMonitor() {
  // Get exam ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  const examId = urlParams.get("examId") || "Unknown Exam"

  // Update exam info
  document.getElementById("examInfo").textContent = `Exam ID: ${examId}`

  // Initialize expanded camera modal
  expandedCameraModal = document.getElementById("expandedCameraModal")

  // Load initial student data
  loadStudentData()
}

function startMonitoring() {
  // Update student feeds every 2 seconds
  monitoringInterval = setInterval(() => {
    loadStudentData()
    updateViolationIndicators()
  }, 2000)
}

function loadStudentData() {
  // In a real implementation, this would fetch data from your backend
  // For now, we'll simulate with empty data since test examiners were removed
  currentStudents = []

  updateCameraGrid()
  updateStats()
}

function updateCameraGrid() {
  const cameraGrid = document.getElementById("cameraGrid")
  const noStudentsMessage = document.getElementById("noStudentsMessage")

  if (currentStudents.length === 0) {
    // Show no students message
    noStudentsMessage.style.display = "flex"
    // Remove any existing student feeds
    const existingFeeds = cameraGrid.querySelectorAll(".student-feed")
    existingFeeds.forEach((feed) => feed.remove())
  } else {
    // Hide no students message
    noStudentsMessage.style.display = "none"

    // Clear existing feeds
    const existingFeeds = cameraGrid.querySelectorAll(".student-feed")
    existingFeeds.forEach((feed) => feed.remove())

    // Create student feeds
    currentStudents.forEach((student) => {
      createStudentFeed(student)
    })
  }
}

function createStudentFeed(student) {
  const cameraGrid = document.getElementById("cameraGrid")

  const feedElement = document.createElement("div")
  feedElement.className = "student-feed"
  feedElement.setAttribute("data-student-id", student.id)
  feedElement.onclick = () => expandCamera(student)

  feedElement.innerHTML = `
        <video class="student-video" autoplay muted>
            <source src="/placeholder-video" type="video/mp4">
        </video>
        <div class="student-overlay">
            <div class="student-info">
                <h3>${student.name}</h3>
                <div class="student-progress">${student.progress}% Complete</div>
            </div>
            <div class="student-status">
                <div class="status-indicator ${student.status === "violation" ? "violation" : ""}"></div>
                ${student.status === "violation" ? "Violation" : "Online"}
            </div>
        </div>
    `

  cameraGrid.appendChild(feedElement)

  // Apply violation effects
  applyViolationEffects(feedElement, student)
}

function applyViolationEffects(feedElement, student) {
  // Remove existing violation classes
  feedElement.classList.remove("violation-no-face", "violation-multiple-faces", "violation-tab-switch")

  // Apply appropriate violation class based on student status
  if (student.violationType) {
    feedElement.classList.add(`violation-${student.violationType}`)
  }
}

function updateViolationIndicators() {
  // Update violation indicators for all student feeds
  currentStudents.forEach((student) => {
    const feedElement = document.querySelector(`[data-student-id="${student.id}"]`)
    if (feedElement) {
      applyViolationEffects(feedElement, student)
    }
  })
}

function updateStats() {
  const activeStudents = currentStudents.length
  const violationCount = currentStudents.filter((s) => s.status === "violation").length
  const avgProgress =
    activeStudents > 0 ? Math.round(currentStudents.reduce((sum, s) => sum + s.progress, 0) / activeStudents) : 0

  document.getElementById("activeStudents").textContent = activeStudents
  document.getElementById("violationCount").textContent = violationCount
  document.getElementById("avgProgress").textContent = `${avgProgress}%`
}

function expandCamera(student) {
  // Populate expanded camera modal
  document.getElementById("expandedStudentName").textContent = student.name
  document.getElementById("expandedStatus").textContent =
    student.status === "violation" ? "Violation Detected" : "Online"
  document.getElementById("expandedProgress").textContent = `${student.progress}%`
  document.getElementById("expandedViolations").textContent = student.violations || 0
  document.getElementById("expandedTimeRemaining").textContent = "45:30" // Mock time

  // Show modal
  expandedCameraModal.classList.add("active")

  // In a real implementation, you would connect to the student's camera feed here
  const expandedVideo = document.getElementById("expandedVideo")
  expandedVideo.src = "/placeholder-video" // Mock video source
}

function closeExpandedCamera() {
  expandedCameraModal.classList.remove("active")
}

function goBackToDashboard() {
  // Stop monitoring
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
  }

  // Close the tab or navigate back
  if (window.history.length > 1) {
    window.history.back()
  } else {
    window.close()
  }
}

// Handle window close
window.addEventListener("beforeunload", () => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
  }
})

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Escape key to close expanded camera
  if (e.key === "Escape" && expandedCameraModal.classList.contains("active")) {
    closeExpandedCamera()
  }

  // Ctrl+W or Alt+F4 to go back to dashboard
  if ((e.ctrlKey && e.key === "w") || (e.altKey && e.key === "F4")) {
    e.preventDefault()
    goBackToDashboard()
  }
})
