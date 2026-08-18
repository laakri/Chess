import type { MoveRecord } from "@/types/chess";

interface MoveListProps {
  moves: MoveRecord[];
}

export function MoveList({ moves }: MoveListProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
        Moves
      </div>
      <div className="min-h-0 flex-1 space-y-0.5 overflow-hidden rounded-3xl bg-foreground/[0.04] p-2 font-mono text-sm">
        {moves.map((move, i) => {
          const isLast = i === moves.length - 1;
          return (
            <div key={i} className="grid grid-cols-[28px_1fr_1fr] gap-2 rounded-2xl px-2 py-1 hover:bg-background/65">
              <span className="text-muted-foreground">{i + 1}</span>
              <span className={isLast && !move.black ? "text-primary" : ""}>{move.white}</span>
              <span className={isLast && !!move.black ? "text-primary" : ""}>{move.black ?? ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
