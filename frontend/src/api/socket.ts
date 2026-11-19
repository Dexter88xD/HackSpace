import { io } from 'socket.io-client'

export const socket = io(`${import.meta.env.VITE_SOCKET_URL}/chat`, {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket'],
})

