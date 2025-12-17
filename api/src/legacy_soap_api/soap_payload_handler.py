import io
import re
from collections import defaultdict
from collections.abc import Callable, Iterable
from dataclasses import dataclass
from typing import Any

import xmltodict
from lxml import etree
from lxml.etree import Element, QName, SubElement

ENVELOPE_REGEX = r"<([a-zA-Z0-9]+):Envelope.*?>(.*?)</([a-zA-Z0-9]+):Envelope>"
XML_DICT_KEY_NAMESPACE_DELIMITER = ":"
XML_DICT_KEY_ATTRIBUTE_PREFIX = "@"
XML_DICT_KEY_TEXT_VALUE_KEY = "#text"
CHUNK_SIZE = 1000
NUMBER_OF_CHUNKS = 5


class SOAPPayload:
    def __init__(
        self,
        soap_payload: str | dict,
        force_list_attributes: tuple | None = None,
        keymap: dict[str, dict[str, set]] | None = None,
        operation_name: str | None = None,
    ) -> None:
        self.payload = soap_payload
        self.force_list_attributes = force_list_attributes if force_list_attributes else tuple()
        self.keymap: dict[str, dict[str, set]] = (
            keymap if keymap else defaultdict(lambda: {"original_keys": set(), "namespaces": set()})
        )
        self._operation_name = operation_name

        # Get SOAP XML between, and including the <soap:Envelope> and </soap:Envelope> tags and preserve the content before and after the envelope.
        self.envelope_data = SOAPEnvelopeData()
        if isinstance(self.payload, str):
            self.envelope_data = get_soap_envelope_from_payload(self.payload)
        elif isinstance(self.payload, dict):
            self.update_envelope_from_dict(self.payload)

    @property
    def operation_name(self) -> str:
        """Get operation name

        Get the SOAP operation name. Every valid SOAP request Body should
        have the global SOAP envelope namespace.
        """
        if not self.envelope_data.envelope:
            return ""
        if self._operation_name:
            return self._operation_name
        return get_soap_operation_name(self.envelope_data.envelope)

    def update_envelope_from_dict(self, envelope: dict) -> None:
        self.envelope_data.envelope = (
            xmltodict.unparse(
                transform_soap_xml_dict(
                    envelope,
                    key_modifier=self._assign_original_keys_modifier,
                    value_modifier=self._value_modifier,
                )
            )
            .replace('<?xml version="1.0" encoding="utf-8"?>', "")
            .strip()
        )

    def to_dict(self) -> dict:
        """Get SOAP XML as dict

        This method will return the XML payload as a dict. It transforms the dict
        to key value pairs while preserving the namespaces in self.keymap and returns the
        dict with keys that omit the namespace prefixes. The namespaces will be remapped
        when/if the dict is updated in self.update_envelope_from_dict.
        """
        if not self.envelope_data.envelope:
            return {}
        return transform_soap_xml_dict(
            xmltodict.parse(self.envelope_data.envelope),
            key_modifier=non_namespace_or_attribute_key_modifier,
            value_modifier=self._value_modifier,
            keymap_handler=self._keymap_handler,
        )

    def _value_modifier(self, soap_xml_dict_key: str, soap_xml_dict_value: Any) -> Any:
        if (
            soap_xml_dict_key.split(XML_DICT_KEY_NAMESPACE_DELIMITER)[-1]
            in self.force_list_attributes
        ):
            if not isinstance(soap_xml_dict_value, list):
                return [soap_xml_dict_value]
        return soap_xml_dict_value

    def _keymap_handler(self, original_key: str, new_key: str, namespaces: Iterable) -> None:
        self.keymap[new_key]["original_keys"].add(original_key)
        self.keymap[new_key]["namespaces"].update(namespaces)

    def _assign_original_keys_modifier(self, key: str) -> str:
        original_keys = self.keymap.get(key, {}).get("original_keys", set())
        for k in original_keys:
            if key in k:
                return k
        return key


def non_namespace_or_attribute_key_modifier(key: str) -> str:
    """Get modified dict key

    This method only modifies keys that are not an XML attribute or namespace and have a value or nested XML
    elements. This preserves namespace values in the XML dict.
    """
    if key.startswith(XML_DICT_KEY_ATTRIBUTE_PREFIX) or key == XML_DICT_KEY_TEXT_VALUE_KEY:
        return key
    if XML_DICT_KEY_NAMESPACE_DELIMITER in key:
        return key.split(XML_DICT_KEY_NAMESPACE_DELIMITER)[-1]
    return key


def transform_soap_xml_dict(
    data: dict,
    key_modifier: Callable | None = None,
    value_modifier: Callable | None = None,
    keymap_handler: Callable | None = None,
) -> dict:
    if not any([key_modifier, keymap_handler, value_modifier]):
        return data
    return _transform_soap_xml_dict(
        data,
        key_modifier=key_modifier,
        keymap_handler=keymap_handler,
        value_modifier=value_modifier,
    )


def _transform_soap_xml_dict(
    data: Any,
    key_modifier: Callable | None = None,
    value_modifier: Callable | None = None,
    keymap_handler: Callable | None = None,
) -> Any:
    if isinstance(data, dict):
        result = {}
        namespaces = []
        for original_key, v in data.items():
            if is_namespace_key(original_key):
                namespaces.append(original_key)
            new_key = original_key
            if key_modifier:
                new_key = key_modifier(original_key)
            if keymap_handler:
                keymap_handler(original_key, new_key, namespaces)
            if value_modifier:
                v = value_modifier(new_key, v)
            result[new_key] = _transform_soap_xml_dict(
                v, key_modifier, value_modifier, keymap_handler
            )
        return result
    elif isinstance(data, list):
        return [
            _transform_soap_xml_dict(item, key_modifier, value_modifier, keymap_handler)
            for item in data
        ]
    return data


def is_namespace_key(key: str) -> bool:
    return key.startswith(XML_DICT_KEY_ATTRIBUTE_PREFIX) and XML_DICT_KEY_NAMESPACE_DELIMITER in key


@dataclass
class SOAPEnvelopeData:
    """Certain SOAP payloads will have data before and after the XML Envelope
    tag. This class has attributes that can be referenced when only certain data needs
    to be processed and later needs to be put back into original form.

    For example, if you need to manipulate only the Envelope tag data but need
    to preserve the original SOAP data, you can use this to retain that data.

    An example SOAP message containing multiple parts is:

        --uuid:bdbceae0-7555-400e-8865-1eef914f9ca8
        Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"
        Content-Transfer-Encoding: binary
        Content-ID:
        <root.message@cxf.apache.org>
            <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        ...
        --uuid:bdbceae0-7555-400e-8865-1eef914f9ca8--
    """

    pre_envelope: str = ""
    post_envelope: str = ""
    envelope: str = ""


def get_soap_envelope_from_payload(soap_message: str) -> SOAPEnvelopeData:
    envelope_data = SOAPEnvelopeData()
    if not soap_message:
        return envelope_data
    if match := re.search(ENVELOPE_REGEX, soap_message, re.DOTALL):
        start, end = match.span()
        envelope_data.pre_envelope = soap_message[:start]
        envelope_data.envelope = soap_message[start:end]
        envelope_data.post_envelope = soap_message[end:]
        return envelope_data
    return envelope_data


def extract_soap_xml(soap_bytes: bytes) -> bytes:
    soap_patterns = [b"<soap:Envelope", b"<soapenv:Envelope"]
    max_tag_size = len(soap_patterns[1])
    bytes_stream = io.BytesIO(soap_bytes)
    buffer = b""
    total_bytes_read = 0
    count = NUMBER_OF_CHUNKS
    while count > 0:
        chunk = bytes_stream.read(CHUNK_SIZE)
        if not chunk:
            break
        current_data = buffer + chunk
        for pattern in soap_patterns:
            match_index = current_data.find(pattern)
            if match_index != -1:
                start_position = (total_bytes_read - len(buffer)) + match_index
                return soap_bytes[start_position:]
        buffer = current_data[-max_tag_size:]
        total_bytes_read += len(chunk)
        count -= 1
    return b""


def get_soap_operation_name(soap_xml: str | bytes) -> str:
    """Get operation name

    Get the SOAP operation name. Every valid SOAP request Body should
    have the global SOAP envelope namespace.
    """
    xml_bytes = extract_soap_xml(
        soap_xml.encode("utf-8") if isinstance(soap_xml, str) else soap_xml
    )
    if not xml_bytes:
        return ""
    xml_file = io.BytesIO(xml_bytes)
    operation_name = ""
    try:
        in_body = False
        for event, elem in etree.iterparse(xml_file, events=("start", "end")):
            if in_body:
                operation_name = elem.tag.split("}", 1)[1]
                elem.clear()
                return operation_name
            elif elem.tag.endswith("Body") and event == "start":
                in_body = True
                continue
    except etree.XMLSyntaxError:
        return ""
    return operation_name


def get_soap_operation_dict(soap_xml: str, operation_name: str) -> dict:
    return get_envelope_dict(SOAPPayload(soap_xml).to_dict(), operation_name)


def get_envelope_dict(soap_xml_dict: dict, operation_name: str) -> dict:
    return soap_xml_dict.get("Envelope", {}).get("Body", {}).get(operation_name, {})


def build_xml_from_dict(
    operation_name: str,
    xml_dict: dict[str, Any],
    key_namespace_config: dict[str, str | None],
    namespaces: dict[str | None, str],
) -> bytes:
    soap_ns = namespaces.get("soap")
    envelope = Element(QName(soap_ns, "Envelope"), nsmap={"soap": soap_ns})
    body = SubElement(envelope, QName(soap_ns, "Body"))

    # Get the namespace prefix for the root operation element
    element_tag_prefix = key_namespace_config.get(operation_name)
    element_tag_ns_uri = namespaces.get(element_tag_prefix)
    element = QName(element_tag_ns_uri, operation_name)

    # Create the root element with proper namespace mapping
    # We need to create a namespace map that excludes 'soap' since it's already on the envelope
    root_nsmap = {k: v for k, v in namespaces.items() if k != "soap"}
    root_element = SubElement(body, element, nsmap=root_nsmap)

    _build_xml_elements(root_element, xml_dict, key_namespace_config, namespaces)
    return etree.tostring(envelope, encoding="utf-8", xml_declaration=False)


def _build_xml_elements(
    parent: etree._Element,
    xml_dict: dict[str, Any],
    key_namespace_config: dict[str, str | None],
    namespaces: dict[str | None, str],
) -> None:
    # Sort keys to ensure consistent XML element ordering across environments
    for key, value in sorted(xml_dict.items()):
        # Get the namespace prefix for this element
        ns_prefix = key_namespace_config.get(key)
        ns_uri = namespaces.get(ns_prefix) if ns_prefix else None

        # Create the element tag with proper namespace
        if ns_uri:
            tag = QName(ns_uri, key)
        else:
            tag = key

        if isinstance(value, dict):
            child = SubElement(parent, tag)
            _build_xml_elements(child, value, key_namespace_config, namespaces)
        elif isinstance(value, list):
            for item in value:
                item_tag = QName(ns_uri, key) if ns_uri else key
                item_el = SubElement(parent, item_tag)
                if isinstance(item, dict):
                    _build_xml_elements(item_el, item, key_namespace_config, namespaces)
                else:
                    item_el.text = str(item)
        else:
            el = SubElement(parent, tag)
            el.text = str(value)


def _build_mtom_nested_elements(parent: etree._Element, data: dict, namespaces: dict) -> None:
    for key, value in data.items():
        prefix, local_name = get_prefix_and_local_name(key)
        ns_map = {}
        ns_uri = namespaces.get(prefix)
        if local_name[0] == "@":
            parent.set(local_name[1:], str(value))
            continue
        if ns_uri:
            if local_name == "Include":
                tag = QName(namespaces["xop"], local_name)
                ns_map.update({"xop": namespaces["xop"]})
            else:
                tag = QName(ns_uri, local_name)
        if isinstance(value, list):
            for item in value:
                child_element = etree.SubElement(parent, tag, nsmap=ns_map)
                _build_mtom_nested_elements(child_element, item, namespaces)
        elif isinstance(value, dict):
            child_element = etree.SubElement(parent, tag, nsmap=ns_map)
            _build_mtom_nested_elements(child_element, value, namespaces)
        else:
            child_element = etree.SubElement(parent, tag, nsmap=ns_map)
            child_element.text = str(value).lower() if isinstance(value, bool) else str(value)


# Handle building the MTOM xml for responses like GetApplicationZipResponse
# the basic structure (without most namespaces) looks like this
#     <soap:Envelope>
#       <soap:Body>
#           <ns2:GetApplicationZipResponse>
#               <ns2:FileDataHandler><xop:Include xmlns:xop="http://www.w3.org/2004/08/xop/include" href="cid:{CID_UUID}-0001@apply.grants.gov"/></ns2:FileDataHandler>
#           </ns2:GetApplicationZipResponse>
#       </soap:Body>
#     </soap:Envelope>
def build_mtom_response_from_dict(
    input_data: dict, raw_uuid: str, namespaces: dict, root: str
) -> bytes:
    soap_env = etree.Element(
        QName(namespaces["soap"], "Envelope"),
        nsmap={"soap": "http://schemas.xmlsoap.org/soap/envelope/"},
    )
    soap_body = etree.SubElement(soap_env, QName(namespaces["soap"], "Body"))
    response_data = input_data.get("Body", {})
    nsmap = {key: val for key, val in namespaces.items() if key not in ("xop", "soap")}
    for key, value in response_data.items():
        prefix, local_name = get_prefix_and_local_name(key)
        tag = QName(namespaces[prefix], local_name)
        response_node = etree.SubElement(soap_body, tag, nsmap=nsmap)
        _build_mtom_nested_elements(response_node, value, namespaces)
    xml_bytes = etree.tostring(soap_env, encoding="UTF-8", xml_declaration=False)
    boundary = f"uuid:{raw_uuid}"
    mime_header = (
        f"--{boundary}\n"
        f'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"\n'
        f"Content-Transfer-Encoding: binary\n"
        f"Content-ID: <root.message@cxf.apache.org>\n\n"
    )
    return mime_header.encode("utf-8") + xml_bytes


def get_prefix_and_local_name(key: str) -> tuple:
    if ":" in key:
        return key.split(":")[0], key.split(":")[-1]
    else:
        return None, key
