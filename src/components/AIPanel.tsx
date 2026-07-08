import React from "react";
import { Sparkles, BrainCircuit, ShieldAlert, BadgeCheck, Lightbulb, CheckCircle } from "lucide-react";
import { Report } from "../types";

interface AIPanelProps {
  report: Report;
}

export default function AIPanel({ report }: AIPanelProps) {
  const isPendingAI = !report.aiSummary;

  const getSeverityBadgeColor = (severity?: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "HIGH": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "MEDIUM": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      default: return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950/90 border border-indigo-900/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background radial gradient representing smart AI power */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between border-b border-indigo-950 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-400/20">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-widest font-mono text-indigo-400 font-semibold">Gemini Advanced Suite</span>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              CIVICLife Report Analysis
            </h3>
          </div>
        </div>
        {report.isDuplicate ? (
          <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2.5 py-1 rounded-full font-mono font-medium">
            <ShieldAlert className="w-3.5 h-3.5" />
            Duplicate Case
          </span>
        ) : (
          <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-1 rounded-full font-mono font-medium">
            <BadgeCheck className="w-3.5 h-3.5" />
            Verified Case
          </span>
        )}
      </div>

      {isPendingAI ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <BrainCircuit className="w-10 h-10 text-slate-600 animate-spin mb-3" />
          <p className="text-xs text-slate-400 font-mono">Running Real-Time AI Diagnostics & Image Scans...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Metadata Badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">AI Evaluated Severity</span>
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border font-mono ${getSeverityBadgeColor(report.aiSeverity)}`}>
                {report.aiSeverity || "MEDIUM"}
              </span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Assigned Department</span>
              <span className="text-xs font-semibold text-slate-300 font-mono">
                {report.aiDepartment || "Public Works Dept"}
              </span>
            </div>
          </div>

          {/* AI Image Verification Audit */}
          {report.imageVerification && (
            <div className="bg-slate-900/40 border border-slate-800/80 p-3.5 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-indigo-400 font-mono uppercase block font-semibold">AI Photo Verification</span>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                  report.imageVerification.isRelevant 
                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40" 
                    : "bg-rose-950/40 text-rose-400 border-rose-900/40"
                }`}>
                  {report.imageVerification.isRelevant ? "Verified Relevant" : "Flagged Mismatch"}
                </span>
              </div>
              
              <div className="flex items-center justify-between bg-slate-950/50 px-2.5 py-1.5 rounded-lg border border-slate-900 text-xs">
                <span className="text-slate-400 font-mono">Relevance Score:</span>
                <span className={`font-bold font-mono ${
                  report.imageVerification.relevanceScore >= 70 ? "text-emerald-400" : "text-amber-400"
                }`}>{report.imageVerification.relevanceScore}%</span>
              </div>

              <p className="text-xs text-slate-300 bg-slate-950/20 p-2.5 rounded-lg leading-relaxed border border-slate-900/50">
                {report.imageVerification.reasoning}
              </p>

              {report.imageVerification.detectedObjects && report.imageVerification.detectedObjects.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {report.imageVerification.detectedObjects.map((obj, i) => (
                    <span key={i} className="text-[9px] bg-indigo-950/30 text-indigo-300 border border-indigo-900/30 px-2 py-0.5 rounded font-mono">
                      #{obj}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Automated Summary */}
          <div>
            <span className="text-[10px] text-indigo-400 font-mono uppercase block mb-1">Gemini Objective Summary</span>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3.5 rounded-xl border border-indigo-950">
              {report.aiSummary}
            </p>
          </div>

          {/* Suggested Resolution steps */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] text-amber-400 font-mono uppercase block">AI Recommended Solution Roadmap</span>
            </div>
            <div className="bg-slate-950/50 p-3.5 rounded-xl border border-indigo-950 text-xs text-slate-300">
              <ul className="space-y-2">
                {report.aiSolution?.split("\n").map((step, idx) => (
                  <li key={idx} className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                )) || <li>Examine wiring, verify power lines are clear, and replace bulb unit safely.</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
