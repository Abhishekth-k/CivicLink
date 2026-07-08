import React, { useState, useEffect } from "react";
import { CloudRain, Sun, Cloud, CloudLightning, Wind, Droplets, Thermometer } from "lucide-react";
import { WeatherInfo } from "../types";

interface WeatherProps {
  latitude: number;
  longitude: number;
}

export default function WeatherWidget({ latitude, longitude }: WeatherProps) {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchWeather() {
      setLoading(true);
      try {
        const res = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
        if (res.ok) {
          const data = await res.json();
          setWeather(data);
        }
      } catch (e) {
        console.error("Failed to fetch weather:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, [latitude, longitude]);

  const getWeatherIcon = (cond: string) => {
    const c = cond.toLowerCase();
    if (c.includes("rain") || c.includes("shower")) return <CloudRain className="w-8 h-8 text-sky-400 animate-bounce" />;
    if (c.includes("lightning") || c.includes("thunder")) return <CloudLightning className="w-8 h-8 text-indigo-400 animate-pulse" />;
    if (c.includes("cloud") || c.includes("partly")) return <Cloud className="w-8 h-8 text-slate-300" />;
    return <Sun className="w-8 h-8 text-amber-400 animate-spin-slow" />;
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-center h-28 animate-pulse">
        <span className="text-xs text-slate-500 font-mono">Fetching Weather Metrics...</span>
      </div>
    );
  }

  const activeWeather = weather || {
    temp: 24.5,
    humidity: 65,
    windSpeed: 12.5,
    rain: 0.0,
    condition: "Sunny Springfield Skies"
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 p-4 sm:p-5 rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="bg-slate-800/60 p-2.5 sm:p-3 rounded-xl border border-slate-700/50 shrink-0">
          {getWeatherIcon(activeWeather.condition)}
        </div>
        <div className="min-w-0">
          <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-widest text-slate-400 block mb-0.5">Current Weather</span>
          <h4 className="text-sm sm:text-base font-bold text-slate-200 leading-snug truncate">{activeWeather.condition}</h4>
          <span className="text-[10px] sm:text-xs text-slate-500 font-mono block mt-0.5">Lat: {latitude.toFixed(3)} Lng: {longitude.toFixed(3)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6 pt-3 sm:pt-0 border-t border-slate-800/50 sm:border-t-0">
        <div className="text-center sm:text-right">
          <div className="flex items-center gap-1 justify-center sm:justify-end text-slate-200">
            <Thermometer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 shrink-0" />
            <span className="text-sm sm:text-lg font-bold font-mono">{activeWeather.temp.toFixed(1)}°C</span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono uppercase block mt-0.5">Temp</span>
        </div>

        <div className="text-center sm:text-right border-l border-r border-slate-800/50 sm:border-0 px-2 sm:px-0">
          <div className="flex items-center gap-1 justify-center sm:justify-end text-slate-200">
            <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
            <span className="text-sm sm:text-lg font-bold font-mono">{activeWeather.humidity}%</span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono uppercase block mt-0.5">Humidity</span>
        </div>

        <div className="text-center sm:text-right">
          <div className="flex items-center gap-1 justify-center sm:justify-end text-slate-200">
            <Wind className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400 shrink-0" />
            <span className="text-sm sm:text-lg font-bold font-mono truncate">{activeWeather.windSpeed} km/h</span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono uppercase block mt-0.5">Wind</span>
        </div>
      </div>
    </div>
  );
}
