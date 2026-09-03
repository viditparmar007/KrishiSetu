from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    jwt_secret_key: str = "local-development-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    database_url: str = "sqlite:///./krishisetu.db"
    frontend_origin: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()