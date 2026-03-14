import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import type { Team } from "../types/game";

interface Props {
  onClose: () => void;
}

export function AwardChipsDialog({ onClose }: Props) {
  const awardChips = useGameStore((s) => s.awardChips);
  const [team, setTeam] = useState<Team>("RED");
  const [amount, setAmount] = useState(5);
  const [label, setLabel] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount > 0) {
      awardChips(team, amount, label || "Bonus");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700 w-80"
      >
        <h2 className="text-lg font-bold text-white mb-4">Award Chips</h2>

        <div className="mb-3">
          <label className="text-sm text-gray-300 block mb-1">Team</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTeam("RED")}
              className={`flex-1 py-1.5 rounded text-sm font-semibold transition-colors ${
                team === "RED"
                  ? "bg-red-500 text-white"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
            >
              Red
            </button>
            <button
              type="button"
              onClick={() => setTeam("BLUE")}
              className={`flex-1 py-1.5 rounded text-sm font-semibold transition-colors ${
                team === "BLUE"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
            >
              Blue
            </button>
          </div>
        </div>

        <div className="mb-3">
          <label className="text-sm text-gray-300 block mb-1">Amount</label>
          <input
            type="number"
            min={1}
            max={999}
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-1.5 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-400 text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-300 block mb-1">
            Event label <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Captured objective"
            className="w-full px-3 py-1.5 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-400 text-sm placeholder:text-gray-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-1.5 text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-1.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-500 rounded transition-colors"
          >
            Award
          </button>
        </div>
      </form>
    </div>
  );
}
