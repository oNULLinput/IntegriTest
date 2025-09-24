// Test script to debug edit exam navigation
console.log("[v0] Testing edit exam navigation...")

// Test URL parameter parsing
const urlParams = new URLSearchParams(window.location.search)
const examCode = urlParams.get("examCode")

console.log("[v0] Current URL:", window.location.href)
console.log("[v0] URL search params:", window.location.search)
console.log("[v0] Extracted exam code:", examCode)

// Test if we're on the correct page
console.log("[v0] Current page:", window.location.pathname)
console.log("[v0] Is edit exam page:", window.location.pathname.includes("edit-exam.html"))

// Test if required elements exist
setTimeout(() => {
  const loadingMessage = document.getElementById("loading-message")
  const editExamForm = document.getElementById("edit-exam-form")
  const questionsContainer = document.getElementById("questions-container")

  console.log("[v0] DOM elements found:")
  console.log("- Loading message:", !!loadingMessage)
  console.log("- Edit exam form:", !!editExamForm)
  console.log("- Questions container:", !!questionsContainer)

  // Test Supabase client
  console.log("[v0] Supabase client available:", !!window.supabaseClient)

  if (window.supabaseClient) {
    console.log("[v0] Testing database connection...")
    window.supabaseClient
      .from("exams")
      .select("count")
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.error("[v0] Database test failed:", error)
        } else {
          console.log("[v0] Database test successful:", data)
        }
      })
  }
}, 1000)
