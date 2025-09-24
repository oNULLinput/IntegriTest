const supabase = window.supabase.createClient(
  window.location.hostname === "localhost"
    ? "https://nsxuvuhrofqjyqunfzlk.supabase.co"
    : window.ENV?.NEXT_PUBLIC_SUPABASE_URL || "https://nsxuvuhrofqjyqunfzlk.supabase.co",
  window.location.hostname === "localhost"
    ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeHV2dWhyb2ZxanlxdW5memxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NDEwMjAsImV4cCI6MjA3NDIxNzAyMH0.iZ1imeqGu9V7bm2QdiXTWdmA18DkBBq9Rsa9aNAcMKw"
    : window.ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeHV2dWhyb2ZxanlxdW5memxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NDEwMjAsImV4cCI6MjA3NDIxNzAyMH0.iZ1imeqGu9V7bm2QdiXTWdmA18DkBBq9Rsa9aNAcMKw",
)

// Global variables
let questionCounter = 0
const uploadedFiles = []
let currentInstructor = null

// DOM elements - with null checks
const examForm = document.getElementById("create-exam-form")
const questionsContainer = document.getElementById("questions-container")
const fileUploadArea = document.getElementById("file-upload-area")
const fileInput = document.getElementById("file-input")
const uploadedFilesList = document.getElementById("uploaded-files")

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] DOM loaded, initializing form...")
  initializeForm()

  if (fileUploadArea && fileInput && uploadedFilesList) {
    console.log("[v0] File upload elements found, setting up file upload...")
    setupFileUpload()
  } else {
    console.log("[v0] File upload elements not found, skipping file upload setup")
  }

  checkEditMode()
  checkInstructorAuth()
})

async function checkInstructorAuth() {
  const instructorData = localStorage.getItem("instructorSession")
  if (!instructorData) {
    alert("Please log in as an instructor first.")
    window.location.href = "index.html"
    return
  }

  currentInstructor = JSON.parse(instructorData)
  console.log("[v0] Instructor authenticated:", currentInstructor.username)
}

// File Upload Handling
function setupFileUpload() {
  console.log("[v0] Setting up file upload functionality")

  if (!fileUploadArea || !fileInput || !uploadedFilesList) {
    console.log("[v0] Missing file upload elements, cannot setup file upload")
    return
  }

  // Drag and drop functionality
  fileUploadArea.addEventListener("dragover", (e) => {
    e.preventDefault()
    fileUploadArea.classList.add("drag-over")
  })

  fileUploadArea.addEventListener("dragleave", () => {
    fileUploadArea.classList.remove("drag-over")
  })

  fileUploadArea.addEventListener("drop", (e) => {
    e.preventDefault()
    fileUploadArea.classList.remove("drag-over")
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  })

  // Click to upload
  fileUploadArea.addEventListener("click", () => {
    fileInput.click()
  })

  fileInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files)
    handleFileUpload(files)
  })
}

function handleFileUpload(files) {
  if (!uploadedFilesList) {
    console.log("[v0] Uploaded files list element not found")
    return
  }

  const allowedTypes = [".pdf", ".doc", ".docx", ".txt", ".ppt", ".pptx"]
  const maxSize = 10 * 1024 * 1024 // 10MB

  files.forEach((file) => {
    // Check file type
    const fileExtension = "." + file.name.split(".").pop().toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      alert(`File type ${fileExtension} is not allowed. Please upload PDF, DOC, DOCX, TXT, PPT, or PPTX files.`)
      return
    }

    // Check file size
    if (file.size > maxSize) {
      alert(`File ${file.name} is too large. Maximum size is 10MB.`)
      return
    }

    // Check if we already have 3 files
    if (uploadedFiles.length >= 3) {
      alert("Maximum 3 files allowed. Please remove a file before adding a new one.")
      return
    }

    // Add file to uploaded files
    uploadedFiles.push({
      name: file.name,
      size: file.size,
      type: fileExtension,
      file: file,
      uploadedAt: new Date().toISOString(),
    })

    updateUploadedFilesList()
  })

  if (fileInput) {
    fileInput.value = ""
  }
}

function updateUploadedFilesList() {
  if (!uploadedFilesList) {
    console.log("[v0] Uploaded files list element not found")
    return
  }

  if (uploadedFiles.length === 0) {
    uploadedFilesList.innerHTML = '<p class="no-files">No files uploaded yet</p>'
    return
  }

  uploadedFilesList.innerHTML = uploadedFiles
    .map(
      (file, index) => `
    <div class="uploaded-file-item">
      <div class="file-info">
        <div class="file-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <div class="file-details">
          <div class="file-name">${file.name}</div>
          <div class="file-meta">${formatFileSize(file.size)} • ${file.type.toUpperCase()}</div>
        </div>
      </div>
      <button type="button" class="remove-file-btn" onclick="removeFile(${index})">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12m4-6v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
  `,
    )
    .join("")
}

function removeFile(index) {
  uploadedFiles.splice(index, 1)
  updateUploadedFilesList()
}

// Question Management
function addQuestion(type) {
  questionCounter++

  const questionDiv = document.createElement("div")
  questionDiv.className = "question-item"
  questionDiv.dataset.questionId = questionCounter
  questionDiv.dataset.questionType = type

  let questionHTML = `
    <div class="question-header">
      <div class="question-title">
        <span class="question-number">Question ${questionCounter}</span>
        <span class="question-type-badge">${getQuestionTypeLabel(type)}</span>
      </div>
      <button type="button" class="remove-question-btn" onclick="removeQuestion(${questionCounter})">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
    <div class="question-content">
      <div class="form-group">
        <label>Question Text</label>
        <textarea name="question_${questionCounter}_text" placeholder="Enter your question here..." required></textarea>
      </div>
  `

  // Add type-specific fields
  switch (type) {
    case "multiple-choice":
      questionHTML += `
        <div class="form-group">
          <label>Answer Options</label>
          <div class="options-container">
            ${["A", "B", "C", "D"]
              .map(
                (letter, index) => `
              <div class="option-input-group">
                <span class="option-letter">${letter}</span>
                <input type="text" name="question_${questionCounter}_option_${index}" placeholder="Option ${letter}" required>
                <input type="radio" name="question_${questionCounter}_correct" value="${letter}" ${
                  index === 0 ? "checked" : ""
                } required>
                <label class="radio-label">Correct</label>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `
      break

    case "identification":
      questionHTML += `
        <div class="form-group">
          <label>Correct Answer</label>
          <input type="text" name="question_${questionCounter}_answer" placeholder="Enter the correct answer" required>
        </div>
      `
      break

    case "fill-blanks":
      questionHTML += `
        <div class="form-group">
          <label>Answer Key</label>
          <textarea name="question_${questionCounter}_answer" placeholder="Enter the correct answers (separate multiple answers with commas)" required></textarea>
          <small class="form-help">For multiple blanks, separate answers with commas (e.g., "answer1, answer2, answer3")</small>
        </div>
      `
      break

    case "essay":
      questionHTML += `
        <div class="form-group">
          <label>Grading Rubric (Optional)</label>
          <textarea name="question_${questionCounter}_rubric" placeholder="Enter grading criteria or key points to look for..."></textarea>
        </div>
      `
      break
  }

  questionHTML += `
      <div class="form-group">
        <label>Points</label>
        <input type="number" name="question_${questionCounter}_points" value="1" min="1" required>
      </div>
    </div>
  `

  questionDiv.innerHTML = questionHTML
  questionsContainer.appendChild(questionDiv)

  // Remove the "no questions" message if it exists
  const noQuestionsMessage = questionsContainer.querySelector(".no-questions-message")
  if (noQuestionsMessage) {
    noQuestionsMessage.remove()
  }

  // Scroll to the new question
  questionDiv.scrollIntoView({ behavior: "smooth", block: "center" })
}

function removeQuestion(questionId) {
  const questionDiv = document.querySelector(`[data-question-id="${questionId}"]`)
  if (questionDiv) {
    questionDiv.remove()
    updateQuestionNumbers()
    checkEmptyQuestions()
  }
}

function updateQuestionNumbers() {
  const questionItems = document.querySelectorAll(".question-item")
  questionItems.forEach((item, index) => {
    const questionNumber = item.querySelector(".question-number")
    if (questionNumber) {
      questionNumber.textContent = `Question ${index + 1}`
    }
  })
}

function checkEmptyQuestions() {
  const questionsContainer = document.getElementById("questions-container")
  if (questionsContainer.children.length === 0) {
    questionsContainer.innerHTML = `
      <div class="no-questions-message">
        <div class="no-questions-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h4>No Questions Added Yet</h4>
        <p>Upload materials for AI generation or click the buttons above to add questions manually</p>
      </div>
    `
  }
}

// AI Question Generation (Enhanced for editing)
function generateQuestions() {
  const aiPrompt = document.getElementById("ai-prompt")?.value?.trim()
  if (!aiPrompt) {
    alert("AI question generation feature will be available with file upload integration.")
    return
  }

  const questionCount = Number.parseInt(document.getElementById("question-count")?.value || "5")
  const difficulty = document.getElementById("difficulty-level")?.value || "medium"

  const generateBtn = document.querySelector(".btn-generate")
  if (!generateBtn) return

  const originalText = generateBtn.innerHTML
  generateBtn.innerHTML = `
    <svg class="btn-icon animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
    </svg>
    Generating Questions...
  `
  generateBtn.disabled = true

  setTimeout(() => {
    generateBtn.innerHTML = originalText
    generateBtn.disabled = false

    alert("AI question generation will be implemented with your AI service integration.")
    console.log("[v0] AI generation placeholder - integrate with real AI service")
  }, 2000)
}

// Distribution Sliders
function initializeDistributionSliders() {
  const sliders = ["mc-percentage", "id-percentage", "fb-percentage", "essay-percentage"]

  sliders.forEach((sliderId) => {
    const slider = document.getElementById(sliderId)
    const display = slider.nextElementSibling

    slider.addEventListener("input", () => {
      display.textContent = slider.value + "%"
      normalizeDistribution(sliderId)
    })
  })
}

function normalizeDistribution(changedSliderId) {
  const sliders = {
    "mc-percentage": document.getElementById("mc-percentage"),
    "id-percentage": document.getElementById("id-percentage"),
    "fb-percentage": document.getElementById("fb-percentage"),
    "essay-percentage": document.getElementById("essay-percentage"),
  }

  const total = Object.values(sliders).reduce((sum, slider) => sum + Number.parseInt(slider.value), 0)

  if (total > 100) {
    const excess = total - 100
    const otherSliders = Object.entries(sliders).filter(([id]) => id !== changedSliderId)

    otherSliders.forEach(([id, slider]) => {
      const reduction = Math.min(Number.parseInt(slider.value), Math.ceil(excess / otherSliders.length))
      slider.value = Math.max(0, Number.parseInt(slider.value) - reduction)
      slider.nextElementSibling.textContent = slider.value + "%"
    })
  }
}

function getQuestionTypeLabel(type) {
  const labels = {
    "multiple-choice": "Multiple Choice",
    identification: "Identification",
    "fill-blanks": "Fill in Blanks",
    essay: "Essay",
  }
  return labels[type] || type
}

// Form Handling
function initializeForm() {
  const form = document.getElementById("create-exam-form")
  if (form) {
    form.addEventListener("submit", handleFormSubmission)
    console.log("[v0] Form event listener added successfully")
  } else {
    console.log("[v0] Create exam form not found")
  }
}

function handleFormSubmission(e) {
  e.preventDefault()
  console.log("[v0] Form submitted, saving to database...")
  saveExamToDatabase()
}

async function saveExamToDatabase() {
  try {
    console.log("[v0] createExam function called")
    console.log("[v0] Starting exam creation process")

    const examTitleEl = document.getElementById("exam-title")
    const examSubjectEl = document.getElementById("exam-subject")
    const examInstructionsEl = document.getElementById("exam-instructions")
    const examDurationEl = document.getElementById("exam-duration")

    if (!examTitleEl || !examSubjectEl || !examDurationEl) {
      alert("Required form elements not found. Please refresh the page.")
      return
    }

    const examTitle = examTitleEl.value.trim()
    const examSubject = examSubjectEl.value.trim()
    const examInstructions = examInstructionsEl ? examInstructionsEl.value.trim() : ""
    const examDuration = examDurationEl.value

    const showTimer = document.getElementById("show-timer")?.checked || false
    const autoSubmit = document.getElementById("auto-submit")?.checked || false
    const shuffleQuestions = document.getElementById("shuffle-questions")?.checked || false

    console.log("[v0] Form data collected:", {
      examTitle,
      examSubject,
      examDuration,
      shuffleQuestions,
    })

    const questions = []
    const questionItems = document.querySelectorAll(".question-item")

    console.log("[v0] Found", questionItems.length, "questions")

    questionItems.forEach((questionDiv) => {
      const questionId = questionDiv.dataset.questionId
      const questionType = questionDiv.dataset.questionType
      const questionText = questionDiv.querySelector(`[name="question_${questionId}_text"]`)?.value

      if (!questionText) return

      const questionData = {
        question: questionText, // Use 'question' instead of 'question_text' to match database schema
        type: questionType === "multiple-choice" ? "multiple_choice" : questionType, // Normalize type to match database
        points: Number.parseInt(questionDiv.querySelector(`[name="question_${questionId}_points"]`)?.value) || 1,
      }

      // Handle type-specific data
      if (questionType === "multiple-choice") {
        const options = []
        const correctAnswer = questionDiv.querySelector(`[name="question_${questionId}_correct"]:checked`)?.value

        console.log(`[v0] Processing multiple choice question ${questionId}`)
        console.log(`[v0] Correct answer radio value:`, correctAnswer)

        for (let i = 0; i < 4; i++) {
          const optionText = questionDiv.querySelector(`[name="question_${questionId}_option_${i}"]`)?.value
          if (optionText && optionText.trim()) {
            options.push(optionText.trim()) // Ensure options are clean strings
            console.log(`[v0] Added option ${i}:`, optionText.trim())
          }
        }

        console.log(`[v0] Final options array:`, options)
        console.log(`[v0] Final correct answer:`, correctAnswer)

        if (correctAnswer && options[correctAnswer]) {
          questionData.correct_answer = options[correctAnswer]
        } else {
          questionData.correct_answer = correctAnswer // fallback to letter
        }
        questionData.options = options // Store as simple array of strings
      } else if (questionType === "identification" || questionType === "fill-blanks") {
        questionData.correct_answer = questionDiv.querySelector(`[name="question_${questionId}_answer"]`)?.value
      } else if (questionType === "essay") {
        questionData.correct_answer = questionDiv.querySelector(`[name="question_${questionId}_rubric"]`)?.value || ""
      }

      questions.push(questionData)
    })

    const examData = {
      title: examTitle,
      description: examSubject,
      duration: Number.parseInt(examDuration),
      instructions: examInstructions,
      show_timer: showTimer,
      auto_submit: autoSubmit,
      shuffle_questions: shuffleQuestions,
      questions: questions, // Include questions in the exam data
      instructor_id: currentInstructor.id, // Include instructor ID
    }

    console.log("[v0] Final exam data being sent to database:", JSON.stringify(examData, null, 2))

    console.log("[v0] Creating exam:", examData.title)
    const result = await window.examOperations.createExam(examData)

    if (!result) {
      alert("Failed to create exam. Please try again.")
      return
    }

    console.log("[v0] Exam creation result:", {
      id: result.id,
      title: result.title,
      description: result.description,
      duration: result.duration,
      exam_code: result.exam_code,
    })
    console.log("[v0] Exam created successfully with code:", result.exam_code)

    showSuccessNotification(`Exam "${examData.title}" created successfully!`, `Access code: ${result.exam_code}`)

    // Redirect after short delay
    setTimeout(() => {
      window.location.href = "instructor-dashboard.html"
    }, 2000)
  } catch (error) {
    console.error("Error creating exam:", error)
    alert("Failed to create exam. Please try again.")
  }
}

function showSuccessNotification(title, message) {
  // Create notification element
  const notification = document.createElement("div")
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    max-width: 400px;
  `
  notification.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
    <div style="font-size: 14px; opacity: 0.9;">${message}</div>
  `

  document.body.appendChild(notification)

  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification)
    }
  }, 3000)
}

function generateExamCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Navigation Functions
function goBackToDashboard() {
  window.location.href = "instructor-dashboard.html"
}

// Utility Functions
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Function to check for edit mode and load existing exam data
function checkEditMode() {
  const urlParams = new URLSearchParams(window.location.search)
  const isEditMode = urlParams.get("edit") === "true"

  if (isEditMode) {
    const editingExam = localStorage.getItem("editingExam")
    if (editingExam) {
      const examData = JSON.parse(editingExam)
      loadExamForEditing(examData)

      const pageTitle = document.querySelector("h1")
      if (pageTitle) {
        pageTitle.textContent = "Edit Exam"
      }

      const submitBtn = document.querySelector('button[onclick="createExam()"]')
      if (submitBtn) {
        submitBtn.textContent = "Complete Editing"
        submitBtn.setAttribute("onclick", "completeEditing()")
      }
    }
  }
}

// Function to load existing exam data into the form
function loadExamForEditing(examData) {
  console.log("[v0] Loading exam for editing:", examData)

  const titleField = document.getElementById("exam-title")
  const subjectField = document.getElementById("exam-subject")
  const durationField = document.getElementById("exam-duration")
  const instructionsField = document.getElementById("exam-instructions")
  const timeWarningField = document.getElementById("time-warning")
  const showTimerField = document.getElementById("show-timer")
  const autoSubmitField = document.getElementById("auto-submit")
  const shuffleQuestionsField = document.getElementById("shuffle-questions")

  if (titleField) titleField.value = examData.title || ""
  if (subjectField) subjectField.value = examData.subject || ""
  if (durationField) durationField.value = examData.duration || ""
  if (instructionsField) instructionsField.value = examData.instructions || ""
  if (timeWarningField) timeWarningField.value = examData.timeWarning || 5
  if (showTimerField) showTimerField.checked = examData.showTimer || false
  if (autoSubmitField) autoSubmitField.checked = examData.autoSubmit || false
  if (shuffleQuestionsField) shuffleQuestionsField.checked = examData.shuffleQuestions || false

  if (examData.questions && examData.questions.length > 0) {
    // Clear existing questions
    const questionsContainer = document.getElementById("questions-container")
    if (questionsContainer) {
      questionsContainer.innerHTML = ""
    }

    // Reset question counter
    questionCounter = 0

    // Add each existing question
    examData.questions.forEach((question) => {
      addExistingQuestion(question)
    })

    console.log("[v0] Loaded", examData.questions.length, "questions for editing")
  }
}

function addExistingQuestion(questionData) {
  questionCounter++
  const questionsContainer = document.getElementById("questions-container")

  const questionDiv = document.createElement("div")
  questionDiv.className = "question-item"
  questionDiv.dataset.questionId = questionCounter
  questionDiv.dataset.questionType = questionData.type

  let typeSpecificHtml = ""

  // Generate type-specific HTML based on question type
  switch (questionData.type) {
    case "multiple_choice":
      typeSpecificHtml = `
        <div class="options-container">
          <h5>Answer Options:</h5>
          <div id="options-list-${questionCounter}">
            ${
              questionData.options
                ? questionData.options
                    .map(
                      (option, index) => `
              <div class="option-item">
                <input type="text" name="question_${questionCounter}_option_${index}" value="${option}" placeholder="Option ${index + 1}" required>
                <label>
                  <input type="radio" name="question_${questionCounter}_correct" value="${index}" ${questionData.correct_answer === option ? "checked" : ""}>
                  Correct Answer
                </label>
                <button type="button" onclick="removeOption(${questionCounter}, ${index})">Remove</button>
              </div>
            `,
                    )
                    .join("")
                : ""
            }
          </div>
          <button type="button" onclick="addOption(${questionCounter})">Add Option</button>
        </div>
      `
      break

    case "identification":
      typeSpecificHtml = `
        <div class="form-group">
          <label>Correct Answer:</label>
          <input type="text" name="question_${questionCounter}_answer" value="${questionData.correct_answer || ""}" placeholder="Enter the correct answer" required>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" name="question_${questionCounter}_case_sensitive" ${questionData.case_sensitive ? "checked" : ""}>
            Case Sensitive
          </label>
        </div>
      `
      break

    case "fill_blanks":
      typeSpecificHtml = `
        <div class="form-group">
          <label>Correct Answers (comma-separated):</label>
          <input type="text" name="question_${questionCounter}_answers" value="${questionData.correct_answer ? questionData.correct_answer.join(", ") : ""}" placeholder="answer1, answer2, answer3" required>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" name="question_${questionCounter}_case_sensitive" ${questionData.case_sensitive ? "checked" : ""}>
            Case Sensitive
          </label>
        </div>
      `
      break

    case "essay":
      typeSpecificHtml = `
        <div class="form-group">
          <label>Minimum Words:</label>
          <input type="number" name="question_${questionCounter}_min_words" value="${questionData.min_words || 0}" min="0">
        </div>
        <div class="form-group">
          <label>Maximum Words:</label>
          <input type="number" name="question_${questionCounter}_max_words" value="${questionData.max_words || 0}" min="0">
        </div>
        <div class="form-group">
          <label>Rubric/Grading Criteria:</label>
          <textarea name="question_${questionCounter}_rubric" placeholder="Enter grading criteria...">${questionData.correct_answer || ""}</textarea>
        </div>
      `
      break
  }

  questionDiv.innerHTML = `
    <div class="question-header">
      <h4>Question ${questionCounter}</h4>
      <button type="button" class="btn btn-danger btn-sm" onclick="removeQuestion(${questionCounter})">Remove</button>
    </div>
    <div class="form-group">
      <label>Question Type:</label>
      <select name="question_${questionCounter}_type" onchange="updateQuestionType(${questionCounter})" required>
        <option value="multiple-choice" ${questionData.type === "multiple_choice" ? "selected" : ""}>Multiple Choice</option>
        <option value="identification" ${questionData.type === "identification" ? "selected" : ""}>Identification</option>
        <option value="fill-blanks" ${questionData.type === "fill_blanks" ? "selected" : ""}>Fill in Blanks</option>
        <option value="essay" ${questionData.type === "essay" ? "selected" : ""}>Essay</option>
      </select>
    </div>
    <div class="form-group">
      <label>Question Text:</label>
      <textarea name="question_${questionCounter}_text" placeholder="Enter your question here..." required>${questionData.question || ""}</textarea>
    </div>
    ${typeSpecificHtml}
    <div class="form-group">
      <label>Points:</label>
      <input type="number" name="question_${questionCounter}_points" value="${questionData.points || 1}" min="1" required>
    </div>
  `

  questionsContainer.appendChild(questionDiv)
}

// Function to update existing exam instead of creating new one
async function completeEditing() {
  console.log("[v0] completeEditing function called")

  const editingExam = localStorage.getItem("editingExam")
  if (!editingExam) {
    alert("Error: No exam data found for editing!")
    return
  }

  const originalExam = JSON.parse(editingExam)

  const examTitle = document.getElementById("exam-title").value.trim()
  const examSubject = document.getElementById("exam-subject").value.trim()
  const examInstructions = document.getElementById("exam-instructions").value.trim()
  const examDuration = document.getElementById("exam-duration").value
  const timeWarning = document.getElementById("time-warning").value || 5
  const showTimer = document.getElementById("show-timer").checked
  const autoSubmit = document.getElementById("auto-submit").checked
  const shuffleQuestions = document.getElementById("shuffle-questions").checked

  // Collect questions data using same logic as createExam
  const questions = []
  const questionItems = document.querySelectorAll(".question-item")

  questionItems.forEach((questionDiv) => {
    const questionId = questionDiv.dataset.questionId
    const questionType = questionDiv.dataset.questionType
    const questionText = questionDiv.querySelector(`[name="question_${questionId}_text"]`)?.value

    if (!questionText) return

    const questionData = {
      question: questionText, // Use 'question' instead of 'question_text'
      type: questionType === "multiple-choice" ? "multiple_choice" : questionType, // Normalize type
      points: Number.parseInt(questionDiv.querySelector(`[name="question_${questionId}_points"]`)?.value) || 1,
    }

    // Handle type-specific data
    if (questionType === "multiple-choice") {
      const options = []
      const correctAnswer = questionDiv.querySelector(`[name="question_${questionId}_correct"]:checked`)?.value

      console.log(`[v0] Processing multiple choice question ${questionId}`)
      console.log(`[v0] Correct answer radio value:`, correctAnswer)

      for (let i = 0; i < 4; i++) {
        const optionText = questionDiv.querySelector(`[name="question_${questionId}_option_${i}"]`)?.value
        if (optionText && optionText.trim()) {
          options.push(optionText.trim()) // Ensure options are clean strings
          console.log(`[v0] Added option ${i}:`, optionText.trim())
        }
      }

      console.log(`[v0] Final options array:`, options)
      console.log(`[v0] Final correct answer:`, correctAnswer)

      if (correctAnswer && options[correctAnswer]) {
        questionData.correct_answer = options[correctAnswer]
      } else {
        questionData.correct_answer = correctAnswer // fallback to letter
      }
      questionData.options = options // Store as simple array of strings
    } else if (questionType === "identification" || questionType === "fill-blanks") {
      questionData.correct_answer = questionDiv.querySelector(`[name="question_${questionId}_answer"]`)?.value
    } else if (questionType === "essay") {
      questionData.correct_answer = questionDiv.querySelector(`[name="question_${questionId}_rubric"]`)?.value || ""
    }

    questions.push(questionData)
  })

  // Validate exam has questions
  if (questions.length === 0) {
    return
  }

  try {
    // Update exam in database
    const { error: examError } = await supabase
      .from("exams")
      .update({
        title: examTitle,
        description: examSubject,
        duration: Number.parseInt(examDuration),
        instructions: examInstructions,
        questions: questions, // Store properly formatted questions
        updated_at: new Date().toISOString(),
        show_timer: showTimer,
        auto_submit: autoSubmit,
        shuffle_questions: shuffleQuestions,
      })
      .eq("exam_code", originalExam.code)

    if (examError) {
      console.error("Error updating exam:", examError)
      alert("Failed to update exam. Please try again.")
      return
    }

    // Clear editing data
    localStorage.removeItem("editingExam")

    console.log("[v0] Exam updated successfully")
    alert(`Exam "${examTitle}" has been updated successfully!`)
    window.location.href = "instructor-dashboard.html"
  } catch (error) {
    console.error("Error updating exam:", error)
    alert("Failed to update exam. Please try again.")
  }
}

console.log("[v0] Create exam script loaded successfully")
