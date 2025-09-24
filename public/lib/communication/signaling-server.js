// Simple Signaling Server Implementation using localStorage
// In production, this would be replaced with WebSocket server
class LocalSignalingServer {
  constructor() {
    this.channels = new Map()
    this.pollInterval = null
    this.messageHandlers = new Map()
  }

  // Create or join a signaling channel
  joinChannel(channelId, peerId, messageHandler) {
    console.log("[v0] Joining signaling channel:", channelId, "as:", peerId)

    if (!this.channels.has(channelId)) {
      this.channels.set(channelId, new Set())
    }

    this.channels.get(channelId).add(peerId)
    this.messageHandlers.set(peerId, messageHandler)

    // Start polling for messages
    this.startPolling(channelId, peerId)
  }

  // Leave a signaling channel
  leaveChannel(channelId, peerId) {
    console.log("[v0] Leaving signaling channel:", channelId, "peer:", peerId)

    if (this.channels.has(channelId)) {
      this.channels.get(channelId).delete(peerId)

      if (this.channels.get(channelId).size === 0) {
        this.channels.delete(channelId)
      }
    }

    this.messageHandlers.delete(peerId)

    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }

  // Send message to specific peer or broadcast to channel
  sendMessage(channelId, message, targetPeerId = null) {
    const storageKey = `signaling_${channelId}`
    const messages = JSON.parse(localStorage.getItem(storageKey) || "[]")

    const signalMessage = {
      id: this.generateMessageId(),
      timestamp: Date.now(),
      from: message.from,
      to: targetPeerId || message.to,
      type: message.type,
      data: message.data || message,
      channelId,
    }

    messages.push(signalMessage)

    // Keep only recent messages (last 100)
    if (messages.length > 100) {
      messages.splice(0, messages.length - 100)
    }

    localStorage.setItem(storageKey, JSON.stringify(messages))

    console.log("[v0] Signaling message sent:", signalMessage.type, "to:", signalMessage.to)
  }

  // Start polling for messages
  startPolling(channelId, peerId) {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
    }

    this.pollInterval = setInterval(() => {
      this.pollMessages(channelId, peerId)
    }, 1000) // Poll every second
  }

  // Poll for new messages
  pollMessages(channelId, peerId) {
    const storageKey = `signaling_${channelId}`
    const messages = JSON.parse(localStorage.getItem(storageKey) || "[]")

    // Get messages for this peer that haven't been processed
    const unprocessedMessages = messages.filter(
      (msg) => (msg.to === peerId || msg.to === "broadcast") && !this.isMessageProcessed(msg.id, peerId),
    )

    unprocessedMessages.forEach((message) => {
      this.markMessageProcessed(message.id, peerId)

      const handler = this.messageHandlers.get(peerId)
      if (handler) {
        handler(message)
      }
    })
  }

  // Check if message has been processed by peer
  isMessageProcessed(messageId, peerId) {
    const processedKey = `processed_${peerId}`
    const processed = JSON.parse(localStorage.getItem(processedKey) || "[]")
    return processed.includes(messageId)
  }

  // Mark message as processed by peer
  markMessageProcessed(messageId, peerId) {
    const processedKey = `processed_${peerId}`
    const processed = JSON.parse(localStorage.getItem(processedKey) || "[]")

    if (!processed.includes(messageId)) {
      processed.push(messageId)

      // Keep only recent processed messages (last 200)
      if (processed.length > 200) {
        processed.splice(0, processed.length - 200)
      }

      localStorage.setItem(processedKey, JSON.stringify(processed))
    }
  }

  // Generate unique message ID
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get channel statistics
  getChannelStats(channelId) {
    const peers = this.channels.get(channelId)
    const storageKey = `signaling_${channelId}`
    const messages = JSON.parse(localStorage.getItem(storageKey) || "[]")

    return {
      channelId,
      peerCount: peers ? peers.size : 0,
      messageCount: messages.length,
      lastActivity: messages.length > 0 ? messages[messages.length - 1].timestamp : null,
    }
  }

  // Clean up old messages and processed lists
  cleanup() {
    console.log("[v0] Cleaning up signaling server...")

    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }

    // Clean up old messages (older than 1 hour)
    const cutoffTime = Date.now() - 60 * 60 * 1000

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      if (key && key.startsWith("signaling_")) {
        const messages = JSON.parse(localStorage.getItem(key) || "[]")
        const recentMessages = messages.filter((msg) => msg.timestamp > cutoffTime)

        if (recentMessages.length !== messages.length) {
          localStorage.setItem(key, JSON.stringify(recentMessages))
        }
      }

      if (key && key.startsWith("processed_")) {
        // Clear processed message lists older than 1 hour
        localStorage.removeItem(key)
      }
    }

    this.channels.clear()
    this.messageHandlers.clear()
  }
}

// Export for global use
window.LocalSignalingServer = LocalSignalingServer

// Create global instance
window.signalingServer = new LocalSignalingServer()

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (window.signalingServer) {
    window.signalingServer.cleanup()
  }
})
