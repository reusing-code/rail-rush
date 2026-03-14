import { useGameStore } from "../store/gameStore";

export function TeamSwitch() {
  const activeTeam = useGameStore((s) => s.activeTeam);
  const switchTeam = useGameStore((s) => s.switchTeam);

  const isRed = activeTeam === "RED";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-sm font-bold ${isRed ? "text-red-400" : "text-red-800"}`}
      >
        RED
      </span>
      <button
        onClick={switchTeam}
        className={`relative w-14 h-7 rounded-full transition-colors ${
          isRed ? "bg-red-500" : "bg-blue-500"
        }`}
      >
        <div
          className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
            isRed ? "left-0.5" : "left-7"
          }`}
        />
      </button>
      <span
        className={`text-sm font-bold ${!isRed ? "text-blue-400" : "text-blue-800"}`}
      >
        BLUE
      </span>
    </div>
  );
}
