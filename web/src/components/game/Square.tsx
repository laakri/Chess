import type { BoardThemeId, PieceSetId, Position, Square as SquareType } from "@/types/chess";
import { PieceView } from "./PieceView";

interface SquareProps {
  piece: SquareType;
  position: Position;
  isLight: boolean;
  isSelected: boolean;
  isLastMove: boolean;
  isLastMoveFrom: boolean;
  isLastMoveTo: boolean;
  isKingInCheck: boolean;
  isLegalTarget: boolean;
  isCaptureTarget: boolean;
  boardTheme: BoardThemeId;
  pieceSet: PieceSetId;
  showCoordinates: boolean;
  showLegalMove: boolean;
  isFlipped: boolean;
  onClick: (position: Position) => void;
  onContextMouseDown?: (event: React.MouseEvent<HTMLButtonElement>, position: Position) => void;
  onContextMouseEnter?: (position: Position) => void;
  onContextMouseUp?: () => void;
}

const themeClasses: Record<BoardThemeId, { light: string; dark: string }> = {
  walnut: {
    light: "bg-[#ead2ad]",
    dark: "bg-[#916445]",
  },
  tournament: {
    light: "bg-[#d7e8c1]",
    dark: "bg-[#6f9a61]",
  },
  midnight: {
    light: "bg-[#b9c4d8]",
    dark: "bg-[#33415f]",
  },
  graphite: {
    light: "bg-[#d8d8d2]",
    dark: "bg-[#777c7a]",
  },
};

export function Square({
  piece,
  position,
  isLight,
  isSelected,
  isLastMove,
  isLastMoveFrom,
  isLastMoveTo,
  isKingInCheck,
  isLegalTarget,
  isCaptureTarget,
  boardTheme,
  pieceSet,
  showCoordinates,
  showLegalMove,
  isFlipped,
  onClick,
  onContextMouseDown,
  onContextMouseEnter,
  onContextMouseUp,
}: SquareProps) {
  const rank = isFlipped ? position.row + 1 : 8 - position.row;
  const file = String.fromCharCode(isFlipped ? 104 - position.col : 97 + position.col);
  const squareTheme = themeClasses[boardTheme];
  const isWhitePiece = !!piece && piece === piece.toUpperCase();

  return (
    <button
      type="button"
      onClick={() => onClick(position)}
      onMouseDown={(event) => {
        if (onContextMouseDown) onContextMouseDown(event, position);
      }}
      onMouseEnter={() => {
        if (onContextMouseEnter) onContextMouseEnter(position);
      }}
      onMouseUp={() => {
        if (onContextMouseUp) onContextMouseUp();
      }}
      onContextMenu={(event) => {
        event.preventDefault();
      }}
      className={`group relative flex items-center justify-center select-none overflow-hidden text-4xl transition-all duration-200 sm:text-5xl lg:text-6xl ${isFlipped ? "rotate-180" : ""}
        ${isLight ? squareTheme.light : squareTheme.dark}
        ${isSelected ? "shadow-[inset_0_0_0_2px_rgba(255,255,255,0.8),inset_0_0_0_4px_rgba(59,130,246,0.9)]" : ""}
      `}
      aria-label={`Square ${position.row},${position.col}${piece ? `, ${piece}` : ""}`}
    >
      {isLastMove && !isSelected && (
        <span
          className={`absolute inset-0 ${
            isLastMoveFrom
              ? "bg-amber-300/30"
              : isLastMoveTo
                ? "bg-yellow-300/45"
                : "bg-amber-200/20"
          }`}
        />
      )}
      {isKingInCheck && (
        <span className="absolute inset-0 animate-pulse bg-red-500/35" />
      )}
      {showCoordinates && (!isFlipped ? position.col === 0 : position.col === 7) && (
        <span
          className={`absolute top-2 z-20 text-[12px] font-semibold text-black/60 ${
            "left-2.5"
          }`}
        >
          {rank}
        </span>
      )}
      {showCoordinates && (!isFlipped ? position.row === 7 : position.row === 0) && (
        <span
          className={`absolute z-20 text-[12px] font-semibold text-black/60 ${
            "bottom-2 right-2.5"
          }`}
        >
          {file}
        </span>
      )}
      {showLegalMove && isLegalTarget && (
        isCaptureTarget ? (
          <>
            <span className="pointer-events-none absolute inset-1 z-10 rounded-xl bg-red-500/[0.08]" />
            <span className="pointer-events-none absolute right-2 top-2 z-30 size-2 rounded-full bg-red-500/65 shadow-[0_0_10px_rgba(239,68,68,0.55)]" />
          </>
        ) : (
          <span className="absolute z-10 h-4 w-4 rounded-full bg-primary/45 ring-4 ring-primary/10" />
        )
      )}
      {piece && (
        <div className="relative z-20 transition-transform duration-200 group-hover:scale-[1.02]">
          <PieceView
            piece={piece}
            set={pieceSet}
            className={
              pieceSet === "image"
                ? "h-10 w-10 object-contain sm:h-12 sm:w-12 lg:h-[52px] lg:w-[52px]"
                : `${isWhitePiece ? "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.75)]" : "text-[#14110f] drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]"} text-5xl leading-none sm:text-6xl lg:text-[4rem]`
            }
          />
        </div>
      )}
    </button>
  );
}
