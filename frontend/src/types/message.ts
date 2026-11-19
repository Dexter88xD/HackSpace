export type Message = {
  id: number;
  content: string
  sentAt: string;
  sender: {
    id: number;
    username: string;
  } | null;
};

export type SendMessageAck = {
    success: boolean,
    error?: string,
}
