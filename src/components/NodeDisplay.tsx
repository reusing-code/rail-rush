import { memo, useState, useCallback, useRef, useEffect } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { useGameStore } from "../store/gameStore";

type GameNodeType = Node<{ label: string; chips: { RED: number; BLUE: number } }, "gameNode">;

function NodeDisplayInner({ id, data, selected }: NodeProps<GameNodeType>) {
  const phase = useGameStore((s) => s.phase);
  const activeTeam = useGameStore((s) => s.activeTeam);
  const editorMode = useGameStore((s) => s.editorMode);
  const updateNodeLabel = useGameStore((s) => s.updateNodeLabel);

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (phase === "SETUP") {
        setEditValue(data.label);
        setEditing(true);
      }
    },
    [phase, data.label]
  );

  const commitLabel = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed) {
      updateNodeLabel(id, trimmed);
    }
    setEditing(false);
  }, [editValue, id, updateNodeLabel]);

  const { RED, BLUE } = data.chips;
  const control = RED > BLUE ? "RED" : BLUE > RED ? "BLUE" : null;

  const borderColor =
    selected && phase === "SETUP"
      ? "border-yellow-400"
      : control === "RED"
        ? "border-red-500"
        : control === "BLUE"
          ? "border-blue-500"
          : "border-gray-400";

  const bgColor =
    control === "RED"
      ? "bg-red-50"
      : control === "BLUE"
        ? "bg-blue-50"
        : "bg-white";

  const shadowClass =
    selected && phase === "SETUP"
      ? "shadow-lg shadow-yellow-400/50 ring-2 ring-yellow-400"
      : "shadow-md";

  const cursorClass =
    phase === "PLAYING"
      ? "cursor-pointer"
      : editorMode === "MOVE"
        ? "cursor-grab"
        : "cursor-crosshair";

  // In CONNECT mode, the handle covers the full node for easy drag-to-connect.
  // In MOVE mode, the handle is not connectable so dragging moves the node.
  const isConnectable = phase === "SETUP" && editorMode === "CONNECT";

  return (
    <div
      className={`px-3 py-2 rounded-lg border-2 ${borderColor} ${bgColor} ${cursorClass} ${shadowClass} min-w-[80px] select-none relative`}
      onDoubleClick={handleDoubleClick}
    >
      {/* Single invisible handle covering the full node for connections.
          Always rendered so edges have an anchor point. */}
      <Handle
        type="source"
        position={Position.Right}
        className="!absolute !inset-0 !w-full !h-full !transform-none !rounded-lg !border-none !bg-transparent !opacity-0 !top-0 !left-0"
        isConnectable={isConnectable}
      />

      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitLabel}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitLabel();
            if (e.key === "Escape") setEditing(false);
          }}
          className="text-xs font-semibold text-center bg-transparent outline-none border-b border-gray-400 w-full text-gray-800"
        />
      ) : (
        <div className="text-xs font-semibold text-center text-gray-700 truncate">
          {data.label}
        </div>
      )}

      {phase === "PLAYING" && (RED > 0 || BLUE > 0) && (
        <div className="flex justify-center gap-2 mt-1">
          {RED > 0 && (
            <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {RED}
            </span>
          )}
          {BLUE > 0 && (
            <span className="text-[10px] font-bold bg-blue-500 text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {BLUE}
            </span>
          )}
        </div>
      )}

      {phase === "PLAYING" && (
        <div
          className={`text-[9px] text-center mt-0.5 font-medium ${
            activeTeam === "RED" ? "text-red-400" : "text-blue-400"
          }`}
        >
          click to place
        </div>
      )}
    </div>
  );
}

export const NodeDisplay = memo(NodeDisplayInner);
