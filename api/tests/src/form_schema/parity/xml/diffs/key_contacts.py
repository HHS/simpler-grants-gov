"""Key Contacts' XML mapping against Key_Contacts_2_0-V2.0.xsd.

Complete, including through the repeatable `RoleOnProject` section. Two `differing_rules`
entries, both in types the Grants.gov global libraries declare.
"""

from ..harness.form_diff import FormDiff

DIFF = FormDiff(
    module="key_contacts",
    differing_rules={
        "RoleOnProject.ContactAddress.Country/enum": (
            "Reachable. UniversalCodes-V2.0.xsd spells this country with a typographic "
            "apostrophe (U+2019) and the form offers it with a straight one (U+0027). Nothing "
            "else about the two strings differs, which is why it survives review. An applicant "
            "who selects it produces a value the code list does not contain."
        ),
        "RoleOnProject.ContactEmail/minLength": (
            "Not reachable, recorded because the declarations do differ. globLib:EmailDataType "
            "restricts to minLength 1 and the form declares no minLength, but the form also "
            "asserts `format: email`, which rejects the empty string -- so no empty answer can "
            "be stored to be submitted. It would become reachable if that format assertion were "
            "relaxed, because `_process_xml_transform_rule` excludes a value only when it is "
            "None, not when it is empty."
        ),
    },
)
