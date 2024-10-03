import React from 'react';

import {
    Button,
    ErrorMessage,
    FormGroup,
    Label,
    TextInput,
} from "@trussworks/react-uswds";

import { useTranslations } from "next-intl";

export default function SubscriptionForm() {
    const t = useTranslations("Subscribe");

    const validateField = (fieldName: string) => {
        return "valid";
    };

    const showError = (fieldName: string): boolean => false

    async function subscribeAction(formData: FormData) {
        // Server Action
        'use server';

        console.log('server action!!')

        const rawFormData = {
            name: formData.get('name'),
            LastName: formData.get('LastName'),
            email: formData.get('email'),
            hp: formData.get('hp'),
        }

        console.log(rawFormData)
      }

    return (
        <form action={subscribeAction}>
            <FormGroup error={showError("name")}>
                <Label htmlFor="name">
                    First Name{" "}
                    <span title="required" className="usa-hint usa-hint--required ">
                        (required)
                    </span>
                </Label>
                {showError("name") ? (
                    <ErrorMessage className="maxw-mobile-lg">
                        {validateField("name")}
                    </ErrorMessage>
                ) : (
                    <></>
                )}
                <TextInput
                    aria-required
                    type="text"
                    name="name"
                    id="name"
                />
            </FormGroup>
            <Label htmlFor="LastName" hint=" (optional)">
                Last Name
            </Label>
            <TextInput
                type="text"
                name="LastName"
                id="LastName"
            />
            <FormGroup error={showError("email")}>
                <Label htmlFor="email">
                    Email{" "}
                    <span title="required" className="usa-hint usa-hint--required ">
                        (required)
                    </span>
                </Label>
                {showError("email") ? (
                    <ErrorMessage className="maxw-mobile-lg">
                        {validateField("email")}
                    </ErrorMessage>
                ) : (
                    <></>
                )}
                <TextInput
                    aria-required
                    type="email"
                    name="email"
                    id="email"
                />
            </FormGroup>
            <div className="display-none">
                <Label htmlFor="hp">HP</Label>
                <TextInput
                    type="text"
                    name="hp"
                    id="hp"
                />
            </div>
            <Button type="submit" name="submit" id="submit" className="margin-top-4">
                Subscribe
            </Button>
        </form>
    )
}