# Beta.Grants.Gov Architecture

This document is meant to be a living record of the architecture for the beta.grants.gov system. This includes the application, network, and infrastructure architecture, as well as the CI/CD pipeline, and other services and integrations used to support the applications.

At a high level, this system uses Github to maintain the codebase repository and run the CI/CD pipeline, and AWS to host the applications and its supporting services.

## Architecture
This is a general architecture diagram of the beta.grants.gov system.

```mermaid
%%{init: {'theme': 'neutral' } }%%
flowchart TB

    %% AWS Tenant
    subgraph AWS [HHS AWS Tenant]
        shared
        vpc:::az
    end

    %% AWS Shared Services
    subgraph shared [AWS Shared Services]
        ECSC
        iam
        kms
        ssm
        cloudwatch
        ecr
    end

    subgraph iam [Identity Access Managment]
        IAM:::sec
    end

    subgraph kms [Key Management Service]
        KMS:::sec
    end

    subgraph ssm [System Manager]
        SSM:::sec
    end

    subgraph cloudwatch [Logging and Metrics]
        CloudWatch:::sec
    end

    subgraph ecr [Elastic Container Registry]
        ECR:::ecs
    end

    subgraph ECSC [ECS Cluster]
        ECSS["ECS Service
        Fargate Launch Type"]:::ecs
    end
    ECSS --attach parameters to service--> ssm
    ecr --encrypt and decrypt images--> kms
    style ECSC stroke:#FF9900

    %% AWS Services Within VPC
    subgraph vpc ["AWS Virtual Private Cloud (VPC)"]
        direction TB
        public-subnet1:::subnet
        RDS
        AZ1 & AZ2 --> RDS
    end

    class AZ1 az
    class AZ2 az
    vpc --> cloudwatch

    subgraph public-subnet1 [Public Subnet]
        ALB["Application Load Balancer (ALB)"]:::lb --> AZ1 & AZ2
    end

    subgraph AZ1 [Availability zone 1]
        direction TB
        private-subnet1:::subnet
        subgraph private-subnet1 [Private Subnet]
            ECS1:::ecs
            ECS2:::ecs
        end

    end
    subgraph AZ2 [Availability zone 2]
        direction TB
        private-subnet2:::subnet
        subgraph private-subnet2 [Private Subnet]
            ECS3:::ecs
            ECS4:::ecs
        end

    end
    subgraph ECS1 ["ECS Front-End Task (Next.js)"]
        c1[" Docker
        Container 1"]
        c2[" Docker
        Container n"]
    end
    subgraph ECS2 ["ECS Back-End Task (Flask)"]
        c3[" Docker
        Container 1"]
        c4[" Docker
        Container n"]
    end
    subgraph ECS3["ECS Front-End Task (Next.js)"]
        c5[" Docker
        Container 1"]
        c6[" Docker
        Container n"]
    end
    subgraph ECS4 ["ECS Back-End Task (Flask)"]
        c7[" Docker
        Container 1"]
        c8[" Docker
        Container n"]
    end

    subgraph RDS
        subgraph private-subnet3 [Private Subnet]
            DB[("Multi-AZ Grants.gov
            Replica Database")]:::db
            PDB[("Multi-AZ Postgres DB
            for Back End")]:::db
        end
    end
    style RDS stroke:blue,color:blue
    private-subnet3:::subnet

    ecr --> ECSC
    ECSS --> AZ1 & AZ2
    public[Public Internet Users] --> ALB

    %% CI/CD Pipeline
    eng["Developers fas:fa-laptop-code"] --"Push to main branch fas:fa-code-branch"--> GH
    subgraph GH ["Github fab:fa-github"]
        repo[Grants Equity Repo]
        click repo href "https://github.com/HHS/grants-equity" _blank
    end
    GH --Build and Deploys Image--> iam --> ecr
    GH --Restarts task with new Image--> iam --> ECSS


    %% Styles
    classDef ecs fill:#FF9900,color:black
    classDef db fill:blue,color:white
    classDef az color:green,stroke:green,stroke-dasharray: 5 5
    classDef subnet color:darkblue, stroke:darkblue, stroke-dasharray: 5 5
    classDef lb fill:purple, color:white
    classDef sec fill:red,color:white

```

## AWS Hosted Infrastructure
This is an architecture diagram focusing on the AWS shared infrastructure managed by beta.grants.gov

```mermaid
%%{init: {'theme': 'neutral' } }%%
flowchart TD
        %% AWS Tenant
    subgraph AWS [HHS AWS Tenant]
        VPC2:::az
    end

    %% AWS Services Within VPC
    subgraph VPC2 ["AWS Virtual Private Cloud (VPC)"]
        direction LR
        AZ1:::az
        AZ2:::az
        public-subnet1:::subnet
        RDS
        AZ1 & AZ2 --> RDS
    end

    subgraph public-subnet1 [Public Subnet]
        ALB["Application Load Balancer (ALB)"]:::lb --> AZ1 & AZ2
    end

    subgraph AZ1 [Availability zone 1]
        direction TB
        private-subnet1:::subnet
        subgraph private-subnet1 [Private Subnet]
            ECS1:::ecs
            ECS2:::ecs
        end

    end
    subgraph AZ2 [Availability zone 2]
        direction TB
        private-subnet2:::subnet
        subgraph private-subnet2 [Private Subnet]
            ECS3:::ecs
            ECS4:::ecs
        end

    end
    subgraph ECS1 ["ECS Front-End Task (Next.js)"]
        c1[" Docker
        Container 1"]
        c2[" Docker
        Container n"]
    end
    subgraph ECS2 ["ECS Back-End Task (Flask)"]
        c3[" Docker
        Container 1"]
        c4[" Docker
        Container n"]
    end
    subgraph ECS3["ECS Front-End Task (Next.js)"]
        c5[" Docker
        Container 1"]
        c6[" Docker
        Container n"]
    end
    subgraph ECS4 ["ECS Back-End Task (Flask)"]
        c7[" Docker
        Container 1"]
        c8[" Docker
        Container n"]
    end

    subgraph RDS
        subgraph private-subnet3 [Private Subnet]
            DB[("Multi-AZ Grants.gov
            Replica Database")]:::db
            PDB[("Multi-AZ Postgres DB
            for Back End")]:::db
        end
    end
    style RDS stroke:blue,color:blue
    private-subnet3:::subnet

    %% Styles
    classDef ecs fill:#FF9900,color:black
    classDef db fill:blue,color:white
    classDef az color:green,stroke:green,stroke-dasharray: 5 5
    classDef subnet color:darkblue, stroke:darkblue, stroke-dasharray: 5 5
    classDef lb fill:purple, color:white
    classDef sec fill:red,color:white

```

## AWS Shared Services
The beta.grants.gov is using the following non infrastructure shared services in AWS:
- [ECS: Elastic Container Service](https://aws.amazon.com/ecs/)
- [ECR: Elastic Container Registry](https://aws.amazon.com/ecr/)
- [SSM: System Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/what-is-systems-manager.html)
- [IAM: Identity and Access Management](https://aws.amazon.com/iam/)
- [Cloudwatch](https://aws.amazon.com/cloudwatch/)

## CI/CD Pipeline
This is a diagram focusing on the CI/CD pipeline

```mermaid
%%{init: {'theme': 'neutral' } }%%
    flowchart TD
        %% CI/CD Pipeline
        eng["Developers fas:fa-laptop-code"] --"Push to main branch fas:fa-code-branch"--> GH
        subgraph GH ["Github fab:fa-github"]
            repo[Grants Equity Repo]
            click repo href "https://github.com/HHS/grants-equity" _blank
        end
        subgraph AWS[HHS AWS Tenant]
            ECR["AWS
            Elastic Container Repository"]:::ecs
            ECSS["AWS
            Elastic Container Service"]:::ecs
            ECR --> ECSS
        end
        GH --Build and deploys image--> ECR
        GH --Restarts task with new image--> ECSS

        classDef ecs fill:#FF9900,color:black
```

## Relevant ADRs
- [CI/CD Task Runner](../decisions/adr/2023-06-29-ci-cd-task-runner.md)
- [Database Choices](../decisions/adr/2023-07-05-db-choices.md)
- [Front-End Language](../decisions/adr/2023-07-10-front-end-language.md)
- [Front-end Framework](../decisions/adr/2023-07-14-front-end-framework.md)
- [Back-end Language](../decisions/adr/2023-06-30-api-language.md)
- [Back-End Framework](../decisions/adr/2023-07-07-api-framework.md)
