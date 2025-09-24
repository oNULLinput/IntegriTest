// Enhanced Face Detection Module - YOLOv8 Compatible
// Provides clean interface for face detection that can be easily extended

class FaceDetector {
  constructor() {
    this.isDetecting = false
    this.detectionHistory = []
    this.maxHistoryLength = 10

    // Detection parameters
    this.config = {
      skinThreshold: 0.04,
      maxSkinThreshold: 0.35,
      faceRegionThreshold: 0.25,
      brightnessThreshold: 0.3,
      minFacePixels: 15,
      maxFacePixels: 800,
      gridSize: 15,
      multiplePeopleThreshold: 30,
      distanceThreshold: 6,
      densityThreshold: 25,
    }

    console.log("[v0] FaceDetector initialized")
  }

  // Main detection function - compatible with CameraManager
  detect(frameData, metadata = {}) {
    if (!frameData || !frameData.imageData) {
      return { faceDetected: false, confidence: 0, error: "No frame data" }
    }

    try {
      const result = this.analyzeFrame(frameData.imageData)

      // Add to history for trend analysis
      this.addToHistory(result)

      // Add metadata
      result.timestamp = metadata.timestamp || Date.now()
      result.frameCount = metadata.frameCount || 0

      return result
    } catch (error) {
      console.error("[v0] Face detection error:", error)
      return { faceDetected: false, confidence: 0, error: error.message }
    }
  }

  // Core face detection algorithm
  analyzeFrame(imageData) {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height

    let skinPixels = 0
    let totalPixels = 0
    let faceRegionPixels = 0
    let brightPixels = 0

    const centerX = width / 2
    const centerY = height / 2
    const faceRegionSize = Math.min(width, height) * 0.3

    // Create grid for spatial analysis
    const gridSize = this.config.gridSize
    const faceGrid = Array(Math.ceil(height / gridSize))
      .fill()
      .map(() => Array(Math.ceil(width / gridSize)).fill(0))

    // Analyze pixels
    for (let y = 0; y < height; y += 3) {
      for (let x = 0; x < width; x += 3) {
        const i = (y * width + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        totalPixels++

        // Brightness analysis
        const brightness = (r + g + b) / 3
        if (brightness > 50) {
          brightPixels++
        }

        // Skin detection
        const isFaceSkin = this.detectSkin(r, g, b)
        if (isFaceSkin) {
          skinPixels++

          // Grid mapping
          const gridX = Math.floor(x / gridSize)
          const gridY = Math.floor(y / gridSize)
          if (gridX < faceGrid[0].length && gridY < faceGrid.length) {
            faceGrid[gridY][gridX]++
          }

          // Face region analysis
          const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
          if (distanceFromCenter < faceRegionSize) {
            faceRegionPixels++
          }
        }
      }
    }

    // Analyze spatial distribution
    const spatialAnalysis = this.analyzeSpatialDistribution(faceGrid)

    // Calculate metrics
    const skinPercentage = skinPixels / totalPixels
    const faceRegionPercentage = faceRegionPixels / Math.max(skinPixels, 1)
    const brightnessRatio = brightPixels / totalPixels

    // Detection criteria
    const hasEnoughFaceSkin =
      skinPercentage > this.config.skinThreshold && skinPercentage < this.config.maxSkinThreshold
    const hasConcentratedFace = faceRegionPercentage > this.config.faceRegionThreshold
    const hasGoodLighting = brightnessRatio > this.config.brightnessThreshold
    const hasMinimumFacePixels = faceRegionPixels > this.config.minFacePixels
    const hasProperFaceSize = faceRegionPixels < this.config.maxFacePixels

    const faceDetected =
      hasEnoughFaceSkin && hasConcentratedFace && hasGoodLighting && hasMinimumFacePixels && hasProperFaceSize

    const confidence = faceDetected ? Math.min(100, skinPercentage * 800 + faceRegionPercentage * 80) : 0

    return {
      faceDetected,
      multiplePeople: spatialAnalysis.multiplePeople,
      confidence,
      metrics: {
        skinPercentage,
        faceRegionPercentage,
        brightnessRatio,
        faceRegionPixels,
        skinPixels,
        totalPixels,
      },
      spatialAnalysis,
      qualityChecks: {
        hasEnoughFaceSkin,
        hasConcentratedFace,
        hasGoodLighting,
        hasMinimumFacePixels,
        hasProperFaceSize,
      },
    }
  }

  // Enhanced skin detection algorithm
  detectSkin(r, g, b) {
    // Basic color range check
    if (r < 60 || g < 40 || b < 30) return false
    if (r > 250 && g > 250 && b > 250) return false

    // RGB-based skin detection
    const rg_diff = r - g
    const rb_diff = r - b
    const gb_diff = g - b

    const isFacialSkin =
      r >= g && rg_diff > 5 && rg_diff < 100 && rb_diff > 10 && rb_diff < 140 && gb_diff > -30 && gb_diff < 50

    // YCbCr-based skin detection
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b

    const ycbcrFacialSkin = y > 60 && y < 240 && cb >= 80 && cb <= 140 && cr >= 130 && cr <= 185

    return isFacialSkin && ycbcrFacialSkin
  }

  // Analyze spatial distribution to detect multiple people
  analyzeSpatialDistribution(faceGrid) {
    const significantRegions = []

    // Find significant regions
    for (let y = 0; y < faceGrid.length; y++) {
      for (let x = 0; x < faceGrid[y].length; x++) {
        if (faceGrid[y][x] > 8) {
          significantRegions.push({
            x,
            y,
            density: faceGrid[y][x],
          })
        }
      }
    }

    // Sort by density
    significantRegions.sort((a, b) => b.density - a.density)

    // Check for multiple people
    const multiplePeople = this.checkForMultiplePeople(significantRegions, faceGrid[0].length)

    return {
      significantRegions,
      multiplePeople,
      regionCount: significantRegions.length,
    }
  }

  // Enhanced multiple people detection
  checkForMultiplePeople(regions, gridWidth) {
    if (regions.length < 2) return false

    // Filter high-density regions
    const highDensityRegions = regions.filter((region) => region.density > this.config.multiplePeopleThreshold)

    if (highDensityRegions.length >= 3) {
      return true
    }

    // Check for distant regions
    for (let i = 0; i < Math.min(regions.length, 3); i++) {
      for (let j = i + 1; j < Math.min(regions.length, 3); j++) {
        const region1 = regions[i]
        const region2 = regions[j]

        const distance = Math.sqrt(Math.pow(region1.x - region2.x, 2) + Math.pow(region1.y - region2.y, 2))

        if (
          distance > this.config.distanceThreshold &&
          region1.density > this.config.densityThreshold &&
          region2.density > this.config.densityThreshold
        ) {
          return true
        }
      }
    }

    // Check left-right distribution
    const leftRegions = regions.filter((r) => r.x < gridWidth / 3)
    const rightRegions = regions.filter((r) => r.x > (2 * gridWidth) / 3)

    if (leftRegions.length > 0 && rightRegions.length > 0) {
      const maxLeft = Math.max(...leftRegions.map((r) => r.density))
      const maxRight = Math.max(...rightRegions.map((r) => r.density))

      if (maxLeft > 22 && maxRight > 22) {
        return true
      }
    }

    return false
  }

  // Add result to history for trend analysis
  addToHistory(result) {
    this.detectionHistory.push({
      ...result,
      timestamp: Date.now(),
    })

    // Keep history size manageable
    if (this.detectionHistory.length > this.maxHistoryLength) {
      this.detectionHistory.shift()
    }
  }

  // Get detection trends
  getTrends() {
    if (this.detectionHistory.length < 2) {
      return { stable: true, trend: "insufficient_data" }
    }

    const recent = this.detectionHistory.slice(-5)
    const faceDetectionRate = recent.filter((r) => r.faceDetected).length / recent.length
    const avgConfidence = recent.reduce((sum, r) => sum + r.confidence, 0) / recent.length

    return {
      faceDetectionRate,
      avgConfidence,
      stable: faceDetectionRate > 0.6,
      trend: faceDetectionRate > 0.8 ? "stable" : faceDetectionRate > 0.4 ? "unstable" : "poor",
    }
  }

  // Update configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    console.log("[v0] FaceDetector configuration updated")
  }

  // Reset detection state
  reset() {
    this.detectionHistory = []
    this.isDetecting = false
    console.log("[v0] FaceDetector reset")
  }
}

// Export for global use
window.FaceDetector = FaceDetector
