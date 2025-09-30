import { LocalSignalingServer } from "../../../public/lib/communication/signaling-server.js"
import jest from "jest"

describe("LocalSignalingServer", () => {
  let signalingServer

  beforeEach(() => {
    signalingServer = new LocalSignalingServer()
    localStorage.clear()
  })

  afterEach(() => {
    signalingServer.cleanup()
    localStorage.clear()
  })

  describe("Channel Management", () => {
    test("should create and join a channel", () => {
      const channelId = "exam-123"
      const peerId = "student-1"
      const messageHandler = jest.fn()

      signalingServer.joinChannel(channelId, peerId, messageHandler)

      expect(signalingServer.channels.has(channelId)).toBe(true)
      expect(signalingServer.channels.get(channelId).has(peerId)).toBe(true)
      expect(signalingServer.messageHandlers.has(peerId)).toBe(true)
    })

    test("should leave a channel", () => {
      const channelId = "exam-123"
      const peerId = "student-1"
      const messageHandler = jest.fn()

      signalingServer.joinChannel(channelId, peerId, messageHandler)
      signalingServer.leaveChannel(channelId, peerId)

      expect(signalingServer.channels.has(channelId)).toBe(false)
      expect(signalingServer.messageHandlers.has(peerId)).toBe(false)
    })

    test("should handle multiple peers in same channel", () => {
      const channelId = "exam-123"
      const handler = jest.fn()

      signalingServer.joinChannel(channelId, "student-1", handler)
      signalingServer.joinChannel(channelId, "student-2", handler)

      expect(signalingServer.channels.get(channelId).size).toBe(2)
    })
  })

  describe("Message Sending", () => {
    test("should send message to specific peer", () => {
      const channelId = "exam-123"
      const message = {
        from: "instructor",
        to: "student-1",
        type: "offer",
        data: { sdp: "test-sdp" },
      }

      signalingServer.sendMessage(channelId, message, "student-1")

      const storageKey = `signaling_${channelId}`
      const messages = JSON.parse(localStorage.getItem(storageKey))

      expect(messages).toHaveLength(1)
      expect(messages[0].type).toBe("offer")
      expect(messages[0].to).toBe("student-1")
    })

    test("should broadcast message to channel", () => {
      const channelId = "exam-123"
      const message = {
        from: "instructor",
        type: "announcement",
        data: { text: "Exam starting" },
      }

      signalingServer.sendMessage(channelId, message)

      const storageKey = `signaling_${channelId}`
      const messages = JSON.parse(localStorage.getItem(storageKey))

      expect(messages).toHaveLength(1)
      expect(messages[0].type).toBe("announcement")
    })

    test("should limit message history to 100 messages", () => {
      const channelId = "exam-123"

      // Send 150 messages
      for (let i = 0; i < 150; i++) {
        signalingServer.sendMessage(channelId, {
          from: "test",
          type: "test",
          data: { index: i },
        })
      }

      const storageKey = `signaling_${channelId}`
      const messages = JSON.parse(localStorage.getItem(storageKey))

      expect(messages.length).toBe(100)
      expect(messages[0].data.index).toBe(50) // First 50 should be removed
    })
  })

  describe("Message Polling", () => {
    test("should poll and deliver messages to handler", (done) => {
      const channelId = "exam-123"
      const peerId = "student-1"
      const messageHandler = jest.fn((message) => {
        expect(message.type).toBe("offer")
        expect(message.to).toBe(peerId)
        done()
      })

      signalingServer.joinChannel(channelId, peerId, messageHandler)

      // Send a message
      signalingServer.sendMessage(channelId, {
        from: "instructor",
        to: peerId,
        type: "offer",
        data: { sdp: "test" },
      })

      // Manually trigger poll
      signalingServer.pollMessages(channelId, peerId)
    })

    test("should not deliver already processed messages", () => {
      const channelId = "exam-123"
      const peerId = "student-1"
      const messageHandler = jest.fn()

      signalingServer.joinChannel(channelId, peerId, messageHandler)

      const message = {
        from: "instructor",
        to: peerId,
        type: "offer",
        data: { sdp: "test" },
      }

      signalingServer.sendMessage(channelId, message)

      // Poll twice
      signalingServer.pollMessages(channelId, peerId)
      signalingServer.pollMessages(channelId, peerId)

      // Handler should only be called once
      expect(messageHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe("Channel Statistics", () => {
    test("should return accurate channel stats", () => {
      const channelId = "exam-123"
      const handler = jest.fn()

      signalingServer.joinChannel(channelId, "student-1", handler)
      signalingServer.joinChannel(channelId, "student-2", handler)

      signalingServer.sendMessage(channelId, {
        from: "instructor",
        type: "test",
      })

      const stats = signalingServer.getChannelStats(channelId)

      expect(stats.channelId).toBe(channelId)
      expect(stats.peerCount).toBe(2)
      expect(stats.messageCount).toBe(1)
      expect(stats.lastActivity).toBeTruthy()
    })
  })

  describe("Cleanup", () => {
    test("should cleanup old messages", () => {
      const channelId = "exam-123"

      // Create old message
      const oldMessage = {
        id: "old-msg",
        timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        from: "test",
        type: "test",
      }

      localStorage.setItem(`signaling_${channelId}`, JSON.stringify([oldMessage]))

      signalingServer.cleanup()

      const messages = JSON.parse(localStorage.getItem(`signaling_${channelId}`) || "[]")
      expect(messages).toHaveLength(0)
    })

    test("should clear all channels and handlers", () => {
      const handler = jest.fn()
      signalingServer.joinChannel("exam-1", "student-1", handler)
      signalingServer.joinChannel("exam-2", "student-2", handler)

      signalingServer.cleanup()

      expect(signalingServer.channels.size).toBe(0)
      expect(signalingServer.messageHandlers.size).toBe(0)
    })
  })

  describe("Message ID Generation", () => {
    test("should generate unique message IDs", () => {
      const id1 = signalingServer.generateMessageId()
      const id2 = signalingServer.generateMessageId()

      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^msg_\d+_[a-z0-9]+$/)
    })
  })
})
