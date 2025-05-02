import pytest

from src.util.xml_utils import XMLToDictInvalidXML, xml_to_dict


def test_invalid_xml_raises():
    with pytest.raises(XMLToDictInvalidXML):
        xml_to_dict("not valid<xml>")


def test_basic_xml_to_dict():
    given = """
        <grant>
            <title>val</title>
        </grant>
    """
    result = xml_to_dict(given)
    expected = {"grant": {"title": "val"}}
    assert result == expected
