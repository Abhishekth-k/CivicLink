import React, { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, X, AlertTriangle, Sparkles } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

type CaptureMode = "live" | "simulated";

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<CaptureMode>("live");

  const simulationPresets = [
    {
      id: "road",
      name: "Road Pothole Scene",
      url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800",
      description: "Severe road damage and cracked asphalt needing patching."
    },
    {
      id: "trash",
      name: "Illegal Dumping Scene",
      url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800",
      description: "Discarded garbage bags and cardboard cluttering sidewalk."
    },
    {
      id: "light",
      name: "Broken Lamp Scene",
      url: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&q=80&w=800",
      description: "Dark street pathway with broken light pole infrastructure."
    },
    {
      id: "water",
      name: "Water Leak Scene",
      url: "https://images.unsplash.com/photo-1542060748-10c28b629f6f?auto=format&fit=crop&q=80&w=800",
      description: "Broken water main valve leaking fluid onto the pavement."
    }
  ];

  const [selectedPresetId, setSelectedPresetId] = useState("road");

  // Load available camera devices
  useEffect(() => {
    async function getDevices() {
      try {
        if (typeof navigator === "undefined" || !navigator.mediaDevices) {
          setError("Hardware camera blocked in iframe sandbox. Automatically switched to interactive simulator.");
          setActiveMode("simulated");
          return;
        }
        const devs = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devs.filter((d) => d.kind === "videoinput");
        setDevices(videoDevs);
        if (videoDevs.length > 0 && !activeDeviceId) {
          setActiveDeviceId(videoDevs[0].deviceId);
        }
      } catch (err) {
        console.error("Error enumerating devices:", err);
      }
    }
    getDevices();
  }, [activeDeviceId]);

  // Start video stream when activeDeviceId changes or mode changes to live
  useEffect(() => {
    if (activeMode !== "live") {
      // Stop stream if we leave live mode
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    async function startStream() {
      setIsLoading(true);
      setError("");

      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        setError("Hardware camera blocked in iframe sandbox. Switched to interactive simulator.");
        setActiveMode("simulated");
        setIsLoading(false);
        return;
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      try {
        let stream;
        try {
          if (activeDeviceId) {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: activeDeviceId } },
              audio: false,
            });
          } else {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: "environment" },
              audio: false,
            });
          }
        } catch (idErr) {
          console.warn("Exact device ID search failed, trying general video constraint...", idErr);
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false,
          });
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Force play stream to bypass strict browser policies
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn("Auto-play was prevented by browser policy:", err);
            });
          }
        }

        // Try to enumerate devices again now that permission is granted
        try {
          const devs = await navigator.mediaDevices.enumerateDevices();
          const videoDevs = devs.filter((d) => d.kind === "videoinput");
          setDevices(videoDevs);
          if (videoDevs.length > 0 && !activeDeviceId) {
            setActiveDeviceId(videoDevs[0].deviceId);
          }
        } catch (enumErr) {
          console.warn("Could not re-enumerate devices post-permission:", enumErr);
        }

      } catch (err: any) {
        console.error("Error starting camera stream:", err);
        setError("Camera permission denied or unsupported. Switched to interactive simulator.");
        setActiveMode("simulated");
      } finally {
        setIsLoading(false);
      }
    }

    startStream();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeDeviceId, activeMode]);

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const width = video.videoWidth > 0 ? video.videoWidth : 640;
    const height = video.videoHeight > 0 ? video.videoHeight : 480;
    
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Mirror the captured photo to match the mirrored viewfinder experience
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.85);
      onCapture(base64);
    }
  };

  const switchCamera = () => {
    if (devices.length < 2) return;
    const currentIndex = devices.findIndex((d) => d.deviceId === activeDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    setActiveDeviceId(devices[nextIndex].deviceId);
  };

  const handleSimulatedCapture = () => {
    const selected = simulationPresets.find(p => p.id === selectedPresetId);
    if (selected) {
      onCapture(selected.url);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-4 shadow-2xl relative overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
            Photo Capture Hub
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode selectors */}
      <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800/60">
        <button
          type="button"
          onClick={() => setActiveMode("live")}
          className={`py-1.5 text-[10px] font-bold font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
            activeMode === "live"
              ? "bg-indigo-600 text-white shadow"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Live Camera
        </button>
        <button
          type="button"
          onClick={() => setActiveMode("simulated")}
          className={`py-1.5 text-[10px] font-bold font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
            activeMode === "simulated"
              ? "bg-indigo-600 text-white shadow"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Scene Simulator
        </button>
      </div>

      {/* Body */}
      {activeMode === "simulated" ? (
        <div className="space-y-4">
          <div className="bg-indigo-950/20 border border-indigo-900/30 p-3 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Simulation Mode Active</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Choose an issue scene to simulate taking a live municipal photo. This lets you test complete, multi-role AI validation & categorization workflows without needing hardware camera permissions.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] uppercase font-mono font-bold text-slate-400">
              Select Camera Scene Target
            </label>
            <div className="grid grid-cols-2 gap-2">
              {simulationPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`flex flex-col text-left p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                    selectedPresetId === preset.id
                      ? "border-indigo-500 bg-indigo-950/20 text-slate-100"
                      : "border-slate-800 hover:border-slate-750 text-slate-400 bg-slate-950/30"
                  }`}
                >
                  <span className="font-bold text-[10px] text-slate-200">{preset.name}</span>
                  <span className="text-[9px] text-slate-500 truncate mt-0.5">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-850">
            {/* Viewfinder Graphics */}
            <div className="absolute inset-0 border border-indigo-500/20 pointer-events-none z-10 m-3 rounded-lg">
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-indigo-400/60"></div>
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-indigo-400/60"></div>
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-indigo-400/60"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-indigo-400/60"></div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border border-dashed border-indigo-400/30 rounded-full flex items-center justify-center animate-[spin_20s_linear_infinite]">
                  <div className="w-2 h-2 bg-indigo-500/50 rounded-full"></div>
                </div>
              </div>
              
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-900/95 border border-slate-850 px-2 py-0.5 rounded text-[8px] font-mono text-indigo-400 uppercase tracking-widest animate-pulse">
                SIMULATION FEED
              </div>
            </div>

            <img
              src={simulationPresets.find((p) => p.id === selectedPresetId)?.url}
              alt="Simulated live stream"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-90 transition-all duration-300"
            />
          </div>

          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={handleSimulatedCapture}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
            >
              <Camera className="w-3.5 h-3.5" />
              Capture Simulated Photo
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="bg-red-950/40 border border-red-900/30 p-2.5 rounded-xl flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider font-mono">Live Hardware Camera Error</p>
                <p className="text-[10px] text-slate-300 leading-relaxed">{error}</p>
                <button
                  type="button"
                  onClick={() => setActiveMode("simulated")}
                  className="text-indigo-400 text-[10px] font-bold font-mono underline block pt-0.5"
                >
                  Switch to Scene Simulator instead &rarr;
                </button>
              </div>
            </div>
          )}

          <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-800">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            
            {/* Real Viewfinder Overlay */}
            <div className="absolute inset-0 border border-emerald-500/10 pointer-events-none z-10 m-3 rounded-lg">
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-400/40"></div>
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-400/40"></div>
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-400/40"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-400/40"></div>
              
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded text-[8px] font-mono text-emerald-400 uppercase tracking-widest animate-pulse">
                HARDWARE FEED
              </div>
            </div>
          </div>

          {/* Sandbox Fallback Assist */}
          <div className="bg-slate-950/50 border border-slate-850/60 p-3 rounded-xl text-center">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              💡 <strong>Camera Feed Black?</strong> Secure browsers block hardware camera access inside embedded previews.
              Click the <span className="text-indigo-400 font-bold cursor-pointer underline hover:text-indigo-300" onClick={() => setActiveMode("simulated")}>Scene Simulator</span> tab above to bypass restrictions and test AI features instantly!
            </p>
          </div>

          <div className="flex justify-center gap-3">
            {devices.length > 1 && (
              <button
                type="button"
                onClick={switchCamera}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Switch Camera
              </button>
            )}
            <button
              type="button"
              onClick={handleCapture}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Camera className="w-3.5 h-3.5" />
              Capture Live Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
