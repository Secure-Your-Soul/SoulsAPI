//! Souls SDK — runtime layer for Secure Your Soul OS programs.
//!
//! Replaces the C glibc with `c-gull` (libc ABI in pure Rust) and uses
//! `rusty_alloc` as the global allocator. Downstream programs link
//! against the SDK and get `std`, threads, and allocation without a
//! single line of C under the hood.

// Re-export the allocator so downstream users can reference it if needed.
pub use rusty_alloc::RustyAlloc;

// ─── GLOBAL ALLOCATOR ──────────────────────────────────────────
// rusty_alloc: no_std, performance, multithreaded, pure Rust, no C.
// c-gull's `malloc-via-rust-global-alloc` feature routes malloc here.
#[global_allocator]
static ALLOC: RustyAlloc = RustyAlloc;