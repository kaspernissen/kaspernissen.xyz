---
title: "CloudNativeCon + KubeCon Europe 2017"
date: 2017-04-02
summary: "CloudNativeCon + KubeCon Europe 2017 is over! Wow, what a great conference. It was great to meet so many engaged and passionate people working the Cloud Native ecosystem."
tags: ["cloud-native", "kubernetes"]
canonical: "https://medium.com/kubecloud/cloudnativecon-kubecon-europe-2017-12c37c3af38c"
source: medium
---
CloudNativeCon + KubeCon Europe 2017 is over! Wow, what a great conference. It was great to meet so many engaged and passionate people working the Cloud Native ecosystem.

In this post, we will try to give our perspective on the conference, by highlighting the key takeaways from the talks we attended.

## Day 1

**Pancake and Podcast — The New Stack** 
 The first event of the day was the Pancake and Podcast event hosted by The New Stack. This was a panel debate about Continuous Integration/Continous Delivery. The panel consisted of the following: Kris Nova (Deis), Aparna Sinha (Google), Fintan Ryan (Redmonk), Aaron Rice (Wercker). The topic of the day was CI/CD and Kubernetes. Many people are moving towards the SaaS-based CI/CD solutions, but there is still a lot Jenkins, especially in the enterprise. The CI/CD as a Service solutions look really promising especially those that promise a smooth integration with Kubernetes. Unfortunately, from our experience, the maturity and the ability to customize many of these solutions is still not fully there. Kris Nova pointed out that we need to ask ourselves as a community WHAT we want instead of focussing on HOW.

**Morning Keynotes** 
 The morning keynotes was an action-packed affair, with a total of 8 lightning keynotes. First, Executive Director of the Cloud Native Computing Foundation, Dan Kohn, took the stage and officially announced that the *rkt* and *containerd* projects now are hosted by the CNCF. This is a pretty significant step, that hopefully will put the discussions revolving around *the docker fork* to rest, and bring some stability and optionality in choosing the container runtime. The following 2 keynotes were; an introduction to containerd by Patrick Chanezon, Member of the Technical Staff at Docker Inc; and an introduction to rkt, By Brandon Philips, CTO of CoreOS.

Next up was Product Management Team Lead of Google, Aparna Sinha, giving the highlights of the Kubernetes 1.6 release. If you want to know more, please check out the official blog post of the new features in 1.6 [here](http://blog.kubernetes.io/2017/03/kubernetes-1.6-multi-user-multi-workloads-at-scale.html). Just a brief comment to the 1.6 release, great job guys! Really pleased to see RBAC getting so much attention.

The last keynotes featured great talks about the OpenAI project, Kubernetes/Container Security, the history of Prometheus along with the last year of the Project Calico.

**Running workloads in Kubernetes** 
 *Janet Kuo, Software Engineer, Google* 
 Janet introduced four different workload patterns in Kubernetes: stateless, stateful, daemon, and batch, and gave examples of how e.g. web servers, databases, and log collectors fit these patterns. Afterward, she explained how the patterns map to Kubernetes’ concepts of deployments, stateful sets, daemon sets, and jobs. A well-planned demonstration of each pattern with its matching Kubernetes concept was given. All-in-all, a great introduction to the concepts of Kubernetes. Check of [the slides](http://schd.ws/hosted_files/cloudnativeeu2017/57/KubeCon%20-%20Running%20Workloads%20in%20Kubernetes.pdf) for more information.

**Counting with Prometheus** 
 *Brian Brazil, Robust Perception* 
 Brian’s talk was focused around how you should use counters in Prometheus. The dos and don’ts. One of the misconceptions that were pointed out is that the *delta* function should only be used with gauges and not counters, instead, you should use the *irate* function. Brian further highlighted some of the misconceptions around monitoring with Prometheus, it is not real-time data points, but aggregated data over a period of time. There are differences in time from when Prometheus scrapes your system and when the actual event took place, how the scraped data is collected and aggregated. Prometheus is meant for spotting symptoms. If you want complete stats, you should use logs instead, or as a compliment.

**When Failure is Not an Option: Processing Real Money at Monzo with Kubernetes and Linkerd** 
 *Oliver Gouild, Buoyant & Oliver Beattie, Monzo* 
 Oliver Beattie started out by explaining what Monzo is and motivated the rest of the talk by highlighting some of the important characteristics of their software architecture such as extensibility, efficiency, resilience, and security. Oliver Gouild did the main part of the talk by presenting how linkerd helps to achieve these goals and how it is done under the hood. He covered how linkerd implements intelligent layer 5 load balancing using exponentially-weighted moving average (EWMA) and the importance of backpressure among other things.

**Dance Madly on the lip of a Volcano with Security Release Processes** 
 *Jess Frazelle, Google & Brandon Philips, CoreOS* 
 The focus of this talk by Jess & Brandon covered the new security release process for Kubernetes and all it’s sub-projects. The key take-aways was greatly summarized by Brandon Philips slide describing the audience homework: Join [Kubernetes Announce](https://groups.google.com/forum/#!forum/kubernetes-announce), Review the [Kubernetes Security Process](https://github.com/kubernetes/community/blob/master/contributors/devel/security-release-process.md#product-security-team-pst), and [help improve](https://github.com/kubernetes/test-infra). If you are using Kubernetes, do yourself a favor and checkout the links above.

**Operational and Business Insights from Tracing Distributed Microservices** 
 *Juraci Paixaão Kröhling, Red Hat* 
 Juraci started out by describing the differences between *traditional* and *distributed* tracing and gave a brief introduction to OpenTracing. Hawkular, an open source implementation of the OpenTracing standard, was the topic of the rest of the talk. Juraci started [an example of an order management system](https://github.com/hawkular/hawkular-apm/tree/master/examples/vertx-opentracing) using Hawkular APM and generated orders in order to see the data and graphical representation of the business transactions from start to end. The representation was shown in OpenShift Origin. Additionally, Juraci showed how the OpenTracing spans were used in the different Java services.

**Kubernetes Operators: Managing Complex Software with Software** 
 *Josh Wood, CoreOS & Jesus Carrillo, Ticketmaster* 
 Josh started out this presentation with a great introduction of what a Kubernetes Operator is and why you should use them. An Operator makes it easy to deploy stateful apps to Kubernetes, and further, managing, scaling and updating these apps becomes very easy. The operator consists of a simple loop similar to the loop in the ReplicaSet keeping your desired state, by Observing, Analyzing, and taking Action to get to the desired configuration. CoreOS has already created operators for etcd and Prometheus, and other will come in the future. Ticketmaster uses the Prometheus operator, and Jesus spoke about their experiences running it in production and delivering it as Prometheus as a Service for internal teams. Great talk, if you are interested, slides can be found [here](https://speakerdeck.com/joshix/kubernetes-operators-principle-and-practice).

**Closing Keynotes**

The closing keynotes of day 1 consisted of a series of 6 small keynotes from: Chen Goldberg, Director of Engineering, Container Engine & Kubernetes, Google; Brandon Philips, CTO, CoreOS; Mark van Straten, Senior Software Architect, Q42; Nicholas Weaver, Director of Software Engineering, Data Center Solutions Group, Intel Corporation; Michelle Noorali, Software Engineer, Deis; Kelsey Hightower, Google Cloud Team & CloudNativeCon and KubeCon Conference Co-Chair.

![](/blog-images/cloudnativecon-kubecon-europe-2017-01.JPG)

The velocity of the Kubernetes project is insane! The community is extremely hardworking and dedicated to making Kubernetes the defacto standard (if it isn’t already) for running container package software.

![](/blog-images/cloudnativecon-kubecon-europe-2017-02.JPG)

Further, Google is no longer the majority committer to the Kubernetes project. The community is a diverse community consisting of big enterprises, small startups to individual committers.

![](/blog-images/cloudnativecon-kubecon-europe-2017-03.JPG)

Wow, Philips Hue is being controlled by Kubernetes if you use My Hue or any of the services that talks to the Hue Cloud API. Mark gave an interesting story on how they build their architecture. Further, Brandon Philips introduced and demoed a new [offering](https://coreos.com/blog/quay-application-registry-for-kubernetes.html) by quay.io for storing helm charts.

The last keynote, before the closing remarks by the always great Kelsey Hightower, was Michelle Noorali. Michelle argued that Kubernetes still is hard for developers to use. She made a comparison with a broom, a vacuum cleaner, and a Roomba (robot vacuum cleaner). 
 The broom and the vacuum cleaner being the more manual ways of doing operations work, whereas the Roomba represents what Kubernetes has done for the operations community — no more hard work — just sit back and watch the robot do the work. This is to some degree true for the operations side of Kubernetes. However, developers’ jobs have gotten harder, because now they need to learn to use kubectl, containers, etc. Developers want a Roomba too. Something like the Deis Workflow, where developers don’t have to know about all these things, but instead just git push deis master.

All in all, day 1 was pretty exiting. Great job by the organizers, even though many rooms were a bit crowded! And great job by the host of the day, Kelsey Hightower!

## Day 2

**Morning keynotes** 
 The second day started out with a keynote by Alexis Richardson, CEO of Weaveworks and TOC Chair CNCF, about what Cloud Native is and why we should care about it. He accentuated three pillars: *speed*, *freedom*, and *trust*. 
 The need for *speed* was motivated by Netflix’s historical needs and Weaveworks’ own needs. In CNCF speed is promoted e.g. by interoperability between projects and education. *Trust* is important when choosing a tool, and the CNCF plays an important role as seen with The Linux Foundation. *Freedom* is seen in the absence of vendor/cloud lock-in, but also in the option of choice between containerd and rkt. Alexis underlined that CNCF shouldn’t act as a kingmaker, but instead be open to choice as seen with containerd and rkt both being accepted as projects. 
 Wrapping up these thoughts, Alexis extended Marc Andreessen’s original quote “Software Is Eating the World” to “Software Is Eating the World, Open Source is Eating Software, Cloud is Eating Open Source”

Joe Beda, CTO Heptio, gave a great talk on how to grow the Kubernetes user base, reflected on other user segments’ viewpoints of Kubernetes, and were Kubernetes has room for improvement or inconsistencies.

The last morning keynote was given by Kelsey Hightower on Cluster Federation. Kelsey looked at when (and when not) to use Cluster Federation with a healthy criticism. Furthermore, he pointed out some parts of the current state that don’t seem ready yet. Anyway, he presented a setup of four clusters running in four different regions. A terminal in each region was launched, producing traffic to the clusters, and from GCP’s web console the traffic was seen spread across the clusters. As always, Kelsey completely nailed the demo despite the fear of the demo gods.

**Building for Trust: How to secure your Kubernetes Cluster** 
 *Alexander Mohr & Jess Frazelle, Google* 
 Alexander and Jess introduced and covered several ways of improving the security in a Kubernetes cluster. The new RBAC in Kubernetes 1.6 was introduced, and they described how it provides support for multiple identities and what the future roadmap might look like. How to use [AppArmor](https://kubernetes.io/docs/tutorials/clusters/apparmor/) and [seccomp](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/seccomp.md) annotations on pods was also shown, and Jess demonstrated how the Dirty COW privilege escalation vulnerability could be avoided by annotating pods. A cluster, in which one of three nodes was vulnerable to Dirty COW, was used to show that an attack was blocked when using seccomp annotation and that it wasn’t blocked on the vulnerable node without the annotation.

**Kubernetes Day 2: Cluster Operations** 
 *Brandon Philips, CoreOS* 
 Brandon focused on day 2 operations in this fast-paced talk. What happens if e.g. the scheduler fails? Or you accidently scale it to 0? Brandon demonstrated how easy you can get back up and running by exporting the schedulers declaration, change it from a deployment to a pod. He further spoke about the advantages of using Kubernetes Operators, and especially how the etcd operator should be scaled for HA. The last part of the talk Brandon introduced the Prometheus operator and how you can monitor your Kubernetes cluster. If you want to know more, check out this [repo](https://github.com/philips/kubernetes-day-2) and the [slides](https://docs.google.com/presentation/d/1LpiWAGbK77Ha8mOxyw01VlZ18zdMSNimhsrb35sUFv8/edit#slide=id.g6c18b4f17c548457_3043).

**Autoscaling a Multi-Platform Kubernetes Cluster Built with kubeadm** 
 *Lucas Käldström, Upper Secondary School Student, Individual Maintainer* 
 If you haven’t heard about Lucas Käldström, I’m sure you will in the future! Lucas is only 17 years old and has been a Kubernetes maintainer for about a year. Before that, he built the project: kubernetesonarm, that made setting up a Kubernetes cluster on arm easy! We used this project as the base for our Kubernetes Raspberry Pi clusters. His talk was a demonstration of how he has built a multi-architecture kubernetes cluster using kubeadm among other tools to set up the cluster. With this cluster, Lucas further demonstrated how to use custom metrics for the Horizontal Pod Autoscaling feature of Kubernetes. We highly recommend you to check out his workshop explaining all the nitty gritty details of the setup [here](https://github.com/luxas/kubeadm-workshop).

![](/blog-images/cloudnativecon-kubecon-europe-2017-04.jpg)

**Delve into Helm: Advanced DevOps** 
 *Lachlan Evenson & Adam Reese, Deis* 
 The high spirit of this talk was impossible not to notice with all the jokes about YAML indenting. They briefly covered how Helm can be used as a package manager using charts, and went on to what else Helm can offer. You can e.g. find best practices for running popular applications from [kubeapps](https://kubeapps.com/) and do lifecycle management such as update, rollback, config management, and testing. In combination with an awesome demonstration of an example project: [croc hunter](https://github.com/lachie83/croc-hunter), this worked really well. Especially the option to run helm test to verify that a chart is created as expected seems like a feature worth looking into. If your interest has been awaken, take a look at the [slides](https://schd.ws/hosted_files/cloudnativeeu2017/dd/Delve%20into%20Helm-%20Advanced%20DevOps.pdf).

**The Patterns of Distributed Logging and Containers** 
 *Satoshi Tagomori, Treasure Data Inc.* 
 Satoshi, who is a core team member of fluentd, spoke about the patterns of distributed logging. The first part of the talk focused on the different possibilities for picking up logs when working with docker containers, and how to transform these logs into structured data. Next, Satoshi focused on how to scale a logging infrastructure, by discussing the different patterns that are available in terms of how log aggregation should be handled. We highly recommend you to go through his slides, which can be found [here](https://www.slideshare.net/tagomoris).

**All Attendees Party** 
 The conference ended with a great party sponsored by CoreOS, with great food and lots of great conversation.

![](/blog-images/cloudnativecon-kubecon-europe-2017-05.jpg)

![](/blog-images/cloudnativecon-kubecon-europe-2017-06.jpg)

![](/blog-images/cloudnativecon-kubecon-europe-2017-07.jpg)

All in all — CloudNativeCon + KubeCon has been an awesome conference! We’ve met some really cool people! Everybody has been very welcoming and happy to share their interests. Great talks, great venue — even though the rooms were a bit crowed sometimes.

This is definitely not the last time we attend a CloudNativeCon + KubeCon Conference!

… and hey — next CloudNativeCon + KubeCon Europe will be in our home country of Denmark! See you in 2018!

/Martin & Kasper

*Originally published at* [kubecloud.io](http://kubecloud.io/cloudnativecon-kubecon-europe-2017/) *on April 2, 2017.*

---

[CloudNativeCon + KubeCon Europe 2017](https://medium.com/kubecloud/cloudnativecon-kubecon-europe-2017-12c37c3af38c) was originally published in [kubecloud](https://medium.com/kubecloud) on Medium, where people are continuing the conversation by highlighting and responding to this story.
