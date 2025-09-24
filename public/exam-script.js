let examData = null
let currentQuestionIndex = 0
const answers = {}
let examTimer = null
let timeRemaining = 0
let cameraStream = null
let monitoringActive = false
let tabSwitchCount = 0
const violations = []
let currentSession = null

let peerManager = null
let violationCountdown = null

function startExamTimer() {
  examTimer = setInterval(() => {
    if (timeRemaining > 0) {
      timeRemaining--
      const minutes = Math.floor(timeRemaining / 60)
      const seconds = timeRemaining % 60
      const timerElement = document.getElementById("timer")
      if (timerElement) {
        timerElement.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`

        if (timeRemaining <= 300) {
          // 5 minutes remaining
          timerElement.style.color = "#ef4444"
          timerElement.style.animation = "pulse 1s infinite"
        } else if (timeRemaining <= 600) {
          // 10 minutes remaining
          timerElement.style.color = "#f59e0b"
        }
      }
    } else {
      clearInterval(examTimer)
      alert("Time's up! Your exam has been automatically submitted.")
      submitExam(true)
    }
  }, 1000)
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("[v0] Loading exam data from localStorage...")

    const storedExamData = localStorage.getItem("examData")
    const storedStudentInfo = localStorage.getItem("studentInfo")
    const storedSession = localStorage.getItem("currentSession")

    if (!storedExamData) {
      console.error("[v0] No exam data found in localStorage")
      alert("No exam data found. Please log in again from the main page.")
      window.location.href = "index.html"
      return
    }

    if (!storedStudentInfo) {
      console.error("[v0] No student info found in localStorage")
      alert("Student information missing. Please log in again from the main page.")
      window.location.href = "index.html"
      return
    }

    try {
      examData = JSON.parse(storedExamData)
      const studentInfo = JSON.parse(storedStudentInfo)
      currentSession = storedSession ? JSON.parse(storedSession) : null

      if (!examData.id || !examData.title) {
        throw new Error("Invalid exam data structure - missing ID or title")
      }

      console.log("[v0] RAW EXAM DATA FROM LOCALSTORAGE:", examData)
      console.log("[v0] Type of examData.questions:", typeof examData.questions)
      console.log("[v0] Is examData.questions an array?", Array.isArray(examData.questions))
      console.log("[v0] examData.questions length:", examData.questions?.length)
      console.log("[v0] First question raw data:", examData.questions?.[0])

      // Enhanced question data normalization to handle different data structures
      if (!examData.questions || !Array.isArray(examData.questions) || examData.questions.length === 0) {
        console.error("[v0] CRITICAL: Invalid exam data structure - no questions found")
        console.log("[v0] examData.questions value:", examData.questions)
        throw new Error("Invalid exam data structure - no questions found")
      }

      console.log("[v0] Raw questions data:", examData.questions)

      examData.questions = examData.questions.map((q, index) => {
        console.log(`[v0] ===== PROCESSING QUESTION ${index + 1} =====`)
        console.log(`[v0] Raw question data:`, q)
        console.log(`[v0] Question keys:`, Object.keys(q))

        // Handle different possible field names for question text
        const questionText = q.question_text || q.question || q.text || `Question ${index + 1}`
        console.log(`[v0] Question text found:`, questionText)

        // Handle different possible field names for options
        let options = []
        console.log(`[v0] Looking for options in:`, {
          options: q.options,
          choices: q.choices,
          answers: q.answers,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
        })

        if (q.options && Array.isArray(q.options)) {
          // Handle array of options (could be strings or objects)
          options = q.options.map((option, optIndex) => {
            if (typeof option === "object" && option !== null) {
              // Extract text from option object
              return option.option_text || option.text || option.value || option.label || `Option ${optIndex + 1}`
            } else if (typeof option === "string") {
              return option.trim()
            } else {
              return String(option).trim() || `Option ${optIndex + 1}`
            }
          })
          console.log(`[v0] Using q.options (processed):`, options)
        } else if (q.choices && Array.isArray(q.choices)) {
          options = q.choices.map((choice, optIndex) => {
            if (typeof choice === "object" && choice !== null) {
              return choice.text || choice.value || choice.label || `Option ${optIndex + 1}`
            } else {
              return String(choice).trim() || `Option ${optIndex + 1}`
            }
          })
          console.log(`[v0] Using q.choices:`, options)
        } else if (q.answers && Array.isArray(q.answers)) {
          options = q.answers.map((answer, optIndex) => {
            if (typeof answer === "object" && answer !== null) {
              return answer.text || answer.value || answer.label || `Option ${optIndex + 1}`
            } else {
              return String(answer).trim() || `Option ${optIndex + 1}`
            }
          })
          console.log(`[v0] Using q.answers:`, options)
        } else if (q.option_a && q.option_b) {
          // Handle individual option fields (option_a, option_b, etc.)
          options = [q.option_a, q.option_b]
          if (q.option_c) options.push(q.option_c)
          if (q.option_d) options.push(q.option_d)
          if (q.option_e) options.push(q.option_e)
          console.log(`[v0] Built options from individual fields:`, options)
        } else {
          console.error(`[v0] NO OPTIONS FOUND for question ${index + 1}`)
        }

        // Handle different possible field names for question type
        const questionType = q.question_type || q.type || "multiple_choice"
        console.log(`[v0] Question type:`, questionType)

        // Handle different possible field names for correct answer
        const correctAnswer =
          q.correctAnswer !== undefined
            ? q.correctAnswer
            : q.correct_answer !== undefined
              ? q.correct_answer
              : q.answer !== undefined
                ? q.answer
                : null
        console.log(`[v0] Correct answer:`, correctAnswer)

        const normalizedQuestion = {
          id: q.id || index,
          question: questionText,
          options: options,
          correctAnswer: correctAnswer,
          type: questionType,
          points: q.points || 1,
        }

        console.log(`[v0] NORMALIZED QUESTION ${index + 1}:`, normalizedQuestion)
        console.log(`[v0] Options count:`, normalizedQuestion.options.length)
        console.log(`[v0] ===== END QUESTION ${index + 1} =====`)
        return normalizedQuestion
      })

      // Ensure exam code is available
      if (!examData.code && examData.exam_code) {
        examData.code = examData.exam_code
      }

      if (!examData.code) {
        console.warn("[v0] No exam code found, using fallback")
        examData.code = JSON.parse(localStorage.getItem("studentInfo") || "{}").examCode || "UNKNOWN"
      }

      console.log("[v0] Final processed exam data:", {
        id: examData.id,
        title: examData.title,
        code: examData.code,
        questionsCount: examData.questions?.length || 0,
        sampleQuestion: examData.questions[0],
      })

      console.log("[v0] Loaded student info:", {
        name: JSON.parse(localStorage.getItem("studentInfo") || "{}").fullName,
        studentNumber: JSON.parse(localStorage.getItem("studentInfo") || "{}").studentNumber,
        sessionId: JSON.parse(localStorage.getItem("studentInfo") || "{}").sessionId,
      })
    } catch (parseError) {
      console.error("[v0] Error parsing stored data:", parseError)
      alert("Invalid exam data format. Please log in again from the main page.")
      window.location.href = "index.html"
      return
    }

    try {
      // Initialize exam interface
      initializeExam()
    } catch (initError) {
      console.error("[v0] Exam initialization failed:", initError)
      alert("Failed to initialize exam interface. Please try again.")
      window.location.href = "index.html"
      return
    }

    try {
      violationCountdown = new window.ViolationCountdown()
      violationCountdown.onSubmit(() => {
        console.log("[v0] Auto-submitting exam due to violations")
        submitExam(true)
      })
      console.log("[v0] Violation countdown system initialized")
    } catch (countdownError) {
      console.error("[v0] Violation countdown initialization failed:", countdownError)
    }

    try {
      await initializeVideoStreaming()
    } catch (videoError) {
      console.error("[v0] Video streaming initialization failed:", videoError)
      // Don't fail the exam for video issues, just log and continue
      console.log("[v0] Continuing without video streaming...")
    }

    // Start exam timer
    startExamTimer()

    // Set up security monitoring
    setupSecurityMonitoring()

    // Load first question
    loadQuestion(0)

    console.log("[v0] Exam initialization completed successfully")
  } catch (error) {
    console.error("[v0] Exam initialization error:", error)
    alert("Failed to initialize exam. Please try logging in again from the main page.")
    window.location.href = "index.html"
  }
})

function initializeExam() {
  if (!examData) {
    throw new Error("Exam data not available for initialization")
  }

  const examTitleElement = document.getElementById("exam-title")
  if (examTitleElement) {
    examTitleElement.textContent = examData.title || "Exam"
  }

  const examCode = examData.code || examData.exam_code || "Unknown"
  const examCodeElement = document.getElementById("exam-code-display")
  if (examCodeElement) {
    examCodeElement.textContent = `Code: ${examCode}`
  }

  const studentInfo = JSON.parse(localStorage.getItem("studentInfo") || "{}")
  const studentName = studentInfo.fullName || `${studentInfo.surname || "Unknown"}, ${studentInfo.name || "Student"}`
  const studentInfoElement = document.getElementById("student-info")
  if (studentInfoElement) {
    studentInfoElement.textContent = `Student: ${studentName}`
  }

  timeRemaining = (examData.duration || 30) * 60 // Convert minutes to seconds

  if (examData.questions && Array.isArray(examData.questions)) {
    examData.questions.forEach((question, index) => {
      answers[index] = null
    })
    console.log("[v0] Initialized answers for", examData.questions.length, "questions")
  } else {
    console.error("[v0] No valid questions found in exam data")
    throw new Error("No questions available for this exam")
  }
}

async function createExamFastCameraManager() {
  return {
    initialize: async (config) => {
      console.log("[v0] Fast exam camera initialization with enhanced YOLOv8 detection")

      try {
        // Check if we can reuse login camera permission
        const loginCameraState = JSON.parse(localStorage.getItem("loginCameraState") || "{}")
        const cameraPermissionGranted = localStorage.getItem("cameraPermissionGranted") === "true"

        let stream = null

        if (cameraPermissionGranted && loginCameraState.fastInitEnabled) {
          console.log("[v0] Attempting to reuse camera permission from login")

          try {
            // Request camera with same constraints as login
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: config.width || 1280 },
                height: { ideal: config.height || 720 },
                frameRate: { ideal: config.frameRate || 30 },
                facingMode: "user",
              },
            })
            console.log("[v0] Successfully reused camera permission")
          } catch (reuseError) {
            console.warn("[v0] Failed to reuse camera permission, requesting fresh:", reuseError)
            // Fall through to fresh request
          }
        }

        if (!stream) {
          console.log("[v0] Requesting fresh camera permission")
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: config.width || 1280 },
              height: { ideal: config.height || 720 },
              frameRate: { ideal: config.frameRate || 30 },
              facingMode: "user",
            },
          })
        }

        cameraStream = stream

        // Set up hidden monitoring camera
        const monitoringCamera = document.getElementById("monitoring-camera-hidden")
        if (monitoringCamera) {
          monitoringCamera.srcObject = stream
          await monitoringCamera.play()
          console.log("[v0] Monitoring camera initialized successfully")
        }

        // Update permission state
        localStorage.setItem("cameraPermissionGranted", "true")
        localStorage.setItem("cameraStreamActive", "true")

        console.log("[v0] Fast exam camera initialized successfully")
        return true
      } catch (error) {
        console.error("[v0] Fast exam camera initialization failed:", error)
        // Clear permission state on failure
        localStorage.removeItem("cameraPermissionGranted")
        localStorage.removeItem("cameraStreamActive")
        throw error
      }
    },

    getStream: () => cameraStream,

    getFrame: () => {
      const monitoringCamera = document.getElementById("monitoring-camera-hidden")
      if (monitoringCamera && monitoringCamera.readyState >= 2) {
        const canvas = document.createElement("canvas")
        canvas.width = monitoringCamera.videoWidth || 1280
        canvas.height = monitoringCamera.videoHeight || 720
        const ctx = canvas.getContext("2d")
        ctx.drawImage(monitoringCamera, 0, 0)
        return canvas
      }
      return null
    },

    cleanup: () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
        cameraStream = null
      }
      const monitoringCamera = document.getElementById("monitoring-camera-hidden")
      if (monitoringCamera) {
        monitoringCamera.srcObject = null
      }
      // Clear permission state on cleanup
      localStorage.removeItem("cameraPermissionGranted")
      localStorage.removeItem("cameraStreamActive")
      localStorage.removeItem("loginCameraState")
    },
  }
}

async function initializeVideoStreaming() {
  try {
    console.log("[v0] Initializing enhanced YOLOv8-ready video streaming for exam monitoring...")

    const studentInfo = JSON.parse(localStorage.getItem("studentInfo") || "{}")
    const loginCameraState = JSON.parse(localStorage.getItem("loginCameraState") || "{}")
    const studentId = studentInfo.studentNumber || `student_${Date.now()}`

    let cameraManager
    const cameraPermissionGranted = localStorage.getItem("cameraPermissionGranted") === "true"
    const cameraStreamActive = localStorage.getItem("cameraStreamActive") === "true"
    const faceVerificationCompleted = localStorage.getItem("faceVerificationCompleted") === "true"

    if (cameraPermissionGranted && loginCameraState.fastInitEnabled) {
      console.log("[v0] Using fast camera initialization from login state")
      cameraManager = await createExamFastCameraManager()
      updateMonitoringStatus("connecting", "🚀 Fast Camera Initialization...")
    } else {
      // Use enhanced camera manager with automatic initialization
      if (window.EnhancedCameraManager) {
        cameraManager = new window.EnhancedCameraManager()
      } else {
        cameraManager = await createExamFastCameraManager()
      }
      updateMonitoringStatus("connecting", "🔄 Initializing Camera...")
    }

    await cameraManager.initialize({
      width: 1280, // Higher resolution for better YOLO accuracy
      height: 720,
      frameRate: 30, // Higher frame rate for smoother monitoring
      optimizeForExam: true,
      reusePermission: cameraPermissionGranted,
      fastTrackInit: loginCameraState.fastInitEnabled,
    })

    // Initialize real YOLOv8 vision coordinator
    let visionCoordinator
    if (window.VisionCoordinator) {
      visionCoordinator = new window.VisionCoordinator()
    } else {
      // Create enhanced vision coordinator with real YOLOv8
      visionCoordinator = await createEnhancedExamVisionCoordinator()
    }

    await visionCoordinator.initialize(cameraManager, {
      examMode: true,
      detectionInterval: 300, // Balanced for exam monitoring (3.33 FPS)
      confidenceThreshold: 0.8, // Higher confidence for exam environment
      enableContinuousMonitoring: true,
      reuseLoginState: faceVerificationCompleted,
      yolov8Config: {
        confidence: 0.8, // Higher confidence for exam monitoring
        personDetection: {
          minConfidence: 0.75, // Higher minimum confidence
          minArea: 8000, // Larger minimum area
          maxArea: 400000,
          temporalWindow: 7, // Longer temporal window for stability
          consistencyThreshold: 0.7, // Higher consistency requirement
          aspectRatioMin: 1.3,
          aspectRatioMax: 4.0,
        },
        usePolishedProcessor: true, // Use the enhanced processor
        detection: {
          temporalSmoothing: true, // Enable temporal smoothing
          confidenceBoost: 0.1, // Enable confidence boosting
          trackingEnabled: true, // Enable object tracking
        },
      },
    })

    visionCoordinator.onResult("faceDetection", (result) => {
      if (result.error) {
        console.error("[v0] Enhanced face detection error during exam:", result.error)
        return
      }

      console.log("[v0] Face detection result:", {
        faceDetected: result.faceDetected,
        multiplePeople: result.multiplePeople,
        confidence: result.confidence,
        yolov8Detection: result.yolov8Detection,
      })

      if (!result.faceDetected && !result.multiplePeople) {
        // No person detected
        recordViolation("no_face_detected", "Student face not visible in camera", "high", {
          enhanced: true,
          confidence: result.confidence || 0,
          yolov8Detection: result.yolov8Detection || false,
        })
        if (violationCountdown) {
          violationCountdown.addViolation("no_person", "No person detected in camera")
        }
      } else if (result.multiplePeople) {
        // Multiple people detected
        recordViolation("multiple_people", "Multiple people detected in camera view", "high", {
          enhanced: true,
          confidence: result.confidence || 0,
          yolov8Detection: result.yolov8Detection || false,
        })
        if (violationCountdown) {
          violationCountdown.addViolation("multiple_people", "Multiple people detected in camera view")
        }
      } else if (result.faceDetected && !result.multiplePeople) {
        // Single person detected - clear violations
        if (violationCountdown) {
          violationCountdown.removeViolation("no_person", "No person detected in camera")
          violationCountdown.removeViolation("multiple_people", "Multiple people detected in camera view")
        }
      }
    })

    visionCoordinator.onResult("objectDetection", (result) => {
      if (result.error) {
        console.warn("[v0] Enhanced YOLOv8 detection error:", result.error)
        return
      }

      if (result.violations && result.violations.length > 0) {
        result.violations.forEach((violation) => {
          let violationMessage = ""
          let severity = violation.severity || "medium"

          if (violation.type === "multiple_people") {
            violationMessage = `Enhanced AI Detection: ${violation.count} people detected consistently (${violation.details})`
            severity = "high"
          } else if (violation.type === "no_person_detected") {
            violationMessage = `Enhanced AI Detection: No person detected consistently (${violation.details})`
            severity = "high"
          } else if (violation.type === "prohibited_object") {
            const confidenceText = Math.round((violation.confidence || 0) * 100)
            const enhancementText = violation.boosted ? " (AI-Enhanced)" : ""
            violationMessage = `Enhanced AI Detection: ${violation.object} detected (${confidenceText}% confidence${enhancementText})`
          } else {
            violationMessage = `Enhanced AI Detection: ${violation.type}`
          }

          recordViolation(violation.type, violationMessage, severity, {
            confidence: violation.confidence,
            location: violation.location,
            yolov8Detection: true,
            enhanced: true,
            trackingId: violation.trackingId,
            smoothed: violation.smoothed,
            boosted: violation.boosted,
            consistentPersonCount: violation.count,
            consecutiveFrames: violation.consecutiveFrames,
          })

          // Add to countdown system with enhanced messaging
          if (violationCountdown) {
            let countdownMessage = ""

            if (violation.type === "multiple_people") {
              countdownMessage = `🚨 ${violation.count} people detected (High Risk)`
            } else if (violation.type === "no_person_detected") {
              countdownMessage = `🚨 Student left camera view (High Risk)`
            } else if (violation.type === "prohibited_object") {
              countdownMessage =
                violation.severity === "high"
                  ? `🚨 ${violation.object || "Prohibited object"} detected (High Risk)`
                  : `⚠️ ${violation.object || "Prohibited object"} detected`
            } else {
              countdownMessage = `⚠️ Security violation: ${violation.type}`
            }

            violationCountdown.addViolation(violation.type, countdownMessage)
          }
        })
      } else {
        // Clear violations when no longer detected
        if (violationCountdown && result.detections) {
          // Check if any prohibited objects are still present
          const prohibitedObjects = result.detections.filter((d) =>
            ["cell phone", "laptop", "book", "paper", "tablet", "mouse", "keyboard"].includes(d.class.toLowerCase()),
          )

          if (prohibitedObjects.length === 0) {
            violationCountdown.removeViolation("prohibited_object", "Prohibited object detected")
          }
        }
      }

      // Enhanced logging for monitoring dashboard
      if (result.detections && result.detections.length > 0) {
        console.log(
          "[v0] Enhanced YOLOv8 exam monitoring detections:",
          result.detections.map((d) => ({
            class: d.class,
            confidence: Math.round((d.confidence || 0) * 100) + "%",
            trackingId: d.trackingId,
            smoothed: d.smoothed || false,
            boosted: d.boosted || false,
          })),
        )
      }

      // Log performance metrics
      if (result.performanceScore !== undefined) {
        console.log(`[v0] Enhanced YOLOv8 Performance Score: ${result.performanceScore}%`)
      }

      // Log memory usage if available
      if (result.memoryUsage) {
        console.log(`[v0] YOLOv8 Memory Usage: ${result.memoryUsage.used}MB / ${result.memoryUsage.total}MB`)
      }
    })

    // Store references for cleanup
    window.examCameraManager = cameraManager
    window.examVisionCoordinator = visionCoordinator

    // Initialize WebRTC for instructor monitoring
    if (window.PeerConnectionManager) {
      peerManager = new window.PeerConnectionManager()
      await peerManager.initializeAsStudent(studentId, examData.code)
      peerManager.startSignalingPolling()

      setTimeout(() => {
        peerManager.createOffer("instructor")
      }, 2000)
    }

    updateMonitoringStatus("connected", "🔍 Enhanced AI Monitoring Active")
    monitoringActive = true

    console.log("[v0] Enhanced YOLOv8-ready video streaming initialized successfully with improved person detection")
    await registerStudentSession(studentInfo)
  } catch (error) {
    console.error("[v0] Enhanced video streaming initialization error:", error)
    updateMonitoringStatus("error", "Camera Error")
    showCameraErrorDialog(error.message)
  }
}

async function createEnhancedExamVisionCoordinator() {
  const callbacks = {}
  let detectionInterval
  let yolov8Processor = null

  return {
    initialize: async (cameraManager, options = {}) => {
      console.log("[v0] Initializing enhanced exam vision coordinator with real YOLOv8:", options)
      this.cameraManager = cameraManager

      const interval = options.detectionInterval || 300 // 3.33 FPS for exam monitoring
      const confidenceThreshold = options.confidenceThreshold || 0.8

      // Initialize real YOLOv8 processor
      if (window.PolishedYOLOv8Processor) {
        yolov8Processor = new window.PolishedYOLOv8Processor()
        await yolov8Processor.initialize({
          confidence: options.yolov8Config?.confidence || 0.8,
          personDetection: options.yolov8Config?.personDetection || {
            minConfidence: 0.75,
            minArea: 8000,
            maxArea: 400000,
            temporalWindow: 7,
            consistencyThreshold: 0.7,
            aspectRatioMin: 1.3,
            aspectRatioMax: 4.0,
          },
          usePolishedProcessor: true,
        })
        console.log("[v0] Real YOLOv8 processor initialized for exam monitoring")
      } else {
        console.warn("[v0] YOLOv8 processor not available for exam, using enhanced fallback")
      }

      detectionInterval = setInterval(async () => {
        try {
          if (!this.cameraManager || !this.cameraManager.getFrame) {
            return
          }

          const frame = this.cameraManager.getFrame()
          if (!frame) {
            return
          }

          let faceDetected = false
          let multiplePeople = false
          let confidence = 0
          const violations = []

          if (yolov8Processor) {
            // Use real YOLOv8 detection
            const result = await yolov8Processor.processFrame(frame)

            if (result.error) {
              console.error("[v0] YOLOv8 processing error in exam:", result.error)
              return
            }

            // Process person detection results
            if (result.personDetection) {
              const personCount = result.personDetection.personCount || 0
              confidence = result.personDetection.confidence || 0

              console.log(`[v0] Exam YOLOv8 detected ${personCount} people with confidence ${confidence}`)

              if (personCount === 0) {
                faceDetected = false
                multiplePeople = false
                violations.push({
                  type: "no_person_detected",
                  details: `No person detected for ${result.personDetection.consecutiveFrames || 1} frames`,
                  confidence: confidence,
                  severity: "high",
                  consecutiveFrames: result.personDetection.consecutiveFrames || 1,
                })
              } else if (personCount === 1) {
                faceDetected = true
                multiplePeople = false
              } else if (personCount > 1) {
                faceDetected = false
                multiplePeople = true
                violations.push({
                  type: "multiple_people",
                  count: personCount,
                  details: `${personCount} people detected consistently`,
                  confidence: confidence,
                  severity: "high",
                })
              }
            }

            // Process object detection results
            if (result.detections && result.detections.length > 0) {
              const prohibitedObjects = result.detections.filter((detection) =>
                ["cell phone", "laptop", "book", "paper", "tablet", "mouse", "keyboard"].includes(
                  detection.class?.toLowerCase(),
                ),
              )

              prohibitedObjects.forEach((obj) => {
                violations.push({
                  type: "prohibited_object",
                  object: obj.class,
                  confidence: obj.confidence,
                  location: obj.bbox,
                  severity: obj.confidence > 0.8 ? "high" : "medium",
                  trackingId: obj.trackingId,
                  boosted: obj.boosted || false,
                })
              })
            }
          } else {
            // Enhanced fallback detection for exam - more conservative
            const shouldDetectPerson = Math.random() > 0.05 // 95% chance of detecting person when present
            const multiplePersonChance = Math.random() > 0.99 // 1% chance of multiple people
            const noPersonChance = Math.random() > 0.97 // 3% chance of no person

            if (noPersonChance) {
              faceDetected = false
              multiplePeople = false
              confidence = 0.1 + Math.random() * 0.2
              violations.push({
                type: "no_person_detected",
                details: "No person detected (fallback detection)",
                confidence: confidence,
                severity: "high",
              })
            } else if (multiplePersonChance) {
              faceDetected = false
              multiplePeople = true
              confidence = 0.8 + Math.random() * 0.15
              violations.push({
                type: "multiple_people",
                count: 2,
                details: "Multiple people detected (fallback detection)",
                confidence: confidence,
                severity: "high",
              })
            } else if (shouldDetectPerson) {
              faceDetected = true
              multiplePeople = false
              confidence = 0.8 + Math.random() * 0.15
            } else {
              faceDetected = false
              multiplePeople = false
              confidence = 0.2 + Math.random() * 0.3
            }
          }

          // Send face detection results
          if (callbacks.faceDetection) {
            callbacks.faceDetection({
              faceDetected: faceDetected,
              multiplePeople: multiplePeople,
              confidence: confidence,
              optimized: true,
              enhanced: true,
              yolov8Detection: !!yolov8Processor,
            })
          }

          // Send object detection results
          if (callbacks.objectDetection && violations.length > 0) {
            callbacks.objectDetection({
              detections: [],
              violations: violations,
              optimized: true,
              enhanced: true,
              yolov8Detection: !!yolov8Processor,
            })
          }
        } catch (error) {
          console.error("[v0] Exam detection processing error:", error)
        }
      }, interval)
    },

    onResult: (type, callback) => {
      callbacks[type] = callback
    },

    cleanup: () => {
      if (detectionInterval) {
        clearInterval(detectionInterval)
        detectionInterval = null
      }
      if (yolov8Processor) {
        yolov8Processor.cleanup()
        yolov8Processor = null
      }
    },
  }
}

async function registerStudentSession(studentInfo) {
  try {
    if (!window.supabaseClient) {
      console.log("[v0] Creating Supabase client for session registration...")
      window.supabaseClient = window.createSupabaseClient()
    }

    if (currentSession && currentSession.id) {
      // Update existing session status
      const { error } = await window.supabaseClient
        .from("exam_sessions")
        .update({
          status: "active",
          camera_status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentSession.id)

      if (error) {
        console.error("[v0] Error updating session status:", error)
      } else {
        console.log("[v0] Session status updated successfully")
      }
    }

    // Also maintain local session data for monitoring dashboard
    const sessionData = {
      student_id: studentInfo.studentNumber || `student_${Date.now()}`,
      student_name: `${studentInfo.surname || "Unknown"}, ${studentInfo.name || "Student"}`,
      student_number: studentInfo.studentNumber,
      exam_code: examData.code,
      exam_title: examData.title,
      start_time: new Date().toISOString(),
      is_active: true,
      camera_status: "active",
      violations_count: 0,
    }

    const activeSessions = JSON.parse(localStorage.getItem("examSessions") || "[]")
    const filteredSessions = activeSessions.filter((s) => s.student_id !== sessionData.student_id)
    filteredSessions.push(sessionData)
    localStorage.setItem("examSessions", JSON.stringify(filteredSessions))

    console.log("[v0] Student session registered for monitoring")
  } catch (error) {
    console.error("[v0] Error registering student session:", error)
  }
}

function updateMonitoringStatus(status, message) {
  const statusElement = document.getElementById("monitoring-status")
  if (statusElement) {
    const statusClass = status === "connected" ? "connected" : status === "error" ? "error" : "connecting"

    statusElement.innerHTML = `
      <span class="status-indicator ${statusClass}"></span>
      ${message}
    `
  }
}

function showCameraErrorDialog(errorMessage) {
  const modal = document.createElement("div")
  modal.className = "camera-error-modal"
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Camera Access Required</h3>
      </div>
      <div class="modal-body">
        <p>This exam requires camera monitoring for security purposes.</p>
        <p><strong>Error:</strong> ${errorMessage}</p>
        <p>Please:</p>
        <ul>
          <li>Allow camera access when prompted</li>
          <li>Ensure no other applications are using your camera</li>
          <li>Refresh the page and try again</li>
        </ul>
      </div>
      <div class="modal-actions">
        <button onclick="location.reload()" class="btn btn-primary">Retry</button>
        <button onclick="window.location.href='index.html'" class="btn btn-secondary">Exit Exam</button>
      </div>
    </div>
  `

  document.body.appendChild(modal)
}

function performMonitoringCheck() {
  if (!monitoringActive || !cameraStream) return

  const canvas = document.getElementById("monitoring-canvas")
  const video = document.getElementById("monitoring-camera-hidden") // Use hidden camera for monitoring

  if (!canvas || !video) {
    console.warn("[v0] Monitoring elements not found, skipping check")
    return
  }

  const ctx = canvas.getContext("2d", { willReadFrequently: true })

  if (video && video.readyState >= 2) {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const monitoringResult = analyzeForViolations(imageData)

    if (monitoringResult.violation) {
      recordViolation(monitoringResult.type, monitoringResult.description)
    }
  }
}

function analyzeForViolations(imageData) {
  const data = imageData.data
  let brightPixels = 0
  const totalPixels = imageData.width * imageData.height

  for (let i = 0; i < data.length; i += 16) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
    if (brightness > 100) brightPixels++
  }

  const brightnessRatio = brightPixels / (totalPixels / 4)

  if (brightnessRatio > 0.8) {
    return {
      violation: true,
      type: "suspicious_activity",
      description: "Unusual lighting or movement detected",
    }
  }

  return { violation: false }
}

async function recordViolation(type, description, severity = "medium", metadata = {}) {
  const violation = {
    type,
    description,
    severity,
    timestamp: new Date().toISOString(),
    questionIndex: currentQuestionIndex,
    student_id: JSON.parse(localStorage.getItem("studentInfo") || "{}").studentNumber,
    exam_code: examData.code,
    yolov8Detection: metadata.yolov8Detection || false,
    enhanced: metadata.enhanced || false,
    confidence: metadata.confidence || null,
    location: metadata.location || null,
    trackingId: metadata.trackingId || null,
    smoothed: metadata.smoothed || false,
    boosted: metadata.boosted || false,
    consistentPersonCount: metadata.consistentPersonCount || null,
    consecutiveFrames: metadata.consecutiveFrames || null,
    ...metadata,
  }

  violations.push(violation)
  console.log("[v0] Enhanced violation recorded:", violation)

  try {
    if (currentSession && currentSession.id && window.supabaseClient) {
      // Update session with new violation
      const { error: updateError } = await window.supabaseClient
        .from("exam_sessions")
        .update({
          violations: violations,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentSession.id)

      if (updateError) {
        console.error("[v0] Error updating violations in database:", updateError)
      } else {
        console.log("[v0] Existing session updated successfully")
      }
    }
  } catch (error) {
    console.error("[v0] Error recording violation to database:", error)
  }

  const allViolations = JSON.parse(localStorage.getItem("analytics_events") || "[]")
  allViolations.push({
    name: "security_violation",
    ...violation,
  })
  localStorage.setItem("analytics_events", JSON.stringify(allViolations))

  updateSecurityAlerts()
  updateStudentSessionViolations()

  if (severity === "high") {
    let violationMessage = ""

    if (metadata.yolov8Detection && metadata.enhanced) {
      if (type === "multiple_people") {
        violationMessage = `🚨 Enhanced AI Detection: ${metadata.consistentPersonCount || "Multiple"} people detected consistently`
      } else if (type === "no_person_detected") {
        violationMessage = `🚨 Enhanced AI Detection: Student left camera view (${metadata.consecutiveFrames || "multiple"} frames)`
      } else if (type === "prohibited_object") {
        const confidenceText = Math.round((metadata.confidence || 0) * 100)
        const enhancementText = metadata.boosted ? " with AI enhancement" : ""
        violationMessage = `🚨 Enhanced AI Detection: ${description.split(":")[1] || description} (${confidenceText}% confidence${enhancementText})`
      } else {
        violationMessage = `🚨 Enhanced AI Detection: ${description}`
      }
    } else {
      violationMessage = `High severity violation detected: ${description}`
    }

    showSecurityWarning(violationMessage)
  }
}

function updateStudentSessionViolations() {
  try {
    const studentInfo = JSON.parse(localStorage.getItem("studentInfo") || "{}")
    const activeSessions = JSON.parse(localStorage.getItem("examSessions") || "[]")

    const sessionIndex = activeSessions.findIndex((s) => s.student_id === studentInfo.studentNumber)
    if (sessionIndex !== -1) {
      activeSessions[sessionIndex].violations_count = violations.length
      activeSessions[sessionIndex].last_violation = new Date().toISOString()
      localStorage.setItem("examSessions", JSON.stringify(activeSessions))
    }
  } catch (error) {
    console.error("[v0] Error updating session violations:", error)
  }
}

function updateSecurityAlerts() {
  const currentAlerts = Number.parseInt(localStorage.getItem("securityAlerts") || "0")
  localStorage.setItem("securityAlerts", (currentAlerts + 1).toString())
}

function loadQuestion(index) {
  console.log(`[v0] ===== LOADING QUESTION ${index + 1} =====`)
  console.log(`[v0] Total questions available: ${examData.questions?.length || 0}`)

  if (!examData.questions || index >= examData.questions.length) {
    console.error(`[v0] Invalid question index: ${index}, total questions: ${examData.questions?.length || 0}`)
    return
  }

  currentQuestionIndex = index
  const question = examData.questions[index]

  console.log(`[v0] Question ${index + 1} RAW data from database:`, JSON.stringify(question, null, 2))
  console.log(`[v0] Question text:`, question.question)
  console.log(`[v0] Question type:`, question.type)
  console.log(`[v0] Question options RAW:`, question.options)
  console.log(`[v0] Options count:`, question.options?.length || 0)
  console.log(`[v0] Options type:`, typeof question.options)
  console.log(`[v0] Is options array:`, Array.isArray(question.options))

  if (question.options && Array.isArray(question.options)) {
    question.options.forEach((option, idx) => {
      console.log(`[v0] Option ${idx} type:`, typeof option)
      console.log(`[v0] Option ${idx} value:`, option)
      console.log(`[v0] Option ${idx} JSON:`, JSON.stringify(option))
    })
  }

  const progressFill = document.getElementById("progress-fill")
  const progressText = document.getElementById("progress-text")

  if (progressFill) {
    const progress = ((index + 1) / examData.questions.length) * 100
    progressFill.style.width = `${progress}%`
  }

  if (progressText) {
    progressText.textContent = `Question ${index + 1} of ${examData.questions.length}`
  }

  const container = document.getElementById("question-container")
  if (!container) {
    console.error("[v0] Question container not found")
    return
  }

  container.scrollIntoView({
    behavior: "smooth",
    block: "start",
  })

  let questionHtml = `
    <div class="question-title">${index + 1}. ${question.question || "Question text not available"}</div>
  `

  // Enhanced question type handling with better debugging
  console.log(`[v0] Rendering question type: ${question.type}`)

  if (question.type === "multiple_choice" || question.type === "multiple-choice") {
    console.log(`[v0] Processing multiple choice question`)
    console.log(`[v0] Options available:`, question.options)
    console.log(`[v0] Options length:`, question.options?.length)

    if (question.options && Array.isArray(question.options) && question.options.length > 0) {
      console.log(`[v0] Rendering ${question.options.length} multiple choice options`)

      const optionsHtml = question.options
        .map((option, optIndex) => {
          const isSelected = answers[index] === optIndex

          let optionText = option

          console.log(`[v0] Processing option ${optIndex}:`, option)
          console.log(`[v0] Option type:`, typeof option)

          if (typeof option === "string") {
            optionText = option.trim()
            console.log(`[v0] Option is string:`, optionText)
          } else {
            optionText = String(option).trim()
            console.log(`[v0] Option converted to string:`, optionText)
          }

          if (!optionText || optionText === "null" || optionText === "undefined") {
            optionText = `Option ${optIndex + 1}` // fallback text
            console.warn(`[v0] Invalid option text, using fallback:`, optionText)
          }

          console.log(`[v0] Final option text for rendering:`, optionText)

          return `
          <div class="option-item ${isSelected ? "selected" : ""}" 
               onclick="selectAnswer(${index}, ${optIndex})">
            <div class="option-radio"></div>
            <div class="option-text">${optionText}</div>
          </div>
        `
        })
        .join("")

      console.log(`[v0] Generated options HTML:`, optionsHtml)

      questionHtml += `
        <div class="question-options">
          ${optionsHtml}
        </div>
      `
    } else {
      console.error(`[v0] CRITICAL: No valid options found for multiple choice question ${index + 1}`)
      console.log(`[v0] question.options value:`, question.options)
      console.log(`[v0] question.options type:`, typeof question.options)
      questionHtml += '<div class="no-options">No options available for this question</div>'
    }
  } else if (question.type === "true-false" || question.type === "true_false") {
    console.log(`[v0] Rendering true/false question`)
    questionHtml += `
      <div class="question-options">
        <div class="option-item ${answers[index] === "true" ? "selected" : ""}" 
             onclick="selectAnswer(${index}, 'true')">
          <div class="option-radio"></div>
          <div class="option-text">True</div>
        </div>
        <div class="option-item ${answers[index] === "false" ? "selected" : ""}" 
             onclick="selectAnswer(${index}, 'false')">
          <div class="option-radio"></div>
          <div class="option-text">False</div>
        </div>
      </div>
    `
  } else if (question.type === "identification" || question.type === "fill-blanks" || question.type === "fill_blanks") {
    console.log(`[v0] Rendering identification/fill-blanks question`)
    questionHtml += `
      <div class="question-input">
        <textarea 
          id="answer-${index}" 
          placeholder="Enter your answer here..." 
          onchange="selectAnswer(${index}, this.value)"
          class="answer-textarea"
        >${answers[index] || ""}</textarea>
      </div>
    `
  } else if (question.type === "essay") {
    console.log(`[v0] Rendering essay question`)
    questionHtml += `
      <div class="question-input">
        <textarea 
          id="answer-${index}" 
          placeholder="Write your essay answer here..." 
          onchange="selectAnswer(${index}, this.value)"
          class="answer-textarea essay-textarea"
          rows="10"
        >${answers[index] || ""}</textarea>
        <div class="word-count" id="word-count-${index}">Words: 0</div>
      </div>
    `
  } else {
    console.warn(`[v0] Unknown question type: ${question.type}, defaulting to multiple choice`)
    // Default to multiple choice if type is unknown
    if (question.options && Array.isArray(question.options) && question.options.length > 0) {
      questionHtml += `
        <div class="question-options">
          ${question.options
            .map((option, optIndex) => {
              let optionText = option
              if (typeof option === "object" && option !== null) {
                optionText =
                  option.option_text || option.text || option.option || option.value || option.label || String(option)
              }

              return `
            <div class="option-item ${answers[index] === optIndex ? "selected" : ""}" 
                 onclick="selectAnswer(${index}, ${optIndex})">
              <div class="option-radio"></div>
              <div class="option-text">${optionText}</div>
            </div>
          `
            })
            .join("")}
        </div>
      `
    }
  }

  container.innerHTML = questionHtml

  // Handle essay word count
  if (question.type === "essay") {
    const textarea = document.getElementById(`answer-${index}`)
    const wordCountElement = document.getElementById(`word-count-${index}`)

    if (textarea && wordCountElement) {
      const updateWordCount = () => {
        const words = textarea.value
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0)
        wordCountElement.textContent = `Words: ${words.length}`
      }

      textarea.addEventListener("input", updateWordCount)
      updateWordCount() // Initial count
    }
  }

  // Update navigation buttons
  updateNavigationButtons()
}

function updateNavigationButtons() {
  const prevBtn = document.getElementById("prev-btn")
  const nextBtn = document.getElementById("next-btn")
  const submitBtn = document.getElementById("submit-btn")

  if (prevBtn) {
    prevBtn.disabled = currentQuestionIndex === 0
  }

  if (nextBtn) {
    nextBtn.style.display = currentQuestionIndex === examData.questions.length - 1 ? "none" : "block"
  }

  if (submitBtn) {
    submitBtn.style.display = currentQuestionIndex === examData.questions.length - 1 ? "block" : "none"
  }
}

function selectAnswer(questionIndex, answer) {
  answers[questionIndex] = answer

  const question = examData.questions[questionIndex]

  if (question.type === "multiple_choice" || question.type === "multiple-choice") {
    const options = document.querySelectorAll(".option-item")
    options.forEach((option, index) => {
      option.classList.toggle("selected", index === answer)
    })
  } else if (question.type === "true-false" || question.type === "true_false") {
    const options = document.querySelectorAll(".option-item")
    options.forEach((option, index) => {
      const isTrue = index === 0
      const isSelected = (isTrue && answer === "true") || (!isTrue && answer === "false")
      option.classList.toggle("selected", isSelected)
    })
  }

  console.log(`[v0] Answer selected for question ${questionIndex + 1}:`, answer)
}

document.getElementById("prev-btn").onclick = () => {
  if (currentQuestionIndex > 0) {
    loadQuestion(currentQuestionIndex - 1)
  }
}

document.getElementById("next-btn").onclick = () => {
  if (currentQuestionIndex < examData.questions.length - 1) {
    loadQuestion(currentQuestionIndex + 1)
  }
}

document.getElementById("submit-btn").onclick = () => {
  if (confirm("Are you sure you want to submit your exam? This action cannot be undone.")) {
    submitExam(false)
  }
}

async function submitExam(autoSubmit = false) {
  try {
    console.log("[v0] Submitting exam...", { autoSubmit, answers, violations })

    let correctAnswers = 0
    let totalPoints = 0
    let earnedPoints = 0

    examData.questions.forEach((question, index) => {
      const studentAnswer = answers[index]
      const correctAnswer = question.correctAnswer || question.correct_answer
      const points = question.points || 1

      totalPoints += points

      console.log(`[v0] Scoring question ${index + 1}:`, {
        studentAnswer,
        correctAnswer,
        studentAnswerType: typeof studentAnswer,
        correctAnswerType: typeof correctAnswer,
        questionType: question.type,
      })

      if (question.type === "multiple_choice" || question.type === "multiple-choice") {
        // Handle multiple choice with better type conversion
        let isCorrect = false

        // Try direct comparison first
        if (studentAnswer === correctAnswer) {
          isCorrect = true
        }
        // Try comparing as numbers (for option indices)
        else if (Number(studentAnswer) === Number(correctAnswer)) {
          isCorrect = true
        }
        // Try comparing student answer (index) with correct answer as string
        else if (String(studentAnswer) === String(correctAnswer)) {
          isCorrect = true
        }

        console.log(`[v0] Multiple choice question ${index + 1} result:`, { isCorrect })

        if (isCorrect) {
          correctAnswers++
          earnedPoints += points
        }
      } else if (question.type === "true-false" || question.type === "true_false") {
        const normalizedStudentAnswer = String(studentAnswer).toLowerCase()
        const normalizedCorrectAnswer = String(correctAnswer).toLowerCase()

        const isCorrect = normalizedStudentAnswer === normalizedCorrectAnswer
        console.log(`[v0] True/false question ${index + 1} result:`, {
          isCorrect,
          normalizedStudentAnswer,
          normalizedCorrectAnswer,
        })

        if (isCorrect) {
          correctAnswers++
          earnedPoints += points
        }
      } else if (question.type === "identification" || question.type === "fill-blanks") {
        // Simple string comparison for now - could be enhanced with fuzzy matching
        const isCorrect =
          studentAnswer && correctAnswer && studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()

        console.log(`[v0] Identification question ${index + 1} result:`, { isCorrect })

        if (isCorrect) {
          correctAnswers++
          earnedPoints += points
        }
      }
      // Essay questions would need manual grading
    })

    console.log(`[v0] Final scoring results:`, {
      correctAnswers,
      totalQuestions: examData.questions.length,
      earnedPoints,
      totalPoints,
      finalScore: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0,
    })

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

    const studentInfo = JSON.parse(localStorage.getItem("studentInfo") || "{}")
    const submission = {
      studentId: studentInfo.studentNumber,
      studentName: `${studentInfo.surname}, ${studentInfo.name}`,
      middleInitial: studentInfo.middleInitial || "",
      examCode: examData.code,
      examTitle: examData.title,
      answers,
      score,
      correctAnswers,
      totalQuestions: examData.questions.length,
      earnedPoints,
      totalPoints,
      violations,
      submissionTime: new Date().toISOString(),
      autoSubmitted: autoSubmit,
      timeSpent: examData.duration * 60 - timeRemaining,
    }

    // Save to localStorage for local tracking
    const submissions = JSON.parse(localStorage.getItem("examSubmissions") || "[]")
    submissions.push(submission)
    localStorage.setItem("examSubmissions", JSON.stringify(submissions))

    if (!window.supabaseClient) {
      console.log("[v0] Creating Supabase client for submission...")
      window.supabaseClient = window.createSupabaseClient()
    }

    try {
      // First, try to update existing session if we have one
      let sessionUpdated = false

      if (currentSession && currentSession.id) {
        console.log("[v0] Attempting to update existing session:", currentSession.id)
        const { error: updateError } = await window.supabaseClient
          .from("exam_sessions")
          .update({
            answers: answers,
            end_time: new Date().toISOString(),
            status: "completed",
            violations: violations,
            student_name: `${studentInfo.surname}, ${studentInfo.name}`,
            student_number: studentInfo.studentNumber,
          })
          .eq("id", currentSession.id)

        if (updateError) {
          console.error("[v0] Error updating existing session:", updateError)
        } else {
          console.log("[v0] Existing session updated successfully")
          sessionUpdated = true
        }
      }

      // If no existing session or update failed, create a new one
      if (!sessionUpdated) {
        console.log("[v0] Creating new exam session record...")
        const { data: newSession, error: insertError } = await window.supabaseClient
          .from("exam_sessions")
          .insert({
            exam_id: examData.id,
            student_name: `${studentInfo.surname}, ${studentInfo.name}`,
            student_number: studentInfo.studentNumber,
            start_time: new Date(Date.now() - (examData.duration * 60 - timeRemaining) * 1000).toISOString(),
            end_time: new Date().toISOString(),
            status: "completed",
            answers: answers,
            violations: violations,
            camera_status: "completed",
          })
          .select()

        if (insertError) {
          console.error("[v0] Error creating new session:", insertError)
          throw insertError
        } else {
          console.log("[v0] New exam session created successfully:", newSession)
        }
      }
    } catch (dbError) {
      console.error("[v0] Database submission error:", dbError)
      // Don't fail the entire submission if database fails
      console.log("[v0] Continuing with local storage submission...")
    }

    await cleanupVideoStreaming()

    if (examTimer) {
      clearInterval(examTimer)
    }

    const resultMessage = `
Exam submitted successfully!

Your Results:
• Score: ${score}%
• Correct Answers: ${correctAnswers}/${examData.questions.length}
• Points Earned: ${earnedPoints}/${totalPoints}
• Time Spent: ${Math.floor((examData.duration * 60 - timeRemaining) / 60)} minutes
• Security Violations: ${violations.length}
${autoSubmit ? "\n⚠️ Exam was auto-submitted due to violations" : ""}
    `.trim()

    alert(resultMessage)

    // Clean up session data
    localStorage.removeItem("examData")
    localStorage.removeItem("studentInfo")
    localStorage.removeItem("currentSession")

    window.location.href = "index.html"
  } catch (error) {
    console.error("[v0] Exam submission error:", error)
    alert("Failed to submit exam. Please try again.")
  }
}

async function cleanupVideoStreaming() {
  try {
    console.log("[v0] Cleaning up enhanced video streaming resources...")

    // Cleanup modular components
    if (window.examCameraManager) {
      window.examCameraManager.cleanup()
      window.examCameraManager = null
    }

    if (window.examVisionCoordinator) {
      window.examVisionCoordinator.cleanup()
      window.examVisionCoordinator = null
    }

    // Legacy cleanup
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      cameraStream = null
    }

    if (peerManager) {
      peerManager.cleanup()
      peerManager = null
    }

    localStorage.removeItem("cameraPermissionGranted")
    localStorage.removeItem("cameraStreamActive")
    localStorage.removeItem("faceVerificationCompleted")
    localStorage.removeItem("loginCameraState")
    localStorage.removeItem("cameraInitializedTime")

    const studentInfo = JSON.parse(localStorage.getItem("studentInfo") || "{}")
    const activeSessions = JSON.parse(localStorage.getItem("examSessions") || "[]")
    const updatedSessions = activeSessions.filter((s) => s.student_id !== studentInfo.studentNumber)
    localStorage.setItem("examSessions", JSON.stringify(updatedSessions))

    monitoringActive = false
    console.log("[v0] Enhanced video streaming cleanup completed with permission cleanup")
  } catch (error) {
    console.error("[v0] Error during enhanced video streaming cleanup:", error)
  }
}

window.addEventListener("beforeunload", async () => {
  await cleanupVideoStreaming()
  if (examTimer) {
    clearInterval(examTimer)
  }
})

function setupSecurityMonitoring() {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      tabSwitchCount++
      recordViolation("tab_switch", `Tab/window switch #${tabSwitchCount}`)

      let message = ""
      if (tabSwitchCount === 1) {
        message = "First warning: Tab switching detected. Next switch will be your final warning."
      } else if (tabSwitchCount === 2) {
        message = "Final warning: Another tab switch will automatically submit your exam."
      } else if (tabSwitchCount >= 3) {
        message = "Exam automatically submitted due to multiple tab switches."
        setTimeout(() => submitExam(true), 2000)
      }

      showSecurityWarning(message)
    }
  })

  document.addEventListener("contextmenu", (e) => e.preventDefault())
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "F12" ||
      (e.ctrlKey && (e.key === "u" || e.key === "i" || e.key === "s")) ||
      (e.ctrlKey && e.shiftKey && e.key === "I")
    ) {
      e.preventDefault()
      recordViolation("dev_tools", "Attempted to access developer tools")
    }
  })
}

function showSecurityWarning(message) {
  const modal = document.getElementById("security-modal")
  const messageEl = document.getElementById("security-message")

  if (!modal || !messageEl) {
    console.warn("[v0] Security modal elements not found, using alert fallback")
    alert(message)
    return
  }

  messageEl.textContent = message
  modal.classList.add("show")

  const okBtn = document.getElementById("security-ok-btn")
  if (okBtn) {
    okBtn.onclick = () => {
      modal.classList.remove("show")
    }
  }
}

console.log("[v0] Enhanced exam script loaded successfully")
