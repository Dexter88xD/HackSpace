import { Message, SendMessageAck } from "@/types/message";
import api from "./client";
import { socket } from "./socket";

export function joinChatRoom(
  chatRoomId: number,
  setError: (error: string) => void,
  setIsJoined: (isJoined: boolean) => void,
  onSuccess: () => void,
) {
  socket.timeout(5000).emit(
    "join-chat",
    { chatRoomId },
    (
      err: Error | null,
      response: {
        success: boolean;
        error?: string;
      },
    ) => {

      if (err) {
        setError("Joining timed out. Please try again")
        setIsJoined(false)
        return;
      }
      if (!response.success) {
        setError(response.error ?? "Failed to join chat room")
        setIsJoined(false)
        return;
      }

      setError("");
      setIsJoined(true);
      onSuccess();
    },
  );
}

export function sendMessage(
  chatRoomId: number,
  content: string,
  setError: (error: string) => void,
  onSuccess: () => void,
  setIsSending: (isSending: boolean) => void,
) {
  socket
    .timeout(5000)
    .emit(
      "send-message",
      { chatRoomId, content },
      (err: Error | null, response: SendMessageAck) => {
        if (err) {
          setError("Sending timed out. Please try again");
          setIsSending(false);
          return;
        }

        if (!response.success) {
          setError(response.error ?? "Failed to send message");
          setIsSending(false);
          return;
        }
        setError("");
        onSuccess();
        setIsSending(false);
      },
    );
}

export async function getMessages(chatRoomId: number) {
  const response = await api.get<Message[]>(
    `chat-rooms/${chatRoomId}/messages`,
  );

  return response.data;
}



export const getOrCreatePrivateChat = async (friendId: number) => {
  const response = await api.post(
    `chat-rooms/private/${friendId}`
  );
  return response.data;
};
