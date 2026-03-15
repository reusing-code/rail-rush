import { useState, useEffect, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { NodeDisplay } from "./NodeDisplay";
import { MapBackground } from "./MapBackground";
import { TeamSwitch } from "./TeamSwitch";
import { Scoreboard } from "./Scoreboard";
import { AwardChipsDialog } from "./AwardChipsDialog";
import { ExportDialog } from "./ExportDialog";
import { ImportDialog } from "./ImportDialog";
import { EventLog } from "./EventLog";
import { useGameStore } from "../store/gameStore";

const nodeTypes = { gameNode: NodeDisplay as any };

function GameBoardInner() {
  const nodes = useGameStore((s) => s.nodes);
  const activeTeam = useGameStore((s) => s.activeTeam);
  const undo = useGameStore((s) => s.undo);
  const redo = useGameStore((s) => s.redo);
  const canUndo = useGameStore((s) => s.canUndo);
  const canRedo = useGameStore((s) => s.canRedo);
  const resetToSetup = useGameStore((s) => s.resetToSetup);
  const placeChip = useGameStore((s) => s.placeChip);
  const removeChip = useGameStore((s) => s.removeChip);

  const [showAwardDialog, setShowAwardDialog] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      placeChip(node.id);
    },
    [placeChip]
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      removeChip(node.id);
    },
    [removeChip]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
          e.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const teamBorderColor =
    activeTeam === "RED" ? "border-red-500" : "border-blue-500";

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div
        className={`flex items-center gap-4 px-4 py-3 bg-gray-800 border-b-2 ${teamBorderColor} transition-colors`}
      >
        <h1 className="text-lg font-bold text-white">Rail Rush</h1>
        <span className="text-gray-400">|</span>
        <TeamSwitch />
        <div className="mx-2 border-l border-gray-600 h-6" />
        <Scoreboard />
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-gray-300 rounded transition-colors"
            title="Undo (Ctrl+Z)"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-gray-300 rounded transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            Redo
          </button>
          <div className="mx-1 border-l border-gray-600 h-6" />
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
          <button
            onClick={() => setShowAwardDialog(true)}
            className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-500 text-white font-semibold rounded transition-colors"
          >
            Award Chips
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-red-700 text-gray-300 hover:text-white rounded transition-colors"
          >
            Back to Setup
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          onNodeContextMenu={handleNodeContextMenu}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnDoubleClick={false}
          minZoom={0.01}
          maxZoom={5}
          fitView
          className="bg-gray-900"
        >
          <Background color="#444" gap={20} />
          <MapBackground />
          <Controls className="!bg-gray-700 !border-gray-600 !rounded [&>button]:!bg-gray-700 [&>button]:!border-gray-600 [&>button]:!fill-gray-300 [&>button:hover]:!bg-gray-600" />
        </ReactFlow>

        {/* Event log overlay */}
        <div className="absolute bottom-4 left-4 w-72">
          <EventLog />
        </div>
      </div>

      {/* Award chips dialog */}
      {showAwardDialog && (
        <AwardChipsDialog onClose={() => setShowAwardDialog(false)} />
      )}

      {/* Reset confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700 w-80">
            <h2 className="text-lg font-bold text-white mb-2">
              Back to Setup?
            </h2>
            <p className="text-sm text-gray-300 mb-4">
              This will clear all chip placements and events. The map layout
              will be preserved.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-1.5 text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToSetup();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export/Import dialogs */}
      {showExport && (
        <ExportDialog onClose={() => setShowExport(false)} />
      )}
      {showImport && (
        <ImportDialog onClose={() => setShowImport(false)} />
      )}
    </div>
  );
}

export function GameBoard() {
  return (
    <ReactFlowProvider>
      <GameBoardInner />
    </ReactFlowProvider>
  );
}
