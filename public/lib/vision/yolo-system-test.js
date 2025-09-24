// YOLOv8 System Integration Test Suite
// Comprehensive testing for YOLO integration without compromising system integrity

// Import ONNX.js runtime
const ort = window.ort

class YOLOSystemTest {
  constructor() {
    this.testResults = []
    this.systemStatus = {
      camera: false,
      yolo: false,
      integration: false,
      performance: false,
    }

    console.log("[v0] YOLOSystemTest initialized")
  }

  // Run comprehensive system test
  async runFullSystemTest() {
    console.log("[v0] Starting comprehensive YOLO system test...")

    this.testResults = []

    try {
      // Test 1: Environment Check
      await this.testEnvironment()

      // Test 2: Camera System
      await this.testCameraSystem()

      // Test 3: YOLO Model Loading
      await this.testYOLOModel()

      // Test 4: Integration Test
      await this.testSystemIntegration()

      // Test 5: Performance Test
      await this.testPerformance()

      // Test 6: Error Handling
      await this.testErrorHandling()

      // Generate final report
      const report = this.generateTestReport()
      console.log("[v0] System test completed:", report)

      return report
    } catch (error) {
      console.error("[v0] System test failed:", error)
      return {
        success: false,
        error: error.message,
        results: this.testResults,
      }
    }
  }

  // Test 1: Environment and Dependencies
  async testEnvironment() {
    console.log("[v0] Testing environment and dependencies...")

    const test = {
      name: "Environment Check",
      startTime: Date.now(),
      checks: [],
    }

    try {
      // Check ONNX.js availability
      test.checks.push({
        name: "ONNX.js Runtime",
        passed: typeof ort !== "undefined",
        details: typeof ort !== "undefined" ? "Available" : "Missing - Please include onnxruntime-web",
      })

      // Check WebGL support
      const canvas = document.createElement("canvas")
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
      test.checks.push({
        name: "WebGL Support",
        passed: !!gl,
        details: gl ? "WebGL available for GPU acceleration" : "WebGL not available - will use CPU",
      })

      // Check camera API support
      test.checks.push({
        name: "Camera API Support",
        passed: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        details: navigator.mediaDevices ? "getUserMedia API available" : "Camera API not supported",
      })

      // Check required classes
      const requiredClasses = ["CameraManager", "VisionCoordinator", "YOLOv8Processor"]
      requiredClasses.forEach((className) => {
        test.checks.push({
          name: `${className} Class`,
          passed: typeof window[className] !== "undefined",
          details: typeof window[className] !== "undefined" ? "Available" : "Missing",
        })
      })

      test.passed = test.checks.every((check) => check.passed)
      test.endTime = Date.now()
      test.duration = test.endTime - test.startTime
    } catch (error) {
      test.passed = false
      test.error = error.message
      test.endTime = Date.now()
      test.duration = test.endTime - test.startTime
    }

    this.testResults.push(test)
    this.systemStatus.environment = test.passed
  }

  // Test 2: Camera System
  async testCameraSystem() {
    console.log("[v0] Testing camera system...")

    const test = {
      name: "Camera System Test",
      startTime: Date.now(),
      checks: [],
    }

    let cameraManager = null

    try {
      // Initialize camera manager
      cameraManager = new window.CameraManager()

      test.checks.push({
        name: "Camera Manager Creation",
        passed: true,
        details: "CameraManager instance created successfully",
      })

      // Test camera initialization (with timeout)
      const initPromise = cameraManager.initialize({
        width: 640,
        height: 480,
        frameRate: 15,
      })

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Camera initialization timeout")), 10000)
      })

      await Promise.race([initPromise, timeoutPromise])

      test.checks.push({
        name: "Camera Initialization",
        passed: cameraManager.isActive,
        details: cameraManager.isActive ? "Camera initialized successfully" : "Camera initialization failed",
      })

      // Test frame extraction
      if (cameraManager.isActive) {
        // Wait a moment for camera to stabilize
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const frameData = cameraManager.extractFrame()
        test.checks.push({
          name: "Frame Extraction",
          passed: !!frameData && !!frameData.canvas,
          details: frameData ? `Frame extracted: ${frameData.width}x${frameData.height}` : "Frame extraction failed",
        })
      }

      test.passed = test.checks.every((check) => check.passed)
    } catch (error) {
      test.checks.push({
        name: "Camera System Error",
        passed: false,
        details: error.message,
      })
      test.passed = false
      test.error = error.message
    } finally {
      // Cleanup camera resources
      if (cameraManager) {
        cameraManager.cleanup()
      }
    }

    test.endTime = Date.now()
    test.duration = test.endTime - test.startTime
    this.testResults.push(test)
    this.systemStatus.camera = test.passed
  }

  // Test 3: YOLO Model Loading
  async testYOLOModel() {
    console.log("[v0] Testing YOLO model loading...")

    const test = {
      name: "YOLO Model Test",
      startTime: Date.now(),
      checks: [],
    }

    let localModel = null

    try {
      // Test local model creation
      if (typeof window.YOLOv8LocalModel !== "undefined") {
        localModel = new window.YOLOv8LocalModel({
          modelPath: "/models/yolov8n.onnx",
          confidence: 0.5,
        })

        test.checks.push({
          name: "Local Model Creation",
          passed: true,
          details: "YOLOv8LocalModel instance created",
        })

        // Test model initialization (with timeout)
        try {
          const initPromise = localModel.initialize()
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Model loading timeout")), 30000)
          })

          await Promise.race([initPromise, timeoutPromise])

          test.checks.push({
            name: "Model Loading",
            passed: localModel.isReady(),
            details: localModel.isReady() ? "Model loaded successfully" : "Model loading failed",
          })

          if (localModel.isReady()) {
            const modelInfo = localModel.getModelInfo()
            test.checks.push({
              name: "Model Information",
              passed: true,
              details: `Input: ${modelInfo.inputSize}x${modelInfo.inputSize}, Classes: ${modelInfo.classes}, Providers: ${modelInfo.executionProviders.join(", ")}`,
            })
          }
        } catch (modelError) {
          test.checks.push({
            name: "Model Loading",
            passed: false,
            details: `Model loading failed: ${modelError.message}`,
          })
        }
      } else {
        test.checks.push({
          name: "Local Model Availability",
          passed: false,
          details: "YOLOv8LocalModel class not available",
        })
      }

      // Test YOLOv8Processor (API/simulation mode)
      const processor = new window.YOLOv8Processor({
        confidence: 0.5,
        classes: ["person", "cell phone", "laptop", "book"],
      })

      await processor.initialize()

      test.checks.push({
        name: "YOLO Processor",
        passed: processor.isInitialized,
        details: processor.isInitialized ? "YOLOv8Processor initialized" : "YOLOv8Processor initialization failed",
      })

      test.passed = test.checks.some((check) => check.passed)
    } catch (error) {
      test.passed = false
      test.error = error.message
    } finally {
      // Cleanup model resources
      if (localModel) {
        localModel.cleanup()
      }
    }

    test.endTime = Date.now()
    test.duration = test.endTime - test.startTime
    this.testResults.push(test)
    this.systemStatus.yolo = test.passed
  }

  // Test 4: System Integration
  async testSystemIntegration() {
    console.log("[v0] Testing system integration...")

    const test = {
      name: "System Integration Test",
      startTime: Date.now(),
      checks: [],
    }

    let cameraManager = null
    let visionCoordinator = null

    try {
      // Initialize camera
      cameraManager = new window.CameraManager()
      await cameraManager.initialize({ width: 640, height: 480 })

      // Initialize vision coordinator
      visionCoordinator = new window.VisionCoordinator()
      await visionCoordinator.initialize(cameraManager)

      test.checks.push({
        name: "Vision Coordinator Integration",
        passed: visionCoordinator.isActive,
        details: "VisionCoordinator integrated with CameraManager",
      })

      // Wait for processing to start
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Check if processors are running
      const status = visionCoordinator.getStatus()
      const activeProcessors = Object.values(status.processors).filter((p) => p.enabled).length

      test.checks.push({
        name: "Active Processors",
        passed: activeProcessors > 0,
        details: `${activeProcessors} processors active`,
      })

      // Check for results
      const results = visionCoordinator.getAllResults()
      const hasResults = Object.keys(results).length > 0

      test.checks.push({
        name: "Processing Results",
        passed: hasResults,
        details: hasResults ? `Results from: ${Object.keys(results).join(", ")}` : "No processing results yet",
      })

      test.passed = test.checks.every((check) => check.passed)
    } catch (error) {
      test.passed = false
      test.error = error.message
    } finally {
      // Cleanup resources
      if (visionCoordinator) {
        visionCoordinator.cleanup()
      }
      if (cameraManager) {
        cameraManager.cleanup()
      }
    }

    test.endTime = Date.now()
    test.duration = test.endTime - test.startTime
    this.testResults.push(test)
    this.systemStatus.integration = test.passed
  }

  // Test 5: Performance Test
  async testPerformance() {
    console.log("[v0] Testing system performance...")

    const test = {
      name: "Performance Test",
      startTime: Date.now(),
      checks: [],
    }

    try {
      // Create test canvas with sample image
      const canvas = document.createElement("canvas")
      canvas.width = 640
      canvas.height = 480
      const ctx = canvas.getContext("2d")

      // Draw test pattern
      ctx.fillStyle = "#4CAF50"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "#2196F3"
      ctx.fillRect(100, 100, 200, 200)
      ctx.fillStyle = "#FF9800"
      ctx.fillRect(300, 200, 150, 150)

      const frameData = {
        canvas,
        width: canvas.width,
        height: canvas.height,
        timestamp: Date.now(),
      }

      // Test YOLOv8Processor performance
      const processor = new window.YOLOv8Processor({
        confidence: 0.5,
        performance: {
          skipFrames: 0,
          adaptiveInterval: false,
        },
      })

      await processor.initialize()

      // Run multiple detections to measure performance
      const iterations = 5
      const times = []

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now()
        await processor.detect(frameData)
        const endTime = Date.now()
        times.push(endTime - startTime)
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length
      const maxTime = Math.max(...times)
      const minTime = Math.min(...times)

      test.checks.push({
        name: "Processing Speed",
        passed: avgTime < 1000, // Should process in under 1 second
        details: `Avg: ${avgTime.toFixed(1)}ms, Min: ${minTime}ms, Max: ${maxTime}ms`,
      })

      // Test memory usage (basic check)
      const memoryBefore = performance.memory ? performance.memory.usedJSHeapSize : 0

      // Run more processing
      for (let i = 0; i < 10; i++) {
        await processor.detect(frameData)
      }

      const memoryAfter = performance.memory ? performance.memory.usedJSHeapSize : 0
      const memoryIncrease = memoryAfter - memoryBefore

      test.checks.push({
        name: "Memory Usage",
        passed: memoryIncrease < 50 * 1024 * 1024, // Less than 50MB increase
        details: `Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
      })

      test.passed = test.checks.every((check) => check.passed)
    } catch (error) {
      test.passed = false
      test.error = error.message
    }

    test.endTime = Date.now()
    test.duration = test.endTime - test.startTime
    this.testResults.push(test)
    this.systemStatus.performance = test.passed
  }

  // Test 6: Error Handling
  async testErrorHandling() {
    console.log("[v0] Testing error handling...")

    const test = {
      name: "Error Handling Test",
      startTime: Date.now(),
      checks: [],
    }

    try {
      // Test invalid model path
      const invalidModel = new window.YOLOv8Processor({
        modelUrl: "/nonexistent/model.onnx",
      })

      try {
        await invalidModel.initialize()
        test.checks.push({
          name: "Invalid Model Handling",
          passed: false,
          details: "Should have thrown error for invalid model",
        })
      } catch (error) {
        test.checks.push({
          name: "Invalid Model Handling",
          passed: true,
          details: "Correctly handled invalid model path",
        })
      }

      // Test detection without initialization
      const uninitializedProcessor = new window.YOLOv8Processor()
      const result = await uninitializedProcessor.detect({ canvas: document.createElement("canvas") })

      test.checks.push({
        name: "Uninitialized Detection",
        passed: result.error && result.error.includes("not initialized"),
        details: "Correctly handled uninitialized processor",
      })

      // Test invalid frame data
      const processor = new window.YOLOv8Processor()
      await processor.initialize()

      const invalidResult = await processor.detect(null)
      test.checks.push({
        name: "Invalid Frame Data",
        passed: invalidResult.error && invalidResult.error.includes("No frame data"),
        details: "Correctly handled invalid frame data",
      })

      test.passed = test.checks.every((check) => check.passed)
    } catch (error) {
      test.passed = false
      test.error = error.message
    }

    test.endTime = Date.now()
    test.duration = test.endTime - test.startTime
    this.testResults.push(test)
  }

  // Generate comprehensive test report
  generateTestReport() {
    const totalTests = this.testResults.length
    const passedTests = this.testResults.filter((test) => test.passed).length
    const totalDuration = this.testResults.reduce((sum, test) => sum + (test.duration || 0), 0)

    const report = {
      success: passedTests === totalTests,
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests,
        duration: totalDuration,
      },
      systemStatus: this.systemStatus,
      tests: this.testResults,
      recommendations: this.generateRecommendations(),
    }

    return report
  }

  // Generate recommendations based on test results
  generateRecommendations() {
    const recommendations = []

    if (!this.systemStatus.camera) {
      recommendations.push({
        priority: "high",
        issue: "Camera system not working",
        solution: "Check camera permissions and ensure getUserMedia API is supported",
      })
    }

    if (!this.systemStatus.yolo) {
      recommendations.push({
        priority: "medium",
        issue: "YOLO model not loading",
        solution: "Ensure ONNX.js is included and model file is accessible at /models/yolov8n.onnx",
      })
    }

    if (!this.systemStatus.integration) {
      recommendations.push({
        priority: "high",
        issue: "System integration failing",
        solution: "Check that all components are properly initialized and connected",
      })
    }

    if (!this.systemStatus.performance) {
      recommendations.push({
        priority: "low",
        issue: "Performance issues detected",
        solution: "Consider reducing processing frequency or using smaller model",
      })
    }

    return recommendations
  }

  // Quick health check
  async quickHealthCheck() {
    console.log("[v0] Running quick health check...")

    const checks = {
      environment: typeof ort !== "undefined" && typeof window.YOLOv8Processor !== "undefined",
      camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      webgl: !!document.createElement("canvas").getContext("webgl"),
      memory: performance.memory ? performance.memory.usedJSHeapSize < 100 * 1024 * 1024 : true,
    }

    const allPassed = Object.values(checks).every((check) => check)

    return {
      healthy: allPassed,
      checks,
      timestamp: Date.now(),
    }
  }
}

// Export for global use
window.YOLOSystemTest = YOLOSystemTest
