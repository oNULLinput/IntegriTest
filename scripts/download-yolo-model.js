// Script to download YOLOv8 ONNX model for local inference
// This script helps users set up the local YOLO model properly

const fs = require("fs")
const path = require("path")
const https = require("https")

console.log("[v0] YOLOv8 Model Download Script")
console.log("[v0] This script will download the YOLOv8n ONNX model for local inference")

// Create models directory if it doesn't exist
const modelsDir = path.join(process.cwd(), "public", "models")
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true })
  console.log("[v0] Created models directory:", modelsDir)
}

// Model download configuration
const models = [
  {
    name: "YOLOv8n (Nano)",
    filename: "yolov8n.onnx",
    url: "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx",
    size: "6.2 MB",
    description: "Fastest, smallest model - good for real-time applications",
  },
  {
    name: "YOLOv8s (Small)",
    filename: "yolov8s.onnx",
    url: "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8s.onnx",
    size: "21.5 MB",
    description: "Balanced speed and accuracy",
  },
  {
    name: "YOLOv8m (Medium)",
    filename: "yolov8m.onnx",
    url: "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8m.onnx",
    size: "49.7 MB",
    description: "Higher accuracy, slower inference",
  },
]

// Download function
function downloadModel(model) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(modelsDir, model.filename)

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`[v0] ${model.name} already exists, skipping download`)
      resolve()
      return
    }

    console.log(`[v0] Downloading ${model.name} (${model.size})...`)
    console.log(`[v0] URL: ${model.url}`)

    const file = fs.createWriteStream(filePath)
    let downloadedBytes = 0

    const request = https.get(model.url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: HTTP ${response.statusCode}`))
        return
      }

      const totalBytes = Number.parseInt(response.headers["content-length"], 10)

      response.on("data", (chunk) => {
        downloadedBytes += chunk.length
        const progress = ((downloadedBytes / totalBytes) * 100).toFixed(1)
        process.stdout.write(`\r[v0] Progress: ${progress}% (${(downloadedBytes / 1024 / 1024).toFixed(1)} MB)`)
      })

      response.pipe(file)

      file.on("finish", () => {
        file.close()
        console.log(`\n[v0] ${model.name} downloaded successfully!`)
        console.log(`[v0] Saved to: ${filePath}`)
        resolve()
      })
    })

    request.on("error", (error) => {
      fs.unlink(filePath, () => {}) // Delete partial file
      reject(error)
    })

    file.on("error", (error) => {
      fs.unlink(filePath, () => {}) // Delete partial file
      reject(error)
    })
  })
}

// Main download process
async function downloadModels() {
  console.log("[v0] Starting model downloads...\n")

  try {
    // Download YOLOv8n by default (recommended for most users)
    await downloadModel(models[0])

    console.log("\n[v0] ✅ YOLOv8n model download completed!")
    console.log("[v0] Your system is now ready for local YOLO inference.")
    console.log("\n[v0] Model Information:")
    console.log(`[v0] - Location: ${path.join(modelsDir, models[0].filename)}`)
    console.log(`[v0] - Size: ${models[0].size}`)
    console.log(`[v0] - Description: ${models[0].description}`)

    console.log("\n[v0] To use other models, modify the modelPath in your YOLOv8Processor config:")
    models.forEach((model, index) => {
      if (index > 0) {
        console.log(`[v0] - ${model.name}: '/models/${model.filename}' (${model.size})`)
      }
    })

    console.log("\n[v0] Next steps:")
    console.log("[v0] 1. Open the YOLO test page: /yolo-test-page.html")
    console.log("[v0] 2. Run the full system test to verify everything works")
    console.log("[v0] 3. Check that local model loading is successful")
  } catch (error) {
    console.error("\n[v0] ❌ Download failed:", error.message)
    console.log("\n[v0] Troubleshooting:")
    console.log("[v0] 1. Check your internet connection")
    console.log("[v0] 2. Ensure you have write permissions to the models directory")
    console.log("[v0] 3. Try downloading manually from the URLs above")
    console.log("[v0] 4. The system will fall back to simulation mode if models are not available")
  }
}

// Run the download
downloadModels()
