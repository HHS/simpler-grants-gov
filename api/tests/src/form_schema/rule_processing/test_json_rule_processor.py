import uuid

from src.form_schema.rule_processing.json_rule_context import JsonRuleConfig
from src.form_schema.rule_processing.json_rule_processor import process_rule_schema, JsonRuleContext
from tests.src.db.models.factories import ApplicationFormFactory, OpportunityFactory, CompetitionFactory, ApplicationFactory, CompetitionFormFactory, AgencyFactory, LinkExternalUserFactory, \
    ApplicationUserFactory
import freezegun

def setup_context(
        json_data: dict,
        # rule_schema: dict, # TODO - needs to be in the table
        # These are various params that be set in the application
        # if the value is None, we'll just leave it to the factory to set.
        opportunity_number: str | None = None,
        opportunity_title: str | None = None,
        agency_name: str | None = None,
        user_email: str | None = None,
        # Configurational params
        do_pre_population: bool = True,
        do_post_population: bool = True,
        do_field_validation: bool = True
):
    agency_params = {}
    if agency_name is not None:
        agency_params["agency_name"] = agency_name
    agency = AgencyFactory.create(**agency_params)

    opp_params = {"agency_code": agency.agency_code}
    if opportunity_number is not None:
        opp_params["opportunity_number"] = opportunity_number
    if opportunity_title is not None:
        opp_params["opportunity_title"] = opportunity_title


    opportunity = OpportunityFactory.create(**opp_params)
    competition = CompetitionFactory.create(opportunity=opportunity, competition_forms=[])
    competition_form = CompetitionFormFactory.create(competition=competition)

    application = ApplicationFactory.create(competition=competition)
    application_form = ApplicationFormFactory.create(application=application, competition_form=competition_form, application_response=json_data)

    if user_email is not None:
        link_user = LinkExternalUserFactory.create(email=user_email)
        ApplicationUserFactory.create(application=application, user=link_user.user)

    return JsonRuleContext(application_form, JsonRuleConfig(do_pre_population=do_pre_population, do_post_population=do_post_population, do_field_validation=do_field_validation))


@freezegun.freeze_time("2025-01-15 12:00:00", tz_offset=0)
def test_process_rule_schema(enable_factory_create):

    rule_schema = {
        "opp_number_field": {
            "gg_pre_population": {
                "rule": "opportunity_number"
            },
        },
        "nested": {
            "opp_title_field": {
                "gg_pre_population": {
                    "rule": "opportunity_title"
                }
            },
            "inner_nested": {
                "agency_name_field": {
                    "gg_pre_population": {
                        "rule": "agency_name"
                    }
                },
                "date_field": {
                    "gg_post_population": {
                        "rule": "current_date"
                    }
                }
            }
        },
        "signature_field": {
            "gg_post_population": {
                "rule": "signature"
            }
        }
    }


    context = setup_context({"existing_field": "bob", "opp_number_field": "something else", "nested": {"another_nested_field": "X"}}, opportunity_number="ABC-XYZ-123", opportunity_title="My opportunity title", agency_name="My example agency", user_email="mymail@example.com")

    process_rule_schema(context, rule_schema, [])

    # Verify that the actual DB object is not modified
    assert context.application_form.application_response == {"existing_field": "bob", "opp_number_field": "something else", "nested": {"another_nested_field": "X"}}
    # The json data is modified with the new fields populated
    assert context.json_data == {
        "existing_field": "bob",
        "opp_number_field": "ABC-XYZ-123",
        "nested": {
            "opp_title_field": "My opportunity title",
            "another_nested_field": "X",
            "inner_nested": {
                "agency_name_field": "My example agency",
                "date_field": "2025-01-15"
            }
        },
        "signature_field": "mymail@example.com"
    }

    print("---")
    print(context.application_form.application_response)
    print(context.json_data)