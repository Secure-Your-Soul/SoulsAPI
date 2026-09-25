# Unverified
.PHONY: help login check test fmt lint update publish-dry publish publish-all tag clean

# Default target – show available commands
help:
	@echo "Available commands:"
	@echo ""
	@echo "  Setup:"
	@echo "    make login         - Login to crates.io (one-time)"
	@echo ""
	@echo "  Quality:"
	@echo "    make check         - cargo check all crates"
	@echo "    make test          - run all tests"
	@echo "    make fmt           - format code"
	@echo "    make lint          - run clippy"
	@echo "    make clean         - clean build artifacts"
	@echo ""
	@echo "  Dependencies:"
	@echo "    make update        - update dependencies (cargo update)"
	@echo "    make outdated      - check for outdated dependencies"
	@echo ""
	@echo "  Publishing:"
	@echo "    make publish-dry   - dry-run publish (no upload)"
	@echo "    make publish       - publish all crates to crates.io"
	@echo "    make tag           - create git tag from current version"
	@echo ""

# ---------- Setup ----------

# Login to crates.io (requires CARGO_TOKEN env or interactive prompt)
login:
	@if [ -z "$$CARGO_REGISTRY_TOKEN" ]; then \
		echo "==> No CARGO_REGISTRY_TOKEN env var found."; \
		echo "    Run: cargo login <YOUR_TOKEN>"; \
		echo "    Get token at: https://crates.io/settings/tokens"; \
	else \
		echo "==> Using CARGO_REGISTRY_TOKEN from environment"; \
	fi

# ---------- Quality ----------

# Verify all crates compile
check:
	@echo "==> cargo check"
	cargo check --workspace --all-features

# Run all tests
test:
	@echo "==> cargo test"
	cargo test --workspace --all-features

# Format code
fmt:
	@echo "==> cargo fmt"
	cargo fmt --all

# Lint with clippy
lint:
	@echo "==> cargo clippy"
	cargo clippy --workspace --all-features -- -D warnings

# Clean build artifacts
clean:
	@echo "==> cargo clean"
	cargo clean

# ---------- Dependencies ----------

# Update dependencies (respects semver constraints in Cargo.toml)
update:
	@echo "==> cargo update"
	cargo update

# Check for outdated dependencies (requires cargo-outdated)
outdated:
	@if ! command -v cargo-outdated >/dev/null 2>&1; then \
		echo "==> Installing cargo-outdated..."; \
		cargo install cargo-outdated; \
	fi
	@echo "==> cargo outdated"
	cargo outdated --workspace

# ---------- Publishing ----------

# Dry-run publish (no upload, but validates everything)
publish-dry:
	@echo "==> Publishing (DRY RUN): no upload"
	cargo publish --workspace --dry-run

# Publish all crates to crates.io in dependency order
# Rust 1.90+ supports --workspace flag
publish: check test
	@echo "==> Verifying git status is clean"
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "ERROR: git working directory is not clean."; \
		echo "       Commit or stash your changes first."; \
		git status --short; \
		exit 1; \
	fi
	@echo "==> Publishing all crates to crates.io"
	cargo publish --workspace

# Create git tag from version in workspace Cargo.toml
tag:
	@VERSION=$$(cargo metadata --no-deps --format-version 1 \
		| grep -o '"version":"[^"]*"' | head -1 | cut -d'"' -f4); \
	if [ -z "$$VERSION" ]; then \
		echo "ERROR: Could not detect version."; \
		exit 1; \
	fi; \
	echo "==> Creating git tag v$$VERSION"; \
	git tag -a "v$$VERSION" -m "Release v$$VERSION"; \
	echo "==> Push tag with:"; \
	echo "    git push origin v$$VERSION"