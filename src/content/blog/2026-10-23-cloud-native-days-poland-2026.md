---
title: "Cloud Native Days Poland 2026: Great Vibes in Warsaw"
date: 2026-10-23
summary: "A day in Warsaw with a vibrant Polish community. Alex Chircop on where the CNCF is heading, Paweł Sułkowski's bakery trap, Marcus Noble's Kube-Oddities, Argo CD and Sveltos at 15,000 clusters, capybaras and AI delegation from Adriana and Josh, Julia's career traced with OpenTelemetry, my talk on observability as a platform product, and a photo with Jerzy Dudek."
tags: ["kubernetes", "conferences", "opentelemetry", "platform-engineering"]
hero: "cnd-poland-2026-19.jpg"
draft: false
---
Two days after [KCD UK](/blog/kcd-uk-2026/) in Edinburgh, I was in Warsaw for Cloud Native Days Poland. Great vibes all day. The Polish community is vibrant, curious and a lot of fun to hang out with, and the eight organisers ran three rooms of talks, keynotes, lightning talks and an after party at the venue without anything feeling rushed. Well, apart from my own talk, but I'll get to that.

I recorded and took notes through most of the day in the main hall, and looking back, a few themes kept coming up. Know what's underneath the tools you pick. Decide what you hand off, to an agent, a platform or a controller, and what you keep. And context is what turns a pile of data into something you can understand, whether that data is telemetry or a career.

## The mission isn't done yet

Alex Chircop opened the day with "The State of the Cloud Native Union". Alex is a Principal Engineer at Google and sits on the CNCF Technical Oversight Committee, and he has lived in Warsaw since February, so this was something of a home crowd for him.

<figure>
<img src="/blog-images/cnd-poland-2026-01.jpg" alt="Alex Chircop next to a slide quoting the CNCF charter: CNCF's mission is to make cloud native computing ubiquitous">
<figcaption>Alex Chircop asking whether 230 projects means the mission is done.</figcaption>
</figure>

The CNCF is 11 years old and Kubernetes is 12. The foundation now has 230 projects, with close to ten more expected to reach incubation or graduation before KubeCon in a few weeks. Sandbox projects are growing the fastest. So, with the charter saying the mission is to make cloud native computing ubiquitous, Alex asked the obvious question: for some definition of done, are we done?

His answer was no, because ubiquity means the platform keeps evolving with the workloads. Scheduling is becoming topology aware, with accelerators, NUMA and network latency all part of the placement decision. Most AI inference, model serving and MCP integrations already run on Kubernetes. As he put it, if AI is the new application, Kubernetes is the new web server. Agents need sandboxes with interfaces to suspend and resume them, and projects like HAMi make it possible to share GPUs. On security, the EU Cyber Resilience Act pushes SBOMs, supply chain attestation and confidential containers up everyone's list. And at the other end, people are running clusters with 1,000, 5,000 and 100,000 nodes, plus a lot of multi-cluster, with efficiency, including energy, as a real constraint.

He also called out a set of projects to watch, from Crossplane, which recently graduated, to Kyverno, Knative, Fluid, OpenFGA and Dragonfly, which matters a lot more now that models are multiple gigabytes. He finished with how to get involved. TAG meetings are open, anyone can propose an initiative on the TOC GitHub board, and the end-user reference architectures from the Technical Advisory Board can even lead to a KubeCon keynote.

It's always great to hear from someone who works this closely with the projects and the foundation. What I took from it is that "done" keeps moving. Every new workload brings new problems for the platform to absorb, and most of the talks that followed were about exactly that.

## Know what's underneath the tool

Paweł Sułkowski, Senior Manager of SRE at Akamai, gave the second keynote, "Everything is new… How we tackle it?". He moved from core infrastructure and observability to leading SRE for the new Akamai inference platform, building the team from scratch with a skill set that's hard to hire for. The first person he felt needed to know the stack was himself, and he didn't feel he was there yet. So he went back to learning.

<figure>
<img src="/blog-images/cnd-poland-2026-20.jpg" alt="Paweł Sułkowski next to a slide titled Same trap, different oven, showing Kubernetes as the tip of an iceberg above how containers work, what can go wrong, is it the right tool, and the problem you solve">
<figcaption>Paweł Sułkowski on the bakery trap.</figcaption>
</figure>

He calls his approach "continuous struggling": set goals that are challenging but achievable, in loops. In a day, learn something small. After a week, be comfortable discussing it. After a month, be able to explain it to someone else. And if the knowledge still doesn't help you understand the product, stop looping on your own and ask for help. For Paweł, comfort is a warning sign. A comfortable week usually means he didn't learn anything.

The part I liked most was what he called the bakery trap. You've always wanted a bakery, so you buy an oven, shelves and a delivery van, and hire experienced bakers. Sometimes the bread is good, sometimes it isn't, and you have no idea why. Have you ever baked bread yourself? Same trap, different oven: we pick Kubernetes because it's popular and great, without understanding the containers, the infrastructure and the problem underneath. Switching languages or vendors is relatively easy. Working out why performance keeps dropping at 3 a.m. when you're alone on call isn't, and that's where fundamentals matter.

He also had a name for the other extreme: LLM overdose. That's when code, configuration, docs and design are generated faster than anyone can review them, which works until it doesn't. Underusing AI is also a problem, so you have to find the sweet spot. And the same goes for shortcuts under pressure, like skipping tests, skipping staging, or spawning clusters by hand: track what you postpone, or it comes back in a year, at 3 a.m. They shipped the inference beta on an extremely tight deadline without skipping a single test stage.

Marcus Noble from Monzo then took the fundamentals idea all the way down into the details with "Kube-Oddities - the quirks that keep Kubernetes interesting". His co-speaker Márk Sági-Kazár missed his connecting flight, so Marcus did it solo. I've seen this talk a few times now, and it's fun every time. He keeps the energy high, and he opened with the most important question of the day: is it kube-c-t-l, kube-control or kube-cuddle? My own deck later that day had a slide saying I don't care, so we'll leave that one open.

<figure>
<img src="/blog-images/cnd-poland-2026-02.jpg" alt="Marcus Noble pointing at a slide titled DNS Policy, with ClusterFirst highlighted and the note: Obviously not the default">
<figcaption>The pod DNS policy called Default isn't the default.</figcaption>
</figure>

The oddities are all small things that add up. Native sidecars are init containers with `restartPolicy: Always`, which Marcus does not love. When an image has both a tag and a SHA digest, the kubelet ignores the tag, so keep the two in sync with something like Renovate. Volumes reference a ConfigMap with `name` but a Secret with `secretName`. A memory-backed `emptyDir` counts against your memory, so set limits and a `sizeLimit`. Setting `spec.hostname` doesn't create a DNS record, you need a headless service for that. And the DNS policy called `Default` isn't the default, `ClusterFirst` is.

<figure class="portrait">
<img src="/blog-images/cnd-poland-2026-03.jpg" alt="Marcus Noble on stage with a microphone in front of a Cloud Native Days Poland sponsor banner">
<figcaption>Marcus Noble.</figcaption>
</figure>

Then it got more serious. Tokens from `kubectl create token` can't be revoked, so set a maximum token expiration for service accounts. The RBAC `escalate` verb, or a wildcard, gives someone god powers, so never use stars. Admission webhooks can take down your control plane, which is a good reason to move to CEL-based admission policies. Pods you see with `crictl` aren't Kubernetes pods. And a static pod manifest pointing at a namespace that doesn't exist gives you a pod the API server never shows you.

Paweł and Marcus came at it from very different angles. Both talks were about what sits under a tool that looks simple from the top, which most of us only find out about when something breaks.

## Test the limits before you hit them

Artem Lajko from iits-consulting and Gianluca Mardente from Ciroos AI, who created Sveltos, gave "Predicting GitOps at 15,000+ Clusters: What Large-Scale Testing Taught Us". They build Kubara, a Go CLI framework from STACKIT and iits for catalog-based platforms on Argo CD, open sourced in March. One adopter needed it for 15,000 edge clusters, now 16,000, with outbound-only access and a central place to manage it all. Five apps per cluster means 75,000 applications.

<figure>
<img src="/blog-images/cnd-poland-2026-04.jpg" alt="Slide titled Why...? with a cartoon bear whose neck is stuck in a bottle, next to an Argo CD architecture diagram">
<figcaption>Finding the bottleneck.</figcaption>
</figure>

When they asked the Argo CD maintainers, the answer was that their biggest customers run about 1,000 clusters, and could they please share what they found. So they tested it. The infrastructure budget was agreed over a conversation in a pub at €100,000 and ended at around €230,000 after 27 to 31 iterations. Using vCluster saved them the one to two million euros that real clusters would have cost.

What breaks Argo CD isn't the number of applications but the number of cached objects. They tried tuning, hydration, OCI and more processors, and the Argo CD agent is still in labs. In one snapshot, Argo CD needed 24 GB of RAM for 600 apps, while Sveltos ran 1,000 apps on under 1.5 GB. Tuned, Argo CD got to about 1,500 apps across 250 clusters. Sveltos in agent-based pull mode deployed 4,300 of 5,000 heavy apps in one go in about 130 minutes, and what stopped it was the 110-pods-per-node limit and the budget. Pull mode renders the Helm templates on the hub, so credentials stay central. Their advice was simple: don't run 15,000 clusters from one hub.

<figure>
<img src="/blog-images/cnd-poland-2026-05.jpg" alt="Artem Lajko next to a slide titled Load and Scale Testing the Hub: Argo CD, decorated with Cloudtein protein powder, GitOps Gainz protein bars and a weightlifting bear">
<figcaption>GitOps Gainz and Cloudtein.</figcaption>
</figure>

And the deck had some great mascots. A bear stuck in a bottle for the bottleneck, and a weightlifting bear with Cloudtein protein powder and GitOps Gainz bars for the load tests. I'm a big fan of mascots in decks, so this one landed.

I liked this talk because they did what most of us skip. Instead of assuming a tool would scale because it works at 100 clusters, they spent real money finding the limit before production found it for them, which is the answer to Paweł's bakery trap.

## Decide what you hand off

After lunch, Adriana Villela from Dynatrace and Josh Lee from Altinity gave the keynote "Zen AI Cohabitation: How I learned to embrace the slop". Great energy, and capybaras. Some of them carried over from the talks Adriana and I have been giving together this autumn, which made me smile. The capybaras were originally drawn by Adriana's daughter as mascots for her podcast, dressed up in Canva for each slide.

<figure>
<img src="/blog-images/cnd-poland-2026-06.jpg" alt="Josh Lee and Adriana Villela on stage next to a Dzień Dobry slide with a capybara and Adriana's bio: Capybara enthusiast, slop-free since 1979">
<figcaption>Dzień dobry from Josh and Adriana.</figcaption>
</figure>

AI isn't going to take our jobs, but it is going to take our jobs. Careers in software keep growing, but a lot of the daily tasks change or disappear. Adriana said the more she uses AI, the more depressed she gets, so they pitched the talk as a survival guide.

<figure>
<img src="/blog-images/cnd-poland-2026-08.jpg" alt="Slide: There are things you babysit. There are things you delegate. There are things you abdicate.">
<figcaption>Babysit, delegate, abdicate.</figcaption>
</figure>

The core of it was splitting work into three buckets: things you babysit, things you delegate, and things you abdicate. Delegate when you care about the process. Abdicate when you only care about the outcome. Excel graphs, regex and bash are fair game to abdicate. So was the CSS for Adriana's new website, after 16 years as a Java developer. Josh thought his Terraform was abdication, until it turned out he cared about the process after all. What you shouldn't hand over is the thinking, or you lose the muscle memory.

<figure>
<img src="/blog-images/cnd-poland-2026-07.jpg" alt="Josh Lee and Adriana Villela in front of a slide titled Abdication survival tips, with an orange capybara holding a lasso">
<figcaption>Abdication survival tips.</figcaption>
</figure>

On working with agents, they described LLMs as sycophantic interns. Give them sandboxed hands. Skip the markdown engineering and write prompts that generate deterministic code. One of them runs a cron agent that kills sessions that can't succeed, and they argued that good developer experience for agents matters as much as for people. They also disagreed, on stage, about whether code readability still matters when agents write it, and Adriana held on to human accountability.

Then they made a case for juniors. If companies stop hiring juniors, who maintains the systems when the seniors retire? Mentorship matters more than ever, and open source is still a good way in, as long as it isn't drive-by pull requests. Their advice for staying sane: AI can rob you of the satisfaction of finding the root cause yourself, so write your own content, make your own slide art, and take an AI holiday now and then.

This connected straight back to Paweł's LLM overdose, and to the hallway conversations at KCD UK earlier in the week. It's also close to how I think about platforms. A platform is a decision about what teams can hand off and stop thinking about. Babysit, delegate and abdicate is a useful way to make that decision explicit, for agents and for the platform underneath.

## Context turns gaps into a trace

Then my colleague Julia Furst Morgado gave "Uninstrumented". Julia went from law school in Brazil to business at Berkeley, then marketing at a managed service provider, a free coding bootcamp during the pandemic, open source, community events, DevRel, and becoming an AWS Hero. For years she worried about how to explain that path in an interview.

<figure>
<img src="/blog-images/cnd-poland-2026-09.jpg" alt="Julia Furst Morgado next to her title slide: Uninstrumented, Julia Furst Morgado, Principal Developer Relations Engineer, Dash0">
<figcaption>Julia Furst Morgado.</figcaption>
</figure>

So she asked the room. Raise your hand if your path into tech makes linear sense, from computer science degree to principal engineer. A few hands. Then raise your hand if your career looks like a plate of spaghetti. Clearly more. Most people in that room took some kind of non-linear path to get there.

<figure>
<img src="/blog-images/cnd-poland-2026-10.jpg" alt="Julia on stage with the audience in view, next to a slide asking people to raise their hand if their path into tech makes linear sense or if their resume looks like spaghetti">
<figcaption>Spaghetti won.</figcaption>
</figure>

Her reframe: she wasn't failing, she was just uninstrumented. She wrote a Python script that turned her career into OpenTelemetry spans and sent them to Dash0. The first export showed four separate root spans, one per career, with nothing connecting them. Adding a career parent span and propagating context turned them into one trace. The context she picked up from the sysadmins at the managed service provider carried into her tech career.

<figure>
<img src="/blog-images/cnd-poland-2026-11.jpg" alt="Julia next to a slide titled Actual: a distributed service map, showing her career as a tangled graph of spans from law school onwards">
<figcaption>A career as a distributed service map.</figcaption>
</figure>

From there, the tracing concepts kept fitting. Skills like communication became attributes, and a `carried_from` attribute plus baggage held what she brought from one role to the next: empathy, analytical rigour, resilience. The years cleaning houses and waiting tables became an unmonitored window, because a missing span isn't downtime. The bootcamp, and async programming in particular, became an error span that didn't kill the trace, and imposter syndrome is just an `exception.type`. The retry was 30 Days of OpenTelemetry in December 2025. Span links are the people who helped along the way, and they sit on the critical path.

She closed with a blameless postmortem playbook: notice what you carry, find your people, do it scared, answer the doubt in public, and keep a record of your wins. And the last slide: this is an active span.

It was a really nice way to tie a personal story to tracing concepts. I'm biased, but it's also a good explanation of why context propagation matters. Without the parent span, you have four unrelated stories. With it, you have one.

## Observability belongs in the platform

In the afternoon I gave "[Rethinking Observability as a Platform Product](/talks/rethinking-observability-as-a-platform-product-2026-10-22/)". I only had 30 minutes this time, so I rushed a bit, but I got the points across, and people I spoke to at the after party had some nice feedback, which I appreciated.

<figure>
<img src="/blog-images/cnd-poland-2026-12.jpg" alt="Kasper on stage next to a slide showing a trace waterfall with a trace ID">
<figcaption>Walking through a trace.</figcaption>
</figure>

The talk starts with Bryan Liles calling Kubernetes a car, and my version: OpenTelemetry is a car with a full tank. Then it goes back to 2017, when I stood on stage and drew the line between developers and the platform in the wrong place. Every shift since has traded one kind of load for another. Shift left moved the work to developers, and seven years later most things have moved down into the platform. Observability moved up.

<figure>
<img src="/blog-images/cnd-poland-2026-18.jpg" alt="Kasper pointing at a slide: We don't have a metrics problem, or a tracing problem. We have systems problems.">
<figcaption>It isn't necessarily a tooling problem.</figcaption>
</figure>

Observability promised a lot, and the reality hasn't matched it. We don't have a metrics problem or a tracing problem, we have systems problems. In the Weave Intelligence 2026 survey I used, 57% said their observability has too much noise or doesn't find the root cause, 58% named instrumentation skill gaps, and 39% said getting a new metric or trace into production takes more than 24 hours. The survey's own conclusion is the one I agree with: the platform absorbs the instrumentation burden, and developers receive telemetry as a default capability rather than a responsibility.

OpenTelemetry gives us the shared foundation to build that on: four signals and one vocabulary, with profiles in alpha. Correlation is the superpower, because, as my colleague Michele Mancioppi says, telemetry without context is just data. The rest of the talk is the contract between what the platform guarantees and what developers decide, the paved path with the OpenTelemetry Operator and Collector pipelines, and why AI needs that platform first. An AI SRE is a harness, and garbage in is still garbage out. The demo is on [GitHub](https://github.com/dash0hq/otel-platform-demo), and the [slides are here](https://kasper-nissen-presentations.s3.eu-west-1.amazonaws.com/decks/rethinking-observability-as-a-platform-product-2026-10.pdf) (PDF), and on the talk page.

Coming straight after Julia's keynote, it was fun to have a room that had just watched a career become a trace. Her parent span and my "correlation is the superpower" slide make the same point.

## More from the main hall

A few more talks I caught. Pawel Piwosz from UpCloud gave "Data sovereignty - what it really means?", and his point stuck with me: keeping your data in a Frankfurt data centre isn't enough when your CDN terminates TLS at points of presence around the world. He walked through the CLOUD Act, FISA 702 and the Schrems rulings on one side, and GDPR, NIS2, the Data Act and the AI Act on the other.

Nikhil Kumar's "Running Multi-Tenant GPUs on Kubernetes with NVIDIA GPU Operator and MIG" was a practical follow-up to Alex's point about GPU sharing. He split one H100 into seven 10 GB instances in a live demo, and compared time-slicing, MIG and HAMi for different workloads. The reason is cost: a small inference service doesn't need a whole GPU.

## Threat modeling in five minutes

Svitlana Chaplinska, Senior Security Engineer at Verda, CNCF Ambassador and KCD Helsinki organiser, ended the day with a lightning talk, "What Could Go Wrong? Threat Modeling Kubernetes in 5 Minutes". Threat modeling is a systematic way to ask what can go wrong and what you're going to do about it. Sketch the system, break it with STRIDE, fix what matters, and check your work, with open source tools like STRIDE GPT and OWASP Threat Dragon to help with the first draft. Come back to it every time the architecture changes.

<figure>
<img src="/blog-images/cnd-poland-2026-14.jpg" alt="Svitlana Chaplinska next to her title slide: What Could Go Wrong? Threat Modeling Kubernetes in 5 Minutes">
<figcaption>Svitlana Chaplinska.</figcaption>
</figure>

Five minutes is a hard format, and she fit a whole method into it. A cool way to end the day, and a good fit after Marcus's RBAC stars and webhooks in the morning.

## Ambassadors, and a goalkeeper

There were a few of us CNCF Ambassadors in Warsaw, so of course we needed a photo.

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

Looking back, the day kept coming back to Alex's question. The mission isn't done because the platform keeps absorbing new things: GPUs, agents, supply chain rules, more clusters than anyone planned for. Paweł and Marcus showed why you need to understand what's underneath before you lean on it. Artem and Gianluca showed what it costs to find the limits properly. Adriana and Josh gave us a way to decide what to hand off. And Julia and my own talk were both about context, without which the data, or the career, doesn't make sense.

I'm heading home today, but I managed to squeeze in a morning run to Warsaw's Old Town first.

<figure class="portrait">
<img src="/blog-images/cnd-poland-2026-17.jpg" alt="Kasper in a running jacket taking a selfie in front of the Palace of Culture and Science and a fountain">
<figcaption>Morning run past the Palace of Culture and Science.</figcaption>
</figure>

Thank you to the organisers and volunteers for putting together such a great event, and to everyone I talked to at the after party. Two conferences in one week, and both of them made me want to come back. I hope to see you in Warsaw again another time.
