import { Metadata } from "next";
import NotFound from "src/app/[locale]/not-found";
import OpportunityListingAPI from "src/app/api/OpportunityListingAPI";
import { OPPORTUNITY_CRUMBS } from "src/constants/breadcrumbs";
import withFeatureFlag from "src/hoc/search/withFeatureFlag";
import { Opportunity } from "src/types/opportunity/opportunityResponseTypes";

import { useTranslations } from "next-intl";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import BetaAlert from "src/components/BetaAlert";
import Breadcrumbs from "src/components/Breadcrumbs";
import OpportunityAwardInfo from "src/components/opportunity/OpportunityAwardInfo";
import OpportunityDescription from "src/components/opportunity/OpportunityDescription";
import OpportunityHistory from "src/components/opportunity/OpportunityHistory";
import { OpportunityHistorySkeleton } from "src/components/opportunity/OpportunityHistorySkeleton";
import OpportunityIntro from "src/components/opportunity/OpportunityIntro";
import OpportunityLink from "src/components/opportunity/OpportunityLink";
import OpportunityStatusWidget from "src/components/opportunity/OpportunityStatusWidget";

// export async function generateMetadata({ params }: { params: { id: string } }) {
//   const t = await getTranslations({ locale: "en" });
//   const id = Number(params.id);
//   let title = `${t("OpportunityListing.page_title")}`;
//   try {
//     const opportunityData = await getOpportunityData(id);
//     title = `${t("OpportunityListing.page_title")} - ${opportunityData.opportunity_title}`;
//   } catch (error) {
//     console.error("Failed to render title");
//   }
//   const meta: Metadata = {
//     title,
//     description: t("OpportunityListing.meta_description"),
//   };
//   return meta;
// }

// async function getOpportunityData(id: number): Promise<Opportunity> {
//   const api = new OpportunityListingAPI();
//   try {
//     const opportunity = await api.getOpportunityById(id);
//     return opportunity.data;
//   } catch (error) {
//     console.error("Failed to fetch opportunity:", error);
//     throw new Error("Failed to fetch opportunity");
//   }
// }

function emptySummary() {
  return {
    additional_info_url: null,
    additional_info_url_description: null,
    agency_code: null,
    agency_contact_description: null,
    agency_email_address: null,
    agency_email_address_description: null,
    agency_name: null,
    agency_phone_number: null,
    applicant_eligibility_description: null,
    applicant_types: [],
    archive_date: null,
    award_ceiling: null,
    award_floor: null,
    close_date: null,
    close_date_description: null,
    estimated_total_program_funding: null,
    expected_number_of_awards: null,
    fiscal_year: null,
    forecasted_award_date: null,
    forecasted_close_date: null,
    forecasted_close_date_description: null,
    forecasted_post_date: null,
    forecasted_project_start_date: null,
    funding_categories: [],
    funding_category_description: null,
    funding_instruments: [],
    is_cost_sharing: false,
    is_forecast: false,
    post_date: null,
    summary_description: null,
    version_number: null,
  };
}

function OpportunityListing({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  unstable_setRequestLocale("en");
  const t = useTranslations("OpportunityListing");
  // Opportunity id needs to be a number greater than 1
  if (isNaN(id) || id < 0) {
    return <NotFound />;
  }

  // const t = await getTranslations({ locale: "en" });
  // const breadcrumbs = Object.assign([], OPPORTUNITY_CRUMBS);

  // let opportunityData = {} as Opportunity;
  // try {
  //   opportunityData = await getOpportunityData(id);
  // } catch (error) {
  //   return <NotFound />;
  // }
  // opportunityData.summary = opportunityData?.summary
  //   ? opportunityData.summary
  //   : emptySummary();

  // // we need to update breadcrumbs to handle it's own async as well
  // breadcrumbs.push({
  //   title: opportunityData.opportunity_title,
  //   path: `/opportunity/${opportunityData.opportunity_id}/`,
  // });

  return (
    <div>
      <BetaAlert />
      {/* <Breadcrumbs breadcrumbList={breadcrumbs} /> */}
      {/* <OpportunityIntro opportunityData={opportunityData} /> */}
      <GridContainer>
        <div className="grid-row grid-gap">
          {/* <div className="desktop:grid-col-8 tablet:grid-col-12 tablet:order-1 desktop:order-first">
              <OpportunityDescription summary={opportunityData.summary} />
              <OpportunityLink opportunityData={opportunityData} />
              </div> */}

          <div className="desktop:grid-col-4 tablet:grid-col-12 tablet:order-0">
            {/* <OpportunityStatusWidget opportunityData={opportunityData} />
              <OpportunityAwardInfo opportunityData={opportunityData} /> */}
            <Suspense
              fallback={<OpportunityHistorySkeleton summary={emptySummary()} />}
            >
              <OpportunityHistory id={id} />
            </Suspense>
          </div>
        </div>
      </GridContainer>
    </div>
  );
}

export default withFeatureFlag(OpportunityListing, "showSearchV0");

/*
<div>
<BetaAlert />
<Breadcrumbs breadcrumbList={breadcrumbs} />
<OpportunityIntro opportunityData={opportunityData} />
<GridContainer>
  <div className="grid-row grid-gap">
    <div className="desktop:grid-col-8 tablet:grid-col-12 tablet:order-1 desktop:order-first">
      <Suspense fallback={<OpportunityDescription summary={{}} />}>
        <OpportunityDescription summary={opportunityData.summary} />
      </Suspense>
      <Suspense fallback={<OpportunityLink opportunityData={{}} />}>
        <OpportunityLink opportunityData={opportunityData} />
      </Suspense>
    </div>

    <div className="desktop:grid-col-4 tablet:grid-col-12 tablet:order-0">
      <Suspense
        fallback={<OpportunityStatusWidget opportunityData={{}} />}
      >
        <OpportunityStatusWidget opportunityData={opportunityData} />
      </Suspense>
      <Suspense fallback={<OpportunityAwardInfo opportunityData={{}} />}>
        <OpportunityAwardInfo opportunityData={opportunityData} />
      </Suspense>
      <Suspense fallback={<OpportunityHistory summary={{}} />}>
        <OpportunityHistory summary={opportunityData.summary} />
      </Suspense>
    </div>
  </div>
</GridContainer>
</div>
*/

// const OpportunitySkeleton = ({ t }: { t: (key: string) => string }) => {
//   return (
//     <div className="grid-row grid-gap">
//       <div className="desktop:grid-col-8 tablet:grid-col-12 tablet:order-1 desktop:order-first">
//         <div className="usa-prose">
//           <h2>{t("description.description")}</h2>
//           <div>--</div>
//           <h2>{t("description.eligible_applicants")}</h2>
//           <p>--</p>
//           <h3>{t("description.additional_info")}</h3>
//           <div>--</div>
//           <h2>{t("description.contact_info")}</h2>
//           <div>--</div>
//           <h3>{t("description.email")}</h3>
//           <p>--</p>
//           <h3>{t("description.telephone")}</h3>
//           <p>--</p>
//         </div>
//         <div className="usa-prose margin-top-2">
//           <h3>{t("link.title")}</h3>
//           <p>--</p>
//         </div>
//       </div>

//       <div className="desktop:grid-col-4 tablet:grid-col-12 tablet:order-0">
//         {/* there should be a status widget placeholder here, need to define what that looks like */}
//         <div className="usa-prose margin-top-2">
//           <h2>{t("award_info.title")}</h2>
//           <Grid row className="margin-top-2 grid-gap-2">
//             <Grid className="margin-bottom-2" tabletLg={{ col: 6 }}>
//               <div className="border radius-md border-base-lighter padding-x-2  ">
//                 <p className="font-sans-sm text-bold margin-bottom-0">--</p>
//                 <p className="desktop-lg:font-sans-sm margin-top-0">
//                   {t(`${"award_info.program_funding"}`)}
//                 </p>
//               </div>
//             </Grid>
//             <Grid className="margin-bottom-2" tabletLg={{ col: 6 }}>
//               <div className="border radius-md border-base-lighter padding-x-2  ">
//                 <p className="font-sans-sm text-bold margin-bottom-0">--</p>
//                 <p className="desktop-lg:font-sans-sm margin-top-0">
//                   {t(`${"award_info.expected_awards"}`)}
//                 </p>
//               </div>
//             </Grid>
//             <Grid className="margin-bottom-2" tabletLg={{ col: 6 }}>
//               <div className="border radius-md border-base-lighter padding-x-2  ">
//                 <p className="font-sans-sm text-bold margin-bottom-0">--</p>
//                 <p className="desktop-lg:font-sans-sm margin-top-0">
//                   {t(`${"award_info.award_ceiling"}`)}
//                 </p>
//               </div>
//             </Grid>
//             <Grid className="margin-bottom-2" tabletLg={{ col: 6 }}>
//               <div className="border radius-md border-base-lighter padding-x-2  ">
//                 <p className="font-sans-sm text-bold margin-bottom-0">--</p>
//                 <p className="desktop-lg:font-sans-sm margin-top-0">
//                   {t(`${"award_info.award_floor"}`)}
//                 </p>
//               </div>
//             </Grid>
//           </Grid>
//           <div>
//             <p className={"text-bold"}>{t("award_info.cost_sharing")}:</p>
//             <div className={"margin-top-0"}>--</div>
//           </div>{" "}
//           <div>
//             <p className={"text-bold"}>
//               {t("award_info.funding_instrument")}:{":"}
//             </p>
//             <div className={"margin-top-0"}>--</div>
//           </div>{" "}
//           <div>
//             <p className={"text-bold"}>
//               {t("award_info.opportunity_category")}:{":"}
//             </p>
//             <div className={"margin-top-0"}>--</div>
//           </div>{" "}
//           <div>
//             <p className={"text-bold"}>
//               {t("award_info.opportunity_category_explanation")}:{":"}
//             </p>
//             <div className={"margin-top-0"}>--</div>
//           </div>{" "}
//           <div>
//             <p className={"text-bold"}>
//               {t("award_info.funding_activity")}:{":"}
//             </p>
//             <div className={"margin-top-0"}>--</div>
//           </div>{" "}
//           <div>
//             <p className={"text-bold"}>
//               {t("award_info.category_explanation")}:{":"}
//             </p>
//             <div className={"margin-top-0"}>--</div>
//           </div>
//         </div>
//         <div className="usa-prose margin-top-4">
//           <h3>{t("history.title")}</h3>
//           <div>
//             <p className={"text-bold"}>{t("version")}:</p>
//             <p className={"margin-top-0"}>--</p>
//           </div>
//           <div>
//             <p className={"text-bold"}>
//               {t("history.posted_date")}
//               {":"}
//             </p>
//             <p className={"margin-top-0"}>--</p>
//           </div>
//           <div>
//             <p className={"text-bold"}>
//               {t("history.closing_date")}
//               {":"}
//             </p>
//             <p className={"margin-top-0"}>--</p>
//           </div>
//           <div>
//             <p className={"text-bold"}>
//               {t("history.archive_date")}
//               {":"}
//             </p>
//             <p className={"margin-top-0"}>--</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
