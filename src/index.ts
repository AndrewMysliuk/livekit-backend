import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import { serverConfig } from "./config"
import { setupSocketHandlers } from "./controllers/socketController"
import logger from "./utils/logger"

const app = express()
const server = createServer(app)
const io = new Server(server)

io.on("connection", (socket) => {
  logger.info(`New connection: ${socket.id}`)
  setupSocketHandlers(io, socket)
})

server.listen(serverConfig.PORT, () => {
  logger.info(`Server started on port ${serverConfig.PORT}`)
})
