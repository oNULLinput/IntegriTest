// Unit tests for peer-connection.js

require("../../../public/lib/webrtc/peer-connection.js")

describe("PeerConnectionManager", () => {
  let peerManager

  beforeEach(() => {
    peerManager = new window.PeerConnectionManager()
  })

  afterEach(() => {
    if (peerManager) {
      peerManager.cleanup()
    }
  })

  describe("initialization", () => {
    it("should initialize with default values", () => {
      expect(peerManager.isInstructor).toBe(false)
      expect(peerManager.localStream).toBeNull()
      expect(peerManager.peerConnections.size).toBe(0)
    })

    it("should initialize as student", async () => {
      const result = await peerManager.initializeAsStudent("student-123", "EXAM01")

      expect(result).toBe(true)
      expect(peerManager.isInstructor).toBe(false)
      expect(peerManager.studentId).toBe("student-123")
      expect(peerManager.examCode).toBe("EXAM01")
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
    })

    it("should initialize as instructor", async () => {
      const result = await peerManager.initializeAsInstructor("EXAM01")

      expect(result).toBe(true)
      expect(peerManager.isInstructor).toBe(true)
      expect(peerManager.examCode).toBe("EXAM01")
    })

    it("should handle camera access error", async () => {
      navigator.mediaDevices.getUserMedia.mockRejectedValue(new Error("Permission denied"))

      await expect(peerManager.initializeAsStudent("student-123", "EXAM01")).rejects.toThrow("Camera access denied")
    })
  })

  describe("peer connection creation", () => {
    beforeEach(async () => {
      await peerManager.initializeAsStudent("student-123", "EXAM01")
    })

    it("should create peer connection", () => {
      const pc = peerManager.createPeerConnection("peer-123")

      expect(pc).toBeDefined()
      expect(peerManager.peerConnections.has("peer-123")).toBe(true)
      expect(RTCPeerConnection).toHaveBeenCalled()
    })

    it("should add local stream tracks to peer connection", () => {
      const pc = peerManager.createPeerConnection("peer-123")

      expect(pc.addTrack).toHaveBeenCalled()
    })
  })

  describe("offer/answer exchange", () => {
    beforeEach(async () => {
      await peerManager.initializeAsStudent("student-123", "EXAM01")
    })

    it("should create and send offer", async () => {
      await peerManager.createOffer("instructor-123")

      const pc = peerManager.peerConnections.get("instructor-123")
      expect(pc).toBeDefined()
      expect(pc.createOffer).toHaveBeenCalled()
      expect(pc.setLocalDescription).toHaveBeenCalled()
    })

    it("should handle incoming offer as instructor", async () => {
      peerManager.isInstructor = true
      const mockOffer = { type: "offer", sdp: "mock-sdp" }

      await peerManager.handleOffer(mockOffer, "student-123")

      const pc = peerManager.peerConnections.get("student-123")
      expect(pc).toBeDefined()
      expect(pc.setRemoteDescription).toHaveBeenCalled()
      expect(pc.createAnswer).toHaveBeenCalled()
    })

    it("should handle incoming answer as student", async () => {
      const mockAnswer = { type: "answer", sdp: "mock-sdp" }
      peerManager.createPeerConnection("instructor-123")

      await peerManager.handleAnswer(mockAnswer, "instructor-123")

      const pc = peerManager.peerConnections.get("instructor-123")
      expect(pc.setRemoteDescription).toHaveBeenCalled()
    })
  })

  describe("ICE candidate handling", () => {
    beforeEach(async () => {
      await peerManager.initializeAsStudent("student-123", "EXAM01")
    })

    it("should handle ICE candidate", async () => {
      const mockCandidate = { candidate: "mock-candidate" }
      peerManager.createPeerConnection("peer-123")

      await peerManager.handleIceCandidate(mockCandidate, "peer-123")

      const pc = peerManager.peerConnections.get("peer-123")
      expect(pc.addIceCandidate).toHaveBeenCalled()
    })
  })

  describe("signaling", () => {
    beforeEach(async () => {
      await peerManager.initializeAsStudent("student-123", "EXAM01")
    })

    it("should send signaling message to localStorage", () => {
      const message = {
        type: "offer",
        to: "instructor",
        from: "student-123",
      }

      peerManager.sendSignalingMessageLocal(message)

      expect(localStorage.setItem).toHaveBeenCalled()
    })

    it("should check for local signaling messages", () => {
      localStorage.getItem.mockReturnValue(
        JSON.stringify([
          {
            id: "msg-1",
            type: "answer",
            to: "student-123",
            from: "instructor",
            answer: { type: "answer", sdp: "mock" },
          },
        ]),
      )

      peerManager.checkForLocalSignalingMessages()

      expect(localStorage.getItem).toHaveBeenCalled()
    })
  })

  describe("cleanup", () => {
    it("should cleanup all resources", async () => {
      await peerManager.initializeAsStudent("student-123", "EXAM01")
      peerManager.createPeerConnection("peer-123")

      peerManager.cleanup()

      expect(peerManager.peerConnections.size).toBe(0)
      expect(peerManager.localStream).toBeNull()
    })
  })

  describe("connection statistics", () => {
    beforeEach(async () => {
      await peerManager.initializeAsStudent("student-123", "EXAM01")
    })

    it("should get connection stats", async () => {
      peerManager.createPeerConnection("peer-123")

      const stats = await peerManager.getConnectionStats()

      expect(stats).toBeDefined()
      expect(stats["peer-123"]).toBeDefined()
      expect(stats["peer-123"].connectionState).toBe("connected")
    })
  })
})
