import type { GameModeConfig, GameModeId } from "@/types/chess";

export const GAME_MODES: Record<GameModeId, GameModeConfig> = {
  classic: {
    id: "classic",
    name: "Classic Chess",
    seats: ["white", "black"],
    teams: ["white", "black"],
    playerCount: 2,
    rated: true,
    timeControl: "10+0",
    description: "Standard 1v1 chess with a clean server-ready state model.",
  },
  rapid: {
    id: "rapid",
    name: "Rapid Ladder",
    seats: ["white", "black"],
    teams: ["white", "black"],
    playerCount: 2,
    rated: true,
    timeControl: "15+10",
    description: "A slower rated mode profile that can get its own queue and leaderboard.",
  },
  "coop-preview": {
    id: "coop-preview",
    name: "Co-op Preview",
    seats: ["white-lead", "white-partner", "black-lead", "black-partner"],
    teams: ["white", "black"],
    playerCount: 4,
    rated: false,
    timeControl: "shared",
    description: "A future-ready shell for team chess without changing the room UI contract.",
  },
};

export const modeList = Object.values(GAME_MODES);
