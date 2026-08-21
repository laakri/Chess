import { Button } from "@/components/ui/button";
import { Bot, Gamepad2, LogIn, Settings, Shield, Timer, UsersRound } from "lucide-react";
import { modeList } from "@/game/modes";
import type { GameModeId } from "@/types/chess";
import { useState } from "react";
import whitelogo from "@/assets/logo-white.png";

interface AppRailProps {
  onSettingsClick: () => void;
  activeMode: GameModeId;
  onModeChange: (modeId: GameModeId) => void;
}

const modeIcons: Record<GameModeId, React.ReactNode> = {
  bot: <Bot className="size-5" />,
  "two-v-two-bot": <UsersRound className="size-5" />,
  classic: <Gamepad2 className="size-5" />,
  rapid: <Timer className="size-5" />,
  "two-v-two-players": <UsersRound className="size-5" />,
  "coop-preview": <Shield className="size-5" />,
};

export function AppRail({ onSettingsClick, activeMode, onModeChange }: AppRailProps) {
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <aside className="group/rail z-20 flex h-screen w-14 shrink-0 flex-col bg-[#171512] text-white transition-[width] duration-300 ease-out hover:w-56">
      <div className="flex h-full flex-col gap-2 px-2 py-3">
        <div className="flex h-10 items-center gap-3 px-1">
          <span className="flex shrink-0 items-center justify-center  ">
            {/* Logo */}
            <div className=" flex justify-center">
              <img src={whitelogo} className="h-7 block " />
            </div>
          </span>
          <span className="truncate text-sm font-semibold opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100">
            Kech Malek
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          {modeList.filter((mode) => mode.available).map((mode) => (
            <RailAction
              key={mode.id}
              icon={modeIcons[mode.id]}
              label={mode.name}
              active={activeMode === mode.id}
              onClick={() => onModeChange(mode.id)}
            />
          ))}
          <div className="mt-3 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100">
            Coming soon
          </div>
          {modeList.filter((mode) => !mode.available).map((mode) => (
            <RailAction
              key={mode.id}
              icon={modeIcons[mode.id]}
              label={mode.name}
              disabled
            />
          ))}
        </div>

        <div className="mt-2">
          <button
            type="button"
            className="flex h-10 w-full items-center gap-3 rounded-2xl px-2 text-left text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            onClick={() => setJoinOpen((open) => !open)}
          >
            <LogIn className="size-5 shrink-0" />
            <span className="truncate opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100">
              Join by code
            </span>
          </button>
          {joinOpen && (
            <div className="mt-2 hidden px-1 group-hover/rail:block">
              <input
                placeholder="Game code"
                className="h-9 w-full rounded-2xl bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/40 focus:bg-white/15"
              />
            </div>
          )}
        </div>

        <div className="mt-auto">
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-full justify-start gap-3 rounded-2xl px-2 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={onSettingsClick}
          >
            <Settings className="size-5 shrink-0" />
            <span className="truncate opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100">
              Settings
            </span>
          </Button>
        </div>
      </div>
    </aside>
  );
}

function RailAction({
  icon,
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`flex h-10 w-full items-center gap-3 rounded-2xl px-2 text-left text-sm transition ${
        disabled
          ? "cursor-not-allowed text-white/25"
          : active
            ? "bg-white/15 text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
      title={label}
      onClick={onClick}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100">
        {label}
      </span>
    </button>
  );
}
