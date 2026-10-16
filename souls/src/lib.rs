#![allow(clippy::multiple_crate_versions)]
#[cfg(feature = "crypt")]
pub use souls_crypt as crypt;
#[cfg(feature = "http")]
pub use souls_http as http;
