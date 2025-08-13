# Contributing to UNO Game

Thank you for your interest in contributing to the UNO Game project! This guide will help you get started.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (preferred) or npm
- Git

### Setup Development Environment

1. **Fork & Clone**
   ```bash
   git clone https://github.com/yourusername/UNO.git
   cd UNO
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Start Development Server**
   ```bash
   pnpm dev
   ```

4. **Run Tests**
   ```bash
   pnpm test
   ```

## 📁 Project Structure

- `packages/engine/` - Pure TypeScript game engine (core logic)
- `apps/web/` - React frontend application
- `packages/server/` - Socket.IO multiplayer server

## 🛠 Development Workflow

### Making Changes

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow existing code style and patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   # Run unit tests
   pnpm test
   
   # Run type checking
   pnpm type-check
   
   # Run linting
   pnpm lint
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

### Commit Message Convention

We follow [Conventional Commits](https://conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Pull Request Process

1. **Push Your Branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Use a descriptive title
   - Explain what changes you made and why
   - Link any related issues
   - Add screenshots if UI changes are involved

3. **Review Process**
   - Code will be reviewed by maintainers
   - Address any requested changes
   - Once approved, your PR will be merged

## 🧪 Testing Guidelines

### Unit Tests
- Located in `packages/engine/src/__tests__/`
- Run with `pnpm test`
- Write tests for all new engine functionality

### E2E Tests
- Located in `apps/web/tests/`
- Run with `pnpm test:e2e`
- Write tests for new user interactions

### Test Coverage
- Aim for >90% coverage on engine code
- Test edge cases and error conditions
- Mock external dependencies appropriately

## 📝 Code Style

### TypeScript
- Use strict mode
- Define proper types, avoid `any`
- Use meaningful variable names
- Add JSDoc comments for public APIs

### React
- Use functional components with hooks
- Follow React best practices
- Use TypeScript for prop types
- Keep components focused and reusable

### CSS
- Use TailwindCSS classes
- Follow mobile-first responsive design
- Use semantic class names for custom CSS

## 🎯 Areas for Contribution

### High Priority
- [ ] Multiplayer room implementation
- [ ] Real-time game synchronization
- [ ] Mobile UI improvements
- [ ] Sound effects and audio

### Medium Priority
- [ ] Advanced AI algorithms
- [ ] Game statistics and history
- [ ] Internationalization (i18n)
- [ ] Accessibility improvements

### Low Priority
- [ ] Themes and customization
- [ ] Tournament mode
- [ ] Chat functionality
- [ ] Spectator mode

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description** - Clear description of the issue
2. **Steps to Reproduce** - Exact steps to reproduce the bug
3. **Expected Behavior** - What you expected to happen
4. **Actual Behavior** - What actually happened
5. **Environment** - Browser, OS, device info
6. **Screenshots** - If applicable

## 💡 Feature Requests

For new features:

1. **Check existing issues** - Avoid duplicates
2. **Describe the use case** - Why is this needed?
3. **Provide examples** - How should it work?
4. **Consider alternatives** - Are there other approaches?

## 📞 Getting Help

- **Issues** - For bugs and feature requests
- **Discussions** - For questions and ideas
- **Discord** - Real-time chat (link TBD)

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Special thanks for major features

Thank you for contributing to UNO Game! 🎉
