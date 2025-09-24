// Edit exam state
let currentExam = null
let questionCount = 0

// DOM elements
const loadingMessage = document.getElementById("loading-message")
const editExamForm = document.getElementById("edit-exam-form")
const examTitleInput = document.getElementById("exam-title")
const examDurationInput = document.getElementById("exam-duration")
const questionsContainer = document.getElementById("questions-container")

// Initialize edit exam page
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    initializeEditExam()
  }, 1000)
})

async function initializeEditExam() {
  // Get exam code from URL
  const urlParams = new URLSearchParams(window.location.search)
  const examCode = urlParams.get("examCode")

  console.log("[v0] Edit exam initialized with code:", examCode)

  if (!examCode) {
    alert("No exam code provided")
    window.location.href = "instructor-dashboard.html"
    return
  }

  if (!window.supabaseClient) {
    console.log("[v0] Waiting for Supabase client to load...")
    let retries = 0
    while (!window.supabaseClient && retries < 30) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      retries++
      console.log("[v0] Retry", retries, "- Supabase client available:", !!window.supabaseClient)
    }

    if (!window.supabaseClient) {
      loadingMessage.innerHTML = `
        <div style="text-align: center; color: #dc2626;">
          <p>Database connection failed. Please refresh the page.</p>
          <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      `
      return
    }
  }

  try {
    console.log("[v0] Testing database connection...")
    const { data: testData, error: testError } = await window.supabaseClient.from("exams").select("count").limit(1)

    if (testError) {
      console.error("[v0] Database connection test failed:", testError)
      throw new Error("Database connection failed: " + testError.message)
    }
    console.log("[v0] Database connection test successful")
  } catch (error) {
    console.error("[v0] Database connection error:", error)
    loadingMessage.innerHTML = `
      <div style="text-align: center; color: #dc2626;">
        <p>Database connection error: ${error.message}</p>
        <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Retry
        </button>
      </div>
    `
    return
  }

  try {
    await loadExamData(examCode)
  } catch (error) {
    console.error("[v0] Error initializing edit exam:", error)
    loadingMessage.innerHTML = `
      <div style="text-align: center; color: #dc2626;">
        <p>Error loading exam: ${error.message}</p>
        <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Retry
        </button>
      </div>
    `
  }
}

async function loadExamData(examCode) {
  try {
    console.log("[v0] Fetching exam data from database for code:", examCode)

    if (!window.supabaseClient) {
      console.error("[v0] Supabase client not available when trying to load exam data")
      throw new Error("Database connection not available")
    }

    console.log("[v0] Supabase client is available, making database query...")

    const { data: exam, error } = await window.supabaseClient
      .from("exams")
      .select("*")
      .eq("exam_code", examCode)
      .single()

    console.log("[v0] Database query result:", { data: exam, error })

    if (error) {
      console.error("[v0] Supabase error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw new Error("Failed to load exam data: " + error.message)
    }

    if (!exam) {
      throw new Error("Exam not found")
    }

    currentExam = exam
    console.log("[v0] Exam loaded successfully:", exam.title)
    console.log("[v0] Raw questions data:", exam.questions)
    console.log("[v0] Questions found:", exam.questions?.length || 0)

    if (exam.questions && Array.isArray(exam.questions)) {
      exam.questions = exam.questions.map((q, index) => {
        console.log(`[v0] ===== PROCESSING QUESTION ${index + 1} =====`)
        console.log(`[v0] Raw question data:`, q)
        console.log(`[v0] Question keys:`, Object.keys(q))

        // Handle different possible field names for question text
        const questionText = q.question_text || q.question || q.text || `Question ${index + 1}`
        console.log(`[v0] Question text found:`, questionText)

        // Handle different possible field names for question type
        const questionType = q.question_type || q.type || "multiple-choice"
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

        // Enhanced options handling for multiple choice questions
        let options = []
        console.log(`[v0] Looking for options in:`, {
          options: q.options,
          choices: q.choices,
          answers: q.answers,
        })

        if (questionType === "multiple-choice" || questionType === "multiple_choice") {
          if (q.options && Array.isArray(q.options)) {
            // Handle array of option objects or strings
            options = q.options.map((opt, optIndex) => {
              if (typeof opt === "object" && opt !== null) {
                // Extract text from option object
                return opt.option_text || opt.text || opt.value || opt.label || `Option ${optIndex + 1}`
              } else if (typeof opt === "string") {
                return opt.trim()
              } else {
                return String(opt).trim() || `Option ${optIndex + 1}`
              }
            })
            console.log(`[v0] Processed options from array:`, options)
          } else if (q.choices && Array.isArray(q.choices)) {
            options = q.choices.map((choice, optIndex) => {
              if (typeof choice === "object" && choice !== null) {
                return choice.text || choice.value || choice.label || `Option ${optIndex + 1}`
              } else {
                return String(choice).trim() || `Option ${optIndex + 1}`
              }
            })
            console.log(`[v0] Using q.choices:`, options)
          } else {
            // Fallback: create default options if none found
            options = ["Option A", "Option B", "Option C", "Option D"]
            console.log(`[v0] Using fallback options:`, options)
          }
        }

        const mappedQuestion = {
          question: questionText,
          type: questionType,
          correctAnswer: correctAnswer,
          options: options,
          rubric: q.rubric || q.correct_answer,
          points: q.points || 1,
        }

        // Special handling for True/False questions
        if (mappedQuestion.type === "true-false") {
          console.log(`[v0] True/False question detected:`, {
            originalCorrectAnswer: q.correct_answer,
            mappedCorrectAnswer: mappedQuestion.correctAnswer,
            questionText: mappedQuestion.question,
          })

          // Ensure correct answer is properly formatted for True/False
          if (mappedQuestion.correctAnswer && typeof mappedQuestion.correctAnswer === "string") {
            // Normalize the answer to proper case
            const normalizedAnswer = mappedQuestion.correctAnswer.toLowerCase()
            if (normalizedAnswer === "true" || normalizedAnswer === "1" || normalizedAnswer === "yes") {
              mappedQuestion.correctAnswer = "True"
            } else if (normalizedAnswer === "false" || normalizedAnswer === "0" || normalizedAnswer === "no") {
              mappedQuestion.correctAnswer = "False"
            }
          }
        }

        console.log(`[v0] NORMALIZED QUESTION ${index + 1}:`, mappedQuestion)
        console.log(`[v0] Options count:`, mappedQuestion.options.length)
        console.log(`[v0] ===== END QUESTION ${index + 1} =====`)
        return mappedQuestion
      })

      console.log("[v0] Mapped questions to expected format:", exam.questions)
    }

    if (examTitleInput) {
      examTitleInput.value = exam.title || ""
      console.log("[v0] Title populated:", exam.title)
    }

    if (examDurationInput) {
      examDurationInput.value = exam.duration || 60
      console.log("[v0] Duration populated:", exam.duration)
    }

    // Clear existing questions
    questionsContainer.innerHTML = ""
    questionCount = 0

    // Load questions
    if (exam.questions && Array.isArray(exam.questions) && exam.questions.length > 0) {
      console.log("[v0] Loading", exam.questions.length, "questions")
      exam.questions.forEach((question, index) => {
        console.log(`[v0] Processing question ${index + 1}:`, question)
        addQuestion(question, index, question.type)
      })
    } else {
      console.log("[v0] No questions found, adding empty question")
      // Add one empty question if no questions exist
      addQuestion()
    }

    loadingMessage.style.display = "none"
    editExamForm.style.display = "block"
    editExamForm.style.opacity = "1"

    // Setup form submission
    editExamForm.removeEventListener("submit", handleFormSubmit)
    editExamForm.addEventListener("submit", handleFormSubmit)

    console.log("[v0] Edit form is now ready for editing")
    console.log("[v0] Form visible:", editExamForm.style.display)
    console.log("[v0] Questions container children:", questionsContainer.children.length)

    setTimeout(() => {
      verifyCorrectAnswersDisplayed()
      setTimeout(() => {
        console.log("[v0] Final verification of loaded answers...")
        verifyCorrectAnswersDisplayed()
      }, 1000)
    }, 500)
  } catch (error) {
    console.error("[v0] Error loading exam data:", error)
    throw error
  }
}

function verifyCorrectAnswersDisplayed() {
  console.log("[v0] Verifying correct answers are displayed...")

  const questionCards = questionsContainer.querySelectorAll(".question-card")
  questionCards.forEach((card, index) => {
    const questionType = card.dataset.questionType
    const questionIndex = Number.parseInt(card.dataset.questionIndex)

    console.log(`[v0] Verifying question ${index + 1} (type: ${questionType})`)

    if (questionType === "multiple-choice" || questionType === "true-false") {
      const checkedRadio = card.querySelector('input[type="radio"]:checked')
      if (checkedRadio) {
        console.log(`[v0] ✓ Question ${index + 1} has checked radio:`, checkedRadio.value)
        // Ensure visual feedback is applied
        const label = checkedRadio.closest(".option-label")
        if (label && !label.classList.contains("correct-answer-selected")) {
          label.classList.add("correct-answer-selected")
          label.style.backgroundColor = "#f0f9ff"
          label.style.borderColor = "#0ea5e9"
          label.style.boxShadow = "0 0 0 3px rgba(14, 165, 233, 0.1)"
          console.log(`[v0] Applied visual feedback to question ${index + 1}`)
        }
      } else {
        console.log(`[v0] ✗ Question ${index + 1} has no checked radio`)
      }
    } else if (questionType === "identification" || questionType === "fill-blanks") {
      const textInput = card.querySelector(
        questionType === "identification" ? ".identification-answer" : ".fill-blanks-answer",
      )
      if (textInput && textInput.value) {
        console.log(`[v0] ✓ Question ${index + 1} has text answer:`, textInput.value)
        // Ensure visual feedback is applied
        if (textInput.style.backgroundColor !== "rgb(240, 249, 255)") {
          textInput.style.backgroundColor = "#f0f9ff"
          textInput.style.borderColor = "#0ea5e9"
          console.log(`[v0] Applied visual feedback to question ${index + 1}`)
        }
      } else {
        console.log(`[v0] ✗ Question ${index + 1} has no text answer`)
      }
    }
  })
}

function addQuestion(questionData = null, index = null, questionType = null) {
  questionCount++
  const questionIndex = index !== null ? index : questionCount - 1

  // Determine question type from data or parameter
  const type = questionType || questionData?.type || "multiple-choice"

  console.log("[v0] Adding question", questionIndex + 1, questionData ? "with data" : "empty", "type:", type)
  if (questionData) {
    console.log("[v0] Question data:", {
      question: questionData.question,
      type: questionData.type,
      correctAnswer: questionData.correctAnswer,
      options: questionData.options,
      hasData: !!questionData.question,
    })
  }

  const questionDiv = document.createElement("div")
  questionDiv.className = "question-card"
  questionDiv.dataset.questionIndex = questionIndex
  questionDiv.dataset.questionType = type

  const questionHTML = `
    <div class="question-header">
      <h3 class="question-title">Question ${questionIndex + 1}</h3>
      <div class="question-type-controls">
        <div class="question-type-selector">
          <label for="question-type-${questionIndex}" class="form-label">Type:</label>
          <select id="question-type-${questionIndex}" class="form-select question-type-select" onchange="changeQuestionType(${questionIndex}, this.value)">
            <option value="multiple-choice" ${type === "multiple-choice" ? "selected" : ""}>Multiple Choice</option>
            <option value="identification" ${type === "identification" ? "selected" : ""}>Identification</option>
            <option value="fill-blanks" ${type === "fill-blanks" ? "selected" : ""}>Fill in Blanks</option>
            <option value="true-false" ${type === "true-false" ? "selected" : ""}>True/False</option>
            <option value="essay" ${type === "essay" ? "selected" : ""}>Essay</option>
          </select>
        </div>
        <div class="question-type-indicator">
          <span class="type-badge type-${type}">${getQuestionTypeLabel(type)}</span>
        </div>
      </div>
      <button type="button" class="btn btn-delete btn-sm" onclick="removeQuestion(${questionIndex})">
        <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
        Remove
      </button>
    </div>

    <div class="form-group">
      <label class="form-label">Question Text</label>
      <textarea class="form-input question-text" rows="3" required placeholder="Enter your question here...">${questionData?.question || ""}</textarea>
      ${questionData?.question ? '<small class="form-help" style="color: #059669; font-weight: 500;">✓ Loaded existing question text</small>' : ""}
    </div>
    
    <div class="question-options-container">
      <!-- Options will be populated by renderQuestionOptions -->
    </div>
  `

  questionDiv.innerHTML = questionHTML
  questionsContainer.appendChild(questionDiv)

  renderQuestionOptions(questionIndex, type, questionData)

  console.log("[v0] Question", questionIndex + 1, "added to container with type:", type)
}

function changeQuestionType(questionIndex, newType) {
  console.log("[v0] Changing question", questionIndex + 1, "type to:", newType)

  const questionCard = document.querySelector(`[data-question-index="${questionIndex}"]`)
  if (!questionCard) return

  // Update the question type in the dataset
  questionCard.dataset.questionType = newType

  // Update the type badge
  const typeBadge = questionCard.querySelector(".type-badge")
  if (typeBadge) {
    typeBadge.className = `type-badge type-${newType}`
    typeBadge.textContent = getQuestionTypeLabel(newType)
  }

  // Re-render the question options for the new type
  renderQuestionOptions(questionIndex, newType)
}

function renderQuestionOptions(questionIndex, type, questionData = null) {
  const questionCard = document.querySelector(`[data-question-index="${questionIndex}"]`)
  if (!questionCard) return

  const optionsContainer = questionCard.querySelector(".question-options-container")
  if (!optionsContainer) return

  console.log(`[v0] Rendering options for question ${questionIndex + 1}:`, {
    type,
    hasQuestionData: !!questionData,
    correctAnswer: questionData?.correctAnswer,
    options: questionData?.options,
    fullQuestionData: questionData,
  })

  let optionsHTML = ""

  switch (type) {
    case "multiple-choice":
      const hasOptions = questionData?.options && questionData.options.length > 0
      optionsHTML = `
        <div class="form-group">
          <label class="form-label">Answer Options</label>
          ${hasOptions ? '<small class="form-help" style="color: #059669; font-weight: 500;">✓ Loaded existing answer options</small>' : ""}
          <div class="options-container">
            ${["A", "B", "C", "D"]
              .map((letter, optionIndex) => {
                const isCorrect = questionData?.correctAnswer === letter
                console.log(
                  `[v0] Option ${letter}: isCorrect=${isCorrect}, correctAnswer=${questionData?.correctAnswer}`,
                )
                return `
              <div class="option-group">
                <label class="option-label ${isCorrect ? "correct-answer-selected" : ""}" style="${isCorrect ? "background-color: #dcfce7; border: 2px solid #16a34a; box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);" : ""}">
                  <input type="radio" name="correct-answer-${questionIndex}" value="${letter}" 
                         ${isCorrect ? 'checked="checked"' : ""} required />
                  <span class="option-letter">${letter}</span>
                  ${isCorrect ? '<span class="correct-indicator" style="color: #16a34a; font-weight: bold; margin-left: 8px;">✓ CORRECT ANSWER</span>' : ""}
                </label>
                <input type="text" class="form-input option-text" placeholder="Option ${letter}" 
                       value="${questionData?.options?.[optionIndex] || ""}" required 
                       style="${isCorrect ? "border-color: #16a34a; background-color: #f0fdf4;" : ""}" />
              </div>
            `
              })
              .join("")}
          </div>
        </div>
      `
      break

    case "true-false":
      const hasTFAnswer = questionData?.correctAnswer
      const isTrueCorrect = questionData?.correctAnswer === "True"
      const isFalseCorrect = questionData?.correctAnswer === "False"
      console.log(
        `[v0] True/False answer: ${questionData?.correctAnswer}, isTrueCorrect=${isTrueCorrect}, isFalseCorrect=${isFalseCorrect}`,
      )
      optionsHTML = `
        <div class="form-group">
          <label class="form-label">Correct Answer</label>
          ${hasTFAnswer ? '<small class="form-help" style="color: #059669; font-weight: 500;">✓ Loaded existing correct answer</small>' : ""}
          <div class="true-false-options">
            <label class="option-label ${isTrueCorrect ? "correct-answer-selected" : ""}" style="${isTrueCorrect ? "background-color: #dcfce7; border: 2px solid #16a34a; box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);" : ""}">
              <input type="radio" name="correct-answer-${questionIndex}" value="True" 
                     ${isTrueCorrect ? 'checked="checked"' : ""} required />
              <span>True</span>
              ${isTrueCorrect ? '<span class="correct-indicator" style="color: #16a34a; font-weight: bold; margin-left: 8px;">✓ CORRECT ANSWER</span>' : ""}
            </label>
            <label class="option-label ${isFalseCorrect ? "correct-answer-selected" : ""}" style="${isFalseCorrect ? "background-color: #dcfce7; border: 2px solid #16a34a; box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);" : ""}">
              <input type="radio" name="correct-answer-${questionIndex}" value="False" 
                     ${isFalseCorrect ? 'checked="checked"' : ""} required />
              <span>False</span>
              ${isFalseCorrect ? '<span class="correct-indicator" style="color: #16a34a; font-weight: bold; margin-left: 8px;">✓ CORRECT ANSWER</span>' : ""}
            </label>
          </div>
        </div>
      `
      break

    case "identification":
      const hasIdAnswer = questionData?.correctAnswer
      console.log(`[v0] Identification answer: "${questionData?.correctAnswer}"`)
      optionsHTML = `
        <div class="form-group">
          <label class="form-label">Correct Answer</label>
          ${hasIdAnswer ? '<small class="form-help" style="color: #059669; font-weight: 500;">✓ Loaded existing correct answer</small>' : ""}
          <div class="correct-answer-container" style="${hasIdAnswer ? "background-color: #dcfce7; padding: 12px; border-radius: 8px; border: 2px solid #16a34a;" : ""}">
            ${hasIdAnswer ? '<div class="correct-answer-label" style="color: #16a34a; font-weight: bold; margin-bottom: 8px;">✓ CORRECT ANSWER:</div>' : ""}
            <input type="text" class="form-input identification-answer" placeholder="Enter the correct answer" 
                   value="${questionData?.correctAnswer || ""}" required 
                   style="${hasIdAnswer ? "background-color: #f0fdf4; border-color: #16a34a; font-weight: 500;" : ""}" />
          </div>
        </div>
      `
      break

    case "fill-blanks":
      const hasFBAnswer = questionData?.correctAnswer
      console.log(`[v0] Fill-blanks answer: "${questionData?.correctAnswer}"`)
      optionsHTML = `
        <div class="form-group">
          <label class="form-label">Correct Answer</label>
          ${hasFBAnswer ? '<small class="form-help" style="color: #059669; font-weight: 500;">✓ Loaded existing correct answer</small>' : ""}
          <div class="correct-answer-container" style="${hasFBAnswer ? "background-color: #dcfce7; padding: 12px; border-radius: 8px; border: 2px solid #16a34a;" : ""}">
            ${hasFBAnswer ? '<div class="correct-answer-label" style="color: #16a34a; font-weight: bold; margin-bottom: 8px;">✓ CORRECT ANSWER:</div>' : ""}
            <input type="text" class="form-input fill-blanks-answer" placeholder="Enter the word/phrase that fills the blank" 
                   value="${questionData?.correctAnswer || ""}" required 
                   style="${hasFBAnswer ? "background-color: #f0fdf4; border-color: #16a34a; font-weight: 500;" : ""}" />
          </div>
          <small class="form-help">Use underscores (_____) in your question text to indicate where the blank should be.</small>
        </div>
      `
      break

    case "essay":
      const hasEssayRubric = questionData?.rubric || questionData?.correctAnswer
      optionsHTML = `
        <div class="form-group">
          <label class="form-label">Sample Answer / Rubric</label>
          ${hasEssayRubric ? '<small class="form-help" style="color: #059669; font-weight: 500;">✓ Loaded existing rubric/answer</small>' : ""}
          <div class="correct-answer-container" style="${hasEssayRubric ? "background-color: #dcfce7; padding: 12px; border-radius: 8px; border: 2px solid #16a34a;" : ""}">
            ${hasEssayRubric ? '<div class="correct-answer-label" style="color: #16a34a; font-weight: bold; margin-bottom: 8px;">✓ SAMPLE ANSWER/RUBRIC:</div>' : ""}
            <textarea class="form-input essay-rubric" rows="4" placeholder="Provide a sample answer or grading rubric for this essay question..." 
                      style="${hasEssayRubric ? "background-color: #f0fdf4; border-color: #16a34a;" : ""}">${questionData?.rubric || questionData?.correctAnswer || ""}</textarea>
          </div>
          <small class="form-help">This will help with grading consistency.</small>
        </div>
      `
      break
  }

  optionsContainer.innerHTML = optionsHTML

  setTimeout(() => {
    addVisualFeedbackListeners(questionIndex, type, optionsContainer)
    applyCorrectAnswerWithRetries(questionIndex, type, questionData, 0)
  }, 100)

  console.log(`[v0] Question ${questionIndex + 1} options updated for type: ${type}`)
  if (questionData?.correctAnswer) {
    console.log(`[v0] Correct answer "${questionData.correctAnswer}" should now be visible`)
  }
}

function applyCorrectAnswerWithRetries(questionIndex, type, questionData, attempt) {
  if (!questionData?.correctAnswer || attempt >= 5) {
    if (attempt >= 5) {
      console.warn(`[v0] Failed to apply correct answer after ${attempt} attempts for question ${questionIndex + 1}`)
    }
    return
  }

  const card = document.querySelector(`[data-question-index="${questionIndex}"]`)
  if (!card) {
    console.warn(`[v0] Question card not found for index ${questionIndex}`)
    return
  }

  console.log(`[v0] Attempt ${attempt + 1} to apply correct answer for question ${questionIndex + 1}`)

  let success = false

  if (type === "multiple-choice" || type === "true-false") {
    const correctRadio = card.querySelector(`input[value="${questionData.correctAnswer}"]`)
    if (correctRadio && !correctRadio.checked) {
      console.log(`[v0] Applying radio selection: ${questionData.correctAnswer}`)
      correctRadio.checked = true
      correctRadio.dispatchEvent(new Event("change", { bubbles: true }))

      const label = correctRadio.closest(".option-label")
      if (label) {
        label.classList.add("correct-answer-selected")
        label.style.backgroundColor = "#dcfce7"
        label.style.border = "2px solid #16a34a"
        label.style.boxShadow = "0 0 0 3px rgba(22, 165, 233, 0.1)"

        // Add correct indicator if not present
        if (!label.querySelector(".correct-indicator")) {
          const indicator = document.createElement("span")
          indicator.className = "correct-indicator"
          indicator.style.cssText = "color: #16a34a; font-weight: bold; margin-left: 8px;"
          indicator.textContent = "✓ CORRECT ANSWER"
          label.appendChild(indicator)
        }
      }
      success = true
    } else if (correctRadio && correctRadio.checked) {
      success = true
    }
  } else if (type === "identification" || type === "fill-blanks") {
    const textInput = card.querySelector(type === "identification" ? ".identification-answer" : ".fill-blanks-answer")
    if (textInput && textInput.value !== questionData.correctAnswer) {
      console.log(`[v0] Applying text answer: ${questionData.correctAnswer}`)
      textInput.value = questionData.correctAnswer
      textInput.dispatchEvent(new Event("input", { bubbles: true }))

      textInput.style.backgroundColor = "#f0fdf4"
      textInput.style.borderColor = "#16a34a"
      textInput.style.fontWeight = "500"

      const container = textInput.closest(".correct-answer-container") || textInput.parentElement
      container.style.backgroundColor = "#dcfce7"
      container.style.padding = "12px"
      container.style.borderRadius = "8px"
      container.style.border = "2px solid #16a34a"

      // Add correct answer label if not present
      if (!container.querySelector(".correct-answer-label")) {
        const label = document.createElement("div")
        label.className = "correct-answer-label"
        label.style.cssText = "color: #16a34a; font-weight: bold; margin-bottom: 8px;"
        label.textContent = "✓ CORRECT ANSWER:"
        container.insertBefore(label, textInput)
      }
      success = true
    } else if (textInput && textInput.value === questionData.correctAnswer) {
      success = true
    }
  } else if (type === "essay") {
    const textArea = card.querySelector(".essay-rubric")
    if (textArea && textArea.value !== (questionData.rubric || questionData.correctAnswer)) {
      console.log(`[v0] Applying essay rubric`)
      textArea.value = questionData.rubric || questionData.correctAnswer
      success = true
    } else if (textArea && textArea.value === (questionData.rubric || questionData.correctAnswer)) {
      success = true
    }
  }

  if (!success && attempt < 4) {
    console.log(`[v0] Retrying in 300ms (attempt ${attempt + 1})`)
    setTimeout(() => {
      applyCorrectAnswerWithRetries(questionIndex, type, questionData, attempt + 1)
    }, 300)
  } else if (success) {
    console.log(`[v0] ✓ Successfully applied correct answer for question ${questionIndex + 1}`)
  }
}

function addVisualFeedbackListeners(questionIndex, type, optionsContainer) {
  if (type === "multiple-choice" || type === "true-false") {
    const allRadios = optionsContainer.querySelectorAll(`input[name="correct-answer-${questionIndex}"]`)

    allRadios.forEach((radio) => {
      radio.addEventListener("change", function () {
        // Remove highlighting from all options
        allRadios.forEach((r) => {
          const label = r.closest(".option-label")
          if (label) {
            label.classList.remove("correct-answer-selected")
            label.style.backgroundColor = ""
            label.style.borderColor = ""
            label.style.boxShadow = ""
            // Remove correct indicator
            const indicator = label.querySelector(".correct-indicator")
            if (indicator) indicator.remove()
          }
        })

        // Add highlighting to selected option
        if (this.checked) {
          const thisLabel = this.closest(".option-label")
          if (thisLabel) {
            thisLabel.classList.add("correct-answer-selected")
            thisLabel.style.backgroundColor = "#dcfce7"
            thisLabel.style.border = "2px solid #16a34a"
            thisLabel.style.boxShadow = "0 0 0 3px rgba(22, 165, 233, 0.1)"

            // Add correct indicator
            const indicator = document.createElement("span")
            indicator.className = "correct-indicator"
            indicator.style.cssText = "color: #16a34a; font-weight: bold; margin-left: 8px;"
            indicator.textContent = "✓ CORRECT ANSWER"
            thisLabel.appendChild(indicator)
          }
        }
      })
    })
  } else if (type === "identification" || type === "fill-blanks") {
    const textInput = optionsContainer.querySelector(
      type === "identification" ? ".identification-answer" : ".fill-blanks-answer",
    )

    if (textInput) {
      textInput.addEventListener("input", function () {
        const container = this.closest(".correct-answer-container") || this.parentElement
        const label = container.querySelector(".correct-answer-label")

        if (this.value.trim()) {
          this.style.backgroundColor = "#f0fdf4"
          this.style.borderColor = "#16a34a"
          this.style.fontWeight = "500"
          container.style.backgroundColor = "#dcfce7"
          container.style.padding = "12px"
          container.style.borderRadius = "8px"
          container.style.border = "2px solid #16a34a"

          if (!label) {
            const newLabel = document.createElement("div")
            newLabel.className = "correct-answer-label"
            newLabel.style.cssText = "color: #16a34a; font-weight: bold; margin-bottom: 8px;"
            newLabel.textContent = "✓ CORRECT ANSWER:"
            container.insertBefore(newLabel, this)
          }
        } else {
          this.style.backgroundColor = ""
          this.style.borderColor = ""
          this.style.fontWeight = ""
          container.style.backgroundColor = ""
          container.style.padding = ""
          container.style.borderRadius = ""
          container.style.border = ""

          if (label) label.remove()
        }
      })
    }
  }
}

function removeQuestion(questionIndex) {
  const questionCard = document.querySelector(`[data-question-index="${questionIndex}"]`)
  if (questionCard) {
    questionCard.remove()
    updateQuestionNumbers()
  }
}

function updateQuestionNumbers() {
  const questionCards = questionsContainer.querySelectorAll(".question-card")
  questionCards.forEach((card, index) => {
    card.dataset.questionIndex = index
    const title = card.querySelector(".question-title")
    if (title) {
      title.textContent = `Question ${index + 1}`
    }

    const typeSelect = card.querySelector(".question-type-select")
    if (typeSelect) {
      typeSelect.id = `question-type-${index}`
      typeSelect.setAttribute("onchange", `changeQuestionType(${index}, this.value)`)
    }

    // Update radio button names
    const radioButtons = card.querySelectorAll('input[type="radio"]')
    radioButtons.forEach((radio) => {
      radio.name = `correct-answer-${index}`
    })

    // Update remove button onclick
    const removeBtn = card.querySelector(".btn-delete")
    if (removeBtn) {
      removeBtn.setAttribute("onclick", `removeQuestion(${index})`)
    }
  })
}

async function handleFormSubmit(event) {
  event.preventDefault()

  console.log("[v0] Saving exam changes...")

  try {
    // Collect form data
    const title = examTitleInput.value.trim()
    const duration = Number.parseInt(examDurationInput.value)

    if (!title || !duration) {
      alert("Please fill in all required fields")
      return
    }

    // Collect questions
    const questions = []
    const questionCards = questionsContainer.querySelectorAll(".question-card")

    console.log("[v0] Processing", questionCards.length, "questions")

    for (let i = 0; i < questionCards.length; i++) {
      const card = questionCards[i]
      const questionType = card.dataset.questionType || "multiple-choice"
      const questionText = card.querySelector(".question-text").value.trim()

      if (!questionText) {
        alert(`Please enter question text for Question ${i + 1}`)
        return
      }

      const questionObj = {
        question_text: questionText,
        question_type: questionType,
        points: 1,
      }

      // Handle different question types
      switch (questionType) {
        case "multiple-choice":
          const options = Array.from(card.querySelectorAll(".option-text")).map((input) => input.value.trim())
          const correctAnswer = card.querySelector('input[type="radio"]:checked')?.value

          if (options.some((opt) => !opt) || !correctAnswer) {
            alert(`Please complete all options and select correct answer for Question ${i + 1}`)
            return
          }

          questionObj.options = options
          questionObj.correct_answer = correctAnswer
          break

        case "true-false":
          const tfAnswer = card.querySelector('input[type="radio"]:checked')?.value
          if (!tfAnswer) {
            alert(`Please select correct answer for Question ${i + 1}`)
            return
          }
          questionObj.correct_answer = tfAnswer
          break

        case "identification":
          const idAnswer = card.querySelector(".identification-answer").value.trim()
          if (!idAnswer) {
            alert(`Please enter correct answer for Question ${i + 1}`)
            return
          }
          questionObj.correct_answer = idAnswer
          break

        case "fill-blanks":
          const fbAnswer = card.querySelector(".fill-blanks-answer").value.trim()
          if (!fbAnswer) {
            alert(`Please enter correct answer for Question ${i + 1}`)
            return
          }
          questionObj.correct_answer = fbAnswer
          break

        case "essay":
          const essayRubric = card.querySelector(".essay-rubric").value.trim()
          questionObj.correct_answer = essayRubric
          break
      }

      questions.push(questionObj)
    }

    if (questions.length === 0) {
      return
    }

    console.log("[v0] Updating exam with", questions.length, "questions")
    console.log("[v0] Questions data structure:", questions)

    // Update exam in database
    const { error } = await window.supabaseClient
      .from("exams")
      .update({
        title: title,
        duration: duration,
        questions: questions,
        updated_at: new Date().toISOString(),
      })
      .eq("exam_code", currentExam.exam_code)

    if (error) {
      console.error("[v0] Error updating exam:", error)
      alert("Failed to save changes: " + error.message)
      return
    }

    console.log("[v0] Exam updated successfully")
    alert("Exam updated successfully!")

    window.location.href = "instructor-dashboard.html"
  } catch (error) {
    console.error("[v0] Error saving exam:", error)
    alert("An error occurred while saving: " + error.message)
  }
}

// Helper function to get question type labels
function getQuestionTypeLabel(type) {
  const labels = {
    "multiple-choice": "Multiple Choice",
    "true-false": "True/False",
    identification: "Identification",
    "fill-blanks": "Fill in Blanks",
    essay: "Essay",
  }
  return labels[type] || "Multiple Choice"
}

console.log("[v0] Edit exam script loaded successfully")
