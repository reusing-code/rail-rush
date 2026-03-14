import { useState, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { importState, type ImportResult } from "../utils/exportImport";
import { readAndResizeImage } from "../utils/imageUtils";

interface Props {
  onClose: () => void;
}

export function ImportDialog({ onClose }: Props) {
  const applyImport = useGameStore((s) => s.applyImport);
  const backgroundImage = useGameStore((s) => s.backgroundImage);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [applied, setApplied] = useState(false);

  // Background image upload state for imports that need it
  const [bgDataUrl, setBgDataUrl] = useState<string | null>(null);
  const [bgFileName, setBgFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Whether this import needs a background image upload */
  const needsBgUpload =
    preview &&
    preview.type !== "error" &&
    preview.state.backgroundImage &&
    !preview.state.backgroundImage.dataUrl;

  const handleValidate = async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Please paste an export string.");
      return;
    }

    setLoading(true);
    setError("");
    setPreview(null);
    setBgDataUrl(null);
    setBgFileName("");

    const result = await importState(
      trimmed,
      backgroundImage?.dataUrl ?? null
    );

    if (result.type === "error") {
      setError(result.message);
    } else {
      setPreview(result);
    }

    setLoading(false);
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { dataUrl } = await readAndResizeImage(file);
      setBgDataUrl(dataUrl);
      setBgFileName(file.name);
    } catch (err) {
      console.error("Failed to load image:", err);
      setError("Failed to load image file.");
    }

    e.target.value = "";
  };

  const handleApply = () => {
    if (!preview || preview.type === "error") return;

    const state = { ...preview.state };

    // Inject the uploaded background dataUrl if provided
    if (state.backgroundImage && bgDataUrl) {
      state.backgroundImage = {
        ...state.backgroundImage,
        dataUrl: bgDataUrl,
      };
    }

    applyImport(state);
    setApplied(true);
  };

  const nodeCount =
    preview && preview.type !== "error"
      ? (preview.state.nodes?.length ?? 0)
      : 0;
  const edgeCount =
    preview && preview.type !== "error"
      ? (preview.state.edges?.length ?? 0)
      : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700 w-96">
        <h2 className="text-lg font-bold text-white mb-4">Import</h2>

        {applied ? (
          <>
            <p className="text-sm text-green-400 mb-4">
              Import applied successfully! The{" "}
              {preview?.type === "game" ? "game state" : "map"} has been loaded.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-1.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-500 rounded transition-colors"
            >
              Done
            </button>
          </>
        ) : (
          <>
            {/* Input */}
            <div className="mb-3">
              <label className="text-sm text-gray-300 block mb-1">
                Paste export string
              </label>
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError("");
                  setPreview(null);
                  setBgDataUrl(null);
                  setBgFileName("");
                }}
                rows={4}
                placeholder="M1:... or G1:..."
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-xs font-mono resize-none focus:outline-none focus:border-blue-400 placeholder:text-gray-500"
              />
            </div>

            {/* Error */}
            {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

            {/* Preview */}
            {preview && preview.type !== "error" && (
              <div className="mb-3 p-3 bg-gray-700/50 rounded border border-gray-600">
                <p className="text-sm text-white font-semibold mb-1">
                  {preview.type === "game" ? "Map + Game State" : "Map Only"}
                </p>
                <ul className="text-xs text-gray-300 space-y-0.5">
                  <li>
                    {nodeCount} nodes, {edgeCount} edges
                  </li>
                  {preview.state.startingBalance !== undefined && (
                    <li>Starting balance: {preview.state.startingBalance}</li>
                  )}
                  {preview.state.backgroundImage && (
                    <li>
                      Background:{" "}
                      {preview.state.backgroundImage.naturalWidth}x
                      {preview.state.backgroundImage.naturalHeight}
                    </li>
                  )}
                  {preview.type === "game" && preview.state.chipPools && (
                    <li>
                      Chip pools: Red {preview.state.chipPools.RED}, Blue{" "}
                      {preview.state.chipPools.BLUE}
                    </li>
                  )}
                </ul>
                <p className="text-xs text-yellow-400 mt-2">
                  This will replace your current{" "}
                  {preview.type === "game" ? "game" : "map"}.
                </p>
              </div>
            )}

            {/* Background image upload prompt */}
            {needsBgUpload && (
              <div className="mb-3 p-3 bg-gray-700/50 rounded border border-blue-600/50">
                <p className="text-sm text-blue-300 font-semibold mb-1">
                  Background image needed
                </p>
                <p className="text-xs text-gray-300 mb-2">
                  This export includes a background image layout but not the
                  image data. Upload the original image to restore it.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBgUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                >
                  {bgDataUrl ? "Replace Image" : "Upload Image"}
                </button>
                {bgFileName && (
                  <span className="text-xs text-green-400 ml-2">
                    {bgFileName}
                  </span>
                )}
                {!bgDataUrl && (
                  <p className="text-xs text-gray-500 mt-1">
                    Optional — you can skip this and apply without a background.
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-1.5 text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                Cancel
              </button>
              {!preview || preview.type === "error" ? (
                <button
                  onClick={handleValidate}
                  disabled={loading || !input.trim()}
                  className="flex-1 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:text-gray-400 rounded transition-colors"
                >
                  {loading ? "Validating..." : "Validate"}
                </button>
              ) : (
                <button
                  onClick={handleApply}
                  className="flex-1 py-1.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-500 rounded transition-colors"
                >
                  Apply Import
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
