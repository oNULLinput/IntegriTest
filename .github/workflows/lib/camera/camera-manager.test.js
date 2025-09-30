// Unit tests for camera-manager.js

require("../../../public/lib/camera/camera-manager.js")
const jest = require("jest")

describe("CameraManager", () => {
  let cameraManager

  beforeEach(() => {
    cameraManager = new window.CameraManager()
  })

  afterEach(() => {
    if (cameraManager) {
      cameraManager.cleanup()
    }
  })

  describe("initialization", () => {
    it("should initialize with default config", () => {
      expect(cameraManager.isActive).toBe(false)
      expect(cameraManager.status).toBe("inactive")
      expect(cameraManager.processors.size).toBe(0)
    })

    it("should initialize camera successfully", async () => {
      const result = await cameraManager.initialize()

      expect(result).toBe(true)
      expect(cameraManager.isActive).toBe(true)
      expect(cameraManager.status).toBe("active")
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
    })

    it("should handle camera access denial", async () => {
      navigator.mediaDevices.getUserMedia.mockRejectedValue(new Error("Permission denied"))

      await expect(cameraManager.initialize()).rejects.toThrow("Camera access failed")
      expect(cameraManager.status).toBe("error")
    })

    it("should merge custom config with defaults", async () => {
      await cameraManager.initialize({ frameRate: 30, width: 1280 })

      expect(cameraManager.processingConfig.frameRate).toBe(30)
      expect(cameraManager.processingConfig.width).toBe(1280)
    })
  })

  describe("processor registration", () => {
    beforeEach(async () => {
      await cameraManager.initialize()
    })

    it("should register a processor", () => {
      const mockProcessor = jest.fn()
      cameraManager.registerProcessor("test-processor", mockProcessor)

      expect(cameraManager.processors.has("test-processor")).toBe(true)
      expect(cameraManager.isProcessing).toBe(true)
    })

    it("should unregister a processor", () => {
      const mockProcessor = jest.fn()
      cameraManager.registerProcessor("test-processor", mockProcessor)
      cameraManager.unregisterProcessor("test-processor")

      expect(cameraManager.processors.has("test-processor")).toBe(false)
    })

    it("should stop processing when all processors removed", () => {
      const mockProcessor = jest.fn()
      cameraManager.registerProcessor("test-processor", mockProcessor)
      cameraManager.unregisterProcessor("test-processor")

      expect(cameraManager.isProcessing).toBe(false)
    })
  })

  describe("frame extraction", () => {
    beforeEach(async () => {
      await cameraManager.initialize()
    })

    it("should extract frame data", () => {
      // Mock video element ready state
      cameraManager.hiddenVideoElement = {
        readyState: 4,
      }

      const frameData = cameraManager.extractFrame()

      expect(frameData).toBeDefined()
      expect(frameData.imageData).toBeDefined()
      expect(frameData.width).toBe(640)
      expect(frameData.height).toBe(480)
    })

    it("should return null if video not ready", () => {
      cameraManager.hiddenVideoElement = {
        readyState: 0,
      }

      const frameData = cameraManager.extractFrame()

      expect(frameData).toBeNull()
    })

    it("should get frame as data URL", () => {
      cameraManager.hiddenVideoElement = {
        readyState: 4,
      }

      const dataURL = cameraManager.getFrameDataURL()

      expect(dataURL).toBe("data:image/png;base64,mock")
    })
  })

  describe("processor control", () => {
    beforeEach(async () => {
      await cameraManager.initialize()
    })

    it("should toggle processor enabled state", () => {
      const mockProcessor = jest.fn()
      cameraManager.registerProcessor("test-processor", mockProcessor)

      cameraManager.toggleProcessor("test-processor", false)
      const processor = cameraManager.processors.get("test-processor")

      expect(processor.enabled).toBe(false)
    })

    it("should update processor interval", () => {
      const mockProcessor = jest.fn()
      cameraManager.registerProcessor("test-processor", mockProcessor)

      cameraManager.setProcessorInterval("test-processor", 500)
      const processor = cameraManager.processors.get("test-processor")

      expect(processor.interval).toBe(500)
    })
  })

  describe("status and cleanup", () => {
    it("should return correct status", async () => {
      await cameraManager.initialize()

      const status = cameraManager.getStatus()

      expect(status.isActive).toBe(true)
      expect(status.status).toBe("active")
      expect(status.frameCount).toBe(0)
    })

    it("should cleanup resources", async () => {
      await cameraManager.initialize()
      const mockProcessor = jest.fn()
      cameraManager.registerProcessor("test-processor", mockProcessor)

      cameraManager.cleanup()

      expect(cameraManager.isActive).toBe(false)
      expect(cameraManager.status).toBe("inactive")
      expect(cameraManager.processors.size).toBe(0)
    })
  })
})
