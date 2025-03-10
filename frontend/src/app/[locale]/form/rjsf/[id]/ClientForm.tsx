"use client";
import { withTheme, ThemeProps } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema } from '@rjsf/utils';
import { Label, TextInput } from '@trussworks/react-uswds';
import { useState } from 'react';

const theme: ThemeProps = { widgets: { textarea: ({value}) => <><Label htmlFor="input-type-text">Text input label</Label><TextInput value={value} id="input-type-text" name="input-type-text" type="text" /></> } };

const ThemedForm = withTheme(theme);


const ClientForm = ({schema, uiSchema}:{schema: object, uiSchema: RJSFSchema}) => {

    const [formData, setFormData] = useState(null);
    console.log(formData);
    return (

        <ThemedForm
            uiSchema={uiSchema}
            formData={formData}
            onChange={(e) => setFormData(e.formData)}
            schema={schema}
            validator={validator}/>
    )
}

export default ClientForm;