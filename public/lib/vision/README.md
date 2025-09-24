# Vision Processing System - YOLOv8 Ready

This modular vision processing system provides a clean, extensible architecture for integrating computer vision capabilities into the exam monitoring system.

## Architecture Overview

### Core Components

1. **CameraManager** (`camera-manager.js`)
   - Handles camera initialization and stream management
   - Provides frame extraction and processing coordination
   - Manages multiple processors with different intervals
   - Optimized for computer vision workloads

2. **FaceDetector** (`face-detector.js`)
   - Enhanced face detection with spatial analysis
   - Multiple people detection
   - Trend analysis and quality metrics
   - Compatible with CameraManager processor interface

3. **YOLOv8Processor** (`yolov8-integration.js`)
   - Ready for YOLOv8 model integration
   - Supports both local models and API endpoints
   - Violation detection for exam monitoring
   - Configurable object classes and confidence thresholds

4. **VisionCoordinator** (`vision-coordinator.js`)
   - Orchestrates multiple vision processors
   - Manages callbacks and result handling
   - Performance monitoring and statistics
   - Priority-based processing

## YOLOv8 Integration Guide

### Option 1: Local Model Integration

\`\`\`javascript
// Initialize with local model
const yolov8 = new YOLOv8Processor({
  modelUrl: '/models/yolov8n.onnx', // Your model path
  confidence: 0.6,
  classes: ['person', 'cell phone', 'laptop', 'book']
})

await yolov8.initialize()
\`\`\`

### Option 2: API Endpoint Integration

\`\`\`javascript
// Initialize with API endpoint
const yolov8 = new YOLOv8Processor({
  apiEndpoint: 'https://your-yolov8-api.com',
  confidence: 0.6,
  classes: ['person', 'cell phone', 'laptop', 'book']
})

await yolov8.initialize()
\`\`\`

### Option 3: Custom Implementation

\`\`\`javascript
// Extend YOLOv8Processor for custom implementations
class CustomYOLOv8 extends YOLOv8Processor {
  async detectViaLocalModel(frameData) {
    // Your custom YOLOv8 implementation
    const predictions = await yourYOLOv8Model.predict(frameData.canvas)
    return this.normalizeDetections(predictions)
  }
}
\`\`\`

## Usage Examples

### Basic Setup

\`\`\`javascript
// Initialize camera
const cameraManager = new CameraManager()
await cameraManager.initialize()

// Initialize vision coordinator
const visionCoordinator = new VisionCoordinator()
await visionCoordinator.initialize(cameraManager)

// Set up callbacks
visionCoordinator.onResult('faceDetection', (result) => {
  console.log('Face detection result:', result)
})

visionCoordinator.onResult('objectDetection', (result) => {
  console.log('YOLOv8 result:', result)
})
\`\`\`

### Custom Processor

\`\`\`javascript
// Add custom processor
const customProcessor = (frameData, metadata) => {
  // Your custom processing logic
  return {
    customData: 'processed',
    timestamp: metadata.timestamp
  }
}

visionCoordinator.addProcessor('custom', customProcessor, {
  interval: 1000, // 1 second
  priority: 'low'
})
\`\`\`

## Configuration

### Camera Settings

\`\`\`javascript
const cameraConfig = {
  width: 640,        // Frame width
  height: 480,       // Frame height
  frameRate: 15      // Target frame rate
}
\`\`\`

### Processor Settings

\`\`\`javascript
const processorConfig = {
  interval: 200,     // Processing interval (ms)
  priority: 'high',  // Priority level
  enabled: true      // Enable/disable
}
\`\`\`

## Performance Considerations

- **Frame Rate**: Default 15fps balances quality and performance
- **Resolution**: 640x480 optimal for most vision tasks
- **Processing Intervals**: 
  - Face Detection: 200ms (5fps)
  - YOLOv8: 1000ms (1fps) - adjust based on model complexity
- **Memory Management**: Automatic cleanup and resource management

## Violation Detection

The system automatically detects exam violations:

- **Prohibited Objects**: Cell phones, laptops, books, papers
- **Multiple People**: More than one person in frame
- **No Person**: Student left the camera view
- **Suspicious Activity**: Based on movement and lighting analysis

## Error Handling

- Graceful degradation when processors fail
- Automatic retry mechanisms for stream loss
- Comprehensive error reporting and logging
- Fallback modes for critical functionality

## Extending the System

### Adding New Processors

1. Create processor class with `detect(frameData, metadata)` method
2. Register with VisionCoordinator
3. Set up result callbacks
4. Configure processing intervals

### Custom Violation Rules

\`\`\`javascript
// Override violation analysis
class CustomYOLOv8 extends YOLOv8Processor {
  analyzeViolations(detections) {
    const violations = super.analyzeViolations(detections)
    
    // Add custom violation logic
    // ...
    
    return violations
  }
}
\`\`\`

This architecture ensures that YOLOv8 integration will be seamless and won't interfere with existing camera functionality.
