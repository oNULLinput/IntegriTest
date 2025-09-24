// System Integration Manager for IntegriTest
// Ensures all components work together seamlessly

class IntegriTestSystem {
  constructor() {
    this.supabaseClient = null
    this.currentUser = null
    this.systemStatus = {
      database: false,
      authentication: false,
      realtime: false,
      monitoring: false,
    }
  }

  // Initialize the entire system
  async initialize() {
    console.log("[v0] Initializing IntegriTest System...")

    try {
      // Initialize Supabase connection
      await this.initializeDatabase()

      // Check authentication state
      await this.checkAuthenticationState()

      // Setup real-time subscriptions if authenticated
      if (this.currentUser) {
        await this.setupRealtimeConnections()
      }

      // Initialize monitoring systems
      await this.initializeMonitoring()

      console.log("[v0] System initialization completed successfully")
      return true
    } catch (error) {
      console.error("[v0] System initialization failed:", error)
      return false
    }
  }

  // Initialize database connection
  async initializeDatabase() {
    try {
      if (!window.createSupabaseClient) {
        throw new Error("Supabase client not available")
      }

      this.supabaseClient = window.createSupabaseClient()

      // Test database connection
      const { data, error } = await this.supabaseClient.from("instructors").select("count").limit(1)

      if (error && !error.message.includes("relation") && !error.message.includes("does not exist")) {
        throw error
      }

      this.systemStatus.database = true
      console.log("[v0] Database connection established")
    } catch (error) {
      console.error("[v0] Database initialization failed:", error)
      this.systemStatus.database = false
      throw error
    }
  }

  // Check current authentication state
  async checkAuthenticationState() {
    try {
      const instructorSession = localStorage.getItem("instructorSession")
      const studentInfo = localStorage.getItem("studentInfo")

      if (instructorSession) {
        try {
          const session = JSON.parse(instructorSession)
          if (session.isAuthenticated && session.id) {
            this.currentUser = {
              type: "instructor",
              ...session,
            }
            this.systemStatus.authentication = true
            console.log("[v0] Instructor authentication verified")
          }
        } catch (parseError) {
          console.error("[v0] Invalid instructor session data")
          localStorage.removeItem("instructorSession")
        }
      } else if (studentInfo) {
        try {
          const student = JSON.parse(studentInfo)
          if (student.studentNumber && student.examCode) {
            this.currentUser = {
              type: "student",
              ...student,
            }
            this.systemStatus.authentication = true
            console.log("[v0] Student authentication verified")
          }
        } catch (parseError) {
          console.error("[v0] Invalid student session data")
          localStorage.removeItem("studentInfo")
        }
      }
    } catch (error) {
      console.error("[v0] Authentication state check failed:", error)
      this.systemStatus.authentication = false
    }
  }

  // Setup real-time connections based on user type
  async setupRealtimeConnections() {
    if (!this.supabaseClient || !this.currentUser) {
      return
    }

    try {
      if (this.currentUser.type === "instructor") {
        await this.setupInstructorRealtimeConnections()
      } else if (this.currentUser.type === "student") {
        await this.setupStudentRealtimeConnections()
      }

      this.systemStatus.realtime = true
      console.log("[v0] Real-time connections established")
    } catch (error) {
      console.error("[v0] Real-time setup failed:", error)
      this.systemStatus.realtime = false
    }
  }

  // Setup instructor-specific real-time connections
  async setupInstructorRealtimeConnections() {
    // Subscribe to exam sessions for real-time student monitoring
    const examSessionsChannel = this.supabaseClient
      .channel("instructor-exam-sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "exam_sessions",
        },
        (payload) => {
          console.log("[v0] Exam session change detected:", payload)
          this.handleExamSessionChange(payload)
        },
      )
      .subscribe()

    // Subscribe to exam changes
    const examsChannel = this.supabaseClient
      .channel("instructor-exams")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "exams",
          filter: `instructor_id=eq.${this.currentUser.id}`,
        },
        (payload) => {
          console.log("[v0] Exam change detected:", payload)
          this.handleExamChange(payload)
        },
      )
      .subscribe()
  }

  // Setup student-specific real-time connections
  async setupStudentRealtimeConnections() {
    // Students don't need as many real-time connections
    // Just basic session monitoring
    console.log("[v0] Student real-time connections minimal setup")
  }

  // Initialize monitoring systems
  async initializeMonitoring() {
    try {
      // Setup performance monitoring
      this.setupPerformanceMonitoring()

      // Setup error monitoring
      this.setupErrorMonitoring()

      // Setup system health checks
      this.setupHealthChecks()

      this.systemStatus.monitoring = true
      console.log("[v0] Monitoring systems initialized")
    } catch (error) {
      console.error("[v0] Monitoring initialization failed:", error)
      this.systemStatus.monitoring = false
    }
  }

  // Setup performance monitoring
  setupPerformanceMonitoring() {
    // Monitor page load times
    window.addEventListener("load", () => {
      const loadTime = performance.now()
      console.log(`[v0] Page loaded in ${Math.round(loadTime)}ms`)

      // Store performance metrics
      const metrics = JSON.parse(localStorage.getItem("performanceMetrics") || "[]")
      metrics.push({
        timestamp: new Date().toISOString(),
        loadTime: Math.round(loadTime),
        page: window.location.pathname,
      })

      // Keep only last 50 metrics
      if (metrics.length > 50) {
        metrics.splice(0, metrics.length - 50)
      }

      localStorage.setItem("performanceMetrics", JSON.stringify(metrics))
    })
  }

  // Setup error monitoring
  setupErrorMonitoring() {
    window.addEventListener("error", (event) => {
      console.error("[v0] Global error caught:", event.error)

      const errorLog = {
        timestamp: new Date().toISOString(),
        message: event.error?.message || "Unknown error",
        stack: event.error?.stack || "No stack trace",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        userAgent: navigator.userAgent,
        url: window.location.href,
      }

      // Store error logs
      const errors = JSON.parse(localStorage.getItem("errorLogs") || "[]")
      errors.push(errorLog)

      // Keep only last 20 errors
      if (errors.length > 20) {
        errors.splice(0, errors.length - 20)
      }

      localStorage.setItem("errorLogs", JSON.stringify(errors))
    })

    // Catch unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      console.error("[v0] Unhandled promise rejection:", event.reason)

      const errorLog = {
        timestamp: new Date().toISOString(),
        type: "unhandledrejection",
        reason: event.reason?.toString() || "Unknown rejection",
        url: window.location.href,
      }

      const errors = JSON.parse(localStorage.getItem("errorLogs") || "[]")
      errors.push(errorLog)

      if (errors.length > 20) {
        errors.splice(0, errors.length - 20)
      }

      localStorage.setItem("errorLogs", JSON.stringify(errors))
    })
  }

  // Setup system health checks
  setupHealthChecks() {
    setInterval(async () => {
      await this.performHealthCheck()
    }, 30000) // Check every 30 seconds
  }

  // Perform system health check
  async performHealthCheck() {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      database: false,
      authentication: false,
      realtime: false,
      memory: this.getMemoryUsage(),
      connectivity: navigator.onLine,
    }

    // Check database connectivity
    try {
      if (this.supabaseClient) {
        const { error } = await this.supabaseClient.from("instructors").select("count").limit(1)

        healthStatus.database = !error || error.message.includes("relation")
      }
    } catch (error) {
      healthStatus.database = false
    }

    // Check authentication
    healthStatus.authentication = this.systemStatus.authentication

    // Check real-time connections
    healthStatus.realtime = this.systemStatus.realtime

    // Store health status
    const healthLogs = JSON.parse(localStorage.getItem("healthLogs") || "[]")
    healthLogs.push(healthStatus)

    // Keep only last 20 health checks
    if (healthLogs.length > 20) {
      healthLogs.splice(0, healthLogs.length - 20)
    }

    localStorage.setItem("healthLogs", JSON.stringify(healthLogs))

    // Log any issues
    if (!healthStatus.database || !healthStatus.connectivity) {
      console.warn("[v0] System health issues detected:", healthStatus)
    }
  }

  // Get memory usage information
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
      }
    }
    return null
  }

  // Handle exam session changes (for instructors)
  handleExamSessionChange(payload) {
    if (typeof window.handleExamSessionChange === "function") {
      window.handleExamSessionChange(payload)
    }

    // Update dashboard if on dashboard page
    if (window.location.pathname.includes("dashboard") && typeof window.safeRefreshDashboardStats === "function") {
      window.safeRefreshDashboardStats()
    }
  }

  // Handle exam changes (for instructors)
  handleExamChange(payload) {
    if (typeof window.handleExamChange === "function") {
      window.handleExamChange(payload)
    }

    // Refresh exam list if on dashboard
    if (window.location.pathname.includes("dashboard") && typeof window.loadExams === "function") {
      window.loadExams()
    }
  }

  // Get system status
  getSystemStatus() {
    return {
      ...this.systemStatus,
      user: this.currentUser,
      timestamp: new Date().toISOString(),
    }
  }

  // Cleanup system resources
  cleanup() {
    console.log("[v0] Cleaning up system resources...")

    // Unsubscribe from all channels
    if (this.supabaseClient) {
      this.supabaseClient.removeAllChannels()
    }

    // Clear intervals and timeouts
    // (Individual components should handle their own cleanup)

    console.log("[v0] System cleanup completed")
  }
}

// Create global system instance
window.IntegriTestSystem = new IntegriTestSystem()

// Auto-initialize on DOM load
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await window.IntegriTestSystem.initialize()
    console.log("[v0] IntegriTest System ready")
  } catch (error) {
    console.error("[v0] System initialization failed:", error)
  }
})

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (window.IntegriTestSystem) {
    window.IntegriTestSystem.cleanup()
  }
})

console.log("[v0] System integration manager loaded")
