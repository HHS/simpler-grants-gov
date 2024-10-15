'use client';

import React from 'react';

import {
    ErrorMessage,
    FormGroup,
    Label,
    TextInput,
} from "@trussworks/react-uswds";

import { useTranslations } from "next-intl";

import { useFormState } from 'react-dom'
import subscribeEmail from 'src/app/actions';
import { SubscriptionSubmitButton } from './SubscriptionSubmitButton';

type validationErrors = {
    name?: string[];
    email?: string[];
}

export default function SubscriptionForm() {
    const t = useTranslations("Subscribe");
    
    const [state, formAction] = useFormState(subscribeEmail, {
        errorMessage: '',
        validationErrors: {},
    });

    const showError = (fieldName: string): boolean => {
        if(!state?.validationErrors) return false;

        return (state?.validationErrors[fieldName as keyof validationErrors] !== undefined);
    }

    return (
        <form action={formAction}>
            <FormGroup error={showError("name")}>
                <Label htmlFor="name">
                    {t('form.name') + " "}
                    <span title="required" className="usa-hint usa-hint--required ">
                        ({t('form.req')})
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
                    aria-required
                    type="text"
                    name="name"
                    id="name"
                />
            </FormGroup>
            <Label htmlFor="LastName">
                {t('form.lastName') + " "}
                <span title="optional" className="usa-hint usa-hint--optional ">
                    ({t('form.opt')})
                </span>
            </Label>
            <TextInput
                type="text"
                name="LastName"
                id="LastName"
            />
            <FormGroup error={showError("email")}>
                <Label htmlFor="email">
                    {t('form.email') + " "}
                    <span title="required" className="usa-hint usa-hint--required ">
                        ({t('form.req')})
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
            <SubscriptionSubmitButton />
            {state?.errorMessage?.length > 0 ? (<ErrorMessage className="maxw-mobile-lg">
                {state?.errorMessage}
            </ErrorMessage>) : <></>}
        </form>
    )
}
