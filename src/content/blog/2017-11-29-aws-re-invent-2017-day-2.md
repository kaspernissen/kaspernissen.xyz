---
title: "AWS re:invent 2017 — day 2"
date: 2017-11-29
summary: "The second day of breakout sessions. Crazy walk-up line before the first session of the day with Sam Newman on Building Microservices on AWS. Luckily I got up early and queued up 70 minutes before…"
tags: ["aws", "docker", "reinvent"]
canonical: "https://medium.com/kubecloud/aws-re-invent-2017-day-2-5d4c113a70de"
source: medium
---
The second day of breakout sessions. Crazy walk-up line before the first session of the day with Sam Newman on Building Microservices on AWS. Luckily I got up early and queued up 70 minutes before the talk. At this point, 20–30 people were already lined up. But I managed to get in.

### Building Microservices on AWS

Sam started out by defining microservices as:

> “**Independently deployable** services that **work together**, modelled around a **business domain**”

![](/blog-images/aws-re-invent-2017-day-2-01.jpeg)

Alright, moving on. The Gartner Hype Cycle was up next.

![](/blog-images/aws-re-invent-2017-day-2-02.jpeg)

It puts Microservices at the peak of inflated expectations and SOA (Service Oriented Architecture) at the Through of Disillusionment. These two buzzwords is sort of the same thing.

Back to microservices and the definition mentioned above. Sam pointed out that the most important part of the definition is ***independently deployability*** which leads to autonomy, and allows for replaceability of components.

Then Sam went on talking about how Amazon back in the day realized they needed to split teams up into smaller teams in order to reduce coordination and allowing people to move fast.

> “No, communication is terrible!” — Jeff Bezos

![](/blog-images/aws-re-invent-2017-day-2-03.jpeg)

Autonomy is all about reducing coordination and allowing people to be fast in doing what they need to do. Sam spoke about communication pathways, the more people, the more communication pathways, and the higher the need to coordinate.

So the takeaway here is, coordination will slow you down, and building small autonomous teams will speed up your process because of the limited communication pathways. Further teams work within the service boundary and mostly only needs to communicate using an API.

Another highlight, was the single most common problem when building microservices; services reaching straight into the database of another service instead of communicating through the API. Don’t do this. Don’t allow other parties to use your backdoor, you won’t be able to detect all the things they are doing. Only let them use the front door.

> Microservices are an architecture which optimise for autonomy

Once you have decided to built microservices, next up is how you then run and manage them in production. Sam talked about the higher level abstractions of the cloud such as Elastic Beantalk, if you are a small shop, or maybe AWS ECS if you package your applications into docker containers.

Sam also mentioned the history of Borg at Google, and how all these lessons learned ended up in the open source container scheduler, Kubernetes.

He also highlighted some the possible problems of using container orchestration. If you don’t take full advantage of the platform, you may end up with one container starving the resources on a node, resulting in the rest of the applications failing because of starvation. Containers can get in each other’s way when running multi-tenant systems.

Last, but not least, was a small definition of serverless, and that many AWS services, such as Dynamo, S3, and Lambda can be seen as serverless tools. Again, serverless is a higher level abstraction where developers don’t have to think about the underlying infrastructure. But, be careful, if running a hybrid solution, such as functions using the same database, you may end up killing your database because of the lack of throttling. Instead, use serverless database tools, such as Dynamo.

As always, Sam Newman is a really good and insightful presenter — and this performance was no exception.

### Building Effective Container Images

The second talk of the day featured Abby Fuller, AWS, and Prakash Janakiraman, Nextdoor.

Abby started out by providing an introduction of how layers in Docker works, with the read-only base layers, and the thin read-write layer on top. Why do I care how many layers I have? Well, more layers result in larger images. And you don’t want large docker images. Smaller images mean faster builds and deploys. Further, it will limit the surface of attack.

![](/blog-images/aws-re-invent-2017-day-2-04.jpeg)

***How can I reduce my layers?*** Sharing is caring. Use shared base layers where possible in order to reuse as many of the layers as possible. Don’t use a RUN statement for each cmd you want to run. Combine them in one statement instead, so keep them it in one layer.

![](/blog-images/aws-re-invent-2017-day-2-05.jpeg)

Another good practice is to use minimal base images. Instead of using Ubuntu for a python app, use the python alpine. You probably don’t need the entire OS.

Further, use the Docker cache. Cache rules everything, which means that the order of statement really matters. Place the dynamic statements as far down in the Dockerfile as possible.

After Abby’s introduction and best practices for optimizing container images, Prakash from Nextdoor talked about how they were using these techniques at Nextdoor. Nextdoor is a social network for neighborhood. They started out with a python/django monolithic applications, but have been transitioning into a microservice oriented architecture with Go as the programming language. They moved from pre-baking AMI’s to utilizing Docker Containers.

Great presentation, even though it was fairly short, but then there was time for questions from the audience.

### Containerised Machine Learning on AWS

The thirds and last talk of the day featured Asif Khan, Hokuto Hoshi, Yuichiro Someya.

Asif started out by giving an introduction to machine learning and all the different tools that AWS provides.

![](/blog-images/aws-re-invent-2017-day-2-06.jpeg)

Further, Asif showed an example of machine learning workflow. This slide below shows all the different stakeholders and how the services work together in order to run the machine learning models.

![](/blog-images/aws-re-invent-2017-day-2-07.jpeg)

The last part of the presentation featured experiences on running a machine learning platform on AWS from Cookpad.

Cookpad needed to classify images from the Photo Roll in order to only upload pictures of food and make them available within their service. It was a great presentation, even though I don’t know much about machine learning and image classification, but it’s definitely something I will be looking more into in the future.

All in all, three very intersting talks. Further the expo opened today. Spent a couple of hours there talking to many different companies. It’s massive!

---

[AWS re:invent 2017 — day 2](https://medium.com/kubecloud/aws-re-invent-2017-day-2-5d4c113a70de) was originally published in [kubecloud](https://medium.com/kubecloud) on Medium, where people are continuing the conversation by highlighting and responding to this story.
