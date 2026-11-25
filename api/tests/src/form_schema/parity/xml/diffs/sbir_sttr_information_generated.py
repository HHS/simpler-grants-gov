from ..harness.form_diff import FormDiff

DIFF = FormDiff(
    module="sbir_sttr_information_generated",
    differing_rules={
        "NumberOfEmployees/type": (
            "The XSD restricts xs:integer to 1–999. The static checker reports its primitive "
            "ancestor xs:decimal. The answer is an integer; the XML test exercises the actual limits."
        ),
    },
)
