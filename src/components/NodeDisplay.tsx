import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { useGameStore } from "../store/gameStore";

/** Fixed node diameter in pixels */
export const NODE_SIZE = 40;

type GameNodeType = Node<
  { chips: { RED: number; BLUE: number }; [key: string]: unknown },
  "gameNode"
>;

function NodeDisplayInner({ data, selected }: NodeProps<GameNodeType>) {
  const phase = useGameStore((s) => s.phase);

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
      ? "bg-red-900/60"
      : control === "BLUE"
        ? "bg-blue-900/60"
        : "bg-gray-800/80";

  const shadowClass =
    selected && phase === "SETUP"
      ? "shadow-lg shadow-yellow-400/50 ring-2 ring-yellow-400"
      : "shadow-md";

  const cursorClass =
    phase === "PLAYING" ? "cursor-pointer" : "cursor-grab";

  const hasChips = RED > 0 || BLUE > 0;

  return (
    <div
      className={`rounded-full border-2 ${borderColor} ${bgColor} ${cursorClass} ${shadowClass} select-none relative flex items-center justify-center`}
      style={{ width: NODE_SIZE, height: NODE_SIZE }}
    >
      {/* Invisible handle covering the full node — kept for React Flow internals */}
      <Handle
        type="source"
        position={Position.Right}
        className="!absolute !inset-0 !w-full !h-full !transform-none !rounded-full !border-none !bg-transparent !opacity-0 !top-0 !left-0"
        isConnectable={false}
      />

      {/* Chip counts — only shown during play when chips exist */}
      {phase === "PLAYING" && hasChips && (
        <div className="flex items-center gap-0.5">
          {RED > 0 && (
            <span className="text-[9px] font-bold text-red-400 leading-none">
              {RED}
            </span>
          )}
          {RED > 0 && BLUE > 0 && (
            <span className="text-[7px] text-gray-500 leading-none">/</span>
          )}
          {BLUE > 0 && (
            <span className="text-[9px] font-bold text-blue-400 leading-none">
              {BLUE}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export const NodeDisplay = memo(NodeDisplayInner);
