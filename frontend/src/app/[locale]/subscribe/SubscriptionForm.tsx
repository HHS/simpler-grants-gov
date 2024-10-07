'use client';

import React from 'react';

import {
    Button,
    ErrorMessage,
    FormGroup,
    Label,
    TextInput,
} from "@trussworks/react-uswds";

import { useTranslations } from "next-intl";

import { useFormState, useFormStatus } from 'react-dom'
import subscribeEmail from '../../actions';

export default function SubscriptionForm() {
    const t = useTranslations("Subscribe");

    const { pending } = useFormStatus()
    
    const [state, formAction] = useFormState(subscribeEmail, {
        errorMessage: '',
        validationErrors: {}
    });

    const showError = (fieldName: string): boolean => {
        return state?.validationErrors[fieldName] !== undefined;
    }

    return (
        <form action={formAction}>
            <FormGroup error={showError("name")}>
                <Label htmlFor="name">
                    First Name{" "}
                    <span title="required" className="usa-hint usa-hint--required ">
                        (required)
                    </span>
                </Label>
                {showError("name") ? (
                    <ErrorMessage className="maxw-mobile-lg">
                        {state?.validationErrors['name']![0]}
                    </ErrorMessage>
                ) : (
                    <></>
                )}
                <TextInput
                    disabled={pending}
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
                disabled={pending}
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
                        {state?.validationErrors['email']![0]}
                    </ErrorMessage>
                ) : (
                    <></>
                )}
                <TextInput
                     disabled={pending}
                    aria-required
                    type="email"
                    name="email"
                    id="email"
                />
            </FormGroup>
            <div className="display-none">
                <Label htmlFor="hp">HP</Label>
                <TextInput
                    disabled={pending}
                    type="text"
                    name="hp"
                    id="hp"
                />
            </div>
            <Button disabled={pending} type="submit" name="submit" id="submit" className="margin-top-4 margin-bottom-1">
                Subscribe
            </Button>
            {state?.errorMessage.length > 0 ? (<ErrorMessage className="maxw-mobile-lg">
                {state?.errorMessage}
            </ErrorMessage>) : <></>}
        </form>
    )
}