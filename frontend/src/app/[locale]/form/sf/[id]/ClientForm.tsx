"use client";
import React, { useState } from 'react';
import { JsonForms } from '@jsonforms/react';
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers';

const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
    },
    done: {
      type: 'boolean',
    },
    due_date: {
      type: 'string',
      format: 'date',
    },
    recurrence: {
      type: 'string',
      enum: ['Never', 'Daily', 'Weekly', 'Monthly'],
    },
  },
  required: ['name', 'due_date'],
};
const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      label: false,
      scope: '#/properties/done',
    },
    {
      type: 'Control',
      scope: '#/properties/name',
    },
    {
      type: 'HorizontalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/due_date',
        },
        {
          type: 'Control',
          scope: '#/properties/recurrence',
        },
      ],
    },
  ],
};

function ClientForm() {
  const [formData, setFormData] = useState({});
  console.log(formData);

  return (
    <JsonForms
      schema={schema}
      uischema={uischema}
      data={formData}
      renderers={vanillaRenderers}
      cells={vanillaCells}
      onChange={({ data, _errors }) => setFormData(data)}
    />
  );
}

export default ClientForm;