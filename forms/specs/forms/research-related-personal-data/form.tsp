import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";
import "#forms/index.tsp";
import "#questions/person/name.tsp";
import "./examples.tsp";
using SimplerForms;
namespace Forms.RRPersonalData;

/** Voluntary demographic information for the project director and up to four co-directors. */
@Sgg.sync(#{ xml: "mapping" })
@Meta.form(#{
  id: "research-related-personal-data",
  formName: "Research & Related Personal Data",
})
@GrantsGov.form(#{
  legacyFormId: 357,
  shortFormName: "RR_PersonalData_1_2",
  formVersion: "1.2",
  agencyCode: "SGG",
  ombNumber: "4040-0001",
  expirationDate: "2029-01-31",
})
@example(Examples.threeDirectors)
model PersonalData {
  @doc("Providing demographic information is voluntary and is not a condition of award. You may choose “Do Not Wish to Provide” for any question.")
  @UI.label("Project Director/Principal Investigator")
  projectDirector: Director;

  @UI.label("Co-Project Directors/Co-Principal Investigators")
  @UI.widget(Rendering.Widget.FieldList)
  @maxItems(4)
  coProjectDirector?: Director[];
}

/** The same questions are asked of each person. A refusal is a single answer. */
model Director {
  @UI.label("Name")
  name: Questions.People.PersonName;

  @doc("Select one.")
  @UI.label("Sex")
  gender?: Gender;

  @doc("Choose one or more. Select “Do Not Wish to Provide” by itself.\n\nAmerican Indian or Alaska Native:  A person having origins in any of the original peoples of North, Central, or South America, and who maintains tribal affiliation or community attachment.\n\nAsian: A person having origins in any of the original peoples of the Far East, Southeast Asia, or the Indian subcontinent, including, for example, Cambodia, China, India, Japan, Korea, Malaysia, Pakistan, The Philippine Islands, Thailand, and Vietnam.  (Note, individuals from the Philippine Islands have been recorded as Pacific Islanders in previous data collection strategies.)\n\nBlack or African American:  A person having origins in any of the black racial groups of Africa.\n\nNative Hawaiian or Other Pacific Islander:  A person having origins in any of the original peoples of Hawaii, Guam, Samoa, or other Pacific Islands.\n\nWhite:  A person having origins in any of the original peoples of Europe, the Middle East or North Africa.")
  @UI.label("Race (check all that apply)")
  @UI.widget(Rendering.Widget.MultiSelect)
  @maxItems(5)
  @TypeSpec.JsonSchema.extension("uniqueItems", true)
  @TypeSpec.JsonSchema.extension(
    "allOf",
    #[
      #{
        `if`: #{ contains: #{ `enum`: #["Do Not Wish to Provide"] } },
        then: #{ maxItems: 1 },
      }
    ]
  )
  race?: Race[];

  @doc("Choose one.\n\nHispanic or Latino:  A person of Mexican, Puerto Rican, Cuban, South or Central American, or other Spanish culture or origin, regardless of race.")
  @UI.label("Ethnicity")
  ethnicity?: Ethnicity;

  @doc("Select one or more. Select “None” or “Do Not Wish to Provide” by itself.")
  @UI.label("Disability Status (check all that apply)")
  @UI.widget(Rendering.Widget.MultiSelect)
  @maxItems(4)
  @TypeSpec.JsonSchema.extension("uniqueItems", true)
  @TypeSpec.JsonSchema.extension(
    "allOf",
    #[
      #{
        `if`: #{ contains: #{ `enum`: #["None", "Do Not Wish to Provide"] } },
        then: #{ maxItems: 1 },
      }
    ]
  )
  disabilityStatus?: DisabilityStatus[];

  @doc("Select one.")
  @UI.label("Citizenship")
  citizenship?: Citizenship;
}

enum Gender {
  male: "Male",
  female: "Female",
  doNotWishToProvide: "Do Not Wish to Provide",
}

enum Race {
  americanIndianOrAlaskaNative: "American Indian or Alaska Native",
  asian: "Asian",
  blackOrAfricanAmerican: "Black or African American",
  nativeHawaiianOrOtherPacificIslander: "Native Hawaiian or Other Pacific Islander",
  white: "White",
  doNotWishToProvide: "Do Not Wish to Provide",
}

enum Ethnicity {
  hispanicOrLatino: "Hispanic or Latino",
  notHispanicOrLatino: "Not Hispanic or Latino",
  doNotWishToProvide: "Do Not Wish To Provide",
}

enum DisabilityStatus {
  hearing: "Hearing",
  visual: "Visual",
  mobilityOrthopedicImpairment: "Mobility/Orthopedic Impairment",
  other: "Other",
  none: "None",
  doNotWishToProvide: "Do Not Wish to Provide",
}

enum Citizenship {
  usCitizen: "US Citizen",
  permanentResident: "Permanent Resident",
  otherNonUsCitizen: "Other non-US Citizen",
  doNotWishToProvide: "Do Not Wish to Provide",
}
