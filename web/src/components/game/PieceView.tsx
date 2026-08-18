import type { PieceSetId, PieceSymbol } from "@/types/chess";
import { PIECE_IMAGES, PIECE_GLYPHS } from "@/lib/pieceGlyphs";

interface PieceViewProps {
  piece: PieceSymbol;
  set: PieceSetId;
  className?: string;
}

export function PieceView({ piece, set, className }: PieceViewProps) {
  // IMAGE MODE
  if (set === "image") {
    return (
      <img
        src={PIECE_IMAGES[piece]}
        alt=""
        aria-label={piece === piece.toUpperCase() ? `White ${piece}` : `Black ${piece}`}
        className={className ?? "w-10 h-10 object-contain sm:w-12 sm:h-12 lg:w-14 lg:h-14"}
        draggable={false}
        loading="eager"
      />
    );
  }

  // TEXT MODE (minimal)
  const resolvedSet = Object.prototype.hasOwnProperty.call(PIECE_GLYPHS, set)
    ? set
    : ("minimal" as Exclude<PieceSetId, "image">);

  return (
    <span className={className ?? "text-2xl leading-none"}>
      {PIECE_GLYPHS[resolvedSet][piece]}
    </span>
  );
}