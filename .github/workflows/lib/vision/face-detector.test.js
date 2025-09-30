// Unit tests for face-detector.js

require("../../../public/lib/vision/face-detector.js")

describe("FaceDetector", () => {
  let faceDetector

  beforeEach(() => {
    faceDetector = new window.FaceDetector()
  })

  describe("initialization", () => {
    it("should initialize with default config", () => {
      expect(faceDetector.isDetecting).toBe(false)
      expect(faceDetector.detectionHistory).toEqual([])
      expect(faceDetector.config).toBeDefined()
    })
  })

  describe("skin detection", () => {
    it("should detect skin tones correctly", () => {
      // Typical skin tone RGB values
      expect(faceDetector.detectSkin(200, 150, 120)).toBe(true)
      expect(faceDetector.detectSkin(180, 140, 110)).toBe(true)
    })

    it("should reject non-skin colors", () => {
      // Pure white
      expect(faceDetector.detectSkin(255, 255, 255)).toBe(false)
      // Pure black
      expect(faceDetector.detectSkin(0, 0, 0)).toBe(false)
      // Blue
      expect(faceDetector.detectSkin(50, 50, 200)).toBe(false)
    })
  })

  describe("frame analysis", () => {
    it("should analyze frame and detect face", () => {
      // Create mock image data with skin-like pixels in center
      const width = 640
      const height = 480
      const imageData = {
        data: new Uint8ClampedArray(width * height * 4),
        width,
        height,
      }

      // Fill center region with skin-tone pixels
      for (let y = 200; y < 280; y++) {
        for (let x = 280; x < 360; x++) {
          const i = (y * width + x) * 4
          imageData.data[i] = 200 // R
          imageData.data[i + 1] = 150 // G
          imageData.data[i + 2] = 120 // B
          imageData.data[i + 3] = 255 // A
        }
      }

      const result = faceDetector.analyzeFrame(imageData)

      expect(result).toBeDefined()
      expect(result.faceDetected).toBeDefined()
      expect(result.metrics).toBeDefined()
      expect(result.confidence).toBeGreaterThanOrEqual(0)
    })

    it("should return low confidence for no face", () => {
      const width = 640
      const height = 480
      const imageData = {
        data: new Uint8ClampedArray(width * height * 4),
        width,
        height,
      }

      // Fill with non-skin color (blue)
      imageData.data.fill(100)

      const result = faceDetector.analyzeFrame(imageData)

      expect(result.faceDetected).toBe(false)
      expect(result.confidence).toBe(0)
    })
  })

  describe("detect method", () => {
    it("should process frame data correctly", () => {
      const frameData = {
        imageData: {
          data: new Uint8ClampedArray(640 * 480 * 4),
          width: 640,
          height: 480,
        },
      }

      const result = faceDetector.detect(frameData, { timestamp: Date.now() })

      expect(result).toBeDefined()
      expect(result.faceDetected).toBeDefined()
      expect(result.timestamp).toBeDefined()
    })

    it("should handle missing frame data", () => {
      const result = faceDetector.detect(null)

      expect(result.faceDetected).toBe(false)
      expect(result.error).toBe("No frame data")
    })

    it("should add results to history", () => {
      const frameData = {
        imageData: {
          data: new Uint8ClampedArray(640 * 480 * 4),
          width: 640,
          height: 480,
        },
      }

      faceDetector.detect(frameData)
      faceDetector.detect(frameData)

      expect(faceDetector.detectionHistory.length).toBe(2)
    })
  })

  describe("multiple people detection", () => {
    it("should detect multiple people from regions", () => {
      const regions = [
        { x: 5, y: 5, density: 30 },
        { x: 15, y: 5, density: 30 },
      ]

      const result = faceDetector.checkForMultiplePeople(regions, 20)

      expect(typeof result).toBe("boolean")
    })

    it("should return false for single region", () => {
      const regions = [{ x: 10, y: 10, density: 30 }]

      const result = faceDetector.checkForMultiplePeople(regions, 20)

      expect(result).toBe(false)
    })
  })

  describe("trends analysis", () => {
    it("should return insufficient data for small history", () => {
      const trends = faceDetector.getTrends()

      expect(trends.trend).toBe("insufficient_data")
    })

    it("should calculate trends from history", () => {
      // Add multiple detection results
      for (let i = 0; i < 5; i++) {
        faceDetector.addToHistory({
          faceDetected: true,
          confidence: 80,
        })
      }

      const trends = faceDetector.getTrends()

      expect(trends.faceDetectionRate).toBe(1)
      expect(trends.avgConfidence).toBe(80)
      expect(trends.trend).toBe("stable")
    })
  })

  describe("configuration", () => {
    it("should update config", () => {
      faceDetector.updateConfig({ skinThreshold: 0.1 })

      expect(faceDetector.config.skinThreshold).toBe(0.1)
    })

    it("should reset detector state", () => {
      faceDetector.detectionHistory = [{ test: "data" }]
      faceDetector.isDetecting = true

      faceDetector.reset()

      expect(faceDetector.detectionHistory).toEqual([])
      expect(faceDetector.isDetecting).toBe(false)
    })
  })
})
