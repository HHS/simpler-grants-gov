"""
Unit tests for enhanced GitHub GraphQL client security.
"""

import pytest
from unittest.mock import Mock, patch
import requests

from analytics.integrations.github.client import GitHubGraphqlClient, GraphqlError


class TestGitHubGraphqlClientSecurity:
    """Test cases for secure GitHub GraphQL client."""
    
    def setup_method(self):
        """Set up test fixtures."""
        with patch('analytics.integrations.github.client.get_db_settings') as mock_settings:
            mock_settings.return_value.github_token = "test-token"
            self.client = GitHubGraphqlClient()
    
    def test_valid_query_execution(self):
        """Test that valid queries still work normally."""
        query = "query { viewer { login } }"
        variables = {"limit": 10}
        
        mock_response = Mock()
        mock_response.json.return_value = {"data": {"viewer": {"login": "testuser"}}}
        mock_response.raise_for_status.return_value = None
        
        with patch('requests.post', return_value=mock_response) as mock_post:
            result = self.client.execute_query(query, variables)
            
            assert result == {"data": {"viewer": {"login": "testuser"}}}
            mock_post.assert_called_once()
    
    def test_non_string_query_rejection(self):
        """Test rejection of non-string queries."""
        with pytest.raises(ValueError, match="Query must be a string"):
            self.client.execute_query(123, {})
    
    def test_oversized_query_rejection(self):
        """Test rejection of extremely long queries."""
        long_query = "query { " + "field " * 20000 + "}"  # Very long query
        
        with pytest.raises(ValueError, match="exceeds maximum length"):
            self.client.execute_query(long_query, {})
    
    def test_dangerous_query_pattern_rejection(self):
        """Test rejection of queries with dangerous patterns."""
        dangerous_queries = [
            "query { user } UNION SELECT * FROM users",
            "query { user } <script>alert('xss')</script>",
            "query { user } javascript:void(0)",
            "query { user } vbscript:msgbox('test')"
        ]
        
        for dangerous_query in dangerous_queries:
            with pytest.raises(ValueError, match="dangerous patterns"):
                self.client.execute_query(dangerous_query, {})
    
    def test_non_dict_variables_rejection(self):
        """Test rejection of non-dictionary variables."""
        query = "query { viewer { login } }"
        
        with pytest.raises(ValueError, match="Variables must be a dictionary"):
            self.client.execute_query(query, "not a dict")
    
    def test_deeply_nested_variables_rejection(self):
        """Test rejection of deeply nested variable structures."""
        query = "query { viewer { login } }"
        
        # Create deeply nested variables
        nested_vars = {"level1": {"level2": {"level3": {}}}}
        for i in range(12):  # Exceed depth limit
            nested_vars = {"deeper": nested_vars}
        
        with pytest.raises(ValueError, match="Variables validation failed"):
            self.client.execute_query(query, nested_vars)
    
    def test_excessive_variables_rejection(self):
        """Test rejection of variables with too many keys."""
        query = "query { viewer { login } }"
        excessive_vars = {f"var{i}": f"value{i}" for i in range(101)}  # Exceed key limit
        
        with pytest.raises(ValueError, match="Variables validation failed"):
            self.client.execute_query(query, excessive_vars)
    
    def test_oversized_variable_values_rejection(self):
        """Test rejection of oversized variable values."""
        query = "query { viewer { login } }"
        oversized_value = "x" * 1001  # Exceed value length limit
        variables = {"param": oversized_value}
        
        with pytest.raises(ValueError, match="exceeds maximum length"):
            self.client.execute_query(query, variables)
    
    def test_unsupported_variable_types_rejection(self):
        """Test rejection of unsupported variable types."""
        query = "query { viewer { login } }"
        variables = {"param": {"complex": "object"}}  # Complex object not allowed
        
        with pytest.raises(ValueError, match="unsupported type"):
            self.client.execute_query(query, variables)
    
    def test_valid_variable_types_accepted(self):
        """Test that valid variable types are accepted."""
        query = "query { viewer { login } }"
        variables = {
            "string_var": "test",
            "int_var": 42,
            "float_var": 3.14,
            "bool_var": True
        }
        
        mock_response = Mock()
        mock_response.json.return_value = {"data": {"viewer": {"login": "testuser"}}}
        mock_response.raise_for_status.return_value = None
        
        with patch('requests.post', return_value=mock_response):
            # Should not raise any validation errors
            result = self.client.execute_query(query, variables)
            assert "data" in result
    
    def test_string_variable_sanitization(self):
        """Test that string variables are properly sanitized."""
        query = "query { viewer { login } }"
        variables = {"param": "test\x00with\x01control\x02chars"}
        
        mock_response = Mock()
        mock_response.json.return_value = {"data": {"viewer": {"login": "testuser"}}}
        mock_response.raise_for_status.return_value = None
        
        with patch('requests.post', return_value=mock_response) as mock_post:
            self.client.execute_query(query, variables)
            
            # Check that the posted data has sanitized variables
            call_args = mock_post.call_args[1]['json']
            sanitized_param = call_args['variables']['param']
            assert '\x00' not in sanitized_param
            assert '\x01' not in sanitized_param
            assert '\x02' not in sanitized_param
    
    def test_graphql_error_handling_preserved(self):
        """Test that GraphQL error handling is preserved."""
        query = "query { viewer { login } }"
        variables = {}
        
        mock_response = Mock()
        mock_response.json.return_value = {
            "errors": [{"message": "Authentication required"}]
        }
        mock_response.raise_for_status.return_value = None
        
        with patch('requests.post', return_value=mock_response):
            with pytest.raises(GraphqlError):
                self.client.execute_query(query, variables)
    
    def test_http_error_handling_preserved(self):
        """Test that HTTP error handling is preserved."""
        query = "query { viewer { login } }"
        variables = {}
        
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("500 Server Error")
        
        with patch('requests.post', return_value=mock_response):
            with pytest.raises(requests.exceptions.HTTPError):
                self.client.execute_query(query, variables)
    
    def test_query_sanitization_preserves_functionality(self):
        """Test that query sanitization doesn't break valid GraphQL."""
        # Test with a complex but valid GraphQL query
        complex_query = """
        query GetRepositoryData($owner: String!, $name: String!) {
            repository(owner: $owner, name: $name) {
                name
                description
                issues(first: 10, states: OPEN) {
                    nodes {
                        title
                        createdAt
                        author {
                            login
                        }
                    }
                }
            }
        }
        """
        variables = {"owner": "test-org", "name": "test-repo"}
        
        mock_response = Mock()
        mock_response.json.return_value = {"data": {"repository": {"name": "test-repo"}}}
        mock_response.raise_for_status.return_value = None
        
        with patch('requests.post', return_value=mock_response) as mock_post:
            result = self.client.execute_query(complex_query, variables)
            
            # Should successfully process the query
            assert result == {"data": {"repository": {"name": "test-repo"}}}
            mock_post.assert_called_once()
            
            # Verify the query structure is preserved
            call_args = mock_post.call_args[1]['json']
            assert 'repository' in call_args['query']
            assert 'issues' in call_args['query']