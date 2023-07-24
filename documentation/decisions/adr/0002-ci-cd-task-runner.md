# Task Runner for the CI / CD Pipeline

- **Status:** Accepted <!-- REQUIRED -->
- **Last Modified:** 2023-06-29 <!-- REQUIRED -->
- **Related Issue:** [ADR: Task Runner and CI / CD interface #92
](https://github.com/HHS/grants-equity/issues/92) <!-- RECOMMENDED -->
- **Deciders:** Lucas Brown, Aaron Couch, Billy Daly <!-- REQUIRED -->
- **Tags:** Continuous Integration, Continuous Deployment <!-- OPTIONAL -->

## Context and Problem Statement

A task runner needs to be selected and an interface described to initiate tasks so that the project can perform necessary testing, linting, other continuous integration tasks, and continous deployment.

The task runner should be able to run on commits and pull requests and support both testing of code and deployment to various environments. The task runner should be able to run tasks within its own environment as well as initiate remote tasks.

## Decision Drivers <!-- RECOMMENDED -->

- **speed:** The task runner should produce fast results compared to other options. Some of the components that produce a speedy result include time to initiate the task, time to prepare environments, speed of running similar types of steps (I.E. spin up docker containers), caching capabilities, and ability to parallelize tasks. The project will not have time to test the speed with different tools.
- **ease of use:** The task runner and interface should be easy to use for developers. Tasks run in the CI tool should be able to be run on local environments where possible. The tool and interface should be well documented. The task runner should have tools, communities, or patterns that make creating new tests or deployments easier.
- **cost:** The task runner should be cost-competitive.
- **security and authorization:** The project should have relevant security credentials like Fedramp authorization and should be authorized specifically for the project.

## Options Considered

- [Github Actions](https://github.com/features/actions) 
- [Travis CI](https://www.travis-ci.com/)
- [Circle CI](https://circleci.com/)

## Decision Outcome <!-- REQUIRED -->

Github Actions offers competitive speed, developer support, shared / resusable actions, is part of Github which is already approved on the project and part of the [Fedramp marketplace](https://marketplace.fedramp.gov/products/FR1812058188), and is free. 

