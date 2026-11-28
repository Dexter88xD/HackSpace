import { socket } from "@/api/socket";
import { useEffect, useState } from "react";

export function useSocket(enabled: boolean) {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    if(!enabled) return;
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onConnectError(error: Error) {
      console.error("Socket connection failed", error.message);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.disconnect();
      setIsConnected(false);
    };
  }, [enabled]);

  return { socket, isConnected };
}
