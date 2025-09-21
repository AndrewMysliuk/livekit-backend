import express from "express"
import { createServer } from "http"
import cors from "cors"
import { serverConfig } from "./config/index.js"
import tokenController from "./controllers/token.controller.js"

const app = express()
const server = createServer(app)

app.use(express.json())

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
)

app.use("/api", tokenController)

server.listen(serverConfig.PORT, () => {
  console.log(`Server started on port ${serverConfig.PORT}`)
})
