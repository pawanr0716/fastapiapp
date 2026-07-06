import { useEffect, useState, type FormEvent, useRef } from "react";
import api from "../Services/api";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hi! I can help you with jobs, companies, or hiring questions.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState<string>(() => {
    if (typeof window === "undefined") {
      return `chat-${Date.now()}`;
    }

    return localStorage.getItem("talentspark-chat-session") ?? `chat-${Date.now()}`;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("talentspark-chat-session", sessionId);
  }, [sessionId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) {
      return;
    }

    // Add user message to the conversation
    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/chat/", {
        message: trimmed,
        session_id: sessionId,
      });

      // Add assistant response to the conversation
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        text: response.data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Add error message to the conversation
      const errorMessage: Message = {
        id: Date.now() + 2,
        role: "assistant",
        text: "Sorry, the chatbot is unavailable right now. Please try again later.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section-card fade-in">
      <h2>AI Assistant</h2>
      <section className="chat-widget">
        <div className="chat-widget__header">
          <h3>TalentSpark AI Assistant</h3>
          <p>Ask me anything about jobs, companies, or hiring!</p>
        </div>

        <div className="chat-widget__messages">
          {messages.map((message) => (
            <div key={message.id} className={`chat-bubble ${message.role}`}>
              {message.text}
            </div>
          ))}
          {loading && <div className="chat-bubble assistant typing">Thinking...</div>}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-widget__form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            autoComplete="off"
          />
          <button type="submit" disabled={loading || !input.trim()}>
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default ChatWidget;