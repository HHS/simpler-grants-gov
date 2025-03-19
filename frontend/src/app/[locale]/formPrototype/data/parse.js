import fs from "fs";
import csv from "fast-csv";

const fileName = "SF424_Individual_2_0-V2.0_F668/Form DAT-Table 1.csv";

const stream = fs.createReadStream(fileName);

const formSchema = {
  type: "object",
  title: "Application For Federal Assistance SF 424 - Individual",
  properties: {},
};

const uiSchema = [];

const numberFields = ["OppprtunityID", ""];

const getFormatType = (dataType, businessRules, fieldImplementation, name) => {
  switch (dataType) {
    case "AN":
      if (businessRules === "E-mail Validation") {
        return { type: "string", format: "email", enumerator: null };
      }
      if (name in numberFields) {
        return { type: "number", format: null, enumerator: null };
      }
      return { type: "string", format: null };
    case "Date":
    case "DATE":
      return { type: "string", format: "date", enumerator: null };
    case "LIST":
      if (fieldImplementation === "Radio") {
        return { type: "string", enumerator: ["Yes", "No"] };
      } else {
        return { type: "string", format: null, enumerator: null };
      }
    default:
      if (fieldImplementation === "Check") {
        return { type: "string", format: null, enumerator: ["Yes", "No"] };
      }
      return { type: "string", format: null, enumerator: null };
  }
};

const getValues = (data) => {
  const title = data[2];
  const required = data[3];
  const name = data[6];
  const minLength = data[13];
  const maxLength = data[14];
  const businessRules = data[10];
  const dataType = data[11];
  const fieldImplementation = data[15];
  return {
    title,
    required,
    name,
    minLength,
    maxLength,
    businessRules,
    dataType,
    fieldImplementation,
  };
};

const requiredFields = [];

function createFormSchema() {
  csv
    .parseStream(stream, { skipRows: 6 })
    .on("data", (data) => {
      const {
        title,
        required,
        name,
        minLength,
        maxLength,
        businessRules,
        dataType,
        fieldImplementation,
      } = getValues(data);
      const { type, format, enumerator } = getFormatType(
        dataType,
        businessRules,
        fieldImplementation,
      );

      const row = {
        title,
        type,
        name,
      };
      if (format) {
        row.format = format;
      }
      if (enumerator) {
        row.enum = enumerator;
      }
      if (minLength) {
        row.minLength = Number(minLength);
      }
      if (maxLength) {
        row.maxLength = Number(maxLength);
      }
      if (name) {
        if (name === "OpportunityID") {
          row.type = "number";
        }
        if (name === "AuthorizedRepresentativeEmail") {
          row.format = "email";
        }
        formSchema.properties[name] = row;
        if (required === "Yes") {
          requiredFields.push(name);
        }
      }
    })
    .on("end", () => {
      console.log("done");
      formSchema.required = requiredFields;
      fs.writeFileSync("formSchema.json", JSON.stringify(formSchema, null, 2));
    });
}

function createUiSchema() {
  let fieldNumber = 0;
  csv
    .parseStream(stream, { skipRows: 6 })
    .on("data", (data) => {
      const { title, name, fieldImplementation } = getValues(data);
      fieldNumber = data[0].match(/^\d[a-z]?/)[0];

      if (
        (!name && fieldImplementation === "Label") ||
        fieldImplementation === "Check"
      ) {
        const section = {
          type: "section",
          label: title.replace(/ Header/, ""),
          name: title.replace(/ /g, ""),
          number: fieldNumber,
          children: [],
        };
        uiSchema.push(section);
      } else {
        if (!name) {
          return;
        }
        const row = {
          type: "field",
          definition: `/properties/${name}`,
        };
        if (
          // eslint-disable-next-line array-callback-return
          uiSchema.find((item, i) => {
            if (item.number === fieldNumber) {
              item.children.push(row);
              return true;
            }
          })
        ) {
          /* empty */
        } else {
          uiSchema.push(row);
        }
      }
    })
    .on("end", () => {
      console.log("done!!!");
      fs.writeFileSync("uiSchema.json", JSON.stringify(uiSchema, null, 2));
    });
}

createFormSchema();
createUiSchema();