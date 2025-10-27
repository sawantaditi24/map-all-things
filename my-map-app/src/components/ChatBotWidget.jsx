// src/components/ChatBotWidget.jsx
import React, { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import axios from "axios";

const ChatBotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi! 👋 I'm here to help you explore college costs and dates. Ask me anything!",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages([...messages, { from: "user", text: userMessage }]);
    setInput("");

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are CampusAI, a friendly assistant helping students with university start/end dates, housing costs, financial aid, and planning.",
            },
            ...messages.map((msg) => ({
              role: msg.from === "user" ? "user" : "assistant",
              content: msg.text,
            })),
            { role: "user", content: userMessage },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const reply = response.data.choices[0].message.content;
      setMessages((prev) => [...prev, { from: "bot", text: reply }]);
    } catch (error) {
      console.error("🔴 OpenAI API Error:", error.response?.data || error.message);

      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "❌ Error: " + (error.response?.data?.error?.message || "Could not connect to OpenAI."),
        },
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="https://api.dicebear.com/7.x/thumbs/svg?seed=StudentBot"
                alt="avatar"
                className="w-8 h-8 rounded-full"
              />
              <span className="font-semibold">StudentBot</span>
            </div>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="h-72 overflow-y-auto p-4 space-y-2 text-sm">
            {messages.map((msg, idx) => (
              <div key={idx} className={msg.from === "bot" ? "text-left" : "text-right"}>
                <span
                  className={`inline-block px-3 py-2 rounded-lg ${
                    msg.from === "bot"
                      ? "bg-blue-100 text-gray-800"
                      : "bg-green-100 text-gray-800"
                  }`}
                >
                  {msg.text}
                </span>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-200 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a question..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
            />
            <button
              onClick={handleSend}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2"
        >
          <MessageSquare className="w-5 h-5" />
          Ask StudentBot
        </button>
      )}
    </div>
  );
};

export default ChatBotWidget;
