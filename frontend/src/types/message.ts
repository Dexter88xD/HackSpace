export type Message = {
  id: number;
  content: string
  sentAt: string;
  sender: {
    id: number;
    username: string;
  };
};

export type SendMessageAck = {
    success: boolean,
    error?: string,
}
