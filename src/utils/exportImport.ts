/**
 * Export/import utilities for Rail Rush.
 *
 * Format:
 *   M1:<base64>   — map-only export
 *   G1:<base64>   — map + game state export
 *
 * The base64 payload is a deflate-compressed JSON object with short keys
 * to minimize size. Node IDs are mapped to sequential indices.
 *
 * Background image data URL is excluded; only the scale/position/dimensions
 * are included so the user can re-upload the same image.
 */

import type {
  GameState,
  GameNode,
  GameEdge,
  BackgroundImageState,
} from "../types/game";

// --- Compact data shapes ---

interface CompactBg {
  s: number; // scale
  x: number;
  y: number;
  w: number; // naturalWidth
  h: number; // naturalHeight
}

interface CompactMapExport {
  /** Nodes: [x, y][] */
  n: [number, number][];
  /** Edges: [sourceIndex, targetIndex][] */
  e: [number, number][];
  /** Starting balance */
  b: number;
  /** Node counter */
  c: number;
  /** Background (without dataUrl) */
  bg?: CompactBg;
}

interface CompactGameExport extends CompactMapExport {
  /** Active team: 0=RED, 1=BLUE */
  t: number;
  /** Chip pools: [RED, BLUE] */
  p: [number, number];
  /** Chips per node: [RED, BLUE][] (same order as nodes) */
  ch: [number, number][];
}

// --- Compression helpers using browser CompressionStream API ---

async function compress(data: string): Promise<string> {
  const bytes = new TextEncoder().encode(data);
  const cs = new CompressionStream("deflate");
  const writer = cs.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const compressed = await new Response(cs.readable).arrayBuffer();
  return uint8ToBase64url(new Uint8Array(compressed));
}

async function decompress(encoded: string): Promise<string> {
  const bytes = base64urlToUint8(encoded);
  const ds = new DecompressionStream("deflate");
  const writer = ds.writable.getWriter();
  writer.write(bytes as unknown as BufferSource);
  writer.close();
  const decompressed = await new Response(ds.readable).arrayBuffer();
  return new TextDecoder().decode(decompressed);
}

function uint8ToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToUint8(str: string): Uint8Array {
  // Restore standard base64
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Round to 1 decimal place to save space */
function r(n: number): number {
  return Math.round(n * 10) / 10;
}

// --- Export functions ---

function buildCompactMap(state: GameState): { compact: CompactMapExport; idToIndex: Map<string, number> } {
  const idToIndex = new Map<string, number>();
  const n: [number, number][] = [];

  for (let i = 0; i < state.nodes.length; i++) {
    const node = state.nodes[i];
    idToIndex.set(node.id, i);
    n.push([r(node.position.x), r(node.position.y)]);
  }

  const e: [number, number][] = state.edges.map((edge) => [
    idToIndex.get(edge.source)!,
    idToIndex.get(edge.target)!,
  ]);

  const compact: CompactMapExport = {
    n,
    e,
    b: state.startingBalance,
    c: state.nodeCounter,
  };

  if (state.backgroundImage) {
    compact.bg = {
      s: r(state.backgroundImage.scale),
      x: r(state.backgroundImage.x),
      y: r(state.backgroundImage.y),
      w: state.backgroundImage.naturalWidth,
      h: state.backgroundImage.naturalHeight,
    };
  }

  return { compact, idToIndex };
}

export async function exportMap(state: GameState): Promise<string> {
  const { compact } = buildCompactMap(state);
  const json = JSON.stringify(compact);
  const payload = await compress(json);
  return `M1:${payload}`;
}

export async function exportGame(state: GameState): Promise<string> {
  const { compact } = buildCompactMap(state);

  const gameCompact: CompactGameExport = {
    ...compact,
    t: state.activeTeam === "RED" ? 0 : 1,
    p: [state.chipPools.RED, state.chipPools.BLUE],
    ch: state.nodes.map((node) => [node.data.chips.RED, node.data.chips.BLUE]),
  };

  const json = JSON.stringify(gameCompact);
  const payload = await compress(json);
  return `G1:${payload}`;
}

// --- Import functions ---

let importCounter = 0;
function importId(prefix: string): string {
  return `${prefix}_imp_${Date.now()}_${importCounter++}`;
}

function rebuildFromCompact(
  compact: CompactMapExport,
  existingBgDataUrl: string | null
): Partial<GameState> {
  // Rebuild nodes with new unique IDs
  const indexToId: string[] = [];
  const nodes: GameNode[] = compact.n.map(([x, y], i) => {
    const id = importId("node");
    indexToId[i] = id;
    return {
      id,
      type: "gameNode" as const,
      position: { x, y },
      data: { chips: { RED: 0, BLUE: 0 } },
    };
  });

  const edges: GameEdge[] = compact.e.map(([si, ti]) => ({
    id: importId("edge"),
    source: indexToId[si],
    target: indexToId[ti],
    type: "straight" as const,
    style: { stroke: "#888", strokeWidth: 3 },
  }));

  let backgroundImage: BackgroundImageState | null = null;
  if (compact.bg) {
    backgroundImage = {
      dataUrl: existingBgDataUrl ?? "",
      scale: compact.bg.s,
      x: compact.bg.x,
      y: compact.bg.y,
      naturalWidth: compact.bg.w,
      naturalHeight: compact.bg.h,
    };
  }

  return {
    nodes,
    edges,
    startingBalance: compact.b,
    nodeCounter: compact.c,
    backgroundImage,
  };
}

export type ImportResult =
  | { type: "map"; state: Partial<GameState> }
  | { type: "game"; state: Partial<GameState> }
  | { type: "error"; message: string };

export async function importState(
  encoded: string,
  existingBgDataUrl: string | null
): Promise<ImportResult> {
  try {
    const trimmed = encoded.trim();
    const isMap = trimmed.startsWith("M1:");
    const isGame = trimmed.startsWith("G1:");

    if (!isMap && !isGame) {
      return { type: "error", message: "Invalid format. Expected M1: or G1: prefix." };
    }

    const payload = trimmed.slice(3);
    const json = await decompress(payload);
    const data = JSON.parse(json);

    // Basic validation
    if (!Array.isArray(data.n) || !Array.isArray(data.e)) {
      return { type: "error", message: "Invalid data: missing nodes or edges." };
    }

    const mapState = rebuildFromCompact(data as CompactMapExport, existingBgDataUrl);

    if (isMap) {
      return {
        type: "map",
        state: {
          ...mapState,
          phase: "SETUP",
          activeTeam: "RED",
          chipPools: { RED: data.b, BLUE: data.b },
          events: [],
          history: [],
          historyIndex: -1,
          editorMode: "CONNECT",
        },
      };
    }

    // Game import
    const gameData = data as CompactGameExport;

    // Apply chip counts to nodes
    if (Array.isArray(gameData.ch) && mapState.nodes) {
      for (let i = 0; i < mapState.nodes.length && i < gameData.ch.length; i++) {
        mapState.nodes[i].data.chips = {
          RED: gameData.ch[i][0],
          BLUE: gameData.ch[i][1],
        };
      }
    }

    return {
      type: "game",
      state: {
        ...mapState,
        phase: "PLAYING",
        activeTeam: gameData.t === 0 ? "RED" : "BLUE",
        chipPools: { RED: gameData.p[0], BLUE: gameData.p[1] },
        events: [],
        history: [],
        historyIndex: -1,
        editorMode: "CONNECT",
      },
    };
  } catch (err) {
    return {
      type: "error",
      message: `Import failed: ${err instanceof Error ? err.message : "unknown error"}`,
    };
  }
}
