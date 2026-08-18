# ♟️ Chess Website — Project Plan

## Guiding principle

Everything is built around **one core idea**: the "game" (rules engine) and the
"delivery" (sockets, matchmaking, UI) are two separate layers that only talk
through a small, fixed interface. If that boundary is respected from Phase 1,
adding a second game (2v2 co-op) later means writing a new engine module —
**not** touching networking, anti-cheat, or the rating system at all.

```
┌─────────────────────────────┐
│        Client (UI)          │
└───────────────┬─────────────┘
                │  socket events (generic: "move", "state", "result")
┌───────────────▼─────────────┐
│   Game Server / Room Layer   │  ← sockets, matchmaking, anti-cheat, points
│   (game-agnostic)            │
└───────────────┬─────────────┘
                │  GameEngine interface
┌───────────────▼─────────────┐
│   Game Engine(s)             │  ← pure logic, no networking knowledge
│   - ChessEngine (Phase 1)    │
│   - Chess2v2Engine (later)   │
└──────────────────────────────┘
```

---

## Phase 1 — Core Chess Mechanism (offline / local first)

Goal: a **pure, framework-agnostic chess engine** you can unit test without a
server or a browser.

### 1.1 Board representation
- 8x8 board state (array or bitboards — start with array of 64 for simplicity/readability, optimize later if needed).
- Piece model: type, color, position, "has moved" flag (needed for castling).
- FEN import/export (industry-standard notation) — makes debugging, testing, and later replay/analysis features trivial.

### 1.2 Move generation & validation
- Legal move generation per piece type.
- Check / checkmate / stalemate detection.
- Special rules:
  - Castling (kingside/queenside, with all legality conditions).
  - En passant.
  - Pawn promotion.
  - Draw conditions: 50-move rule, threefold repetition, insufficient material.
- Move history log (SAN or a custom serializable format) — required later for replay, spectating, and anti-cheat verification.

### 1.3 Engine interface (the contract that makes this scalable)
Define a generic interface **now**, even though only chess implements it:

```
GameEngine {
  createInitialState()
  getLegalMoves(state, playerId)
  applyMove(state, move) -> newState | error
  getStatus(state) -> "ongoing" | "checkmate" | "draw" | "resigned" | ...
  serialize(state) / deserialize(state)
}
```

Every future game mode (including 2v2 co-op) implements this same interface.
The server layer never needs to know "this is chess" — it just calls
`engine.applyMove()`.

### 1.4 Deliverable for Phase 1
- Standalone engine package (e.g. `packages/chess-engine`), fully unit tested.
- A local CLI or simple single-page board (no networking) to manually test moves.

---

## Phase 2 — Multiplayer: Sockets, Anti-Cheat, Points

Goal: two people can play a real game over the network, and the server is the
**single source of truth** — clients cannot cheat because they never decide
the outcome of a move.

### 2.1 Server-authoritative architecture
- Client sends **intent**, not state: `{ from, to, promotion? }`.
- Server runs the move through the *same* `GameEngine.applyMove()` from Phase 1.
- Server broadcasts the resulting authoritative state back to both players.
- Client never trusts its own local board as the source of truth — it just renders what the server confirms. This alone eliminates most naive cheating (illegal moves, moving opponent's pieces, moving out of turn).

### 2.2 Socket protocol (keep it game-agnostic)
Example event names — deliberately generic so they work for chess *and* future games:

| Event | Direction | Payload |
|---|---|---|
| `room:join` | client→server | `{ roomId }` |
| `room:state` | server→client | full current game state |
| `move:submit` | client→server | `{ move }` |
| `move:rejected` | server→client | `{ reason }` |
| `game:update` | server→client | new state + last move |
| `game:over` | server→client | `{ result, reason }` |
| `chat:message` | both | `{ text }` |

### 2.3 Anti-cheat measures
- **Server-side validation only** — never trust client-reported legality.
- **Timing control on the server**: server owns each player's clock; client-side timers are cosmetic only. Prevents clock manipulation.
- **Move rate-limiting**: reject implausible move timing (e.g. sub-millisecond "instant perfect moves" patterns over many games) — flag for review, not necessarily auto-ban.
- **Reconnection handling**: state lives on server, so disconnect/reconnect can't be used to stall or manipulate a game.
- **No client-exposed engine internals that reveal opponent's hidden info** (not relevant for standard chess since it's perfect information, but this matters a lot once you add hidden-info modes later — worth designing for now).
- **Optional, for later hardening**: server-side engine-assist detection (statistical move-quality analysis vs. known engine lines) — flag, don't auto-accuse. This is a v2+ feature, not needed for launch.

### 2.4 Point / rating system
- Use **Elo** to start (simple, well understood, easy to implement) — can migrate to **Glicko-2** later if you want confidence intervals / faster convergence for new players.
- Rating stored per player, per game mode (important: chess 1v1 rating ≠ future 2v2 rating — separate leaderboards from day one).
- Rating update triggered server-side only, on `game:over`, based on the authoritative result.

### 2.5 Deliverable for Phase 2
- Real-time 1v1 chess playable between two browser clients.
- Persistent accounts + Elo rating + match history.
- Basic matchmaking (queue → pair by rating proximity).

---

## Phase 3 — Designed-in extensibility (so 2v2 co-op is easy later)

You don't build this mode now, but Phase 1–2 architecture should already support it. Concretely:

- **Room layer is engine-agnostic**: a "room" just holds `{ engineType, engineState, players[] }`. Adding `engineType: "chess2v2"` means writing a new engine, not touching rooms/sockets/rating plumbing.
- **Player slots are abstracted**: don't hardcode `whitePlayer` / `blackPlayer` — use a generic `players: [{ id, seat, team }]` so 4-player team modes fit the same room model.
- **Rating system is per-mode**: already namespaced in 2.4, so a new mode just adds a new leaderboard key.
- **Engine interface has no assumptions about player count** — `getLegalMoves(state, playerId)` scales from 2 to 4 players without changes to the contract.

---

## Suggested tech stack (adjust to your comfort level)

| Layer | Suggestion |
|---|---|
| Engine | TypeScript, framework-free, pure functions (easiest to unit test + reuse) |
| Server | Node.js + Socket.IO (or raw WebSockets if you want more control) |
| Client | React (or vanilla JS if you want to keep it light) |
| DB | PostgreSQL (accounts, ratings, match history) + Redis (active room state, matchmaking queue) |
| Auth | Simple JWT-based sessions to start |

---

## Suggested build order (practical checklist)

1. [ ] Chess engine core (board, moves, check/mate) — no UI, no server.
2. [ ] Unit tests for engine (this pays off massively once sockets are involved).
3. [ ] Minimal local board UI to sanity-check the engine visually.
4. [ ] Define `GameEngine` interface formally; refactor engine to implement it.
5. [ ] Socket server: rooms, join/leave, server-authoritative move relay.
6. [ ] Wire client to socket server; play a real 2-player game.
7. [ ] Accounts + Elo rating + match history persistence.
8. [ ] Matchmaking queue.
9. [ ] Anti-cheat hardening pass (timing, rate limits, reconnection).
10. [ ] (Later) Second `GameEngine` implementation for 2v2 co-op mode.

---

*Next step: pick a stack and start on Phase 1.1 (board representation) — happy to scaffold the actual engine code whenever you're ready.*