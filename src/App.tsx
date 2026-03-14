import { useGameStore } from "./store/gameStore";
import { MapEditor } from "./components/MapEditor";
import { GameBoard } from "./components/GameBoard";

export default function App() {
  const phase = useGameStore((s) => s.phase);

  return (
    <div className="h-screen w-screen bg-gray-900 text-white overflow-hidden">
      {phase === "SETUP" ? <MapEditor /> : <GameBoard />}
    </div>
  );
}
