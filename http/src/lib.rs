use axum::{extract::State, routing::get, Router};

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
// Methods you can use to change config default values
impl Config {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn company(mut self, company: impl Into<String>) -> Self {
        self.company = company.into();
        self
    }

    pub fn domain(mut self, domain: impl Into<String>) -> Self {
        self.domain = domain.into();
        self
    }
}

pub fn create_router(config: Config) -> Router {
    Router::new()
        .route("/", get(root))
        .with_state(config)
}

pub async fn root(State(config): State<Config>) -> String {
    format!("Hello Axum from {} ({})!", config.company, config.domain)
}