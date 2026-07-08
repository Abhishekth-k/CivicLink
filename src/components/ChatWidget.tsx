import React, { useState, useEffect, useRef } from "react";
import { Message, User } from "../types";
import { Send, User as UserIcon, MessageSquare } from "lucide-react";

interface ChatProps {
  reportId: number;
  currentUser: User;
  recipientUser: User | null;
}

export default function ChatWidget({ reportId, currentUser, recipientUser }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Poll for new messages
  useEffect(() => {
    async function loadChat() {
      try {
        const res = await fetch(`/api/chat/${reportId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (e) {
        console.error("Failed to load chat:", e);
      }
    }
    loadChat();
    const interval = setInterval(loadChat, 4000);
    return () => clearInterval(interval);
  }, [reportId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !recipientUser) return;

    const payload = {
      reportId,
      senderId: currentUser.id,
      receiverId: recipientUser.id,
      content: inputMsg.trim()
    };

    setInputMsg("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
      }
    } catch (e) {
      console.error("Failed to send message:", e);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[400px]">
      {/* Header */}
      <div className="bg-slate-950 px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-600/10 border border-indigo-400/20 flex items-center justify-center">
            {recipientUser?.avatar ? (
              <img src={recipientUser.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserIcon className="w-4 h-4 text-indigo-400" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">{recipientUser?.fullName || "Assigned Worker"}</h4>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">
              {recipientUser?.role === "SOCIAL_WORKER" ? "Field Social Worker" : "Citizen Coordinator"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[9px] uppercase font-semibold">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Connection</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MessageSquare className="w-8 h-8 text-slate-700 mb-2" />
            <p className="text-xs text-slate-500 font-mono">No messages exchanged yet.</p>
            <p className="text-[10px] text-slate-600 mt-1">Initiate conversation to coordinate on the task details.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-md ${
                    isMe
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50"
                  }`}
                >
                  <p>{msg.content}</p>
                  <span
                    className={`text-[8px] font-mono mt-1 block text-right opacity-60 ${
                      isMe ? "text-slate-200" : "text-slate-400"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder={`Coordinate with ${recipientUser?.fullName || "recipient"}...`}
          className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-colors font-sans"
        />
        <button
          type="submit"
          disabled={!inputMsg.trim() || !recipientUser}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white p-2 rounded-xl transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
