# Deliverable dependencies

This document tracks the dependencies amongst deliverables in our [product roadmap](https://github.com/orgs/HHS/projects/12).

## About the diagram

The diagram is generated using a [Python script](https://github.com/HHS/simpler-grants-gov/tree/main/.github/linters/deps_mapping) that fetches the issues from the GitHub project and generates a diagram of the dependencies between them.

That script is triggered by a [GitHub Action](../.github/workflows/deps-mapping-repo.yml) that is scheduled to run every Monday at midnight UTC, with an option to trigger it manually.

## Dependency diagram

Here are the dependencies amongst deliverables:

```mermaid

flowchart LR

  %% ─────────────────────────────
  %% Styles
  %% ─────────────────────────────
  classDef default fill:#fff,stroke:#333,stroke-width:1px,color:#000,rx:5,ry:5
  classDef InProgress fill:#e1f3f8,stroke:#07648d,stroke-width:2px,color:#000
  classDef Done fill:#8DE28D,stroke:#204e34,stroke-width:3px,color:#000
  style Canvas fill:transparent,stroke:#171716
  style Legend fill:#F7F7F4,stroke:#171716
  style simplerfind fill:#F7F7F4,stroke:#171716
  style simplerengagement fill:#F7F7F4,stroke:#171716
  style simplerapply fill:#F7F7F4,stroke:#171716
  style simplerplatform fill:#F7F7F4,stroke:#171716
  style simplerreporting fill:#F7F7F4,stroke:#171716
  style simplerdelivery fill:#F7F7F4,stroke:#171716
  style commongrants fill:#F7F7F4,stroke:#171716
  style simplernofos fill:#F7F7F4,stroke:#171716
  style other fill:#F7F7F4,stroke:#171716

  %% ─────────────────────────────
  %% Legend
  %% ─────────────────────────────
  subgraph Legend["Key"]
    direction LR
    k1["Todo"]
    k2["In progress 🛠️ "]:::InProgress
    k3["Done ✔️"]:::Done

    k1 -.-> k2 -.-> k3
  end

  %% ─────────────────────────────
  %% Main canvas
  %% ─────────────────────────────
  subgraph Canvas["Dependencies"]
    direction LR


    subgraph simplerfind["🔎 SimplerFind"]
    direction LR
        HHS/simpler-grants-gov#2200["Search * ✔️"]:::Done
        HHS/simpler-grants-gov#2203["Opportunity Listing * ✔️"]:::Done
        HHS/simpler-grants-gov#2875["Search/Opportunity Listing v2 * ✔️"]:::Done
        HHS/simpler-grants-gov#3045["Full Support for Opportunity Attachments (NOFOs) * ✔️"]:::Done
        HHS/simpler-grants-gov#3525["Opportunity Email Notifications ✔️"]:::Done
        HHS/simpler-grants-gov#4571["Promote Simpler Search * ✔️"]:::Done
        HHS/simpler-grants-gov#4576["Permissions & Workflow Research ✔️"]:::Done
        HHS/simpler-grants-gov#5964["User Profile & Permissions * ✔️"]:::Done
        HHS/simpler-grants-gov#5969["Simpler Search as Default ✔️"]:::Done
        HHS/simpler-grants-gov#7830["Improve users’ confidence in choosing competitive, relevant opportunities : SGG * ✔️"]:::Done
        HHS/simpler-grants-gov#7906["Reducing the burden of starting an application : SGG ✔️"]:::Done
    end


    subgraph simplerengagement["💬 SimplerEngagement"]
    direction LR
        HHS/simpler-grants-gov#2204["Engagement Sessions * ✔️"]:::Done
        HHS/simpler-grants-gov#2215["Quad 1 Big Demo ✔️"]:::Done
        HHS/simpler-grants-gov#2348["Cross-program collaboration tools ✔️"]:::Done
        HHS/simpler-grants-gov#3314["Open Source Community Growth ✔️"]:::Done
        HHS/simpler-grants-gov#3654["Co-Design Quad 2 ✔️"]:::Done
        HHS/simpler-grants-gov#4526["Participatory budgeting tools ✔️"]:::Done
        HHS/simpler-grants-gov#4574["Communications Content Strategy ✔️"]:::Done
        HHS/simpler-grants-gov#4577["Open Source Community Growth Quad 3 ✔️"]:::Done
        HHS/simpler-grants-gov#4578["Co-Design Quad 3 ✔️"]:::Done
        HHS/simpler-grants-gov#5966["Open Source Developer Experience ✔️"]:::Done
        HHS/simpler-grants-gov#5968["Co-design Group Quad 4 ✔️"]:::Done
        HHS/simpler-grants-gov#5971["Site Content Transition & Management ✔️"]:::Done
        HHS/simpler-grants-gov#5972["Public communications ✔️"]:::Done
        HHS/simpler-grants-gov#7789["Open Source Developer Experience : SGG/SGM ✔️"]:::Done
        HHS/simpler-grants-gov#7790["Co-Planning Quad 5 : SGG ✔️"]:::Done
        HHS/simpler-grants-gov#7803["Co-Design Quad 5 : SGG & SGM ✔️"]:::Done
    end


    subgraph simplerapply["📋 SimplerApply"]
    direction LR
        HHS/simpler-grants-gov#2213["Account creation workflow (design) ✔️"]:::Done
        HHS/simpler-grants-gov#2640["Authenticate via Login.gov ✔️"]:::Done
        HHS/simpler-grants-gov#3348["Simpler Application Workflow * ✔️"]:::Done
        HHS/simpler-grants-gov#3526["Simpler User Registration ✔️"]:::Done
        HHS/simpler-grants-gov#4572["Simpler Application Workflow Pilot * ✔️"]:::Done
        HHS/simpler-grants-gov#4575["SOAP Proxy/Router for Apply APIs * ✔️"]:::Done
        HHS/simpler-grants-gov#5961["Scale Apply User Workflow * ✔️"]:::Done
        HHS/simpler-grants-gov#5965["Scale Apply Pilot Form Repository & Generation * ✔️"]:::Done
        HHS/simpler-grants-gov#5970["Enable Grantor Agencies to Fetch Applications ✔️"]:::Done
        HHS/simpler-grants-gov#7831["Scale Opportunity Coverage and Form Creation : SGG * ✔️"]:::Done
        HHS/simpler-grants-gov#7832["Smarter, Easier Budget Forms : SGG * ✔️"]:::Done
        HHS/simpler-grants-gov#7833["Making applications easier to fill out : SGG ✔️"]:::Done
    end


    subgraph simplerplatform["⚙ SimplerPlatform"]
    direction LR
        HHS/simpler-grants-gov#2214["Simpler.Grants.gov brand launch ✔️"]:::Done
        HHS/simpler-grants-gov#2224["Load testing for scale ✔️"]:::Done
        HHS/simpler-grants-gov#2226["Translation of a static site page ✔️"]:::Done
        HHS/simpler-grants-gov#3755["Simpler SOAP Proxy/Router ✔️"]:::Done
        HHS/simpler-grants-gov#4573["Tech Scaling ✔️"]:::Done
        HHS/simpler-grants-gov#4579["Automated API Key Management for External Users ✔️"]:::Done
    end


    subgraph simplerreporting["📊 SimplerReporting"]
    direction LR
        HHS/simpler-grants-gov#2225["Public Metabase Dashboard ✔️"]:::Done
        HHS/simpler-grants-gov#2347["Cross-program delivery metrics ✔️"]:::Done
        HHS/simpler-grants-gov#2902["Program-level KPIs ✔️"]:::Done
        HHS/simpler-grants-gov#3377["Delivery Metrics 2.0 ✔️"]:::Done
        HHS/simpler-grants-gov#4354["Dashboard version control ✔️"]:::Done
        HHS/simpler-grants-gov#7310["Delivery metrics: Scale reporting for SGM ✔️"]:::Done
    end


    subgraph simplerdelivery["SimplerDelivery"]
    direction LR
        HHS/simpler-grants-gov#2356["Cross-program product strategy (Quad 2) ✔️"]:::Done
        HHS/simpler-grants-gov#2357["Cross-program team health ✔️"]:::Done
        HHS/simpler-grants-gov#2903["Deliverable linting and mapping ✔️"]:::Done
        HHS/simpler-grants-gov#3688["P&D Work Catch All - Quad 3 ✔️"]:::Done
        HHS/simpler-grants-gov#6265["P&D catch-all: Quad 4 ✔️"]:::Done
    end


    subgraph commongrants["💱 CommonGrants"]
    direction LR
        HHS/simpler-grants-gov#2901["Grant protocol specification * ✔️"]:::Done
        HHS/simpler-grants-gov#4352["CommonGrants - Apply workflow * ✔️"]:::Done
        HHS/simpler-grants-gov#4353["CommonGrants - Developer tools ✔️"]:::Done
        HHS/simpler-grants-gov#5892["CommonGrants: Co-Planning * ✔️"]:::Done
        HHS/simpler-grants-gov#6195["CommonGrants: Form library ✔️"]:::Done
        HHS/simpler-grants-gov#6201["CommonGrants: Schema versioning ✔️"]:::Done
        HHS/simpler-grants-gov#7309["CommonGrants: Extension framework * ✔️"]:::Done
        HHS/simpler-grants-gov#7311["CommonGrants: Community stewardship ✔️"]:::Done
        HHS/simpler-grants-gov#8692["CommonGrants: New routes and models ✔️"]:::Done
        HHS/simpler-grants-gov#8757["CommonGrants: Community Stewardship & Co-Planning ✔️"]:::Done
        HHS/simpler-grants-gov#8765["CommonGrants: SDK Plugin Enhancements * ✔️"]:::Done
        HHS/simpler-grants-gov#8766["CommonGrants: Release Management & Developer Experience ✔️"]:::Done
        HHS/simpler-grants-gov#8772["CommonGrants: Awards Promotion & Adoption 🛠️"]:::InProgress
        HHS/simpler-grants-gov#8774["CommonGrants: Community Contribution * 🛠️"]:::InProgress
        HHS/simpler-grants-gov#8777["CommonGrants: API Versioning & Migration 🛠️"]:::InProgress
    end


    subgraph simplernofos["📣 SimplerNOFOs"]
    direction LR
        HHS/simpler-grants-gov#5688["SNOFO - User Research & Eval Quad 3 ✔️"]:::Done
        HHS/simpler-grants-gov#5689["SNOFO - User Research & Eval Quad 4 ✔️"]:::Done
        HHS/simpler-grants-gov#5690["SNOFO - User Research & Eval Quad 5 ✔️"]:::Done
    end


    subgraph other["Other"]
    direction LR
        HHS/simpler-grants-gov#7276["ADR for Workflow Management Service ✔️"]:::Done
        HHS/simpler-grants-gov#7277["Research on consolidating into a single ATO ✔️"]:::Done
        HHS/simpler-grants-gov#7278["Strategy for SGM Infrastructure Setup ✔️"]:::Done
        HHS/simpler-grants-gov#7281["Grantor Login with PIV Required ✔️"]:::Done
        HHS/simpler-grants-gov#7282["Technical Strategy and POC for NOFO Builder Integration with SGG ✔️"]:::Done
        HHS/simpler-grants-gov#7696["TENT: Quad 6 Deliverable ✔️"]:::Done
        HHS/simpler-grants-gov#7795["Award Recommendation Research & Prototype for Discretionary Grants : SGM * ✔️"]:::Done
        HHS/simpler-grants-gov#7796["Notice of Award for Discretionary Grants Research : SGM ✔️"]:::Done
        HHS/simpler-grants-gov#7799["Workflow Management Research and Prototype : SGM * ✔️"]:::Done
        HHS/simpler-grants-gov#7801["Content Management System (CMS) Pilot : SGG & SGM ✔️"]:::Done
        HHS/simpler-grants-gov#7802["Introduce Connectivity between SGM and GrantSolutions environments : SGM ✔️"]:::Done
        HHS/simpler-grants-gov#7804["End-to-End Testing Framework for Application Coverage : SGG & SGM ✔️"]:::Done
        HHS/simpler-grants-gov#7806["Opportunity Publishing Prototype : SGM * ✔️"]:::Done
        HHS/simpler-grants-gov#7808["NOFO Builder Integration : SGM ✔️"]:::Done
        HHS/simpler-grants-gov#7829["Expanded SOAP/Proxy for Streamlined Application Data : SGG & SGM ✔️"]:::Done
        HHS/simpler-grants-gov#7865["Public Communications : SGG & SGM ✔️"]:::Done
        HHS/simpler-grants-gov#8256["SGM Branding ✔️"]:::Done
        HHS/simpler-grants-gov#9594["Strategy for Deprecation of Classic Search by the End of 2026 [SGG] * ✔️"]:::Done
        HHS/simpler-grants-gov#10058["Open Source Developer Experience [SGM/SGG] ✔️"]:::Done
        HHS/simpler-grants-gov#10149["Enable Grantors to post application packages with opportunities [SGM] * ✔️"]:::Done
        HHS/simpler-grants-gov#10151["NOFO Authoring & Development lifecycle research - Discovery, scoping, and wireframe validation [SGM] ✔️"]:::Done
        HHS/simpler-grants-gov#10154["Grantor Programs User Permissions Research and Proof of Concept [SGM] ✔️"]:::Done
        HHS/simpler-grants-gov#10162["End-to-End Award Recommendation Prototype with Bulk Action for Discretionary Grants [SGM] * ✔️"]:::Done
        HHS/simpler-grants-gov#10163["Notice of Award Backend Architecture Planning and Design [SGM] ✔️"]:::Done
        HHS/simpler-grants-gov#10221["Cross-Product Navigation and Dual Branding [SGM] ✔️"]:::Done
        HHS/simpler-grants-gov#10222["Separate Backend and Infrastructure Are Setup for SGM [SGM] * ✔️"]:::Done
        HHS/simpler-grants-gov#10256["Scale Competition support and operations  [SGG] * ✔️"]:::Done
        HHS/simpler-grants-gov#10257["Supporting core features to expand agency support [SGG] * ✔️"]:::Done
        HHS/simpler-grants-gov#10259["Making forms and applications easier to complete [SGG] ✔️"]:::Done
        HHS/simpler-grants-gov#10272["Research and gap analysis for scaling applicant adoption [SGG] ✔️"]:::Done
        HHS/simpler-grants-gov#10295["Public Communications [SGG/SGM] ✔️"]:::Done
        HHS/simpler-grants-gov#10329["Co-Design Group Cohort 3 [SGG] ✔️"]:::Done
        HHS/simpler-grants-gov#10330["Power Users group [SGM] ✔️"]:::Done
        HHS/simpler-grants-gov#10894["SNOFO - User Research & Eval Quad 6 ✔️"]:::Done
        HHS/simpler-grants-gov#11436["Simpler.Grants.gov to Grants.gov transition ✔️"]:::Done
    end


    %% ─────────────────────────────
    %% Relationships
    %% ─────────────────────────────
    HHS/simpler-grants-gov#4353 --> HHS/simpler-grants-gov#7309
    HHS/simpler-grants-gov#4353 --> HHS/simpler-grants-gov#6201
    HHS/simpler-grants-gov#5892 --> HHS/simpler-grants-gov#7311
    HHS/simpler-grants-gov#5892 --> HHS/simpler-grants-gov#6195
    HHS/simpler-grants-gov#6201 --> HHS/simpler-grants-gov#6195

  end

```
