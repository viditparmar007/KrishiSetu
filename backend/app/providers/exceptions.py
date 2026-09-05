class ProviderError(Exception):
    """Base error for an external provider failure."""


class ProviderUnavailableError(ProviderError):
    """Raised when a provider cannot return a usable response."""


class ProviderConfigurationError(ProviderError):
    """Raised when required provider configuration is missing."""