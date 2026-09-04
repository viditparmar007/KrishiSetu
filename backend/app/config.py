from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()