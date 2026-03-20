# Palace Night

A cross-platform card game built with React Native. Play Palace against CPU opponents or online with friends.

## Features

- **Singleplayer** — Play against 3 CPU opponents with smart AI
- **Online Multiplayer** — Create or join lobbies, play with friends via Socket.io
- **Cross-Platform** — iOS, Android, and Web
- **Pure Game Engine** — Deterministic state machine shared between client and server

## Tech Stack

- **Client:** React Native + Expo
- **Server:** Node.js + Socket.io
- **Language:** TypeScript (strict mode throughout)
- **Engine:** Pure functional state machine — no framework dependencies

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Install & Run

```bash
npm install
npx expo start
```

Then press:

- `a` — open on Android
- `i` — open on iOS
- `w` — open in browser

### Running the Server (Multiplayer)

```bash
cd server
npm install
npm run dev
```

The server runs on port 3001.

## Testing

```bash
npm test                # run all tests
npm run test:watch      # watch mode
npm run test:coverage   # with coverage

# single file
npx jest __tests__/engine/deck.test.ts

# type check
node node_modules/typescript/bin/tsc --noEmit
```

## Project Structure

```
src/
  engine/     # Pure game engine — state machine, rules, AI
  types/      # All TypeScript types, enums, and interfaces
  ui/         # React Native components and hooks
server/       # Node.js + Socket.io multiplayer server
__tests__/    # Jest test suites and helpers
```

## Game Rules

Palace is a shedding card game — the goal is to get rid of all your cards.

- **Deck:** Double deck (108 cards: 2×52 + 4 Jokers), 4 players
- **Card phases:** Play from your hand first, then face-up cards, then face-down (blind)
- **Special cards:**
  - **10** — Blows up the pile (clears it)
  - **4-of-a-kind** — Blows up the pile
  - **Jump-ins** — Play a matching card out of turn

## Deployment

- **Client (Web):** Vercel (auto-deploys on push to main)
- **Client (Mobile):** Expo / EAS
- **Server:** Fly.io (auto-deploys on push to main)
