import { type JobContext, WorkerOptions, cli, defineAgent, voice } from "@livekit/agents"
import * as openai from "@livekit/agents-plugin-openai"
import { BackgroundVoiceCancellation } from "@livekit/noise-cancellation-node"
import { fileURLToPath } from "node:url"
import { serverConfig } from "./server.config.js"

class Assistant extends voice.Agent {
  constructor(instructions: string) {
    super({ instructions })
  }
}

export default defineAgent({
  entry: async (ctx: JobContext) => {
    await ctx.connect()

    const metadata = ctx.room.metadata ? JSON.parse(ctx.room.metadata) : {}

    const selectedVoice = metadata.voice as string
    const prompt = metadata.prompt as string
    const greeting = metadata.greeting as string

    const session = new voice.AgentSession({
      // stt: new openai.STT({
      //   model: "whisper-1",
      //   language: "ru",
      // }),
      llm: new openai.realtime.RealtimeModel({
        voice: selectedVoice,
        apiKey: serverConfig.OPENAI_API_KEY,
      }),
    })

    await session.start({
      agent: new Assistant(prompt),
      room: ctx.room,
      inputOptions: {
        audioEnabled: true,
        textEnabled: true,
        noiseCancellation: BackgroundVoiceCancellation(),
      },
      outputOptions: {
        audioEnabled: true,
        transcriptionEnabled: true, // чтобы ConversationItemAdded работал и для юзера
        syncTranscription: false, // если хочешь стрим текста ассистента — ставь true
      },
    })

    session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (event) => {
      const payload = {
        role: event.item.role,
        text: event.item.textContent,
      }

      const data = new TextEncoder().encode(JSON.stringify(payload))
      ctx.room.localParticipant?.publishData(data, { reliable: true })
    })

    await session.generateReply({ instructions: greeting })

    ctx.addShutdownCallback(async () => {
      // const history = session.history
      // console.log("FULL HISTORY:", history)

      console.log("SESSION: ", JSON.stringify(session, null, 2))
    })
  },
})

cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }))
