'use client'

import React from 'react'

import { Button } from '@trussworks/react-uswds'
import { useFormStatus } from 'react-dom'

export function SubscriptionSubmitButton() {
    // Note: This was split out into seperate component so that it can be disabled when the form is pending
    // useFormStatus requires being a child of a form.
    const { pending } = useFormStatus()

    return (
        <Button disabled={pending} type="submit" name="submit" id="submit" className="margin-top-4 margin-bottom-1">
            Subscribe
        </Button>
    )
}