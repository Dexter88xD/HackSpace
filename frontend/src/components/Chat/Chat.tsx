import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { useChat } from "@/hooks/useChat";
import { useEffect, useRef } from "react";

export default function Chat({
  chatRoomId,
  currentUserId,
  isConnected,
}: {
  chatRoomId: number;
  currentUserId: number;
  isConnected: boolean;
}) {
  const { messages, isPending, isError, joinError, isJoined } = useChat(
    chatRoomId,
    isConnected,
  );
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!messages?.length) return;

    const frameId = requestAnimationFrame(() => {
      messagesContainerRef.current?.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [messages]);

  if (isPending) return <div>Loading messages...</div>;
  if (isError) return <div>Failed to load messages.</div>;

  const scrollToBottom = () => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  };
  return (
    <div className="flex h-[500px] w-full max-w-md flex-col rounded-lg border">
      <div className="shrink-0 border-b p-3">
        <h3 className="font-semibold">Chat</h3>
      </div>

      {joinError && (
        <p className="border-b px-3 py-2 text-sm text-destructive">
          {joinError}
        </p>
      )}

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        ref={messagesContainerRef}
      >
        <ChatMessages messages={messages ?? []} currentUserId={currentUserId} />
      </div>
      <div className="border-t p-2">
        <button
          onClick={scrollToBottom}
          className="text-sm text-blue-500 hover:underline cursor-pointer"
        >
          Scroll to bottom ↓
        </button>
      </div>
      <ChatInput
        chatRoomId={chatRoomId}
        isConnected={isConnected}
        isJoined={isJoined}
      />
    </div>
  );
}
