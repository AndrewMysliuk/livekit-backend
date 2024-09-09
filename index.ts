import path from "path"
import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import { version, validate } from "uuid"
import { SocketActionsEnum } from "./src/types"

const PORT = process.env.PORT || 3001

const app = express()
const server = createServer(app)
const io = new Server(server)

function getClientRooms(): string[] {
  const { rooms } = io.sockets.adapter

  return Array.from(rooms.keys()).filter((roomID) => validate(roomID) && version(roomID) === 4)
}

function shareRoomsInfo(): void {
  io.emit(SocketActionsEnum.SHARE_ROOMS, {
    rooms: getClientRooms(),
  })
}

io.on("connection", (socket) => {
  shareRoomsInfo()

  socket.on(SocketActionsEnum.JOIN, (config: { room: string }) => {
    const { room: roomID } = config
    const { rooms: joinedRooms } = socket

    if (Array.from(joinedRooms).includes(roomID)) {
      return console.warn(`Already joined to ${roomID}`)
    }

    const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || [])

    clients.forEach((clientID) => {
      io.to(clientID).emit(SocketActionsEnum.ADD_PEER, {
        peerID: socket.id,
        createOffer: false,
      })

      socket.emit(SocketActionsEnum.ADD_PEER, {
        peerID: clientID,
        createOffer: true,
      })
    })

    socket.join(roomID)
    shareRoomsInfo()
  })

  function leaveRoom(): void {
    const { rooms } = socket

    Array.from(rooms)
      .filter((roomID) => validate(roomID) && version(roomID) === 4)
      .forEach((roomID) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || [])

        clients.forEach((clientID) => {
          io.to(clientID).emit(SocketActionsEnum.REMOVE_PEER, {
            peerID: socket.id,
          })

          socket.emit(SocketActionsEnum.REMOVE_PEER, {
            peerID: clientID,
          })
        })

        socket.leave(roomID)
      })

    shareRoomsInfo()
  }

  socket.on(SocketActionsEnum.LEAVE, leaveRoom)
  socket.on("disconnecting", leaveRoom)

  socket.on(SocketActionsEnum.RELAY_SDP, ({ peerID, sessionDescription }: { peerID: string; sessionDescription: any }) => {
    io.to(peerID).emit(SocketActionsEnum.SESSION_DESCRIPTION, {
      peerID: socket.id,
      sessionDescription,
    })
  })

  socket.on(SocketActionsEnum.RELAY_ICE, ({ peerID, iceCandidate }: { peerID: string; iceCandidate: any }) => {
    io.to(peerID).emit(SocketActionsEnum.ICE_CANDIDATE, {
      peerID: socket.id,
      iceCandidate,
    })
  })
})

const publicPath = path.join(__dirname, "build")

app.use(express.static(publicPath))

app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"))
})

server.listen(PORT, () => {
  console.log("Server Started!")
})
