import uuid

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form
from src.form_schema.shared import COMMON_SHARED_V1

DIRECTIONS = """Public reporting burden for this collection of information is estimated to average 15 minutes per response, including time for reviewing instructions, searching existing data sources, gathering and maintaining the data needed, and completing and reviewing the collection of information. Send comments regarding the burden estimate or any other aspect of this collection of information, including suggestions for reducing this burden, to the Office of Management and Budget, Paperwork Reduction Project (0348-0042), Washington, DC 20503.

NOTE: Certain of these assurances may not be applicable to your project or program. If you have questions, please contact the Awarding Agency. Further, certain Federal assistance awarding agencies may require applicants to certify to additional assurances. If such is the case, you will be notified.

1. Has the legal authority to apply for Federal assistance, and the institutional, managerial and financial capability (including funds sufficient to pay the non-Federal share of project costs) to ensure proper planning, management and completion of project described in this application.

2. Will give the awarding agency, the Comptroller General of the United States and, if appropriate, the State, the right to examine all records, books, papers, or documents related to the assistance; and will establish a proper accounting system in accordance with generally accepted accounting standards or agency directives.

3. Will not dispose of, modify the use of, or change the terms of the real property title or other interest in the site and facilities without permission and instructions from the awarding agency. Will record the Federal interest in the title of real property in accordance with awarding agency directives and will include a covenant in the title of real property acquired in whole or in part with Federal assistance funds to assure nondiscrimination during the useful life of the project.

4. Will comply with the requirements of the assistance awarding agency with regard to the drafting, review and approval of construction plans and specifications.

5. Will provide and maintain competent and adequate engineering supervision at the construction site to ensure that the complete work conforms with the approved plans and specifications and will furnish progressive reports and such other information as may be required by the assistance awarding agency or State.

6. Will initiate and complete the work within the applicable time frame after receipt of approval of the awarding agency.

7. Will establish safeguards to prohibit employees from using their positions for a purpose that constitutes or presents the appearance of personal or organizational conflict of interest, or personal gain.

8. Will comply with the Intergovernmental Personnel Act of 1970 (42 U.S.C. §§4728-4763) relating to prescribed standards of merit systems for programs funded under one of the 19 statutes or regulations specified in Appendix A of OPM's Standards for a Merit System of Personnel Administration (5 C.F.R. 900, Subpart F).

9. Will comply with the Lead-Based Paint Poisoning Prevention Act (42 U.S.C. §§4801 et seq.) which prohibits the use of lead-based paint in construction or rehabilitation of residence structures.

10. Will comply with all Federal statutes relating to nondiscrimination. These include but are not limited to: (a) Title VI of the Civil Rights Act of 1964 (P.L. 88-352) which prohibits discrimination on the basis of race, color or national origin; (b) Title IX of the Education Amendments of 1972, as amended (20 U.S.C. §§1681 1683, and 1685-1686), which prohibits discrimination on the basis of sex; (c) Section 504 of the Rehabilitation Act of 1973, as amended (29) U.S.C. §794), which prohibits discrimination on the basis of handicaps; (d) the Age Discrimination Act of 1975, as amended (42 U.S.C. §§6101-6107), which prohibits discrimination on the basis of age; (e) the Drug Abuse Office and Treatment Act of 1972 (P.L. 92-255), as amended relating to nondiscrimination on the basis of drug abuse; (f) the Comprehensive Alcohol Abuse and Alcoholism Prevention, Treatment and Rehabilitation Act of 1970 (P.L. 91-616), as amended, relating to nondiscrimination on the basis of alcohol abuse or alcoholism; (g) §§523 and 527 of the Public Health Service Act of 1912 (42 U.S.C. §§290 dd-3 and 290 ee 3), as amended, relating to confidentiality of alcohol and drug abuse patient records; (h) Title VIII of the Civil Rights Act of 1968 (42 U.S.C. §§3601 et seq.), as amended, relating to nondiscrimination in the sale, rental or financing of housing; (i) any other nondiscrimination provisions in the specific statue(s) under which application for Federal assistance is being made; and (j) the requirements of any other nondiscrimination statue(s) which may apply to the application.

11. Will comply, or has already complied, with the requirements of Titles II and III of the Uniform Relocation Assistance and Real Property Acquisition Policies Act of 1970 (P.L. 91-646) which provide for fair and equitable treatment of persons displaced or whose property is acquired as a result of Federal and federally-assisted programs. These requirements apply to all interests in real property acquired for project purposes regardless of Federal participation in purchases.

12. Will comply with the provisions of the Hatch Act (5 U.S.C. §§1501-1508 and 7324-7328) which limit the political activities of employees whose principal employment activities are funded in whole or in part with Federal funds.

13. Will comply, as applicable, with the provisions of the Davis-Bacon Act (40 U.S.C. §§276a to 276a-7), the Copeland Act (40 U.S.C. §276c and 18 U.S.C. §874), and the Contract Work Hours and Safety Standards Act (40 U.S.C. §§327-333) regarding labor standards for federally-assisted construction subagreements.

14. Will comply with flood insurance purchase requirements of Section 102(a) of the Flood Disaster Protection Act of 1973 (P.L. 93-234) which requires recipients in a special flood hazard area to participate in the program and to purchase flood insurance if the total cost of insurable construction and acquisition is $10,000 or more.

15. Will comply with environmental standards which may be prescribed pursuant to the following: (a) institution of environmental quality control measures under the National Environmental Policy Act of 1969 (P.L. 91-190) and Executive Order (EO) 11514; (b) notification of violating facilities pursuant to EO 11738; (c) protection of wetlands pursuant to EO 11990; (d) evaluation of flood hazards in floodplains in accordance with EO 11988; (e) assurance of project consistency with the approved State management program developed under the Coastal Zone Management Act of 1972 (16 U.S.C. §§1451 et seq.); (f) conformity of Federal actions to State (Clean Air) implementation Plans under Section 176(c) of the Clean Air Act of 1955, as amended (42 U.S.C. §§7401 et seq.); (g) protection of underground sources of drinking water under the Safe Drinking Water Act of 1974, as amended (P.L. 93-523); and, (h) protection of endangered species under the Endangered Species Act of 1973, as amended (P.L. 93-205).

16. Will comply with the Wild and Scenic Rivers Act of 1968 (16 U.S.C. §§1271 et seq.) related to protecting components or potential components of the national wild and scenic rivers system.

17. Will assist the awarding agency in assuring compliance with Section 106 of the National Historic Preservation Act of 1966, as amended (16 U.S.C. §470), EO 11593 (identification and protection of historic properties), and the Archaeological and Historic Preservation Act of 1974 (16 U.S.C. §§469a-1 et seq).

18. Will cause to be performed the required financial and compliance audits in accordance with the Single Audit Act Amendments of 1996 and OMB Circular No. A-133, "Audits of States, Local Governments, and Non-Profit Organizations."

19. Will comply with all applicable requirements of all other Federal laws, executive orders, regulations, and policies governing this program.

20. Will comply with the requirements of Section 106(g) of the Trafficking Victims Protection Act (TVPA) of 2000, as amended (22 U.S.C. 7104) which prohibits grant award recipients or a sub-recipient from (1) Engaging in severe forms of trafficking in persons during the period of time that the award is in effect (2) Procuring a commercial sex act during the period of time that the award is in effect or (3) Using forced labor in the performance of the award or subawards under the award.
"""


FORM_JSON_SCHEMA = {
    "type": "object",
    "required": ["title", "applicant_organization"],
    "properties": {
        "signature": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("signature")}],
            "title": "Signature of the Authorized Certifying Official",
            "description": "Completed by Grants.gov upon submission.",
        },
        "title": {
            # FUTURE WORK: This gets copied from the SF-424's AuthorizedRepresentativeTitle field
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("contact_person_title")}],
            "description": "This should match the 'Authorized Representative Title' field from the SF-424 form",
        },
        "applicant_organization": {
            # FUTURE WORK: This gets copied from the SF-424's OrganizationName field (called Legal Name in the UI)
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("organization_name")}],
            "title": "Applicant Organization",
            "description": "This should match the 'Legal Name' field from the SF-424 form",
        },
        "date_signed": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("submitted_date")}],
            "title": "Date Signed",
        },
    },
}

FORM_UI_SCHEMA = [
    {
        "type": "section",
        "label": "1. Directions",
        "name": "directions",
        "description": DIRECTIONS,
        "children": [],
    },
    {
        "type": "section",
        "label": "2. Signature",
        "name": "signature",
        "children": [
            {"type": "null", "definition": "/properties/signature"},
            {"type": "field", "definition": "/properties/title"},
            {"type": "field", "definition": "/properties/applicant_organization"},
            {"type": "null", "definition": "/properties/date_signed"},
        ],
    },
]

FORM_RULE_SCHEMA = {
    ##### POST-POPULATION RULES
    "signature": {"gg_post_population": {"rule": "signature"}},
    "date_signed": {"gg_post_population": {"rule": "current_date"}},
}

# XML Transformation Rules for SF-424D v1.1 (Assurances for Construction Programs)
# XSD: https://apply07.grants.gov/apply/forms/schemas/SF424D-V1.1.xsd
FORM_XML_TRANSFORM_RULES = {
    # Metadata
    "_xml_config": {
        "description": "XML transformation rules for SF-424D Assurances for Construction Programs",
        "version": "1.0",
        "form_name": "SF424D",
        "namespaces": {
            "default": "http://apply.grants.gov/forms/SF424D-V1.1",
            "SF424D": "http://apply.grants.gov/forms/SF424D-V1.1",
            "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0",
            "glob": "http://apply.grants.gov/system/Global-V1.0",
        },
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424D-V1.1.xsd",
        "xml_structure": {
            "root_element": "Assurances",
            "root_namespace_prefix": "SF424D",
            "root_attributes": {
                "programType": "Construction",
                "{http://apply.grants.gov/system/Global-V1.0}coreSchemaVersion": "1.1",
            },
        },
        "null_handling_options": {
            "exclude": "Default - exclude field entirely from XML (recommended)",
        },
    },
    # Field mappings - order matches XSD sequence
    # FormVersionIdentifier is handled by the framework

    # AuthorizedRepresentative (optional) - complex type containing RepresentativeName and RepresentativeTitle
    # Uses compose_object to wrap flat fields (signature, title) into nested XML element
    # Note: Key cannot start with underscore as those are treated as metadata
    "authorized_representative_wrapper": {
        "xml_transform": {
            "target": "AuthorizedRepresentative",
            "type": "conditional",
            "conditional_transform": {
                "type": "compose_object",
                "field_mapping": {
                    "RepresentativeName": "signature",
                    "RepresentativeTitle": "title",
                },
            },
        }
    },
    # ApplicantOrganizationName (optional) - OrganizationNameDataType
    "applicant_organization": {
        "xml_transform": {
            "target": "ApplicantOrganizationName",
        }
    },
    # SubmittedDate (optional) - xs:date
    "date_signed": {
        "xml_transform": {
            "target": "SubmittedDate",
        }
    },
}

SF424d_v1_1 = Form(
    # https://grants.gov/forms/form-items-description/fid/238
    form_id=uuid.UUID("fecdf956-0b63-480b-9b44-66541e059646"),
    legacy_form_id=238,
    form_name="Assurances for Construction Programs (SF-424D)",
    short_form_name="SF424D",
    form_version="1.1",
    agency_code="SGG",
    omb_number="4040-0009",
    form_json_schema=FORM_JSON_SCHEMA,
    form_ui_schema=FORM_UI_SCHEMA,
    form_rule_schema=FORM_RULE_SCHEMA,
    json_to_xml_schema=FORM_XML_TRANSFORM_RULES,
    form_instruction_id=uuid.UUID("3663dac7-779b-46b7-b6b5-b91edd98a06e"),
    form_type=FormType.SF424D,
    sgg_version="1.0",
    is_deprecated=False,
)
