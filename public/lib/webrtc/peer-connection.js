// WebRTC Peer Connection Manager for Video Streaming
// Local-only implementation with no database storage

class PeerConnectionManager {
  constructor() {
    this.localStream = null
    this.peerConnections = new Map()
    this.isInstructor = false
    this.studentId = null
    this.examCode = null
    this.signalingPollInterval = null
    this.processedMessageIds = new Set()

    // WebRTC configuration
    this.rtcConfig = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
    }
  }

  // Initialize as student (send video only)
  async initializeAsStudent(studentId, examCode) {
    console.log("[v0] Initializing WebRTC as student:", studentId)
    this.isInstructor = false
    this.studentId = studentId
    this.examCode = examCode

    try {
      // Get user media (camera only, no audio for privacy)
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 },
        },
        audio: false, // No audio for privacy
      })

      console.log("[v0] Student camera stream obtained")
      return true
    } catch (error) {
      console.error("[v0] Error accessing student camera:", error)
      throw new Error("Camera access denied. Please allow camera access to continue with the exam.")
    }
  }

  // Initialize as instructor (receive video only)
  async initializeAsInstructor(examCode) {
    console.log("[v0] Initializing WebRTC as instructor for exam:", examCode)
    this.isInstructor = true
    this.examCode = examCode

    // Instructors don't need local stream, they only receive
    console.log("[v0] Instructor monitoring initialized")
    return true
  }

  // Create peer connection for student-to-instructor streaming
  createPeerConnection(peerId, isInitiator = false) {
    console.log("[v0] Creating peer connection for:", peerId)

    const pc = new RTCPeerConnection(this.rtcConfig)

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: "ice-candidate",
          candidate: event.candidate,
          to: peerId,
        })
      }
    }

    // Handle incoming stream (instructor receives student video)
    pc.ontrack = (event) => {
      console.log("[v0] Received remote stream from:", peerId)
      if (this.isInstructor) {
        this.handleIncomingStudentStream(peerId, event.streams[0])
      }
    }

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log("[v0] Connection state changed:", pc.connectionState, "for peer:", peerId)
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        this.handlePeerDisconnection(peerId)
      }
    }

    // Add local stream if student
    if (!this.isInstructor && this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream)
      })
    }

    this.peerConnections.set(peerId, pc)
    return pc
  }

  // Handle incoming student video stream (instructor side)
  handleIncomingStudentStream(studentId, stream) {
    console.log("[v0] Handling incoming stream from student:", studentId)

    // Dispatch custom event for monitor interface to handle
    const event = new CustomEvent("studentStreamReceived", {
      detail: { studentId, stream },
    })
    window.dispatchEvent(event)
  }

  // Handle peer disconnection
  handlePeerDisconnection(peerId) {
    console.log("[v0] Peer disconnected:", peerId)

    const pc = this.peerConnections.get(peerId)
    if (pc) {
      pc.close()
      this.peerConnections.delete(peerId)
    }

    // Notify monitor interface
    const event = new CustomEvent("studentDisconnected", {
      detail: { studentId: peerId },
    })
    window.dispatchEvent(event)
  }

  // Create and send offer (student initiates connection to instructor)
  async createOffer(instructorId) {
    console.log("[v0] Creating offer for instructor:", instructorId)

    const pc = this.createPeerConnection(instructorId, true)

    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      this.sendSignalingMessage({
        type: "offer",
        offer: offer,
        to: instructorId,
        from: this.studentId,
      })
    } catch (error) {
      console.error("[v0] Error creating offer:", error)
    }
  }

  // Handle incoming offer (instructor receives from student)
  async handleOffer(offer, fromStudentId) {
    console.log("[v0] Handling offer from student:", fromStudentId)

    const pc = this.createPeerConnection(fromStudentId, false)

    try {
      await pc.setRemoteDescription(offer)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      this.sendSignalingMessage({
        type: "answer",
        answer: answer,
        to: fromStudentId,
        from: "instructor",
      })
    } catch (error) {
      console.error("[v0] Error handling offer:", error)
    }
  }

  // Handle incoming answer (student receives from instructor)
  async handleAnswer(answer, fromInstructorId) {
    console.log("[v0] Handling answer from instructor:", fromInstructorId)

    const pc = this.peerConnections.get(fromInstructorId)
    if (pc) {
      try {
        await pc.setRemoteDescription(answer)
      } catch (error) {
        console.error("[v0] Error handling answer:", error)
      }
    }
  }

  // Handle ICE candidate
  async handleIceCandidate(candidate, fromPeerId) {
    console.log("[v0] Handling ICE candidate from:", fromPeerId)

    const pc = this.peerConnections.get(fromPeerId)
    if (pc) {
      try {
        await pc.addIceCandidate(candidate)
      } catch (error) {
        console.error("[v0] Error adding ICE candidate:", error)
      }
    }
  }

  async sendSignalingMessage(message) {
    console.log("[v0] Sending signaling message:", message.type)
    this.sendSignalingMessageLocal(message)
  }

  sendSignalingMessageLocal(message) {
    const signalingKey = `signaling_${this.examCode}`
    const existingMessages = JSON.parse(localStorage.getItem(signalingKey) || "[]")

    existingMessages.push({
      ...message,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9),
    })

    if (existingMessages.length > 100) {
      existingMessages.splice(0, existingMessages.length - 100)
    }

    localStorage.setItem(signalingKey, JSON.stringify(existingMessages))
  }

  startSignalingPolling() {
    console.log("[v0] Starting local signaling polling (no database)")
    this.startLocalSignalingPolling()
  }

  startLocalSignalingPolling() {
    const pollInterval = setInterval(() => {
      this.checkForLocalSignalingMessages()
    }, 1000)

    this.signalingPollInterval = pollInterval
  }

  async handleSignalingMessage(messageRecord) {
    try {
      const message = JSON.parse(messageRecord.message_data)

      switch (message.type) {
        case "offer":
          if (this.isInstructor) {
            await this.handleOffer(message.offer, message.from)
          }
          break
        case "answer":
          if (!this.isInstructor) {
            await this.handleAnswer(message.answer, message.from)
          }
          break
        case "ice-candidate":
          await this.handleIceCandidate(message.candidate, message.from)
          break
      }
    } catch (error) {
      console.error("[v0] Error handling signaling message:", error)
    }
  }

  checkForLocalSignalingMessages() {
    const signalingKey = `signaling_${this.examCode}`
    const messages = JSON.parse(localStorage.getItem(signalingKey) || "[]")

    const myId = this.isInstructor ? "instructor" : this.studentId
    const unprocessedMessages = messages.filter((msg) => msg.to === myId && !this.processedMessageIds?.has(msg.id))

    if (!this.processedMessageIds) {
      this.processedMessageIds = new Set()
    }

    unprocessedMessages.forEach(async (message) => {
      this.processedMessageIds.add(message.id)

      switch (message.type) {
        case "offer":
          if (this.isInstructor) {
            await this.handleOffer(message.offer, message.from)
          }
          break
        case "answer":
          if (!this.isInstructor) {
            await this.handleAnswer(message.answer, message.from)
          }
          break
        case "ice-candidate":
          await this.handleIceCandidate(message.candidate, message.from || message.to)
          break
      }
    })
  }

  cleanup() {
    console.log("[v0] Cleaning up WebRTC resources")

    // Stop local signaling polling
    if (this.signalingPollInterval) {
      clearInterval(this.signalingPollInterval)
    }

    // Close all peer connections
    this.peerConnections.forEach((pc) => pc.close())
    this.peerConnections.clear()

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }
  }

  // Get connection statistics
  async getConnectionStats() {
    const stats = {}

    for (const [peerId, pc] of this.peerConnections) {
      try {
        const rtcStats = await pc.getStats()
        stats[peerId] = {
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState,
          stats: rtcStats,
        }
      } catch (error) {
        console.error("[v0] Error getting stats for peer:", peerId, error)
      }
    }

    return stats
  }
}

// Export for use in other modules
window.PeerConnectionManager = PeerConnectionManager
