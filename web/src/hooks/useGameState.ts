import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  BoardState,
  GameModeId,
  GameState,
  PieceSymbol,
  Position,
  Square,
} from "@/types/chess";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

/* ✅ REAL CHESS START POSITION */
const INITIAL_BOARD: BoardState = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];

function cloneBoard(board: BoardState): BoardState {
  return board.map((r) => [...r]);
}

function inBounds(p: Position) {
  return p.row >= 0 && p.row < 8 && p.col >= 0 && p.col < 8;
}

function isWhite(piece: Square) {
  return !!piece && piece === piece.toUpperCase();
}

function pieceSeat(piece: Square) {
  if (!piece) return "";
  return isWhite(piece) ? "white" : "black";
}

function samePosition(a: Position | null, b: Position) {
  return !!a && a.row === b.row && a.col === b.col;
}

function findKingPosition(board: BoardState, seat: string): Position | null {
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const piece = board[row][col];
      if (piece === (seat === "white" ? "K" : "k")) {
        return { row, col };
      }
    }
  }

  return null;
}

export function isPlayerInCheck(board: BoardState, seat: string) {
  const king = findKingPosition(board, seat);
  if (!king) {
    return false;
  }

  return isSquareAttacked(board, king, seat === "white" ? "black" : "white");
}

function isSquareAttacked(board: BoardState, target: Position, bySeat: string) {
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const piece = board[row][col];
      if (!piece || pieceSeat(piece) !== bySeat) {
        continue;
      }

      const from = { row, col };
      const attacks = getPseudoLegalMoves(board, from);
      if (attacks.some((move) => samePosition(move, target))) {
        return true;
      }
    }
  }

  return false;
}

function getLegalMovesForPiece(board: BoardState, from: Position) {
  const piece = board[from.row][from.col];
  if (!piece) {
    return [];
  }

  const seat = pieceSeat(piece);
  const pseudoMoves = getPseudoLegalMoves(board, from);

  return pseudoMoves.filter((to) => {
    const nextBoard = cloneBoard(board);
    const moving = nextBoard[from.row][from.col] as PieceSymbol;
    nextBoard[from.row][from.col] = "";
    nextBoard[to.row][to.col] = moving;
    return !isPlayerInCheck(nextBoard, seat);
  });
}

function parseClockSeconds(clock: string): number {
  const parts = String(clock).split(":").map(Number);
  if (parts.some((part) => Number.isNaN(part))) {
    return 0;
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return parts[0] * 60 + (parts[1] ?? 0);
}

function formatClockFromSeconds(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function notation(
  from: Position,
  to: Position,
  piece: PieceSymbol,
  captured: boolean
) {
  const prefix = piece.toUpperCase() === "P" ? "" : piece.toUpperCase();
  const cap = captured ? "x" : "";
  return `${prefix}${FILES[from.col]}${8 - from.row}${cap}${
    FILES[to.col]
  }${8 - to.row}`;
}

/* ---------------- MOVES ---------------- */

function rayMoves(
  board: BoardState,
  from: Position,
  seat: string,
  dirs: Position[]
) {
  const res: Position[] = [];

  for (const d of dirs) {
    let n = { row: from.row + d.row, col: from.col + d.col };

    while (inBounds(n)) {
      const t = board[n.row][n.col];

      if (!t) {
        res.push(n);
      } else {
        if (pieceSeat(t) !== seat) res.push(n);
        break;
      }

      n = { row: n.row + d.row, col: n.col + d.col };
    }
  }

  return res;
}

function getPseudoLegalMoves(board: BoardState, from: Position) {
  const piece = board[from.row][from.col];
  if (!piece) return [];

  const seat = pieceSeat(piece);
  const type = piece.toLowerCase();

  if (type === "n") {
    const jumps = [
      [-2, -1], [-2, 1],
      [-1, -2], [-1, 2],
      [1, -2], [1, 2],
      [2, -1], [2, 1],
    ];

    return jumps
      .map(([r, c]) => ({ row: from.row + r, col: from.col + c }))
      .filter(
        (p) => inBounds(p) && pieceSeat(board[p.row][p.col]) !== seat
      );
  }

  if (type === "b") {
    return rayMoves(board, from, seat, [
      { row: -1, col: -1 },
      { row: -1, col: 1 },
      { row: 1, col: -1 },
      { row: 1, col: 1 },
    ]);
  }

  if (type === "r") {
    return rayMoves(board, from, seat, [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
    ]);
  }

  if (type === "q") {
    return rayMoves(board, from, seat, [
      { row: -1, col: -1 },
      { row: -1, col: 1 },
      { row: 1, col: -1 },
      { row: 1, col: 1 },
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
    ]);
  }

  if (type === "k") {
    const steps = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1],
    ];

    return steps
      .map(([r, c]) => ({ row: from.row + r, col: from.col + c }))
      .filter(
        (p) => inBounds(p) && pieceSeat(board[p.row][p.col]) !== seat
      );
  }

  /* pawn */
  const dir = seat === "white" ? -1 : 1;
  const start = seat === "white" ? 6 : 1;

  const moves: Position[] = [];

  const one = { row: from.row + dir, col: from.col };
  const two = { row: from.row + dir * 2, col: from.col };

  if (inBounds(one) && !board[one.row][one.col]) moves.push(one);

  if (
    from.row === start &&
    !board[one.row][one.col] &&
    !board[two.row][two.col]
  ) {
    moves.push(two);
  }

  for (const c of [from.col - 1, from.col + 1]) {
    const cap = { row: from.row + dir, col: c };

    if (
      inBounds(cap) &&
      board[cap.row][cap.col] &&
      pieceSeat(board[cap.row][cap.col]) !== seat
    ) {
      moves.push(cap);
    }
  }

  return moves;
}

/* ---------------- APPLY MOVE ---------------- */

function getAllLegalMovesForSeat(board: BoardState, seat: string) {
  const moves: Position[] = [];

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const piece = board[row][col];
      if (!piece || pieceSeat(piece) !== seat) {
        continue;
      }

      const from = { row, col };
      const legal = getLegalMovesForPiece(board, from);
      moves.push(...legal);
    }
  }

  return moves;
}

function applyMove(state: GameState, from: Position, to: Position): GameState {
  const board = cloneBoard(state.board);

  const moving = board[from.row][from.col] as PieceSymbol;
  const captured = board[to.row][to.col] as PieceSymbol | "";

  board[to.row][to.col] = moving;
  board[from.row][from.col] = "";

  const moveText = notation(from, to, moving, !!captured);

  const moves = [...state.moves];

  if (state.activeSeat === "white") {
    moves.push({ white: moveText });
  } else {
    const last = moves[moves.length - 1];
    if (last && !last.black) {
      moves[moves.length - 1] = { ...last, black: moveText };
    } else {
      moves.push({ white: "...", black: moveText });
    }
  }

  const nextSeat = state.activeSeat === "white" ? "black" : "white";
  const kingCaptured = !!captured && captured.toLowerCase() === "k";
  const isOpponentInCheck = isPlayerInCheck(board, nextSeat);
  const hasOpponentLegalMoves = getAllLegalMovesForSeat(board, nextSeat).length > 0;
  const opponentIsCheckmated = isOpponentInCheck && !hasOpponentLegalMoves;
  const isStalemate = !isOpponentInCheck && !hasOpponentLegalMoves;

  return {
    ...state,
    board,
    activeSeat: kingCaptured ? state.activeSeat : nextSeat,
    selectedSquare: null,
    legalTargets: [],
    lastMove: { from, to },
    moves,
    captured: captured
      ? {
          byYou: isWhite(captured)
            ? state.captured.byYou
            : [...state.captured.byYou, captured],
          byOpponent: isWhite(captured)
            ? [...state.captured.byOpponent, captured]
            : state.captured.byOpponent,
        }
      : state.captured,
    status: kingCaptured || opponentIsCheckmated ? "checkmate" : isStalemate ? "draw" : state.status,
  };
}

/* ---------------- CLEAN STATE FACTORY ---------------- */

function createInitialState(): GameState {
  return {
    modeId: "classic",
    board: cloneBoard(INITIAL_BOARD),

    players: [
      {
        id: "opponent",
        name: "M. Novak",
        rating: 1340,
        clock: "10:00",
        seat: "black",
        team: "black",
      },
      {
        id: "you",
        name: "You",
        rating: 1204,
        clock: "10:00",
        seat: "white",
        team: "white",
        isYou: true,
      },
    ],

    activeSeat: "white",

    selectedSquare: null,
    legalTargets: [],

    lastMove: null,

    moves: [],

    captured: {
      byYou: [],
      byOpponent: [],
    },

    status: "ongoing",
  };
}

/* ---------------- HOOK ---------------- */

export function useGameState() {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [, setHistory] = useState<GameState[]>([]);

  useEffect(() => {
    if (state.status !== "ongoing") {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setState((prev) => {
        if (prev.status !== "ongoing") {
          return prev;
        }

        const activeIndex = prev.players.findIndex(
          (player) => player.seat === prev.activeSeat
        );

        if (activeIndex === -1) {
          return prev;
        }

        const activePlayer = prev.players[activeIndex];
        const nextSeconds = Math.max(0, parseClockSeconds(activePlayer.clock) - 1);

        if (nextSeconds <= 0) {
          const winnerSeat = prev.activeSeat === "white" ? "black" : "white";

          return {
            ...prev,
            players: prev.players.map((player, index) =>
              index === activeIndex
                ? { ...player, clock: "0:00" }
                : player
            ),
            activeSeat: winnerSeat,
            status: "timeout",
          };
        }

        return {
          ...prev,
          players: prev.players.map((player, index) =>
            index === activeIndex
              ? { ...player, clock: formatClockFromSeconds(nextSeconds) }
              : player
          ),
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.status, state.activeSeat]);

  useEffect(() => {
    if (state.status !== "ongoing") {
      return;
    }

    const activeKing = findKingPosition(state.board, state.activeSeat);
    if (!activeKing) {
      return;
    }

    const inCheck = isPlayerInCheck(state.board, state.activeSeat);
    const legalMoves = getAllLegalMovesForSeat(state.board, state.activeSeat);

    if (inCheck && legalMoves.length === 0) {
      setState((prev) => {
        if (prev.status !== "ongoing") {
          return prev;
        }

        return {
          ...prev,
          activeSeat: prev.activeSeat === "white" ? "black" : "white",
          status: "checkmate",
        };
      });
      return;
    }

    if (!inCheck && legalMoves.length === 0) {
      setState((prev) => {
        if (prev.status !== "ongoing") {
          return prev;
        }

        return {
          ...prev,
          status: "draw",
        };
      });
    }
  }, [state.board, state.activeSeat, state.status]);

  const selectSquare = useCallback((pos: Position) => {
    setState((prev) => {
      if (prev.status !== "ongoing") {
        return prev;
      }

      const piece = prev.board[pos.row][pos.col];
      const selected = prev.selectedSquare;

      const selectedPiece = selected
        ? prev.board[selected.row][selected.col]
        : "";

      const canMove = prev.legalTargets.some((t) =>
        samePosition(t, pos)
      );

      if (selected && selectedPiece && canMove) {
        setHistory((previous) => [...previous, prev]);
        return applyMove(prev, selected, pos);
      }

      if (piece && pieceSeat(piece) === prev.activeSeat) {
        // Real chess rule: if you're in check, you may move any piece
        // as long as the resulting position removes the check.
        const legalMoves = getLegalMovesForPiece(prev.board, pos);

        return {
          ...prev,
          selectedSquare: pos,
          legalTargets: legalMoves,
        };
      }

      return { ...prev, selectedSquare: null, legalTargets: [] };
    });
  }, []);

  const setMode = useCallback((modeId: GameModeId) => {
    setState((prev) => ({ ...prev, modeId }));
  }, []);

  const resign = useCallback(() => {
    setState((prev) => {
      const winnerSeat = prev.activeSeat === "white" ? "black" : "white";
      return {
        ...prev,
        activeSeat: winnerSeat,
        status: "resigned",
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setHistory([]);
    setState(createInitialState());
  }, []);

  const undoMove = useCallback(() => {
    setHistory((previous) => {
      const last = previous[previous.length - 1];
      if (!last) {
        return previous;
      }

      setState(last);
      return previous.slice(0, -1);
    });
  }, []);

  const activePlayer = useMemo(
    () =>
      state.players.find((p) => p.seat === state.activeSeat) ??
      state.players[0],
    [state.activeSeat, state.players]
  );

  return {
    state,
    activePlayer,
    selectSquare,
    setMode,
    resign,
    resetGame,
    undoMove,
  };
}