"""The generated Key Contacts' XML mapping against Key_Contacts_2_0-V2.0.xsd.

Complete, including through the repeatable `RoleOnProject` section, with nothing to
record. The two entries `key_contacts` records are absent here: the generated form's
country enum is the code list itself, and it declares the email's `minLength: 1`.
"""

from ..harness.form_diff import FormDiff

DIFF = FormDiff(module="key_contacts_generated")
