import re
from xml.etree import ElementTree

from src.util.xml_utils import xml_to_dict


class SoapPayload:
    def __init__(self, soap_payload_str: str) -> None:
        self.payload = soap_payload_str

    @property
    def envelope(self) -> str | None:
        """SOAP envelope

        Get SOAP XML between, and including the <soap:Envelope> and </soap:Envelope> tags.
        """
        pattern = r"<([a-zA-Z0-9]+):Envelope.*?>(.*?)</([a-zA-Z0-9]+):Envelope>"
        if match := re.search(pattern, self.payload, re.DOTALL):
            return match.group(0)
        return None

    @property
    def operation_name(self) -> str | None:
        """Get operation name

        Get the SOAP operation name. Every valid SOAP request Body should
        have the global SOAP envelope namespace.
        """
        if not self.envelope:
            return None
        try:
            root = ElementTree.fromstring(self.envelope)
            body = root.find(".//{http://schemas.xmlsoap.org/soap/envelope/}Body")
            if body is not None and len(body) > 0:
                return body[0].tag.split("}")[-1]
            return None
        except ElementTree.ParseError:
            return None

    def to_dict(self) -> dict:
        if not self.envelope:
            return {}
        return xml_to_dict(self.envelope)
