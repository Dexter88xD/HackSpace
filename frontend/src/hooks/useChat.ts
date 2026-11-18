import { joinChatRoom, getMessages } from "@/api/chat";
import { socket } from "@/api/socket";
import { shouldRetryQuery } from "@/lib/query-retry";
import { Message } from "@/types/message";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useChat(chatRoomId: number, isConnected: boolean) {
  const queryClient = useQueryClient();
  const [joinError, setJoinError] = useState("");
  const [isJoined, setIsJoined] = useState(false)
  const {
    data: messages,
    isPending,
    isError,
    isSuccess,
  } = useQuery({
    queryKey: ["messages", chatRoomId],
    queryFn: () => {
      return getMessages(chatRoomId);
    },
    retry: shouldRetryQuery,
  });
  useEffect(() => {
    if (!isConnected) return;

    joinChatRoom(chatRoomId, setJoinError, setIsJoined);

    function handleNewMessage(newMessage: Message) {
      queryClient.setQueryData<Message[]>(
        ["messages", chatRoomId],
        (oldMessages) => {
          if (!oldMessages) return [newMessage];
          return [...oldMessages, newMessage];
        },
      );
    }

    socket.on("new-message", handleNewMessage);
    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, [chatRoomId, isConnected, queryClient]);

  return {
    messages,
    isPending,
    isError,
    isSuccess,
    joinError,
    isJoined,
  };
}
