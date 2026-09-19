---
title: "Introducing shuttle"
date: 2019-01-15
summary: "At Lunar Way we have a lot of microservices. Currently, we have around 70 microservices running in our production kubernetes environment along with multiple infrastructure services that provide…"
tags: ["docker", "microservices", "open-source", "technology", "tools"]
canonical: "https://medium.com/@phennex/introducing-shuttle-520df3483882"
source: medium
---
### A CLI for shared build and deploy in a polyglot microservices architecture

![](/blog-images/introducing-shuttle-01.png)

At Lunar Way we have a lot of microservices. Currently, we have around 70 microservices running in our production kubernetes environment along with multiple infrastructure services that provide monitoring, logging, etc. A good deal of them is developed using the same language, architecture, and libraries.

## **Decentralized vs centralized?**

When we started our microservice journey, we chose to go with a decentralized repository strategy (also known as a polyrepo opposed to a monorepo). The main reason for this was a clear separation between services, but also keeping all configuration needed for deployment in one place. The project structure was, therefore, similar to the one below

```
├── <project files>
├── Dockerfile-service
├── Dockerfile-unittest
├── Jenkinsfile
├── Makefile
└── kubernetes
    ├── deployment.sh
    ├── dev
    ├── env.sh
    ├── prod
    ├── secrets.sh
    ├── staging
    └── verify.sh
```

The directories and scripts above are what was replicated between individual service repositories. We used *Makefiles* to create a common interface on top of each service making it easier for developers to move between services.

> However, as the number of microservices grew from the cozy 5–10 services to now 70 services, these replicated scripts became a big problem — and we, therefore, felt the need to do something.

Further, we didn’t want to burden our developers with kubernetes configuration or Dockerfiles if it was not necessary - they can go fast and far with a set of sane defaults.

## **Building a high-level abstraction with centralized configuration**

Instead of drowning ourselves with tedious configuration changes across 70 microservices, we wanted to build a tool that could provide a common higher level of abstraction on service repositories with centralized configuration.

> At Lunar Way we currently have two main types of services; Go and Node.js services. Their pipelines and kubernetes configurations are a bit different, and therefore the tool also needed to support this.

We looked at the multitude of projects for service templating and configuration for kubernetes, such as helm, forge.sh, ksonnet, and many others, but none of them matched our exact need. Many of them were solely focusing on kubernetes and didn’t provide an option to build the generalized abstraction for all the services we needed. This abstraction should, therefore, be able to wrap actions such as code generation for Go, run tests, build docker images, push docker images, and generate kubernetes configuration, and much more.

To include all of these tools and tasks, we needed a dynamic CLI tool that allowed for centralized configuration and customization.

So we started out investigating different ways to build such a tool, and after our research, we came up with the following requirements for our initial iteration:

- It should be easy to iterate on developer tooling and CI scripts without too much replication work across projects
- Projects should specify how they differ from the norm, not how they are alike to limit boilerplate coding
- Scripts for the CI server and for the developers should share as much code as possible, so scripts that run locally would give the same results on the CI
- Testing CI scripts locally should be easy and without pain

> Going over the requirements and options, we eventually found that the tool we needed didn’t exist.

Tada: shuttle!

## **Introducing shuttle**

*shuttle* is a small project, written in Go, that is installed as a binary on a CI server and developer machines.

It acts as the Makefile executor, but with some main differences:

- The targets are stored external to the project (with an optional feature to add some project specific ones internally)
- Variables and configuration are stored internally on the service repository

*shuttle* centralizes shared scripts and configuration, and further, it provides a common abstraction on each service repository. *shuttle* uses a centralized repository for configuration, also called a `plan`.

A simple overview is shown below 👇

![](/blog-images/introducing-shuttle-02.png)

A plan can be comprised of all things imaginable. At Lunar Way we have created 3 different plans, i.e., 3 different plan configuration repositories:

- lw-shuttle-go-plan
- lw-shuttle-node-plan
- lw-shuttle-infrastructure-plan

There are similarities between some of these plans, especially the Go and Node.js plan. In the future, we will like to look into options for sharing actions between plans, but this is a future enhancement. Below is an example of the available scripts in our shuttle Go plan at Lunar Way:

![](/blog-images/introducing-shuttle-03.png)

Let’s turn our attention to the plan repository and its contents. We’ve set up a simple example of a Go project that can be found [here](https://github.com/lunarway/shuttle-example-go-plan).

Let’s have a look at this simple example plan 👀

```yaml
scripts:
  build:
    description: Build the docker image
    actions:
    - shell: shuttle template -o Dockerfile Dockerfile.tmpl
    - shell: docker build -f $tmp/Dockerfile -t $(shuttle get docker.destImage):$(shuttle get docker.destTag) .
  push:
    description: Push the docker image
    actions:
    - shell: docker push $(shuttle get docker.destImage):$(shuttle get docker.destTag)
  test:
    description: Run test for the project
    actions:
    - shell: go test
  deploy: 
    description: Deploys the image to a kubernetes environment
    actions: 
    - shell: shuttle template -o deployment.yaml deployment.tmpl 
    - shell: kubectl apply -f $tmp/deployment.yaml
```

This simple plan provides 4 scripts at the service repository. Now, when you build more and more services you use the same centralized configuration along with custom variables for the given service. If you are interested, the example service repository can be found [here](https://github.com/lunarway/shuttle-example-go-service).

> This was a short introduction to shuttle, why we built it, and how you can leverage it for your own cloud native architecture.

## **Proving the value**

To provide some experience with proving the value of adopting shuttle, we did a lot of testing of different docker and dependency scanning tools. Because our services rely on this centralized configuration, which includes a centralized pipeline, we could easily test 3 different docker container scanning tools at the same time in the pipeline. We could easily test our setup locally because these were just built as shuttle actions. This also demonstrated that we could use shuttle to minimize our Jenkins configurations, and instead move our logic to the service level, and thereby minimizing the job of Jenkins to only invoke shuttle actions. This is awesome!

Because it allows us to change our CI server rather easily because we don’t rely on custom logic. If we compared this test of different security solutions with our old setup with decentralized config, it would have taken ages to get the validation of the different tools that we needed.

> With shuttle we merely just build an action for each tool that ran the scanning, which took a few hours.

## **Future**

We have many ideas to what and where we want to take shuttle, but first and foremost, we think this tool could help a lot of other people finding the right abstraction for their projects. We are thrilled to take contributions in the form of issues, PR’s, ideas, etc.

To read more, and keep yourself posted — please follow us at [GitHub](https://github.com/lunarway/shuttle).

## What is Lunar Way?

Lunar Way is a fintech company motivated by rethinking the experience of banking, and the way people perceive money and spending in general. That is why we are using the most innovative and smart technology in order to create the banking solution for tomorrow directly in our app.

Read more on [lunarway.com](https://lunarway.com/?utm_source=mediumblog&utm_medium=mediumblog)
