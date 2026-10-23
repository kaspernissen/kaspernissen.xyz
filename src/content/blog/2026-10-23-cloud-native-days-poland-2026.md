---
title: "Cloud Native Days Poland 2026: Great Vibes in Warsaw"
date: 2026-10-23
summary: "A day in Warsaw with a vibrant Polish community. Alex Chircop on where the CNCF is heading, Marcus Noble's Kube-Oddities, Artem Lajko's GitOps scale tests, capybaras and AI delegation from Adriana and Josh, Julia's career traced with OpenTelemetry, my talk on observability as a platform product, and a photo with Jerzy Dudek."
tags: ["kubernetes", "conferences", "opentelemetry", "platform-engineering"]
hero: "cnd-poland-2026-01.jpg"
draft: false
---
Two days after [KCD UK](/blog/kcd-uk-2026/) in Edinburgh, I was in Warsaw for Cloud Native Days Poland. Great vibes all day. The Polish community is vibrant, and a lot of fun to hang out with.

## Where the CNCF is going

Alex Chircop from Google, who sits on the CNCF Technical Oversight Committee, opened with "The State of Cloud Native Union". The CNCF is 11 years old, Kubernetes is 12, and the foundation now has 230 projects, with sandbox projects growing the fastest.

<figure>
<img src="/blog-images/cnd-poland-2026-01.jpg" alt="Alex Chircop next to a slide quoting the CNCF charter: CNCF's mission is to make cloud native computing ubiquitous">
<figcaption>Alex Chircop asking whether 230 projects means the mission is done.</figcaption>
</figure>

His answer was no. Ubiquity means the foundation keeps evolving as new workloads show up. Scheduling is becoming topology aware, most AI inference and model serving already runs on Kubernetes, agents need sandboxes, and the EU Cyber Resilience Act puts supply chain security at the top of the list. He finished with how to get involved: TAG meetings are open, and anyone can propose a TOC initiative on GitHub. It's always great to hear from someone who works this closely with the projects and the foundation.

## Kube-Oddities

Marcus Noble from Monzo gave "Kube-Oddities - the quirks that keep Kubernetes interesting". His co-speaker Márk Sági-Kazár couldn't make it, so Marcus did it solo. I've seen this talk a few times now, and it's fun every time. Marcus keeps the energy high while walking through things like native sidecars being init containers with `restartPolicy: Always`, tokens from `kubectl create token` that can't be revoked, and admission webhooks that can take down your control plane.

<figure>
<img src="/blog-images/cnd-poland-2026-02.jpg" alt="Marcus Noble pointing at a slide titled DNS Policy, with ClusterFirst highlighted and the note: Obviously not the default">
<figcaption>The pod DNS policy called Default isn't the default.</figcaption>
</figure>

<figure class="portrait">
<img src="/blog-images/cnd-poland-2026-03.jpg" alt="Marcus Noble on stage with a microphone in front of a Cloud Native Days Poland sponsor banner">
<figcaption>Marcus Noble.</figcaption>
</figure>

## GitOps at 15,000 clusters

Artem Lajko from iits-consulting and Gianluca Mardente, the Sveltos maintainer, gave "Predicting GitOps at 15,000+ Clusters: What Large-Scale Testing Taught Us". They needed a platform for 15,000 edge clusters, with outbound-only access. The Argo CD maintainers told them their biggest customers run about 1,000 clusters, so they tested it themselves.

<figure>
<img src="/blog-images/cnd-poland-2026-04.jpg" alt="Slide titled Why...? with a cartoon bear whose neck is stuck in a bottle, next to an Argo CD architecture diagram">
<figcaption>Finding the bottleneck.</figcaption>
</figure>

Over two months and 27 to 31 iterations, the infrastructure budget went from a planned €100,000 to about €230,000. What breaks Argo CD isn't the number of applications but the number of cached objects. Their answer was to add Sveltos in agent-based pull mode to the Kubara catalog, which deployed 4,300 of 5,000 heavy apps in one go. And the deck had some great mascots.

<figure>
<img src="/blog-images/cnd-poland-2026-05.jpg" alt="Artem Lajko next to a slide titled Load and Scale Testing the Hub: Argo CD, decorated with Cloudtein protein powder, GitOps Gainz protein bars and a weightlifting bear">
<figcaption>GitOps Gainz and Cloudtein.</figcaption>
</figure>

## Capybaras and slop

After lunch, Adriana Villela from Dynatrace and Josh Lee from Altinity gave the keynote "Zen AI Cohabitation: How I learned to embrace the slop". Great energy, and capybaras, some of them carried over from the talks Adriana and I have been giving together.

<figure>
<img src="/blog-images/cnd-poland-2026-06.jpg" alt="Josh Lee and Adriana Villela on stage next to a Dzień Dobry slide with a capybara and Adriana's bio: Capybara enthusiast, slop-free since 1979">
<figcaption>Dzień dobry from Josh and Adriana.</figcaption>
</figure>

The framing: AI isn't going to take our jobs, but it is going to take our jobs. Careers in software keep growing, but a lot of the daily tasks change. They split work into three buckets: things you babysit, things you delegate, and things you abdicate. Delegate when you care about the process, abdicate when you only care about the outcome. Excel graphs, regex and CSS are fair game. The thinking isn't.

<figure>
<img src="/blog-images/cnd-poland-2026-07.jpg" alt="Josh Lee and Adriana Villela in front of a slide titled Abdication survival tips, with an orange capybara holding a lasso">
<figcaption>Abdication survival tips.</figcaption>
</figure>

<figure>
<img src="/blog-images/cnd-poland-2026-08.jpg" alt="Slide: There are things you babysit. There are things you delegate. There are things you abdicate.">
<figcaption>Babysit, delegate, abdicate.</figcaption>
</figure>

They also made a case for juniors. Companies that stop hiring juniors are setting themselves up for systems nobody can maintain once the seniors leave, so mentorship matters more than ever. And their advice for staying sane: write your own content, make your own slide art, and take an AI holiday now and then.

## Uninstrumented

Then my colleague Julia Furst Morgado gave "Uninstrumented". Julia went from law school in Brazil to business at Berkeley, then marketing, a free coding bootcamp during the pandemic, open source, community events, and DevRel. For years she worried about how to explain that path in an interview.

<figure>
<img src="/blog-images/cnd-poland-2026-09.jpg" alt="Julia Furst Morgado next to her title slide: Uninstrumented, Julia Furst Morgado, Principal Developer Relations Engineer, Dash0">
<figcaption>Julia Furst Morgado.</figcaption>
</figure>

So she asked the room. Raise your hand if your career was the straight line from computer science degree to principal engineer. A few hands. Then raise your hand if your career looks like a plate of spaghetti. Most of the room. Most of us took some kind of non-linear path to end up there.

<figure>
<img src="/blog-images/cnd-poland-2026-10.jpg" alt="Julia on stage with the audience in view, next to a slide asking people to raise their hand if their path into tech makes linear sense or if their resume looks like spaghetti">
<figcaption>Spaghetti won.</figcaption>
</figure>

Her reframe: she wasn't failing, she was just uninstrumented. She wrote a script that turned her career into OpenTelemetry spans and sent them to Dash0. The first export showed four separate root spans, one per career, until she added a parent span and propagated the context. Skills that stayed constant across roles became attributes, the years cleaning houses and waiting tables became an unmonitored window rather than downtime, and the coding bootcamp became an error span that didn't kill the trace. Imposter syndrome is just an `exception.type`. It was a really nice way to tie a personal story to tracing concepts.

<figure>
<img src="/blog-images/cnd-poland-2026-11.jpg" alt="Julia next to a slide titled Actual: a distributed service map, showing her career as a tangled graph of spans from law school onwards">
<figcaption>A career as a distributed service map.</figcaption>
</figure>

## My talk

In the afternoon I gave "[Rethinking Observability as a Platform Product](/talks/rethinking-observability-as-a-platform-product-2026-10-22/)". I only had 30 minutes this time, so I rushed a bit, but I got the points across: observability isn't a tooling decision, it's a platform product with users, defaults and paved paths, and OpenTelemetry gives you the shared foundation to build it on. People I spoke to at the after party had some nice feedback, which I appreciated. The deck is on the talk page.

<figure>
<img src="/blog-images/cnd-poland-2026-12.jpg" alt="Kasper on stage next to a slide showing a trace waterfall with a trace ID">
<figcaption>Walking through a trace.</figcaption>
</figure>

<figure class="portrait">
<img src="/blog-images/cnd-poland-2026-13.jpg" alt="Kasper pointing at a slide: We don't have a metrics problem, or a tracing problem. We have systems problems.">
<figcaption>It isn't necessarily a tooling problem.</figcaption>
</figure>

## Threat modeling in five minutes

Svitlana Chaplinska from Verda ended the day with a lightning talk, "What Could Go Wrong? Threat Modeling Kubernetes in 5 Minutes". Sketch the system, break it with STRIDE, fix what matters, and check your work, with open source tools for each step. A cool way to end the day.

<figure>
<img src="/blog-images/cnd-poland-2026-14.jpg" alt="Svitlana Chaplinska next to her title slide: What Could Go Wrong? Threat Modeling Kubernetes in 5 Minutes">
<figcaption>Svitlana Chaplinska.</figcaption>
</figure>

## Ambassadors, and a goalkeeper

There were a few of us CNCF Ambassadors in Warsaw.

<figure>
<img src="/blog-images/cnd-poland-2026-15.jpg" alt="Svitlana, Marcus, Julia, Kasper and Adriana in front of the Cloud Native Days Poland backdrop">
<figcaption>The CNCF Ambassadors at Cloud Native Days Poland.</figcaption>
</figure>

I also had a somewhat random opportunity to get a photo with Jerzy Dudek, who, I've since learned, won the Champions League with Liverpool in 2005.

<figure class="portrait">
<img src="/blog-images/cnd-poland-2026-16.jpg" alt="Kasper, Svitlana, Jerzy Dudek in a red Liverpool shirt, and Julia in front of a Wasabi and Liverpool FC backdrop">
<figcaption>With Jerzy Dudek.</figcaption>
</figure>

## Wrapping up

I'm heading home today, but I managed to squeeze in a morning run to Warsaw's Old Town first.

<figure class="portrait">
<img src="/blog-images/cnd-poland-2026-17.jpg" alt="Kasper in a running jacket taking a selfie in front of the Palace of Culture and Science and a fountain">
<figcaption>Morning run past the Palace of Culture and Science.</figcaption>
</figure>

Thank you to the organisers for putting together such a great event. I hope to come back another time.
