import express from "express"
import { AccessToken, RoomServiceClient } from "livekit-server-sdk"
import { serverConfig } from "../config/index.js"

export const AGENT_VOICE = "ash" // alloy, verse, sage, serene, bright, warm, harper, coral, amber, copper, steel
export const AGENT_SYSTEM_PROMPT = "Ты — голосовой ассистент. Всегда общайся только на русском языке."
export const AGENT_GREETING = "Привет! Я твой голосовой ассистент. Чем могу помочь?"

const router = express.Router()

const roomService = new RoomServiceClient(serverConfig.LIVEKIT_URL, serverConfig.LIVEKIT_API_KEY, serverConfig.LIVEKIT_API_SECRET)

router.get("/token", async (req, res) => {
  const identity = String(req.query.user) || "anon-" + Math.random().toString(36).slice(2)
  const roomName = String(req.query.room || "test-room")

  await roomService.createRoom({
    name: roomName,
  })

  const metadata = JSON.stringify({
    voice: AGENT_VOICE,
    prompt: AGENT_SYSTEM_PROMPT,
    greeting: AGENT_GREETING,
  })

  await roomService.updateRoomMetadata(roomName, metadata)

  const at = new AccessToken(serverConfig.LIVEKIT_API_KEY, serverConfig.LIVEKIT_API_SECRET, { identity })

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  })

  const token = await at.toJwt()
  res.json({ token })
})

router.post("/end", async (req, res) => {
  try {
    const roomName = String(req.body?.room || "test-room")

    await roomService.deleteRoom(roomName)

    res.json({ success: true, message: `Room ${roomName} closed.` })
  } catch (err: any) {
    console.error("Failed to close room:", err)
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
