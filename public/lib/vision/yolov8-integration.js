// YOLOv8 Integration Module
// Provides clean interface for YOLOv8 object detection

class YOLOv8Processor {
  constructor(config = {}) {
    this.config = {
      modelUrl: config.modelUrl || null,
      apiEndpoint: config.apiEndpoint || null,
      confidence: config.confidence || 0.75, // Increased from 0.5 to 0.75 for better accuracy
      iouThreshold: config.iouThreshold || 0.4,
      maxDetections: config.maxDetections || 100,
      classes: config.classes || ["person", "cell phone", "laptop", "book"],
      useLocalModel: config.useLocalModel !== false,
      localModelPath: config.localModelPath || "/models/yolov8n.onnx",

      personDetection: {
        minConfidence: config.personDetection?.minConfidence || 0.7,
        minArea: config.personDetection?.minArea || 5000, // Minimum pixel area for valid person
        maxArea: config.personDetection?.maxArea || 300000, // Maximum pixel area to avoid false positives
        temporalWindow: config.personDetection?.temporalWindow || 5, // Frames to consider for consistency
        consistencyThreshold: config.personDetection?.consistencyThreshold || 0.6, // 60% of frames must detect person
      },

      uiProtection: {
        enabled: config.uiProtection?.enabled !== false,
        isolateProcessing: config.uiProtection?.isolateProcessing !== false,
        maxProcessingTime: config.uiProtection?.maxProcessingTime || 5000,
        fallbackOnError: config.uiProtection?.fallbackOnError !== false,
      },
      performance: {
        batchSize: config.performance?.batchSize || 1,
        skipFrames: config.performance?.skipFrames || 0,
        adaptiveInterval: config.performance?.adaptiveInterval !== false,
        maxConcurrentRequests: config.performance?.maxConcurrentRequests || 2,
      },
      ...config,
    }

    this.isInitialized = false
    this.model = null
    this.localModel = null
    this.detectionHistory = []
    this.maxHistoryLength = 20

    this.personDetectionHistory = []
    this.maxPersonHistoryLength = this.config.personDetection.temporalWindow

    this.processingState = {
      isProcessing: false,
      activeRequests: 0,
      lastProcessingTime: 0,
      avgProcessingTime: 0,
      errorCount: 0,
      successCount: 0,
    }

    this.frameSkipCounter = 0

    console.log("[v0] Enhanced YOLOv8Processor initialized with improved person detection")
  }

  async initialize() {
    try {
      console.log("[v0] Initializing YOLOv8 model...")

      // Only use local model, no API endpoints
      if (this.config.useLocalModel && typeof window.YOLOv8LocalModel !== "undefined") {
        try {
          console.log("[v0] Attempting to load local YOLOv8 model...")
          this.localModel = new window.YOLOv8LocalModel({
            modelPath: this.config.localModelPath,
            confidence: this.config.confidence,
            iouThreshold: this.config.iouThreshold,
            classes: this.config.classes,
          })

          await this.localModel.initialize()
          console.log("[v0] Local YOLOv8 model loaded successfully")
          this.isInitialized = true
          return true
        } catch (localError) {
          console.warn("[v0] Local model failed, using simulation mode:", localError.message)
          this.localModel = null
        }
      }

      // Always use simulation mode for development (no API calls)
      console.log("[v0] Using simulation mode for development (no API calls)")
      this.isInitialized = true
      console.log("[v0] YOLOv8 model initialized successfully")
      return true
    } catch (error) {
      console.error("[v0] YOLOv8 initialization failed:", error)
      this.isInitialized = false
      throw error
    }
  }

  async detect(frameData, metadata = {}) {
    if (!this.isInitialized) {
      return {
        detections: [],
        error: "YOLOv8 not initialized",
        processingTime: 0,
        skipped: false,
      }
    }

    if (!frameData || !frameData.canvas) {
      return {
        detections: [],
        error: "No frame data available",
        processingTime: 0,
        skipped: false,
      }
    }

    if (this.config.performance.skipFrames > 0) {
      this.frameSkipCounter++
      if (this.frameSkipCounter <= this.config.performance.skipFrames) {
        return {
          detections: this.getLastDetections(),
          processingTime: 0,
          skipped: true,
          reason: "frame_skipped",
        }
      }
      this.frameSkipCounter = 0
    }

    if (this.processingState.activeRequests >= this.config.performance.maxConcurrentRequests) {
      return {
        detections: this.getLastDetections(),
        processingTime: 0,
        skipped: true,
        reason: "max_concurrent_requests",
      }
    }

    if (this.config.performance.adaptiveInterval) {
      const timeSinceLastProcessing = Date.now() - this.processingState.lastProcessingTime
      const adaptiveMinInterval = Math.max(500, this.processingState.avgProcessingTime * 2)

      if (timeSinceLastProcessing < adaptiveMinInterval) {
        return {
          detections: this.getLastDetections(),
          processingTime: 0,
          skipped: true,
          reason: "adaptive_interval",
        }
      }
    }

    const startTime = Date.now()
    this.processingState.isProcessing = true
    this.processingState.activeRequests++

    try {
      let detections = []

      const processingPromise = this.performDetection(frameData)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Processing timeout")), this.config.uiProtection.maxProcessingTime)
      })

      if (this.config.uiProtection.enabled) {
        detections = await Promise.race([processingPromise, timeoutPromise])
      } else {
        detections = await processingPromise
      }

      const processingTime = Date.now() - startTime
      this.updateProcessingStats(processingTime, true)

      const result = {
        detections,
        processingTime,
        timestamp: metadata.timestamp || Date.now(),
        frameCount: metadata.frameCount || 0,
        confidence: this.config.confidence,
        classes: this.config.classes,
        skipped: false,
      }

      // Add to history
      this.addToHistory(result)

      // Analyze for violations
      const violations = this.analyzeViolations(detections)
      result.violations = violations

      return result
    } catch (error) {
      console.error("[v0] YOLOv8 detection error:", error)
      this.updateProcessingStats(Date.now() - startTime, false)

      if (this.config.uiProtection.fallbackOnError) {
        return {
          detections: this.getLastDetections(),
          error: error.message,
          processingTime: Date.now() - startTime,
          skipped: false,
          fallback: true,
        }
      }

      return {
        detections: [],
        error: error.message,
        processingTime: Date.now() - startTime,
        skipped: false,
      }
    } finally {
      this.processingState.isProcessing = false
      this.processingState.activeRequests--
      this.processingState.lastProcessingTime = Date.now()
    }
  }

  // Detect via local model (placeholder)
  async detectViaLocalModel(frameData) {
    // Placeholder for local YOLOv8 model inference
    console.log("[v0] Running local YOLOv8 inference...")

    // This would be replaced with actual model inference
    // const predictions = await this.model.detect(frameData.canvas)
    // return this.normalizeDetections(predictions)

    return this.simulateDetections(frameData)
  }

  // Simulate detections for development/testing
  simulateDetections(frameData) {
    const detections = []

    const shouldDetectPerson = Math.random() > 0.05 // 95% chance to detect person

    if (shouldDetectPerson) {
      const personConfidence = 0.75 + Math.random() * 0.2 // 0.75-0.95 confidence
      const personWidth = frameData.width * (0.4 + Math.random() * 0.3) // 40-70% of frame width
      const personHeight = frameData.height * (0.6 + Math.random() * 0.3) // 60-90% of frame height

      detections.push({
        class: "person",
        confidence: personConfidence,
        bbox: {
          x: frameData.width * (0.1 + Math.random() * 0.3), // 10-40% from left
          y: frameData.height * (0.05 + Math.random() * 0.1), // 5-15% from top
          width: personWidth,
          height: personHeight,
        },
      })
    }

    if (Math.random() > 0.9) {
      // 10% chance of multiple people
      detections.push({
        class: "person",
        confidence: 0.7 + Math.random() * 0.15,
        bbox: {
          x: frameData.width * (0.6 + Math.random() * 0.2),
          y: frameData.height * (0.1 + Math.random() * 0.1),
          width: frameData.width * (0.25 + Math.random() * 0.15),
          height: frameData.height * (0.5 + Math.random() * 0.2),
        },
      })
    }

    // Randomly simulate other objects
    if (Math.random() > 0.8) {
      detections.push({
        class: "cell phone",
        confidence: 0.7 + Math.random() * 0.2,
        bbox: {
          x: frameData.width * 0.6,
          y: frameData.height * 0.3,
          width: frameData.width * 0.1,
          height: frameData.height * 0.15,
        },
      })
    }

    return detections
  }

  // Normalize detection format
  normalizeDetections(rawDetections) {
    return rawDetections.map((detection) => ({
      class: detection.class || detection.label || "unknown",
      confidence: detection.confidence || detection.score || 0,
      bbox: {
        x: detection.bbox?.x || detection.x || 0,
        y: detection.bbox?.y || detection.y || 0,
        width: detection.bbox?.width || detection.width || 0,
        height: detection.bbox?.height || detection.height || 0,
      },
    }))
  }

  // Analyze detections for exam violations
  analyzeViolations(detections) {
    const violations = []

    // Filter and validate person detections
    const allPeople = detections.filter((d) => d.class.toLowerCase() === "person")
    const validPeople = allPeople.filter((person) => this.validatePersonDetection(person))

    console.log(`[v0] Person detection: ${allPeople.length} total, ${validPeople.length} valid`)

    // Add to person detection history
    this.personDetectionHistory.push({
      timestamp: Date.now(),
      totalPersonCount: allPeople.length,
      validPersonCount: validPeople.length,
      detections: validPeople,
    })

    // Keep history size manageable
    if (this.personDetectionHistory.length > this.maxPersonHistoryLength) {
      this.personDetectionHistory.shift()
    }

    // Get consistent person count using temporal analysis
    const consistentPersonCount = this.getConsistentPersonCount()

    console.log(`[v0] Consistent person count: ${consistentPersonCount}`)

    // Check for multiple people
    if (consistentPersonCount > 1) {
      violations.push({
        type: "multiple_people",
        count: consistentPersonCount,
        severity: "high",
        confidence: Math.max(...validPeople.map((p) => p.confidence)),
        details: `${consistentPersonCount} people detected consistently`,
      })
    }

    // Check if no person detected
    if (consistentPersonCount === 0) {
      violations.push({
        type: "no_person_detected",
        severity: "high",
        confidence: 1.0,
        details: "No person detected consistently across recent frames",
      })
    }

    // Check for prohibited objects (only if we have a valid person present)
    if (consistentPersonCount === 1) {
      const prohibitedObjects = ["cell phone", "laptop", "tablet", "book", "paper"]

      detections.forEach((detection) => {
        if (
          prohibitedObjects.includes(detection.class.toLowerCase()) &&
          detection.confidence > this.config.confidence
        ) {
          violations.push({
            type: "prohibited_object",
            object: detection.class,
            confidence: detection.confidence,
            location: detection.bbox,
            severity: this.getViolationSeverity(detection.class),
          })
        }
      })
    }

    return violations
  }

  // Get violation severity
  getViolationSeverity(objectClass) {
    const highSeverity = ["cell phone", "laptop", "tablet"]
    const mediumSeverity = ["book", "paper", "notebook"]

    if (highSeverity.includes(objectClass.toLowerCase())) return "high"
    if (mediumSeverity.includes(objectClass.toLowerCase())) return "medium"
    return "low"
  }

  // Add result to history
  addToHistory(result) {
    this.detectionHistory.push({
      ...result,
      timestamp: Date.now(),
    })

    if (this.detectionHistory.length > this.maxHistoryLength) {
      this.detectionHistory.shift()
    }
  }

  getStatistics() {
    if (this.detectionHistory.length === 0) {
      return {
        avgProcessingTime: 0,
        detectionRate: 0,
        violationRate: 0,
        uiProtectionStats: this.getUIProtectionStats(),
      }
    }

    const avgProcessingTime =
      this.detectionHistory.reduce((sum, r) => sum + r.processingTime, 0) / this.detectionHistory.length

    const detectionsWithObjects = this.detectionHistory.filter((r) => r.detections.length > 0).length
    const detectionsWithViolations = this.detectionHistory.filter((r) => r.violations && r.violations.length > 0).length
    const skippedFrames = this.detectionHistory.filter((r) => r.skipped).length

    return {
      avgProcessingTime: Math.round(avgProcessingTime),
      detectionRate: detectionsWithObjects / this.detectionHistory.length,
      violationRate: detectionsWithViolations / this.detectionHistory.length,
      totalFramesProcessed: this.detectionHistory.length,
      skippedFrameRate: skippedFrames / this.detectionHistory.length,
      uiProtectionStats: this.getUIProtectionStats(),
    }
  }

  getUIProtectionStats() {
    const totalRequests = this.processingState.successCount + this.processingState.errorCount
    return {
      successRate: totalRequests > 0 ? this.processingState.successCount / totalRequests : 0,
      errorRate: totalRequests > 0 ? this.processingState.errorCount / totalRequests : 0,
      avgProcessingTime: Math.round(this.processingState.avgProcessingTime),
      activeRequests: this.processingState.activeRequests,
      isProcessing: this.processingState.isProcessing,
    }
  }

  async performDetection(frameData) {
    if (this.localModel && this.localModel.isReady()) {
      try {
        console.log("[v0] Running local YOLOv8 inference...")
        return await this.localModel.detect(frameData)
      } catch (error) {
        console.warn("[v0] Local model detection failed, using simulation:", error.message)
      }
    }

    return this.simulateDetections(frameData)
  }

  getLastDetections() {
    const lastResult = this.detectionHistory[this.detectionHistory.length - 1]
    return lastResult ? lastResult.detections : []
  }

  updateProcessingStats(processingTime, success) {
    if (success) {
      this.processingState.successCount++
    } else {
      this.processingState.errorCount++
    }

    // Update average processing time (exponential moving average)
    const alpha = 0.2
    this.processingState.avgProcessingTime =
      this.processingState.avgProcessingTime * (1 - alpha) + processingTime * alpha
  }

  // Update configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    console.log("[v0] YOLOv8Processor configuration updated")
  }

  cleanup() {
    this.detectionHistory = []
    this.model = null

    // Cleanup local model
    if (this.localModel) {
      this.localModel.cleanup()
      this.localModel = null
    }

    this.isInitialized = false
    console.log("[v0] YOLOv8Processor cleaned up")
  }

  getModelStatus() {
    return {
      isInitialized: this.isInitialized,
      hasLocalModel: !!(this.localModel && this.localModel.isReady()),
      hasApiEndpoint: !!this.config.apiEndpoint,
      modelInfo: this.localModel ? this.localModel.getModelInfo() : null,
      config: {
        confidence: this.config.confidence,
        classes: this.config.classes,
        useLocalModel: this.config.useLocalModel,
      },
    }
  }

  validatePersonDetection(detection) {
    const area = detection.bbox.width * detection.bbox.height

    // Check confidence threshold
    if (detection.confidence < this.config.personDetection.minConfidence) {
      console.log(`[v0] Person detection rejected: low confidence ${detection.confidence}`)
      return false
    }

    // Check area constraints
    if (area < this.config.personDetection.minArea) {
      console.log(`[v0] Person detection rejected: too small area ${area}`)
      return false
    }

    if (area > this.config.personDetection.maxArea) {
      console.log(`[v0] Person detection rejected: too large area ${area}`)
      return false
    }

    // Check aspect ratio (person should be taller than wide)
    const aspectRatio = detection.bbox.height / detection.bbox.width
    if (aspectRatio < 1.2) {
      console.log(`[v0] Person detection rejected: invalid aspect ratio ${aspectRatio}`)
      return false
    }

    return true
  }

  getConsistentPersonCount() {
    if (this.personDetectionHistory.length === 0) {
      return 0
    }

    // Count valid person detections in recent history
    const recentDetections = this.personDetectionHistory.slice(-this.config.personDetection.temporalWindow)
    const personCounts = recentDetections.map((frame) => frame.validPersonCount || 0)

    // Calculate average person count
    const avgPersonCount = personCounts.reduce((sum, count) => sum + count, 0) / personCounts.length

    // Require consistency across frames
    const consistentFrames = personCounts.filter((count) => Math.abs(count - Math.round(avgPersonCount)) <= 0.5).length
    const consistencyRatio = consistentFrames / personCounts.length

    console.log(
      `[v0] Person detection consistency: ${consistencyRatio.toFixed(2)} (${consistentFrames}/${personCounts.length} frames)`,
    )

    if (consistencyRatio >= this.config.personDetection.consistencyThreshold) {
      return Math.round(avgPersonCount)
    }

    // If not consistent enough, return the most recent count
    return personCounts[personCounts.length - 1] || 0
  }
}

// Export for global use
window.YOLOv8Processor = YOLOv8Processor
