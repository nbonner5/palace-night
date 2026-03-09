# Palace Night - Card Game

## Build & Test Commands
- **Install**: `npm install`
- **Test all**: `npm test`
- **Test watch**: `npm run test:watch`
- **Test coverage**: `npm run test:coverage`
- **Run single test file**: `npx jest __tests__/engine/deck.test.ts`
- **Start dev**: `npx expo start`
- **TypeScript check**: `node node_modules/typescript/bin/tsc --noEmit`

## Architecture
- Game engine is a pure TypeScript state machine in `src/engine/`
- All game state is immutable and serializable
- `processAction(state, action) -> ActionResult` is the core reducer
- Tests in `__tests__/engine/` with helpers in `__tests__/helpers/`
- Types in `src/types/index.ts`

## Conventions
- Strict TypeScript with `noUncheckedIndexedAccess`
- Double deck (108 cards: 2x52 + 4 Jokers)
- 4-player game (1 human + 3 CPU for v1)
- Jest with `ts-jest` preset (node environment)
