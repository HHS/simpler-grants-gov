import { Meta } from "@storybook/react";

import { OpportunityOverviewCard } from "src/components/application/OpportunityOverviewCard";

const ApplicationPage = () => {
    return (
        <>
            <OpportunityOverviewCard />
        </>
    )

}

const meta: Meta<typeof ApplicationPage> = {
    title: "Pages/Application",
    component: ApplicationPage,
};

export default meta;

export const Default = {};
