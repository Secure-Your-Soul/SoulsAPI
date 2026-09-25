![Stars](https://img.shields.io/github/stars/Secure-Your-Soul/SoulsAPI)
![Forks](https://img.shields.io/github/forks/Secure-Your-Soul/SoulsAPI)
![Issues](https://img.shields.io/github/issues/Secure-Your-Soul/SoulsAPI)
![Pull Requests](https://img.shields.io/github/issues-pr/Secure-Your-Soul/SoulsAPI)
![Last commit](https://img.shields.io/github/last-commit/Secure-Your-Soul/SoulsAPI)

[![Crates.io](https://img.shields.io/crates/v/souls.svg)](https://crates.io/crates/souls)
[![Downloads](https://img.shields.io/crates/d/souls.svg)](https://crates.io/crates/souls)
[![docs.rs](https://img.shields.io/docsrs/souls.svg)](https://docs.rs/souls)

# SoulsAPI
> 🦀 Rust API for integration with Secure Your Soul services.

## Table of Contents
- [Requirements](#-requirements)
- [Installation](#installation)
    - [Automatically (crates.io)](#automatically-from-cratesio)
    - [Manually (from repository)](#manually-from-repository)
- [Quickstart](#-quick-start)
- [Available features](#-available-features)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [Security](#-security)
- [License](#-license)

---

## 📋 Requirements

- 🦀 **Rust 1.98.1** (MSRV)
- 🦀 **Cargo 1.98.1**

## Installation

### Automatically (from [crates.io](https://crates.io))

**Option 1 – using `cargo add`:**
```sh
cargo add souls --features full
```

**Option 2 – manually edit `Cargo.toml`:**
```toml
[dependencies]
# Full features (http, crypt)
souls = { version = "0.1", features = ["full"] }

# Or pick specific features:
# souls = { version = "0.1", features = ["http"] }
# souls = { version = "0.1", features = ["http", "crypt"] }

# Or without any optional features:
# souls = { version = "0.1" }
```

### Manually (from repository)

**Step 1 – clone the repository:**

```sh
# Option A: clone directly inside your project (recommended)
cd your-project/
git clone https://github.com/Secure-Your-Soul/SoulsAPI.git
# → folder SoulsAPI/ is now inside your-project/

# Option B: clone elsewhere and move it
git clone https://github.com/Secure-Your-Soul/SoulsAPI.git /tmp/SoulsAPI
mv /tmp/SoulsAPI ./SoulsAPI
```

**Step 2 – verify the structure:**

After cloning, your project should look like:
```
your-project/
├── Cargo.toml
├── src/
└── SoulsAPI/                    ← cloned repository
    ├── Rust/
    │   ├── Cargo.toml           ← workspace root
    │   ├── souls/                 ← crate: souls (facade)
    │   │    ├── Cargo.toml
    │   │    └── src/
    │   ├── crypt/              ← crate: souls-crypt
    │   │   ├── Cargo.toml
    │   │   └── src/
    │   └── http/                ← crate: souls-http
    │       ├── Cargo.toml
    │       └── src/
    ├── .gitignore
    ├── LICENSE.md
    └── README.md
```

**Step 3 – add the dependency to `Cargo.toml`:**

```toml
[dependencies]
souls = { path = "./SoulsAPI/Rust/api", features = ["full"] }
```

## 🚀 Quick start

> **Note:** The `http` and `crypt` modules are only available when their
> respective features are enabled. Add `features = ["http", "crypt"]`,
> or `features = ["full"]` to enable all of them.

```rust
use souls::{http, crypt};

fn main() {
    http::hi();
    crypt::hi();
}
```

## ✨ Available features

| Feature | What it enables |
|---|---|
| `http` | 🌐 HTTP helpers |
| `crypt` | 🔐 Cryptography utilities |
| `full` | All of the above |

## 📚 Documentation

- API reference: <https://docs.rs/souls>
- Code of Conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- Credits: [CREDITS.md](./CREDITS.md)
- Changelog: [CHANGELOG.md](./CHANGELOG.md)

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## 🔒 Security

Please report vulnerabilities to **contact@securesouls.com**
(do **not** open public issues).

## 📄 License

Licensed under [LICENSE.md](./LICENSE.md).