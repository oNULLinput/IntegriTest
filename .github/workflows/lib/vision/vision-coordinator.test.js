import { VisionCoordinator } from "../../../public/lib/vision/vision-coordinator.js"
import jest from "jest"

describe("VisionCoordinator", () => {
  let coordinator
  let mockCameraManager
  let mockProcessor

  beforeEach(() => {
    coordinator = new VisionCoordinator()

    mockCameraManager = {
      isActive: true,
      registerProcessor: jest.fn(),
      unregisterProcessor: jest.fn(),
      toggleProcessor: jest.fn(),
      setProcessorInterval: jest.fn(),
    }

    mockProcessor = {
      detect: jest.fn().mockResolvedValue({
        detected: true,
        confidence: 0.95,
      }),
    }

    // Mock global processors
    window.FaceDetector = jest.fn(() => mockProcessor)
  })

  afterEach(() => {
    coordinator.cleanup()
  })

  describe("Initialization", () => {
    test("should initialize with camera manager", async () => {
      await coordinator.initialize(mockCameraManager)

      expect(coordinator.cameraManager).toBe(mockCameraManager)
      expect(coordinator.isActive).toBe(true)
    })

    test("should throw error if no camera manager provided", async () => {
      await expect(coordinator.initialize(null)).rejects.toThrow("CameraManager instance required")
    })

    test("should setup default processors", async () => {
      await coordinator.initialize(mockCameraManager)

      expect(coordinator.processors.has("faceDetection")).toBe(true)
      expect(mockCameraManager.registerProcessor).toHaveBeenCalled()
    })
  })

  describe("Processor Management", () => {
    test("should add processor with configuration", async () => {
      await coordinator.initialize(mockCameraManager)

      coordinator.addProcessor("testProcessor", mockProcessor, {
        interval: 1000,
        priority: "high",
        essential: true,
      })

      const config = coordinator.processors.get("testProcessor")
      expect(config.interval).toBe(1000)
      expect(config.priority).toBe("high")
      expect(config.essential).toBe(true)
    })

    test("should remove processor", async () => {
      await coordinator.initialize(mockCameraManager)

      coordinator.addProcessor("testProcessor", mockProcessor)
      coordinator.removeProcessor("testProcessor")

      expect(coordinator.processors.has("testProcessor")).toBe(false)
      expect(mockCameraManager.unregisterProcessor).toHaveBeenCalledWith("testProcessor")
    })

    test("should toggle processor enabled state", async () => {
      await coordinator.initialize(mockCameraManager)

      coordinator.addProcessor("testProcessor", mockProcessor)
      coordinator.toggleProcessor("testProcessor", false)

      const config = coordinator.processors.get("testProcessor")
      expect(config.enabled).toBe(false)
    })

    test("should update processor interval", async () => {
      await coordinator.initialize(mockCameraManager)

      coordinator.addProcessor("testProcessor", mockProcessor)
      coordinator.setProcessorInterval("testProcessor", 2000)

      const config = coordinator.processors.get("testProcessor")
      expect(config.interval).toBe(2000)
    })
  })

  describe("Frame Processing", () => {
    test("should process frame with processor", async () => {
      await coordinator.initialize(mockCameraManager)

      coordinator.addProcessor("testProcessor", mockProcessor)

      const frameData = { width: 640, height: 480, data: new Uint8Array() }
      const metadata = { timestamp: Date.now() }

      await coordinator.processFrame("testProcessor", frameData, metadata)

      expect(mockProcessor.detect).toHaveBeenCalledWith(frameData, metadata)
      expect(coordinator.results.has("testProcessor")).toBe(true)
    })

    test("should handle processor errors gracefully", async () => {
      await coordinator.initialize(mockCameraManager)

      const errorProcessor = {
        detect: jest.fn().mockRejectedValue(new Error("Processing failed")),
      }

      coordinator.addProcessor("errorProcessor", errorProcessor)

      const frameData = { width: 640, height: 480, data: new Uint8Array() }
      await coordinator.processFrame("errorProcessor", frameData, {})

      const result = coordinator.results.get("errorProcessor")
      expect(result.error).toBe("Processing failed")
    })

    test("should skip disabled processors", async () => {
      await coordinator.initialize(mockCameraManager)

      coordinator.addProcessor("testProcessor", mockProcessor)
      coordinator.toggleProcessor("testProcessor", false)

      const frameData = { width: 640, height: 480, data: new Uint8Array() }
      await coordinator.processFrame("testProcessor", frameData, {})

      expect(mockProcessor.detect).not.toHaveBeenCalled()
    })
  })

  describe("Processing Queue", () => {
    test("should queue processing tasks", async () => {
      await coordinator.initialize(mockCameraManager)

      coordinator.addProcessor("testProcessor", mockProcessor, { priority: "high" })

      const frameData = { width: 640, height: 480, data: new Uint8Array() }
      coordinator.queueProcessing("testProcessor", frameData, {})

      expect(coordinator.processingQueue.length).toBeGreaterThan(0)
    })

    test("should prioritize high priority tasks", async () => {
      await coordinator.initialize(mockCameraManager)

      coordinator.addProcessor("lowPriority", mockProcessor, { priority: "low" })
      coordinator.addProcessor("highPriority", mockProcessor, { priority: "high" })

      const frameData = { width: 640, height: 480, data: new Uint8Array() }

      coordinator.queueProcessing("lowPriority", frameData, {})
      coordinator.queueProcessing("highPriority", frameData, {})

      expect(coordinator.processingQueue[0].processorName).toBe("highPriority")
    })

    test("should skip non-essential tasks when overloaded", async () => {
      await coordinator.initialize(mockCameraManager)

      coordinator.addProcessor("nonEssential", mockProcessor, { essential: false })

      // Simulate high load
      coordinator.stats.processingLoad = 0.9

      const frameData = { width: 640, height: 480, data: new Uint8Array() }
      coordinator.queueProcessing("nonEssential", frameData, {})

      expect(coordinator.stats.droppedFrames).toBeGreaterThan(0)
    })
  })

  describe("Result Callbacks", () => {
    test("should execute callback on result", async () => {
      await coordinator.initialize(mockCameraManager)

      const callback = jest.fn()
      coordinator.onResult("testProcessor", callback)

      coordinator.addProcessor("testProcessor", mockProcessor)

      const frameData = { width: 640, height: 480, data: new Uint8Array() }
      await coordinator.processFrame("testProcessor", frameData, {})

      // Wait for callback to be called (it's in setTimeout)
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(callback).toHaveBeenCalled()
    })

    test("should execute global callback for all processors", async () => {
      await coordinator.initialize(mockCameraManager)

      const globalCallback = jest.fn()
      coordinator.onResult("*", globalCallback)

      coordinator.addProcessor("testProcessor", mockProcessor)

      const frameData = { width: 640, height: 480, data: new Uint8Array() }
      await coordinator.processFrame("testProcessor", frameData, {})

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(globalCallback).toHaveBeenCalledWith("testProcessor", expect.any(Object), frameData, expect.any(Object))
    })
  })

  describe("Statistics", () => {
    test("should update processing statistics", async () => {
      await coordinator.initialize(mockCameraManager)

      coordinator.addProcessor("testProcessor", mockProcessor)

      const frameData = { width: 640, height: 480, data: new Uint8Array() }
      await coordinator.processFrame("testProcessor", frameData, {})

      expect(coordinator.stats.totalFramesProcessed).toBe(1)
      expect(coordinator.stats.avgProcessingTime).toBeGreaterThan(0)
    })

    test("should calculate processing load", async () => {
      await coordinator.initialize(mockCameraManager)

      coordinator.updateStats(150) // 150ms processing time

      expect(coordinator.stats.processingLoad).toBeGreaterThan(0)
      expect(coordinator.stats.processingLoad).toBeLessThanOrEqual(1)
    })
  })

  describe("Status Reporting", () => {
    test("should return comprehensive status", async () => {
      await coordinator.initialize(mockCameraManager)

      coordinator.addProcessor("testProcessor", mockProcessor)

      const status = coordinator.getStatus()

      expect(status.isActive).toBe(true)
      expect(status.processors).toHaveProperty("testProcessor")
      expect(status.stats).toBeDefined()
      expect(status.cameraConnected).toBe(true)
    })
  })

  describe("Cleanup", () => {
    test("should cleanup all resources", async () => {
      await coordinator.initialize(mockCameraManager)

      coordinator.addProcessor("testProcessor", mockProcessor)

      coordinator.cleanup()

      expect(coordinator.isActive).toBe(false)
      expect(coordinator.processors.size).toBe(0)
      expect(coordinator.results.size).toBe(0)
      expect(coordinator.cameraManager).toBeNull()
    })
  })
})
