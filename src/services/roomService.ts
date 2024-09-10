import { Server, Socket } from "socket.io"
import { validate, version } from "uuid"
import { SocketActionsEnum } from "../types"
import logger from "../utils/logger"

export function getClientRooms(io: Server): string[] {
  const { rooms } = io.sockets.adapter
  return Array.from(rooms.keys()).filter((roomID) => validate(roomID) && version(roomID) === 4)
}

export function shareRoomsInfo(io: Server): void {
  io.emit(SocketActionsEnum.SHARE_ROOMS, {
    rooms: getClientRooms(io),
  })
}

export function handleJoinRoom(io: Server, socket: Socket, config: { room: string }): void {
  const { room: roomID } = config
  const { rooms: joinedRooms } = socket

  if (Array.from(joinedRooms).includes(roomID)) {
    logger.warn(`Already joined to ${roomID}`)
    return
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
  shareRoomsInfo(io)
}

export function leaveRoom(io: Server, socket: Socket): void {
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

  shareRoomsInfo(io)
}
