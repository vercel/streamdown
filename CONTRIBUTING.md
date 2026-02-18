# Contributing to Streamdown

Thank you for your interest in contributing to Streamdown! We welcome contributions from the community.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- pnpm (version specified in package.json `packageManager` field)

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/streamdown.git
   cd streamdown
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Run the tests to ensure everything is working:
   ```bash
   pnpm test
   ```

## Development Workflow

### Project Structure

This is a monorepo managed with Turbo. The main package is located at:

- `packages/streamdown/` - The core Streamdown React component library

### Available Scripts

- `pnpm dev` - Start development mode
- `pnpm build` - Build all packages
- `pnpm test` - Run tests
- `pnpm test:coverage` - Run tests with coverage
- `pnpm test:ui` - Run tests with UI
- `pnpm check` - Check linting and formatting
- `pnpm fix` - Fix linting and formatting
- `pnpm check-types` - Type checking

### Making Changes

1. Create a new branch for your feature or fix:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and ensure:
   - All tests pass (`pnpm test`)
   - Code is properly formatted (`pnpm format`)
   - Type checking passes (`pnpm check-types`)
   - Linting passes (`pnpm lint`)

3. Write or update tests for your changes

4. Create a changeset for your changes:
   ```bash
   pnpm changeset
   ```

   - Select the package(s) affected
   - Choose the appropriate version bump (patch/minor/major)
   - Write a concise description of the changes

## Commit Guidelines

We follow conventional commits for clear commit history:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc)
- `refactor:` Code changes that neither fix bugs nor add features
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:

```
feat: add support for custom code block themes
fix: resolve markdown parsing issue with nested lists
docs: update README with new API examples
```

## Pull Request Process

1. Ensure your PR:
   - Has a clear, descriptive title
   - Includes a changeset (run `pnpm changeset` if you haven't)
   - Passes all CI checks
   - Includes tests for new functionality
   - Updates documentation if needed

2. PR Description should include:
   - What changes were made
   - Why these changes were necessary
   - Any breaking changes
   - Screenshots/demos for UI changes

3. Link any related issues using keywords like `Fixes #123` or `Closes #456`

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui

# Run tests in watch mode (in package directory)
cd packages/streamdown
pnpm vitest
```

### Writing Tests

- Tests are located in `packages/streamdown/__tests__/`
- Use descriptive test names
- Test both success and error cases
- Ensure good coverage for new features

## Release Process

Releases are automated through GitHub Actions and changesets:

1. When PRs with changesets are merged to `main`, a "Version Packages" PR is automatically created
2. This PR updates package versions and changelogs
3. When the Version Packages PR is merged, packages are automatically published to npm

## Code Style

- We use TypeScript for type safety
- Follow the existing code style in the project
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Getting Help

- Open an issue for bugs or feature requests
- Join discussions in GitHub Discussions
- Check existing issues before creating new ones

## License

By contributing to Streamdown, you agree that your contributions will be licensed under the Apache-2.0 License.
