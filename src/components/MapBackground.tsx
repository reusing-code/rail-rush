import { useGameStore } from "../store/gameStore";
import { ViewportPortal, useStoreApi } from "@xyflow/react";

/**
 * Renders the background image inside React Flow's viewport portal,
 * so it lives in flow-coordinate space and pans/zooms identically
 * to nodes and edges.
 *
 * Uses CSS transform: scale() instead of setting large width/height
 * values, which avoids browser rendering limits on large elements.
 *
 * In setup Move mode, the image can be dragged to reposition.
 */
export function MapBackground({ interactive }: { interactive?: boolean }) {
  const bg = useGameStore((s) => s.backgroundImage);
  const setBackgroundPosition = useGameStore((s) => s.setBackgroundPosition);
  const storeApi = useStoreApi();

  if (!bg) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startBgX = bg.x;
    const startBgY = bg.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const zoom = storeApi.getState().transform[2];
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      setBackgroundPosition(startBgX + dx, startBgY + dy);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <ViewportPortal>
      <img
        src={bg.dataUrl}
        alt="Map background"
        draggable={false}
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: bg.naturalWidth,
          height: bg.naturalHeight,
          transform: `translate(${bg.x}px, ${bg.y}px) scale(${bg.scale})`,
          transformOrigin: "0 0",
          opacity: 0.5,
          pointerEvents: interactive ? "auto" : "none",
          cursor: interactive ? "grab" : "default",
          userSelect: "none",
          zIndex: -1,
        }}
      />
    </ViewportPortal>
  );
}
