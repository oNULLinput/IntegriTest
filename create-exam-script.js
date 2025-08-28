// Create Exam Script
let questionCounter = 0
let uploadedFiles = []

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  const materialUpload = document.getElementById("material-upload")
  const uploadArea = document.getElementById("upload-area")
  const uploadedFilesSection = document.getElementById("uploaded-files")
  const filesList = document.getElementById("files-list")
  const aiPromptSection = document.getElementById("ai-prompt-section")
  const aiPromptTextarea = document.getElementById("ai-prompt")

  checkEditMode()

  // File upload event listeners
  if (materialUpload) {
    materialUpload.addEventListener("change", handleFileUpload)
  }

  // Drag and drop functionality
  if (uploadArea) {
    uploadArea.addEventListener("dragover", handleDragOver)
    uploadArea.addEventListener("drop", handleFileDrop)
    uploadArea.addEventListener("click", () => materialUpload?.click())
  }

  // AI prompt character counter
  if (aiPromptTextarea) {
    aiPromptTextarea.addEventListener("input", updateCharacterCount)
  }

  console.log("[v0] DOM loaded, event listeners attached")
})

// Upload Area Functionality
function initializeUploadArea() {
  const uploadArea = document.getElementById("upload-area")
  const fileInput = document.getElementById("material-upload")

  // Click to upload
  uploadArea.addEventListener("click", () => {
    if (uploadedFiles.length < 3) {
      fileInput.click()
    }
  })

  // Drag and drop
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault()
    if (uploadedFiles.length < 3) {
      uploadArea.classList.add("dragover")
    }
  })

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover")
  })

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault()
    uploadArea.classList.remove("dragover")
    if (uploadedFiles.length < 3) {
      handleFiles(e.dataTransfer.files)
    }
  })

  // File input change
  fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files)
  })
}

function handleFiles(files) {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ]

  Array.from(files).forEach((file) => {
    if (uploadedFiles.length >= 3) {
      alert("Maximum 3 files allowed. Please remove a file before adding more.")
      return
    }

    if (allowedTypes.includes(file.type)) {
      uploadedFiles.push({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
      })
    } else {
      alert(`File type not supported: ${file.name}`)
    }
  })

  updateUploadedFilesList()
  updateAIPromptVisibility()
  updateFileCount()
  updateGenerateButtonState()

  console.log("[v0] Files uploaded:", uploadedFiles.length)
}

function handleFileUpload(event) {
  const files = Array.from(event.target.files)
  console.log("[v0] Files selected:", files.length)

  if (uploadedFiles.length + files.length > 3) {
    alert("You can only upload a maximum of 3 files. Please remove some files first.")
    return
  }

  files.forEach((file) => {
    if (uploadedFiles.length < 3) {
      const fileObj = {
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
      }
      uploadedFiles.push(fileObj)
      console.log("[v0] File added:", fileObj.name)
    }
  })

  updateUploadedFilesList()
  updateAIPromptVisibility()
  updateFileCount()
  updateGenerateButtonState()

  // Clear the input
  event.target.value = ""
}

function handleDragOver(e) {
  e.preventDefault()
  const uploadArea = document.getElementById("upload-area")
  if (uploadArea && uploadedFiles.length < 3) {
    uploadArea.classList.add("dragover")
  }
}

function handleFileDrop(e) {
  e.preventDefault()
  const uploadArea = document.getElementById("upload-area")
  if (uploadArea) {
    uploadArea.classList.remove("dragover")
  }
  if (uploadedFiles.length < 3) {
    handleFiles(e.dataTransfer.files)
  }
}

function updateUploadedFilesList() {
  const filesList = document.getElementById("files-list")
  const uploadedFilesSection = document.getElementById("uploaded-files")

  if (!filesList || !uploadedFilesSection) {
    console.log("[v0] Files list elements not found")
    return
  }

  if (uploadedFiles.length === 0) {
    uploadedFilesSection.style.display = "none"
    return
  }

  uploadedFilesSection.style.display = "block"
  filesList.innerHTML = ""

  uploadedFiles.forEach((file) => {
    const fileItem = document.createElement("div")
    fileItem.className = "file-item"
    fileItem.innerHTML = `
      <div class="file-info">
        <div class="file-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <div class="file-details">
          <span class="file-name">${file.name}</span>
          <span class="file-size">${formatFileSize(file.size)}</span>
        </div>
      </div>
      <button type="button" class="btn-delete-file" data-file-id="${file.id}" title="Remove file">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    `
    filesList.appendChild(fileItem)
  })

  const deleteButtons = filesList.querySelectorAll(".btn-delete-file")
  deleteButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault()
      e.stopPropagation()
      const fileId = this.getAttribute("data-file-id")
      removeFile(fileId)
      console.log("[v0] Delete button clicked for file:", fileId)
    })
  })

  console.log("[v0] Updated files list, attached", deleteButtons.length, "delete listeners")
}

function removeFile(fileId) {
  console.log("[v0] Attempting to remove file with ID:", fileId)
  const initialLength = uploadedFiles.length
  uploadedFiles = uploadedFiles.filter((file) => file.id != fileId) // Use != for type coercion

  if (uploadedFiles.length < initialLength) {
    console.log("[v0] File removed successfully, remaining:", uploadedFiles.length)
    updateUploadedFilesList()
    updateAIPromptVisibility()
    updateFileCount()
    updateGenerateButtonState()
  } else {
    console.log("[v0] File not found for removal:", fileId)
  }
}

function clearAllFiles() {
  if (uploadedFiles.length > 0 && confirm("Are you sure you want to remove all uploaded files?")) {
    uploadedFiles = []
    updateUploadedFilesList()
    updateAIPromptVisibility()
    updateFileCount()
    updateGenerateButtonState()

    // Reset file input
    document.getElementById("material-upload").value = ""

    console.log("[v0] All files cleared")
  }
}

function updateAIPromptVisibility() {
  const aiPromptSection = document.getElementById("ai-prompt-section")
  const aiPromptTextarea = document.getElementById("ai-prompt")
  const aiOptions = document.getElementById("ai-options")

  if (!aiPromptSection || !aiPromptTextarea || !aiOptions) {
    console.log("[v0] AI prompt elements not found")
    return
  }

  if (uploadedFiles.length > 0) {
    // Show and enable the AI prompt section when any files are uploaded
    aiPromptSection.style.display = "block"
    aiPromptTextarea.disabled = false
    aiPromptTextarea.required = true
    aiOptions.style.display = "block"

    // Remove existing listener to prevent duplicates
    aiPromptTextarea.removeEventListener("input", updateCharacterCount)
    aiPromptTextarea.addEventListener("input", updateCharacterCount)
    updateCharacterCount()

    console.log("[v0] AI prompt section enabled with", uploadedFiles.length, "files")
  } else {
    // Hide and disable the AI prompt section when no files
    aiPromptSection.style.display = "none"
    aiPromptTextarea.disabled = true
    aiPromptTextarea.required = false
    aiOptions.style.display = "none"

    // Clear the textarea when hiding
    aiPromptTextarea.value = ""
    console.log("[v0] AI prompt section disabled - no files uploaded")
  }

  updateGenerateButtonState()
}

function updateCharacterCount() {
  const aiPromptTextarea = document.getElementById("ai-prompt")
  const charCountElement = document.getElementById("char-count")

  if (aiPromptTextarea && charCountElement) {
    const currentLength = aiPromptTextarea.value.length
    charCountElement.textContent = currentLength

    // Change color based on character count
    if (currentLength > 450) {
      charCountElement.style.color = "#ef4444"
    } else if (currentLength > 400) {
      charCountElement.style.color = "#f59e0b"
    } else {
      charCountElement.style.color = "#6b7280"
    }
  }
}

function updateGenerateButtonState() {
  const generateBtn = document.getElementById("generate-btn")
  const aiPromptTextarea = document.getElementById("ai-prompt")

  if (generateBtn && aiPromptTextarea) {
    const hasAllFiles = uploadedFiles.length === 3
    const hasPrompt = aiPromptTextarea.value.trim().length > 0

    generateBtn.disabled = !(hasAllFiles && hasPrompt)
    console.log("[v0] Generate button state:", { hasAllFiles, hasPrompt, disabled: generateBtn.disabled })
  }
}

function updateFileCount() {
  const fileCountSpan = document.getElementById("file-count")
  if (fileCountSpan) {
    fileCountSpan.textContent = uploadedFiles.length
  }
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

// AI Question Generation (Enhanced for editing)
function generateQuestions() {
  if (uploadedFiles.length !== 3) {
    alert("Please upload exactly 3 study materials first.")
    return
  }

  const aiPrompt = document.getElementById("ai-prompt").value.trim()
  if (!aiPrompt) {
    alert("Please provide AI generation instructions.")
    return
  }

  const questionCount = Number.parseInt(document.getElementById("question-count").value)
  const difficulty = document.getElementById("difficulty-level").value

  const generateBtn = document.querySelector(".btn-generate")
  const originalText = generateBtn.innerHTML
  generateBtn.innerHTML = `
    <svg class="btn-icon animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
    </svg>
    Generating Questions...
  `
  generateBtn.disabled = true

  setTimeout(() => {
    // Reset button
    generateBtn.innerHTML = originalText
    generateBtn.disabled = false

    showAIGeneratedQuestions(questionCount, difficulty, aiPrompt)

    console.log("[v0] AI generation simulated with editable questions")
  }, 2000)
}

function showAIGeneratedQuestions(count, difficulty, prompt) {
  // Show success message
  const aiSection = document.querySelector(".ai-generation-section")
  const successMessage = document.createElement("div")
  successMessage.className = "ai-success-message"
  successMessage.innerHTML = `
    <div class="success-content">
      <svg class="success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <div>
        <h4>AI Questions Generated Successfully!</h4>
        <p>Based on your prompt: "${prompt.substring(0, 80)}${prompt.length > 80 ? "..." : ""}"</p>
        <p>${count} questions have been added to your manual exam creation section below. You can edit, modify, or delete them as needed.</p>
      </div>
    </div>
  `

  // Remove any existing success message
  const existingMessage = aiSection.querySelector(".ai-success-message")
  if (existingMessage) {
    existingMessage.remove()
  }

  aiSection.appendChild(successMessage)

  // Add generated questions directly to manual section
  addGeneratedQuestionsToManualSection(count, difficulty)

  // Scroll to manual section
  document.getElementById("questions-container").scrollIntoView({ behavior: "smooth" })

  // Remove success message after 5 seconds
  setTimeout(() => {
    if (successMessage.parentNode) {
      successMessage.remove()
    }
  }, 5000)
}

function addGeneratedQuestionsToManualSection(count, difficulty) {
  const sampleQuestions = [
    {
      type: "multiple-choice",
      text: "What is the primary function of the CPU in a computer system?",
      options: [
        "Store data permanently",
        "Process instructions and calculations",
        "Display graphics",
        "Connect to the internet",
      ],
      correct: 1,
      points: 2,
    },
    {
      type: "identification",
      text: 'What programming language is known for its use in web development and has the motto "Write once, run anywhere"?',
      answer: "JavaScript",
      points: 1,
    },
    {
      type: "fill-blanks",
      text: "The _____ protocol is used for secure communication over the internet.",
      answers: ["HTTPS", "https"],
      points: 1,
    },
    {
      type: "multiple-choice",
      text: "Which of the following is NOT a programming paradigm?",
      options: [
        "Object-oriented programming",
        "Functional programming",
        "Database programming",
        "Procedural programming",
      ],
      correct: 2,
      points: 2,
    },
    {
      type: "identification",
      text: "What does HTML stand for?",
      answer: "HyperText Markup Language",
      points: 1,
    },
  ]

  // Add questions up to the requested count
  const questionsToAdd = sampleQuestions.slice(0, count)

  questionsToAdd.forEach((questionData) => {
    // Add question using existing function
    addQuestion(questionData.type)

    // Fill in the question data
    const latestQuestion = document.querySelector(`[data-question-id="${questionCounter}"]`)
    if (latestQuestion) {
      // Add AI-generated indicator
      const questionHeader = latestQuestion.querySelector(".question-header")
      const aiIndicator = document.createElement("span")
      aiIndicator.className = "ai-generated-badge"
      aiIndicator.textContent = "AI Generated"
      questionHeader.appendChild(aiIndicator)

      // Fill basic data
      latestQuestion.querySelector(`[name="question_${questionCounter}_text"]`).value = questionData.text
      latestQuestion.querySelector(`[name="question_${questionCounter}_points"]`).value = questionData.points

      // Fill type-specific data
      if (questionData.type === "multiple-choice") {
        questionData.options.forEach((option, i) => {
          const optionInput = latestQuestion.querySelector(`[name="question_${questionCounter}_option_${i}"]`)
          if (optionInput) {
            optionInput.value = option
          }
        })
        // Set correct answer
        const correctRadio = latestQuestion.querySelector(
          `[name="question_${questionCounter}_correct"][value="${questionData.correct}"]`,
        )
        if (correctRadio) {
          correctRadio.checked = true
        }
      } else if (questionData.type === "identification") {
        const answerInput = latestQuestion.querySelector(`[name="question_${questionCounter}_answer"]`)
        if (answerInput) {
          answerInput.value = questionData.answer
        }
      } else if (questionData.type === "fill-blanks") {
        const answersInput = latestQuestion.querySelector(`[name="question_${questionCounter}_answers"]`)
        if (answersInput) {
          answersInput.value = questionData.answers.join(", ")
        }
      }
    }
  })
}

// Manual Question Creation (from dashboard-script.js)
function addQuestion(type) {
  questionCounter++
  const questionsContainer = document.getElementById("questions-container")

  // Remove no questions message if it exists
  const noQuestionsMessage = questionsContainer.querySelector(".no-questions-message")
  if (noQuestionsMessage) {
    noQuestionsMessage.remove()
  }

  const questionDiv = document.createElement("div")
  questionDiv.className = "question-item"
  questionDiv.dataset.questionId = questionCounter
  questionDiv.dataset.questionType = type

  let questionHTML = `
    <div class="question-header">
      <div class="question-info">
        <span class="question-number">Question ${questionCounter}</span>
        <span class="question-type-badge ${type}">${getQuestionTypeLabel(type)}</span>
      </div>
      <button type="button" class="remove-question-btn" onclick="removeQuestion(${questionCounter})">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
    <div class="question-content">
  `

  // Add question-specific fields based on type
  switch (type) {
    case "multiple-choice":
      questionHTML += `
        <div class="form-group">
          <label>Question Text *</label>
          <textarea name="question_${questionCounter}_text" required rows="3" placeholder="Enter your question here..."></textarea>
        </div>
        <div class="form-group">
          <label>Points</label>
          <input type="number" name="question_${questionCounter}_points" min="1" max="100" value="1" placeholder="1">
        </div>
        <div class="options-container">
          <label>Answer Options *</label>
          <div class="option-item">
            <input type="radio" name="question_${questionCounter}_correct" value="0" required>
            <input type="text" name="question_${questionCounter}_option_0" required placeholder="Option A">
            <button type="button" class="remove-option-btn" onclick="removeOption(this)" style="display: none;">×</button>
          </div>
          <div class="option-item">
            <input type="radio" name="question_${questionCounter}_correct" value="1" required>
            <input type="text" name="question_${questionCounter}_option_1" required placeholder="Option B">
            <button type="button" class="remove-option-btn" onclick="removeOption(this)" style="display: none;">×</button>
          </div>
          <div class="option-item">
            <input type="radio" name="question_${questionCounter}_correct" value="2" required>
            <input type="text" name="question_${questionCounter}_option_2" required placeholder="Option C">
            <button type="button" class="remove-option-btn" onclick="removeOption(this)">×</button>
          </div>
          <div class="option-item">
            <input type="radio" name="question_${questionCounter}_correct" value="3" required>
            <input type="text" name="question_${questionCounter}_option_3" required placeholder="Option D">
            <button type="button" class="remove-option-btn" onclick="removeOption(this)">×</button>
          </div>
          <button type="button" class="btn btn-outline btn-sm add-option-btn" onclick="addOption(${questionCounter})">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Option
          </button>
        </div>
      `
      break

    case "identification":
      questionHTML += `
        <div class="form-group">
          <label>Question Text *</label>
          <textarea name="question_${questionCounter}_text" required rows="3" placeholder="Enter your identification question here..."></textarea>
        </div>
        <div class="form-group">
          <label>Correct Answer *</label>
          <input type="text" name="question_${questionCounter}_answer" required placeholder="Enter the correct answer">
        </div>
        <div class="form-group">
          <label>Points</label>
          <input type="number" name="question_${questionCounter}_points" min="1" max="100" value="1" placeholder="1">
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" name="question_${questionCounter}_case_sensitive">
            Case sensitive answer
          </label>
        </div>
      `
      break

    case "fill-blanks":
      questionHTML += `
        <div class="form-group">
          <label>Question Text with Blanks *</label>
          <textarea name="question_${questionCounter}_text" required rows="3" placeholder="Use _____ to indicate blanks. Example: The capital of France is _____."></textarea>
          <small class="form-help">Use underscores (____) to indicate where students should fill in answers</small>
        </div>
        <div class="form-group">
          <label>Correct Answers *</label>
          <textarea name="question_${questionCounter}_answers" required rows="2" placeholder="Enter correct answers separated by commas. Example: Paris, paris"></textarea>
          <small class="form-help">Separate multiple acceptable answers with commas</small>
        </div>
        <div class="form-group">
          <label>Points</label>
          <input type="number" name="question_${questionCounter}_points" min="1" max="100" value="1" placeholder="1">
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" name="question_${questionCounter}_case_sensitive">
            Case sensitive answers
          </label>
        </div>
      `
      break

    case "essay":
      questionHTML += `
        <div class="form-group">
          <label>Question Text *</label>
          <textarea name="question_${questionCounter}_text" required rows="4" placeholder="Enter your essay question here..."></textarea>
        </div>
        <div class="form-group">
          <label>Points</label>
          <input type="number" name="question_${questionCounter}_points" min="1" max="100" value="5" placeholder="5">
        </div>
        <div class="form-group">
          <label>Minimum Word Count</label>
          <input type="number" name="question_${questionCounter}_min_words" min="0" placeholder="0">
        </div>
        <div class="form-group">
          <label>Maximum Word Count</label>
          <input type="number" name="question_${questionCounter}_max_words" min="0" placeholder="500">
        </div>
        <div class="form-group">
          <label>Grading Rubric (Optional)</label>
          <textarea name="question_${questionCounter}_rubric" rows="3" placeholder="Describe the grading criteria for this essay question..."></textarea>
        </div>
      `
      break
  }

  questionHTML += `</div>`

  questionDiv.innerHTML = questionHTML
  questionsContainer.appendChild(questionDiv)

  console.log(`[v0] Added ${type} question #${questionCounter}`)
}

function removeQuestion(questionId) {
  const questionDiv = document.querySelector(`[data-question-id="${questionId}"]`)
  if (questionDiv) {
    questionDiv.remove()
    console.log(`[v0] Removed question #${questionId}`)

    // Show no questions message if no questions remain
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
  form.addEventListener("submit", handleFormSubmission)
}

function handleFormSubmission(event) {
  event.preventDefault()

  const formData = new FormData(event.target)
  const examData = {
    title: formData.get("examTitle"),
    subject: formData.get("examSubject") || "",
    instructions: formData.get("examInstructions") || "",
    duration: Number.parseInt(formData.get("examDuration")),
    timeWarning: Number.parseInt(formData.get("timeWarning")) || 5,
    showTimer: formData.get("showTimer") === "on",
    autoSubmit: formData.get("autoSubmit") === "on",
    extendTime: formData.get("extendTime") === "on",
    questions: [],
    code: generateExamCode(),
    createdAt: new Date().toISOString(),
    status: "active",
    studentsEnrolled: 0,
    completedSubmissions: 0,
  }

  // Collect questions data
  const questionItems = document.querySelectorAll(".question-item")
  questionItems.forEach((questionDiv) => {
    const questionId = questionDiv.dataset.questionId
    const questionType = questionDiv.dataset.questionType

    const questionData = {
      id: questionId,
      type: questionType,
      text: formData.get(`question_${questionId}_text`),
      points: Number.parseInt(formData.get(`question_${questionId}_points`)) || 1,
    }

    // Add type-specific data
    switch (questionType) {
      case "multiple-choice":
        questionData.options = []
        questionData.correctAnswer = Number.parseInt(formData.get(`question_${questionId}_correct`))

        let optionIndex = 0
        while (formData.get(`question_${questionId}_option_${optionIndex}`) !== null) {
          questionData.options.push(formData.get(`question_${questionId}_option_${optionIndex}`))
          optionIndex++
        }
        break

      case "identification":
        questionData.correctAnswer = formData.get(`question_${questionId}_answer`)
        questionData.caseSensitive = formData.get(`question_${questionId}_case_sensitive`) === "on"
        break

      case "fill-blanks":
        const answersText = formData.get(`question_${questionId}_answers`)
        questionData.correctAnswers = answersText ? answersText.split(",").map((a) => a.trim()) : []
        questionData.caseSensitive = formData.get(`question_${questionId}_case_sensitive`) === "on"
        break

      case "essay":
        questionData.minWords = Number.parseInt(formData.get(`question_${questionId}_min_words`)) || 0
        questionData.maxWords = Number.parseInt(formData.get(`question_${questionId}_max_words`)) || 0
        questionData.rubric = formData.get(`question_${questionId}_rubric`) || ""
        break
    }

    examData.questions.push(questionData)
  })

  // Validate exam has questions
  if (examData.questions.length === 0) {
    alert("Please add at least one question to the exam.")
    return
  }

  // Save exam data
  const examKey = `exam_${examData.code}`
  localStorage.setItem(examKey, JSON.stringify(examData))

  console.log("[v0] Exam created successfully:", examData)
  console.log("[v0] Exam saved with key:", examKey)
  console.log("[v0] Exam data in localStorage:", localStorage.getItem(examKey))

  const savedExam = localStorage.getItem(examKey)
  if (savedExam) {
    console.log("[v0] Exam successfully saved and can be retrieved")
  } else {
    console.error("[v0] ERROR: Exam was not saved to localStorage!")
  }

  showExamCreatedModal(examData.title, examData.code)
}

// Navigation Functions
function goBackToDashboard() {
  window.location.href = "instructor-dashboard.html"
}

// Utility Functions
function generateExamCode() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

function addOption(questionId) {
  const questionDiv = document.querySelector(`[data-question-id="${questionId}"]`)
  const optionsContainer = questionDiv.querySelector(".options-container")
  const addButton = optionsContainer.querySelector(".add-option-btn")

  // Count existing options
  const existingOptions = optionsContainer.querySelectorAll(".option-item").length
  const optionIndex = existingOptions

  // Create new option
  const optionDiv = document.createElement("div")
  optionDiv.className = "option-item"
  optionDiv.innerHTML = `
    <input type="radio" name="question_${questionId}_correct" value="${optionIndex}" required>
    <input type="text" name="question_${questionId}_option_${optionIndex}" required placeholder="Option ${String.fromCharCode(65 + optionIndex)}">
    <button type="button" class="remove-option-btn" onclick="removeOption(this)">×</button>
  `

  // Insert before the add button
  optionsContainer.insertBefore(optionDiv, addButton)

  // Update remove button visibility (show remove buttons when more than 2 options)
  updateRemoveButtonVisibility(questionId)

  console.log(`[v0] Added option ${optionIndex} to question ${questionId}`)
}

function removeOption(button) {
  const optionItem = button.parentElement
  const optionsContainer = optionItem.parentElement
  const questionDiv = optionsContainer.closest(".question-item")
  const questionId = questionDiv.dataset.questionId

  // Don't allow removing if only 2 options remain
  const optionItems = optionsContainer.querySelectorAll(".option-item")
  if (optionItems.length <= 2) {
    alert("A multiple choice question must have at least 2 options.")
    return
  }

  // Remove the option
  optionItem.remove()

  // Re-index remaining options
  reindexOptions(questionId)

  // Update remove button visibility
  updateRemoveButtonVisibility(questionId)

  console.log(`[v0] Removed option from question ${questionId}`)
}

function updateRemoveButtonVisibility(questionId) {
  const questionDiv = document.querySelector(`[data-question-id="${questionId}"]`)
  const optionItems = questionDiv.querySelectorAll(".option-item")
  const removeButtons = questionDiv.querySelectorAll(".remove-option-btn")

  // Show remove buttons only if more than 2 options
  removeButtons.forEach((btn, index) => {
    if (optionItems.length > 2) {
      btn.style.display = "flex"
    } else {
      btn.style.display = "none"
    }
  })
}

function reindexOptions(questionId) {
  const questionDiv = document.querySelector(`[data-question-id="${questionId}"]`)
  const optionItems = questionDiv.querySelectorAll(".option-item")

  optionItems.forEach((optionItem, index) => {
    const radio = optionItem.querySelector('input[type="radio"]')
    const textInput = optionItem.querySelector('input[type="text"]')

    // Update radio value and name
    radio.value = index
    radio.name = `question_${questionId}_correct`

    // Update text input name and placeholder
    textInput.name = `question_${questionId}_option_${index}`
    textInput.placeholder = `Option ${String.fromCharCode(65 + index)}`
  })
}

// Add CSS for animations and new modal styles
const style = document.createElement("style")
style.textContent = `
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .form-help {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }
  
  .options-container {
    margin-top: 1rem;
  }
  
  .option-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .option-item input[type="radio"] {
    width: auto;
    margin: 0;
  }
  
  .option-item input[type="text"] {
    flex: 1;
    margin: 0;
  }
  
  .remove-option-btn {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.875rem;
  }
  
  .add-option-btn {
    margin-top: 0.5rem;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    border-radius: 8px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .ai-questions-modal {
    max-width: 800px;
  }
  
  .exam-created-modal {
    text-align: center;
  }
  
  .success-icon {
    width: 4rem;
    height: 4rem;
    margin: 0 auto 1rem;
    color: #10b981;
  }
  
  .exam-code-display {
    margin: 1.5rem 0;
    padding: 1rem;
    background: #f3f4f6;
    border-radius: 8px;
  }
  
  .code-box {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .exam-code {
    font-size: 2rem;
    font-weight: bold;
    font-family: monospace;
    color: #1f2937;
    letter-spacing: 0.2em;
  }
  
  .copy-code-btn {
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
  }
  
  .copy-code-btn svg {
    width: 1rem;
    height: 1rem;
  }
  
  .code-info {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.5rem;
  }
  
  .ai-question-item {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .question-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }
  
  .option-edit {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .option-edit input[type="text"] {
    flex: 1;
  }
  
  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }
`
document.head.appendChild(style)

// Function to show exam created modal with code
function showExamCreatedModal(examTitle, examCode) {
  const modal = document.createElement("div")
  modal.className = "modal-overlay"
  modal.innerHTML = `
    <div class="modal-content exam-created-modal">
      <div class="success-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <h3>Exam Created Successfully!</h3>
      <p><strong>${examTitle}</strong> has been created.</p>
      <div class="exam-code-display">
        <label>Student Access Code:</label>
        <div class="code-box">
          <span class="exam-code">${examCode}</span>
          <button type="button" class="copy-code-btn" onclick="copyExamCode('${examCode}')">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </button>
        </div>
      </div>
      <p class="code-info">Students will use this 4-digit code to access the exam.</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" onclick="closeModalAndRedirect()">
          Back to Dashboard
        </button>
      </div>
    </div>
  `

  document.body.appendChild(modal)
}

// Function to copy exam code to clipboard
function copyExamCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    const copyBtn = document.querySelector(".copy-code-btn")
    const originalHTML = copyBtn.innerHTML
    copyBtn.innerHTML = `
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
    `
    setTimeout(() => {
      copyBtn.innerHTML = originalHTML
    }, 2000)
  })
}

// Function to close modal and redirect
function closeModalAndRedirect() {
  const modal = document.querySelector(".modal-overlay")
  if (modal) {
    modal.remove()
  }
  goBackToDashboard()
}

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
        submitBtn.setAttribute("onclick", "updateExam()")
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
  const extendTimeField = document.getElementById("extend-time")

  if (titleField) titleField.value = examData.title || ""
  if (subjectField) subjectField.value = examData.subject || ""
  if (durationField) durationField.value = examData.duration || ""
  if (instructionsField) instructionsField.value = examData.instructions || ""
  if (timeWarningField) timeWarningField.value = examData.timeWarning || 5
  if (showTimerField) showTimerField.checked = examData.showTimer || false
  if (autoSubmitField) autoSubmitField.checked = examData.autoSubmit || false
  if (extendTimeField) extendTimeField.checked = examData.extendTime || false

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
    case "multiple-choice":
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
                  <input type="radio" name="question_${questionCounter}_correct" value="${index}" ${questionData.correctAnswer === index ? "checked" : ""}>
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
          <input type="text" name="question_${questionCounter}_answer" value="${questionData.correctAnswer || ""}" placeholder="Enter the correct answer" required>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" name="question_${questionCounter}_case_sensitive" ${questionData.caseSensitive ? "checked" : ""}>
            Case Sensitive
          </label>
        </div>
      `
      break

    case "fill-blanks":
      typeSpecificHtml = `
        <div class="form-group">
          <label>Correct Answers (comma-separated):</label>
          <input type="text" name="question_${questionCounter}_answers" value="${questionData.correctAnswers ? questionData.correctAnswers.join(", ") : ""}" placeholder="answer1, answer2, answer3" required>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" name="question_${questionCounter}_case_sensitive" ${questionData.caseSensitive ? "checked" : ""}>
            Case Sensitive
          </label>
        </div>
      `
      break

    case "essay":
      typeSpecificHtml = `
        <div class="form-group">
          <label>Minimum Words:</label>
          <input type="number" name="question_${questionCounter}_min_words" value="${questionData.minWords || 0}" min="0">
        </div>
        <div class="form-group">
          <label>Maximum Words:</label>
          <input type="number" name="question_${questionCounter}_max_words" value="${questionData.maxWords || 0}" min="0">
        </div>
        <div class="form-group">
          <label>Rubric/Grading Criteria:</label>
          <textarea name="question_${questionCounter}_rubric" placeholder="Enter grading criteria...">${questionData.rubric || ""}</textarea>
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
        <option value="multiple-choice" ${questionData.type === "multiple-choice" ? "selected" : ""}>Multiple Choice</option>
        <option value="identification" ${questionData.type === "identification" ? "selected" : ""}>Identification</option>
        <option value="fill-blanks" ${questionData.type === "fill-blanks" ? "selected" : ""}>Fill in Blanks</option>
        <option value="essay" ${questionData.type === "essay" ? "selected" : ""}>Essay</option>
      </select>
    </div>
    <div class="form-group">
      <label>Question Text:</label>
      <textarea name="question_${questionCounter}_text" placeholder="Enter your question here..." required>${questionData.text || ""}</textarea>
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
function updateExam() {
  console.log("[v0] updateExam function called")

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
  const extendTime = document.getElementById("extend-time").checked

  // Validate required fields
  if (!examTitle) {
    alert("Please enter an exam title.")
    document.getElementById("exam-title").focus()
    return
  }

  if (!examDuration || examDuration < 5) {
    alert("Please enter a valid exam duration (minimum 5 minutes).")
    document.getElementById("exam-duration").focus()
    return
  }

  // Collect questions data using same logic as createExam
  const questions = []
  const questionItems = document.querySelectorAll(".question-item")

  questionItems.forEach((questionDiv) => {
    const questionId = questionDiv.dataset.questionId
    const questionType = questionDiv.dataset.questionType
    const questionText = questionDiv.querySelector(`[name="question_${questionId}_text"]`)?.value

    if (!questionText) return

    const questionData = {
      id: questionId,
      type: questionType,
      text: questionText,
      points: Number.parseInt(questionDiv.querySelector(`[name="question_${questionId}_points"]`)?.value) || 1,
    }

    // Add type-specific data
    switch (questionType) {
      case "multiple-choice":
        questionData.options = []
        const correctAnswerInput = questionDiv.querySelector(`[name="question_${questionId}_correct"]:checked`)
        questionData.correctAnswer = correctAnswerInput ? Number.parseInt(correctAnswerInput.value) : 0

        let optionIndex = 0
        let optionInput
        while ((optionInput = questionDiv.querySelector(`[name="question_${questionId}_option_${optionIndex}"]`))) {
          if (optionInput.value.trim()) {
            questionData.options.push(optionInput.value.trim())
          }
          optionIndex++
        }
        break

      case "identification":
        const idAnswer = questionDiv.querySelector(`[name="question_${questionId}_answer"]`)
        questionData.correctAnswer = idAnswer ? idAnswer.value.trim() : ""
        const idCaseSensitive = questionDiv.querySelector(`[name="question_${questionId}_case_sensitive"]`)
        questionData.caseSensitive = idCaseSensitive ? idCaseSensitive.checked : false
        break

      case "fill-blanks":
        const fbAnswers = questionDiv.querySelector(`[name="question_${questionId}_answers"]`)
        questionData.correctAnswers = fbAnswers ? fbAnswers.value.split(",").map((a) => a.trim()) : []
        const fbCaseSensitive = questionDiv.querySelector(`[name="question_${questionId}_case_sensitive"]`)
        questionData.caseSensitive = fbCaseSensitive ? fbCaseSensitive.checked : false
        break

      case "essay":
        const minWords = questionDiv.querySelector(`[name="question_${questionId}_min_words"]`)
        const maxWords = questionDiv.querySelector(`[name="question_${questionId}_max_words"]`)
        const rubric = questionDiv.querySelector(`[name="question_${questionId}_rubric"]`)
        questionData.minWords = minWords ? Number.parseInt(minWords.value) || 0 : 0
        questionData.maxWords = maxWords ? Number.parseInt(maxWords.value) || 0 : 0
        questionData.rubric = rubric ? rubric.value.trim() : ""
        break
    }

    questions.push(questionData)
  })

  // Validate exam has questions
  if (questions.length === 0) {
    alert("Please add at least one question to the exam.")
    return
  }

  const examData = {
    code: originalExam.code, // Keep original exam code
    title: examTitle,
    subject: examSubject,
    instructions: examInstructions,
    duration: examDuration,
    timeWarning: timeWarning,
    showTimer: showTimer,
    autoSubmit: autoSubmit,
    extendTime: extendTime,
    questions: questions,
    createdAt: originalExam.createdAt, // Keep original creation date
    updatedAt: new Date().toISOString(), // Add update timestamp
    status: originalExam.status || "active",
    studentsEnrolled: originalExam.studentsEnrolled || 0,
    completedSubmissions: originalExam.completedSubmissions || 0,
  }

  // Save updated exam data
  const examKey = `exam_${examData.code}`
  localStorage.setItem(examKey, JSON.stringify(examData))

  // Clear editing data
  localStorage.removeItem("editingExam")

  console.log("[v0] Exam updated successfully:", examData)

  alert(`Exam "${examData.title}" has been updated successfully!`)
  window.location.href = "instructor-dashboard.html"
}
