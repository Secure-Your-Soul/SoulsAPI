# Contributing to SoulsAPI

First off, thank you for considering contributing to SoulsAPI! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [License](#license)

## Code of Conduct

This project adheres to the [Contributor Covenant](./CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before opening an issue, please check if it's already reported.

When reporting a bug, include:
- Steps to reproduce
- Expected vs actual behavior
- Rust version (`rustc --version`)
- OS and version

### Suggesting Features

Open an issue with the `enhancement` label. Describe:
- What problem the feature solves
- Proposed solution
- Alternatives you've considered

## Development Setup

\`\`\`sh
git clone https://github.com/Secure-Your-Soul/SoulsAPI.git
cd SoulsAPI/Rust
cargo build
cargo test
\`\`\`

## Pull Request Process

1. Fork the repo and create a branch from `stable`
2. Make your changes, add tests if applicable
3. Ensure `cargo test` and `cargo clippy` pass
4. Submit a PR with a clear description
5. Wait for review

## Style Guidelines

### Commit Messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation
- `chore:` — maintenance

### Rust

- Follow [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- Run `cargo fmt` before committing
- Run `cargo clippy` and fix warnings
- Write tests for new functionality
- Use `///` doc comments for public items

## License

By contributing, you agree that your contributions will be licensed
under the [Apache License 2.0](./LICENSE.md).