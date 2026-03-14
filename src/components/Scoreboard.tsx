import { useGameStore } from "../store/gameStore";

export function Scoreboard() {
  const chipPools = useGameStore((s) => s.chipPools);
  const getScoreboard = useGameStore((s) => s.getScoreboard);

  const { RED: redNodes, BLUE: blueNodes, leader } = getScoreboard();

  return (
    <div className="flex items-center gap-4">
      {/* Red team */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-red-500 rounded-full" />
        <div className="text-sm">
          <span className="font-bold text-red-400">{redNodes}</span>
          <span className="text-gray-400"> nodes</span>
          <span className="text-gray-500 mx-1">|</span>
          <span className="text-red-300">{chipPools.RED}</span>
          <span className="text-gray-400"> chips left</span>
        </div>
      </div>

      {/* Leader indicator */}
      <div className="px-2 py-0.5 rounded text-xs font-bold">
        {leader === "RED" && (
          <span className="text-red-400 bg-red-950 px-2 py-1 rounded">RED LEADS</span>
        )}
        {leader === "BLUE" && (
          <span className="text-blue-400 bg-blue-950 px-2 py-1 rounded">BLUE LEADS</span>
        )}
        {leader === null && (
          <span className="text-gray-400 bg-gray-800 px-2 py-1 rounded">TIED</span>
        )}
      </div>

      {/* Blue team */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full" />
        <div className="text-sm">
          <span className="font-bold text-blue-400">{blueNodes}</span>
          <span className="text-gray-400"> nodes</span>
          <span className="text-gray-500 mx-1">|</span>
          <span className="text-blue-300">{chipPools.BLUE}</span>
          <span className="text-gray-400"> chips left</span>
        </div>
      </div>
    </div>
  );
}
