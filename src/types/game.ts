import type { Node, Edge } from "@xyflow/react";

export type Team = "RED" | "BLUE";

export type GamePhase = "SETUP" | "PLAYING";

export interface ChipCounts {
  RED: number;
  BLUE: number;
}

export interface GameNodeData {
  chips: ChipCounts;
  [key: string]: unknown;
}

export type GameNode = Node<GameNodeData, "gameNode">;
export type GameEdge = Edge;

export interface GameEvent {
  id: string;
  team: Team;
  amount: number;
  label: string;
  timestamp: number;
}

export type HistoryAction =
  | { type: "PLACE_CHIP"; nodeId: string; team: Team }
  | { type: "AWARD_CHIPS"; eventId: string; team: Team; amount: number };

export type EditorMode = "CONNECT" | "MOVE";

export interface BackgroundImageState {
  /** Base64 data URL of the uploaded image */
  dataUrl: string;
  /** Scale factor (1 = original size in flow coordinates) */
  scale: number;
  /** Position offset in flow coordinates */
  x: number;
  y: number;
  /** Natural dimensions of the image */
  naturalWidth: number;
  naturalHeight: number;
}

export interface GameState {
  phase: GamePhase;
  activeTeam: Team;
  nodes: GameNode[];
  edges: GameEdge[];
  startingBalance: number;
  chipPools: ChipCounts;
  events: GameEvent[];
  history: HistoryAction[];
  historyIndex: number;
  nodeCounter: number;
  editorMode: EditorMode;
  backgroundImage: BackgroundImageState | null;
}
