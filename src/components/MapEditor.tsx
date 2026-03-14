import { useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  ConnectionMode,
  ConnectionLineType,
  type Connection,
  type DefaultEdgeOptions,
  useReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { NodeDisplay } from "./NodeDisplay";
import { MapBackground } from "./MapBackground";
import { useGameStore } from "../store/gameStore";
import type { GameNode, BackgroundImageState } from "../types/game";

const nodeTypes = { gameNode: NodeDisplay as any };

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "straight",
  style: { stroke: "#888", strokeWidth: 3 },
};

/** Max dimension (width or height) to resize uploaded images to, to keep localStorage manageable. */
const MAX_IMAGE_DIMENSION = 2048;

/**
 * Reads a File as a data URL, resizing if necessary to fit within MAX_IMAGE_DIMENSION.
 * Returns the data URL and natural dimensions of the (possibly resized) image.
 */
function readAndResizeImage(
  file: File
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Resize if too large
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const ratio = Math.min(
            MAX_IMAGE_DIMENSION / width,
            MAX_IMAGE_DIMENSION / height
          );
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        // Use JPEG at 0.8 quality for smaller size, PNG for transparency
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve({ dataUrl, width, height });
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function MapEditorInner() {
  const nodes = useGameStore((s) => s.nodes);
  const edges = useGameStore((s) => s.edges);
  const addNode = useGameStore((s) => s.addNode);
  const addEdge = useGameStore((s) => s.addEdge);
  const removeNode = useGameStore((s) => s.removeNode);
  const removeEdge = useGameStore((s) => s.removeEdge);
  const onNodesChange = useGameStore((s) => s.onNodesChange);
  const startGame = useGameStore((s) => s.startGame);
  const startingBalance = useGameStore((s) => s.startingBalance);
  const setStartingBalance = useGameStore((s) => s.setStartingBalance);
  const editorMode = useGameStore((s) => s.editorMode);
  const setEditorMode = useGameStore((s) => s.setEditorMode);
  const backgroundImage = useGameStore((s) => s.backgroundImage);
  const setBackgroundImage = useGameStore((s) => s.setBackgroundImage);
  const setBackgroundScale = useGameStore((s) => s.setBackgroundScale);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Hold Ctrl to temporarily switch to Move mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control" && editorMode === "CONNECT") {
        setEditorMode("MOVE");
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control") {
        setEditorMode("CONNECT");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [editorMode, setEditorMode]);

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

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addEdge(connection.source, connection.target);
      }
    },
    [addEdge]
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

  const handleEdgesChange = useCallback(
    (changes: Array<{ type: string; id: string }>) => {
      for (const change of changes) {
        if (change.type === "remove") {
          removeEdge(change.id);
        }
      }
    },
    [removeEdge]
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

  const isConnectMode = editorMode === "CONNECT";

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

        {/* Mode toggle */}
        <div className="flex items-center bg-gray-700 rounded overflow-hidden">
          <button
            onClick={() => setEditorMode("CONNECT")}
            className={`px-3 py-1 text-sm font-medium transition-colors ${
              isConnectMode
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Connect
          </button>
          <button
            onClick={() => setEditorMode("MOVE")}
            className={`px-3 py-1 text-sm font-medium transition-colors ${
              !isConnectMode
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Move
          </button>
        </div>
        <span className="text-xs text-gray-500 hidden sm:inline">
          Hold Ctrl to move temporarily
        </span>

        <div className="flex items-center gap-2 ml-auto">
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

            <span className="text-xs text-gray-500 hidden lg:inline">
              Drag image in Move mode to reposition
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
          edges={edges}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          onConnect={handleConnect}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange as any}
          connectionMode={ConnectionMode.Loose}
          connectionLineType={ConnectionLineType.Straight}
          connectionLineStyle={{ stroke: "#888", strokeWidth: 3 }}
          nodesDraggable={!isConnectMode}
          nodesConnectable={isConnectMode}
          zoomOnDoubleClick={false}
          deleteKeyCode="Delete"
          minZoom={0.01}
          maxZoom={5}
          fitView
          className="bg-gray-900"
        >
          <Background color="#444" gap={20} />
          <MapBackground interactive={!isConnectMode} />
          <Controls className="!bg-gray-700 !border-gray-600 !rounded [&>button]:!bg-gray-700 [&>button]:!border-gray-600 [&>button]:!fill-gray-300 [&>button:hover]:!bg-gray-600" />
        </ReactFlow>
      </div>

      {/* Hints */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400 flex gap-4 flex-wrap">
        <span>Double-click canvas to add node</span>
        {isConnectMode ? (
          <span>Drag from node to node to connect</span>
        ) : (
          <span>Drag nodes to move them</span>
        )}
        <span>Double-click node to rename</span>
        <span>Click node to select, Delete to remove</span>
        {backgroundImage && !isConnectMode && (
          <span>Drag background image to reposition</span>
        )}
      </div>
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
