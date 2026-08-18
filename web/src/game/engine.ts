import type { BoardState, PieceSymbol, Position, Square } from "@/types/chess";

export interface Move {
  from: Position;
  to: Position;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

/** Real chess start position, row 0 = rank 8 (FEN order). */
export const INITIAL_BOARD: BoardState = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];

export function cloneBoard(board: BoardState): BoardState {
  return board.map((row) => [...row]);
}

export function inBounds(position: Position) {
  return position.row >= 0 && position.row < 8 && position.col >= 0 && position.col < 8;
}

export function isWhite(piece: Square) {
  return !!piece && piece === piece.toUpperCase();
}

export function pieceSeat(piece: Square) {
  if (!piece) return "";
  return isWhite(piece) ? "white" : "black";
}

export function opposingSeat(seat: string) {
  return seat === "white" ? "black" : "white";
}

export function samePosition(a: Position | null, b: Position) {
  return !!a && a.row === b.row && a.col === b.col;
}

export function findKingPosition(board: BoardState, seat: string): Position | null {
  const king = seat === "white" ? "K" : "k";

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      if (board[row][col] === king) {
        return { row, col };
      }
    }
  }

  return null;
}

function rayMoves(board: BoardState, from: Position, seat: string, directions: Position[]) {
  const moves: Position[] = [];

  for (const direction of directions) {
    let next = { row: from.row + direction.row, col: from.col + direction.col };

    while (inBounds(next)) {
      const target = board[next.row][next.col];

      if (!target) {
        moves.push(next);
      } else {
        if (pieceSeat(target) !== seat) moves.push(next);
        break;
      }

      next = { row: next.row + direction.row, col: next.col + direction.col };
    }
  }

  return moves;
}

const KNIGHT_JUMPS = [
  [-2, -1], [-2, 1],
  [-1, -2], [-1, 2],
  [1, -2], [1, 2],
  [2, -1], [2, 1],
];

const KING_STEPS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

const BISHOP_DIRECTIONS = [
  { row: -1, col: -1 },
  { row: -1, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 1 },
];

const ROOK_DIRECTIONS = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

export function pawnDirection(seat: string) {
  return seat === "white" ? -1 : 1;
}

/** Squares a pawn threatens — diagonals only, unlike its forward pushes. */
export function getPawnAttackSquares(from: Position, seat: string) {
  const direction = pawnDirection(seat);

  return [
    { row: from.row + direction, col: from.col - 1 },
    { row: from.row + direction, col: from.col + 1 },
  ].filter(inBounds);
}

export function getPseudoLegalMoves(board: BoardState, from: Position): Position[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];

  const seat = pieceSeat(piece);
  const type = piece.toLowerCase();

  if (type === "n") {
    return KNIGHT_JUMPS.map(([row, col]) => ({ row: from.row + row, col: from.col + col })).filter(
      (position) => inBounds(position) && pieceSeat(board[position.row][position.col]) !== seat
    );
  }

  if (type === "b") return rayMoves(board, from, seat, BISHOP_DIRECTIONS);
  if (type === "r") return rayMoves(board, from, seat, ROOK_DIRECTIONS);
  if (type === "q") return rayMoves(board, from, seat, [...BISHOP_DIRECTIONS, ...ROOK_DIRECTIONS]);

  if (type === "k") {
    return KING_STEPS.map(([row, col]) => ({ row: from.row + row, col: from.col + col })).filter(
      (position) => inBounds(position) && pieceSeat(board[position.row][position.col]) !== seat
    );
  }

  const direction = pawnDirection(seat);
  const startRow = seat === "white" ? 6 : 1;
  const moves: Position[] = [];

  const one = { row: from.row + direction, col: from.col };
  const two = { row: from.row + direction * 2, col: from.col };

  if (inBounds(one) && !board[one.row][one.col]) {
    moves.push(one);

    if (from.row === startRow && inBounds(two) && !board[two.row][two.col]) {
      moves.push(two);
    }
  }

  for (const capture of getPawnAttackSquares(from, seat)) {
    const target = board[capture.row][capture.col];
    if (target && pieceSeat(target) !== seat) {
      moves.push(capture);
    }
  }

  return moves;
}

export function isSquareAttacked(board: BoardState, target: Position, bySeat: string) {
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const piece = board[row][col];
      if (!piece || pieceSeat(piece) !== bySeat) {
        continue;
      }

      const from = { row, col };
      const attacks =
        piece.toLowerCase() === "p"
          ? getPawnAttackSquares(from, bySeat)
          : getPseudoLegalMoves(board, from);

      if (attacks.some((attack) => samePosition(attack, target))) {
        return true;
      }
    }
  }

  return false;
}

export function isPlayerInCheck(board: BoardState, seat: string) {
  const king = findKingPosition(board, seat);
  if (!king) {
    return false;
  }

  return isSquareAttacked(board, king, opposingSeat(seat));
}

export function applyMoveToBoard(board: BoardState, from: Position, to: Position): BoardState {
  const next = cloneBoard(board);
  next[to.row][to.col] = next[from.row][from.col];
  next[from.row][from.col] = "";
  return next;
}

export function getLegalMovesForPiece(board: BoardState, from: Position): Position[] {
  const piece = board[from.row][from.col];
  if (!piece) {
    return [];
  }

  const seat = pieceSeat(piece);

  return getPseudoLegalMoves(board, from).filter(
    (to) => !isPlayerInCheck(applyMoveToBoard(board, from, to), seat)
  );
}

export function getAllLegalMoves(board: BoardState, seat: string): Move[] {
  const moves: Move[] = [];

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const piece = board[row][col];
      if (!piece || pieceSeat(piece) !== seat) {
        continue;
      }

      const from = { row, col };
      for (const to of getLegalMovesForPiece(board, from)) {
        moves.push({ from, to });
      }
    }
  }

  return moves;
}

export function toNotation(from: Position, to: Position, piece: PieceSymbol, captured: boolean) {
  const prefix = piece.toUpperCase() === "P" ? "" : piece.toUpperCase();
  const capture = captured ? "x" : "";
  return `${prefix}${FILES[from.col]}${8 - from.row}${capture}${FILES[to.col]}${8 - to.row}`;
}
