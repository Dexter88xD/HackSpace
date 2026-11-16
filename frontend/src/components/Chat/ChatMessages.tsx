import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Message,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message";
import { ChatProps } from "@/types/chat";

export default function ChatMessage({ messages, currentUserId }: ChatProps) {
  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6">
      {messages.map((message) => {
        const isOwnMessage = message.sender.id === currentUserId;
        return (
          <Message key={message.id} align={isOwnMessage ? "end" : "start"}>
            <MessageContent>
              <MessageHeader>{message.sender.username}</MessageHeader>
              <Bubble variant={isOwnMessage ? "default" : "muted"}>
                <BubbleContent>{message.content}</BubbleContent>
              </Bubble>
              <MessageFooter>
                {new Date(message.sentAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </MessageFooter>
            </MessageContent>
          </Message>
        );
      })}
    </div>
  );
}
