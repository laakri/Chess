import { useEffect, useId, useRef, useState } from "react";
import { isPlayerInCheck } from "@/hooks/useGameState";
import type { BoardState, BoardSizeId, BoardThemeId, PieceSetId, Position } from "@/types/chess";
import { Square } from "./Square";

interface BoardProps {
  board: BoardState;
  activeSeat: string;
  selectedSquare: Position | null;
  legalTargets: Position[];
  lastMove: { from: Position; to: Position } | null;
  boardTheme: BoardThemeId;
  boardSize: BoardSizeId;
  showCoordinates: boolean;
  showLegalMoves: boolean;
  traceDurationMs: number;
  onSquareClick: (position: Position) => void;
}

const boardSizeClasses: Record<BoardSizeId, string> = {
  comfortable: "w-[min(100%,calc(100vh-7.5rem),620px)]",
  large: "w-[min(100%,calc(100vh-7.5rem),760px)]",
  huge: "w-[min(100%,calc(100vh-7.5rem),900px)]",
};

const CELL = 100; // viewBox units per square
const DOT_COLOR = { fill: "#f59e0b", stroke: "#b45309" };

type ArrowColor = "green" | "yellow" | "blue" | "red";

const ARROW_PALETTE: Record<ArrowColor, { fill: string; stroke: string }> = {
  green: { fill: "#3fa34d", stroke: "#2f7d3b" },
  yellow: { fill: "#f2b90c", stroke: "#c8940a" },
  blue: { fill: "#3f8cf4", stroke: "#2e6bc4" },
  red: { fill: "#e0524d", stroke: "#b93f3b" },
};

function colorForEvent(event: React.MouseEvent): ArrowColor {
  if (event.altKey) return "red";
  if (event.ctrlKey || event.metaKey) return "blue";
  if (event.shiftKey) return "yellow";
  return "green";
}

interface Trace {
  id: number;
  from: Position;
  to: Position;
  color: ArrowColor;
}

export function Board({
  board,
  activeSeat,
  selectedSquare,
  legalTargets,
  lastMove,
  boardTheme,
  boardSize,
  showCoordinates,
  showLegalMoves,
  traceDurationMs,
  onSquareClick,
}: BoardProps) {
  const isSamePos = (a: Position | null, b: Position) =>
    !!a && a.row === b.row && a.col === b.col;

  const [traces, setTraces] = useState<Trace[]>([]);
  const activeTraceIdRef = useRef<number | null>(null);
  const traceStartRef = useRef<Position | null>(null);
  const isTracingRef = useRef(false);
  const clearTimeoutRefs = useRef<Record<number, number>>({});
  const shadowId = useId();

  const clearTraceById = (id: number) => {
    setTraces((prev) => prev.filter((trace) => trace.id !== id));
    if (clearTimeoutRefs.current[id]) {
      window.clearTimeout(clearTimeoutRefs.current[id]);
      delete clearTimeoutRefs.current[id];
    }

    if (activeTraceIdRef.current === id) {
      activeTraceIdRef.current = null;
    }
  };

  const startTrace = (position: Position, color: ArrowColor) => {
    const id = Date.now() + Math.random();
    const nextTrace: Trace = { id, from: position, to: position, color };

    isTracingRef.current = true;
    traceStartRef.current = position;
    activeTraceIdRef.current = id;
    setTraces((prev) => [...prev, nextTrace]);
  };

  const updateTrace = (position: Position) => {
    if (!isTracingRef.current || !traceStartRef.current || activeTraceIdRef.current === null) return;

    setTraces((prev) =>
      prev.map((trace) =>
        trace.id === activeTraceIdRef.current ? { ...trace, to: position } : trace
      )
    );
  };

  const endTrace = () => {
    if (!isTracingRef.current || activeTraceIdRef.current === null) return;

    const traceId = activeTraceIdRef.current;
    isTracingRef.current = false;
    activeTraceIdRef.current = null;
    traceStartRef.current = null;

    clearTimeoutRefs.current[traceId] = window.setTimeout(() => {
      clearTraceById(traceId);
    }, Math.max(300, traceDurationMs));
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => endTrace();
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      Object.values(clearTimeoutRefs.current).forEach((timer) => window.clearTimeout(timer));
      clearTimeoutRefs.current = {};
    };
  }, []);

  const activeKingPosition = board.reduce<Position | null>((found, row, rowIndex) => {
    if (found) return found;

    const colIndex = row.findIndex((piece) => piece === (activeSeat === "white" ? "K" : "k"));
    return colIndex >= 0 ? { row: rowIndex, col: colIndex } : null;
  }, null);
  const isActiveKingInCheck = isPlayerInCheck(board, activeSeat);

  const renderTrace = (trace: Trace) => {
    const palette = ARROW_PALETTE[trace.color];

    const start = { x: (trace.from.col + 0.5) * CELL, y: (trace.from.row + 0.5) * CELL };
    const end = { x: (trace.to.col + 0.5) * CELL, y: (trace.to.row + 0.5) * CELL };

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);

    if (length < CELL * 0.35) {
      return (
        <g key={trace.id} opacity={0.85}>
          <circle
            cx={start.x}
            cy={start.y}
            r={CELL * 0.32}
            fill={DOT_COLOR.fill}
            fillOpacity={0.4}
            stroke={DOT_COLOR.stroke}
            strokeWidth={4}
            strokeOpacity={0.8}
          />
        </g>
      );
    }

    const ux = dx / length;
    const uy = dy / length;
    const px = -uy;
    const py = ux;
    const headLength = 26;
    const headWidth = 20;
    const shaftWidth = 15;
    const tip = { x: end.x - ux * 8, y: end.y - uy * 8 };
    const baseCenter = { x: tip.x - ux * headLength, y: tip.y - uy * headLength };
    const leftBase = { x: baseCenter.x + px * (headWidth / 2), y: baseCenter.y + py * (headWidth / 2) };
    const rightBase = { x: baseCenter.x - px * (headWidth / 2), y: baseCenter.y - py * (headWidth / 2) };
    const shaftEnd = { x: baseCenter.x + ux * 3, y: baseCenter.y + uy * 3 };

    return (
      <g key={trace.id} opacity={0.9}>
        <line
          x1={start.x}
          y1={start.y}
          x2={shaftEnd.x}
          y2={shaftEnd.y}
          stroke={palette.fill}
          strokeWidth={shaftWidth}
          strokeLinecap="round"
        />
        <polygon
          points={`${tip.x},${tip.y} ${leftBase.x},${leftBase.y} ${rightBase.x},${rightBase.y}`}
          fill={palette.fill}
          stroke={palette.stroke}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </g>
    );
  };

  return (
    <div
      className={`relative grid aspect-square grid-cols-8 grid-rows-8 ${boardSizeClasses[boardSize]} overflow-hidden rounded-[28px] shadow-2xl shadow-black/10`}
      onContextMenu={(event) => event.preventDefault()}
      onMouseUp={endTrace}
    >
      {traces.length > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 z-30 h-full w-full"
          viewBox={`0 0 ${CELL * 8} ${CELL * 8}`}
        >
          <defs>
            <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" floodColor="#000000" floodOpacity="0.35" />
            </filter>
          </defs>
          {traces.map((trace) => renderTrace(trace))}
        </svg>
      )}

      {board.map((row, r) =>
        row.map((piece, c) => {
          const position: Position = { row: r, col: c };
          const isFromLastMove = !!lastMove && isSamePos(lastMove.from, position);
          const isToLastMove = !!lastMove && isSamePos(lastMove.to, position);
          const isLastMove = isFromLastMove || isToLastMove;
          const isKingInCheck =
            !!activeKingPosition &&
            isActiveKingInCheck &&
            isSamePos(activeKingPosition, position);
          const isLegalTarget = legalTargets.some((target) => isSamePos(target, position));

          return (
            <Square
              key={`${r}-${c}`}
              piece={piece}
              position={position}
              isLight={(r + c) % 2 === 0}
              isSelected={isSamePos(selectedSquare, position)}
              isLastMove={isLastMove}
              isLastMoveFrom={isFromLastMove}
              isLastMoveTo={isToLastMove}
              isKingInCheck={isKingInCheck}
              isLegalTarget={isLegalTarget}
              boardTheme={boardTheme}
              pieceSet={"image" as PieceSetId}
              showCoordinates={showCoordinates}
              showLegalMove={showLegalMoves}
              onClick={onSquareClick}
              onContextMouseDown={(event, pos) => {
                if (event.button !== 2) return;
                event.preventDefault();
                startTrace(pos, colorForEvent(event));
              }}
              onContextMouseEnter={(pos) => {
                if (isTracingRef.current && traceStartRef.current) {
                  updateTrace(pos);
                }
              }}
              onContextMouseUp={endTrace}
            />
          );
        })
      )}
    </div>
  );
}