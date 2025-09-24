// Student Camera Integration for Exam Monitoring
class StudentCameraManager {
  constructor() {
    this.stream = null
    this.peerManager = null
    this.isActive = false
    this.examCode = null
    this.studentId = null
  }

  // Initialize camera for exam monitoring
  async initialize(examCode, studentInfo) {
    console.log("[v0] Initializing student camera for exam:", examCode)

    this.examCode = examCode
    this.studentId = studentInfo.studentNumber || `student_${Date.now()}`

    try {
      // Request camera permission and get stream
      await this.requestCameraAccess()

      // Initialize WebRTC for instructor monitoring
      await this.initializeWebRTC()

      // Setup monitoring interface
      this.setupMonitoringInterface()

      this.isActive = true
      console.log("[v0] Student camera initialized successfully")

      return true
    } catch (error) {
      console.error("[v0] Failed to initialize student camera:", error)
      throw error
    }
  }

  // Request camera access with user-friendly prompts
  async requestCameraAccess() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          facingMode: "user",
          frameRate: { ideal: 15, max: 30 },
        },
        audio: false, // No audio for privacy
      })

      console.log("[v0] Camera access granted")
      return this.stream
    } catch (error) {
      console.error("[v0] Camera access denied:", error)

      let errorMessage = "Camera access is required for exam monitoring."

      if (error.name === "NotAllowedError") {
        errorMessage = "Camera permission denied. Please allow camera access and refresh the page."
      } else if (error.name === "NotFoundError") {
        errorMessage = "No camera found. Please connect a camera and try again."
      } else if (error.name === "NotReadableError") {
        errorMessage = "Camera is being used by another application. Please close other apps and try again."
      }

      throw new Error(errorMessage)
    }
  }

  // Initialize WebRTC connection for instructor monitoring
  async initializeWebRTC() {
    if (!window.PeerConnectionManager) {
      console.warn("[v0] WebRTC not available, monitoring will be limited")
      return
    }

    try {
      this.peerManager = new window.PeerConnectionManager()
      await this.peerManager.initializeAsStudent(this.studentId, this.examCode)

      // Start signaling to connect with instructor
      this.peerManager.startSignalingPolling()

      let retryCount = 0
      const maxRetries = 3

      const attemptConnection = () => {
        if (this.peerManager && retryCount < maxRetries) {
          console.log(`[v0] Attempting to connect to instructor (attempt ${retryCount + 1})`)
          this.peerManager.createOffer("instructor")
          retryCount++

          // Retry after 3 seconds if no connection established
          setTimeout(() => {
            if (this.peerManager && this.peerManager.peerConnections.size === 0 && retryCount < maxRetries) {
              attemptConnection()
            }
          }, 3000)
        }
      }

      // Start connection attempts after 2 seconds
      setTimeout(attemptConnection, 2000)

      console.log("[v0] WebRTC initialized for instructor monitoring")
    } catch (error) {
      console.error("[v0] WebRTC initialization failed:", error)
      // Continue without WebRTC - local monitoring still works
    }
  }

  // Setup monitoring interface elements
  setupMonitoringInterface() {
    // Create or update camera preview
    const cameraPreview = document.getElementById("monitoring-camera") || this.createCameraPreview()

    if (this.stream && cameraPreview) {
      cameraPreview.srcObject = this.stream
      cameraPreview.play().catch((error) => {
        console.error("[v0] Error playing camera preview:", error)
      })
    }

    // Update monitoring status
    this.updateMonitoringStatus("active", "Camera monitoring active")

    // Setup periodic health checks
    this.startHealthChecks()
  }

  // Create camera preview element if it doesn't exist
  createCameraPreview() {
    const preview = document.createElement("video")
    preview.id = "monitoring-camera"
    preview.autoplay = true
    preview.muted = true
    preview.playsInline = true
    preview.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 160px;
      height: 120px;
      border-radius: 8px;
      border: 2px solid #10b981;
      background: #000;
      z-index: 1000;
    `

    document.body.appendChild(preview)
    return preview
  }

  // Update monitoring status display
  updateMonitoringStatus(status, message) {
    const statusElement = document.getElementById("monitoring-status")
    if (statusElement) {
      const statusClass = status === "active" ? "connected" : status === "error" ? "error" : "connecting"

      statusElement.innerHTML = `
        <span class="status-indicator ${statusClass}"></span>
        ${message}
      `
    }
  }

  // Start periodic health checks
  startHealthChecks() {
    setInterval(() => {
      this.performHealthCheck()
    }, 10000) // Check every 10 seconds
  }

  // Perform health check on camera and connections
  performHealthCheck() {
    if (!this.isActive) return

    // Check camera stream
    if (!this.stream || this.stream.getTracks().length === 0) {
      console.warn("[v0] Camera stream lost, attempting to reconnect...")
      this.handleStreamLoss()
      return
    }

    // Check if tracks are still active
    const videoTrack = this.stream.getVideoTracks()[0]
    if (!videoTrack || videoTrack.readyState !== "live") {
      console.warn("[v0] Video track not active, attempting to reconnect...")
      this.handleStreamLoss()
      return
    }

    // Update status
    this.updateMonitoringStatus("active", "Monitoring active")
  }

  // Handle camera stream loss
  async handleStreamLoss() {
    try {
      console.log("[v0] Attempting to restore camera stream...")

      // Stop existing stream
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop())
      }

      // Request new stream
      await this.requestCameraAccess()

      // Update preview
      const cameraPreview = document.getElementById("monitoring-camera")
      if (cameraPreview && this.stream) {
        cameraPreview.srcObject = this.stream
      }

      // Reconnect WebRTC if needed
      if (this.peerManager) {
        // Add new stream to existing connections
        this.stream.getTracks().forEach((track) => {
          this.peerManager.peerConnections.forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track && s.track.kind === track.kind)
            if (sender) {
              sender.replaceTrack(track)
            } else {
              pc.addTrack(track, this.stream)
            }
          })
        })
      }

      this.updateMonitoringStatus("active", "Camera restored")
      console.log("[v0] Camera stream restored successfully")
    } catch (error) {
      console.error("[v0] Failed to restore camera stream:", error)
      this.updateMonitoringStatus("error", "Camera connection lost")

      // Show error to user
      this.showCameraErrorDialog("Camera connection lost. Please check your camera and refresh the page.")
    }
  }

  // Show camera error dialog
  showCameraErrorDialog(message) {
    // Remove existing dialog if present
    const existingDialog = document.getElementById("camera-error-dialog")
    if (existingDialog) {
      existingDialog.remove()
    }

    const dialog = document.createElement("div")
    dialog.id = "camera-error-dialog"
    dialog.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Camera Issue</h3>
          </div>
          <div class="modal-body">
            <p>${message}</p>
            <p>Camera monitoring is required for this exam. Please resolve the issue to continue.</p>
          </div>
          <div class="modal-actions">
            <button onclick="location.reload()" class="btn btn-primary">Refresh Page</button>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn btn-secondary">Continue Anyway</button>
          </div>
        </div>
      </div>
    `

    // Add styles
    const style = document.createElement("style")
    style.textContent = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }
      .modal-content {
        background: white;
        border-radius: 8px;
        padding: 2rem;
        max-width: 400px;
        margin: 1rem;
      }
      .modal-header h3 {
        margin: 0 0 1rem 0;
        color: #dc2626;
      }
      .modal-body p {
        margin: 0 0 1rem 0;
        color: #374151;
      }
      .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
      }
      .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
      }
      .btn-primary {
        background: #3b82f6;
        color: white;
      }
      .btn-secondary {
        background: #6b7280;
        color: white;
      }
    `

    document.head.appendChild(style)
    document.body.appendChild(dialog)
  }

  // Cleanup all resources
  async cleanup() {
    console.log("[v0] Cleaning up student camera resources...")

    this.isActive = false

    // Stop camera stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }

    // Cleanup WebRTC
    if (this.peerManager) {
      this.peerManager.cleanup()
      this.peerManager = null
    }

    // Remove camera preview
    const preview = document.getElementById("monitoring-camera")
    if (preview) {
      preview.remove()
    }

    console.log("[v0] Student camera cleanup completed")
  }
}

// Export for global use
window.StudentCameraManager = StudentCameraManager
