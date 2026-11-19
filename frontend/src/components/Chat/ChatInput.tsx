import { sendMessage } from "@/api/chat";
import { useState } from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

export default function ChatInput({
  chatRoomId,
  isConnected,
  isJoined
}: {
  chatRoomId: number;
  isConnected: boolean;
  isJoined: boolean
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  function handleSendMessage() {
    if (!content.trim()) return;
    setIsSending(true);
    sendMessage(
      chatRoomId,
      content,
      setError,
      () => {
        setContent("");
      },
      setIsSending,
    );
  }

  return (
    <div className="flex flex-col p-4 gap-2">
      <div className="flex items-end gap-2 ">
        <Textarea
          disabled={isSending || !isJoined}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="resize-none"
        />

        <Button
          onClick={handleSendMessage}
          disabled={!content.trim() || !isConnected || isSending || !isJoined}
        >
          Send
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
