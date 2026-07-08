import React, { useState, useEffect } from "react";
import { User, Complaint } from "../types";
import { 
  MessageSquare, 
  Tag, 
  Send, 
  Sparkles, 
  UserCheck, 
  Shield, 
  Clock, 
  User as UserIcon, 
  AlertCircle,
  CheckCircle,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ComplaintBoxProps {
  currentUser: User;
  usersList: User[];
  onRefreshNotifications: () => void;
}

export default function ComplaintBox({ currentUser, usersList, onRefreshNotifications }: ComplaintBoxProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [messageText, setMessageText] = useState("");
  const [selectedOfficialId, setSelectedOfficialId] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [newlyAddedComplaint, setNewlyAddedComplaint] = useState<Complaint | null>(null);

  // Filter possible officials to tag: MANAGER and SUPER_ADMIN
  const officials = usersList.filter(
    (u) => u.role === "MANAGER" || u.role === "SUPER_ADMIN"
  );

  // Fetch complaints on load
  const fetchComplaints = async () => {
    try {
      const res = await fetch("/api/complaints");
      if (res.ok) {
        const data = await res.json();
        // Sort newest first
        setComplaints(data.reverse());
      }
    } catch (err) {
      console.error("Failed to fetch complaints", err);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [usersList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      setError("Please write a message before submitting.");
      return;
    }

    setError("");
    setSuccess(false);
    setIsSubmitting(true);
    setNewlyAddedComplaint(null);

    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          taggedUserId: selectedOfficialId ? Number(selectedOfficialId) : null,
          message: messageText
        })
      });

      if (res.ok) {
        const data = await res.json();
        setNewlyAddedComplaint(data);
        setMessageText("");
        setSuccess(true);
        onRefreshNotifications();
        await fetchComplaints();
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to submit your complaint.");
      }
    } catch (err) {
      setError("Connection failure. Please verify the server is active.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if a complaint is relevant to the logged-in user
  // - Citizens see what they sent
  // - Managers and Admins see everything, especially where they are tagged
  const filteredComplaints = complaints.filter((comp) => {
    if (currentUser.role === "SUPER_ADMIN") return true;
    if (currentUser.role === "MANAGER") return true; // Managers see all complaints to audit
    return comp.senderId === currentUser.id || comp.taggedUserId === currentUser.id;
  });

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Immersive Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <MessageSquare className="w-48 h-48 text-indigo-500" />
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Autonomous Response Terminal</span>
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">
            Civic Complaint Box
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Need urgent action on a civic concern? Address and tag any municipal manager or administrator. 
            Our advanced server-side Gemini AI model will instantly analyze your concern, dispatch notifications 
            to the tagged account, and auto-generate an immediate response outlining targeted action steps.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Submit New Complaint Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-md">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Tag className="w-4.5 h-4.5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Draft Message
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Tagged Account Selection */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Tag Municipal Account (Optional)
              </label>
              <div className="relative">
                <select
                  value={selectedOfficialId}
                  onChange={(e) => setSelectedOfficialId(e.target.value ? Number(e.target.value) : "")}
                  disabled={isSubmitting}
                  className="w-full bg-slate-950 border border-slate-850 text-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none"
                >
                  <option value="">No Tag (General Public Submission)</option>
                  {officials.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.role.replace("_", " ")} {u.department ? `• ${u.department}` : ""})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-sans leading-tight">
                If tagged, the specific official is notified instantly. If untagged, the Municipal Central Administration will review it, and all managers will be notified.
              </p>
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Your Concern / Message
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={isSubmitting}
                placeholder="Describe your civic complaint or message in detail (e.g. broken streetlight, street hazard, waste accumulation)..."
                rows={5}
                className="w-full bg-slate-950 border border-slate-850 text-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder-slate-600 resize-none leading-relaxed"
              />
            </div>

            {/* Error and Success Feedback Alerts */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl flex items-start gap-2 text-red-400 text-xs"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3.5 bg-emerald-950/40 border border-emerald-900/50 rounded-xl flex items-start gap-2.5 text-emerald-400 text-xs"
                >
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Complaint Filed Successfully!</p>
                    <p className="text-[10.5px] text-emerald-500/90 leading-tight">
                      The server-side Gemini intelligence engine has logged the concern and processed an instant reply from the tagged representative.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold font-mono tracking-wider text-white uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                isSubmitting 
                  ? "bg-slate-800 border border-slate-750 cursor-not-allowed" 
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/10 active:scale-[0.98]"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin" />
                  <span>Processing AI Response...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Complaint</span>
                </>
              )}
            </button>
          </form>

          {/* Guidelines info */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2">
            <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">
              SYSTEM RULES
            </span>
            <ul className="text-[10.5px] text-slate-500 space-y-1.5 list-disc list-inside">
              <li>Tagged Managers instantly receive real-time dashboard notifications.</li>
              <li>AI responses maintain strict official delegation standards.</li>
              <li>Abusive or spam messages will result in immediate citizen portal suspension.</li>
            </ul>
          </div>
        </div>

        {/* Right Side: Active Feed / Interactive Conversation */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-indigo-400" />
              <span>
                {currentUser.role === "CITIZEN" ? "My Complaints Feed" : "Global Complaints Desk"}
              </span>
            </h2>
            <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              {filteredComplaints.length} Total Messages
            </span>
          </div>

          {/* Newly added AI response highlighted preview */}
          <AnimatePresence>
            {newlyAddedComplaint && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-900 border border-indigo-500/30 p-5 rounded-3xl space-y-4 shadow-xl shadow-indigo-950/20"
              >
                <div className="flex items-center justify-between border-b border-indigo-900/40 pb-2.5">
                  <span className="text-[9.5px] font-mono font-extrabold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
                    Live AI Auto-Response Received
                  </span>
                  <span className="text-[8.5px] font-mono text-slate-500">Just Now</span>
                </div>

                <div className="space-y-3.5">
                  {/* Citizen's message block */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 font-mono">
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850/80 max-w-[85%]">
                      <span className="block text-[8.5px] font-mono text-slate-500 font-bold mb-0.5">
                        {currentUser.fullName} ({currentUser.role})
                      </span>
                      <p className="text-[11.5px] text-slate-300 leading-relaxed font-sans">
                        {newlyAddedComplaint.message}
                      </p>
                    </div>
                  </div>

                  {/* Representative AI message block */}
                  {(() => {
                    const taggedUserObj = usersList.find((u) => u.id === newlyAddedComplaint.taggedUserId);
                    const avatarUrl = taggedUserObj?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120";
                    return (
                      <div className="flex items-start gap-3 justify-end">
                        <div className="bg-indigo-900/20 p-4.5 rounded-2xl border border-indigo-500/20 max-w-[85%] text-left space-y-1">
                          <span className="block text-[8.5px] font-mono text-indigo-400 font-bold">
                            {newlyAddedComplaint.taggedUserName} (AI Delegated Auto-Response)
                          </span>
                          <p className="text-[12px] text-slate-200 leading-relaxed font-sans italic">
                            "{newlyAddedComplaint.aiResponse}"
                          </p>
                        </div>
                        <img
                          src={avatarUrl}
                          alt={newlyAddedComplaint.taggedUserName}
                          className="w-7 h-7 rounded-full object-cover border border-indigo-500 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Historical Scroll Feed */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {filteredComplaints.length === 0 ? (
              <div className="bg-slate-900 border border-slate-850 rounded-3xl p-10 text-center space-y-3.5">
                <MessageSquare className="w-10 h-10 text-slate-700 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400">No Complaints Registered Yet</p>
                  <p className="text-[10.5px] text-slate-500 max-w-sm mx-auto">
                    Be the first to request action! Draft a message on the left, tag an official, and get an instant AI evaluation.
                  </p>
                </div>
              </div>
            ) : (
              filteredComplaints.map((comp) => {
                const taggedUserObj = usersList.find((u) => u.id === comp.taggedUserId);
                const senderUserObj = usersList.find((u) => u.id === comp.senderId);
                const isTaggedMe = comp.taggedUserId === currentUser.id;

                return (
                  <motion.div
                    key={comp.id}
                    layoutId={`complaint-card-${comp.id}`}
                    className={`bg-slate-900 border ${
                      isTaggedMe ? "border-amber-500/20 bg-amber-950/5" : "border-slate-850"
                    } p-5 rounded-2xl space-y-4 hover:border-slate-800 transition-colors shadow-sm`}
                  >
                    {/* Top Status Meta */}
                    <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-850 pb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-bold">#{comp.id}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300 font-semibold flex items-center gap-1">
                          <UserIcon className="w-3 h-3 text-indigo-400" />
                          Sender: {comp.senderName}
                        </span>
                        {senderUserObj?.role === "CITIZEN" && (
                          <span className="bg-slate-950 text-emerald-400 text-[8px] font-bold px-1.5 py-0.2 rounded border border-emerald-950">
                            CITIZEN
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {new Date(comp.createdAt).toLocaleDateString()} at{" "}
                          {new Date(comp.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    {/* Messages bubbles thread */}
                    <div className="space-y-3.5">
                      {/* Sender Complaint Bubble */}
                      <div className="flex items-start gap-2.5">
                        <img
                          src={senderUserObj?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"}
                          alt={comp.senderName}
                          className="w-6.5 h-6.5 rounded-full object-cover border border-slate-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="bg-slate-950 border border-slate-850/80 px-3.5 py-2.5 rounded-2xl max-w-[85%]">
                          <span className="block text-[8.5px] font-mono text-slate-500 uppercase tracking-wider mb-0.5">
                            CIVIC CONCERN
                          </span>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {comp.message}
                          </p>
                        </div>
                      </div>

                      {/* AI Response Bubble representing Tagged User */}
                      <div className="flex items-start gap-2.5 justify-end">
                        <div className="bg-indigo-950/20 border border-indigo-900/10 px-3.5 py-2.5 rounded-2xl max-w-[85%] text-left">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            <span className="text-[8.5px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">
                              Tagged Official: {comp.taggedUserName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-200 leading-relaxed font-sans italic">
                            "{comp.aiResponse}"
                          </p>
                        </div>
                        <img
                          src={taggedUserObj?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120"}
                          alt={comp.taggedUserName}
                          className="w-6.5 h-6.5 rounded-full object-cover border border-indigo-500/40 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                    {/* Bottom action audit badge */}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-850/50 text-[9px] font-mono">
                      <span className="text-slate-500">
                        AUTONOMOUS DIRECTIVE DELEGATION STATUS: <strong className="text-emerald-500">VERIFIED</strong>
                      </span>
                      {isTaggedMe && (
                        <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                          ⚠️ TAGGED TO YOU
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
