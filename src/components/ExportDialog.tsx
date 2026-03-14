import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { exportMap, exportGame } from "../utils/exportImport";

type ExportMode = "map" | "game";

interface Props {
  onClose: () => void;
  /** If true, only map export is available (used in SETUP phase) */
  mapOnly?: boolean;
}

export function ExportDialog({ onClose, mapOnly }: Props) {
  const state = useGameStore.getState();
  const [mode, setMode] = useState<ExportMode>(mapOnly ? "map" : "game");
  const [result, setResult] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleExport = async () => {
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const encoded =
        mode === "map" ? await exportMap(state) : await exportGame(state);
      setResult(encoded);
    } catch (err) {
      setError(
        `Export failed: ${err instanceof Error ? err.message : "unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the textarea content
      const el = document.querySelector<HTMLTextAreaElement>(
        "[data-export-output]"
      );
      if (el) {
        el.select();
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700 w-96">
        <h2 className="text-lg font-bold text-white mb-4">Export</h2>

        {/* Mode selection */}
        {!mapOnly && (
          <div className="mb-4">
            <label className="text-sm text-gray-300 block mb-1">
              Export mode
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode("game");
                  setResult("");
                  setCopied(false);
                }}
                className={`flex-1 py-1.5 rounded text-sm font-semibold transition-colors ${
                  mode === "game"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
              >
                Map + Game
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("map");
                  setResult("");
                  setCopied(false);
                }}
                className={`flex-1 py-1.5 rounded text-sm font-semibold transition-colors ${
                  mode === "map"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
              >
                Map Only
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {mode === "game"
                ? "Includes map layout, chip placements, pools, and active team."
                : "Map layout only — nodes and settings. No game state."}
            </p>
          </div>
        )}

        {/* Generate button */}
        {!result && (
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:text-gray-400 rounded transition-colors mb-3"
          >
            {loading ? "Generating..." : "Generate Export String"}
          </button>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 mb-3">{error}</p>
        )}

        {/* Result */}
        {result && (
          <div className="mb-4">
            <label className="text-sm text-gray-300 block mb-1">
              Export string
            </label>
            <textarea
              data-export-output
              readOnly
              value={result}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-xs font-mono resize-none focus:outline-none focus:border-blue-400"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <p className="text-xs text-gray-500 mt-1">
              {result.length} characters
            </p>
            <button
              onClick={handleCopy}
              className={`w-full mt-2 py-1.5 text-sm font-semibold rounded transition-colors ${
                copied
                  ? "bg-green-700 text-green-200"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
          </div>
        )}

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-1.5 text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
