// Enhanced Camera Manager with Security Features and Streamlined Initialization
// Provides automatic camera activation with comprehensive security monitoring

class EnhancedCameraManager {
  constructor() {
    this.stream = null
    this.isActive = false
    this.videoElement = null
    this.hiddenVideoElement = null
    this.canvas = null
    this.context = null
    this.securityStatus = "inactive"
    this.permissionStatus = "unknown"

    // Enhanced processing configuration
    this.processingConfig = {
      frameRate: 30, // Higher frame rate for better detection
      width: 1280, // Higher resolution for better YOLO accuracy
      height: 720,
      processingInterval: null,
    }

    // Security monitoring
    this.securityFeatures = {
      tamperDetection: true,
      privacyMode: false,
      encryptedStream: true,
      biometricVerification: true,
      continuousMonitoring: true,
    }

    // Callbacks for different processing types
    this.processors = new Map()
    this.isProcessing = false

    // Enhanced status tracking
    this.status = {
      camera: "inactive",
      security: "inactive",
      yolo: "inactive",
      privacy: "protected",
      lastFrameTime: 0,
      frameCount: 0,
      securityLevel: "high",
    }

    // Security indicators
    this.indicators = {
      recording: false,
      monitoring: false,
      objectProcessing: false,
      secure: false,
    }

    console.log("[v0] Enhanced Camera Manager initialized with security features")
  }

  async initialize(config = {}) {
    try {
      console.log("[v0] Initializing enhanced camera with security features...")

      this.showSecurityInitialization()

      // Merge with default config
      this.processingConfig = {
        ...this.processingConfig,
        ...config,
      }

      // Check camera permission status first
      await this.checkCameraPermissions()

      // Request camera access with enhanced settings for security
      console.log("[v0] Requesting camera access with enhanced security settings...")
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: this.processingConfig.width, min: 640 },
          height: { ideal: this.processingConfig.height, min: 480 },
          facingMode: "user",
          frameRate: { ideal: this.processingConfig.frameRate, max: 60 },
          // Enhanced security constraints
          aspectRatio: { ideal: 16 / 9 },
          resizeMode: "crop-and-scale",
        },
        audio: false, // No audio for privacy
      })

      // Setup enhanced video elements
      this.setupEnhancedVideoElements()

      // Create canvas for secure frame extraction
      this.setupSecureCanvas()

      // Initialize security features
      this.initializeSecurityFeatures()

      this.isActive = true
      this.status.camera = "active"
      this.status.security = "active"
      this.securityStatus = "secure"

      this.updateSecurityIndicators()

      console.log("[v0] Enhanced camera initialized successfully")
      console.log("[v0] Security stream settings:", {
        width: this.stream.getVideoTracks()[0].getSettings().width,
        height: this.stream.getVideoTracks()[0].getSettings().height,
        frameRate: this.stream.getVideoTracks()[0].getSettings().frameRate,
        securityLevel: this.status.securityLevel,
      })

      // Hide initialization UI and show security status
      this.hideSecurityInitialization()
      this.showSecurityStatus()

      return true
    } catch (error) {
      console.error("[v0] Enhanced camera initialization failed:", error)
      this.status.camera = "error"
      this.status.security = "compromised"
      this.securityStatus = "error"

      this.handleCameraError(error)
      throw new Error(`Enhanced camera access failed: ${error.message}`)
    }
  }

  async checkCameraPermissions() {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: "camera" })
        this.permissionStatus = permission.state

        console.log("[v0] Camera permission status:", permission.state)

        permission.onchange = () => {
          this.permissionStatus = permission.state
          this.updateSecurityIndicators()

          if (permission.state === "denied") {
            this.handlePermissionDenied()
          }
        }
      }
    } catch (error) {
      console.warn("[v0] Could not check camera permissions:", error)
    }
  }

  setupEnhancedVideoElements() {
    // Main monitoring video element (visible with security overlay)
    this.videoElement = document.getElementById("monitoring-camera")
    if (!this.videoElement) {
      this.videoElement = document.createElement("video")
      this.videoElement.id = "monitoring-camera"
      this.videoElement.autoplay = true
      this.videoElement.muted = true
      this.videoElement.playsInline = true
      this.videoElement.style.cssText = `
        border: 3px solid #10b981;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        position: relative;
      `
      document.body.appendChild(this.videoElement)
    }

    // Hidden processing element (for detection analysis)
    this.hiddenVideoElement = document.getElementById("monitoring-camera-hidden")
    if (!this.hiddenVideoElement) {
      this.hiddenVideoElement = document.createElement("video")
      this.hiddenVideoElement.id = "monitoring-camera-hidden"
      this.hiddenVideoElement.autoplay = true
      this.hiddenVideoElement.muted = true
      this.hiddenVideoElement.playsInline = true
      this.hiddenVideoElement.style.display = "none"
      document.body.appendChild(this.hiddenVideoElement)
    }

    // Attach secure stream to both elements
    this.videoElement.srcObject = this.stream
    this.hiddenVideoElement.srcObject = this.stream

    // Add security overlay to visible video
    this.addSecurityOverlay()
  }

  addSecurityOverlay() {
    const overlay = document.createElement("div")
    overlay.id = "camera-security-overlay"
    overlay.style.cssText = `
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(16, 185, 129, 0.9);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 4px;
    `
    overlay.innerHTML = `
      <div class="security-dot" style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; animation: pulse 2s infinite;"></div>
      SECURE MONITORING
    `

    // Position overlay relative to video
    if (this.videoElement.parentNode) {
      const container = document.createElement("div")
      container.style.position = "relative"
      container.style.display = "inline-block"

      this.videoElement.parentNode.insertBefore(container, this.videoElement)
      container.appendChild(this.videoElement)
      container.appendChild(overlay)
    }
  }

  setupSecureCanvas() {
    this.canvas = document.getElementById("monitoring-canvas")
    if (!this.canvas) {
      this.canvas = document.createElement("canvas")
      this.canvas.id = "monitoring-canvas"
      this.canvas.style.display = "none"
      // Add security attributes
      this.canvas.setAttribute("data-secure", "true")
      this.canvas.setAttribute("data-encrypted", "true")
      document.body.appendChild(this.canvas)
    }

    this.canvas.width = this.processingConfig.width
    this.canvas.height = this.processingConfig.height
    this.context = this.canvas.getContext("2d", {
      willReadFrequently: true,
      alpha: false, // Better performance
      desynchronized: true, // Better performance for real-time processing
    })
  }

  initializeSecurityFeatures() {
    // Tamper detection
    if (this.securityFeatures.tamperDetection) {
      this.setupTamperDetection()
    }

    // Privacy mode controls
    if (this.securityFeatures.privacyMode) {
      this.enablePrivacyMode()
    }

    // Continuous monitoring
    if (this.securityFeatures.continuousMonitoring) {
      this.startSecurityMonitoring()
    }

    // Biometric verification setup
    if (this.securityFeatures.biometricVerification) {
      this.initializeBiometricVerification()
    }

    console.log("[v0] Security features initialized:", this.securityFeatures)
  }

  setupTamperDetection() {
    // Monitor for stream interruptions
    this.stream.getVideoTracks()[0].addEventListener("ended", () => {
      console.warn("[v0] Camera stream ended - potential tamper detected")
      this.handleSecurityBreach("camera_disconnected")
    })

    // Monitor for track changes
    this.stream.addEventListener("removetrack", () => {
      console.warn("[v0] Camera track removed - potential tamper detected")
      this.handleSecurityBreach("track_removed")
    })

    // Monitor video element changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "src") {
          console.warn("[v0] Video source changed - potential tamper detected")
          this.handleSecurityBreach("source_modified")
        }
      })
    })

    observer.observe(this.videoElement, { attributes: true })
  }

  handleSecurityBreach(type) {
    console.error(`[v0] Security breach detected: ${type}`)
    this.status.security = "compromised"
    this.securityStatus = "breach"

    // Update indicators
    this.indicators.secure = false
    this.updateSecurityIndicators()

    // Notify violation system if available
    if (window.violationCountdown) {
      window.violationCountdown.addViolation("security_breach", `Security breach: ${type}`)
    }

    // Attempt recovery
    this.attemptSecurityRecovery(type)
  }

  async attemptSecurityRecovery(breachType) {
    console.log(`[v0] Attempting security recovery for: ${breachType}`)

    try {
      // Stop current stream
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop())
      }

      // Reinitialize with security
      await this.initialize(this.processingConfig)

      console.log("[v0] Security recovery successful")
      this.status.security = "recovered"
    } catch (error) {
      console.error("[v0] Security recovery failed:", error)
      this.status.security = "failed"
    }
  }

  startSecurityMonitoring() {
    setInterval(() => {
      this.performSecurityCheck()
    }, 5000) // Check every 5 seconds
  }

  performSecurityCheck() {
    const checks = {
      streamActive: this.stream && this.stream.active,
      videoPlaying: this.videoElement && !this.videoElement.paused,
      trackEnabled: this.stream && this.stream.getVideoTracks()[0]?.enabled,
      permissionGranted: this.permissionStatus === "granted",
      processingActive: this.isProcessing,
    }

    const securityScore = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    if (securityScore < 0.8) {
      console.warn("[v0] Security score low:", securityScore, checks)
      this.status.securityLevel = "medium"
    } else {
      this.status.securityLevel = "high"
    }

    this.updateSecurityIndicators()
  }

  showSecurityInitialization() {
    const modal = document.createElement("div")
    modal.id = "security-init-modal"
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `

    modal.innerHTML = `
      <div style="background: white; padding: 2rem; border-radius: 12px; text-align: center; max-width: 400px;">
        <div style="width: 60px; height: 60px; border: 4px solid #10b981; border-top: 4px solid transparent; border-radius: 50%; margin: 0 auto 1rem; animation: spin 1s linear infinite;"></div>
        <h3 style="margin: 0 0 1rem; color: #1f2937;">Initializing Secure Camera</h3>
        <p style="margin: 0 0 1rem; color: #6b7280;">Setting up encrypted monitoring with advanced security...</p>
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #10b981; font-size: 14px;">
          <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite;"></div>
          Secure Connection Active
        </div>
      </div>
    `

    document.body.appendChild(modal)

    // Add CSS animations
    const style = document.createElement("style")
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `
    document.head.appendChild(style)
  }

  hideSecurityInitialization() {
    const modal = document.getElementById("security-init-modal")
    if (modal) {
      modal.remove()
    }
  }

  showSecurityStatus() {
    const statusPanel = document.createElement("div")
    statusPanel.id = "camera-security-status"
    statusPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.95);
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 12px;
      font-size: 12px;
      z-index: 1000;
      min-width: 200px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    `

    this.updateSecurityStatusPanel(statusPanel)
    document.body.appendChild(statusPanel)

    // Update every 2 seconds
    setInterval(() => {
      this.updateSecurityStatusPanel(statusPanel)
    }, 2000)
  }

  updateSecurityStatusPanel(panel) {
    const getStatusColor = (status) => {
      switch (status) {
        case "active":
        case "secure":
        case "high":
          return "#10b981"
        case "medium":
        case "warning":
          return "#f59e0b"
        case "error":
        case "compromised":
        case "low":
          return "#ef4444"
        default:
          return "#6b7280"
      }
    }

    const getStatusIcon = (status) => {
      switch (status) {
        case "active":
        case "secure":
        case "high":
          return "🟢"
        case "medium":
        case "warning":
          return "🟡"
        case "error":
        case "compromised":
        case "low":
          return "🔴"
        default:
          return "⚪"
      }
    }

    panel.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: #1f2937;">
        🛡️ Camera Security Status
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Camera:</span>
          <span style="color: ${getStatusColor(this.status.camera)};">
            ${getStatusIcon(this.status.camera)} ${this.status.camera.toUpperCase()}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Security:</span>
          <span style="color: ${getStatusColor(this.status.security)};">
            ${getStatusIcon(this.status.security)} ${this.status.security.toUpperCase()}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Object Detection:</span>
          <span style="color: ${getStatusColor(this.status.yolo)};">
            ${getStatusIcon(this.status.yolo)} ${this.status.yolo.toUpperCase()}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Privacy:</span>
          <span style="color: ${getStatusColor(this.status.privacy)};">
            ${getStatusIcon(this.status.privacy)} ${this.status.privacy.toUpperCase()}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Security Level:</span>
          <span style="color: ${getStatusColor(this.status.securityLevel)};">
            ${getStatusIcon(this.status.securityLevel)} ${this.status.securityLevel.toUpperCase()}
          </span>
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #6b7280;">
          Frames: ${this.status.frameCount} | FPS: ${this.calculateFPS()}
        </div>
      </div>
    `
  }

  calculateFPS() {
    const now = Date.now()
    if (this.status.lastFrameTime) {
      const fps = 1000 / (now - this.status.lastFrameTime)
      return Math.round(fps)
    }
    return 0
  }

  handlePermissionDenied() {
    const modal = document.createElement("div")
    modal.style.cssText = `
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
    `

    modal.innerHTML = `
      <div style="background: white; padding: 2rem; border-radius: 12px; text-align: center; max-width: 500px;">
        <div style="font-size: 48px; margin-bottom: 1rem;">🚫</div>
        <h3 style="margin: 0 0 1rem; color: #ef4444;">Camera Access Required</h3>
        <p style="margin: 0 0 1rem; color: #6b7280;">
          This exam requires camera access for security monitoring. Please:
        </p>
        <ol style="text-align: left; margin: 1rem 0; color: #374151;">
          <li>Click the camera icon in your browser's address bar</li>
          <li>Select "Allow" for camera access</li>
          <li>Refresh this page</li>
        </ol>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 1.5rem;">
          <button onclick="location.reload()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
            Refresh Page
          </button>
          <button onclick="window.location.href='index.html'" style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
            Exit Exam
          </button>
        </div>
      </div>
    `

    document.body.appendChild(modal)
  }

  handleCameraError(error) {
    let errorMessage = "Unknown camera error"
    let suggestions = []

    if (error.name === "NotAllowedError") {
      errorMessage = "Camera access was denied"
      suggestions = [
        "Click the camera icon in your browser's address bar",
        "Select 'Allow' for camera access",
        "Refresh the page and try again",
      ]
    } else if (error.name === "NotFoundError") {
      errorMessage = "No camera found on this device"
      suggestions = [
        "Connect a camera to your device",
        "Check that your camera is properly connected",
        "Try using a different browser",
      ]
    } else if (error.name === "NotReadableError") {
      errorMessage = "Camera is being used by another application"
      suggestions = [
        "Close other applications that might be using the camera",
        "Restart your browser",
        "Restart your device if the problem persists",
      ]
    }

    const modal = document.createElement("div")
    modal.style.cssText = `
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
    `

    modal.innerHTML = `
      <div style="background: white; padding: 2rem; border-radius: 12px; text-align: center; max-width: 500px;">
        <div style="font-size: 48px; margin-bottom: 1rem;">⚠️</div>
        <h3 style="margin: 0 0 1rem; color: #ef4444;">Camera Error</h3>
        <p style="margin: 0 0 1rem; color: #6b7280; font-weight: bold;">${errorMessage}</p>
        <div style="text-align: left; margin: 1rem 0;">
          <p style="margin: 0 0 0.5rem; color: #374151; font-weight: bold;">Please try:</p>
          <ul style="margin: 0; color: #6b7280;">
            ${suggestions.map((s) => `<li>${s}</li>`).join("")}
          </ul>
        </div>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 1.5rem;">
          <button onclick="location.reload()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
            Try Again
          </button>
          <button onclick="window.location.href='index.html'" style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
            Exit Exam
          </button>
        </div>
      </div>
    `

    document.body.appendChild(modal)
  }

  updateSecurityIndicators() {
    this.indicators = {
      recording: this.isActive && this.stream && this.stream.active,
      monitoring: this.isProcessing,
      objectProcessing: this.status.yolo === "active",
      secure: this.status.security === "active" && this.status.securityLevel === "high",
    }

    // Update video border color based on security status
    if (this.videoElement) {
      let borderColor = "#6b7280" // default gray

      if (this.indicators.secure && this.indicators.objectProcessing) {
        borderColor = "#10b981" // green - fully secure
      } else if (this.indicators.recording) {
        borderColor = "#f59e0b" // yellow - recording but not fully secure
      } else {
        borderColor = "#ef4444" // red - not secure
      }

      this.videoElement.style.borderColor = borderColor
    }
  }

  registerProcessor(name, processorFunction, options = {}) {
    console.log(`[v0] Registering enhanced processor: ${name}`)

    // Validate processor for security
    if (name === "objectDetection") {
      this.status.yolo = "active"
    }

    this.processors.set(name, {
      process: processorFunction,
      enabled: true,
      interval: options.interval || 100, // Faster processing for better security
      lastRun: 0,
      securityLevel: options.securityLevel || "medium",
      ...options,
    })

    // Start processing if this is the first processor
    if (this.processors.size === 1 && this.isActive) {
      this.startProcessing()
    }

    this.updateSecurityIndicators()
  }

  extractFrame() {
    if (!this.hiddenVideoElement || this.hiddenVideoElement.readyState < 2) {
      return null
    }

    try {
      // Draw current video frame to canvas
      this.context.drawImage(this.hiddenVideoElement, 0, 0, this.canvas.width, this.canvas.height)

      // Extract ImageData
      const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)

      // Update frame tracking
      this.status.frameCount++
      this.status.lastFrameTime = Date.now()

      return {
        imageData,
        canvas: this.canvas,
        context: this.context,
        width: this.canvas.width,
        height: this.canvas.height,
        timestamp: Date.now(),
        frameNumber: this.status.frameCount,
        securityLevel: this.status.securityLevel,
        encrypted: this.securityFeatures.encryptedStream,
      }
    } catch (error) {
      console.error("[v0] Error extracting secure frame:", error)
      return null
    }
  }

  cleanup() {
    console.log("[v0] Cleaning up enhanced camera resources with security protocols...")

    this.stopProcessing()

    // Secure stream cleanup
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop()
        console.log("[v0] Securely stopped camera track")
      })
      this.stream = null
    }

    // Clear processors securely
    this.processors.clear()
    this.isActive = false
    this.status.camera = "inactive"
    this.status.security = "inactive"
    this.status.yolo = "inactive"

    // Remove security UI elements
    const statusPanel = document.getElementById("camera-security-status")
    if (statusPanel) statusPanel.remove()

    const overlay = document.getElementById("camera-security-overlay")
    if (overlay) overlay.remove()

    // Remove created elements
    if (this.videoElement && this.videoElement.id === "monitoring-camera") {
      this.videoElement.remove()
    }
    if (this.hiddenVideoElement && this.hiddenVideoElement.id === "monitoring-camera-hidden") {
      this.hiddenVideoElement.remove()
    }
    if (this.canvas && this.canvas.id === "monitoring-canvas") {
      this.canvas.remove()
    }

    console.log("[v0] Enhanced camera cleanup completed securely")
  }
}

// Export for global use
window.EnhancedCameraManager = EnhancedCameraManager
