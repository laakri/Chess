
export type PieceSymbol = "K" | "Q" | "R" | "B" | "N" | "P" | "k" | "q" | "r" | "b" | "n" | "p";

export type Square = PieceSymbol | "";

/** 8x8 board, row 0 = rank 8 (black's back rank), consistent with FEN order. */
export type BoardState = Square[][];

export interface Position {
  row: number;
  col: number;
}

export interface CastlingRights {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
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

export type MoveQuality = "best" | "good" | "inaccuracy" | "mistake" | "blunder";

export interface MoveFeedback {
  quality: MoveQuality;
  label: string;
  detail: string;
  bestMove: string;
  swing: number;
}

export type GameModeId = "classic" | "rapid" | "bot" | "two-v-two-bot" | "two-v-two-players" | "coop-preview";

export type BotLevelId = "beginner" | "casual" | "club" | "expert";
export type ChessSeat = "white" | "black";
export type TeamTurnId = "P1" | "P3" | "P2" | "P4";
export type GameModeCategory = "practice" | "ranked" | "team" | "social";

export interface GameModeConfig {
  id: GameModeId;
  name: string;
  seats: string[];
  teams: string[];
  playerCount: number;
  rated: boolean;
  timeControl: string;
  description: string;
  category: GameModeCategory;
  format: string;
  available: boolean;
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
  boardWidth: number;
  players: PlayerInfo[];
  /** Whose seat acts right now. Classic chess uses "white" and "black". */
  activeSeat: string;
  turnSlot: TeamTurnId;
  selectedSquare: Position | null;
  legalTargets: Position[];
  lastMove: { from: Position; to: Position } | null;
  moves: MoveRecord[];
  moveFeedback: MoveFeedback | null;
  castlingRights: CastlingRights;
  botLevel: BotLevelId;
  playerSeat: ChessSeat;
  botStarted: boolean;
  /** Short explanation of the last ignored click, e.g. "Not your turn". */
  hint: string | null;
  captured: {
    byYou: PieceSymbol[];
    byOpponent: PieceSymbol[];
  };
  status: "ongoing" | "checkmate" | "draw" | "resigned" | "timeout";
}
