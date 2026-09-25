![Stars](https://img.shields.io/github/stars/Secure-Your-Soul/SoulsAPI)
![Forks](https://img.shields.io/github/forks/Secure-Your-Soul/SoulsAPI)
![Issues](https://img.shields.io/github/issues/Secure-Your-Soul/SoulsAPI)
![Pull Requests](https://img.shields.io/github/issues-pr/Secure-Your-Soul/SoulsAPI)
![Last commit](https://img.shields.io/github/last-commit/Secure-Your-Soul/SoulsAPI)

[![Crates.io](https://img.shields.io/crates/v/soulsapi.svg)](https://crates.io/crates/soulsapi)
[![Downloads](https://img.shields.io/crates/d/soulsapi.svg)](https://crates.io/crates/soulsapi)
[![docs.rs](https://img.shields.io/docsrs/soulsapi)](https://docs.rs/soulsapi)

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
cargo add soulsapi --features full
```

**Option 2 – manually edit `Cargo.toml`:**
```toml
[dependencies]
# Full features (http, crypto)
soulsapi = { version = "0.1", features = ["full"] }

# Or pick specific features:
# soulsapi = { version = "0.1", features = ["http"] }
# soulsapi = { version = "0.1", features = ["http", "crypto"] }

# Or without any optional features:
# soulsapi = { version = "0.1" }
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
    │   ├── api/                 ← crate: soulsapi (facade)
    │   │    ├── Cargo.toml
    │   │    └── src/
    │   ├── crypto/              ← crate: soulsapi-crypto
    │   │   ├── Cargo.toml
    │   │   └── src/
    │   └── http/                ← crate: soulsapi-http
    │       ├── Cargo.toml
    │       └── src/
    ├── .gitignore
    ├── LICENSE.md
    └── README.md
```

**Step 3 – add the dependency to `Cargo.toml`:**

```toml
[dependencies]
soulsapi = { path = "./SoulsAPI/Rust/api", features = ["full"] }
```

## 🚀 Quick start

> **Note:** The `http` and `crypto` modules are only available when their
> respective features are enabled. Add `features = ["http", "crypto"]`,
> or `features = ["full"]` to enable all of them.

```rust
use soulsapi::{http, crypto};

fn main() {
    http::hi();
    crypto::hi();
}
```

## ✨ Available features

| Feature | What it enables |
|---|---|
| `http` | 🌐 HTTP helpers |
| `crypto` | 🔐 Cryptography utilities |
| `full` | All of the above |

## 📚 Documentation

- API reference: <https://docs.rs/soulsapi>
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