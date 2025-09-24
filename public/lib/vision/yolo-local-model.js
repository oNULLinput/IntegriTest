// YOLOv8 Local Model Implementation
// Provides native browser-based YOLOv8 inference using ONNX.js

// Import ONNX.js runtime
const ort = window.ort

class YOLOv8LocalModel {
  constructor(config = {}) {
    this.config = {
      modelPath: config.modelPath || "/models/yolov8n.onnx",
      inputSize: config.inputSize || 640,
      confidence: config.confidence || 0.5,
      iouThreshold: config.iouThreshold || 0.4,
      maxDetections: config.maxDetections || 100,
      classes: config.classes || [
        "person",
        "bicycle",
        "car",
        "motorcycle",
        "airplane",
        "bus",
        "train",
        "truck",
        "boat",
        "traffic light",
        "fire hydrant",
        "stop sign",
        "parking meter",
        "bench",
        "bird",
        "cat",
        "dog",
        "horse",
        "sheep",
        "cow",
        "elephant",
        "bear",
        "zebra",
        "giraffe",
        "backpack",
        "umbrella",
        "handbag",
        "tie",
        "suitcase",
        "frisbee",
        "skis",
        "snowboard",
        "sports ball",
        "kite",
        "baseball bat",
        "baseball glove",
        "skateboard",
        "surfboard",
        "tennis racket",
        "bottle",
        "wine glass",
        "cup",
        "fork",
        "knife",
        "spoon",
        "bowl",
        "banana",
        "apple",
        "sandwich",
        "orange",
        "broccoli",
        "carrot",
        "hot dog",
        "pizza",
        "donut",
        "cake",
        "chair",
        "couch",
        "potted plant",
        "bed",
        "dining table",
        "toilet",
        "tv",
        "laptop",
        "mouse",
        "remote",
        "keyboard",
        "cell phone",
        "microwave",
        "oven",
        "toaster",
        "sink",
        "refrigerator",
        "book",
        "clock",
        "vase",
        "scissors",
        "teddy bear",
        "hair drier",
        "toothbrush",
      ],
      ...config,
    }

    this.session = null
    this.isInitialized = false
    this.isLoading = false

    console.log("[v0] YOLOv8LocalModel initialized with config:", this.config)
  }

  // Initialize ONNX.js and load the model
  async initialize() {
    if (this.isInitialized || this.isLoading) {
      return this.isInitialized
    }

    this.isLoading = true

    try {
      console.log("[v0] Loading ONNX.js runtime...")

      // Check if ONNX.js is available
      if (typeof ort === "undefined") {
        throw new Error("ONNX.js runtime not found. Please include onnxruntime-web in your project.")
      }

      console.log("[v0] ONNX.js runtime loaded successfully")
      console.log("[v0] Loading YOLOv8 model from:", this.config.modelPath)

      // Configure ONNX.js execution providers
      ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.3/dist/"

      // Try to use WebGL if available, fallback to WASM
      const providers = ["webgl", "wasm"]

      // Load the model
      this.session = await ort.InferenceSession.create(this.config.modelPath, {
        executionProviders: providers,
        graphOptimizationLevel: "all",
      })

      console.log("[v0] YOLOv8 model loaded successfully")
      console.log(
        "[v0] Model input shape:",
        this.session.inputNames.map((name) => `${name}: [${this.session.inputMetadata[name].dims.join(", ")}]`),
      )
      console.log(
        "[v0] Model output shape:",
        this.session.outputNames.map((name) => `${name}: [${this.session.outputMetadata[name].dims.join(", ")}]`),
      )

      this.isInitialized = true
      return true
    } catch (error) {
      console.error("[v0] Failed to initialize YOLOv8 local model:", error)
      this.isInitialized = false
      throw error
    } finally {
      this.isLoading = false
    }
  }

  // Preprocess image for YOLOv8 inference
  preprocessImage(canvas) {
    const inputSize = this.config.inputSize

    // Create a temporary canvas for preprocessing
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = inputSize
    tempCanvas.height = inputSize
    const tempCtx = tempCanvas.getContext("2d")

    // Resize image to model input size (letterbox)
    const scale = Math.min(inputSize / canvas.width, inputSize / canvas.height)
    const scaledWidth = canvas.width * scale
    const scaledHeight = canvas.height * scale
    const offsetX = (inputSize - scaledWidth) / 2
    const offsetY = (inputSize - scaledHeight) / 2

    // Fill with gray background
    tempCtx.fillStyle = "#808080"
    tempCtx.fillRect(0, 0, inputSize, inputSize)

    // Draw resized image
    tempCtx.drawImage(canvas, offsetX, offsetY, scaledWidth, scaledHeight)

    // Get image data and convert to tensor format
    const imageData = tempCtx.getImageData(0, 0, inputSize, inputSize)
    const pixels = imageData.data

    // Convert RGBA to RGB and normalize to [0, 1]
    const red = new Float32Array(inputSize * inputSize)
    const green = new Float32Array(inputSize * inputSize)
    const blue = new Float32Array(inputSize * inputSize)

    for (let i = 0; i < pixels.length; i += 4) {
      const idx = i / 4
      red[idx] = pixels[i] / 255.0 // R
      green[idx] = pixels[i + 1] / 255.0 // G
      blue[idx] = pixels[i + 2] / 255.0 // B
    }

    // Combine channels in CHW format (channels first)
    const inputTensor = new Float32Array(3 * inputSize * inputSize)
    inputTensor.set(red, 0)
    inputTensor.set(green, inputSize * inputSize)
    inputTensor.set(blue, 2 * inputSize * inputSize)

    return {
      tensor: inputTensor,
      scale,
      offsetX,
      offsetY,
      originalWidth: canvas.width,
      originalHeight: canvas.height,
    }
  }

  // Run inference on preprocessed image
  async runInference(preprocessedData) {
    if (!this.isInitialized) {
      throw new Error("Model not initialized")
    }

    const inputSize = this.config.inputSize

    // Create input tensor
    const inputTensor = new ort.Tensor("float32", preprocessedData.tensor, [1, 3, inputSize, inputSize])

    // Run inference
    const feeds = {}
    feeds[this.session.inputNames[0]] = inputTensor

    const results = await this.session.run(feeds)

    // Get output tensor
    const outputTensor = results[this.session.outputNames[0]]

    return {
      output: outputTensor.data,
      shape: outputTensor.dims,
      preprocessedData,
    }
  }

  // Post-process model output to get detections
  postprocessOutput(inferenceResult) {
    const { output, shape, preprocessedData } = inferenceResult
    const [batchSize, numDetections, numValues] = shape

    const detections = []

    // YOLOv8 output format: [x_center, y_center, width, height, confidence, class_scores...]
    for (let i = 0; i < numDetections; i++) {
      const offset = i * numValues

      // Extract box coordinates and confidence
      const xCenter = output[offset]
      const yCenter = output[offset + 1]
      const width = output[offset + 2]
      const height = output[offset + 3]

      // Find class with highest confidence
      let maxClassScore = 0
      let classId = 0

      for (let j = 4; j < numValues; j++) {
        const classScore = output[offset + j]
        if (classScore > maxClassScore) {
          maxClassScore = classScore
          classId = j - 4
        }
      }

      // Filter by confidence threshold
      if (maxClassScore < this.config.confidence) {
        continue
      }

      // Convert coordinates back to original image space
      const inputSize = this.config.inputSize
      const scale = preprocessedData.scale
      const offsetX = preprocessedData.offsetX
      const offsetY = preprocessedData.offsetY

      // Convert from center format to corner format
      const x1 = (xCenter - width / 2 - offsetX) / scale
      const y1 = (yCenter - height / 2 - offsetY) / scale
      const x2 = (xCenter + width / 2 - offsetX) / scale
      const y2 = (yCenter + height / 2 - offsetY) / scale

      // Clamp to image bounds
      const clampedX1 = Math.max(0, Math.min(x1, preprocessedData.originalWidth))
      const clampedY1 = Math.max(0, Math.min(y1, preprocessedData.originalHeight))
      const clampedX2 = Math.max(0, Math.min(x2, preprocessedData.originalWidth))
      const clampedY2 = Math.max(0, Math.min(y2, preprocessedData.originalHeight))

      detections.push({
        class: this.config.classes[classId] || `class_${classId}`,
        confidence: maxClassScore,
        bbox: {
          x: clampedX1,
          y: clampedY1,
          width: clampedX2 - clampedX1,
          height: clampedY2 - clampedY1,
        },
      })
    }

    // Apply Non-Maximum Suppression (NMS)
    return this.applyNMS(detections)
  }

  // Apply Non-Maximum Suppression to remove duplicate detections
  applyNMS(detections) {
    if (detections.length === 0) return detections

    // Sort by confidence (highest first)
    detections.sort((a, b) => b.confidence - a.confidence)

    const keep = []
    const suppressed = new Set()

    for (let i = 0; i < detections.length; i++) {
      if (suppressed.has(i)) continue

      keep.push(detections[i])

      // Suppress overlapping detections of the same class
      for (let j = i + 1; j < detections.length; j++) {
        if (suppressed.has(j)) continue

        if (detections[i].class === detections[j].class) {
          const iou = this.calculateIoU(detections[i].bbox, detections[j].bbox)
          if (iou > this.config.iouThreshold) {
            suppressed.add(j)
          }
        }
      }
    }

    return keep.slice(0, this.config.maxDetections)
  }

  // Calculate Intersection over Union (IoU) for two bounding boxes
  calculateIoU(box1, box2) {
    const x1 = Math.max(box1.x, box2.x)
    const y1 = Math.max(box1.y, box2.y)
    const x2 = Math.min(box1.x + box1.width, box2.x + box2.width)
    const y2 = Math.min(box1.y + box1.height, box2.y + box2.height)

    if (x2 <= x1 || y2 <= y1) return 0

    const intersection = (x2 - x1) * (y2 - y1)
    const area1 = box1.width * box1.height
    const area2 = box2.width * box2.height
    const union = area1 + area2 - intersection

    return intersection / union
  }

  // Main detection method
  async detect(frameData) {
    if (!this.isInitialized) {
      throw new Error("Model not initialized. Call initialize() first.")
    }

    try {
      // Preprocess image
      const preprocessedData = this.preprocessImage(frameData.canvas)

      // Run inference
      const inferenceResult = await this.runInference(preprocessedData)

      // Post-process results
      const detections = this.postprocessOutput(inferenceResult)

      return detections
    } catch (error) {
      console.error("[v0] YOLOv8 local detection error:", error)
      throw error
    }
  }

  // Check if model is ready
  isReady() {
    return this.isInitialized
  }

  // Get model information
  getModelInfo() {
    if (!this.isInitialized) {
      return null
    }

    return {
      modelPath: this.config.modelPath,
      inputSize: this.config.inputSize,
      classes: this.config.classes.length,
      confidence: this.config.confidence,
      iouThreshold: this.config.iouThreshold,
      inputNames: this.session.inputNames,
      outputNames: this.session.outputNames,
      executionProviders: this.session.executionProviders,
    }
  }

  // Cleanup resources
  cleanup() {
    if (this.session) {
      this.session.release()
      this.session = null
    }
    this.isInitialized = false
    console.log("[v0] YOLOv8LocalModel cleaned up")
  }
}

// Export for global use
window.YOLOv8LocalModel = YOLOv8LocalModel
