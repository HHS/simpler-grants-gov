import re
from collections import defaultdict
from dataclasses import dataclass
from typing import Any, Callable, Iterable

import xmltodict
from defusedxml import ElementTree as DET

ENVELOPE_REGEX = r"<([a-zA-Z0-9]+):Envelope.*?>(.*?)</([a-zA-Z0-9]+):Envelope>"
XML_DICT_KEY_NAMESPACE_DELIMITER = ":"
XML_DICT_KEY_ATTRIBUTE_PREFIX = "@"
XML_DICT_KEY_TEXT_VALUE_KEY = "#text"


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


def get_soap_operation_name(soap_xml: str | bytes) -> str:
    """Get operation name

    Get the SOAP operation name. Every valid SOAP request Body should
    have the global SOAP envelope namespace.
    """
    try:
        if isinstance(soap_xml, bytes):
            soap_xml = soap_xml.decode()
        root = DET.fromstring(soap_xml)
        body = root.find(".//{http://schemas.xmlsoap.org/soap/envelope/}Body")
        if body is not None and len(body) > 0:
            return body[0].tag.split("}")[-1]
        return ""
    except Exception:
        return ""


def get_soap_operation_dict(soap_xml: str, operation_name: str) -> dict:
    return get_envelope_dict(SOAPPayload(soap_xml).to_dict(), operation_name)


def get_envelope_dict(soap_xml_dict: dict, operation_name: str) -> dict:
    return soap_xml_dict.get("Envelope", {}).get("Body", {}).get(operation_name, {})
