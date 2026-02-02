from src.util.env_config import PydanticBaseEnvConfig


class PdfGenerationConfig(PydanticBaseEnvConfig):
    """Configuration for PDF generation service."""

    # Frontend URL for calling application pages
    frontend_url: str

    # Docraptor configuration
    docraptor_api_key: str
    docraptor_test_mode: bool
    docraptor_api_url: str

    # Token expiration in minutes
    short_lived_token_expiration_minutes: int

    # Whether to use mock clients (for testing/development)
    pdf_generation_use_mocks: bool

    docraptor_enable_javascript: bool = False


def get_config() -> PdfGenerationConfig:
    """Get the PDF generation configuration."""
    return PdfGenerationConfig()
