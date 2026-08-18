import type { PieceSetId, PieceSymbol } from "@/types/chess";
import { PieceView } from "./PieceView";

interface CapturedPiecesProps {
  pieces: PieceSymbol[];
  title?: string;
  pieceSet?: PieceSetId;
}

export function CapturedPieces({ pieces, title = "Captured", pieceSet = "image" as PieceSetId }: CapturedPiecesProps) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">
        {title}
      </div>
      <div className="flex min-h-7 flex-wrap gap-1 text-xl text-muted-foreground">
        {pieces.length === 0 ? (
          <span className="text-sm text-muted-foreground">None yet</span>
        ) : (
          pieces.map((p, i) => (
            <PieceView key={i} piece={p} set={pieceSet} className="w-6 h-6" />
          ))
        )}
      </div>
    </div>
  );
}
