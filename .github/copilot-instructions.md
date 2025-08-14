# SpellStack Game Project Instructions

## Checklist Progress
- [x] Project requirements clarified
- [x] Project structure scaffolded
- [x] Core game engine implemented
- [x] Frontend components created
- [x] Socket.IO multiplayer implementation
- [x] PWA configuration
- [x] Testing setup
- [x] Documentation completed

## Development Status
✅ **MVP COMPLETED** - All core features implemented and working:

- **Core Game Engine**: Pure TypeScript engine with 33/33 tests passing
- **Singleplayer Mode**: Working AI opponents with difficulty levels
- **React Frontend**: Complete UI with card animations and responsive design
- **PWA Support**: Service worker and web app manifest configured
- **Socket.IO Multiplayer**: Real-time multiplayer with authoritative server
- **Development Server**: Running at http://localhost:3001
- **Build System**: pnpm workspaces with TypeScript compilation
- **Testing**: Vitest unit tests + Playwright E2E setup
- **CI/CD**: GitHub Actions workflow configured
This is a UNO-like web game with singleplayer and multiplayer functionality.

## Project Structure
- Monorepo with pnpm workspaces
- `/packages/engine` - Pure TypeScript game engine
- `/apps/web` - React frontend with Vite
- Socket.IO server for multiplayer
- PWA support for offline play

## Tech Stack
- Frontend: React + TypeScript + Vite + TailwindCSS + Framer Motion + Howler.js
- State: XState for game state, Zustand for UI state  
- Backend: Socket.IO server for real-time multiplayer
- Testing: Vitest + Playwright
- Package Manager: pnpm

## Development Setup
1. Install dependencies: `pnpm install`
2. Start development: `pnpm dev`
3. Run tests: `pnpm test`
4. Build: `pnpm build`

## Checklist Progress
- [x] Project requirements clarified
- [x] Project structure scaffolded
- [x] Core game engine implemented
- [x] Frontend components created
- [x] Socket.IO multiplayer implementation
- [x] PWA configuration
- [x] Testing setup
- [x] Documentation completed
