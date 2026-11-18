import { Message } from "./message";

export type ChatProps = {
  messages: Message[];
  currentUserId: number;
};
