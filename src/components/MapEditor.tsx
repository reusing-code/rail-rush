import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { NodeDisplay } from "./NodeDisplay";
import { MapBackground } from "./MapBackground";
import { useGameStore } from "../store/gameStore";
import { ExportDialog } from "./ExportDialog";
import { ImportDialog } from "./ImportDialog";
import { readAndResizeImage } from "../utils/imageUtils";
import type { GameNode, BackgroundImageState } from "../types/game";

const nodeTypes = { gameNode: NodeDisplay as any };

function MapEditorInner() {
  const nodes = useGameStore((s) => s.nodes);
  const addNode = useGameStore((s) => s.addNode);
  const removeNode = useGameStore((s) => s.removeNode);
  const onNodesChange = useGameStore((s) => s.onNodesChange);
  const startGame = useGameStore((s) => s.startGame);
  const startingBalance = useGameStore((s) => s.startingBalance);
  const setStartingBalance = useGameStore((s) => s.setStartingBalance);
  const backgroundImage = useGameStore((s) => s.backgroundImage);
  const setBackgroundImage = useGameStore((s) => s.setBackgroundImage);
  const setBackgroundScale = useGameStore((s) => s.setBackgroundScale);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [bgEditMode, setBgEditMode] = useState(false);
  const [altHeld, setAltHeld] = useState(false);

  // Track Alt key to temporarily enable background move mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") setAltHeld(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") setAltHeld(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const bgInteractive = backgroundImage && (bgEditMode || altHeld);

  const handleWrapperDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement;
      const isPane =
        target.classList.contains("react-flow__pane") ||
        target.classList.contains("react-flow__background") ||
        target.closest(".react-flow__pane");
      if (!isPane) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addNode(position);
    },
    [addNode, screenToFlowPosition]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<GameNode>[]) => {
      const deleteChanges = changes.filter((c) => c.type === "remove");
      for (const change of deleteChanges) {
        removeNode(change.id);
      }

      const otherChanges = changes.filter((c) => c.type !== "remove");
      if (otherChanges.length > 0) {
        const updated = applyNodeChanges(otherChanges, nodes);
        onNodesChange(updated as GameNode[]);
      }
    },
    [nodes, onNodesChange, removeNode]
  );

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const { dataUrl, width, height } = await readAndResizeImage(file);
        const bgState: BackgroundImageState = {
          dataUrl,
          scale: 1,
          x: 0,
          y: 0,
          naturalWidth: width,
          naturalHeight: height,
        };
        setBackgroundImage(bgState);
      } catch (err) {
        console.error("Failed to load image:", err);
      }

      // Reset file input so the same file can be re-selected
      e.target.value = "";
    },
    [setBackgroundImage]
  );

  const handleRemoveBackground = useCallback(() => {
    setBackgroundImage(null);
  }, [setBackgroundImage]);

  const scalePercent = backgroundImage
    ? Math.round(backgroundImage.scale * 100)
    : 100;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-4 px-4 py-3 bg-gray-800 border-b border-gray-700">
        <h1 className="text-lg font-bold text-white">Rail Rush</h1>
        <span className="text-gray-400">|</span>
        <span className="text-sm text-gray-300">Map Editor</span>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setShowExport(true)}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            Export
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            Import
          </button>
          <div className="mx-1 border-l border-gray-600 h-6" />
          <label className="text-sm text-gray-300">Starting chips:</label>
          <input
            type="number"
            min={1}
            max={999}
            value={startingBalance}
            onChange={(e) => setStartingBalance(parseInt(e.target.value) || 1)}
            className="w-16 px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-400"
          />
        </div>
        <button
          onClick={startGame}
          disabled={nodes.length < 2}
          className="px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:text-gray-400 text-white text-sm font-semibold rounded transition-colors"
        >
          Start Game
        </button>
      </div>

      {/* Background image controls */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-800/80 border-b border-gray-700">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
          Background
        </span>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {!backgroundImage ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            Upload Image
          </button>
        ) : (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            >
              Replace
            </button>
            <button
              onClick={handleRemoveBackground}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-red-700 text-gray-300 hover:text-white rounded transition-colors"
            >
              Remove
            </button>

            <div className="mx-1 border-l border-gray-600 h-5" />

            {/* Scale controls */}
            <button
              onClick={() =>
                setBackgroundScale(backgroundImage.scale * 0.8)
              }
              className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors font-bold"
              title="Zoom out background"
            >
              -
            </button>
            <span className="text-xs text-gray-300 w-12 text-center tabular-nums">
              {scalePercent}%
            </span>
            <button
              onClick={() =>
                setBackgroundScale(backgroundImage.scale * 1.25)
              }
              className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors font-bold"
              title="Zoom in background"
            >
              +
            </button>
            <button
              onClick={() => setBackgroundScale(1)}
              className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              title="Reset to 100%"
            >
              Reset
            </button>

            <div className="mx-1 border-l border-gray-600 h-5" />

            <button
              onClick={() => setBgEditMode(!bgEditMode)}
              className={`px-3 py-0.5 text-xs rounded transition-colors ${
                bgEditMode
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
              title="Toggle background move mode (or hold Alt)"
            >
              Move BG
            </button>

            <span className="text-xs text-gray-500 hidden lg:inline">
              {bgEditMode
                ? "Drag to reposition background"
                : "Hold Alt + drag to reposition background"}
            </span>
          </>
        )}
      </div>

      {/* Canvas */}
      <div
        className="flex-1"
        ref={reactFlowWrapper}
        onDoubleClick={handleWrapperDoubleClick}
      >
        <ReactFlow
          nodes={nodes}
          nodeTypes={nodeTypes}
          onNodesChange={handleNodesChange}
          nodesConnectable={false}
          zoomOnDoubleClick={false}
          deleteKeyCode="Delete"
          minZoom={0.01}
          maxZoom={5}
          fitView
          className="bg-gray-900"
        >
          <Background color="#444" gap={20} />
          <MapBackground interactive={!!bgInteractive} />
          <Controls className="!bg-gray-700 !border-gray-600 !rounded [&>button]:!bg-gray-700 [&>button]:!border-gray-600 [&>button]:!fill-gray-300 [&>button:hover]:!bg-gray-600" />
        </ReactFlow>
      </div>

      {/* Hints */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400 flex gap-4 flex-wrap">
        <span>Double-click canvas to add node</span>
        <span>Drag nodes to move them</span>
        <span>Click node to select, Delete to remove</span>
        {backgroundImage && !bgEditMode && (
          <span>Hold Alt + drag background to reposition</span>
        )}
        {backgroundImage && bgEditMode && (
          <span>Drag background to reposition (Move BG active)</span>
        )}
      </div>

      {/* Export/Import dialogs */}
      {showExport && (
        <ExportDialog onClose={() => setShowExport(false)} mapOnly />
      )}
      {showImport && (
        <ImportDialog onClose={() => setShowImport(false)} />
      )}
    </div>
  );
}

export function MapEditor() {
  return (
    <ReactFlowProvider>
      <MapEditorInner />
    </ReactFlowProvider>
  );
}
