import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkExamData() {
  try {
    console.log("[v0] Connecting to Supabase...")
    console.log("[v0] URL:", supabaseUrl)

    // Get all exams
    const { data: exams, error } = await supabase.from("exams").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching exams:", error)
      return
    }

    console.log("[v0] Found", exams.length, "exams")

    // Check each exam's questions data
    exams.forEach((exam, index) => {
      console.log(`\n[v0] === EXAM ${index + 1} ===`)
      console.log("[v0] Title:", exam.title)
      console.log("[v0] Code:", exam.exam_code)
      console.log("[v0] Created:", exam.created_at)

      if (exam.questions) {
        console.log("[v0] Questions data structure:")
        console.log(JSON.stringify(exam.questions, null, 2))

        // Check if questions have correct answers
        if (Array.isArray(exam.questions)) {
          exam.questions.forEach((question, qIndex) => {
            console.log(`\n[v0] Question ${qIndex + 1}:`)
            console.log("[v0] Type:", question.type)
            console.log("[v0] Text:", question.text)
            console.log("[v0] Correct Answer:", question.correctAnswer)

            if (question.options) {
              console.log("[v0] Options:", question.options)
            }
          })
        }
      } else {
        console.log("[v0] No questions data found!")
      }
    })
  } catch (error) {
    console.error("[v0] Script error:", error)
  }
}

checkExamData()
