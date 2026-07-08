import React, { useState, useEffect } from "react";
import {
  User,
  Report,
  Notification,
  SystemSettings,
  UserRole,
  Complaint
} from "./types";
import InteractiveMap from "./components/InteractiveMap";
import WeatherWidget from "./components/WeatherWidget";
import AIPanel from "./components/AIPanel";
import ChatWidget from "./components/ChatWidget";
import CameraCapture from "./components/CameraCapture";
import ComplaintBox from "./components/ComplaintBox";
import {
  ShieldAlert,
  MessageSquare,
  Users,
  AlertTriangle,
  Layers,
  FileText,
  CheckCircle,
  Clock,
  PlusCircle,
  MapPin,
  Sparkles,
  Activity,
  Send,
  UserCheck,
  Building,
  BarChart3,
  LogOut,
  Bell,
  Sliders,
  Camera,
  Download,
  Search,
  Check,
  UserX,
  RefreshCw,
  Award,
  Trash2,
  Info,
  ChevronLeft,
  ChevronRight,
  Menu,
  Upload,
  Link,
  Sun,
  CloudRain,
  Cloud,
  CloudLightning,
  Thermometer,
  Droplets,
  Navigation,
  Wind
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";

// List of standard categories requested by user
const CATEGORIES = [
  "Garbage",
  "Potholes",
  "Streetlight",
  "Water leakage",
  "Drainage",
  "Flood",
  "Fire",
  "Smoke",
  "Illegal dumping",
  "Road damage",
  "Tree fall",
  "Animal rescue",
  "Traffic",
  "Pollution",
  "Other"
];

// Preset simulated images for easy reporting selection (representing clean standard camera uploads)
const PRESET_CIVIC_IMAGES = [
  {
    name: "Deep Pothole",
    url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
    category: "Potholes"
  },
  {
    name: "Clogged Street Drain",
    url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600",
    category: "Drainage"
  },
  {
    name: "Flickering Streetlight",
    url: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&q=80&w=600",
    category: "Streetlight"
  },
  {
    name: "Water Main Leak",
    url: "https://images.unsplash.com/photo-1542060748-10c28b629f6f?auto=format&fit=crop&q=80&w=600",
    category: "Water leakage"
  }
];

// Preset simulated images representing resolved conditions for field work completed
const PRESET_RESOLVED_IMAGES = [
  {
    name: "Repaired Pavement",
    url: "https://images.unsplash.com/photo-1594913785162-e6785b49eed9?auto=format&fit=crop&q=80&w=600",
    category: "Potholes"
  },
  {
    name: "Clean Streetway",
    url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=600",
    category: "Garbage"
  },
  {
    name: "Functional LED Lamp",
    url: "https://images.unsplash.com/photo-1518331647614-7a1f04db3407?auto=format&fit=crop&q=80&w=600",
    category: "Streetlight"
  },
  {
    name: "Cleared Drainage Pipe",
    url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600",
    category: "Drainage"
  }
];

// Geocoding helper to translate typed address to coordinates in Springfield bounds
const geocodeAddress = (addr: string) => {
  const clean = addr.toLowerCase().trim();
  if (!clean) return { lat: 37.7749, lng: -122.4194 };
  
  // Landmark lookups
  if (clean.includes("maple")) return { lat: 37.7749, lng: -122.4194 };
  if (clean.includes("park") || clean.includes("oak")) return { lat: 37.7833, lng: -122.4167 };
  if (clean.includes("industrial") || clean.includes("parkway")) return { lat: 37.7794, lng: -122.4224 };
  if (clean.includes("broadway")) return { lat: 37.7700, lng: -122.4300 };
  if (clean.includes("washington")) return { lat: 37.7600, lng: -122.4200 };
  if (clean.includes("pine")) return { lat: 37.7650, lng: -122.4100 };
  if (clean.includes("evergreen") || clean.includes("simpson")) return { lat: 37.7800, lng: -122.4250 };
  
  // Stable hash-based deterministic geocoding
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = ((Math.abs(hash) % 100) / 4000) - 0.0125; 
  const lngOffset = ((Math.abs(hash >> 3) % 100) / 4000) - 0.0125;
  return {
    lat: 37.7749 + latOffset,
    lng: -122.4194 + lngOffset
  };
};

export default function App() {
  // Current user / role states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authEmailOrPhone, setAuthEmailOrPhone] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authRole, setAuthRole] = useState<UserRole>("CITIZEN");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [simulatedOtp, setSimulatedOtp] = useState("");

  // Core App states
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    enableAiClustering: "true",
    autoRoutingEnabled: "true",
    severityThreshold: "HIGH",
    alertContacts: "sanitation@springfield.gov, safety@springfield.gov"
  });

  // Active Views
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activityFilterMode, setActivityFilterMode] = useState<"all" | "mine">("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [avatarDragActive, setAvatarDragActive] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [avatarUploadStatus, setAvatarUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");

  // New Report Form state
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportCategory, setReportCategory] = useState("Garbage");
  const [reportLatitude, setReportLatitude] = useState(37.7749);
  const [reportLongitude, setReportLongitude] = useState(-122.4194);
  const [reportAddress, setReportAddress] = useState("Springfield Metro Center");
  const [reportImages, setReportImages] = useState<string[]>([]);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [aiAnalyzingBanner, setAiAnalyzingBanner] = useState(false);

  // AI Verification and Live Camera states
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVerifyingImage, setIsVerifyingImage] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isRelevant: boolean;
    relevanceScore: number;
    reasoning: string;
    detectedObjects: string[];
  } | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Native Wind Hero Telemetry Simulation states
  const [windSpeed, setWindSpeed] = useState<number>(14.5);
  const [bladePitch, setBladePitch] = useState<number>(12);
  const [brakeEngaged, setBrakeEngaged] = useState<boolean>(false);
  const [yawAngle, setYawAngle] = useState<number>(240);
  const [gridMode, setGridMode] = useState<"OPTIMAL" | "PEAK" | "ISOLATION">("OPTIMAL");

  // User-Location Weather Station Integration States
  const [controlMode, setControlMode] = useState<"weather" | "manual">("weather");
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherLocationName, setWeatherLocationName] = useState<string>("Springfield Metro Center");
  const [weatherTemp, setWeatherTemp] = useState<number>(18.5); // Celsius
  const [weatherCondition, setWeatherCondition] = useState<string>("Breezy");
  const [weatherWindDirection, setWeatherWindDirection] = useState<number>(240); // 0-360 degrees
  const [weatherHumidity, setWeatherHumidity] = useState<number>(65);
  const [weatherIsDay, setWeatherIsDay] = useState<boolean>(true);
  const [weatherSearchQuery, setWeatherSearchQuery] = useState<string>("");
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([
    "[01:10:45] Operational control localized to regional supervisor desk.",
    "[01:12:12] Springfield Smart Grid connected. Sync phase offset: 0.02 rad.",
    "[01:14:01] Rotor auto-pitch stabilization algorithm active."
  ]);
  const [powerHistory, setPowerHistory] = useState<{ time: string; MW: number }[]>([
    { time: "10s", MW: 12.4 },
    { time: "9s", MW: 12.8 },
    { time: "8s", MW: 13.1 },
    { time: "7s", MW: 12.9 },
    { time: "6s", MW: 13.5 },
    { time: "5s", MW: 14.1 },
    { time: "4s", MW: 14.5 },
    { time: "3s", MW: 14.2 },
    { time: "2s", MW: 14.6 },
    { time: "1s", MW: 14.8 }
  ]);

  const triggerImageVerification = async (imgUrl?: string) => {
    const targetImage = imgUrl || reportImages[0];
    if (!targetImage) return;
    
    setIsVerifyingImage(true);
    setVerificationError(null);
    setVerificationResult(null);

    try {
      const response = await fetch("/api/reports/verify-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: reportTitle,
          description: reportDescription,
          image: targetImage
        })
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationResult(data);
      } else {
        const err = await response.json();
        setVerificationError(err.error || "Failed to complete AI verification.");
      }
    } catch (e) {
      console.error(e);
      setVerificationError("Network error: AI image verification failed.");
    } finally {
      setIsVerifyingImage(false);
    }
  };
  const [locatingMethod, setLocatingMethod] = useState<"write" | "pin">("pin");
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [isGeocoding, setIsGeocoding] = useState(false);

  const triggerGeocoding = async (addr: string) => {
    if (!addr.trim()) return;
    setIsGeocoding(true);

    // 1. Try direct client-side Nominatim first (very reliable from user browser IP)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`,
        {
          headers: {
            "Accept": "application/json"
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setReportLatitude(lat);
          setReportLongitude(lng);
          setReportAddress(data[0].display_name);
          setIsGeocoding(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Direct client-side Nominatim failed, trying backend proxy...", err);
    }

    // 2. Try server-side geocoding proxy (which will fallback to Gemini if Nominatim is rate-limited on server)
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(addr)}`);
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data.lat === "number" && typeof data.lng === "number") {
          setReportLatitude(data.lat);
          setReportLongitude(data.lng);
          setReportAddress(data.display_name);
          setIsGeocoding(false);
          return;
        }
      }
    } catch (err) {
      console.error("Geocoding proxy fetch failed, falling back to local hash", err);
    }

    // 3. Fallback to local hash geocoding if both internet approaches fail
    const coords = geocodeAddress(addr);
    setReportLatitude(coords.lat);
    setReportLongitude(coords.lng);
    setIsGeocoding(false);
  };

  const compressImage = (
    source: File | string,
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.75
  ): Promise<string> => {
    return new Promise((resolve) => {
      const processImageSource = (src: string) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(src);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedBase64);
        };

        img.onerror = (err) => {
          console.error("Error loading image for compression:", err);
          resolve(typeof source === "string" ? source : src);
        };

        img.src = src;
      };

      if (source instanceof File) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            processImageSource(reader.result);
          } else {
            resolve("");
          }
        };
        reader.onerror = (err) => {
          console.error("FileReader error:", err);
          resolve("");
        };
        reader.readAsDataURL(source);
      } else {
        processImageSource(source);
      }
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Invalid file: Please upload a PNG, JPEG or SVG image file.");
      return;
    }

    setIsCompressingImage(true);
    setVerificationError(null);
    setVerificationResult(null);

    try {
      const compressedData = await compressImage(file);
      if (!compressedData) {
        setVerificationError("Failed to process image. Please try another file.");
        return;
      }

      setReportImages([compressedData]);
      if (reportTitle.trim() && reportDescription.trim()) {
        triggerImageVerification(compressedData);
      } else {
        setVerificationResult(null);
        setVerificationError("Photo processed & optimized. Enter a title and description, then click 'Verify with AI'.");
      }
    } catch (err) {
      console.error("Compression failed:", err);
      setVerificationError("Error optimizing image.");
    } finally {
      setIsCompressingImage(false);
    }
  };

  // Weather fetcher and geolocation sync
  const fetchWeatherByCoords = async (lat: number, lon: number, customName?: string) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      // 1. Fetch current weather from Open-Meteo
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m,wind_direction_10m&wind_speed_unit=ms`;
      const weatherRes = await fetch(weatherUrl);
      if (!weatherRes.ok) throw new Error("Weather service offline");
      const weatherJson = await weatherRes.json();
      const current = weatherJson?.current;
      
      if (current) {
        setWeatherTemp(current.temperature_2m);
        setWeatherHumidity(current.relative_humidity_2m);
        setWeatherIsDay(current.is_day === 1);
        setWeatherWindDirection(current.wind_direction_10m);
        
        // Update turbine simulation states based on actual real-world values!
        setWindSpeed(Math.max(3.0, Math.min(30.0, current.wind_speed_10m))); // Clamp to reasonable turbine range
        
        // Map open-meteo weather codes to nice human readable strings
        const code = current.weather_code;
        let cond = "Breezy";
        if (code === 0) cond = "Clear Sky";
        else if (code >= 1 && code <= 3) cond = "Partly Cloudy";
        else if (code >= 45 && code <= 48) cond = "Foggy";
        else if (code >= 51 && code <= 67) cond = "Rainy";
        else if (code >= 71 && code <= 77) cond = "Snowy";
        else if (code >= 80 && code <= 82) cond = "Rain Showers";
        else if (code >= 85 && code <= 86) cond = "Snow Showers";
        else if (code >= 95 && code <= 99) cond = "Thunderstorm";
        setWeatherCondition(cond);
        
        // Add a telemetry log about the automatic grid coupling to the weather station
        setTelemetryLogs((prev) => [
          `[${new Date().toLocaleTimeString()}] Weather Station Sync: Connected to ${customName || "Coordinates " + lat.toFixed(2) + ", " + lon.toFixed(2)}.`,
          `[${new Date().toLocaleTimeString()}] Wind vector updated to ${current.wind_speed_10m.toFixed(1)} m/s at heading ${current.wind_direction_10m}°.`,
          ...prev.slice(0, 8)
        ]);
      }

      // 2. If no custom name, reverse-geocode using Nominatim to get actual city
      if (!customName) {
        try {
          const revUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
          const revRes = await fetch(revUrl, {
            headers: {
              "Accept-Language": "en"
            }
          });
          if (revRes.ok) {
            const revJson = await revRes.json();
            const address = revJson.address;
            const city = address.city || address.town || address.village || address.suburb || address.county || "Local Area";
            const state = address.state || address.country || "";
            setWeatherLocationName(state ? `${city}, ${state}` : city);
          } else {
            setWeatherLocationName(`${lat.toFixed(2)}°, ${lon.toFixed(2)}°`);
          }
        } catch {
          setWeatherLocationName(`${lat.toFixed(2)}°, ${lon.toFixed(2)}°`);
        }
      } else {
        setWeatherLocationName(customName);
      }
    } catch (err: any) {
      console.error(err);
      setWeatherError(err.message || "Failed to load weather data");
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleFetchCurrentLocationWeather = () => {
    if (!navigator.geolocation) {
      setWeatherError("Geolocation is not supported by your browser");
      return;
    }
    setWeatherLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherByCoords(lat, lon);
      },
      (error) => {
        console.warn("Geolocation permission error/denied:", error);
        // Fallback to Springfield (default coordinates)
        fetchWeatherByCoords(37.7749, -122.4194, "Springfield Metro (Fallback)");
        setWeatherError("Location access declined. Showing default location weather.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSearchWeather = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weatherSearchQuery.trim()) return;
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(weatherSearchQuery)}&limit=1`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) throw new Error("Geocoding service unavailable");
      const geoJson = await geoRes.json();
      if (geoJson && geoJson.length > 0) {
        const lat = parseFloat(geoJson[0].lat);
        const lon = parseFloat(geoJson[0].lon);
        const displayName = geoJson[0].display_name;
        const parts = displayName.split(",");
        const formattedName = parts.length > 1 ? `${parts[0].trim()}, ${parts[1].trim()}` : parts[0].trim();
        await fetchWeatherByCoords(lat, lon, formattedName);
        setWeatherSearchQuery("");
      } else {
        throw new Error("Location not found");
      }
    } catch (err: any) {
      setWeatherError(err.message || "Search failed");
      setWeatherLoading(false);
    }
  };

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Worker Action states
  const [workerAfterImage, setWorkerAfterImage] = useState("");
  const [workerStatement, setWorkerStatement] = useState("");
  const [workerActionLoading, setWorkerActionLoading] = useState(false);

  // Manager Assign Action state
  const [selectedWorkerId, setSelectedWorkerId] = useState<number>(0);

  // Load Initial Core Application Data
  const loadAppData = async () => {
    try {
      // Load reports
      const reportsRes = await fetch("/api/reports");
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData);
      }
      // Load users
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData);
      }
      // Load settings
      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch (e) {
      console.error("Failed to load core application resources:", e);
    }
  };

  useEffect(() => {
    loadAppData();
    handleFetchCurrentLocationWeather();
    const timer = setInterval(loadAppData, 6000);
    return () => clearInterval(timer);
  }, []);

  // Load user specific notifications
  useEffect(() => {
    if (currentUser) {
      const loadNotifications = async () => {
        try {
          const res = await fetch(`/api/notifications/${currentUser.id}`);
          if (res.ok) {
            const data = await res.json();
            setNotifications(data);
          }
        } catch (e) {
          console.error("Notifications fetch failed", e);
        }
      };
      loadNotifications();
    }
  }, [currentUser, reports]);

  // Request OTP Handler
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmailOrPhone.trim()) {
      setAuthError("Email or Phone number is required.");
      return;
    }
    setAuthError("");
    setIsAuthLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrPhone: authEmailOrPhone,
          role: authRole,
          isLogin: !isRegistering
        })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setSimulatedOtp(data.otp);
      } else {
        setAuthError(data.message || "Failed to send OTP.");
      }
    } catch (e) {
      setAuthError("Failed to reach auth server. Please try again.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Verify OTP Handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setAuthError("OTP code is required.");
      return;
    }
    setAuthError("");
    setIsAuthLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrPhone: authEmailOrPhone,
          otp: otpCode,
          isLogin: !isRegistering,
          fullName: authFullName,
          role: authRole
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        // Clean auth states
        setAuthEmailOrPhone("");
        setAuthFullName("");
        setOtpSent(false);
        setOtpCode("");
        setSimulatedOtp("");
        setActiveTab("dashboard");
      } else {
        setAuthError(data.message || "Invalid OTP code.");
      }
    } catch (e) {
      setAuthError("Verification failed due to a network error.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Citizen Submit Complaint Handler
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim() || !reportDescription.trim()) return;

    setIsSubmittingReport(true);
    setAiAnalyzingBanner(true);

    const payload = {
      title: reportTitle,
      description: reportDescription,
      category: reportCategory,
      latitude: reportLatitude,
      longitude: reportLongitude,
      address: reportAddress,
      images: reportImages.length > 0 ? reportImages : ["https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800"],
      citizenId: currentUser?.id || 1,
      imageVerification: verificationResult
    };

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const createdReport = await res.json();
        setReports((prev) => [createdReport, ...prev]);
        setSelectedReport(createdReport);
        // Reset form
        setReportTitle("");
        setReportDescription("");
        setReportImages([]);
        setReportAddress("Springfield Metro Center");
        setVerificationResult(null);
        setVerificationError(null);
        setActiveTab("dashboard");
      }
    } catch (e) {
      console.error("Report creation failed", e);
    } finally {
      setIsSubmittingReport(false);
      setAiAnalyzingBanner(false);
    }
  };

  // Social Worker Accept Task
  const handleWorkerAccept = async (reportId: number) => {
    setWorkerActionLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" })
      });
      if (res.ok) {
        const updated = await res.json();
        setReports((prev) => prev.map((r) => r.id === reportId ? updated : r));
        setSelectedReport(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWorkerActionLoading(false);
    }
  };

  // Social Worker Solve Task with After Photo
  const handleWorkerComplete = async (reportId: number) => {
    if (!workerAfterImage.trim()) return;
    setWorkerActionLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "RESOLVED",
          afterImage: workerAfterImage,
          workerStatement: workerStatement.trim() || "Resolved successfully by municipal field team."
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setReports((prev) => prev.map((r) => r.id === reportId ? updated : r));
        setSelectedReport(updated);
        setWorkerAfterImage("");
        setWorkerStatement("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWorkerActionLoading(false);
    }
  };

  // Manager Assign Worker
  const handleAssignWorker = async (reportId: number) => {
    if (!selectedWorkerId) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          assignedWorkerId: selectedWorkerId,
          status: "ASSIGNED"
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setReports((prev) => prev.map((r) => r.id === reportId ? updated : r));
        setSelectedReport(updated);
        setSelectedWorkerId(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin Suspend User
  const handleToggleSuspendUser = async (userId: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended: !currentStatus })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUsersList((prev) => prev.map((u) => u.id === userId ? updatedUser : u));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin Delete Report
  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this complaint report? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        setSelectedReport(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mark all notifications as read
  const handleMarkNotificationsRead = async () => {
    if (!currentUser) return;
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // Export Reports to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Title,Category,Priority,Status,Address,Latitude,Longitude,Created At,Resolved At\n";
    
    filteredReports.forEach((r) => {
      const row = `${r.id},"${r.title.replace(/"/g, '""')}",${r.category},${r.priority},${r.status},"${r.address.replace(/"/g, '""')}",${r.latitude},${r.longitude},${r.createdAt},${r.resolvedAt || "N/A"}`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `civiclife_reports_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Wind Turbine operations simulation loop
  useEffect(() => {
    if (currentUser) return; // Only simulate on landing/login page
    
    const LOG_TEMPLATES = [
      "Coupled safely into Springfield load center at 60.01 Hz.",
      "Anemometer reading adjusted; active yaw alignment compensated.",
      "Vibration diagnostics: 0.018 mm/s peak-to-peak (Ideal status).",
      "Generator rotor core temperature: 41.5°C (Nominal).",
      "Dynamic blade pitch pitch dampening calibrated to wind gust envelope.",
      "Overdrive system power coupled and balanced automatically.",
      "Springfield Smart Grid coupling ratio verified at 1.04.",
      "Yaw motors locked. Vector matches optimal wind current profile."
    ];

    const interval = setInterval(() => {
      // 1. Gently fluctuate wind speed
      setWindSpeed((prev) => {
        const delta = (Math.random() - 0.5) * 0.4;
        const next = prev + delta;
        return parseFloat(Math.min(29.5, Math.max(2.5, next)).toFixed(2));
      });

      // 2. Generate new power output and push to history
      setPowerHistory((prev) => {
        const yawErrorRad = Math.abs(yawAngle - 240) * Math.PI / 180;
        const pitchFactor = Math.cos(bladePitch * Math.PI / 180);
        const efficiency = Math.max(0, pitchFactor * Math.cos(yawErrorRad));
        const activeMW = brakeEngaged ? 0 : Math.max(0, parseFloat(((windSpeed ** 2.1) * 0.015 * efficiency).toFixed(2)));

        const updated = [...prev.slice(1), { time: `${new Date().getSeconds()}s`, MW: activeMW }];
        return updated;
      });

      // 3. Low chance to append a simulated operational log
      if (Math.random() < 0.15) {
        setTelemetryLogs((prev) => {
          const randomMsg = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
          const logMsg = `[${new Date().toLocaleTimeString()}] ${randomMsg}`;
          const updated = [logMsg, ...prev];
          return updated.slice(0, 5); // keep last 5
        });
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [currentUser, windSpeed, bladePitch, yawAngle, brakeEngaged]);

  // Filter & Search computation
  const filteredReports = reports.filter((r) => {
    const matchesCategory = categoryFilter === "All" || r.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    const matchesSearch = 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesActivity = true;
    if (activityFilterMode === "mine" && currentUser) {
      if (currentUser.role === "CITIZEN") {
        matchesActivity = r.citizenId === currentUser.id;
      } else if (currentUser.role === "SOCIAL_WORKER") {
        matchesActivity = r.assignedWorkerId === currentUser.id;
      }
    }
    
    return matchesCategory && matchesStatus && matchesSearch && matchesActivity;
  });

  // Recharts Dashboard Data Prep
  const categoryData = CATEGORIES.map((cat) => {
    const count = reports.filter((r) => r.category === cat).length;
    return { name: cat, count };
  }).filter((c) => c.count > 0);

  const statusData = [
    { name: "Submitted", count: reports.filter((r) => r.status === "SUBMITTED").length, color: "#eab308" },
    { name: "Reviewed", count: reports.filter((r) => r.status === "REVIEWED").length, color: "#a855f7" },
    { name: "Assigned", count: reports.filter((r) => r.status === "ASSIGNED").length, color: "#3b82f6" },
    { name: "In Progress", count: reports.filter((r) => r.status === "IN_PROGRESS").length, color: "#ec4899" },
    { name: "Resolved", count: reports.filter((r) => r.status === "RESOLVED").length, color: "#10b981" }
  ];

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  // Render Login page if user not logged in
  if (!currentUser) {
    const guestProfiles = [
      {
        name: "John Doe",
        email: "citizen@civiclink.ai",
        role: "CITIZEN",
        otp: "111111",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
        desc: "Citizen Portal: File complaints, earn civic points, view local map coordinates."
      },
      {
        name: "Bob Builder",
        email: "worker@civiclink.ai",
        role: "SOCIAL_WORKER",
        otp: "111111",
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120",
        desc: "Field Worker Console: Claim tasks, upload 'after' resolution photos, live routing."
      },
      {
        name: "Vivek Manager",
        email: "vivek.in",
        role: "MANAGER",
        otp: "111111",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
        desc: "Regional Manager Desk: Inspect telemetry, assign social workers, review system health."
      },
      {
        name: "Super Admin",
        email: "vivekananda.in",
        role: "SUPER_ADMIN",
        otp: "888888",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120",
        desc: "Diagnostics Terminal: View full audit trails, manage users, edit critical parameters."
      }
    ];

    const handleGuestLogin = async (email: string, otpVal: string, name: string, role: string) => {
      setIsAuthLoading(true);
      setAuthError("");
      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailOrPhone: email,
            otp: otpVal,
            isLogin: true,
            fullName: name,
            role: role
          })
        });
        const data = await res.json();
        if (res.ok) {
          setCurrentUser(data.user);
          setAuthEmailOrPhone("");
          setAuthFullName("");
          setOtpSent(false);
          setOtpCode("");
          setSimulatedOtp("");
          setActiveTab("dashboard");
        } else {
          setAuthError(data.message || "Guest login failed.");
        }
      } catch (e) {
        setAuthError("Failed to reach auth server for guest login.");
      } finally {
        setIsAuthLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative overflow-hidden select-none">
        
        {/* Embedded Keyframe Animations for Wind currents and Turbine spins */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin-cw {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes wind-current-1 {
            0% { transform: translateX(-150px); opacity: 0; }
            10% { opacity: 0.12; }
            90% { opacity: 0.12; }
            100% { transform: translateX(100vw); opacity: 0; }
          }
          @keyframes wind-current-2 {
            0% { transform: translateX(-150px); opacity: 0; }
            15% { opacity: 0.18; }
            85% { opacity: 0.18; }
            100% { transform: translateX(100vw); opacity: 0; }
          }
          @keyframes glow-pulse {
            0%, 100% { opacity: 0.25; }
            50% { opacity: 0.6; }
          }
        ` }} />

        {/* Ambient background glowing orbs */}
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />

        {/* Dynamic Flying Wind Particles in the background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent rounded-full w-[160px]" style={{ top: '15%', left: '-150px', animation: 'wind-current-1 9s linear infinite', animationDelay: '0.5s' }} />
          <div className="absolute h-[1px] bg-gradient-to-r from-transparent via-indigo-400/25 to-transparent rounded-full w-[240px]" style={{ top: '35%', left: '-150px', animation: 'wind-current-2 13s linear infinite', animationDelay: '3s' }} />
          <div className="absolute h-[2px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent rounded-full w-[180px]" style={{ top: '55%', left: '-150px', animation: 'wind-current-1 11s linear infinite', animationDelay: '1.2s' }} />
          <div className="absolute h-[1px] bg-gradient-to-r from-transparent via-sky-400/30 to-transparent rounded-full w-[220px]" style={{ top: '75%', left: '-150px', animation: 'wind-current-2 8s linear infinite', animationDelay: '5s' }} />
          <div className="absolute h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent rounded-full w-[150px]" style={{ top: '88%', left: '-150px', animation: 'wind-current-1 14s linear infinite', animationDelay: '2.5s' }} />
        </div>

        {/* Left Side: Advanced Glassmorphic Operations & Login Sidebar Console */}
        <div className="relative z-20 w-full md:w-[480px] lg:w-[540px] xl:w-[580px] min-h-screen bg-white/90 backdrop-blur-2xl border-r border-slate-200 flex flex-col justify-between p-6 sm:p-10 overflow-y-auto shadow-[15px_0_30px_rgba(0,0,0,0.04)]">
          
          {/* Header Branding */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-sky-500 rounded-2xl shadow-lg shadow-indigo-600/20">
                <Layers className="w-5.5 h-5.5 text-white" />
              </div>
              <div>
                <span className="text-sm font-black text-slate-900 tracking-widest uppercase font-mono block">CIVICLife</span>
                <span className="text-[10px] text-indigo-600 font-mono tracking-wider font-bold">Way of Smart City</span>
              </div>
            </div>

            {/* Simulated Verification Banner when OTP is sent */}
            {otpSent && simulatedOtp && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl shadow-sm animate-fade-in text-left">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-wide">Secure Message Delivery</span>
                </div>
                <p className="text-xs text-slate-700 font-mono leading-relaxed">
                  Incoming verification token for <span className="text-emerald-900 font-bold">{authEmailOrPhone}</span>:<br />
                  OTP Code: <span className="text-emerald-600 font-black text-base tracking-widest underline decoration-2">{simulatedOtp}</span>
                </p>
              </div>
            )}

            {/* Welcome text */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                {isRegistering ? "Create Credentials" : "Operations Desk"}
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                {isRegistering 
                  ? "Initialize smart-city credentials to coordinate municipal tasks or report regional service issues." 
                  : "Authorized municipal supervisors, social workers, and residents register/log in via OTP."}
              </p>
            </div>

            {/* Error notifications */}
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-mono text-center animate-shake">
                {authError}
              </div>
            )}

            {/* Main Interactive Form Area */}
            <div className="space-y-4 pt-2">
              {!otpSent ? (
                /* STEP 1: Request OTP */
                <form onSubmit={handleSendOtp} className="space-y-4">
                  {isRegistering && (
                    <div>
                      <label className="block text-[9px] uppercase font-mono text-slate-500 font-bold tracking-wider mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={authFullName}
                        onChange={(e) => setAuthFullName(e.target.value)}
                        className="w-full bg-slate-100 border border-slate-200 text-xs text-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                        placeholder="e.g., Jane Smith"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[9px] uppercase font-mono text-slate-500 font-bold tracking-wider mb-1">Email or Phone Number</label>
                    <input
                      type="text"
                      required
                      value={authEmailOrPhone}
                      onChange={(e) => setAuthEmailOrPhone(e.target.value)}
                      className="w-full bg-slate-100 border border-slate-200 text-xs text-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      placeholder="name@domain.com or +15551234567"
                    />
                  </div>

                  {isRegistering && (
                    <div>
                      <label className="block text-[9px] uppercase font-mono text-slate-500 font-bold tracking-wider mb-1">Select Role</label>
                      <select
                        value={authRole}
                        onChange={(e) => setAuthRole(e.target.value as UserRole)}
                        className="w-full bg-slate-100 border border-slate-200 text-xs text-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer font-mono"
                      >
                        <option value="CITIZEN">Citizen (Report Issues)</option>
                        <option value="SOCIAL_WORKER">Social Worker (Solve Field Tasks)</option>
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg shadow-indigo-600/20 font-mono"
                  >
                    {isAuthLoading ? "Verifying Contact..." : "Dispatch secure authentication code"}
                  </button>
                </form>
              ) : (
                /* STEP 2: Verify OTP */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[9px] uppercase font-mono text-slate-500 font-bold tracking-wider">Verification Token</label>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-[9px] text-indigo-600 hover:underline cursor-pointer font-mono"
                      >
                        Edit Number
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full bg-slate-100 border border-slate-200 text-xs text-slate-800 px-4 py-3.5 rounded-xl text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      placeholder="••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg shadow-emerald-600/20 font-mono"
                  >
                    {isAuthLoading ? "Authenticating..." : isRegistering ? "Verify & Initialize" : "Verify & Access Console"}
                  </button>
                </form>
              )}
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setOtpSent(false);
                  setAuthError("");
                  setSimulatedOtp("");
                }}
                className="text-xs text-indigo-600 hover:text-indigo-500 cursor-pointer font-mono font-semibold"
              >
                {isRegistering ? "← Back to Registered User Login" : "Register a new Municipal or Citizen account"}
              </button>
            </div>
          </div>

          {/* Quick Demo Access Console - The Custom Guest Reference Board */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-slate-500 block mb-3">
              Quick Demonstration Reference Desk
            </span>
            
            <div className="grid grid-cols-1 gap-2.5">
              {guestProfiles.map((p) => (
                <button
                  key={p.email}
                  disabled={isAuthLoading}
                  onClick={() => handleGuestLogin(p.email, p.otp, p.name, p.role)}
                  className="group relative flex items-start gap-3 bg-slate-100/60 hover:bg-slate-100 hover:border-indigo-500/30 border border-slate-200/80 p-3 rounded-2xl text-left transition-all duration-300 hover:shadow-lg cursor-pointer"
                >
                  <img 
                    src={p.avatar} 
                    alt={p.name} 
                    className="w-9 h-9 rounded-xl border border-slate-200 object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-slate-950 transition-colors">{p.name}</span>
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                        p.role === "SUPER_ADMIN" ? "bg-red-50 text-red-700 border border-red-200" :
                        p.role === "MANAGER" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        p.role === "SOCIAL_WORKER" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                        "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {p.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-tight">
                      {p.desc}
                    </p>
                    <span className="text-[9px] font-mono text-indigo-600 font-semibold group-hover:underline block pt-0.5">
                      Launch Instant Portal →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="mt-8 text-[9.5px] font-mono text-slate-500 flex items-center justify-between">
            <span>Springfield System v4.81</span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              TELEMETRY CONNECTED
            </span>
          </div>

        </div>

        {/* Right Side: Immersive, High-Fidelity "Wind Hero" Inspired Telemetry Dashboard */}
        {(() => {
          // Dynamic Telemetry Calculations
          const idealHeading = weatherWindDirection !== undefined ? weatherWindDirection : 240;
          const yawErrorRad = Math.abs(yawAngle - idealHeading) * Math.PI / 180;
          const pitchFactor = Math.cos(bladePitch * Math.PI / 180);
          const efficiency = Math.max(0, pitchFactor * Math.cos(yawErrorRad));
          const activeMW = brakeEngaged ? 0 : Math.max(0, parseFloat(((windSpeed ** 2.1) * 0.015 * efficiency).toFixed(2)));
          const activeRpm = brakeEngaged ? 0 : Math.max(0, parseFloat((windSpeed * 1.6 * (1 - bladePitch / 90) * Math.max(0, Math.cos(yawErrorRad))).toFixed(1)));
          const efficiencyPercent = Math.max(0, Math.min(100, Math.round(efficiency * 100)));
          const spinDuration = activeRpm > 0 ? (60 / activeRpm) : 0;

          // Polyline generator for custom live power chart (neon-cyan look)
          const chartPoints = powerHistory.map((pt, idx) => {
            const x = (idx / (powerHistory.length - 1)) * 260 + 10;
            const y = 75 - (Math.min(30, pt.MW) / 30) * 60;
            return `${x},${y}`;
          }).join(" ");
          const fillPoints = `10,75 ${chartPoints} 270,75`;

          return (
            <div className="flex-1 min-h-screen flex flex-col xl:flex-row bg-slate-100/40 relative overflow-hidden border-t md:border-t-0 md:border-l border-slate-200 p-6 lg:p-10 gap-6 lg:gap-8 justify-center items-center z-20">
              
              {/* Left Column of Dashboard: SVG Turbines & live diagnostic gauges */}
              <div className="w-full xl:max-w-xl flex flex-col justify-between h-full space-y-6">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 border border-cyan-200/50 mb-2">
                    <Sparkles className="w-3 h-3" />
                    WIND TELEMETRY NETWORK • SYSTEM OK
                  </span>
                  <h2 className="text-2xl font-black text-slate-950 tracking-tight uppercase">
                    Springfield Eco-Grid Telemetry
                  </h2>
                  <p className="text-xs text-slate-600 max-w-md">
                    Custom wind micro-grid performance nodes monitoring kinetic conservation, municipal carbon offsets, and high-tech real-time load coupling.
                  </p>
                </div>

                {/* SVG perspective scene of turbines */}
                <div className="relative bg-white border border-slate-200 rounded-3xl p-4 overflow-hidden shadow-sm flex items-center justify-center">
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[9px] font-mono font-bold text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    PERSPECTIVE MULTI-NODE CAMERA
                  </div>

                  <svg viewBox="0 0 400 320" className="w-full max-h-[290px] text-slate-400 select-none">
                    {/* Horizon landscape grid line */}
                    <line x1="10" y1="280" x2="390" y2="280" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
                    
                    {/* Background small turbine */}
                    <g opacity="0.4">
                      {/* Tower */}
                      <polygon points="76,280 84,280 81,180 79,180" fill="#334155" />
                      {/* Blades */}
                      <g style={{
                        transformOrigin: "80px 180px",
                        animation: spinDuration > 0 ? `spin-cw ${spinDuration * 1.5}s linear infinite` : "none"
                      }}>
                        <circle cx="80" cy="180" r="3" fill="#e2e8f0" />
                        <path d="M 80 180 L 80 130 L 81.5 130 Z" fill="#64748b" />
                        <path d="M 80 180 L 80 130 L 81.5 130 Z" fill="#64748b" transform="rotate(120, 80, 180)" />
                        <path d="M 80 180 L 80 130 L 81.5 130 Z" fill="#64748b" transform="rotate(240, 80, 180)" />
                      </g>
                    </g>

                    {/* Midground medium turbine */}
                    <g opacity="0.65">
                      {/* Tower */}
                      <polygon points="281,280 291,280 287,140 285,140" fill="#475569" />
                      {/* Blades */}
                      <g style={{
                        transformOrigin: "286px 140px",
                        animation: spinDuration > 0 ? `spin-cw ${spinDuration * 1.25}s linear infinite` : "none"
                      }}>
                        <circle cx="286" cy="140" r="4" fill="#f1f5f9" />
                        <path d="M 286 140 L 286 80 L 288 80 Z" fill="#94a3b8" />
                        <path d="M 286 140 L 286 80 L 288 80 Z" fill="#94a3b8" transform="rotate(120, 286, 140)" />
                        <path d="M 286 140 L 286 80 L 288 80 Z" fill="#94a3b8" transform="rotate(240, 286, 140)" />
                      </g>
                    </g>

                    {/* Foreground large turbine */}
                    <g>
                      {/* Tower */}
                      <polygon points="181,280 195,280 189,80 187,80" fill="#64748b" />
                      <circle cx="188" cy="80" r="8" fill="#475569" />
                      {/* Red beacon light on nacelle */}
                      <circle cx="188" cy="74" r="2.5" fill="#ef4444" className="animate-pulse" />
                      {/* Blades */}
                      <g style={{
                        transformOrigin: "188px 80px",
                        animation: spinDuration > 0 ? `spin-cw ${spinDuration}s linear infinite` : "none"
                      }}>
                        {/* Center Cap */}
                        <circle cx="188" cy="80" r="6" fill="#f8fafc" />
                        {/* Blade 1 */}
                        <path d="M 188 80 L 188 -10 C 190 -10, 192 -2, 191 16 C 190 34, 189 58, 188 80" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
                        <path d="M 188 -10 L 188 -18 L 190 -18 Z" fill="#ef4444" /> {/* Red safety tip */}
                        {/* Blade 2 */}
                        <g transform="rotate(120, 188, 80)">
                          <path d="M 188 80 L 188 -10 C 190 -10, 192 -2, 191 16 C 190 34, 189 58, 188 80" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
                          <path d="M 188 -10 L 188 -18 L 190 -18 Z" fill="#ef4444" />
                        </g>
                        {/* Blade 3 */}
                        <g transform="rotate(240, 188, 80)">
                          <path d="M 188 80 L 188 -10 C 190 -10, 192 -2, 191 16 C 190 34, 189 58, 188 80" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
                          <path d="M 188 -10 L 188 -18 L 190 -18 Z" fill="#ef4444" />
                        </g>
                      </g>
                    </g>
                  </svg>
                </div>

                {/* Grid of live digital readouts / gauges */}
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-2 gap-3">
                  <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider">Active Output</span>
                    <span className="text-xl font-black text-cyan-600 font-mono block mt-1">
                      {activeMW.toFixed(2)} <span className="text-[10px] text-slate-500">MW</span>
                    </span>
                    <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                      <div className="bg-cyan-500 h-full transition-all duration-500" style={{ width: `${Math.min(100, (activeMW / 25) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider">Rotor Velocity</span>
                    <span className="text-xl font-black text-indigo-600 font-mono block mt-1">
                      {activeRpm.toFixed(1)} <span className="text-[10px] text-slate-500">RPM</span>
                    </span>
                    <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                      <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${Math.min(100, (activeRpm / 35) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider">System Efficiency</span>
                    <span className="text-xl font-black text-emerald-600 font-mono block mt-1">
                      {efficiencyPercent}%
                    </span>
                    <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${efficiencyPercent}%` }} />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider">Carbon Savings</span>
                    <span className="text-xl font-black text-pink-600 font-mono block mt-1">
                      {(284.19 + (activeMW * 0.08)).toFixed(2)} <span className="text-[10px] text-slate-500">kg</span>
                    </span>
                    <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                      <div className="bg-pink-500 h-full animate-pulse" style={{ width: '70%' }} />
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column of Dashboard: Interactive Sliders, Live SVG chart and Scrolling telemetry logs */}
              <div className="w-full xl:max-w-md flex flex-col gap-6 justify-between h-full">
                
                {/* Live Weather Station / Control Center card */}
                <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-5 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-xs font-black font-mono text-slate-900 tracking-wider uppercase flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        Live Weather Station
                      </h3>
                      <p className="text-[8px] font-mono text-slate-400 uppercase mt-0.5">Eco-Grid Direct Integration</p>
                    </div>
                    
                    {/* Mode Toggle Tabs */}
                    <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[9px] font-bold font-mono shrink-0">
                      <button
                        onClick={() => setControlMode("weather")}
                        className={`px-2 py-1 rounded-lg transition-all ${controlMode === "weather" ? "bg-white text-cyan-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        🌍 Live Weather
                      </button>
                      <button
                        onClick={() => setControlMode("manual")}
                        className={`px-2 py-1 rounded-lg transition-all ${controlMode === "manual" ? "bg-white text-slate-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        🎮 Manual Sim
                      </button>
                    </div>
                  </div>

                  {controlMode === "weather" ? (
                    <div className="space-y-4">
                      {weatherLoading ? (
                        <div className="py-8 flex flex-col items-center justify-center space-y-2">
                          <RefreshCw className="w-5 h-5 text-cyan-500 animate-spin" />
                          <span className="text-[10px] font-mono text-slate-500">Syncing live weather...</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Main Weather Info */}
                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-inner">
                            <div className="min-w-0">
                              <span className="text-[8px] font-bold font-mono text-cyan-600 uppercase tracking-widest block mb-0.5">CURRENT LOCATION</span>
                              <h4 className="text-sm font-black text-slate-950 leading-snug truncate flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                                {weatherLocationName}
                              </h4>
                              <div className="flex items-center gap-2.5 mt-1.5">
                                <span className="text-xl font-black font-mono text-slate-800">{weatherTemp.toFixed(1)}°C</span>
                                <span className="text-xs font-bold text-slate-500 font-mono bg-slate-200/60 px-2 py-0.5 rounded-lg">{weatherCondition}</span>
                              </div>
                            </div>
                            
                            <div className="bg-white p-2.5 rounded-2xl border border-slate-150 shadow-sm shrink-0">
                              {(() => {
                                const cond = weatherCondition.toLowerCase();
                                if (cond.includes("rain") || cond.includes("shower")) {
                                  return <CloudRain className="w-8 h-8 text-cyan-500 animate-bounce" />;
                                } else if (cond.includes("lightning") || cond.includes("thunder")) {
                                  return <CloudLightning className="w-8 h-8 text-indigo-500 animate-pulse" />;
                                } else if (cond.includes("cloud") || cond.includes("partly") || cond.includes("fog")) {
                                  return <Cloud className="w-8 h-8 text-slate-400" />;
                                } else {
                                  return <Sun className="w-8 h-8 text-amber-500 animate-spin" style={{ animationDuration: '8s' }} />;
                                }
                              })()}
                            </div>
                          </div>

                          {/* Quick Metrics */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-slate-50/50 border border-slate-100 p-2 rounded-xl text-center shadow-sm">
                              <div className="flex items-center gap-1 justify-center text-slate-700">
                                <Thermometer className="w-3 h-3 text-orange-500" />
                                <span className="text-[11px] font-bold font-mono">{weatherTemp.toFixed(1)}°C</span>
                              </div>
                              <span className="text-[7.5px] text-slate-400 uppercase font-mono block mt-0.5">Temp</span>
                            </div>

                            <div className="bg-slate-50/50 border border-slate-100 p-2 rounded-xl text-center shadow-sm">
                              <div className="flex items-center gap-1 justify-center text-slate-700">
                                <Droplets className="w-3 h-3 text-blue-500" />
                                <span className="text-[11px] font-bold font-mono">{weatherHumidity}%</span>
                              </div>
                              <span className="text-[7.5px] text-slate-400 uppercase font-mono block mt-0.5">Humidity</span>
                            </div>

                            <div className="bg-slate-50/50 border border-slate-100 p-2 rounded-xl text-center shadow-sm">
                              <div className="flex items-center gap-1 justify-center text-slate-700">
                                <Wind className="w-3 h-3 text-cyan-500" />
                                <span className="text-[11px] font-bold font-mono">{windSpeed.toFixed(1)} m/s</span>
                              </div>
                              <span className="text-[7.5px] text-slate-400 uppercase font-mono block mt-0.5">Wind</span>
                            </div>
                          </div>

                          {/* Wind Alignment Assistant */}
                          <div className="bg-cyan-50/40 border border-cyan-100 rounded-2xl p-3 space-y-2">
                            <div className="flex justify-between items-center text-[9px] font-mono">
                              <span className="text-cyan-800 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Navigation className="w-3 h-3 text-cyan-600 transition-transform duration-500" style={{ transform: `rotate(${weatherWindDirection}deg)` }} />
                                Wind Angle Vector: {weatherWindDirection}°
                              </span>
                              <span className="text-cyan-600 font-semibold">Active Heading</span>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-[8px] font-mono text-slate-500">
                                <span>Rotor yaw vector: <strong className="text-slate-700">{yawAngle}°</strong></span>
                                {Math.abs(yawAngle - weatherWindDirection) <= 15 ? (
                                  <span className="text-emerald-600 font-black flex items-center gap-0.5">● PERFECT ALIGNMENT</span>
                                ) : (
                                  <span className="text-amber-600 font-bold">⚠️ ALIGN SLIDER ({Math.abs(yawAngle - weatherWindDirection)}° error)</span>
                                )}
                              </div>
                              
                              <input
                                type="range"
                                min="0"
                                max="360"
                                step="5"
                                value={yawAngle}
                                onChange={(e) => setYawAngle(parseInt(e.target.value))}
                                className="w-full accent-cyan-600 h-1 bg-slate-200 rounded-lg cursor-pointer appearance-none"
                              />
                              <div className="flex justify-between text-[7px] text-slate-400 font-mono">
                                <span>0° (N)</span>
                                <span>90° (E)</span>
                                <span>180° (S)</span>
                                <span>270° (W)</span>
                                <span>360° (N)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* City Search and Geolocation re-trigger */}
                      <div className="space-y-2">
                        <form onSubmit={handleSearchWeather} className="flex gap-1.5">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              placeholder="Simulate any city (e.g. Chicago, Tokyo)..."
                              value={weatherSearchQuery}
                              onChange={(e) => setWeatherSearchQuery(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-7 pr-3 text-[9.5px] font-mono outline-none focus:bg-white focus:border-cyan-500 transition-all text-slate-800"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
                          </div>
                          <button
                            type="button"
                            onClick={handleFetchCurrentLocationWeather}
                            title="Fetch my current GPS weather"
                            className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all text-slate-600 shrink-0"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                        </form>
                        
                        {weatherError && (
                          <p className="text-[8.5px] font-semibold text-amber-600 font-mono text-center bg-amber-50/50 p-1.5 rounded-lg border border-amber-100">
                            {weatherError}
                          </p>
                        )}
                      </div>

                      <p className="text-[8.5px] text-slate-500 font-mono leading-normal bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                        ⚡ <strong>Grid Optimization Guide:</strong> The Springfield microgrid is directly driven by your real-world local weather metrics! Adjust the nacelle slider to face the exact wind direction vector to unlock full power generation.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-fade-in">
                      {/* Option 1: Wind Speed slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-500 font-bold uppercase tracking-wider">Simulated Wind Velocity</span>
                          <span className="text-cyan-600 font-black">{windSpeed.toFixed(1)} m/s</span>
                        </div>
                        <input
                          type="range"
                          min="3"
                          max="30"
                          step="0.5"
                          value={windSpeed}
                          onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
                          className="w-full accent-cyan-600 h-1 bg-slate-100 rounded-lg cursor-pointer appearance-none"
                        />
                        <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                          <span>3.0 m/s (Cut-In)</span>
                          <span>15.0 m/s (Rated)</span>
                          <span>30.0 m/s (Cut-Out)</span>
                        </div>
                      </div>

                      {/* Option 2: Blade pitch slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-500 font-bold uppercase tracking-wider">Blade Attack Pitch</span>
                          <span className="text-indigo-600 font-black">{bladePitch}°</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="45"
                          step="1"
                          value={bladePitch}
                          onChange={(e) => setBladePitch(parseInt(e.target.value))}
                          className="w-full accent-indigo-600 h-1 bg-slate-100 rounded-lg cursor-pointer appearance-none"
                        />
                        <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                          <span>0° (Max Torque)</span>
                          <span>22° (Stabilized)</span>
                          <span>45° (Feathered)</span>
                        </div>
                      </div>

                      {/* Option 3: Yaw orientation slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-500 font-bold uppercase tracking-wider">Nacelle Yaw Vector</span>
                          <span className="text-emerald-600 font-black">{yawAngle}° Heading</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="5"
                          value={yawAngle}
                          onChange={(e) => setYawAngle(parseInt(e.target.value))}
                          className="w-full accent-emerald-600 h-1 bg-slate-100 rounded-lg cursor-pointer appearance-none"
                        />
                        <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                          <span>0° (North)</span>
                          <span className="text-emerald-600 font-bold">{idealHeading}° (Ideal Heading)</span>
                          <span>360° (North)</span>
                        </div>
                      </div>

                      {/* Option 4: Grid coupling mode */}
                      <div className="space-y-2 pt-1">
                        <span className="block text-[9px] uppercase font-mono text-slate-400 font-bold tracking-wider">Grid Synchronization Profile</span>
                        <div className="grid grid-cols-3 gap-2">
                          {(["OPTIMAL", "PEAK", "ISOLATION"] as const).map((mode) => (
                            <button
                              key={mode}
                              onClick={() => setGridMode(mode)}
                              className={`py-2 rounded-xl text-[9px] font-mono font-bold transition-all border ${
                                gridMode === mode
                                  ? "bg-cyan-50 text-cyan-700 border-cyan-200 shadow-sm"
                                  : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Safety Brake Switch footer */}
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Rotor Safety Brake</span>
                    <button
                      onClick={() => setBrakeEngaged(!brakeEngaged)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-[9px] font-black transition-all border ${
                        brakeEngaged 
                          ? "bg-red-50 text-red-600 border-red-200 animate-pulse" 
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {brakeEngaged ? "⚠️ ROTOR LOCKED" : "⚙️ ENGAGE BRAKE"}
                    </button>
                  </div>
                </div>

                {/* Live Output scrolling graph card using SVG */}
                <div className="bg-white border border-slate-200 p-4 rounded-3xl space-y-3 shadow-sm">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-600" />
                      Dynamic Coupling Trend
                    </span>
                    <span className="text-slate-400">10s Buffer</span>
                  </div>

                  <div className="relative h-[90px] bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden flex items-end">
                    <svg className="absolute inset-0 w-full h-full" style={{ minWidth: '280px' }}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Grid background reference line */}
                      <line x1="0" y1="38" x2="280" y2="38" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                      <polygon points={fillPoints} fill="url(#chartGrad)" />
                      <polyline points={chartPoints} fill="none" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    
                    {/* Legend text inside chart */}
                    <span className="absolute bottom-1.5 left-2.5 text-[8px] font-mono text-slate-400">0 MW</span>
                    <span className="absolute top-1.5 left-2.5 text-[8px] font-mono text-cyan-600/80 font-bold">30 MW MAX CAP</span>
                  </div>
                </div>

                {/* Live Diagnostic Logs Terminal */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-3xl space-y-2">
                  <span className="block text-[9px] uppercase font-mono text-slate-400 font-bold tracking-wider">
                    Grid-Control Diagnostic Feed
                  </span>
                  <div className="font-mono text-[9.5px] space-y-1 text-slate-600 overflow-y-auto max-h-[105px] leading-relaxed text-left">
                    {telemetryLogs.map((log, idx) => (
                      <div key={idx} className={`${idx === 0 ? "text-cyan-600 font-bold" : "text-slate-500 opacity-80"}`}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          );
        })()}

      </div>
    );
  }

  // Handle custom profile picture file upload via base64
  const handleAvatarFileUpload = async (file: File) => {
    if (!currentUser) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }
    
    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 5MB.");
      return;
    }

    try {
      setAvatarUploadStatus("uploading");
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const res = await fetch(`/api/users/${currentUser.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatar: base64String })
          });
          
          if (res.ok) {
            const updatedUser = await res.json();
            setCurrentUser(updatedUser);
            setUsersList(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
            setAvatarUploadStatus("success");
            setTimeout(() => setAvatarUploadStatus("idle"), 3000);
          } else {
            setAvatarUploadStatus("error");
          }
        } catch (e) {
          console.error(e);
          setAvatarUploadStatus("error");
        }
      };
      
      reader.onerror = () => {
        setAvatarUploadStatus("error");
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setAvatarUploadStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans select-none text-slate-200">
      
      {/* Main Top Header Navigation */}
      <header className="bg-slate-900/60 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-xl text-slate-300 hover:text-white cursor-pointer transition-colors flex items-center justify-center sm:mr-1"
            title={isSidebarOpen ? "Hide Navigation Sidebar" : "Show Navigation Sidebar"}
          >
            <Menu className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
          <div className="p-1.5 sm:p-2 bg-indigo-600 rounded-xl">
            <Layers className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-white tracking-wide uppercase font-mono">CIVICLife</span>
              <span className="bg-slate-800 text-slate-400 text-[8px] sm:text-[9px] font-mono px-1 sm:px-1.5 py-0.5 rounded border border-slate-700">v1.0.0</span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-400 block font-mono">Way Of Smart City</span>
          </div>
        </div>

        {/* Action Controls & Notifications */}
        <div className="flex items-center gap-4">
          
          {/* Notifications Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotificationsDropdown(!showNotificationsDropdown);
                if (!showNotificationsDropdown) {
                  handleMarkNotificationsRead();
                }
              }}
              className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 hover:text-white relative cursor-pointer hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Dropdown Container */}
            {showNotificationsDropdown && (
              <div className="absolute right-0 mt-2.5 bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-80 py-2.5 z-50">
                <div className="px-4 py-1.5 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">Updates Notification Center</span>
                  <span className="text-[9px] text-indigo-400 font-mono font-medium">{unreadNotifsCount} new</span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/50 scrollbar-none">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-[11px] text-slate-500 font-mono">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3.5 hover:bg-slate-950 transition-colors">
                        <span className="text-xs font-semibold text-slate-200 block mb-0.5">{n.title}</span>
                        <p className="text-[11px] text-slate-400 leading-normal">{n.message}</p>
                        <span className="text-[8px] font-mono text-slate-600 mt-1 block">
                          {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Account Quick Stats */}
          <div 
            onClick={() => {
              if (currentUser.role === "CITIZEN" || currentUser.role === "SOCIAL_WORKER") {
                setActiveTab("profile");
                setSelectedReport(null);
              }
            }}
            className={`bg-slate-950 p-1.5 sm:px-4 sm:py-2 border border-slate-800 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 ${
              (currentUser.role === "CITIZEN" || currentUser.role === "SOCIAL_WORKER") ? "cursor-pointer hover:border-slate-700 transition-all" : ""
            }`}
            title={(currentUser.role === "CITIZEN" || currentUser.role === "SOCIAL_WORKER") ? "View or Edit Profile" : ""}
          >
            <img src={currentUser.avatar} alt="Profile" className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full object-cover border border-slate-700" />
            <div className="text-left leading-tight hidden md:block">
              <span className="text-xs font-bold text-slate-200 block">{currentUser.fullName}</span>
              <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">
                {currentUser.role.replace("_", " ")}
              </span>
            </div>
            {currentUser.role === "CITIZEN" && (
              <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-800 font-mono text-amber-400 font-bold text-xs" title="Loyalty Points Gained for Civic Activity">
                <Award className="w-3.5 h-3.5" />
                <span>{currentUser.points} Pts</span>
              </div>
            )}
          </div>

          {/* Log Out */}
          <button
            onClick={() => setCurrentUser(null)}
            className="p-2.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-950/50 rounded-xl cursor-pointer transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body Layout with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side Sidebar Navigation */}
        <nav className={`${
          isSidebarOpen 
            ? "w-64 p-5 border-r border-slate-800 translate-x-0" 
            : "w-0 p-0 border-r-0 overflow-hidden -translate-x-full lg:translate-x-0"
        } bg-slate-900 flex flex-col justify-between shrink-0 transition-all duration-300 lg:relative absolute lg:z-0 z-50 h-[calc(100vh-73px)] lg:h-auto`}>
          <div className="space-y-6">
            
            {/* Nav Group: Actions */}
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase tracking-widest font-mono text-slate-500 font-semibold block px-3 mb-2">Municipal Workspace</span>
              
              {currentUser.role === "SOCIAL_WORKER" ? (
                <>
                  <button
                    onClick={() => { setActiveTab("dashboard"); setSelectedReport(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      activeTab === "dashboard" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Overview</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("worker_select"); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      activeTab === "worker_select" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Search className="w-4 h-4" />
                    <span>Select Posted</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("worker_solve"); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      activeTab === "worker_solve" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Solve Case</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("worker_history"); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      activeTab === "worker_history" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Resolved History Log</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("profile"); setSelectedReport(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      activeTab === "profile" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("complaint_box"); setSelectedReport(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      activeTab === "complaint_box" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>AI Complaint Box</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setActiveTab("dashboard"); setSelectedReport(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      activeTab === "dashboard" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Issue Dashboard</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("map"); setSelectedReport(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      activeTab === "map" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Springfield Interactive Map</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("complaint_box"); setSelectedReport(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      activeTab === "complaint_box" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>AI Complaint Box</span>
                  </button>

                  {currentUser.role === "CITIZEN" && (
                    <button
                      onClick={() => { setActiveTab("report"); setSelectedReport(null); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        activeTab === "report" 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <PlusCircle className="w-4 h-4 animate-pulse" />
                      <span>Report New Complaint</span>
                    </button>
                  )}

                  {(currentUser.role === "SUPER_ADMIN" || currentUser.role === "MANAGER") && (
                    <button
                      onClick={() => { setActiveTab("users"); setSelectedReport(null); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        activeTab === "users" 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Users Directory</span>
                    </button>
                  )}

                  {currentUser.role === "SUPER_ADMIN" && (
                    <button
                      onClick={() => { setActiveTab("settings"); setSelectedReport(null); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        activeTab === "settings" 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <Sliders className="w-4 h-4" />
                      <span>System Settings</span>
                    </button>
                  )}

                  {currentUser.role === "CITIZEN" && (
                    <button
                      onClick={() => { setActiveTab("citizen_history"); setSelectedReport(null); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        activeTab === "citizen_history" 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>Resolved History Log</span>
                    </button>
                  )}

                  {currentUser.role === "CITIZEN" && (
                    <button
                      onClick={() => { setActiveTab("profile"); setSelectedReport(null); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        activeTab === "profile" 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>My Profile</span>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Quick Informational Box depending on selected persona */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-[11px] leading-relaxed text-slate-400 leading-normal">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1 font-mono uppercase tracking-wider text-[10px]">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Role Quick Tip</span>
              </div>
              {currentUser.role === "CITIZEN" && "Report a complaint and choose a preset image! The server-side Gemini AI model will automatically analyze it and assign severity + solution steps."}
              {currentUser.role === "SOCIAL_WORKER" && "Browse your assigned field tasks, mark progress, upload resolved after photos, and track your daily performance stats."}
              {currentUser.role === "MANAGER" && "Analyze all reports, dispatch available social workers, review and approve completed field work, and export reports directly as CSV files."}
              {currentUser.role === "SUPER_ADMIN" && "You hold system-wide master authority. Suspend users, modify core configurations, and track global analytics metrics."}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono tracking-tight text-center border-t border-slate-800 pt-4">
            Authorized Springfield System
          </div>
        </nav>

        {/* Core Right Main Content Panel */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950">
          
          {/* Active Banner for AI analyses */}
          {aiAnalyzingBanner && (
            <div className="mb-6 p-4 bg-indigo-950/70 border border-indigo-800 text-indigo-200 text-xs rounded-2xl flex items-center gap-3 shadow-lg animate-pulse">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" />
              <div>
                <span className="font-bold block text-indigo-300">Google Gemini AI Analysis Running...</span>
                <span>Reading uploaded images, categorizing, estimating severity, and generating solution procedures.</span>
              </div>
            </div>
          )}

          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === "dashboard" && currentUser && (
            <div className="space-y-8 animate-fade-in text-left">
              {/* Unified Post-Login Landing Banner with Immersive Full-Background Spline 3D Scene */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl relative overflow-hidden shadow-2xl min-h-[420px] sm:min-h-[460px] lg:min-h-[480px] flex items-center p-6 sm:p-10 lg:p-12 text-left">
                {/* Spline 3D Scene as Full-Scale Absolute Background */}
                <div className="absolute inset-0 z-0 pointer-events-auto">
                  <iframe 
                    src="https://my.spline.design/crystalball-bA4PkECVXImDjDPU6FAjIJTo/" 
                    frameBorder="0" 
                    width="100%" 
                    height="100%" 
                    className="w-full h-full scale-105 sm:scale-110 lg:scale-115 object-cover opacity-85"
                    style={{ border: 'none' }}
                    title="Spline 3D Post-Login Scene Background"
                  />
                </div>

                {/* Gradient overlay to make text highly readable on the left side while showing the 3D art on the right */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/20 md:via-slate-950/60 md:to-transparent z-10 pointer-events-none" />
                
                {/* Floating HUD Status Indicator */}
                <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-[9px] font-mono font-bold text-indigo-400 tracking-wider flex items-center gap-1.5 z-20">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span>3D CITY TELEMETRY: ONLINE</span>
                </div>

                {/* Content Overlay Panel (Interactive and layered above the gradient overlay) */}
                <div className="relative z-20 max-w-xl sm:max-w-2xl lg:max-w-3xl space-y-5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-mono font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Springfield Smart-City Operations Globe</span>
                  </div>
                  
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                      Welcome back, <span className="bg-gradient-to-r from-white via-indigo-200 to-indigo-300 bg-clip-text text-transparent">{currentUser.fullName}</span>!
                    </h1>
                    <p className="text-xs text-slate-400 font-mono mt-1.5">
                      {currentUser.role === "SOCIAL_WORKER" 
                        ? `Field Unit: ${currentUser.department || "Municipal Field Unit"} • Operator Duty Status: ACTIVE`
                        : `Civic Contributor • Current Balance: ${currentUser.points} Civic Loyalty Points`
                      }
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed max-w-lg">
                    Envisioning smart municipal operations with real-time 3D telemetry, automated AI-driven issue detection, and streamlined citizen-to-agency collaboration.
                  </p>

                  {/* Micro KPIs within Landing Banner */}
                  <div className="grid grid-cols-3 gap-3 pt-2 max-w-md">
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-3 rounded-2xl shadow-lg">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Active Issues</span>
                      <span className="text-sm sm:text-base font-black text-amber-400 font-mono mt-0.5 block">
                        {reports.filter(r => r.status !== "RESOLVED").length}
                      </span>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-3 rounded-2xl shadow-lg">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Solved Rate</span>
                      <span className="text-sm sm:text-base font-black text-emerald-400 font-mono mt-0.5 block">
                        94.2%
                      </span>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-3 rounded-2xl shadow-lg">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">System State</span>
                      <span className="text-sm sm:text-base font-black text-indigo-400 font-mono mt-0.5 block">
                        OPTIMAL
                      </span>
                    </div>
                  </div>

                  {/* Call To Actions */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    {currentUser.role === "CITIZEN" ? (
                      <button
                        onClick={() => setActiveTab("report")}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5"
                      >
                        Report New Issue +
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveTab("worker_select")}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5"
                      >
                        Explore Live Queue
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const notificationBtn = document.querySelector('[title="Updates Notification Center"]');
                        if (notificationBtn) (notificationBtn as HTMLButtonElement).click();
                      }}
                      className="bg-slate-900/90 hover:bg-slate-800/90 text-slate-300 border border-slate-800 px-5 py-3 rounded-xl text-xs transition-all cursor-pointer font-mono hover:-translate-y-0.5 shadow-md"
                    >
                      View Active Broadcasts
                    </button>
                  </div>
                </div>
              </div>

              {currentUser.role === "SOCIAL_WORKER" ? (
                <div className="space-y-8 text-left">

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">My Assigned Tasks</span>
                    <span className="text-2xl font-black text-indigo-400 block font-mono">
                      {reports.filter(r => r.assignedWorkerId === currentUser.id && r.status !== "RESOLVED").length}
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono">Unresolved tasks assigned to you</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">My Solved Complaints</span>
                    <span className="text-2xl font-black text-emerald-400 block font-mono">
                      {reports.filter(r => r.assignedWorkerId === currentUser.id && r.status === "RESOLVED").length}
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono">Total cases closed by you</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">Springfield Active Pool</span>
                    <span className="text-2xl font-black text-amber-400 block font-mono">
                      {reports.filter(r => r.status !== "RESOLVED").length}
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono font-sans">Total unresolved complaints city-wide</p>
                  </div>
                </div>

                {/* Main Queue and Instructions */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Active Assigned Tasks */}
                  <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        <span>Your Active Job Queue</span>
                      </h2>
                      <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                        In Progress / Assigned
                      </span>
                    </div>

                    {reports.filter(r => r.assignedWorkerId === currentUser.id && r.status !== "RESOLVED").length === 0 ? (
                      <div className="py-12 text-center text-xs space-y-3">
                        <CheckCircle className="w-8 h-8 text-slate-700 mx-auto" />
                        <p className="text-slate-400 font-medium">You have no active pending assignments!</p>
                        <p className="text-slate-600">Head over to the **2nd tab** to select a posted complaint to solve.</p>
                        <button
                          onClick={() => setActiveTab("worker_select")}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-[11px] mt-2 transition-all cursor-pointer"
                        >
                          Select Posted Complaint to Solve
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800">
                        {reports
                          .filter(r => r.assignedWorkerId === currentUser.id && r.status !== "RESOLVED")
                          .map((report) => (
                            <div key={report.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="bg-slate-950 text-indigo-400 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800">
                                    {report.category}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">#{report.id}</span>
                                </div>
                                <h3 className="font-bold text-slate-200">{report.title}</h3>
                                <p className="text-[11px] text-slate-500 font-mono">{report.address}</p>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedReport(report);
                                  setActiveTab("worker_solve");
                                }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-[11px] cursor-pointer transition-all self-start sm:self-auto shadow-md"
                              >
                                Solve Selected Complaint →
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Work Guidelines */}
                  <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
                    <h2 className="text-sm font-bold text-white">Daily Field Instructions</h2>
                    
                    <div className="space-y-4 text-xs text-slate-400 leading-relaxed">
                      <div className="flex gap-3">
                        <span className="font-bold text-indigo-400 font-mono text-sm leading-none">01</span>
                        <div>
                          <p className="font-semibold text-slate-300">Select posted complaints</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Go to the **2nd Tab** to review posted complaints. Click to assign it to your personnel queue.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <span className="font-bold text-indigo-400 font-mono text-sm leading-none">02</span>
                        <div>
                          <p className="font-semibold text-slate-300">Submit completed work</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Use the **3rd Tab** to submit proof of solution, upload matching resolved photos, and add engineering statements.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <span className="font-bold text-indigo-400 font-mono text-sm leading-none">03</span>
                        <div>
                          <p className="font-semibold text-slate-300">Track solved history</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">The **4th Tab** maintains a detailed ledger showing who solved the complaint and which citizen reported it.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/60 text-[11px] text-slate-500 italic">
                      "Clean water, smooth roads, and bright streets form the bedrock of a thriving Springfield. Your dedication is appreciated!"
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
              
              {/* Top Filters & Controls Bar */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl">
                <div className="flex flex-wrap items-center gap-3">
                  
                  {/* Category Filter dropdown */}
                  <div>
                    <span className="text-[9px] uppercase font-mono text-slate-400 font-semibold block mb-1">Filter Category</span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                    >
                      <option value="All">All Categories</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter dropdown */}
                  <div>
                    <span className="text-[9px] uppercase font-mono text-slate-400 font-semibold block mb-1">Filter Status</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                    >
                      <option value="All">All Statuses</option>
                      <option value="SUBMITTED">Submitted</option>
                      <option value="REVIEWED">Reviewed</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <span className="text-[9px] uppercase font-mono text-slate-400 font-semibold block mb-1">Keywords</span>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search complaints..."
                        className="bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-indigo-500/50 w-48 font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* Admin Selective CSV Export Option */}
                {currentUser.role === "SUPER_ADMIN" && (
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer self-end md:self-auto transition-all shadow"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Selective CSV (Filtered)</span>
                  </button>
                )}
              </div>

              {/* Bento Layout: Main complaint List and Details */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left side: Complaints Grid/List */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>Reported Complaint Logs ({filteredReports.length})</span>
                    </h2>
                    
                    {/* Activity Filter Mode Switcher */}
                    {(currentUser.role === "CITIZEN" || currentUser.role === "SOCIAL_WORKER") && (
                      <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
                        <button
                          onClick={() => setActivityFilterMode("all")}
                          className={`px-3 py-1 text-[10px] font-bold font-mono rounded-lg transition-all cursor-pointer ${
                            activityFilterMode === "all"
                              ? "bg-indigo-600 text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          All Springfield Feed
                        </button>
                        <button
                          onClick={() => setActivityFilterMode("mine")}
                          className={`px-3 py-1 text-[10px] font-bold font-mono rounded-lg transition-all cursor-pointer ${
                            activityFilterMode === "mine"
                              ? "bg-indigo-600 text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {currentUser.role === "CITIZEN" ? "My Activity Logs" : "My Assigned/Solved Tasks"}
                        </button>
                      </div>
                    )}
                  </div>

                  {filteredReports.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
                      <AlertTriangle className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-400">No reported complaints match current filters.</p>
                      <p className="text-xs text-slate-600 mt-1">Try resetting the dropdown filters or keywords.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredReports.map((report) => {
                        const isSelected = selectedReport?.id === report.id;
                        return (
                          <div
                            key={report.id}
                            onClick={() => setSelectedReport(report)}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                              isSelected 
                                ? "bg-indigo-950/20 border-indigo-500/80 shadow-lg" 
                                : "bg-slate-900/50 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700/80"
                            }`}
                          >
                            {/* Urgent priority dot indicator */}
                            {report.priority === "CRITICAL" && (
                              <span className="absolute top-4 right-4 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                            )}

                            <span className="text-[10px] text-slate-400 font-mono block mb-1">
                              ID: #{report.id} • {new Date(report.createdAt).toLocaleDateString()}
                            </span>
                            <h3 className="text-xs font-bold text-slate-100 mb-1.5 truncate pr-4">{report.title}</h3>
                            <p className="text-[11px] text-slate-400 line-clamp-2 mb-4 leading-normal">
                              {report.description}
                            </p>

                            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                              <span className="bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono px-2 py-0.5 rounded-lg">
                                {report.category}
                              </span>
                              <span className={`text-[10px] font-bold font-mono uppercase tracking-wide px-2 py-0.5 rounded border ${
                                report.status === "RESOLVED" ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" :
                                report.status === "ASSIGNED" ? "text-blue-400 border-blue-500/20 bg-blue-500/5" :
                                report.status === "IN_PROGRESS" ? "text-purple-400 border-purple-500/20 bg-purple-500/5" :
                                "text-yellow-400 border-yellow-500/20 bg-yellow-500/5"
                              }`}>
                                {report.status.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right side: Detailed Single Report Inspector */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 animate-fade-in">
                  <div className="px-1 flex justify-between items-center">
                    <div>
                      <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                        <FileText className="w-4.5 h-4.5 text-indigo-400" />
                        <span>Issue Inspector</span>
                      </h2>
                      <p className="text-[10px] text-slate-400 font-mono">Select a report card to evaluate parameters</p>
                    </div>
                    {selectedReport && (
                      <button
                        onClick={() => setSelectedReport(null)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-mono cursor-pointer transition-colors"
                        title="Deselect report"
                      >
                        ✕ Close
                      </button>
                    )}
                  </div>

                  {!selectedReport ? (
                    <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
                      <Info className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 leading-normal">Click on any card to view GPS locations, coordinate tasks, send messages, and evaluate Gemini AI insights.</p>
                    </div>
                  ) : (
                    <div className="bg-slate-900/95 border border-slate-700/60 rounded-2xl overflow-hidden p-6 space-y-6 shadow-2xl shadow-indigo-500/5 backdrop-blur-md">
                      
                      {/* Image comparison gallery */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-mono text-slate-300 font-semibold tracking-wider block">Case Photographic Evidence</span>
                          {selectedReport.status === "RESOLVED" && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                              Before & After
                            </span>
                          )}
                        </div>

                        {selectedReport.status === "RESOLVED" && selectedReport.afterImage ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                              <img src={selectedReport.beforeImage || selectedReport.images[0]} alt="Before" className="w-full h-28 object-cover rounded-lg" />
                              <span className="text-[9px] uppercase font-mono text-slate-500 text-center block mt-1.5 font-bold">Before Work</span>
                            </div>
                            <div className="bg-slate-950/80 p-2 rounded-xl border border-emerald-900/40">
                              <img src={selectedReport.afterImage} alt="After" className="w-full h-28 object-cover rounded-lg border border-emerald-900" />
                              <span className="text-[9px] uppercase font-mono text-emerald-400 text-center block mt-1.5 font-bold">After Resolved</span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                            <img src={selectedReport.beforeImage || selectedReport.images[0]} alt="Complaint" className="w-full h-44 object-cover rounded-lg" />
                          </div>
                        )}
                      </div>

                      {/* Header details */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="bg-indigo-600/20 text-indigo-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border border-indigo-500/30 uppercase tracking-wider">
                            {selectedReport.category}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">Case ID: <strong>#{selectedReport.id}</strong></span>
                            <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${
                              selectedReport.priority === "CRITICAL" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                              selectedReport.priority === "HIGH" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              "bg-slate-800/50 text-slate-400 border-slate-800/80"
                            }`}>
                              {selectedReport.priority} Priority
                            </span>
                          </div>
                        </div>
                        <h3 className="text-base font-bold text-slate-100 tracking-tight leading-snug">{selectedReport.title}</h3>
                        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 text-left">
                          <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block mb-1">Citizen Statement / Description</span>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                            {selectedReport.description}
                          </p>
                        </div>
                      </div>

                      {/* Case Ownership Metadata */}
                      <div className="grid grid-cols-2 gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 text-xs">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block tracking-wider">Reported By</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 bg-indigo-950 text-indigo-400 border border-indigo-900/50 rounded-full flex items-center justify-center font-bold text-[10px] font-mono shrink-0">
                              C
                            </div>
                            <span className="text-slate-200 font-bold text-xs truncate">
                              {usersList.find(u => u.id === selectedReport.citizenId)?.fullName || "Citizen User"}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1 border-l border-slate-800/80 pl-4">
                          <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block tracking-wider">Assigned / Solver</span>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] font-mono shrink-0 ${
                              selectedReport.assignedWorkerId ? "bg-emerald-950 text-emerald-400 border border-emerald-900/50" : "bg-slate-900 text-slate-400 border border-slate-800"
                            }`}>
                              W
                            </div>
                            <span className="text-slate-200 font-bold text-xs truncate">
                              {selectedReport.assignedWorkerId 
                                ? (usersList.find(u => u.id === selectedReport.assignedWorkerId)?.fullName || "Social Worker")
                                : "Unassigned"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Social Worker Solution Comments block if resolved */}
                      {selectedReport.status === "RESOLVED" && (
                        <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl space-y-2 text-xs">
                          <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block tracking-wider">Social Worker Resolution Statement</span>
                          <p className="text-slate-200 leading-relaxed font-sans italic font-medium">
                            "{selectedReport.workerStatement || "Resolved successfully by municipal field team."}"
                          </p>
                          <span className="text-[9px] text-slate-500 font-mono block mt-1">
                            Verified by field operator {usersList.find(u => u.id === selectedReport.assignedWorkerId)?.fullName || "Field Staff"}
                          </span>
                        </div>
                      )}

                      {/* Coordinates, Address, and Weather */}
                      <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
                          <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                          <span className="font-mono truncate">{selectedReport.address}</span>
                        </div>
                        <div className="border-t border-slate-900 pt-2">
                          <WeatherWidget latitude={selectedReport.latitude} longitude={selectedReport.longitude} />
                        </div>
                      </div>

                      {/* Interactive Field Actions for each specific user role */}

                      {/* CITIZEN FLOW: Can chat if assigned, see progress */}
                      {currentUser.role === "CITIZEN" && (
                        <div className="space-y-4">
                          <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">Citizen Operations</span>
                          {selectedReport.assignedWorkerId ? (
                            <ChatWidget
                              reportId={selectedReport.id}
                              currentUser={currentUser}
                              recipientUser={usersList.find(u => u.id === selectedReport.assignedWorkerId) || null}
                            />
                          ) : (
                            <div className="p-4 bg-slate-950 border border-slate-800/60 rounded-xl text-center text-xs text-slate-500 font-mono">
                              Waiting for district manager dispatch before direct worker communication.
                            </div>
                          )}
                        </div>
                      )}

                      {/* SOCIAL WORKER FLOW: Can accept, complete task */}
                      {currentUser.role === "SOCIAL_WORKER" && (
                        <div className="space-y-4 border-t border-slate-800 pt-4">
                          <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">Social Worker Action Deck</span>
                          
                          {selectedReport.assignedWorkerId !== currentUser.id ? (
                            <div className="p-3 bg-slate-950 text-center text-xs text-slate-500 font-mono border border-slate-800 rounded-xl">
                              This task is not assigned to you.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {selectedReport.status === "ASSIGNED" && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleWorkerAccept(selectedReport.id)}
                                    disabled={workerActionLoading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-xl cursor-pointer transition-colors"
                                  >
                                    Accept Assignment
                                  </button>
                                  <button
                                    onClick={() => handleWorkerComplete(selectedReport.id)} // or rejecting
                                    className="flex-1 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-950 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                                  >
                                    Decline Task
                                  </button>
                                </div>
                              )}

                              {selectedReport.status === "IN_PROGRESS" && (
                                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                                  <div>
                                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">
                                      Resolved Work Photo URL
                                    </label>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={workerAfterImage}
                                        onChange={(e) => setWorkerAfterImage(e.target.value)}
                                        placeholder="https://images.unsplash.com/... (After resolution photo)"
                                        className="flex-1 bg-slate-900 border border-slate-850 text-[11px] px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                                      />
                                      <button
                                        onClick={() => setWorkerAfterImage(PRESET_CIVIC_IMAGES[3].url)}
                                        className="bg-slate-800 p-2 rounded-xl text-xs font-semibold hover:bg-slate-700 text-slate-300 shrink-0"
                                        title="Load mock resolved photo"
                                      >
                                        <Camera className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">
                                      Resolution & Solution Statement
                                    </label>
                                    <textarea
                                      value={workerStatement}
                                      onChange={(e) => setWorkerStatement(e.target.value)}
                                      placeholder="Provide details about the engineering solution deployed (e.g., cleared debris, patched water main)..."
                                      rows={2}
                                      className="w-full bg-slate-900 border border-slate-850 text-[11px] p-3 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-sans resize-none"
                                    />
                                  </div>

                                  <button
                                    onClick={() => handleWorkerComplete(selectedReport.id)}
                                    disabled={!workerAfterImage.trim() || workerActionLoading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-xl cursor-pointer transition-colors"
                                  >
                                    Complete Assignment (Mark Solved)
                                  </button>
                                </div>
                              )}

                              {/* Chat with Citizen */}
                              <div className="space-y-2">
                                <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold block">Citizen Liaison</span>
                                <ChatWidget
                                  reportId={selectedReport.id}
                                  currentUser={currentUser}
                                  recipientUser={usersList.find(u => u.id === selectedReport.citizenId) || null}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* MANAGER FLOW: Assign field staff, dispatch */}
                      {currentUser.role === "MANAGER" && (
                        <div className="space-y-4 border-t border-slate-800/80 pt-4">
                          <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">Manager Dispatch Center</span>
                          
                          {selectedReport.status === "SUBMITTED" || selectedReport.status === "REVIEWED" ? (
                            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3">
                              <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold">
                                Dispatch Available Worker
                              </label>
                              <div className="flex gap-2">
                                <select
                                  value={selectedWorkerId}
                                  onChange={(e) => setSelectedWorkerId(parseInt(e.target.value))}
                                  className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-300 px-3 py-2.5 rounded-xl focus:outline-none cursor-pointer"
                                >
                                  <option value={0}>Select Worker...</option>
                                  {usersList.filter(u => u.role === "SOCIAL_WORKER").map(w => (
                                    <option key={w.id} value={w.id}>
                                      {w.fullName} ({w.department || "Field Staff"})
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleAssignWorker(selectedReport.id)}
                                  disabled={!selectedWorkerId}
                                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs px-4 rounded-xl cursor-pointer transition-colors"
                                >
                                  Assign
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-center text-xs text-slate-500 font-mono">
                              Assigned to: {usersList.find(u => u.id === selectedReport.assignedWorkerId)?.fullName || "Field Staff"} ({selectedReport.status})
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUPER ADMIN PRIVILEGES */}
                      {currentUser.role === "SUPER_ADMIN" && (
                        <div className="space-y-4 border-t border-slate-800 pt-4">
                          <span className="text-[10px] uppercase font-mono text-red-400 font-semibold block">Super Admin Overrides</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeleteReport(selectedReport.id)}
                              className="w-full flex items-center justify-center gap-2 bg-red-950/40 hover:bg-red-900/40 border border-red-900 text-red-400 font-semibold text-xs py-2.5 rounded-xl cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Permanently Purge Report</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Unified Gemini AI Panel */}
                      <AIPanel report={selectedReport} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

          {/* SOCIAL WORKER SPECIALIZED WORKFLOWS */}

          {/* TAB 2: SELECT POSTED COMPLAINT */}
          {activeTab === "worker_select" && currentUser && (
            <div className="space-y-6 animate-fade-in text-left">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-400" />
                  <span>Posted Complaints Board</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Browse active complaints reported by citizens of Springfield. Select any case to accept it and deploy a solution.
                </p>
              </div>

              {/* List of active complaints */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-4">
                  {/* Simple inline filter */}
                  <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
                      Available Issues ({reports.filter(r => r.status !== "RESOLVED").length})
                    </span>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-lg font-mono">
                      Unsolved Springfield Feed
                    </span>
                  </div>

                  {reports.filter(r => r.status !== "RESOLVED").length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-400">All Springfield complaints have been solved!</p>
                      <p className="text-xs text-slate-600 mt-1">Check back later for new citizen reports.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reports
                        .filter(r => r.status !== "RESOLVED")
                        .map((report) => {
                          const isSelected = selectedReport?.id === report.id;
                          const creator = usersList.find(u => u.id === report.citizenId);
                          return (
                            <div
                              key={report.id}
                              onClick={() => setSelectedReport(report)}
                              className={`p-5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                                isSelected 
                                  ? "bg-indigo-950/20 border-indigo-500/80 shadow-lg" 
                                  : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700/80"
                              }`}
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div>
                                  <span className="text-[10px] text-slate-500 font-mono block mb-1">
                                    ID: #{report.id} • Reported by {creator?.fullName || "Citizen"}
                                  </span>
                                  <h3 className="text-xs font-bold text-slate-100 mb-1">{report.title}</h3>
                                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                                    {report.description}
                                  </p>
                                </div>
                                <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                                  report.priority === "CRITICAL" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                  report.priority === "HIGH" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                  "bg-slate-800 text-slate-400"
                                }`}>
                                  {report.priority}
                                </span>
                              </div>

                              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-1">
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                  <span className="truncate max-w-xs">{report.address}</span>
                                </div>
                                <span className="text-[10px] font-mono text-indigo-400">
                                  {report.category}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Selector side panel */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                    <h2 className="text-sm font-bold text-white">Target Case Details</h2>
                    {!selectedReport ? (
                      <div className="text-center py-8 text-xs text-slate-500">
                        Select a complaint from the list to assign to yourself or solve.
                      </div>
                    ) : (
                      <div className="space-y-4 text-xs">
                        <div className="space-y-2">
                          <img 
                            src={selectedReport.beforeImage || selectedReport.images[0]} 
                            alt="Incident site" 
                            className="w-full h-40 object-cover rounded-xl border border-slate-800" 
                          />
                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                            <span>Category: {selectedReport.category}</span>
                            <span>Priority: {selectedReport.priority}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Title</span>
                          <span className="text-slate-200 font-bold text-xs">{selectedReport.title}</span>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Description</span>
                          <p className="text-slate-400 bg-slate-950/40 p-3 rounded-lg leading-relaxed">{selectedReport.description}</p>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Reporter Identity</span>
                          <div className="flex items-center gap-2 mt-1">
                            <img 
                              src={usersList.find(u => u.id === selectedReport.citizenId)?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                              alt="Citizen" 
                              className="w-6 h-6 rounded-full object-cover" 
                            />
                            <div>
                              <span className="text-slate-300 font-semibold block leading-tight">
                                {usersList.find(u => u.id === selectedReport.citizenId)?.fullName || "Citizen"}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono block">
                                {usersList.find(u => u.id === selectedReport.citizenId)?.email}
                              </span>
                            </div>
                          </div>
                        </div>

                        {selectedReport.assignedWorkerId === currentUser.id ? (
                          <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-xl text-center font-semibold">
                            ✓ This task is already assigned to you!
                            <button
                              onClick={() => setActiveTab("worker_solve")}
                              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg transition-colors cursor-pointer"
                            >
                              Go to Solve Tab
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={async () => {
                              // Accept and assign task
                              setWorkerActionLoading(true);
                              try {
                                const res = await fetch(`/api/reports/${selectedReport.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ 
                                    assignedWorkerId: currentUser.id,
                                    status: "IN_PROGRESS"
                                  })
                                });
                                if (res.ok) {
                                  const updated = await res.json();
                                  setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
                                  setSelectedReport(updated);
                                  // Redirect to solve tab
                                  setActiveTab("worker_solve");
                                }
                              } catch (e) {
                                console.error(e);
                              } finally {
                                setWorkerActionLoading(false);
                              }
                            }}
                            disabled={workerActionLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all cursor-pointer shadow-lg"
                          >
                            {workerActionLoading ? "Assigning..." : "Assign & Solve this Complaint"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SOLVE COMPLAINT PANEL */}
          {activeTab === "worker_solve" && currentUser && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-left">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-400" />
                  <span>Solve Selected Complaint</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Submit high-quality field verification evidence (resolved photo and completion statement) to mark cases as successfully RESOLVED.
                </p>
              </div>

              {!selectedReport ? (
                <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl space-y-4">
                  <AlertTriangle className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-slate-300 font-bold">No Active Case Selected</h3>
                  <p className="text-xs text-slate-500">
                    You must select a complaint from the list or assign one to yourself first.
                  </p>
                  <button
                    onClick={() => setActiveTab("worker_select")}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                  >
                    Browse Posted Complaints Board
                  </button>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl space-y-6">
                  {/* Selected Complaint Header Info */}
                  <div className="border-b border-slate-800 pb-5">
                    <span className="text-[10px] bg-slate-950 text-indigo-400 font-mono px-2.5 py-1 rounded-lg border border-slate-850">
                      {selectedReport.category} Case #{selectedReport.id}
                    </span>
                    <h2 className="text-base font-bold text-slate-100 mt-3">{selectedReport.title}</h2>
                    <p className="text-xs text-slate-400 leading-relaxed mt-2 bg-slate-950/30 p-4 rounded-xl border border-slate-850/50">
                      {selectedReport.description}
                    </p>
                  </div>

                  {/* Reporter info */}
                  <div className="flex items-center justify-between bg-slate-950/50 p-4 rounded-2xl border border-slate-850">
                    <div className="flex items-center gap-3">
                      <img 
                        src={usersList.find(u => u.id === selectedReport.citizenId)?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                        alt="Avatar" 
                        className="w-10 h-10 rounded-full object-cover border border-slate-800" 
                      />
                      <div>
                        <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Complaint Created By</span>
                        <span className="text-xs font-bold text-slate-300">
                          {usersList.find(u => u.id === selectedReport.citizenId)?.fullName || "Citizen"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Assigned Solver</span>
                      <span className="text-xs text-indigo-400 font-semibold font-mono">
                        {selectedReport.assignedWorkerId === currentUser.id ? "You (Field Agent)" : "Other Personnel"}
                      </span>
                    </div>
                  </div>

                  {/* If the complaint is already resolved, show details and don't allow re-submitting */}
                  {selectedReport.status === "RESOLVED" ? (
                    <div className="bg-emerald-950/20 border border-emerald-900 p-6 rounded-2xl space-y-4">
                      <div className="flex items-center gap-3 text-emerald-400">
                        <Check className="w-6 h-6 shrink-0" />
                        <div className="text-left">
                          <h4 className="font-bold text-sm">Complaint Solved Successfully!</h4>
                          <p className="text-xs text-slate-400">This case was closed on {new Date(selectedReport.resolvedAt || "").toLocaleDateString()}.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <span className="text-[9px] uppercase font-mono text-slate-500 block">Before Work</span>
                          <img src={selectedReport.beforeImage || selectedReport.images[0]} alt="Before" className="w-full h-32 object-cover rounded-xl mt-1" />
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-mono text-emerald-500 block">After Work Resolved</span>
                          <img src={selectedReport.afterImage || ""} alt="After" className="w-full h-32 object-cover rounded-xl mt-1 border border-emerald-800" />
                        </div>
                      </div>
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 text-xs">
                        <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Worker Statement</span>
                        <p className="text-slate-300 leading-relaxed italic">"{selectedReport.workerStatement || "No statement provided."}"</p>
                      </div>
                    </div>
                  ) : (
                    /* Submission Form for active/assigned complaints */
                    <div className="space-y-6">
                      {selectedReport.status !== "IN_PROGRESS" && (
                        <div className="p-4 bg-yellow-950/20 border border-yellow-900/40 text-yellow-300 text-xs rounded-xl flex items-center justify-between">
                          <span>Task status is currently <strong>{selectedReport.status}</strong>. Mark it "In Progress" to begin!</span>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/reports/${selectedReport.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "IN_PROGRESS" })
                                });
                                if (res.ok) {
                                  const updated = await res.json();
                                  setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
                                  setSelectedReport(updated);
                                }
                              } catch (e) { console.error(e); }
                            }}
                            className="bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-mono font-bold text-[10px] px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            Set In Progress
                          </button>
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* Photo Upload Section */}
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-2">
                            1. Resolved Work Photo (After Resolution Image URL)
                          </label>
                          <div className="flex gap-3">
                            <input
                              type="text"
                              required
                              value={workerAfterImage}
                              onChange={(e) => setWorkerAfterImage(e.target.value)}
                              placeholder="https://images.unsplash.com/... (After resolution photo)"
                              className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                // Find matching resolved preset image, or fallback to index 3
                                const match = PRESET_RESOLVED_IMAGES.find(img => img.category.toLowerCase() === selectedReport.category.toLowerCase()) || PRESET_RESOLVED_IMAGES[1];
                                setWorkerAfterImage(match.url);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-3 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
                              title="Load mock resolved photo"
                            >
                              <Camera className="w-4 h-4" />
                              <span>Preset Fixed Photo</span>
                            </button>
                          </div>
                          {workerAfterImage && (
                            <div className="mt-3 bg-slate-950/40 p-2 rounded-xl border border-slate-850 inline-block">
                              <img src={workerAfterImage} alt="Preview of solved work" className="h-24 w-40 object-cover rounded-lg border border-slate-800" />
                            </div>
                          )}
                        </div>

                        {/* Statement Area */}
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-2">
                            2. Resolution & Solution Statement
                          </label>
                          <textarea
                            required
                            rows={4}
                            value={workerStatement}
                            onChange={(e) => setWorkerStatement(e.target.value)}
                            placeholder="Provide precise details about the solution deployed (e.g., patched water pipe and closed leakage, cleared debris and garbage)..."
                            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 leading-relaxed font-sans resize-none"
                          />
                        </div>

                        <button
                          onClick={async () => {
                            if (!workerAfterImage.trim()) {
                              alert("Please provide an after-resolution photo URL!");
                              return;
                            }
                            if (!workerStatement.trim()) {
                              alert("Please write a resolution statement describing your solution!");
                              return;
                            }

                            setWorkerActionLoading(true);
                            try {
                              const res = await fetch(`/api/reports/${selectedReport.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ 
                                  status: "RESOLVED",
                                  afterImage: workerAfterImage,
                                  workerStatement: workerStatement.trim()
                                })
                              });
                              if (res.ok) {
                                const updated = await res.json();
                                setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
                                setSelectedReport(updated);
                                setWorkerAfterImage("");
                                setWorkerStatement("");
                                setActiveTab("worker_history");
                              }
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setWorkerActionLoading(false);
                            }
                          }}
                          disabled={workerActionLoading || !workerAfterImage.trim() || !workerStatement.trim()}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl cursor-pointer transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          {workerActionLoading ? "Submitting Solution..." : "✓ Submit Solved Complaint (Mark Resolved)"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HISTORY OF RESOLVED COMPLAINTS */}
          {activeTab === "worker_history" && currentUser && (
            <div className="space-y-6 animate-fade-in text-left">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <span>My Selected Cases & Solution History</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Review your assigned municipal complaints, active field operations status, and completed resolution statements.
                </p>
              </div>

              {reports.filter(r => r.assignedWorkerId === currentUser.id).length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
                  <Clock className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-400">You have no selected cases or solution history yet.</p>
                  <p className="text-xs text-slate-600 mt-1">Go to the **2nd Tab: Select Posted** to assign complaints to your duty queue!</p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase tracking-wider font-mono text-slate-400">
                          <th className="p-4 pl-6">Case Summary</th>
                          <th className="p-4">Visual Comparison</th>
                          <th className="p-4">Who Compliant Created</th>
                          <th className="p-4">Resolution Status</th>
                          <th className="p-4">Solution / Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {reports
                          .filter(r => r.assignedWorkerId === currentUser.id)
                          .map((report) => {
                            const citizen = usersList.find(u => u.id === report.citizenId);
                            return (
                              <tr key={report.id} className="hover:bg-slate-900/35 transition-colors">
                                {/* Case summary */}
                                <td className="p-4 pl-6 align-top max-w-xs">
                                  <span className="text-[10px] text-slate-500 font-mono block">
                                    #{report.id} • {report.category}
                                  </span>
                                  <span className="font-bold text-slate-200 block mt-0.5">{report.title}</span>
                                  <span className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-normal">
                                    {report.description}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-mono block mt-1">
                                    📍 {report.address}
                                  </span>
                                </td>

                                {/* Visual Comparison */}
                                <td className="p-4 align-top">
                                  <div className="flex gap-2">
                                    <div className="text-center shrink-0">
                                      <img src={report.beforeImage || report.images[0]} alt="Before" className="w-14 h-10 object-cover rounded border border-slate-800" />
                                      <span className="text-[8px] font-mono text-slate-500 block mt-0.5">Before</span>
                                    </div>
                                    {report.status === "RESOLVED" && report.afterImage && (
                                      <div className="text-center shrink-0">
                                        <img src={report.afterImage} alt="After" className="w-14 h-10 object-cover rounded border border-emerald-900" />
                                        <span className="text-[8px] font-mono text-emerald-500 block mt-0.5">After</span>
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Who Compliant Created (Citizen) */}
                                <td className="p-4 align-top">
                                  <div className="flex items-center gap-2">
                                    <img src={citizen?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} alt="Citizen" className="w-7 h-7 rounded-full object-cover border border-slate-800" />
                                    <div className="leading-tight">
                                      <span className="font-bold text-slate-200 block text-[11px]">{citizen?.fullName || "Springfield Citizen"}</span>
                                      <span className="text-[9px] text-slate-500 font-mono block">{citizen?.email || "citizen@springfield.org"}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* Resolution Status */}
                                <td className="p-4 align-top">
                                  <span className={`text-[10px] font-bold font-mono uppercase tracking-wide px-2 py-0.5 rounded border block w-max ${
                                    report.status === "RESOLVED" ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" :
                                    report.status === "ASSIGNED" ? "text-blue-400 border-blue-500/20 bg-blue-500/5" :
                                    report.status === "IN_PROGRESS" ? "text-purple-400 border-purple-500/20 bg-purple-500/5" :
                                    "text-yellow-400 border-yellow-500/20 bg-yellow-500/5"
                                  }`}>
                                    {report.status.replace("_", " ")}
                                  </span>
                                </td>

                                {/* Solution / Details */}
                                <td className="p-4 align-top max-w-xs">
                                  {report.status === "RESOLVED" ? (
                                    <>
                                      <p className="text-slate-300 font-sans italic text-[11px] leading-relaxed">
                                        "{report.workerStatement || "Resolved successfully."}"
                                      </p>
                                      {report.resolvedAt && (
                                        <span className="text-[9px] text-slate-500 font-mono block mt-1">
                                          Resolved on {new Date(report.resolvedAt).toLocaleDateString()}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-mono italic">
                                      Active task assigned to you. Head to **3rd Tab: Solve Case** to submit your solution.
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INTERACTIVE MAP VIEW */}
          {activeTab === "map" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    <span>Springfield Civic Map Integration</span>
                  </h1>
                  <p className="text-xs text-slate-400 font-mono mt-1">Satellite telemetry with live cluster points and coordinate triggers</p>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ArcGIS World Imagery Activated</span>
                </div>
              </div>

              {/* Advanced Filtering Options */}
              <div className="flex flex-wrap items-center gap-3 bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold font-mono uppercase">Category Layer Filter:</span>
                <button
                  onClick={() => setCategoryFilter("All")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                    categoryFilter === "All" 
                      ? "bg-indigo-600 text-white border-indigo-500 shadow" 
                      : "bg-slate-950 text-slate-300 border-slate-850 hover:bg-slate-800"
                  }`}
                >
                  All Active Reports
                </button>
                {CATEGORIES.slice(0, 6).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                      categoryFilter === cat 
                        ? "bg-indigo-600 text-white border-indigo-500 shadow" 
                        : "bg-slate-950 text-slate-300 border-slate-850 hover:bg-slate-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Dynamic Interactive SVG Mapping widget */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8">
                  <InteractiveMap
                    reports={reports}
                    onSelectReport={(r) => setSelectedReport(r)}
                    selectedReport={selectedReport}
                    activeCategoryFilter={categoryFilter}
                  />
                </div>
                
                {/* Side Inspector within Map layout */}
                <div className="lg:col-span-4">
                  {!selectedReport ? (
                    <div className="bg-slate-900 border border-slate-800 p-8 text-center rounded-2xl">
                      <MapPin className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 leading-relaxed">Click on any visual marker on the map telemetry to examine details, review severity reports, and verify department assignment.</p>
                    </div>
                  ) : (
                    <div className="bg-slate-900/95 border border-slate-700/60 p-6 rounded-2xl space-y-4 text-left shadow-2xl shadow-indigo-500/5 backdrop-blur-md">
                      <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                        <span className="text-[9px] uppercase font-mono text-slate-400 font-bold block tracking-wider">Selected Telemetry Node</span>
                        <span className={`text-[8px] font-bold font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${
                          selectedReport.priority === "CRITICAL" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          selectedReport.priority === "HIGH" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          "bg-slate-800/50 text-slate-400 border-slate-800"
                        }`}>
                          #{selectedReport.id}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-100 leading-snug">{selectedReport.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">{selectedReport.description}</p>
                      
                      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2 font-mono text-[10px]">
                        <div className="flex justify-between text-slate-400">
                          <span>Latitude:</span>
                          <span className="text-slate-200 font-semibold">{selectedReport.latitude}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Longitude:</span>
                          <span className="text-slate-200 font-semibold">{selectedReport.longitude}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveTab("dashboard")}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-colors shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Inspect in Core Dashboard</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REPORT NEW COMPLAINT */}
          {activeTab === "report" && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-left">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-400" />
                  <span>Report a Municipal Complaint</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-1">Submit high-contrast photos, specify locations via manual typing or map pins, and trigger automated AI analysis</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
                
                {/* Form Elements */}
                <form className="md:col-span-7 space-y-5" onSubmit={handleReportSubmit}>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Title of Complaint</label>
                    <input
                      type="text"
                      required
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      placeholder="e.g., Damaged sewer pipe leak"
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Complaint Statement (Detailed Description)</label>
                    <textarea
                      required
                      rows={4}
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Please describe the extent of damage, hazard safety levels, and any specific notes for maintenance workers..."
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-colors leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Problem Category</label>
                      <select
                        value={reportCategory}
                        onChange={(e) => setReportCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Locating Selector Option */}
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Locating Option</label>
                      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 border border-slate-850 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setLocatingMethod("pin")}
                          className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            locatingMethod === "pin"
                              ? "bg-indigo-600 text-white"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Pin Map
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocatingMethod("write")}
                          className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            locatingMethod === "write"
                              ? "bg-indigo-600 text-white"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Write Address
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Manual Address Typing or Locked Pin Address */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">
                      {locatingMethod === "write" ? "Write Complaint Address Location" : "Pinned Address (Click Map on Right)"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={reportAddress}
                        disabled={locatingMethod === "pin" || isGeocoding}
                        onChange={(e) => {
                          setReportAddress(e.target.value);
                        }}
                        onBlur={async () => {
                          if (locatingMethod === "write") {
                            await triggerGeocoding(reportAddress);
                          }
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            await triggerGeocoding(reportAddress);
                          }
                        }}
                        placeholder={locatingMethod === "write" ? "e.g., CenAPUB Colony, Gajuwaka, Visakhapatnam" : "Click anywhere on the map grid to lock location coordinates..."}
                        className={`flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none transition-all ${
                          locatingMethod === "pin" ? "opacity-75 cursor-not-allowed text-slate-400" : "focus:border-indigo-500/50 border-indigo-500/20"
                        }`}
                      />
                      {locatingMethod === "write" && (
                        <button
                          type="button"
                          disabled={isGeocoding}
                          onClick={() => triggerGeocoding(reportAddress)}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-lg shadow-indigo-500/10"
                          title="Locate typed address on the Springfield map"
                        >
                          {isGeocoding ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                          ) : (
                            <Search className="w-3.5 h-3.5" />
                          )}
                          <span>{isGeocoding ? "Locating..." : "Locate"}</span>
                        </button>
                      )}
                    </div>
                    {locatingMethod === "write" && (
                      <span className="text-[9px] text-slate-500 font-mono mt-1.5 block">
                        💡 Press <strong className="text-slate-400">Enter</strong> or click <strong className="text-indigo-400">Locate</strong> to focus the telemetry map on this address area!
                      </span>
                    )}
                  </div>

                  {/* Upload Picture File Drag and Drop section */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-2">Upload Picture of Issue</label>
                    
                    {isCapturing ? (
                      <CameraCapture
                        onCapture={async (base64) => {
                          setIsCapturing(false);
                          setIsCompressingImage(true);
                          setVerificationError(null);
                          setVerificationResult(null);
                          try {
                            const compressedData = await compressImage(base64);
                            setReportImages([compressedData]);
                            if (reportTitle.trim() && reportDescription.trim()) {
                              triggerImageVerification(compressedData);
                            } else {
                              setVerificationResult(null);
                              setVerificationError("Live photo captured & optimized. Please enter a title and description, then run AI relevance check.");
                            }
                          } catch (err) {
                            console.error("Live photo compression failed:", err);
                            setReportImages([base64]);
                            if (reportTitle.trim() && reportDescription.trim()) {
                              triggerImageVerification(base64);
                            } else {
                              setVerificationResult(null);
                              setVerificationError("Live photo captured. Please enter a title and description, then run AI relevance check.");
                            }
                          } finally {
                            setIsCompressingImage(false);
                          }
                        }}
                        onClose={() => setIsCapturing(false)}
                      />
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(true);
                        }}
                        onDragLeave={() => setIsDraggingFile(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(false);
                          if (e.dataTransfer.files?.[0]) {
                            handleFileUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative ${
                          isDraggingFile 
                            ? "border-indigo-500 bg-indigo-950/20" 
                            : "border-slate-800 bg-slate-950 hover:border-slate-700"
                        }`}
                      >
                        <input
                          id="citizen-pic-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                        
                        {isCompressingImage ? (
                          <div className="py-8 space-y-3">
                            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                            <div className="text-xs font-semibold text-indigo-300">Optimizing & Compressing...</div>
                            <p className="text-[10px] text-slate-400 font-mono">Reducing payload size for instant, reliable uploads.</p>
                          </div>
                        ) : reportImages.length > 0 ? (
                          <div className="space-y-3">
                            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-800">
                              <img src={reportImages[0]} alt="Uploaded preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button
                                type="button"
                                onClick={() => {
                                  setReportImages([]);
                                  setVerificationResult(null);
                                  setVerificationError(null);
                                }}
                                className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                title="Remove photo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block">Evidence Photo Loaded</span>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <label htmlFor="citizen-pic-upload" className="cursor-pointer block space-y-2">
                              <Camera className="w-8 h-8 text-slate-500 mx-auto" />
                              <div className="text-xs text-slate-300 font-semibold">
                                Drag & drop your picture here or <span className="text-indigo-400 underline">browse files</span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-mono">Supports JPEG, PNG or SVG formats</p>
                            </label>
                            
                            <div className="flex items-center justify-center gap-2">
                              <span className="h-[1px] w-8 bg-slate-850"></span>
                              <span className="text-[9px] uppercase font-mono text-slate-500">or</span>
                              <span className="h-[1px] w-8 bg-slate-850"></span>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2.5 justify-center items-center">
                              <button
                                type="button"
                                onClick={() => setIsCapturing(true)}
                                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-[11px] font-bold px-4 py-2 rounded-xl transition-all cursor-pointer border border-slate-700 shadow"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                Browser Cam / Simulator
                              </button>

                              <label
                                htmlFor="citizen-pic-upload"
                                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                Device Camera / Photo
                              </label>
                            </div>

                            <p className="text-[10px] text-slate-500 leading-tight">
                              💡 <strong>Tip:</strong> Clicking "Device Camera" lets you take a photo directly on mobile, or choose an existing photo on desktop.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Preset Quick Select Options */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-2">Or Quick Select Preset Camera Mockup</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PRESET_CIVIC_IMAGES.map((img) => (
                        <button
                          key={img.name}
                          type="button"
                          onClick={() => {
                            setReportImages([img.url]);
                            setReportCategory(img.category);
                            setReportTitle(img.name + " at Maple");
                            if (reportDescription.trim()) {
                              // If description is already written, auto run audit
                              triggerImageVerification(img.url);
                            } else {
                              setVerificationResult(null);
                              setVerificationError("Preset loaded. Enter issue description to complete AI verification.");
                            }
                          }}
                          className={`border rounded-xl p-1 overflow-hidden transition-all text-center relative cursor-pointer ${
                            reportImages[0] === img.url 
                              ? "border-indigo-500 bg-indigo-950/20" 
                              : "border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <img src={img.url} alt="Preset preview" className="w-full h-12 object-cover rounded-lg" />
                          <span className="text-[8px] font-mono text-slate-400 block mt-1 truncate">{img.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Verification Panel */}
                  {reportImages.length > 0 && (
                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          <span className="text-[10px] uppercase font-mono font-bold text-slate-200">AI Image Context Audit</span>
                        </div>
                        {isVerifyingImage ? (
                          <span className="text-[9px] font-mono text-indigo-400 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Analyzing...
                          </span>
                        ) : verificationResult ? (
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                            verificationResult.isRelevant 
                              ? "bg-emerald-950/45 text-emerald-400 border border-emerald-900/30" 
                              : "bg-rose-950/45 text-rose-400 border border-rose-900/30"
                          }`}>
                            {verificationResult.isRelevant ? "RELEVANT" : "FLAGGED"}
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-slate-500">Unverified</span>
                        )}
                      </div>

                      {isVerifyingImage ? (
                        <div className="py-2 text-center space-y-2">
                          <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 animate-[pulse_1s_infinite] w-3/4 rounded-full"></div>
                          </div>
                          <p className="text-[10px] text-slate-400 italic">Comparing photo features with title & description...</p>
                        </div>
                      ) : verificationResult ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-850">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-mono">Relevance Confidence</span>
                              <span className="text-sm font-bold text-slate-200">{verificationResult.relevanceScore}%</span>
                            </div>
                            <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  verificationResult.relevanceScore >= 70 
                                    ? "bg-emerald-500" 
                                    : verificationResult.relevanceScore >= 40 
                                    ? "bg-amber-500" 
                                    : "bg-rose-500"
                                }`}
                                style={{ width: `${verificationResult.relevanceScore}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 block font-mono">AI Reasoning</span>
                            <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/40 p-2.5 rounded-lg border border-slate-850/60">
                              {verificationResult.reasoning}
                            </p>
                          </div>

                          {verificationResult.detectedObjects && verificationResult.detectedObjects.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {verificationResult.detectedObjects.map((obj, i) => (
                                <span key={i} className="text-[9px] bg-indigo-950/30 text-indigo-300 border border-indigo-900/30 px-2 py-0.5 rounded-full font-mono">
                                  #{obj}
                                </span>
                              ))}
                            </div>
                          )}

                          {!verificationResult.isRelevant && (
                            <div className="bg-rose-950/20 border border-rose-900/30 p-2.5 rounded-lg flex gap-2 items-start">
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              <p className="text-[10px] text-rose-300 leading-normal">
                                <strong>Warning:</strong> AI flagged this photo as irrelevant to the title or description. Consider uploading a more relevant photo.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-slate-900/30 border border-slate-850/60 p-3 rounded-lg text-center space-y-2">
                          <p className="text-[10px] text-slate-400">
                            {verificationError || "Title & Description are required to run AI Context verification on your image."}
                          </p>
                          <button
                            type="button"
                            onClick={() => triggerImageVerification()}
                            disabled={!reportTitle.trim() || !reportDescription.trim()}
                            className="bg-indigo-950/40 border border-indigo-900/40 hover:bg-indigo-900/30 text-indigo-300 font-bold font-mono text-[9px] px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Verify Image with AI
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl cursor-pointer transition-colors shadow-lg shadow-indigo-500/10"
                  >
                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    <span>Submit Complaint</span>
                  </button>
                </form>

                {/* Left Side: Map positioning selector */}
                <div className="md:col-span-5 space-y-4">
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">Locating Visual Map Telemetry</span>
                  <InteractiveMap
                    reports={[]}
                    isReportingMode={true}
                    reportLatitude={reportLatitude}
                    reportLongitude={reportLongitude}
                    onMapClick={(lat, lng, addr) => {
                      if (locatingMethod === "pin") {
                        setReportLatitude(lat);
                        setReportLongitude(lng);
                        setReportAddress(addr);
                      }
                    }}
                  />
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl font-mono text-[10px] text-slate-500 space-y-1">
                    <span className="font-semibold block text-slate-400">Current GPS Latitude: {reportLatitude.toFixed(5)}</span>
                    <span className="font-semibold block text-slate-400">Current GPS Longitude: {reportLongitude.toFixed(5)}</span>
                    <span className="block mt-1">Matched Location: {reportAddress}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CITIZEN RESOLVED HISTORY LOG */}
          {activeTab === "citizen_history" && currentUser && (
            <div className="space-y-6 animate-fade-in text-left">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <span>My Reported Complaints & Resolved History</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Track the progress, assigned personnel, and engineering solutions of your submitted municipal reports.
                </p>
              </div>

              {reports.filter(r => r.citizenId === currentUser.id).length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
                  <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-400">You have not submitted any complaints yet.</p>
                  <p className="text-xs text-slate-600 mt-1">Submit your first complaint in the **Report New Complaint** tab!</p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase tracking-wider font-mono text-slate-400">
                          <th className="p-4 pl-6">Complaint Details</th>
                          <th className="p-4">Visual Evidence</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Who Solved It</th>
                          <th className="p-4">Resolution Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {reports
                          .filter(r => r.citizenId === currentUser.id)
                          .map((report) => {
                            const solver = report.assignedWorkerId 
                              ? usersList.find(u => u.id === report.assignedWorkerId) 
                              : null;
                            return (
                              <tr key={report.id} className="hover:bg-slate-900/35 transition-colors">
                                {/* Details */}
                                <td className="p-4 pl-6 align-top max-w-xs">
                                  <span className="text-[10px] text-slate-500 font-mono block">
                                    #{report.id} • {report.category} • {new Date(report.createdAt).toLocaleDateString()}
                                  </span>
                                  <span className="font-bold text-slate-200 block mt-1">{report.title}</span>
                                  <span className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-normal">
                                    {report.description}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono block mt-1">
                                    📍 Address: {report.address}
                                  </span>
                                </td>

                                {/* Images */}
                                <td className="p-4 align-top">
                                  <div className="flex gap-2">
                                    <div className="text-center shrink-0">
                                      <img src={report.beforeImage || report.images[0]} alt="Original" className="w-14 h-10 object-cover rounded border border-slate-800" />
                                      <span className="text-[8px] font-mono text-slate-500 block mt-0.5">Before</span>
                                    </div>
                                    {report.status === "RESOLVED" && report.afterImage && (
                                      <div className="text-center shrink-0">
                                        <img src={report.afterImage} alt="Resolved" className="w-14 h-10 object-cover rounded border border-emerald-900" />
                                        <span className="text-[8px] font-mono text-emerald-500 block mt-0.5">After</span>
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Status */}
                                <td className="p-4 align-top">
                                  <span className={`text-[10px] font-bold font-mono uppercase tracking-wide px-2 py-0.5 rounded border block w-max ${
                                    report.status === "RESOLVED" ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" :
                                    report.status === "ASSIGNED" ? "text-blue-400 border-blue-500/20 bg-blue-500/5" :
                                    report.status === "IN_PROGRESS" ? "text-purple-400 border-purple-500/20 bg-purple-500/5" :
                                    "text-yellow-400 border-yellow-500/20 bg-yellow-500/5"
                                  }`}>
                                    {report.status.replace("_", " ")}
                                  </span>
                                </td>

                                {/* Resolver */}
                                <td className="p-4 align-top">
                                  {report.status === "RESOLVED" && solver ? (
                                    <div className="flex items-center gap-2">
                                      <img src={solver.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"} alt="Solver" className="w-7 h-7 rounded-full object-cover border border-slate-800" />
                                      <div className="leading-tight">
                                        <span className="font-bold text-slate-200 block text-[11px]">{solver.fullName}</span>
                                        <span className="text-[9px] text-indigo-400 font-mono block">{solver.department || "Field Department"}</span>
                                      </div>
                                    </div>
                                  ) : report.assignedWorkerId && solver ? (
                                    <div className="flex items-center gap-2">
                                      <img src={solver.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"} alt="Assigned" className="w-7 h-7 rounded-full object-cover border border-slate-800 opacity-60" />
                                      <div className="leading-tight opacity-75">
                                        <span className="font-bold text-slate-300 block text-[11px]">{solver.fullName}</span>
                                        <span className="text-[9px] text-slate-500 font-mono block">In Progress</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-mono italic">Awaiting Field Dispatch</span>
                                  )}
                                </td>

                                {/* Solution comments */}
                                <td className="p-4 align-top max-w-xs">
                                  {report.status === "RESOLVED" ? (
                                    <>
                                      <p className="text-slate-300 font-sans italic text-[11px] leading-relaxed">
                                        "{report.workerStatement || "Resolved successfully by our field operations unit."}"
                                      </p>
                                      {report.resolvedAt && (
                                        <span className="text-[9px] text-slate-500 font-mono block mt-1">
                                          Resolved on {new Date(report.resolvedAt).toLocaleDateString()}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-mono italic">
                                      Our Municipal units are preparing to resolve this issue. Check back soon!
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: USERS DIRECTORY (Admin/Manager check) */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-fade-in text-left">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Authorized Personnel & Users Directory</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-1">Suspend profiles, verify departments, and coordinate field workers</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase tracking-wider font-mono text-slate-400">
                      <th className="p-4 pl-6">Full Name & Contact</th>
                      <th className="p-4">User Role</th>
                      <th className="p-4">Department / Region</th>
                      <th className="p-4">Suspension Status</th>
                      <th className="p-4 text-right pr-6">Override Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs">
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-slate-900/35 transition-colors">
                        <td className="p-4 pl-6 flex items-center gap-3">
                          <img src={usr.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-slate-800" />
                          <div>
                            <span className="font-bold text-slate-100 block">{usr.fullName}</span>
                            <span className="text-[10px] text-slate-500 font-mono block">{usr.email}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded font-mono ${
                            usr.role === "SUPER_ADMIN" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            usr.role === "MANAGER" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                            usr.role === "SOCIAL_WORKER" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                            "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {usr.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-300">
                          {usr.role === "SOCIAL_WORKER" ? usr.department : usr.role === "MANAGER" ? `${usr.department} • ${usr.assignedRegion}` : "N/A"}
                        </td>
                        <td className="p-4">
                          {usr.isSuspended ? (
                            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono">
                              Suspended
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right pr-6">
                          {usr.id === currentUser.id ? (
                            <span className="text-[10px] text-slate-600 font-mono">Current User</span>
                          ) : (
                            <button
                              onClick={() => handleToggleSuspendUser(usr.id, usr.isSuspended)}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                                usr.isSuspended 
                                  ? "bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-900" 
                                  : "bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900"
                              }`}
                            >
                              {usr.isSuspended ? "Unsuspend User" : "Suspend User"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SYSTEM SETTINGS (Super Admin check) */}
          {activeTab === "settings" && (
            <div className="max-w-xl mx-auto space-y-6 animate-fade-in text-left">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" />
                  <span>Global System Settings</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-1">Configure threshold variables, auto routing and alerting coordinates</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl space-y-6">
                <div className="space-y-4">
                  
                  {/* Option 1 */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="font-bold text-slate-200 block text-xs">Enable AI Duplicate Clustering</span>
                      <p className="text-[10px] text-slate-500 max-w-xs mt-0.5">Automatically identify incoming duplicate complaints in the same 200m district coordinates.</p>
                    </div>
                    <select
                      value={settings.enableAiClustering}
                      onChange={(e) => setSettings({ ...settings, enableAiClustering: e.target.value })}
                      className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>

                  {/* Option 2 */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="font-bold text-slate-200 block text-xs">Smart Auto-Routing</span>
                      <p className="text-[10px] text-slate-500 max-w-xs mt-0.5">Dispatches reports directly to matching departments using Gemini-generated recommendations.</p>
                    </div>
                    <select
                      value={settings.autoRoutingEnabled}
                      onChange={(e) => setSettings({ ...settings, autoRoutingEnabled: e.target.value })}
                      className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>

                  {/* Option 3 */}
                  <div>
                    <span className="font-bold text-slate-200 block text-xs mb-1">Alert Escalation Contacts</span>
                    <p className="text-[10px] text-slate-500 mb-2">Configure comma-separated municipal safety contact points for urgent CRITICAL alerts.</p>
                    <input
                      type="text"
                      value={settings.alertContacts}
                      onChange={(e) => setSettings({ ...settings, alertContacts: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>

                <button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/settings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(settings)
                      });
                      if (res.ok) {
                        alert("Settings applied and propagated globally!");
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3.5 rounded-xl cursor-pointer transition-colors shadow"
                >
                  Save and Sync Configuration
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: MY PROFILE VIEW (Citizen & Social Worker) */}
          {activeTab === "profile" && currentUser && (
            <div className="max-w-xl mx-auto space-y-6 animate-fade-in text-left">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-400" />
                  <span>My Profile Identity Management</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-1">Manage your public contact information, select avatars, and view your civic activities history</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl space-y-6">
                
                {/* Avatar select section */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">Select Profile Avatar</span>
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800/65">
                    <img src={currentUser.avatar} alt="Current" className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shrink-0" />
                    <div>
                      <span className="text-xs text-slate-400 font-mono block mb-2">Preset Municipal Avatars:</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                          "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
                          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
                          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
                          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
                        ].map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/users/${currentUser.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ avatar: url })
                                });
                                if (res.ok) {
                                  const updatedUser = await res.json();
                                  setCurrentUser(updatedUser);
                                  setUsersList(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
                                }
                              } catch (e) { console.error(e); }
                            }}
                            className={`w-9 h-9 rounded-full overflow-hidden border cursor-pointer transition-all ${
                              currentUser.avatar === url ? "border-indigo-400 ring-2 ring-indigo-500/20" : "border-slate-800 hover:border-slate-600"
                            }`}
                          >
                            <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom Avatar Upload Area & Direct Link Input */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/65 space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block mb-1">Option A: Drag & Drop Custom Photo</span>
                    <p className="text-[10px] text-slate-500 mb-3">Upload your custom profile picture directly. Supports drag & drop or click to choose.</p>
                    
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAvatarDragActive(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAvatarDragActive(false);
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAvatarDragActive(false);
                        const files = e.dataTransfer.files;
                        if (files && files[0]) {
                          await handleAvatarFileUpload(files[0]);
                        }
                      }}
                      onClick={() => {
                        const fileInput = document.getElementById("avatar-file-input");
                        if (fileInput) fileInput.click();
                      }}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                        avatarDragActive 
                          ? "border-indigo-500 bg-indigo-500/5 text-indigo-300" 
                          : "border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <input
                        type="file"
                        id="avatar-file-input"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (files && files[0]) {
                            await handleAvatarFileUpload(files[0]);
                          }
                        }}
                      />
                      <Upload className="w-5 h-5 text-indigo-400 mb-1" />
                      <span className="text-xs font-bold">
                        {avatarUploadStatus === "uploading" ? "Uploading photo..." : "Drop photo here or Click to select"}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">PNG, JPG or WEBP up to 5MB</span>
                      {avatarUploadStatus === "success" && (
                        <span className="text-[10px] text-emerald-400 font-mono font-bold mt-1">✓ Photo updated successfully!</span>
                      )}
                      {avatarUploadStatus === "error" && (
                        <span className="text-[10px] text-red-400 font-mono font-bold mt-1">⚠ Upload failed. Try another file.</span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-900 pt-3">
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block mb-1">Option B: Use Custom Image URL</span>
                    <p className="text-[10px] text-slate-500 mb-2.5">Paste an external web link directly to set as your profile avatar.</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Link className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          placeholder="https://example.com/my-photo.jpg"
                          value={avatarUrlInput}
                          onChange={(e) => setAvatarUrlInput(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 pl-8.5 pr-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!avatarUrlInput.trim()) return;
                          try {
                            setAvatarUploadStatus("uploading");
                            const res = await fetch(`/api/users/${currentUser.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ avatar: avatarUrlInput.trim() })
                            });
                            if (res.ok) {
                              const updatedUser = await res.json();
                              setCurrentUser(updatedUser);
                              setUsersList(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
                              setAvatarUrlInput("");
                              setAvatarUploadStatus("success");
                              setTimeout(() => setAvatarUploadStatus("idle"), 3000);
                            } else {
                              setAvatarUploadStatus("error");
                            }
                          } catch (e) {
                            console.error(e);
                            setAvatarUploadStatus("error");
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
                      >
                        Apply URL
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile update form */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const data = {
                      fullName: (form.elements.namedItem("fullName") as HTMLInputElement).value,
                      email: (form.elements.namedItem("email") as HTMLInputElement).value,
                      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
                    };
                    try {
                      const res = await fetch(`/api/users/${currentUser.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data)
                      });
                      if (res.ok) {
                        const updatedUser = await res.json();
                        setCurrentUser(updatedUser);
                        setUsersList(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
                        alert("Profile successfully saved and synchronized!");
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Full Identity Name</label>
                    <input
                      type="text"
                      name="fullName"
                      defaultValue={currentUser.fullName}
                      required
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Verified Email Address</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={currentUser.email || ""}
                      placeholder="e.g. abraham@springfield.org"
                      required
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Contact Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      defaultValue={currentUser.phone || ""}
                      placeholder="e.g. +1 (555) 019-2834"
                      required
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  {currentUser.role === "SOCIAL_WORKER" && (
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Assigned Department (Read Only)</label>
                      <input
                        type="text"
                        disabled
                        value={currentUser.department || "Municipal Field Unit"}
                        className="w-full bg-slate-950/60 border border-slate-850 text-xs text-slate-500 px-4 py-3 rounded-xl font-mono cursor-not-allowed"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3.5 rounded-xl cursor-pointer transition-colors shadow mt-2"
                  >
                    Save Changes & Update Profile
                  </button>
                </form>

                {/* Account details and activities stats */}
                <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4">
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block border-b border-slate-850 pb-2">
                    Account Metadata Dashboard
                  </span>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Unique System ID</span>
                      <span className="text-slate-300">#US-{currentUser.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Current Role</span>
                      <span className="text-indigo-400 uppercase font-bold">{currentUser.role.replace("_", " ")}</span>
                    </div>
                    {currentUser.role === "CITIZEN" && (
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Points Collected</span>
                        <span className="text-amber-400 font-bold">{currentUser.points} Pts</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Total Actions Logged</span>
                      <span className="text-slate-300">
                        {currentUser.role === "CITIZEN" 
                          ? reports.filter(r => r.citizenId === currentUser.id).length 
                          : reports.filter(r => r.assignedWorkerId === currentUser.id).length} Active cases
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === "complaint_box" && currentUser && (
            <ComplaintBox 
              currentUser={currentUser} 
              usersList={usersList} 
              onRefreshNotifications={async () => {
                try {
                  const res = await fetch(`/api/notifications/${currentUser.id}`);
                  if (res.ok) {
                    const data = await res.json();
                    setNotifications(data);
                  }
                } catch (e) {
                  console.error(e);
                }
              }} 
            />
          )}
        </main>
      </div>
    </div>
  );
}
