
export type PieceSymbol = "K" | "Q" | "R" | "B" | "N" | "P" | "k" | "q" | "r" | "b" | "n" | "p";

export type Square = PieceSymbol | "";

/** 8x8 board, row 0 = rank 8 (black's back rank), consistent with FEN order. */
export type BoardState = Square[][];

export interface Position {
  row: number;
  col: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  rating: number;
  seat: string;
  team: string;
  /** Clock display string, e.g. "04:12". Server-owned once sockets exist. */
  clock: string;
  isYou?: boolean;
}

export interface MoveRecord {
  white: string;
  black?: string;
}

export type GameModeId = "classic" | "rapid" | "coop-preview";

export interface GameModeConfig {
  id: GameModeId;
  name: string;
  seats: string[];
  teams: string[];
  playerCount: number;
  rated: boolean;
  timeControl: string;
  description: string;
}

export type BoardThemeId = "walnut" | "tournament" | "midnight" | "graphite";
export type PieceSetId = "minimal" | "image";
export type BoardSizeId = "comfortable" | "large" | "huge";

export interface GameSettings {
  boardTheme: BoardThemeId;
  pieceSet: PieceSetId;
  boardSize: BoardSizeId;
  showCoordinates: boolean;
  showLegalMoves: boolean;
  showCaptured: boolean;
  showMoveList: boolean;
  showModePanel: boolean;
  sound: boolean;
  confirmResign: boolean;
  autoQueen: boolean;
  arrowDurationMs: number;
}

export interface GameState {
  modeId: GameModeId;
  board: BoardState;
  players: PlayerInfo[];
  /** Whose seat acts right now. Classic chess uses "white" and "black". */
  activeSeat: string;
  selectedSquare: Position | null;
  legalTargets: Position[];
  lastMove: { from: Position; to: Position } | null;
  moves: MoveRecord[];
  captured: {
    byYou: PieceSymbol[];
    byOpponent: PieceSymbol[];
  };
  status: "ongoing" | "checkmate" | "draw" | "resigned" | "timeout";
}
