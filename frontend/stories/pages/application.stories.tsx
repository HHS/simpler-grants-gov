import { Meta } from "@storybook/react";

import { OpportunityCard } from "src/components/application/OpportunityCard";

const ApplicationPage = () => {
    return (
        <>
            <OpportunityCard />
        </>
    )

}

const meta: Meta<typeof ApplicationPage> = {
    title: "Pages/Application",
    component: ApplicationPage,
};

export default meta;

export const Default = {};
