# Contributing to Streamdown

Thank you for your interest in contributing to Streamdown! We welcome contributions from the community.

## Getting Started

### Prerequisites

- Node.js 20 or higher
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
4. Build all packages (required before running tests):
   ```bash
   pnpm build
   ```
5. Run the tests to ensure everything is working:
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

## Signing Commits

All commits in a pull request must have a [verified signature](https://docs.github.com/en/authentication/managing-commit-signature-verification). The **Verify Signed Commits** check fails and comments on your PR if any commit is unsigned.

### 1. Configure Git to sign commits

SSH signing is the simplest option if you already use an SSH key with GitHub (Git 2.34+):

```bash
# Generate a key if you don't have one
ssh-keygen -t ed25519 -C "you@example.com"

git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
```

Prefer GPG? See [Telling Git about your signing key](https://docs.github.com/en/authentication/managing-commit-signature-verification/telling-git-about-your-signing-key).

### 2. Add the key to GitHub

- Add the public key at [github.com/settings/ssh/new](https://github.com/settings/ssh/new) with **Key type: Signing Key**. A key added only as an authentication key will not verify commits (you can add the same key twice, once for each type).
- Make sure `git config user.email` matches a [verified email](https://github.com/settings/emails) on your GitHub account.

### 3. Re-sign existing commits on your branch

If your PR already has unsigned commits, re-sign them without changing their content and force-push:

```bash
git fetch https://github.com/vercel/streamdown.git main
git rebase --exec 'git commit --amend --no-edit --no-verify -S' $(git merge-base HEAD FETCH_HEAD)
git log --show-signature FETCH_HEAD..HEAD   # every commit should show a good signature
git push --force-with-lease
```

Commits created in the GitHub web UI are signed automatically.

### Using an AI coding agent?

The failure comment on your PR includes a ready-to-paste prompt. You can also give your agent this:

```text
My pull request to vercel/streamdown is blocked because some commits are not signed. Check my git signing config (gpg.format, user.signingkey, commit.gpgsign, user.email). If it isn't set up, configure SSH commit signing with an existing or new ed25519 key, then tell me to add the public key at https://github.com/settings/ssh/new as a "Signing Key" and wait for my confirmation. Then fetch main from https://github.com/vercel/streamdown.git and re-sign every commit on my branch with `git rebase --exec 'git commit --amend --no-edit --no-verify -S' $(git merge-base HEAD FETCH_HEAD)` without rebasing onto a newer main, squashing, or editing commits. Verify with `git log --show-signature FETCH_HEAD..HEAD`, and ask me before running `git push --force-with-lease`.
```

## Pull Request Process

1. Ensure your PR:
   - Has a clear, descriptive title
   - Includes a changeset (run `pnpm changeset` if you haven't)
   - Contains only [signed commits](#signing-commits)
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
