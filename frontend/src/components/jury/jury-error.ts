import { isAxiosError } from "axios";

export function getJuryError(error: unknown): string {
  if (isAxiosError(error)) {
    const message: unknown = error.response?.data?.message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(". ");
    }
  }

  return "Something went wrong. Please try again.";
}
