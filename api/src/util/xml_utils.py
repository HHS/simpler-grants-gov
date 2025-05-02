from collections import defaultdict
from xml.etree import ElementTree


class XMLToDictInvalidXML(Exception):
    pass


def xml_to_dict(xml_str: str, preserve_namespace: bool = False) -> dict:
    """Convert xml to dict

    This method takes in an xml string payload and converts it into a dict.

    :param: preserve_namespace - An element's tag name or attribute is prefixed by a '{namespace}' if it contains a namespace.
        This param specifies if the key names of the dict should preserve the namespaces or not.

        Example with preserve_namespace = True:
        {
            "{http://apply.grants.gov/system/GrantsCommonElements-V1.0}FilterValue": "GRANT00702313"
        }

        Example with preserve_namespace = False:
        {
            "FilterValue": "GRANT00702313"
        }

    Limitations:
        1. Leaf elements do not support attribute processing. Only parent elements. In the following example, both
            xml payloads will be converted to the same dict even though the 2nd payload has an attribute on the title element:

            <grant id="1">
                <title>val</title>
            </grant>

            and

            <grant id="1">
                <title otherId="2">val</title>
            </grant>

            Will convert to
            {
                "grant": { "@id": "1", "title": "val" }
            }
    """
    try:
        root_element = ElementTree.fromstring(xml_str)
    except ElementTree.ParseError as e:
        raise XMLToDictInvalidXML(e) from e
    root_xml_dict_key = get_xml_dict_key(root_element.tag, preserve_namespace)
    root_xml_dict_value = _element_to_dict(root_element, preserve_namespace)
    return {root_xml_dict_key: root_xml_dict_value}


def _element_to_dict(
    xml_element: ElementTree.Element, preserve_namespace: bool = False
) -> dict | str | None:
    # Initialize result with any element attributes.
    xml_dict = {**get_element_attributes(xml_element, preserve_namespace)}

    # Process child elements if any. If no children, we are at a leaf node. Return the content if any.
    children = list(xml_element)
    if not children:
        return get_element_content(xml_element)

    # Convert child elements if any.
    child_element_dicts = defaultdict(list)
    for child_element in children:
        child_element_dict = _element_to_dict(child_element, preserve_namespace)
        child_element_dict_key_name = get_xml_dict_key(child_element.tag, preserve_namespace)
        child_element_dicts[child_element_dict_key_name].append(child_element_dict)

    # Update resulting XML dict.
    for tag, items in child_element_dicts.items():
        xml_dict_key_name = get_xml_dict_key(tag, preserve_namespace)
        xml_dict[xml_dict_key_name] = items if len(items) > 1 else items[0]

    return xml_dict


def get_element_attributes(element: ElementTree.Element, preserve_namespace: bool) -> dict:
    """Get element attributes dict

    Format element attribute key names and prefix them with @ to denote that the keyname represents an XML attribute.
    """
    return {f"@{get_xml_dict_key(k, preserve_namespace)}": v for k, v in element.attrib.items()}


def get_xml_dict_key(xml_property_name: str, preserve_namespace: bool) -> str:
    if preserve_namespace:
        return xml_property_name
    return extract_xml_property_name_value(xml_property_name)


def extract_xml_property_name_value(name: str) -> str:
    """Extract XML property name

    XML elements will have namespaces prefixing properties such as tag names, attribute names, etc. This
    method will extract only the property name. For example this method will extract 'propertyName' from
    the following input:

    {namespace}propertyName
    """
    return name.split("}")[-1] if "}" in name else name


def get_element_content(element: ElementTree.Element) -> str | None:
    if text := element.text:
        return text.strip()
    return None
