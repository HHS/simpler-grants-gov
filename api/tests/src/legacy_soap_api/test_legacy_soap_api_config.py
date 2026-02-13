from src.legacy_soap_api.legacy_soap_api_config import (
    LegacySoapAPIConfig,
    SimplerSoapAPI,
    get_soap_config,
)


def test_get_soap_config():
    assert isinstance(get_soap_config(), LegacySoapAPIConfig)


def test_simpler_soap_api_get_api_name_with_jwt_auth_url():
    api_name = SimplerSoapAPI.get_soap_api(
        service_name="grantsws-agency-partner", service_port_name="AgencyWebServicesSoapPort"
    )
    assert api_name == SimplerSoapAPI.GRANTORS
