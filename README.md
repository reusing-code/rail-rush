# Rail Rush

A browser-only game state tracker for a real-world board game. Two teams (Red and Blue) fight for control of nodes on a map by placing casino chips. No backend required -- all state is persisted to localStorage.

## Features

- **Map Editor (Setup phase)**: Design a graph of nodes and connections. Double-click to add nodes, drag between nodes to connect them, click to select + Delete to remove. Toggle between Connect and Move modes.
- **Game Board (Playing phase)**: Map is locked. Toggle between teams and click nodes to place chips. Team with the most chips at a node controls it. Team controlling the most nodes leads.
- **Chip Economy**: Both teams start with a configurable chip balance. Placing chips deducts from the team's pool. Bonus chips can be awarded via the Award Chips dialog with an event label.
- **Undo/Redo**: Full undo/redo for all game actions (chip placements and awards). Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z.
- **Event Log**: Collapsible chronological log of all chip awards.
- **Persistence**: Full game state survives page refresh via Zustand persist middleware and localStorage.

## Tech Stack

- React + TypeScript
- Vite
- React Flow (`@xyflow/react`)
- Zustand (state management with persist middleware)
- Tailwind CSS v4

## Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build
```

## AI Disclaimer

This project was developed with substantial assistance from AI tools (Claude by Anthropic). The AI was used for code generation, architecture decisions, debugging, and documentation. The codebase was iteratively built through human-AI collaboration.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
