import { Grid } from "@trussworks/react-uswds";
import { useTranslations } from "use-intl"
import { OpportunityItem } from "./OpportunityItem";

interface OpportunityAwardOverview {
    programFunding?: string | null;
    expectedAward?: string | null;
    awardMaximum?: string | null;
    awardMinimum?: string | null;
    estimatedAwardDate?: string | null;
    estimatedProjectStartDate?: string | null;
}

type OpportunityAwardOverviewProps = {
    awardOverview: OpportunityAwardOverview;
}

export const OpportunityAwardOverview = (props: OpportunityAwardOverviewProps) => {
    const { programFunding, expectedAward, awardMaximum, awardMinimum, estimatedAwardDate, estimatedProjectStartDate } = props.awardOverview;
    const t = useTranslations('Application.opportunityOverview');

    return (
        <Grid tablet={{ col: 6, }} mobile={{ col: 12 }}>
            <h4 className="font-ui-md text-bold">{t('award')}</h4>
            <dl className="margin-top-0">
                <OpportunityItem opKey={t('programFunding')} opValue={programFunding} />
                <OpportunityItem opKey={t('expectedAward')} opValue={expectedAward} />
                <OpportunityItem opKey={t('awardMaximum')} opValue={awardMaximum} />
                <OpportunityItem opKey={t('awardMinimum')} opValue={awardMinimum} />
                <OpportunityItem opKey={t('estimatedAwardDate')} opValue={estimatedAwardDate} />
                <OpportunityItem opKey={t('estimatedProjectStartDate')} opValue={estimatedProjectStartDate} />
            </dl>
        </Grid>
    )
}