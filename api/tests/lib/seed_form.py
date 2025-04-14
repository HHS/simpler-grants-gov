FORM_NAME = "Application For Federal Assistance SF 424 - Individual"

UI_SCHEMA = [
  {
    "type": "section",
    "label": "1. Name of Federal Agency",
    "name": "NameFederalAgency",
    "children": [
      {
        "type": "field",
        "definition": "/properties/FederalAgency"
      }
    ]
  },
  {
    "type": "section",
    "label": "2. Assistance Listing Number",
    "name": "AssistanceListingNumber",
    "children": [
      {
        "type": "field",
        "definition": "/properties/CFDANumber"
      },
      {
        "type": "field",
        "definition": "/properties/CFDATitle"
      }
    ]
  },
  {
    "type": "section",
    "label": "3. Date Received",
    "name": "DateReived",
    "children": [
      {
        "type": "field",
        "definition": "/properties/Date_Received"
      }
    ]
  },
  {
    "type": "section",
    "label": "4. Funding Opportunity Number",
    "name": "FundingOpportunityNumber",
    "children": [
      {
        "type": "field",
        "definition": "/properties/OpportunityID"
      },
      {
        "type": "field",
        "definition": "/properties/OpportunityTitle"
      }
    ]
  },
  {
    "type": "section",
    "label": "5. Applicant Information",
    "name": "ApplicantInformationHeader",
    "children": [
      {
        "type": "section",
        "label": "5a. Name and Contact Information",
        "name": "NameandContactInformationHeader",
        "children": [
          {
            "type": "field",
            "definition": "/properties/PrefixName"
          },
          {
            "type": "field",
            "definition": "/properties/FirstName"
          },
          {
            "type": "field",
            "definition": "/properties/MiddleName"
          },
          {
            "type": "field",
            "definition": "/properties/LastName"
          },
          {
            "type": "field",
            "definition": "/properties/Suffix"
          },
          {
            "type": "field",
            "definition": "/properties/AuthorizedRepresentativePhoneNumber"
          },
          {
            "type": "field",
            "definition": "/properties/EveningPhone"
          },
          {
            "type": "field",
            "definition": "/properties/AuthorizedRepresentativeFax"
          },
          {
            "type": "field",
            "definition": "/properties/AuthorizedRepresentativeEmail"
          }
        ]
      },
      {
        "type": "section",
        "label": "5b. Address",
        "name": "AddressHeader",
        "children": [
          {
            "type": "field",
            "definition": "/properties/Street1"
          },
          {
            "type": "field",
            "definition": "/properties/Street2"
          },
          {
            "type": "field",
            "definition": "/properties/City"
          },
          {
            "type": "field",
            "definition": "/properties/County"
          },
          {
            "type": "field",
            "definition": "/properties/State"
          },
          {
            "type": "field",
            "definition": "/properties/Province"
          },
          {
            "type": "field",
            "definition": "/properties/Country"
          },
          {
            "type": "field",
            "definition": "/properties/ZipPostalCode"
          }
        ]
      },
      {
        "type": "section",
        "label": "5c. Citizenship Status",
        "name": "CitizenshipStatusHeader",
        "children": [
          {
            "type": "field",
            "definition": "/properties/citizenship"
          },
          {
            "type": "field",
            "definition": "/properties/AlienRegistrationNumber"
          },
          {
            "type": "field",
            "definition": "/properties/CountryofOrigin"
          },
          {
            "type": "field",
            "definition": "/properties/VisitDate"
          }
        ]
      },
      {
        "type": "section",
        "label": "5d. Congressional District of Applicant",
        "name": "CongressionalDistrictApplicant",
        "children": [
          {
            "type": "field",
            "definition": "/properties/CongressionalDistrictApplicant"
          }
        ]
      }
    ]
  },
  {
    "type": "section",
    "label": "6. Project Information",
    "name": "ProjectInformationHeader",
    "children": [
      {
        "type": "section",
        "label": "6a. Project Title ",
        "name": "ProjectTitle",
        "children": [
        {
          "type": "field",
          "definition": "/properties/ProjectTitle"
        }]
      },
      {
        "type": "section",
        "label": "6a. Project Description",
        "name": "ProjectDecription",
        "children": [
        {
          "type": "field",
          "definition": "/properties/ProjectDecription"
        }]
      },
      {
        "type": "section",
        "label": "6c. Proposed Project ",
        "name": "ProposedProjectHeader",
        "children": [
          {
            "type": "field",
            "definition": "/properties/FundingPeriodStartDate"
          },
          {
            "type": "field",
            "definition": "/properties/FundingPeriodEndDate"
          }
        ]
      }
    ]
  },
  {
    "type": "section",
    "label": "7. Certification Text",
    "name": "CertificationText",
    "children": [
      {
        "type": "field",
        "definition": "/properties/ApplicationCertification"
      },
      {
        "type": "field",
        "definition": "/properties/AORSignature"
      },
      {
        "type": "field",
        "definition": "/properties/AORDate"
      }
    ]
  }
]

JSON_SCHEMA_FORM = [
    {
        "type": "object",
        "title": "Test form for testing",
        "properties": {
            "Title": {"title": "Title", "type": "string", "minLength": 1, "maxLength": 60},
            "Description": {
                "title": "Description for application",
                "type": "string",
                "minLength": 0,
                "maxLength": 15,
            },
            "ApplicationNumber": {
                "title": "Application number",
                "type": "number",
                "minLength": 1,
                "maxLength": 120,
            },
            "Date": {"title": "Date of application ", "type": "string", "format": "date"},
        },
        "required": ["ApplicationNumber"],
    },
    {
        "type": "object",
        "title": "Application For Federal Assistance SF 424 - Individual",
        "properties": {
            "FederalAgency": {
                "title": "Name of Federal Agency",
                "type": "string",
                "minLength": 1,
                "maxLength": 60,
            },
            "CFDANumber": {
                "title": "Assistance Listing Number",
                "type": "string",
                "minLength": 0,
                "maxLength": 15,
            },
            "CFDATitle": {
                "title": "Assistance Listing Title",
                "type": "string",
                "minLength": 0,
                "maxLength": 120,
            },
            "Date_Received": {"title": "Date Received ", "type": "string", "format": "date"},
            "OpportunityID": {
                "title": "Funding Opportunity Number",
                "type": "string",
                "minLength": 1,
                "maxLength": 40,
            },
            "OpportunityTitle": {
                "title": "Funding Opportunity Title",
                "type": "string",
                "minLength": 1,
                "maxLength": 255,
            },
            "PrefixName": {
                "title": "Prefix",
                "type": "string",
                "minLength": 0,
                "maxLength": 10,
            },
            "FirstName": {
                "title": "First Name",
                "type": "string",
                "minLength": 1,
                "maxLength": 35,
            },
            "MiddleName": {
                "title": "Middle Name",
                "type": "string",
                "minLength": 0,
                "maxLength": 25,
            },
            "LastName": {
                "title": "Last Name",
                "type": "string",
                "minLength": 1,
                "maxLength": 60,
            },
            "Suffix": {"title": "Suffix", "type": "string", "minLength": 0, "maxLength": 10},
            "AuthorizedRepresentativePhoneNumber": {
                "title": "Daytime Phone Number",
                "type": "string",
                "minLength": 1,
                "maxLength": 25,
            },
            "EveningPhone": {
                "title": "Evening Phone Number",
                "type": "string",
                "minLength": 0,
                "maxLength": 25,
            },
            "AuthorizedRepresentativeFax": {
                "title": "Fax Number",
                "type": "string",
                "minLength": 1,
                "maxLength": 25,
            },
            "AuthorizedRepresentativeEmail": {
                "title": "Email",
                "type": "string",
                "minLength": 1,
                "maxLength": 60,
                "format": "email",
            },
            "Street1": {"title": "Street1", "type": "string", "minLength": 1, "maxLength": 55},
            "Street2": {"title": "Street2", "type": "string", "minLength": 0, "maxLength": 55},
            "City": {"title": "City", "type": "string", "minLength": 1, "maxLength": 35},
            "County": {
                "title": "County/Parish",
                "type": "string",
                "minLength": 0,
                "maxLength": 30,
            },
            "State": {"title": "State", "type": "string", "minLength": 0, "maxLength": 55},
            "Province": {
                "title": "Province",
                "type": "string",
                "minLength": 0,
                "maxLength": 30,
            },
            "Country": {"title": "Country", "type": "string", "minLength": 1, "maxLength": 49},
            "ZipPostalCode": {
                "title": "Zip/Postal Code",
                "type": "string",
                "minLength": 0,
                "maxLength": 30,
            },
            "citizenship": {"title": "U.S. Citizenship", "type": "string"},
            "AlienRegistrationNumber": {
                "title": "Alien Registration Number",
                "type": "string",
                "minLength": 0,
                "maxLength": 14,
            },
            "CountryofOrigin": {
                "title": "Citizenship Country",
                "type": "string",
                "minLength": 0,
                "maxLength": 49,
            },
            "VisitDate": {"title": "Residency Start Date", "type": "string", "format": "date"},
            "CongressionalDistrictApplicant": {
                "title": "Congressional District of Applicant",
                "type": "string",
                "minLength": 1,
                "maxLength": 6,
            },
            "ProjectTitle": {
                "title": "Project Title",
                "type": "string",
                "minLength": 1,
                "maxLength": 200,
            },
            "ProjectDecription": {
                "title": "Project Description",
                "type": "string",
                "minLength": 1,
                "maxLength": 1000,
            },
            "FundingPeriodStartDate": {
                "title": "Proposed Project Start Date",
                "type": "string",
                "format": "date",
            },
            "FundingPeriodEndDate": {
                "title": "Proposed Project End Date",
                "type": "string",
                "format": "date",
            },
            "ApplicationCertification": {
                "title": "I Agree",
                "type": "string",
                "enum": ["Yes", "No"],
            },
            "AORSignature": {
                "title": "Signature",
                "type": "string",
                "minLength": 1,
                "maxLength": 144,
            },
            "AORDate": {"title": "Date Signed", "type": "string", "format": "date"},
        },
        "required": [
            "FederalAgency",
            "Date_Received",
            "OpportunityID",
            "OpportunityTitle",
            "FirstName",
            "LastName",
            "AuthorizedRepresentativePhoneNumber",
            "AuthorizedRepresentativeEmail",
            "Street1",
            "City",
            "Country",
            "citizenship",
            "CongressionalDistrictApplicant",
            "ProjectTitle",
            "ProjectDecription",
            "FundingPeriodStartDate",
            "FundingPeriodEndDate",
            "ApplicationCertification",
            "AORSignature",
            "AORDate",
        ],
    },
]
