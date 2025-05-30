import { Grid } from "@trussworks/react-uswds"
import { OpportunityItem } from "./OpportunityItem"
import { useTranslations } from "next-intl";

interface OpportunityOverview {
    name?: string | null,
    number?: string | null,
    posted?: string | null,
    agency?: string | null,
    assistanceListings?: string | null,
    costSharingOrMatchingRequirement?: string | null,
    applicationInstruction?: string | null,
    grantorContactInfomation?: string | null
}

type OpportunityOverviewProps = {
    overview: OpportunityOverview
}

export const OpportunityOverview = (props: OpportunityOverviewProps) => {
    const {
        name,
        number,
        posted,
        agency,
        assistanceListings,
        costSharingOrMatchingRequirement,
        applicationInstruction,
        grantorContactInfomation
    } = props.overview
    const t = useTranslations("Application.opportunityOverview");

    return (
        <Grid tablet={{ col: 6 }} mobile={{ col: 12 }} >
            <dl className="margin-top-0">
                <OpportunityItem opKey={t('name')} opValue={name} />
                <OpportunityItem opKey={t('number')} opValue={number} />
                <OpportunityItem opKey={t('posted')} opValue={posted} />
                <OpportunityItem opKey={t('agency')} opValue={agency} />
                <OpportunityItem opKey={t('assistanceListings')} opValue={assistanceListings} />
                <OpportunityItem opKey={t('costSharingOrMatchingRequirement')} opValue={costSharingOrMatchingRequirement} />
                <OpportunityItem opKey={t('applicationInstruction')} opValue={applicationInstruction} />
                <OpportunityItem opKey={t('grantorContactInfomation')} opValue={grantorContactInfomation} />
            </dl>
        </Grid>
    )
}
