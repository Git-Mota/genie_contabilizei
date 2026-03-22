// Aponta para o backend FastAPI.
// Configure no front/.env:
//   VITE_API_URL=http://localhost:8000

const API_URL = (import.meta.env.VITE_API_URL as string ?? "http://localhost:8000").replace(/\/$/, "");

interface ChatRequest {
  question: string;
  conversation_id: string | null;
}

interface ChatResponse {
  answer: string;
  conversation_id: string;
}

let currentConversationId: string | null = null;

export function resetConversation() {
  currentConversationId = null;
}

export async function sendChatRequest(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>
): Promise<string> {
  const question = messages[messages.length - 1].content;

  const body: ChatRequest = {
    question,
    conversation_id: currentConversationId,
  };

  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? "Erro desconhecido");
  }

  const data: ChatResponse = await res.json();
  currentConversationId = data.conversation_id;

  return data.answer;
}
