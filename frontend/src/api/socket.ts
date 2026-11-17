import { io } from 'socket.io-client'

export const socket = io('https://localhost:8443/chat', {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket'],
})

