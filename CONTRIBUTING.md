# Contributing to Project Cleaner

First off, thank you for considering contributing to Project Cleaner! 🎉

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (screenshots, error messages, etc.)
- **Describe the behavior you observed and what you expected**
- **Include details about your environment** (OS, version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **Include mockups or examples if applicable**

### Pull Requests

1. Fork the repository
2. Create a new branch from `master`:
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. Make your changes:
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed
4. Test your changes:
   ```bash
   npm run dev
   npm run build:win  # or build:mac, build:linux
   ```
5. Commit your changes:
   ```bash
   git commit -m "Add some feature"
   ```
6. Push to your fork:
   ```bash
   git push origin feature/my-new-feature
   ```
7. Open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/ptools.git
cd ptools

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## Code Style

- Use **ES6+ features**
- Use **functional components** with hooks in React
- Follow **ESLint rules** configured in the project
- Use **meaningful variable names**
- Add **comments** for complex logic
- Keep **functions small and focused**

## Project Structure

```
src/
├── main/              # Electron main process
│   ├── ipc/          # IPC handlers
│   └── services/      # Business logic
├── preload/           # Preload scripts
└── renderer/          # React UI
    └── src/
        ├── components/
        ├── pages/
        └── routes/
```

## Adding New Framework Detection

To add support for a new framework/tool:

1. Update `src/main/services/scanner.service.js`
2. Add detection patterns in `JUNK_PATTERNS`
3. Add project type detection in `detectProjectTypes()`
4. Test with real project examples

## Commit Message Guidelines

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests when relevant

Examples:
```
Add Flutter cache detection
Fix node_modules deletion on Windows
Improve scan performance for large directories
Update README with new screenshots
```

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing! 🙌
