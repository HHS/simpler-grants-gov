import pytest

from src.util.xml_utils import XMLToDictInvalidXML, xml_to_dict


def test_invalid_xml_raises():
    with pytest.raises(XMLToDictInvalidXML):
        xml_to_dict("not valid<xml>")


def test_basic_xml_to_dict():
    given = """
    <!-- Random comment: -->
    <grant>
        <title>val</title>
    </grant>
    """
    result_without_namespace = xml_to_dict(given)
    result_with_namespace = xml_to_dict(given, preserve_namespace=True)
    expected = {"grant": {"title": "val"}}
    assert result_without_namespace == result_with_namespace == expected


def test_multiple_namespaces():
    given = """
    <library xmlns:bk="http://a.com/book" xmlns:mv="http://a.com/movie">
        <bk:item>
            <bk:title>Yankees</bk:title>
        </bk:item>
        <mv:item>
            <mv:title>Sandlot</mv:title>
        </mv:item>
    </library>
    """
    result_no_namespaces = xml_to_dict(given)
    expected_no_namespaces = {"library": {"item": [{"title": "Yankees"}, {"title": "Sandlot"}]}}
    assert result_no_namespaces == expected_no_namespaces

    result_with_namespaces = xml_to_dict(given, preserve_namespace=True)
    expected_with_namespaces = {
        "library": {
            "{http://a.com/book}item": {"{http://a.com/book}title": "Yankees"},
            "{http://a.com/movie}item": {"{http://a.com/movie}title": "Sandlot"},
        }
    }
    assert result_with_namespaces == expected_with_namespaces


def test_leaf_element_attribute_does_not_include_attributes():
    given = """
    <grant xmlns:no="http://a.com/n">
        <no:title attribute="10">val</no:title>
    </grant>
    """
    result_no_namespaces = xml_to_dict(given)
    expected_no_namespaces = {"grant": {"title": "val"}}
    assert result_no_namespaces == expected_no_namespaces

    result_with_namespaces = xml_to_dict(given, preserve_namespace=True)
    expected_with_namespaces = {"grant": {"{http://a.com/n}title": "val"}}
    assert result_with_namespaces == expected_with_namespaces


def test_non_leaf_element_attribute_does_not_include_attributes():
    given = """
    <config xmlns:c="http://a.com/c">
        <c:setting c:enabled="true">
            <c:name>configname</c:name>
        </c:setting>
    </config>
    """
    result_no_namespaces = xml_to_dict(given)
    expected_no_namespaces = {"config": {"setting": {"@enabled": "true", "name": "configname"}}}
    assert result_no_namespaces == expected_no_namespaces

    result_with_namespaces = xml_to_dict(given, preserve_namespace=True)
    expected_with_namespaces = {
        "config": {
            "{http://a.com/c}setting": {
                "@{http://a.com/c}enabled": "true",
                "{http://a.com/c}name": "configname",
            }
        }
    }
    assert result_with_namespaces == expected_with_namespaces


def test_soap_envelope():
    given = """
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">
        <soapenv:Header/>
        <soapenv:Body>
            <app:GetApplicationListRequest>
                <gran:ApplicationFilter>
                    <gran:Filter>GrantsGovTrackingNumber</gran:Filter>
                    <gran:FilterValue>1</gran:FilterValue>
                </gran:ApplicationFilter>
                <gran:ApplicationFilter>
                    <gran:Filter>GrantsGovTrackingNumber</gran:Filter>
                    <gran:FilterValue>2</gran:FilterValue>
                </gran:ApplicationFilter>
            </app:GetApplicationListRequest>
        </soapenv:Body>
    </soapenv:Envelope>
    """
    result_without_namespaces = xml_to_dict(given)
    expected_without_namespaces = {
        "Envelope": {
            "Header": None,
            "Body": {
                "GetApplicationListRequest": {
                    "ApplicationFilter": [
                        {"Filter": "GrantsGovTrackingNumber", "FilterValue": "1"},
                        {"Filter": "GrantsGovTrackingNumber", "FilterValue": "2"},
                    ]
                }
            },
        }
    }
    assert result_without_namespaces == expected_without_namespaces
    result_with_namespace = xml_to_dict(given, preserve_namespace=True)
    expected_with_namespace = {
        "{http://schemas.xmlsoap.org/soap/envelope/}Envelope": {
            "{http://schemas.xmlsoap.org/soap/envelope/}Header": None,
            "{http://schemas.xmlsoap.org/soap/envelope/}Body": {
                "{http://apply.grants.gov/services/ApplicantWebServices-V2.0}GetApplicationListRequest": {
                    "{http://apply.grants.gov/system/GrantsCommonElements-V1.0}ApplicationFilter": [
                        {
                            "{http://apply.grants.gov/system/GrantsCommonElements-V1.0}Filter": "GrantsGovTrackingNumber",
                            "{http://apply.grants.gov/system/GrantsCommonElements-V1.0}FilterValue": "1",
                        },
                        {
                            "{http://apply.grants.gov/system/GrantsCommonElements-V1.0}Filter": "GrantsGovTrackingNumber",
                            "{http://apply.grants.gov/system/GrantsCommonElements-V1.0}FilterValue": "2",
                        },
                    ]
                }
            },
        }
    }
    assert result_with_namespace == expected_with_namespace
