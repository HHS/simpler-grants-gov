'use server'

import { z } from 'zod'
import { environment } from '../constants/environments'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server';

// this function is a Next.js server action!
export default async function subscribeEmail(prevState: any, formData: FormData) {
    const t = await getTranslations("Subscribe");

    const schema = z.object({
        name: z.string().min(1, {
            message: t('errors.missing_name'),
        }),
        email: z.string().min(1, {
            message: t('errors.missing_email'),
        }).email({
            message: t('errors.invalid_email'),
        }),
    })
    
    const validatedFields = schema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
    })

    // Return early if the form data is invalid (server side validation!)
    if (!validatedFields.success) {
        return {
            errorMessage: '',
            validationErrors: validatedFields.error.flatten().fieldErrors,
        }
    }

    // hp = honeypot, if this field is filled in, the form is likely spam
    // https://sendy.co/api
    const rawFormData = {
        name: formData.get('name') as string,
        LastName: formData.get('LastName') as string,
        email: formData.get('email') as string,
        hp: formData.get('hp') as string,
    }

    console.log('Server Action: TODO - Subscribe a user entered email to a email sending service (sendy?)')
    console.log('Form Data:', rawFormData)

    // TODO: Implement the email subscription logic here, putting old SENDY code here for reference
    // Note: Noone is sure where the api url/key/list ID are at the moment and I believe the intention is
    // to move away from SENDY to a different service.
    try {
        const sendyApiUrl = environment.SENDY_API_URL;
        const sendyApiKey = environment.SENDY_API_KEY;
        const list = environment.SENDY_LIST_ID;
        const requestData = {
            list,
            subform: "yes",
            boolean: "true",
            api_key: sendyApiKey,
            hp: rawFormData.hp,
            name: rawFormData.name,
            LastName: rawFormData.LastName,
            email: rawFormData.email,
        };

        const sendyResponse = await fetch(`${sendyApiUrl}/subscribe`, {
            method: "POST",
            headers: {
                "Content-type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(requestData),
        });

        const responseData = await sendyResponse.text();

        if (!sendyResponse.ok || !["1", "true"].includes(responseData)) {
            return {
                errorMessage: 'Failed to subscribe user due to a server error. Try again later.',
                validationErrors: {},
            }
        }
    } catch (error) {
        console.error("Error subscribing user:", (<Error>error).message);
        return {
            errorMessage: 'Internal Server Error',
            validationErrors: {},
        }
    }

    // Navigate to the sub confirmation page if no error returns short circuit the function
    redirect(`/subscribe/confirmation`) 
}
