"use client";

import { JsonForms } from "@jsonforms/react";
import { vanillaCells, vanillaRenderers } from "@jsonforms/vanilla-renderers";

import React, { useState } from "react";

import TextCell from "./renderers/TextCell";
import TextCellControlTester from "./renderers/TextCellControlTester";

const uischema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      label: true,
      scope: "#/properties/CFDANumber",
    },
    {
      type: "Control",
      label: true,
      scope: "#/properties/FederalAgency",
    },

    {
      type: "HorizontalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/OpportunityID",
        },
        {
          type: "Control",
          scope: "#/properties/OpportunityTitle",
        },
      ],
    },
  ],
};

const renderers = [
  ...vanillaRenderers,
  //register custom renderers
  { tester: TextCellControlTester, renderer: TextCell },
];
console.log(renderers);
function ClientForm({ jsonFormSchema }: { jsonFormSchema: object }) {
  const [formData, setFormData] = useState({});
  console.log(formData);

  return (
    <JsonForms
      schema={jsonFormSchema}
      uischema={uischema}
      data={formData}
      renderers={renderers}
      cells={vanillaCells}
      onChange={({ data, _errors }) => setFormData(data)}
    />
  );
}

export default ClientForm;
