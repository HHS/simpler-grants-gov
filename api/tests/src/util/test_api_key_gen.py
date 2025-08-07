import string
from unittest.mock import patch

from src.util.api_key_gen import generate_api_key_id


class TestGenerateApiKeyId:
    def test_generate_api_key_id_default_length(self):
        """Test generate_api_key_id returns 25 character string by default."""
        key_id = generate_api_key_id()
        assert len(key_id) == 25

    def test_generate_api_key_id_custom_length(self):
        """Test generate_api_key_id with custom length."""
        key_id = generate_api_key_id(length=10)
        assert len(key_id) == 10

    def test_generate_api_key_id_contains_valid_characters(self):
        """Test generate_api_key_id only contains alphanumeric characters."""
        key_id = generate_api_key_id()
        allowed_chars = string.ascii_letters + string.digits
        assert all(c in allowed_chars for c in key_id)

    def test_generate_api_key_id_contains_mixed_case_and_numbers(self):
        """Test generate_api_key_id can contain uppercase, lowercase, and numbers."""
        key_ids = [generate_api_key_id(length=100) for _ in range(10)]
        combined = "".join(key_ids)

        has_uppercase = any(c.isupper() for c in combined)
        has_lowercase = any(c.islower() for c in combined)
        has_digit = any(c.isdigit() for c in combined)

        assert has_uppercase, "Should contain uppercase letters"
        assert has_lowercase, "Should contain lowercase letters"
        assert has_digit, "Should contain digits"

    def test_generate_api_key_id_is_random(self):
        """Test generate_api_key_id generates different values on each call."""
        key_id1 = generate_api_key_id()
        key_id2 = generate_api_key_id()
        assert key_id1 != key_id2

    def test_generate_api_key_id_zero_length(self):
        """Test generate_api_key_id with zero length returns empty string."""
        key_id = generate_api_key_id(length=0)
        assert key_id == ""

    def test_generate_api_key_id_large_length(self):
        """Test generate_api_key_id with large length."""
        key_id = generate_api_key_id(length=1000)
        assert len(key_id) == 1000

    @patch("src.util.api_key_gen.secrets.choice")
    def test_generate_api_key_id_uses_secrets(self, mock_choice):
        """Test generate_api_key_id uses secrets module for cryptographic randomness."""
        mock_choice.return_value = "A"

        key_id = generate_api_key_id(length=5)

        assert key_id == "AAAAA"
        assert mock_choice.call_count == 5

    def test_generate_api_key_id_character_distribution(self):
        """Test that generated keys contain all character types with reasonable distribution."""
        sample_size = 1000
        key_id = generate_api_key_id(length=sample_size)

        uppercase_count = sum(1 for c in key_id if c.isupper())
        lowercase_count = sum(1 for c in key_id if c.islower())
        digit_count = sum(1 for c in key_id if c.isdigit())

        assert uppercase_count > 0, "Should contain uppercase letters"
        assert lowercase_count > 0, "Should contain lowercase letters"
        assert digit_count > 0, "Should contain digits"

        min_expected = sample_size * 0.1
        assert uppercase_count >= min_expected, f"Uppercase count {uppercase_count} too low"
        assert lowercase_count >= min_expected, f"Lowercase count {lowercase_count} too low"
        assert digit_count >= min_expected, f"Digit count {digit_count} too low"

    def test_generate_api_key_id_no_special_characters(self):
        """Test that generated keys contain no special characters."""
        key_id = generate_api_key_id(length=100)

        special_chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?"
        assert not any(c in special_chars for c in key_id)

        assert " " not in key_id
