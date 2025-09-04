from lxml import etree


def minify_xml(xml_string: str) -> str:
    parser = etree.XMLParser(remove_blank_text=True)
    root = etree.fromstring(xml_string.encode("utf-8"), parser=parser)
    return etree.tostring(root, encoding="unicode", pretty_print=False)
