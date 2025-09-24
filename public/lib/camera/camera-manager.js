// Enhanced Camera Manager for YOLOv8 Integration
// Provides clean separation between camera capture and computer vision processing

class CameraManager {
  constructor() {
    this.stream = null
    this.isActive = false
    this.videoElement = null
    this.hiddenVideoElement = null
    this.canvas = null
    this.context = null

    // Processing configuration
    this.processingConfig = {
      frameRate: 15,
      width: 640,
      height: 480,
      processingInterval: null,
    }

    // Callbacks for different processing types
    this.processors = new Map()
    this.isProcessing = false

    // Status tracking
    this.status = "inactive"
    this.lastFrameTime = 0
    this.frameCount = 0

    console.log("[v0] CameraManager initialized")
  }

  // Initialize camera with optimal settings for computer vision
  async initialize(config = {}) {
    try {
      console.log("[v0] Initializing camera for computer vision processing...")

      // Merge with default config
      this.processingConfig = {
        ...this.processingConfig,
        ...config,
      }

      // Request camera access with optimized settings
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: this.processingConfig.width, min: 320 },
          height: { ideal: this.processingConfig.height, min: 240 },
          facingMode: "user",
          frameRate: { ideal: this.processingConfig.frameRate, max: 30 },
        },
        audio: false, // No audio needed for vision processing
      })

      // Create video elements for processing
      this.setupVideoElements()

      // Create canvas for frame extraction
      this.setupCanvas()

      this.isActive = true
      this.status = "active"

      console.log("[v0] Camera initialized successfully")
      console.log("[v0] Stream settings:", {
        width: this.stream.getVideoTracks()[0].getSettings().width,
        height: this.stream.getVideoTracks()[0].getSettings().height,
        frameRate: this.stream.getVideoTracks()[0].getSettings().frameRate,
      })

      return true
    } catch (error) {
      console.error("[v0] Camera initialization failed:", error)
      this.status = "error"
      throw new Error(`Camera access failed: ${error.message}`)
    }
  }

  // Setup video elements for processing
  setupVideoElements() {
    // Visible video element (for user feedback)
    this.videoElement = document.getElementById("monitoring-camera")
    if (!this.videoElement) {
      this.videoElement = document.createElement("video")
      this.videoElement.id = "monitoring-camera"
      this.videoElement.autoplay = true
      this.videoElement.muted = true
      this.videoElement.playsInline = true
      document.body.appendChild(this.videoElement)
    }

    // Hidden video element (for processing)
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

    // Attach stream to both elements
    this.videoElement.srcObject = this.stream
    this.hiddenVideoElement.srcObject = this.stream
  }

  // Setup canvas for frame extraction
  setupCanvas() {
    this.canvas = document.getElementById("monitoring-canvas")
    if (!this.canvas) {
      this.canvas = document.createElement("canvas")
      this.canvas.id = "monitoring-canvas"
      this.canvas.style.display = "none"
      document.body.appendChild(this.canvas)
    }

    this.canvas.width = this.processingConfig.width
    this.canvas.height = this.processingConfig.height
    this.context = this.canvas.getContext("2d", { willReadFrequently: true })
  }

  // Register a processor (face detection, YOLOv8, etc.)
  registerProcessor(name, processorFunction, options = {}) {
    console.log(`[v0] Registering processor: ${name}`)

    this.processors.set(name, {
      process: processorFunction,
      enabled: true,
      interval: options.interval || 200, // Default 200ms (5fps)
      lastRun: 0,
      ...options,
    })

    // Start processing if this is the first processor
    if (this.processors.size === 1 && this.isActive) {
      this.startProcessing()
    }
  }

  // Unregister a processor
  unregisterProcessor(name) {
    console.log(`[v0] Unregistering processor: ${name}`)
    this.processors.delete(name)

    // Stop processing if no processors left
    if (this.processors.size === 0) {
      this.stopProcessing()
    }
  }

  // Start the processing loop
  startProcessing() {
    if (this.isProcessing) return

    console.log("[v0] Starting camera processing loop")
    this.isProcessing = true

    const processFrame = () => {
      if (!this.isProcessing || !this.isActive) return

      const currentTime = Date.now()

      // Process each registered processor
      this.processors.forEach((processor, name) => {
        if (!processor.enabled) return

        // Check if enough time has passed for this processor
        if (currentTime - processor.lastRun >= processor.interval) {
          try {
            // Extract frame data
            const frameData = this.extractFrame()
            if (frameData) {
              // Run the processor
              processor.process(frameData, {
                timestamp: currentTime,
                frameCount: this.frameCount,
                processorName: name,
              })
              processor.lastRun = currentTime
            }
          } catch (error) {
            console.error(`[v0] Error in processor ${name}:`, error)
          }
        }
      })

      this.frameCount++
      this.lastFrameTime = currentTime

      // Continue processing
      requestAnimationFrame(processFrame)
    }

    // Start the processing loop
    requestAnimationFrame(processFrame)
  }

  // Stop the processing loop
  stopProcessing() {
    console.log("[v0] Stopping camera processing loop")
    this.isProcessing = false
  }

  // Extract current frame as ImageData
  extractFrame() {
    if (!this.hiddenVideoElement || this.hiddenVideoElement.readyState < 2) {
      return null
    }

    try {
      // Draw current video frame to canvas
      this.context.drawImage(this.hiddenVideoElement, 0, 0, this.canvas.width, this.canvas.height)

      // Extract ImageData
      const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)

      return {
        imageData,
        canvas: this.canvas,
        context: this.context,
        width: this.canvas.width,
        height: this.canvas.height,
        timestamp: Date.now(),
      }
    } catch (error) {
      console.error("[v0] Error extracting frame:", error)
      return null
    }
  }

  // Get current frame as base64 string (for local processing only)
  getFrameDataURL(format = "image/jpeg", quality = 0.8) {
    const frameData = this.extractFrame()
    if (!frameData) return null

    return frameData.canvas.toDataURL(format, quality)
  }

  // Enable/disable a specific processor
  toggleProcessor(name, enabled) {
    const processor = this.processors.get(name)
    if (processor) {
      processor.enabled = enabled
      console.log(`[v0] Processor ${name} ${enabled ? "enabled" : "disabled"}`)
    }
  }

  // Update processor interval
  setProcessorInterval(name, interval) {
    const processor = this.processors.get(name)
    if (processor) {
      processor.interval = interval
      console.log(`[v0] Processor ${name} interval set to ${interval}ms`)
    }
  }

  // Get camera status and statistics
  getStatus() {
    return {
      status: this.status,
      isActive: this.isActive,
      isProcessing: this.isProcessing,
      frameCount: this.frameCount,
      lastFrameTime: this.lastFrameTime,
      processors: Array.from(this.processors.keys()),
      streamSettings: this.stream ? this.stream.getVideoTracks()[0].getSettings() : null,
    }
  }

  // Handle stream loss and recovery
  async handleStreamLoss() {
    console.log("[v0] Handling camera stream loss...")

    try {
      // Stop current stream
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop())
      }

      // Reinitialize camera
      await this.initialize(this.processingConfig)

      console.log("[v0] Camera stream recovered successfully")
      return true
    } catch (error) {
      console.error("[v0] Failed to recover camera stream:", error)
      this.status = "error"
      return false
    }
  }

  // Cleanup all resources
  cleanup() {
    console.log("[v0] Cleaning up camera resources...")

    this.stopProcessing()

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }

    this.processors.clear()
    this.isActive = false
    this.status = "inactive"

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

    console.log("[v0] Camera cleanup completed")
  }
}

// Export for global use
window.CameraManager = CameraManager
