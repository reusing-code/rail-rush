import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GameState,
  GameNode,
  GameEdge,
  Team,
  HistoryAction,
  GameEvent,
  EditorMode,
} from "../types/game";

let idCounter = 0;
function nextId(prefix: string): string {
  return `${prefix}_${Date.now()}_${idCounter++}`;
}

interface GameActions {
  // Setup actions
  addNode: (position: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  addEdge: (source: string, target: string) => void;
  removeEdge: (id: string) => void;
  updateNodeLabel: (id: string, label: string) => void;
  setStartingBalance: (balance: number) => void;
  setEditorMode: (mode: EditorMode) => void;
  onNodesChange: (nodes: GameNode[]) => void;

  // Phase transitions
  startGame: () => void;
  resetToSetup: () => void;

  // Playing actions
  placeChip: (nodeId: string) => boolean;
  switchTeam: () => void;
  awardChips: (team: Team, amount: number, label: string) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Derived
  getNodeControl: (nodeId: string) => Team | null;
  getScoreboard: () => { RED: number; BLUE: number; leader: Team | null };
}

const initialState: GameState = {
  phase: "SETUP",
  activeTeam: "RED",
  nodes: [],
  edges: [],
  startingBalance: 20,
  chipPools: { RED: 20, BLUE: 20 },
  events: [],
  history: [],
  historyIndex: -1,
  nodeCounter: 0,
  editorMode: "CONNECT",
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // --- Setup actions ---

      addNode: (position) =>
        set((state) => {
          const count = state.nodeCounter + 1;
          const node: GameNode = {
            id: nextId("node"),
            type: "gameNode",
            position,
            data: {
              label: `Node ${count}`,
              chips: { RED: 0, BLUE: 0 },
            },
          };
          return {
            nodes: [...state.nodes, node],
            nodeCounter: count,
          };
        }),

      removeNode: (id) =>
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          edges: state.edges.filter(
            (e) => e.source !== id && e.target !== id
          ),
        })),

      addEdge: (source, target) =>
        set((state) => {
          // Prevent self-loops and duplicate edges
          if (source === target) return state;
          const exists = state.edges.some(
            (e) =>
              (e.source === source && e.target === target) ||
              (e.source === target && e.target === source)
          );
          if (exists) return state;
          const edge: GameEdge = {
            id: nextId("edge"),
            source,
            target,
            type: "straight",
            style: { stroke: "#888", strokeWidth: 3 },
          };
          return { edges: [...state.edges, edge] };
        }),

      removeEdge: (id) =>
        set((state) => ({
          edges: state.edges.filter((e) => e.id !== id),
        })),

      updateNodeLabel: (id, label) =>
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, label } } : n
          ),
        })),

      setStartingBalance: (balance) =>
        set({ startingBalance: Math.max(1, balance) }),

      setEditorMode: (mode) => set({ editorMode: mode }),

      onNodesChange: (nodes) => set({ nodes }),

      // --- Phase transitions ---

      startGame: () =>
        set((state) => ({
          phase: "PLAYING",
          activeTeam: "RED",
          chipPools: {
            RED: state.startingBalance,
            BLUE: state.startingBalance,
          },
          events: [],
          history: [],
          historyIndex: -1,
          // Reset chip counts on nodes
          nodes: state.nodes.map((n) => ({
            ...n,
            data: { ...n.data, chips: { RED: 0, BLUE: 0 } },
          })),
        })),

      resetToSetup: () =>
        set((state) => ({
          phase: "SETUP",
          activeTeam: "RED",
          chipPools: {
            RED: state.startingBalance,
            BLUE: state.startingBalance,
          },
          events: [],
          history: [],
          historyIndex: -1,
          nodes: state.nodes.map((n) => ({
            ...n,
            data: { ...n.data, chips: { RED: 0, BLUE: 0 } },
          })),
        })),

      // --- Playing actions ---

      placeChip: (nodeId) => {
        const state = get();
        const team = state.activeTeam;
        if (state.chipPools[team] <= 0) return false;

        const action: HistoryAction = { type: "PLACE_CHIP", nodeId, team };

        // Truncate any future history if we're not at the end
        const newHistory = [
          ...state.history.slice(0, state.historyIndex + 1),
          action,
        ];

        set({
          nodes: state.nodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    chips: {
                      ...n.data.chips,
                      [team]: n.data.chips[team] + 1,
                    },
                  },
                }
              : n
          ),
          chipPools: {
            ...state.chipPools,
            [team]: state.chipPools[team] - 1,
          },
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
        return true;
      },

      switchTeam: () =>
        set((state) => ({
          activeTeam: state.activeTeam === "RED" ? "BLUE" : "RED",
        })),

      awardChips: (team, amount, label) => {
        const state = get();
        const event: GameEvent = {
          id: nextId("event"),
          team,
          amount,
          label: label || "Bonus",
          timestamp: Date.now(),
        };

        const action: HistoryAction = {
          type: "AWARD_CHIPS",
          eventId: event.id,
          team,
          amount,
        };

        const newHistory = [
          ...state.history.slice(0, state.historyIndex + 1),
          action,
        ];

        set({
          chipPools: {
            ...state.chipPools,
            [team]: state.chipPools[team] + amount,
          },
          events: [...state.events, event],
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      // --- Undo / Redo ---

      undo: () => {
        const state = get();
        if (state.historyIndex < 0) return;

        const action = state.history[state.historyIndex];

        if (action.type === "PLACE_CHIP") {
          set({
            nodes: state.nodes.map((n) =>
              n.id === action.nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      chips: {
                        ...n.data.chips,
                        [action.team]: n.data.chips[action.team] - 1,
                      },
                    },
                  }
                : n
            ),
            chipPools: {
              ...state.chipPools,
              [action.team]: state.chipPools[action.team] + 1,
            },
            historyIndex: state.historyIndex - 1,
          });
        } else if (action.type === "AWARD_CHIPS") {
          set({
            chipPools: {
              ...state.chipPools,
              [action.team]: state.chipPools[action.team] - action.amount,
            },
            events: state.events.filter((e) => e.id !== action.eventId),
            historyIndex: state.historyIndex - 1,
          });
        }
      },

      redo: () => {
        const state = get();
        if (state.historyIndex >= state.history.length - 1) return;

        const action = state.history[state.historyIndex + 1];

        if (action.type === "PLACE_CHIP") {
          set({
            nodes: state.nodes.map((n) =>
              n.id === action.nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      chips: {
                        ...n.data.chips,
                        [action.team]: n.data.chips[action.team] + 1,
                      },
                    },
                  }
                : n
            ),
            chipPools: {
              ...state.chipPools,
              [action.team]: state.chipPools[action.team] - 1,
            },
            historyIndex: state.historyIndex + 1,
          });
        } else if (action.type === "AWARD_CHIPS") {
          const event: GameEvent = {
            id: action.eventId,
            team: action.team,
            amount: action.amount,
            label: "Bonus",
            timestamp: Date.now(),
          };
          set({
            chipPools: {
              ...state.chipPools,
              [action.team]: state.chipPools[action.team] + action.amount,
            },
            events: [...state.events, event],
            historyIndex: state.historyIndex + 1,
          });
        }
      },

      canUndo: () => get().historyIndex >= 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

      // --- Derived ---

      getNodeControl: (nodeId) => {
        const node = get().nodes.find((n) => n.id === nodeId);
        if (!node) return null;
        const { RED, BLUE } = node.data.chips;
        if (RED > BLUE) return "RED";
        if (BLUE > RED) return "BLUE";
        return null;
      },

      getScoreboard: () => {
        const nodes = get().nodes;
        let red = 0;
        let blue = 0;
        for (const node of nodes) {
          const { RED, BLUE } = node.data.chips;
          if (RED > BLUE) red++;
          else if (BLUE > RED) blue++;
        }
        return {
          RED: red,
          BLUE: blue,
          leader: red > blue ? "RED" : blue > red ? "BLUE" : null,
        };
      },
    }),
    {
      name: "rail-rush-storage",
      partialize: (state) => {
        const { editorMode: _, ...rest } = state;
        return rest;
      },
    }
  )
);
