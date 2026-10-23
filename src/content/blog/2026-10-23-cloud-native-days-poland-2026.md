---
title: "Cloud Native Days Poland 2026: Great Vibes in Warsaw"
date: 2026-10-23
summary: "A day in Warsaw with a vibrant Polish community. Alex Chircop on where the CNCF is heading, Paweł Sułkowski's bakery trap, Marcus Noble's Kube-Oddities, €230,000 of GitOps scale testing, capybaras and AI delegation from Adriana and Josh, Julia's career traced with OpenTelemetry, my talk on observability as a platform product, and a photo with Jerzy Dudek."
tags: ["kubernetes", "conferences", "opentelemetry", "platform-engineering"]
hero: "cnd-poland-2026-19.jpg"
draft: false
---
Two conferences in one week. After Monday and Tuesday at [KCD UK](/blog/kcd-uk-2026/) in Edinburgh, I headed to Warsaw for Cloud Native Days Poland on Thursday.

Great vibes all day. The Polish cloud native community is vibrant and a lot of fun to hang out with, and the organising team pulled together three rooms of talks, keynotes, lightning talks and an after party at the venue. I spent most of the day in the main hall, with sessions on everything from Kubernetes fundamentals and GitOps at scale to AI, observability, and a rather unusual way of instrumenting a career.

Here are some of my highlights.

## The mission isn't done yet

Alex Chircop, Principal Engineer at Google and a member of the CNCF Technical Oversight Committee, opened with "The State of the Cloud Native Union". He has lived in Warsaw since February, so this was close to a home crowd for him. The CNCF is 11 years old, Kubernetes is 12, and the foundation now has 230 projects, with close to ten more expected to reach incubation or graduation before KubeCon.

<figure>
<img src="/blog-images/cnd-poland-2026-01.jpg" alt="Alex Chircop next to a slide quoting the CNCF charter: CNCF's mission is to make cloud native computing ubiquitous">
<figcaption>Alex Chircop asking whether 230 projects means the mission is done.</figcaption>
</figure>

With the charter saying the mission is to make cloud native computing ubiquitous, Alex asked whether, for some definition of done, we're done. His answer was no, because the workloads keep changing. Alex argued that most AI inference and model serving already run on Kubernetes, or as he put it, if AI is the new application, Kubernetes is the new web server. That brings topology-aware scheduling for accelerators, sandboxes for agents and GPU sharing. At the same time, clusters keep getting bigger, and the EU Cyber Resilience Act puts supply chain security on everyone's list.

He finished with how to get involved: TAG meetings are open, and anyone can propose an initiative on the TOC GitHub board. It's always great to hear from someone who works this closely with the projects and the foundation. I've been part of the CNCF community for a number of years now, and it's interesting to hear where the foundation sees things going next. Kubernetes might be everywhere, but the problems we're asking it to solve aren't standing still.

## The bakery trap

Paweł Sułkowski, Senior Manager of SRE at Akamai, gave the second keynote, "Everything is new… How we tackle it?". He moved from core infrastructure and observability to leading SRE for Akamai's new inference platform, and had to build the team from scratch with a skill set that's hard to hire for. The first person he felt needed to know the stack was himself, so he went back to learning.

<figure>
<img src="/blog-images/cnd-poland-2026-20.jpg" alt="Paweł Sułkowski next to a slide titled Same trap, different oven, showing Kubernetes as the tip of an iceberg above how containers work, what can go wrong, is it the right tool, and the problem you solve">
<figcaption>Same trap, different oven.</figcaption>
</figure>

He calls his approach "continuous struggling". In a day, learn something small. After a week, be comfortable discussing it. After a month, be able to explain it to someone else. For Paweł, a comfortable week is a warning sign, because it usually means he didn't learn anything.

My favourite part was the bakery trap. You've always wanted a bakery, so you buy an oven, shelves and a delivery van, and hire experienced bakers. Sometimes the bread is good, sometimes it isn't, and you have no idea why. Have you ever baked bread yourself? We do the same with Kubernetes. We pick it because it's popular and great, without understanding the containers, the infrastructure and the problem underneath. Switching languages or vendors is relatively easy. Working out why performance keeps dropping at 3 a.m. when you're alone on call is not.

He also talked about what he called LLM overdose, where code, configuration, docs and designs are generated faster than anyone can review them. That one resonated with me. It came up again and again in the hallway in Edinburgh earlier in the week. We can generate code faster than ever, but that doesn't mean we understand what we've generated.

The same goes for shortcuts under pressure, like skipping tests, skipping staging or spawning clusters by hand. They feel faster until they aren't, so track what you postpone, or it comes back in a year, at 3 a.m. His team shipped the inference beta on an extremely tight deadline without skipping a single test stage.

## Kube-Oddities, again

Marcus Noble from Monzo gave "Kube-Oddities - the quirks that keep Kubernetes interesting". His co-speaker Márk Sági-Kazár couldn't make it, because the only flight option he had came with a connection too short to work, so Marcus did it solo.

<figure>
<img src="/blog-images/cnd-poland-2026-02.jpg" alt="Marcus Noble pointing at a slide titled DNS Policy, with ClusterFirst highlighted and the note: Obviously not the default">
<figcaption>The pod DNS policy called Default isn't the default.</figcaption>
</figure>

I've seen this talk a few times now, and I still enjoy it. He keeps the energy high, and it's entertaining to discover how many oddities Kubernetes has, even after years of working with it. Did you know the DNS policy called `Default` isn't the default? Or that native sidecars are technically init containers? Or that tokens from `kubectl create token` can't be revoked? And then there's the RBAC `escalate` verb, which you probably don't want to give anyone, and admission webhooks that can take down your control plane.

<figure class="portrait">
<img src="/blog-images/cnd-poland-2026-03.jpg" alt="Marcus Noble on stage with a microphone in front of a Cloud Native Days Poland sponsor banner">
<figcaption>Marcus Noble, flying solo.</figcaption>
</figure>

He also opened with the most important question of the day: is it kube-c-t-l, kube-control or kube-cuddle? My own deck later that day had a slide saying I don't care, so I'll leave that discussion for another time.

## Scaling GitOps to 15,000 clusters

How much would you spend to find out whether your GitOps setup can manage 15,000 Kubernetes clusters? For Artem Lajko from iits-consulting and Gianluca Mardente, who created Sveltos, the answer was around €230,000.

<figure>
<img src="/blog-images/cnd-poland-2026-04.jpg" alt="Slide titled Why...? with a cartoon bear whose neck is stuck in a bottle, next to an Argo CD architecture diagram">
<figcaption>Finding the bottleneck.</figcaption>
</figure>

Their talk, "Predicting GitOps at 15,000+ Clusters: What Large-Scale Testing Taught Us", started with Kubara, a framework from STACKIT and iits for catalog-based platforms on Argo CD. One adopter needed it for 15,000 edge clusters with outbound-only access. When they asked the Argo CD maintainers, the answer was that their biggest customers run about 1,000 clusters, and could they please share what they found. So they tested it. The budget was agreed in a pub at €100,000, and it ended at €230,000 after around 30 iterations, using vCluster instead of real clusters.

In their setup, what limited Argo CD was the number of cached objects rather than the number of applications. Tuned, it got to about 1,500 apps across 250 clusters. Sveltos in agent-based pull mode deployed 4,300 of 5,000 heavy apps in one go, and what stopped it was the pods-per-node limit and the budget. Pull mode also renders the Helm templates on the hub, so credentials stay central. Their advice: don't run 15,000 clusters from one hub.

<figure>
<img src="/blog-images/cnd-poland-2026-05.jpg" alt="Artem Lajko next to a slide titled Load and Scale Testing the Hub: Argo CD, decorated with Cloudtein protein powder, GitOps Gainz protein bars and a weightlifting bear">
<figcaption>GitOps Gainz and Cloudtein.</figcaption>
</figure>

I thought this was a really interesting experiment. It's not often you hear about someone spending €230,000 just to find out how far they can push a GitOps setup. And the deck had some great mascots, from a bear stuck in a bottle for the bottleneck to a weightlifting bear with GitOps Gainz bars for the load tests. I'm a big fan of mascots in decks, so this one landed.

## Learning to live with AI slop

After lunch, Adriana Villela from Dynatrace and Josh Lee from Altinity gave the keynote "Zen AI Cohabitation: How I learned to embrace the slop". Great energy, and capybaras, originally drawn by Adriana's daughter as mascots for her podcast. Some of them carried over from the talks Adriana and I have been giving together this autumn, so after weeks of sharing a stage with those capybaras, it was fun to watch them from the audience for once.

<figure>
<img src="/blog-images/cnd-poland-2026-06.jpg" alt="Josh Lee and Adriana Villela on stage next to a Dzień Dobry slide with a capybara and Adriana's bio: Capybara enthusiast, slop-free since 1979">
<figcaption>Dzień dobry from Josh and Adriana.</figcaption>
</figure>

AI isn't going to take our jobs, but it is going to take our jobs. Adriana said the more she uses AI, the more depressed she gets, so they pitched the talk as a survival guide. The core of it was splitting work into the things you babysit, the things you delegate and the things you abdicate. Delegate when you care about the process, abdicate when you only care about the outcome. Excel graphs, regex and the CSS for Adriana's new website were fair game. Josh thought his Terraform was abdication, until it turned out he cared about the process after all.

<figure>
<img src="/blog-images/cnd-poland-2026-08.jpg" alt="Slide: There are things you babysit. There are things you delegate. There are things you abdicate.">
<figcaption>Babysit, delegate, abdicate.</figcaption>
</figure>

One of my favourite moments was when they disagreed on stage about whether code readability still matters when agents write the code. Adriana held on to human accountability, and I'm with her on that one. Someone still has to own what ends up in production.

<figure>
<img src="/blog-images/cnd-poland-2026-07.jpg" alt="Josh Lee and Adriana Villela in front of a slide titled Abdication survival tips, with an orange capybara holding a lasso">
<figcaption>Abdication survival tips.</figcaption>
</figure>

They described LLMs as sycophantic interns, which I thought was a pretty good comparison. Their advice was to give agents access to tools, but within clearly defined boundaries. And rather than spending your time on ever more complicated markdown instructions, use the model to generate deterministic code wherever you can.

They also made a good point about junior developers. If AI changes how we build software, we still need to figure out how the next generation of engineers learns. Someone has to maintain these systems when the seniors retire, and we can't stop hiring juniors and expect experienced engineers to appear in ten years. Mentorship matters more than ever. And their advice for staying sane: write your own content, make your own slide art, and take an AI holiday now and then.

## A career, instrumented with OpenTelemetry

Then my colleague Julia Furst Morgado gave her keynote, "Uninstrumented". Julia went from law school in Brazil to business at Berkeley, then marketing, a free coding bootcamp during the pandemic, open source, community events and DevRel. For years she worried about how to explain that path in an interview.

<figure>
<img src="/blog-images/cnd-poland-2026-09.jpg" alt="Julia Furst Morgado next to her title slide: Uninstrumented, Julia Furst Morgado, Principal Developer Relations Engineer, Dash0">
<figcaption>Julia Furst Morgado.</figcaption>
</figure>

So she asked the room. Raise your hand if your path into tech makes linear sense, from computer science degree to principal engineer. A few hands. Then raise your hand if your career looks like a plate of spaghetti. Clearly more. Most people in the room had taken some kind of non-linear path to get there.

<figure>
<img src="/blog-images/cnd-poland-2026-10.jpg" alt="Julia on stage with the audience in view, next to a slide asking people to raise their hand if their path into tech makes linear sense or if their resume looks like spaghetti">
<figcaption>Spaghetti won.</figcaption>
</figure>

Her reframe: she wasn't failing, she was just uninstrumented. She wrote a script that turned her career into OpenTelemetry spans and sent them to Dash0. The first export showed four separate root spans, one per career, with nothing connecting them. Adding a parent span and propagating the context turned them into one trace.

<figure>
<img src="/blog-images/cnd-poland-2026-11.jpg" alt="Julia next to a slide titled Actual: a distributed service map, showing her career as a tangled graph of spans from law school onwards">
<figcaption>A career as a distributed service map.</figcaption>
</figure>

From there, the tracing concepts kept fitting. The years cleaning houses and waiting tables became an unmonitored window, because a missing span isn't downtime. The bootcamp, where she struggled with async programming, became an error span: something failed, but the trace kept going. And imposter syndrome is just an `exception.type`, an attribute on the error, not the end of the story. The retry was 30 Days of OpenTelemetry in December 2025, and span links are the people who helped along the way. She closed with a blameless postmortem playbook: notice what you carry, find your people, do it scared, answer the doubt in public, and keep a record of your wins. Her last slide: this is an active span.

I'm biased, but it's also a really good explanation of why context propagation matters. Without the parent span, you have four unrelated stories. With it, you have one.

## My talk

Later in the afternoon I gave "[Rethinking Observability as a Platform Product](/talks/rethinking-observability-as-a-platform-product-2026-10-22/)". I only had 30 minutes this time, so I rushed a bit, but I got the points across, and people I spoke to at the after party had some nice feedback, which I appreciated.

<figure>
<img src="/blog-images/cnd-poland-2026-12.jpg" alt="Kasper on stage next to a slide showing a trace waterfall with a trace ID">
<figcaption>Walking through a trace.</figcaption>
</figure>

The talk goes back to 2017, when I stood on stage and drew the line between developers and the platform in the wrong place. Shift left handed developers more of the operational work. Since then, most of it has moved back down into the platform, with Kubernetes, paved paths and managed services taking it off their plate. Observability went the other way, and instrumenting services is still largely the developer's job. Observability promised a lot, from faster root cause analysis to lower MTTR, and the reality hasn't matched it. We don't have a metrics problem or a tracing problem, we have systems problems. In the survey I used, 58% of respondents named instrumentation skill gaps as a problem. My argument is that the platform should absorb that burden, so developers get telemetry by default, with OpenTelemetry as the shared foundation.

<figure>
<img src="/blog-images/cnd-poland-2026-18.jpg" alt="Kasper pointing at a slide: We don't have a metrics problem, or a tracing problem. We have systems problems.">
<figcaption>It isn't necessarily a tooling problem.</figcaption>
</figure>

One slide says that correlation is the superpower, and Julia had demonstrated exactly that a couple of hours earlier with her career. The [slides are here](https://kasper-nissen-presentations.s3.eu-west-1.amazonaws.com/decks/rethinking-observability-as-a-platform-product-2026-10.pdf) (PDF), and the demo is on [GitHub](https://github.com/dash0hq/otel-platform-demo).

## A few more talks

I also caught Pawel Piwosz from UpCloud on data sovereignty, where the point that stuck was that keeping your data in a Frankfurt data centre isn't enough when your CDN terminates TLS around the world. And Nikhil Kumar split one H100 into seven 10 GB GPU instances live on stage with the NVIDIA GPU Operator and MIG.

Svitlana Chaplinska from Verda ended the day with a lightning talk, "What Could Go Wrong? Threat Modeling Kubernetes in 5 Minutes". Sketch the system, break it with STRIDE, fix what matters, and check your work, with open source tools for each step. Five minutes is a hard format, and she fit a whole method into it. A cool way to end the day.

<figure>
<img src="/blog-images/cnd-poland-2026-14.jpg" alt="Svitlana Chaplinska next to her title slide: What Could Go Wrong? Threat Modeling Kubernetes in 5 Minutes">
<figcaption>Svitlana Chaplinska.</figcaption>
</figure>

## Ambassadors, and a goalkeeper

As always, a big part of the day happened between the talks and at the after party. There were a few of us CNCF Ambassadors in Warsaw, so of course we needed a photo.

<figure>
<img src="/blog-images/cnd-poland-2026-15.jpg" alt="Svitlana, Marcus, Julia, Kasper and Adriana in front of the Cloud Native Days Poland backdrop">
<figcaption>The CNCF Ambassadors at Cloud Native Days Poland.</figcaption>
</figure>

I also had a somewhat random opportunity to get a photo with Jerzy Dudek, who, I've since learned, won the Champions League with Liverpool in 2005.

<figure class="portrait">
<img src="/blog-images/cnd-poland-2026-16.jpg" alt="Kasper, Svitlana, Jerzy Dudek in a red Liverpool shirt, and Julia in front of a Wasabi and Liverpool FC backdrop">
<figcaption>With Svitlana Chaplinska, Jerzy Dudek and Julia Furst Morgado.</figcaption>
</figure>

## Wrapping up

That's a wrap for Cloud Native Days Poland. Great talks, familiar faces, plenty of new people to meet, and a really well-organised event. And it's not every day you randomly end up in a photo with a Champions League-winning goalkeeper.

I even managed to squeeze in a morning run to Warsaw's Old Town before heading home.

<figure class="portrait">
<img src="/blog-images/cnd-poland-2026-17.jpg" alt="Kasper in a running jacket taking a selfie in front of the Palace of Culture and Science and a fountain">
<figcaption>Morning run past the Palace of Culture and Science.</figcaption>
</figure>

Two conferences in one week, Edinburgh and Warsaw. What a week.

A big thank you to the organisers and volunteers for putting together such a great event, and to everyone I caught up with throughout the day and at the after party. I hope to be back another time.
