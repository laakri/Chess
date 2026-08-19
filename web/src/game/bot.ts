import type {
  BoardState,
  BotLevelId,
  CastlingRights,
  MoveFeedback,
  MoveQuality,
  PieceSymbol,
  Position,
} from "@/types/chess";
import {
  applyMoveToBoard,
  getAllLegalMoves,
  isPlayerInCheck,
  opposingSeat,
  pieceSeat,
  toNotation,
  updateCastlingRights,
  type Move,
} from "./engine";

export interface BotLevelConfig {
  id: BotLevelId;
  name: string;
  description: string;
  /** Plies searched ahead. 0 means "play a random legal move". */
  depth: number;
  /** Probability of ignoring the search result and playing a random legal move. */
  blunderChance: number;
  /** Minimum time spent before answering, so the bot never feels instant. */
  minThinkMs: number;
}

export const BOT_LEVELS: Record<BotLevelId, BotLevelConfig> = {
  beginner: {
    id: "beginner",
    name: "Beginner",
    description: "Plays random legal moves. Good for learning how pieces move.",
    depth: 0,
    blunderChance: 1,
    minThinkMs: 350,
  },
  casual: {
    id: "casual",
    name: "Casual",
    description: "Grabs free material but never looks past its own move.",
    depth: 1,
    blunderChance: 0.2,
    minThinkMs: 400,
  },
  club: {
    id: "club",
    name: "Club",
    description: "Searches two plies, so it sees simple recaptures and threats.",
    depth: 2,
    blunderChance: 0.05,
    minThinkMs: 450,
  },
  expert: {
    id: "expert",
    name: "Expert",
    description: "Searches three plies with alpha-beta pruning and move ordering.",
    depth: 3,
    blunderChance: 0,
    minThinkMs: 500,
  },
};

export const botLevelList = Object.values(BOT_LEVELS);

const ANALYSIS_DEPTH = 2;

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

/** Piece-square tables from white's point of view, row 0 = rank 8. */
const PAWN_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_TABLE = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_TABLE = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const ROOK_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
];

const QUEEN_TABLE = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

const KING_TABLE = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 20, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

const PIECE_TABLES: Record<string, number[][]> = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  r: ROOK_TABLE,
  q: QUEEN_TABLE,
  k: KING_TABLE,
};

const CHECKMATE_SCORE = 1_000_000;

function positionalScore(piece: PieceSymbol, row: number, col: number) {
  const table = PIECE_TABLES[piece.toLowerCase()];
  if (!table) {
    return 0;
  }

  return pieceSeat(piece) === "white" ? table[row][col] : table[7 - row][col];
}

/** Static evaluation in centipawns, positive when `seat` is better off. */
export function evaluateBoard(board: BoardState, seat: string) {
  let score = 0;

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const piece = board[row][col];
      if (!piece) {
        continue;
      }

      const value = PIECE_VALUES[piece.toLowerCase()] + positionalScore(piece, row, col);
      score += pieceSeat(piece) === seat ? value : -value;
    }
  }

  return score;
}

function captureValue(board: BoardState, move: Move) {
  const target = board[move.to.row][move.to.col];
  return target ? PIECE_VALUES[target.toLowerCase()] : 0;
}

/** Try winning captures first so alpha-beta prunes far more branches. */
function orderMoves(board: BoardState, moves: Move[]) {
  return [...moves].sort((a, b) => captureValue(board, b) - captureValue(board, a));
}

function searchMoveScore(board: BoardState, move: Move, seat: string, rights: CastlingRights) {
  const next = applyMoveToBoard(board, move.from, move.to);
  const nextRights = updateCastlingRights(rights, board, move.from, move.to);
  return -negamax(next, opposingSeat(seat), ANALYSIS_DEPTH, -Infinity, Infinity, nextRights);
}

function qualityForSwing(swing: number): MoveQuality {
  if (swing <= 20) return "best";
  if (swing <= 80) return "good";
  if (swing <= 180) return "inaccuracy";
  if (swing <= 400) return "mistake";
  return "blunder";
}

const QUALITY_LABELS: Record<MoveQuality, string> = {
  best: "Best move",
  good: "Good move",
  inaccuracy: "Inaccuracy",
  mistake: "Mistake",
  blunder: "Blunder",
};

export function analyzePlayerMove(
  board: BoardState,
  from: Position,
  to: Position,
  seat: string,
  rights: CastlingRights
): MoveFeedback {
  const legalMoves = getAllLegalMoves(board, seat, rights);
  const scoredMoves = legalMoves.map((move) => ({
    move,
    score: searchMoveScore(board, move, seat, rights),
  }));
  const best = scoredMoves.reduce((current, candidate) =>
    candidate.score > current.score ? candidate : current
  );
  const played = scoredMoves.find(
    ({ move }) =>
      move.from.row === from.row &&
      move.from.col === from.col &&
      move.to.row === to.row &&
      move.to.col === to.col
  ) ?? best;
  const swing = Math.max(0, best.score - played.score);
  const quality = qualityForSwing(swing);
  const bestMove = toNotation(
    best.move.from,
    best.move.to,
    board[best.move.from.row][best.move.from.col] as PieceSymbol,
    !!board[best.move.to.row][best.move.to.col]
  );

  return {
    quality,
    label: QUALITY_LABELS[quality],
    detail:
      quality === "best"
        ? "You found the strongest move in this position."
        : quality === "good"
          ? "This keeps the position under control."
          : `A stronger move was ${bestMove}.`,
    bestMove,
    swing,
  };
}

function negamax(
  board: BoardState,
  seat: string,
  depth: number,
  alpha: number,
  beta: number,
  rights: CastlingRights
): number {
  const moves = getAllLegalMoves(board, seat, rights);

  if (moves.length === 0) {
    if (isPlayerInCheck(board, seat)) {
      return -CHECKMATE_SCORE - depth;
    }

    return 0;
  }

  if (depth === 0) {
    return evaluateBoard(board, seat);
  }

  let best = -Infinity;
  let currentAlpha = alpha;

  for (const move of orderMoves(board, moves)) {
    const next = applyMoveToBoard(board, move.from, move.to);
    const nextRights = updateCastlingRights(rights, board, move.from, move.to);
    const score = -negamax(next, opposingSeat(seat), depth - 1, -beta, -currentAlpha, nextRights);

    if (score > best) {
      best = score;
    }

    if (best > currentAlpha) {
      currentAlpha = best;
    }

    if (currentAlpha >= beta) {
      break;
    }
  }

  return best;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Chooses the bot's reply, or null when it has no legal move left. */
export function chooseBotMove(
  board: BoardState,
  seat: string,
  level: BotLevelId,
  rights: CastlingRights
): Move | null {
  const config = BOT_LEVELS[level];
  const moves = getAllLegalMoves(board, seat, rights);

  if (moves.length === 0) {
    return null;
  }

  if (config.depth === 0 || Math.random() < config.blunderChance) {
    return pickRandom(moves);
  }

  let bestScore = -Infinity;
  let bestMoves: Move[] = [];

  for (const move of orderMoves(board, moves)) {
    const next = applyMoveToBoard(board, move.from, move.to);
    const nextRights = updateCastlingRights(rights, board, move.from, move.to);
    const score = -negamax(next, opposingSeat(seat), config.depth - 1, -Infinity, Infinity, nextRights);

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return pickRandom(bestMoves);
}
