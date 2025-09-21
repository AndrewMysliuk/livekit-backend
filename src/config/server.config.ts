import dotenv from "dotenv"
import { IServerConfig } from "../types/index.js"

if (process.env.NODE_ENV !== "production") {
  dotenv.config()
}

export const serverConfig: IServerConfig = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  LIVEKIT_URL: process.env.LIVEKIT_URL || "",
  LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY || "",
  LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
}
