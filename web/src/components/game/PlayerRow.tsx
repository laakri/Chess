import type { PlayerInfo } from "@/types/chess";
import { Flag, Handshake, Timer, Crown } from "lucide-react";

interface PlayerRowProps {
  player: PlayerInfo;
  active: boolean;
  thinking?: boolean;
  showActions?: boolean;
  onOfferDraw?: () => void;
  onResign?: () => void;
}

function parseClockSeconds(clock: string): number | null {
  const parts = clock.split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function PlayerRow({
  player,
  active,
  thinking = false,
  showActions = false,
  onOfferDraw,
  onResign,
}: PlayerRowProps) {
  const seconds = parseClockSeconds(player.clock);
  const isLow = seconds !== null && seconds < 60;
  const isCritical = seconds !== null && seconds < 10;
  const isWhite = /white|w$/i.test(player.seat);

  return (
    <div
      className={`group relative flex h-14 w-full items-center justify-between rounded-2xl px-3 transition-all duration-300 ${
        active
          ? "bg-[#171512] text-white shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_8px_20px_-8px_rgba(0,0,0,0.5)] ring-1 ring-primary/25"
          : "bg-transparent text-foreground hover:bg-foreground/[0.03]"
      }`}
    >
      {/* active turn rail */}
      <span
        className={`absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full transition-all duration-300 ${
          active ? "bg-primary opacity-100" : "opacity-0"
        }`}
      />

      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <div
            className={`flex size-9 items-center justify-center rounded-full text-[11px] font-bold tracking-wide transition-colors ${
              active
                ? "bg-white/10 text-white"
                : "bg-foreground/[0.06] text-muted-foreground"
            }`}
          >
            {initials(player.name)}
          </div>
          <span
            title={player.seat}
            className={`absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 text-[8px] font-bold ${
              active ? "border-[#171512]" : "border-background"
            } ${isWhite ? "bg-white text-[#171512]" : "bg-[#171512] text-white"}`}
          >
            {isWhite ? "♙" : "♟"}
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold leading-none">
              {player.name}
            </span>
            {active && <Crown className="size-3 shrink-0 text-primary" />}
          </div>
          <div
            className={`mt-1 flex items-center gap-1.5 text-[11px] leading-none ${
              active ? "text-white/50" : "text-muted-foreground"
            }`}
          >
            <span className="font-mono tabular-nums">{player.rating}</span>
            <span className="opacity-50">·</span>
            <span>{thinking ? "thinking…" : player.seat}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {showActions && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label="Offer draw"
              title="Offer draw"
              className="rounded-lg p-1.5 text-current/60 transition hover:bg-white/10 hover:text-current"
              onClick={onOfferDraw}
            >
              <Handshake className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Resign"
              title="Resign"
              className="rounded-lg p-1.5 text-red-400/80 transition hover:bg-red-500/10 hover:text-red-400"
              onClick={onResign}
            >
              <Flag className="size-4" />
            </button>
          </div>
        )}
        <div
          className={`flex h-8 items-center gap-1.5 rounded-xl px-2.5 font-mono text-sm font-semibold tabular-nums transition-colors ${
          isCritical
            ? "bg-red-500/15 text-red-500"
            : isLow
              ? "bg-amber-500/15 text-amber-500"
              : active
                ? "bg-white/12 text-white"
                : "bg-foreground/[0.05] text-muted-foreground"
          }`}
        >
          <Timer className={`size-3.5 ${isCritical && active ? "animate-pulse" : ""}`} />
          {player.clock}
        </div>
      </div>
    </div>
  );
}