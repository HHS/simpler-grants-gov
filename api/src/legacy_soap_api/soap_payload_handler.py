import re
from xml.etree import ElementTree

from defusedxml import ElementTree as DET

from src.util.xml_utils import xml_to_dict

ENVELOPE_REGEX = r"<([a-zA-Z0-9]+):Envelope.*?>(.*?)</([a-zA-Z0-9]+):Envelope>"


class SoapPayload:
    def __init__(self, soap_payload_str: str) -> None:
        self.payload = soap_payload_str

        # Get SOAP XML between, and including the <soap:Envelope> and </soap:Envelope> tags.
        self.envelope = None
        if match := re.search(ENVELOPE_REGEX, self.payload, re.DOTALL):
            self.envelope = match.group(0)

    @property
    def operation_name(self) -> str | None:
        """Get operation name

        Get the SOAP operation name. Every valid SOAP request Body should
        have the global SOAP envelope namespace.
        """
        if not self.envelope:
            return None
        try:
            root = DET.fromstring(self.envelope)
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
