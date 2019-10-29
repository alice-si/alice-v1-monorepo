# Alice monorepo

<!-- Disabled for now, as we have no credits on circle ci -->
<!-- You have used 0/2,500 credits. Free credits will refresh on Sunday, October 27 12:00 AM UTC. -->
<!-- [![CircleCI](https://circleci.com/gh/alice-si/monorepo.svg?style=svg)](https://circleci.com/gh/alice-si/monorepo) -->

## Overview

This is the top-level monorepo for Alice donations platform and other projects.
Please refer to individual projects' README files for detailed description.

## Building

You should have Yarn installed.

After you have cloned the repo, you should install dependencies with
`yarn`.

Then, navigate to the project of interest and follow the instructions in
its README file.


## GraphQL API
We offer public access to projects, outcomes and donations data.
GraphQL endpoint is opened on 
  - https://api.alice.si/graphql
  - https://api.stage.alice.si/graphql


You can check our [graphql schema](packages/donations-app/devServer/graphql/schema.graphql)

#### GraphQL example queries
```graphql
# It queries all available data about projects
{
  allProjects {
    code
    title
    charity
    validator
    status
    _outcomes {
      _id
      title
      description
      costPerUnit
    }
  }
}

# It queries donations for the selected project
{
  getDonations(projectCode: "save-from-abuse") {
    _id
    amount
    createdAt
  }
}
```
