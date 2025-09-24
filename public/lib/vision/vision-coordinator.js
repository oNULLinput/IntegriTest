// Vision Processing Coordinator
// Manages multiple vision processors and coordinates their execution

class VisionCoordinator {
  constructor() {
    this.cameraManager = null
    this.processors = new Map()
    this.isActive = false

    // Processing results
    this.results = new Map()
    this.callbacks = new Map()

    this.uiProtection = {
      enabled: true,
      maxProcessingLoad: 0.7, // Max 70% processing load
      frameDropThreshold: 100, // Drop frames if processing takes > 100ms
      adaptiveThrottling: true,
    }

    // Performance monitoring
    this.stats = {
      totalFramesProcessed: 0,
      avgProcessingTime: 0,
      lastProcessingTime: 0,
      droppedFrames: 0,
      processingLoad: 0,
    }

    this.processingQueue = []
    this.isProcessingQueue = false

    console.log("[v0] Enhanced VisionCoordinator initialized with UI protection")
  }

  // Initialize with camera manager
  async initialize(cameraManager) {
    if (!cameraManager) {
      throw new Error("CameraManager instance required")
    }

    this.cameraManager = cameraManager

    // Set up default processors
    await this.setupDefaultProcessors()

    this.isActive = true
    console.log("[v0] VisionCoordinator initialized with camera manager")
  }

  async setupDefaultProcessors() {
    try {
      // Initialize Face Detector with higher priority
      const faceDetector = new window.FaceDetector()
      this.addProcessor("faceDetection", faceDetector, {
        interval: 200, // 5fps
        priority: "high",
        essential: true, // Always run this processor
      })

      // Initialize YOLOv8 Processor with UI protection
      if (window.YOLOv8Processor) {
        const yolov8 = new window.YOLOv8Processor({
          modelUrl: window.YOLOV8_MODEL_URL || null,
          confidence: 0.6,
          classes: ["person", "cell phone", "laptop", "book", "paper"],
          useLocalModel: true, // Force local model usage
          uiProtection: {
            enabled: true,
            isolateProcessing: true,
            maxProcessingTime: 3000, // 3 second timeout
            fallbackOnError: true,
          },
          performance: {
            skipFrames: 2, // Process every 3rd frame
            adaptiveInterval: true,
            maxConcurrentRequests: 1, // Limit to 1 concurrent request
          },
        })

        try {
          await yolov8.initialize()
          this.addProcessor("objectDetection", yolov8, {
            interval: 1500, // 0.67fps (less frequent for performance)
            priority: "medium",
            essential: false, // Can be skipped if system is overloaded
          })
        } catch (error) {
          console.warn("[v0] YOLOv8 initialization failed, continuing without object detection:", error)
        }
      }

      console.log("[v0] Enhanced processors setup completed (local-only mode)")
    } catch (error) {
      console.error("[v0] Error setting up enhanced processors:", error)
    }
  }

  addProcessor(name, processor, options = {}) {
    console.log(`[v0] Adding enhanced vision processor: ${name}`)

    const processorConfig = {
      processor,
      interval: options.interval || 500,
      priority: options.priority || "medium",
      enabled: options.enabled !== false,
      essential: options.essential || false, // Essential processors always run
      lastResult: null,
      lastRun: 0,
      processingTime: 0,
      ...options,
    }

    this.processors.set(name, processorConfig)

    // Register with camera manager
    if (this.cameraManager) {
      this.cameraManager.registerProcessor(
        name,
        (frameData, metadata) => this.queueProcessing(name, frameData, metadata),
        { interval: processorConfig.interval },
      )
    }
  }

  // Remove a vision processor
  removeProcessor(name) {
    console.log(`[v0] Removing vision processor: ${name}`)

    if (this.cameraManager) {
      this.cameraManager.unregisterProcessor(name)
    }

    this.processors.delete(name)
    this.results.delete(name)
    this.callbacks.delete(name)
  }

  queueProcessing(processorName, frameData, metadata) {
    const processorConfig = this.processors.get(processorName)
    if (!processorConfig || !processorConfig.enabled) {
      return
    }

    // Check if we should skip this frame due to system load
    if (!processorConfig.essential && this.shouldSkipProcessing()) {
      this.stats.droppedFrames++
      return
    }

    this.processingQueue.push({
      processorName,
      frameData,
      metadata,
      timestamp: Date.now(),
      priority: this.getPriorityValue(processorConfig.priority),
    })

    // Sort queue by priority
    this.processingQueue.sort((a, b) => b.priority - a.priority)

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processQueue()
    }
  }

  async processQueue() {
    if (this.isProcessingQueue || this.processingQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.processingQueue.length > 0) {
      const task = this.processingQueue.shift()

      // Check if task is too old (frame might be stale)
      if (Date.now() - task.timestamp > 2000) {
        continue
      }

      await this.processFrame(task.processorName, task.frameData, task.metadata)

      if (this.uiProtection.enabled) {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }

    this.isProcessingQueue = false
  }

  async processFrame(processorName, frameData, metadata) {
    const processorConfig = this.processors.get(processorName)
    if (!processorConfig || !processorConfig.enabled) {
      return
    }

    const startTime = Date.now()

    try {
      // Run the processor
      let result
      if (processorConfig.processor.detect) {
        result = await processorConfig.processor.detect(frameData, metadata)
      } else if (typeof processorConfig.processor === "function") {
        result = await processorConfig.processor(frameData, metadata)
      } else {
        throw new Error(`Invalid processor: ${processorName}`)
      }

      const processingTime = Date.now() - startTime
      processorConfig.processingTime = processingTime

      // Store result
      const processedResult = {
        ...result,
        processorName,
        processingTime,
        timestamp: Date.now(),
      }

      this.results.set(processorName, processedResult)
      processorConfig.lastResult = processedResult
      processorConfig.lastRun = Date.now()

      // Update stats
      this.updateStats(processingTime)

      // Execute callbacks
      const callback = this.callbacks.get(processorName)
      if (callback) {
        try {
          setTimeout(() => callback(processedResult, frameData, metadata), 0)
        } catch (callbackError) {
          console.error(`[v0] Callback error for ${processorName}:`, callbackError)
        }
      }

      // Global result callback
      const globalCallback = this.callbacks.get("*")
      if (globalCallback) {
        try {
          setTimeout(() => globalCallback(processorName, processedResult, frameData, metadata), 0)
        } catch (callbackError) {
          console.error("[v0] Global callback error:", callbackError)
        }
      }
    } catch (error) {
      console.error(`[v0] Processing error in ${processorName}:`, error)

      const errorResult = {
        error: error.message,
        processorName,
        processingTime: Date.now() - startTime,
        timestamp: Date.now(),
      }

      this.results.set(processorName, errorResult)
    }
  }

  // Register callback for processor results
  onResult(processorName, callback) {
    this.callbacks.set(processorName, callback)
  }

  // Get latest result from processor
  getResult(processorName) {
    return this.results.get(processorName)
  }

  // Get all latest results
  getAllResults() {
    const results = {}
    this.results.forEach((result, name) => {
      results[name] = result
    })
    return results
  }

  // Enable/disable processor
  toggleProcessor(name, enabled) {
    const processor = this.processors.get(name)
    if (processor) {
      processor.enabled = enabled

      if (this.cameraManager) {
        this.cameraManager.toggleProcessor(name, enabled)
      }

      console.log(`[v0] Processor ${name} ${enabled ? "enabled" : "disabled"}`)
    }
  }

  // Update processor interval
  setProcessorInterval(name, interval) {
    const processor = this.processors.get(name)
    if (processor) {
      processor.interval = interval

      if (this.cameraManager) {
        this.cameraManager.setProcessorInterval(name, interval)
      }

      console.log(`[v0] Processor ${name} interval set to ${interval}ms`)
    }
  }

  shouldSkipProcessing() {
    if (!this.uiProtection.enabled) return false

    // Skip if processing load is too high
    if (this.stats.processingLoad > this.uiProtection.maxProcessingLoad) {
      return true
    }

    // Skip if last processing took too long
    if (this.stats.lastProcessingTime > this.uiProtection.frameDropThreshold) {
      return true
    }

    return false
  }

  getPriorityValue(priority) {
    switch (priority) {
      case "high":
        return 3
      case "medium":
        return 2
      case "low":
        return 1
      default:
        return 2
    }
  }

  updateStats(processingTime) {
    this.stats.totalFramesProcessed++
    this.stats.lastProcessingTime = processingTime

    // Calculate rolling average
    const alpha = 0.1 // Smoothing factor
    this.stats.avgProcessingTime = this.stats.avgProcessingTime * (1 - alpha) + processingTime * alpha

    // Calculate processing load (percentage of time spent processing)
    const frameInterval = 200 // Assume 200ms between frames (5fps)
    this.stats.processingLoad = Math.min(1, this.stats.avgProcessingTime / frameInterval)
  }

  getStatus() {
    const processorStatus = {}
    this.processors.forEach((config, name) => {
      processorStatus[name] = {
        enabled: config.enabled,
        priority: config.priority,
        interval: config.interval,
        essential: config.essential,
        hasResult: this.results.has(name),
        lastResult: config.lastResult?.timestamp || null,
        avgProcessingTime: config.processingTime || 0,
      }
    })

    return {
      isActive: this.isActive,
      processors: processorStatus,
      stats: {
        ...this.getStats(),
        queueLength: this.processingQueue.length,
        isProcessingQueue: this.isProcessingQueue,
        uiProtection: this.uiProtection,
      },
      cameraConnected: this.cameraManager?.isActive || false,
    }
  }

  // Cleanup all resources
  cleanup() {
    console.log("[v0] Cleaning up VisionCoordinator...")

    // Clear all processors
    this.processors.forEach((_, name) => {
      this.removeProcessor(name)
    })

    // Clear results and callbacks
    this.results.clear()
    this.callbacks.clear()

    // Reset stats
    this.stats = {
      totalFramesProcessed: 0,
      avgProcessingTime: 0,
      lastProcessingTime: 0,
      droppedFrames: 0,
      processingLoad: 0,
    }

    this.isActive = false
    this.cameraManager = null

    console.log("[v0] VisionCoordinator cleanup completed")
  }
}

// Export for global use
window.VisionCoordinator = VisionCoordinator
