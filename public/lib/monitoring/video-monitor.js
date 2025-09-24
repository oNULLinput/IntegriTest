// Video Monitoring System for Instructor Dashboard
// Local-only implementation with no database storage

class VideoMonitor {
  constructor() {
    this.peerManager = null
    this.examCode = null
    this.studentStreams = new Map()
    this.videoGrid = null
    this.isActive = false
    this.maxVideosPerPage = 12
    this.currentPage = 0
    this.studentData = new Map()
    this.violationCount = 0
  }

  // Initialize monitoring system
  async initialize(examCode) {
    console.log("[v0] Initializing video monitor for exam:", examCode)
    this.examCode = examCode

    // Initialize WebRTC peer manager
    const PeerConnectionManager = window.PeerConnectionManager // Declare the variable here
    this.peerManager = new PeerConnectionManager()
    await this.peerManager.initializeAsInstructor(examCode)

    // Setup event listeners
    this.setupEventListeners()

    // Start signaling
    this.peerManager.startSignalingPolling()

    // Setup UI
    this.setupMonitorInterface()

    this.isActive = true
    console.log("[v0] Video monitor initialized successfully")
  }

  // Setup event listeners for WebRTC events
  setupEventListeners() {
    // Listen for incoming student streams
    window.addEventListener("studentStreamReceived", (event) => {
      const { studentId, stream } = event.detail
      this.handleNewStudentStream(studentId, stream)
    })

    // Listen for student disconnections
    window.addEventListener("studentDisconnected", (event) => {
      const { studentId } = event.detail
      this.handleStudentDisconnection(studentId)
    })
  }

  // Setup monitor interface elements
  setupMonitorInterface() {
    this.videoGrid = document.getElementById("video-grid")
    if (!this.videoGrid) {
      console.error("[v0] Video grid element not found")
      return
    }

    // Update participant count
    this.updateParticipantCount()

    // Setup refresh button
    const refreshBtn = document.getElementById("refresh-btn")
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.refreshConnections())
    }
  }

  // Handle new student video stream
  handleNewStudentStream(studentId, stream) {
    console.log("[v0] New student stream received:", studentId)

    this.studentStreams.set(studentId, stream)

    const studentInfo = this.generateStudentInfo(studentId)
    this.studentData.set(studentId, studentInfo)
    this.renderVideoGrid()
    this.updateParticipantCount()
  }

  // Handle student disconnection
  handleStudentDisconnection(studentId) {
    console.log("[v0] Student disconnected:", studentId)

    this.studentStreams.delete(studentId)
    this.studentData.delete(studentId)
    this.renderVideoGrid()
    this.updateParticipantCount()
  }

  generateStudentInfo(studentId) {
    // Try to get from localStorage first
    const sessions = JSON.parse(localStorage.getItem("examSessions") || "[]")
    const session = sessions.find(
      (s) => s.student_number === studentId || s.studentNumber === studentId || s.id === studentId,
    )

    if (session) {
      return {
        name: session.name || session.student_name || "Unknown",
        surname: session.surname || "Student",
        studentNumber: session.student_number || session.studentNumber || studentId,
        status: "online",
      }
    }

    // Generate basic info from studentId
    return {
      name: "Student",
      surname: studentId.substring(0, 8),
      studentNumber: studentId,
      status: "online",
    }
  }

  // Render video grid with student streams
  renderVideoGrid() {
    if (!this.videoGrid) return

    const students = Array.from(this.studentStreams.entries())

    // Hide "no students" message
    const noStudentsEl = document.getElementById("no-students")
    if (noStudentsEl) {
      noStudentsEl.style.display = students.length > 0 ? "none" : "flex"
    }

    if (students.length === 0) {
      this.videoGrid.innerHTML = ""
      return
    }

    // Calculate grid layout
    const gridClass = this.getGridClass(students.length)
    this.videoGrid.className = `video-grid ${gridClass}`

    // Render video tiles
    this.videoGrid.innerHTML = students
      .map(([studentId, stream]) => {
        const studentInfo = this.studentData.get(studentId) || {
          name: "Unknown",
          surname: "Student",
          studentNumber: studentId,
          status: "online",
        }

        return this.createVideoTile(studentId, stream, studentInfo)
      })
      .join("")

    // Attach streams to video elements
    students.forEach(([studentId, stream]) => {
      const videoElement = document.getElementById(`video-${studentId}`)
      if (videoElement) {
        videoElement.srcObject = stream
        videoElement.play().catch((error) => {
          console.error("[v0] Error playing video for student:", studentId, error)
        })
      }
    })
  }

  // Create video tile HTML
  createVideoTile(studentId, stream, studentInfo) {
    return `
      <div class="video-tile" data-student-id="${studentId}">
        <div class="video-container">
          <video 
            id="video-${studentId}" 
            class="student-video" 
            autoplay 
            muted 
            playsinline
          ></video>
          <div class="video-overlay">
            <div class="student-info">
              <div class="student-name">${studentInfo.surname}, ${studentInfo.name}</div>
              <div class="student-id">${studentInfo.studentNumber}</div>
            </div>
            <div class="video-controls">
              <button class="control-btn" onclick="videoMonitor.flagStudent('${studentId}')" title="Flag for attention">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2H21l-3 6 3 6h-8.5l-1-2H5a2 2 0 00-2 2zm9-13.5V9"></path>
                </svg>
              </button>
              <button class="control-btn" onclick="videoMonitor.focusStudent('${studentId}')" title="Focus view">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="connection-indicator ${this.getConnectionStatus(studentId)}">
            <div class="indicator-dot"></div>
          </div>
        </div>
      </div>
    `
  }

  // Get CSS grid class based on number of students
  getGridClass(count) {
    if (count === 1) return "grid-1"
    if (count === 2) return "grid-2"
    if (count <= 4) return "grid-4"
    if (count <= 6) return "grid-6"
    if (count <= 9) return "grid-9"
    return "grid-12"
  }

  // Get connection status for student
  getConnectionStatus(studentId) {
    // In a real implementation, check WebRTC connection state
    return "connected" // 'connected', 'connecting', 'disconnected'
  }

  // Update participant count display
  updateParticipantCount() {
    const countEl = document.getElementById("active-students")
    if (countEl) {
      countEl.textContent = this.studentStreams.size
    }
  }

  // Flag student for attention
  flagStudent(studentId) {
    console.log("[v0] Flagging student for attention:", studentId)

    const studentInfo = this.studentData.get(studentId)
    if (studentInfo) {
      this.addViolation({
        type: "Manual Flag",
        student: studentInfo,
        message: `Student flagged by instructor for attention`,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Focus on specific student (enlarge their video)
  focusStudent(studentId) {
    console.log("[v0] Focusing on student:", studentId)

    // Remove existing focus
    document.querySelectorAll(".video-tile").forEach((tile) => {
      tile.classList.remove("focused")
    })

    // Add focus to selected student
    const studentTile = document.querySelector(`[data-student-id="${studentId}"]`)
    if (studentTile) {
      studentTile.classList.add("focused")
    }
  }

  addViolation(violation) {
    const violationsList = document.getElementById("violations-list")
    const totalCount = document.getElementById("total-violations")

    if (violationsList && totalCount) {
      const violationEl = document.createElement("div")
      violationEl.className = "violation-item"
      violationEl.innerHTML = `
        <div class="violation-header">
          <span class="violation-type">${violation.type}</span>
          <span class="violation-time">${new Date(violation.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="violation-details">
          <strong>${violation.student.surname}, ${violation.student.name}</strong> (${violation.student.studentNumber})
        </div>
        <div class="violation-message">${violation.message}</div>
      `

      violationsList.insertBefore(violationEl, violationsList.firstChild)

      // Update count
      this.violationCount++
      totalCount.textContent = this.violationCount
    }

    // Store in localStorage for session persistence
    const violations = JSON.parse(localStorage.getItem("sessionViolations") || "[]")
    violations.push(violation)
    localStorage.setItem("sessionViolations", JSON.stringify(violations))
  }

  // Refresh all connections
  async refreshConnections() {
    console.log("[v0] Refreshing all connections")

    // Clear existing connections
    this.studentStreams.clear()
    this.studentData.clear()
    this.renderVideoGrid()

    // Restart signaling to reconnect
    if (this.peerManager) {
      this.peerManager.cleanup()
      await this.peerManager.initializeAsInstructor(this.examCode)
      this.peerManager.startSignalingPolling()
    }
  }

  // Cleanup monitoring system
  cleanup() {
    console.log("[v0] Cleaning up video monitor")

    this.isActive = false

    if (this.peerManager) {
      this.peerManager.cleanup()
    }

    this.studentStreams.clear()
    this.studentData.clear()

    // Remove event listeners
    window.removeEventListener("studentStreamReceived", this.handleNewStudentStream)
    window.removeEventListener("studentDisconnected", this.handleStudentDisconnection)
  }
}

// Global instance
window.videoMonitor = new VideoMonitor()
