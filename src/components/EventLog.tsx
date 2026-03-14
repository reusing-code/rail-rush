import { useState } from "react";
import { useGameStore } from "../store/gameStore";

export function EventLog() {
  const events = useGameStore((s) => s.events);
  const [expanded, setExpanded] = useState(false);

  if (events.length === 0) return null;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-750 flex items-center justify-between"
      >
        <span className="font-medium">Event Log ({events.length})</span>
        <span className="text-gray-500">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="max-h-40 overflow-y-auto border-t border-gray-700">
          {[...events].reverse().map((event) => (
            <div
              key={event.id}
              className="px-3 py-1.5 text-xs border-b border-gray-700/50 flex items-center gap-2"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  event.team === "RED" ? "bg-red-500" : "bg-blue-500"
                }`}
              />
              <span className="text-gray-300">
                <span className="font-semibold">
                  {event.team === "RED" ? "Red" : "Blue"}
                </span>{" "}
                +{event.amount} chips
              </span>
              <span className="text-gray-500">— {event.label}</span>
              <span className="text-gray-600 ml-auto">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
