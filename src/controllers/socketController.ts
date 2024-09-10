import { Server, Socket } from "socket.io"
import { SocketActionsEnum } from "../types"
import { shareRoomsInfo, handleJoinRoom, leaveRoom } from "../services/roomService"

export function setupSocketHandlers(io: Server, socket: Socket): void {
  shareRoomsInfo(io)

  socket.on(SocketActionsEnum.JOIN, (config: { room: string }) => {
    handleJoinRoom(io, socket, config)
  })

  socket.on(SocketActionsEnum.LEAVE, () => leaveRoom(io, socket))

  socket.on("disconnecting", () => leaveRoom(io, socket))

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
}
