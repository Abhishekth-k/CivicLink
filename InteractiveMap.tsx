import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { Report } from "../types";
import { MapPin, Layers, Crosshair, Flame, Eye, EyeOff, Navigation } from "lucide-react";

interface MapProps {
  reports: Report[];
  onSelectReport?: (report: Report) => void;
  selectedReport?: Report | null;
  onMapClick?: (lat: number, lng: number, address: string) => void;
  activeCategoryFilter?: string;
  isReportingMode?: boolean;
  reportLatitude?: number;
  reportLongitude?: number;
}

export default function InteractiveMap({
  reports,
  onSelectReport,
  selectedReport,
  onMapClick,
  activeCategoryFilter = "All",
  isReportingMode = false,
  reportLatitude,
  reportLongitude,
}: MapProps) {
  // We default mapType to "satellite" because the user specifically requested ArcGIS Satellite Tiles!
  const [mapType, setMapType] = useState<"standard" | "satellite">("satellite");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [clickedLocation, setClickedLocation] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    if (isReportingMode && reportLatitude && reportLongitude) {
      if (!clickedLocation || clickedLocation.lat !== reportLatitude || clickedLocation.lng !== reportLongitude) {
        setClickedLocation({ lat: reportLatitude, lng: reportLongitude });
      }
    }
  }, [reportLatitude, reportLongitude, isReportingMode]);

  const [map, setMap] = useState<L.Map | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);
  const heatmapLayerRef = useRef<L.Layer | null>(null);

  // Springfield default center
  const defaultCenter: L.LatLngExpression = [37.7749, -122.4194];

  // Colors based on category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Garbage": return "bg-amber-500 text-white";
      case "Potholes": return "bg-orange-500 text-white";
      case "Streetlight": return "bg-yellow-400 text-slate-900";
      case "Water leakage": return "bg-blue-500 text-white";
      case "Drainage": return "bg-cyan-600 text-white";
      case "Flood": return "bg-indigo-600 text-white";
      case "Fire": return "bg-red-600 text-white";
      case "Smoke": return "bg-slate-500 text-white";
      case "Tree fall": return "bg-emerald-600 text-white";
      default: return "bg-purple-600 text-white";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "RESOLVED": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "ASSIGNED": return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "IN_PROGRESS": return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      default: return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
    }
  };

  // 1. Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || map) return;

    const mapInstance = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(defaultCenter, 13);

    setMap(mapInstance);

    // Reset layout on resize
    const resizeObserver = new ResizeObserver(() => {
      mapInstance.invalidateSize();
    });
    if (mapRef.current) {
      resizeObserver.observe(mapRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      mapInstance.remove();
      setMap(null);
    };
  }, []);

  // 2. Handle map click listener (reporting coordinates)
  useEffect(() => {
    if (!map) return;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      if (!isReportingMode || !onMapClick) return;
      const { lat, lng } = e.latlng;

      setClickedLocation({ lat, lng });

      let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      let success = false;

      // 1. Try direct client-side Nominatim reverse geocoding (reliable from user's browser)
      try {
        const clientRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          {
            headers: {
              "Accept": "application/json"
            }
          }
        );
        if (clientRes.ok) {
          const data = await clientRes.json();
          if (data && data.display_name) {
            address = data.display_name;
            success = true;
          }
        }
      } catch (err) {
        console.warn("Client-side reverse geocoding failed, trying backend...", err);
      }

      // 2. Try server-side proxy reverse geocoding if client-side failed
      if (!success) {
        try {
          const response = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
              address = data.display_name;
              success = true;
            }
          }
        } catch (err) {
          console.warn("Server-side reverse geocoding failed, falling back to mock", err);
        }
      }

      // 3. Ultimate local fallback
      if (!success) {
        const streets = ["Maple Avenue", "Industrial Parkway", "Oak Lane", "Washington Boulevard", "Broadway", "Pine Street"];
        const numbers = [142, 282, 19, 505, 1120, 84];
        const street = streets[Math.floor(Math.abs(lat + lng) * 1000) % streets.length];
        const number = numbers[Math.floor(Math.abs(lat * lng) * 1000) % numbers.length];
        address = `${number} ${street}, Springfield`;
      }

      onMapClick(
        parseFloat(lat.toFixed(5)),
        parseFloat(lng.toFixed(5)),
        address
      );
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, isReportingMode, onMapClick]);

  // 3. Update standard map layer vs. ArcGIS satellite tile layer URL requested
  useEffect(() => {
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const url = mapType === "satellite"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const attribution = mapType === "satellite"
      ? "Tiles &copy; Esri &mdash; Source: Esri & partners"
      : "&copy; OpenStreetMap contributors";

    tileLayerRef.current = L.tileLayer(url, {
      maxZoom: 19,
      attribution
    }).addTo(map);
  }, [map, mapType]);

  // 4. Update markers & filters
  const filteredReports = reports.filter(r =>
    activeCategoryFilter === "All" || r.category === activeCategoryFilter
  );

  useEffect(() => {
    if (!map) return;

    if (!markersGroupRef.current) {
      markersGroupRef.current = L.featureGroup().addTo(map);
    } else {
      markersGroupRef.current.clearLayers();
    }

    // Only render markers if heatmap is NOT activated
    if (!showHeatmap) {
      filteredReports.forEach((report) => {
        const isSelected = selectedReport?.id === report.id;
        const colorClass = getCategoryColor(report.category);
        const pulseRing = report.priority === "CRITICAL" ? '<span class="absolute -inset-1.5 bg-red-500/40 rounded-full animate-ping"></span>' : '';
        const activeRing = isSelected ? 'ring-4 ring-sky-500/60 scale-125 border-sky-300' : 'hover:scale-110 border-slate-700 bg-slate-900';

        const customIcon = L.divIcon({
          className: "bg-transparent border-0",
          html: `
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full border shadow-lg transition-all duration-300 ${activeRing}">
              ${pulseRing}
              <div class="w-5 h-5 rounded-full flex items-center justify-center text-white ${colorClass}">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="10" r="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        });

        const marker = L.marker([report.latitude, report.longitude], { icon: customIcon });

        // On Click
        marker.on("click", () => {
          if (onSelectReport) onSelectReport(report);
        });

        // Add to group
        marker.addTo(markersGroupRef.current!);
      });
    }
  }, [map, filteredReports, selectedReport, showHeatmap]);

  // 5. Update temporary reporting marker
  useEffect(() => {
    if (!map) return;

    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }

    if (isReportingMode && clickedLocation) {
      const reportingIcon = L.divIcon({
        className: "bg-transparent border-0",
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-amber-400 bg-amber-950 scale-125 shadow-2xl animate-pulse">
            <span class="absolute -inset-1.5 bg-amber-500/50 rounded-full animate-ping"></span>
            <div class="w-5 h-5 rounded-full flex items-center justify-center text-amber-400">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      tempMarkerRef.current = L.marker([clickedLocation.lat, clickedLocation.lng], {
        icon: reportingIcon
      }).addTo(map);

      map.setView([clickedLocation.lat, clickedLocation.lng], 15, {
        animate: true,
        duration: 0.5
      });
    }
  }, [map, clickedLocation, isReportingMode]);

  // 6. Handle pan/zoom on selected report from parent
  useEffect(() => {
    if (!map || !selectedReport) return;

    map.setView([selectedReport.latitude, selectedReport.longitude], 15, {
      animate: true,
      duration: 1.0
    });
  }, [map, selectedReport]);

  // 7. Heatmap View Toggle
  useEffect(() => {
    if (!map) return;

    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.remove();
      heatmapLayerRef.current = null;
    }

    if (showHeatmap) {
      // Draw grid circles representing hot zone anomalies dynamically
      const circles: L.Circle[] = [];
      filteredReports.forEach((report) => {
        const circle = L.circle([report.latitude, report.longitude], {
          color: "red",
          fillColor: "#f03",
          fillOpacity: 0.25,
          radius: 200
        }).addTo(map);
        circles.push(circle);
      });

      heatmapLayerRef.current = {
        remove: () => {
          circles.forEach(c => c.remove());
        }
      } as L.Layer;
    }
  }, [map, showHeatmap, filteredReports]);

  // Map utilities
  const handleZoomIn = () => {
    map?.zoomIn();
  };

  const handleZoomOut = () => {
    map?.zoomOut();
  };

  const handleResetView = () => {
    if (selectedReport) {
      map?.setView([selectedReport.latitude, selectedReport.longitude], 15);
    } else if (filteredReports.length > 0) {
      const group = L.featureGroup(filteredReports.map(r => L.marker([r.latitude, r.longitude])));
      map?.fitBounds(group.getBounds(), { padding: [50, 50] });
    } else {
      map?.setView(defaultCenter, 13);
    }
  };

  return (
    <div className="relative w-full h-[520px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl group select-none">
      
      {/* Map Container Ref */}
      <div ref={mapRef} className="absolute inset-0 w-full h-full z-10" />

      {/* Reporting Mode Overlay Banner */}
      {isReportingMode && (
        <div className="absolute top-4 left-4 right-4 bg-sky-950/90 border border-sky-800 text-sky-200 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-lg backdrop-blur animate-fade-in z-30">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-sky-400 animate-spin" />
            <span><strong>Click on the map</strong> to specify the problem's GPS coordinates and location.</span>
          </div>
          <span className="text-[10px] uppercase font-mono bg-sky-900/50 px-2.5 py-0.5 rounded text-sky-300">Active Picker</span>
        </div>
      )}

      {/* Map Control Utilities (Right Floating) */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
        <button
          onClick={() => setMapType(mapType === "standard" ? "satellite" : "standard")}
          className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl shadow-md border border-slate-800/80 backdrop-blur transition-all cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span className="capitalize">{mapType} View</span>
        </button>

        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl shadow-md border backdrop-blur transition-all cursor-pointer ${
            showHeatmap
              ? "bg-red-600 text-white border-red-500"
              : "bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-800"
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Hot Zones</span>
        </button>
      </div>

      {/* Zoom / Navigation Controls (Left Floating) */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
        <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur">
          <button
            onClick={handleZoomIn}
            className="p-2.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer border-b border-slate-800"
            title="Zoom In"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4"></path></svg>
          </button>
        </div>

        <button
          onClick={handleResetView}
          className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl shadow-xl backdrop-blur transition-all cursor-pointer"
          title="Recenter Map"
        >
          <Navigation className="w-4 h-4 text-sky-400" />
        </button>
      </div>

      {/* Selected Node Bottom overlay (Only in standard view and when selected) */}
      {selectedReport && !isReportingMode && (
        <div className="absolute bottom-4 left-4 right-16 bg-slate-900/95 border border-slate-800 p-3.5 rounded-xl shadow-2xl backdrop-blur flex items-center justify-between gap-4 z-30 animate-fade-in">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`p-2.5 rounded-xl ${getCategoryColor(selectedReport.category)}`}>
              <MapPin className="w-4 h-4" />
            </div>
            <div className="overflow-hidden text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-100 truncate">{selectedReport.title}</span>
                <span className={`text-[8px] font-mono font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${getStatusBadgeColor(selectedReport.status)}`}>
                  {selectedReport.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">{selectedReport.address}</p>
            </div>
          </div>
          <button
            onClick={() => onSelectReport?.(selectedReport)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shrink-0 cursor-pointer transition-all"
          >
            Inspect Node
          </button>
        </div>
      )}

      {/* Map Legend (Bottom-Left when no report selected) */}
      {!selectedReport && (
        <div className="absolute bottom-4 left-4 bg-slate-950/90 border border-slate-800 p-3 rounded-xl shadow-lg backdrop-blur flex flex-col gap-1.5 z-30 text-[10px] text-slate-300 w-44 text-left">
          <span className="font-semibold text-slate-200 mb-1 border-b border-slate-800 pb-1 font-mono uppercase tracking-wider text-[9px]">Map Legend</span>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 border border-red-500 animate-pulse" />
            <span>Fire / Hazardous</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-orange-400" />
            <span>Potholes & Roads</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-400" />
            <span>Garbage / Litter</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-yellow-300" />
            <span>Streetlights</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-400" />
            <span>Water Leak / Flood</span>
          </div>
        </div>
      )}
    </div>
  );
}
