import type { PieceSetId, PieceSymbol } from "@/types/chess";

import wK from "@/assets/pieces/k.png";
import wQ from "@/assets/pieces/q.png";
import wR from "@/assets/pieces/r.png";
import wB from "@/assets/pieces/b.png";
import wN from "@/assets/pieces/n.png";
import wP from "@/assets/pieces/p.png";

import bK from "@/assets/pieces/k-b.png";
import bQ from "@/assets/pieces/q-b.png";
import bR from "@/assets/pieces/r-b.png";
import bB from "@/assets/pieces/b-b.png";
import bN from "@/assets/pieces/n-b.png";
import bP from "@/assets/pieces/p-b.png";

export const PIECE_IMAGES: Record<PieceSymbol, string> = {
  K: wK,
  Q: wQ,
  R: wR,
  B: wB,
  N: wN,
  P: wP,

  k: bK,
  q: bQ,
  r: bR,
  b: bB,
  n: bN,
  p: bP,
};

export const PIECE_GLYPHS: Record<Exclude<PieceSetId, "image">, Record<PieceSymbol, string>> = {
  minimal: {
    K: "K",
    Q: "Q",
    R: "R",
    B: "B",
    N: "N",
    P: "P",
    k: "k",
    q: "q",
    r: "r",
    b: "b",
    n: "n",
    p: "p",
  },
};