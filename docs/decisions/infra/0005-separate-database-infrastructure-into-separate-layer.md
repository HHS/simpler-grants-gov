# Separate the database infrastructure into a separate layer

* Status: proposed
* Deciders: @lorenyu @kyeah @shawnvanderjagt @rocketnova
* Date: 2023-05-25

## Context and Problem Statement

On many projects, setting up the application and database is a multiple-step iterative process. The infrastructure team will first set up an application service without a database, with a simple application health check. The infrastructure team will then work on setting up the database, configuring the application service to have network access to the database cluster, configuring a the database user that the application will authenticate as and a database user that will run migrations, and providing a way for the application to authenticate. Then the application team will update the healthcheck to call the database.

We want to design the template infrastructure so that each infrastructure layer can be configured and created once rather than needing to revisit prior layers. In other words, we'd like to be able to create the database layer, configure the database users, then create the application layer, without having to go back to make changes to database layer again.

There are some dependencies to keep in mind:

1. The creation of the application service layer depends on the creation of database layer, since a proper application healthcheck will need to hit the database.
2. The database layer includes the creation and configuring of the database users (i.e. PostgreSQL users) that will be used by the application and migration processes in addition to the database cluster infrastructure resources.
3. The network rule that allows inbound traffic to the database from the application depends on both the database and application service.

## Decision Drivers

* Avoid circular dependencies
* Avoid the need to revisit a layer (e.g. database layer, application layer) more than one time during setup of the application environment
* Keep things simple to understand and customize
* Minimize number of steps to set up an environment

## Module Architecture Options

* Option A: Put the database infrastructure in the same root module as the application service
* Option B: Separate the database infrastructure into a separate layer

### Decision Outcome: Separate the database infrastructure into a separate layer

Changes to database infrastructure are infrequent and therefore do not need to be incorporated as part of the continuous delivery process of deploying the application as it would needlessly slow down application deploys and also increase the risk of accidental changes to the database layer. When database changes are needed, they are sometimes complex due to the stateful nature of databases and can require multiple steps to make those changes gracefully. For these changes, it is beneficial to separate them from application resources so that application deploys can remain unaffected. Finally, breaking down the environment setup process into smaller, more linear steps – creating the database first before creating the application service – makes the environment setup process easier to understand and troubleshoot than trying to do create everything at once.

The biggest disadvantage to this approach is ~~the fact that dependencies between root modules cannot be directly expressed in terraform. To mitigate this problem, we should carefully design the interface between root modules to minimize breaking changes in that interface.~~ (Update: 2023-07-07) that dependencies between root modules become more indirect and difficult to express. See [module dependencies](/docs/infra/module-dependencies.md)

## Pros and Cons of the Options

### Option A: Put the database infrastructure in the same root module as the application service

Pros:

* This is what we've typically done in the past. All the infrastructure necessary for the application environment would live in a single root module, with the exception of shared resources like the ECR image repository.

Cons:

* The application service's healthcheck depends on the database cluster to be created and the database user to be provisioned. This cannot easily be done in a single terraform apply.
* Changes to the database infrastructure are often more complex than changes to application infrastructure. Unlike application infrastructure, database changes cannot take the approach of spinning up new infrastructure in desired configuration, redirecting traffic to new infrastructure, then destroying old infrastructure. This is because application infrastructure can be designed to be stateless while databases are inherently stateful. In such cases, making database changes may require careful coordination and block changes to the application infrastructure, potentially including blocking deploys, while the database changes are made.

### Option B: Separate the database infrastructure into a separate layer

Pros:

* Separating the database layer makes explicit the dependency between the database and the application service, and enables an environment setup process that involves only creating resources when all dependencies have been created first.
* Application deploys do not require making requests to the database infrastructure.
* Complex database changes that require multiple steps can be made without negatively impacting application deploys.
* Not all applications require a database. Having the database layer separate reduces the amount of customization needed at the application layer for different systems.

Cons:

* Application resources for a single environment are split across multiple root modules
* Dependencies between root modules cannot be expressed directly in terraform to use terraform's built-in dependency graph. ~~Instead, dependencies between root modules need to be configured from one module's outputs to another module's variable definitions file~~ (Update: 2023-07-07) Instead, dependencies between root modules need to leverage terraform data sources to reference resources across root modules and need to use a shared config module to reference the parameters that can uniquely identify the resource. See [module dependencies](/docs/infra/module-dependencies.md)

## Links

* Refined by [ADR-0009](./0009-separate-app-infrastructure-into-layers.md)
