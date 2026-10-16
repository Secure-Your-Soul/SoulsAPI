#![allow(clippy::multiple_crate_versions)]
use axum::{Router, extract::State, routing::get};

#[derive(Clone, Debug)]
pub struct Config {
    pub company: String,
    pub domain: String,
}
impl Default for Config {
    fn default() -> Self {
        Self {
            company: "Secure Your Soul".to_string(),
            domain: "securesouls.com".to_string(),
        }
    }
}
impl Config {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    #[must_use]
    pub fn company(mut self, company: impl Into<String>) -> Self {
        self.company = company.into();
        self
    }

    #[must_use]
    pub fn domain(mut self, domain: impl Into<String>) -> Self {
        self.domain = domain.into();
        self
    }
}

pub fn create_router(config: Config) -> Router {
    Router::new().route("/", get(root)).with_state(config)
}

pub async fn root(State(config): State<Config>) -> String {
    format!("Hello Axum from {} ({})!", config.company, config.domain)
}
