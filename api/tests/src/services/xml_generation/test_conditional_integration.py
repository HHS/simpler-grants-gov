"""Integration tests for conditional transformations in XML generation."""

from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService


class TestConditionalTransformationIntegration:
    """Test conditional transformations end-to-end through XML generation service."""

    def test_revision_application_conditional_fields(self):
        """Test that revision-specific fields are included when application_type is Revision."""
        service = XMLGenerationService()

        application_data = {
            "application_type": "Revision",
            "revision_type": "A: Increase Award",
            "federal_award_identifier": "12345-ABC",
            "organization_name": "Test University",
            "project_title": "Research Project",
        }

        request = XMLGenerationRequest(form_name="SF424_4_0", application_data=application_data)

        response = service.generate_xml(request)

        assert response.success is True
        assert response.xml_data is not None

        # Check that conditional fields are included
        assert "<RevisionType>A: Increase Award</RevisionType>" in response.xml_data
        assert "<FederalAwardIdentifier>12345-ABC</FederalAwardIdentifier>" in response.xml_data
        assert "<ApplicationType>Revision</ApplicationType>" in response.xml_data

    def test_new_application_excludes_revision_fields(self):
        """Test that revision-specific fields are excluded when application_type is New."""
        service = XMLGenerationService()

        application_data = {
            "application_type": "New",
            "revision_type": "A: Increase Award",  # Should be ignored
            "federal_award_identifier": "12345-ABC",  # Should be ignored
            "organization_name": "Test University",
            "project_title": "Research Project",
        }

        request = XMLGenerationRequest(form_name="SF424_4_0", application_data=application_data)

        response = service.generate_xml(request)

        assert response.success is True
        assert response.xml_data is not None

        # Check that conditional fields are excluded
        assert "<RevisionType>" not in response.xml_data
        assert "<FederalAwardIdentifier>" not in response.xml_data
        assert "<ApplicationType>New</ApplicationType>" in response.xml_data

    def test_continuation_application_includes_award_id(self):
        """Test that federal_award_identifier is included for Continuation applications."""
        service = XMLGenerationService()

        application_data = {
            "application_type": "Continuation",
            "federal_award_identifier": "67890-DEF",
            "organization_name": "Test University",
            "project_title": "Research Project",
        }

        request = XMLGenerationRequest(form_name="SF424_4_0", application_data=application_data)

        response = service.generate_xml(request)

        assert response.success is True
        assert response.xml_data is not None

        # Check that federal award identifier is included for continuation
        assert "<FederalAwardIdentifier>67890-DEF</FederalAwardIdentifier>" in response.xml_data
        assert "<ApplicationType>Continuation</ApplicationType>" in response.xml_data
        # Revision type should not be included for continuation
        assert "<RevisionType>" not in response.xml_data

    def test_debt_explanation_conditional_on_delinquent_debt(self):
        """Test that debt_explanation is included only when delinquent_federal_debt is true."""
        service = XMLGenerationService()

        application_data = {
            "application_type": "New",
            "delinquent_federal_debt": True,
            "debt_explanation": "Payment plan has been established",
            "organization_name": "Test University",
        }

        request = XMLGenerationRequest(form_name="SF424_4_0", application_data=application_data)

        response = service.generate_xml(request)

        assert response.success is True
        assert response.xml_data is not None

        # Check that debt explanation is included when debt is true
        assert (
            "<DebtExplanation>Payment plan has been established</DebtExplanation>"
            in response.xml_data
        )
        assert "<DelinquentFederalDebt>Y: Yes</DelinquentFederalDebt>" in response.xml_data

    def test_debt_explanation_excluded_when_no_debt(self):
        """Test that debt_explanation is excluded when delinquent_federal_debt is false."""
        service = XMLGenerationService()

        application_data = {
            "application_type": "New",
            "delinquent_federal_debt": False,
            "debt_explanation": "This should be ignored",
            "organization_name": "Test University",
        }

        request = XMLGenerationRequest(form_name="SF424_4_0", application_data=application_data)

        response = service.generate_xml(request)

        assert response.success is True
        assert response.xml_data is not None

        # Check that debt explanation is excluded when debt is false
        assert "<DebtExplanation>" not in response.xml_data
        assert "<DelinquentFederalDebt>N: No</DelinquentFederalDebt>" in response.xml_data

    def test_state_review_date_conditional_on_review_option(self):
        """Test that state_review_available_date is included only for specific state review option."""
        service = XMLGenerationService()

        application_data = {
            "application_type": "New",
            "state_review": "a. This application was made available to the state under the Executive Order 12372 Process for review on",
            "state_review_available_date": "2024-01-15",
            "organization_name": "Test University",
        }

        request = XMLGenerationRequest(form_name="SF424_4_0", application_data=application_data)

        response = service.generate_xml(request)

        assert response.success is True
        assert response.xml_data is not None

        # Check that state review date is included for option A
        assert (
            "<StateReviewAvailableDate>2024-01-15</StateReviewAvailableDate>" in response.xml_data
        )

    def test_computed_total_funding_calculation(self):
        """Test that computed total funding field calculates sum of all funding sources."""
        service = XMLGenerationService()

        application_data = {
            "application_type": "New",
            "federal_estimated_funding": "100000.00",
            "applicant_estimated_funding": "25000.00",
            "state_estimated_funding": "15000.00",
            "local_estimated_funding": "10000.00",
            "other_estimated_funding": "5000.00",
            "program_income_estimated_funding": "2500.00",
            "organization_name": "Test University",
        }

        request = XMLGenerationRequest(form_name="SF424_4_0", application_data=application_data)

        response = service.generate_xml(request)

        assert response.success is True
        assert response.xml_data is not None

        # Check that computed total is calculated correctly (157,500.00)
        assert (
            "<TotalEstimatedFundingComputed>157500.00</TotalEstimatedFundingComputed>"
            in response.xml_data
        )

        # Also check that individual funding amounts are formatted correctly
        assert "<FederalEstimatedFunding>100000.00</FederalEstimatedFunding>" in response.xml_data
        assert (
            "<ApplicantEstimatedFunding>25000.00</ApplicantEstimatedFunding>" in response.xml_data
        )

    def test_computed_funding_with_missing_values(self):
        """Test that computed funding handles missing values gracefully."""
        service = XMLGenerationService()

        application_data = {
            "application_type": "New",
            "federal_estimated_funding": "100000.00",
            "applicant_estimated_funding": "25000.00",
            # Missing state, local, other, and program income funding
            "organization_name": "Test University",
        }

        request = XMLGenerationRequest(form_name="SF424_4_0", application_data=application_data)

        response = service.generate_xml(request)

        assert response.success is True
        assert response.xml_data is not None

        # Check that computed total only includes available values (125,000.00)
        assert (
            "<TotalEstimatedFundingComputed>125000.00</TotalEstimatedFundingComputed>"
            in response.xml_data
        )

    def test_multiple_conditional_rules_together(self):
        """Test that multiple conditional rules work together correctly."""
        service = XMLGenerationService()

        application_data = {
            "application_type": "Revision",
            "revision_type": "B: Decrease Award",
            "federal_award_identifier": "ABC-123",
            "delinquent_federal_debt": True,
            "debt_explanation": "Dispute resolved",
            "state_review": "a. This application was made available to the state under the Executive Order 12372 Process for review on",
            "state_review_available_date": "2024-02-01",
            "federal_estimated_funding": "75000.00",
            "applicant_estimated_funding": "15000.00",
            "organization_name": "Test University",
        }

        request = XMLGenerationRequest(form_name="SF424_4_0", application_data=application_data)

        response = service.generate_xml(request)

        assert response.success is True
        assert response.xml_data is not None

        # Check that all conditional fields are handled correctly
        assert "<ApplicationType>Revision</ApplicationType>" in response.xml_data
        assert "<RevisionType>B: Decrease Award</RevisionType>" in response.xml_data
        assert "<FederalAwardIdentifier>ABC-123</FederalAwardIdentifier>" in response.xml_data
        assert "<DelinquentFederalDebt>Y: Yes</DelinquentFederalDebt>" in response.xml_data
        assert "<DebtExplanation>Dispute resolved</DebtExplanation>" in response.xml_data
        assert (
            "<StateReviewAvailableDate>2024-02-01</StateReviewAvailableDate>" in response.xml_data
        )
        assert (
            "<TotalEstimatedFundingComputed>90000.00</TotalEstimatedFundingComputed>"
            in response.xml_data
        )

    def test_conditional_transformation_error_handling(self):
        """Test that conditional transformation errors are handled gracefully."""
        service = XMLGenerationService()

        # Create malformed conditional config by temporarily modifying the transform rules
        from src.form_schema.forms.sf424 import FORM_XML_TRANSFORM_RULES

        # Save original config
        original_config = FORM_XML_TRANSFORM_RULES["revision_type"]["xml_transform"].copy()

        try:
            # Inject invalid conditional config
            FORM_XML_TRANSFORM_RULES["revision_type"]["xml_transform"]["conditional_transform"] = {
                "type": "invalid_transform_type"
            }

            application_data = {
                "application_type": "Revision",
                "revision_type": "A: Increase Award",
                "organization_name": "Test University",
            }

            request = XMLGenerationRequest(form_name="SF424_4_0", application_data=application_data)

            response = service.generate_xml(request)

            # Should fail gracefully with error message
            assert response.success is False
            assert (
                "Unknown conditional transform type: invalid_transform_type"
                in response.error_message
            )

        finally:
            # Restore original config
            FORM_XML_TRANSFORM_RULES["revision_type"]["xml_transform"] = original_config

    def test_applicant_type_code_one_to_many_mapping(self):
        """Test that applicant_type_code array is mapped to multiple XML elements."""
        service = XMLGenerationService()

        application_data = {
            "application_type": "New",
            "applicant_type_code": ["A: State", "B: County", "C: Municipal"],
            "organization_name": "Test University",
        }

        request = XMLGenerationRequest(form_name="SF424_4_0", application_data=application_data)

        response = service.generate_xml(request)

        assert response.success is True
        assert response.xml_data is not None

        # Check that one-to-many mapping creates separate XML elements
        assert "<ApplicantTypeCode1>A: State</ApplicantTypeCode1>" in response.xml_data
        assert "<ApplicantTypeCode2>B: County</ApplicantTypeCode2>" in response.xml_data
        assert "<ApplicantTypeCode3>C: Municipal</ApplicantTypeCode3>" in response.xml_data

    def test_applicant_type_code_single_value(self):
        """Test that single applicant_type_code value is mapped correctly."""
        service = XMLGenerationService()

        application_data = {
            "application_type": "New",
            "applicant_type_code": "A: State",
            "organization_name": "Test University",
        }

        request = XMLGenerationRequest(form_name="SF424_4_0", application_data=application_data)

        response = service.generate_xml(request)

        assert response.success is True
        assert response.xml_data is not None

        # Check that single value is mapped to first element
        assert "<ApplicantTypeCode1>A: State</ApplicantTypeCode1>" in response.xml_data
        # Should not have additional elements
        assert "<ApplicantTypeCode2>" not in response.xml_data
