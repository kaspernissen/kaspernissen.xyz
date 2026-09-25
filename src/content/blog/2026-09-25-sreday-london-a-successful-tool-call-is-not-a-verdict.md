---
title: "SREday London: A Successful Tool Call Is Not a Verdict"
date: 2026-09-25
summary: "Telemetry can already show what an AI agent did. Deciding whether it should have done it is the harder problem, and it came up on stage and at both dinners at SREday London."
tags: ["ai", "observability", "opentelemetry", "platform-engineering"]
hero: "sreday-london-2026-01.jpg"
---
A successful tool call tells you that an operation completed. It doesn't tell you whether it was the right operation to run.

That gap is what Adriana Villela and I spent our session on at SREday London on Thursday, and it kept coming back for the rest of the trip, at both dinners and in the conversations after the talk. I made a version of the same point about goose last month, when a small model [half-finished a task and reported success](/blog/observing-goose-on-ollama-with-opentelemetry): `result=success` means the tool returned without raising, not that it did anything useful. This time we built a rogue agent to show it.

## Your agent did what?

Thursday was the debut of [Your Agent Did What? Forensic Observability for Systems That Don't Leave Obvious Footprints](/talks/your-agent-did-what-forensic-observability-for-systems-that-don-t-leave-obvious-footprints-2026-09-24). It was also the first time Adriana and I have presented together. We had spent a lot of time experimenting with frameworks and instrumentation approaches, so it was good to finally put the work in front of people. Several of them caught us afterwards, and throughout the rest of the event, to keep the conversation going.

<figure class="portrait">
<img src="/blog-images/sreday-london-2026-03.jpg" alt="Kasper and Adriana taking a selfie in front of the audience in the cinema seats">
<figcaption>The view from the stage. SREday runs in a cinema, and the sofas are as comfortable as they look.</figcaption>
</figure>

The demo had a rogue goose agent deleting database records, followed by three AI SRE agents investigating the incident: a capybara, a beaver and an otter. Apparently a small collection of animals is now part of how we explain distributed systems.

Behind the animals were different languages and instrumentation libraries: Java with LangChain4j, and Python with OpenInference and OpenLLMetry. That let us compare what each approach captured, and how much of the incident we could reconstruct from the telemetry it left behind. The code is in the [demo repository](https://github.com/kaspernissen/your-agent-did-what).

<figure>
<img src="/blog-images/sreday-london-2026-04.jpg" alt="Adriana and Kasper on stage in front of a slide showing four agents sending telemetry through an OpenTelemetry Collector to Jaeger, Prometheus and Perses">
<figcaption>Four agents, one Collector. The GenAI normalizer processor sits between three instrumentation styles and the backends.</figcaption>
</figure>

The encouraging finding was how far the tools have converged on OpenTelemetry's [GenAI semantic conventions](https://github.com/open-telemetry/semantic-conventions-genai). The naming isn't fully aligned yet, but the shared vocabulary is visible, and normalizing in the Collector bridges most of what remains.

<!-- TODO: one concrete example. Which attribute did OpenInference and
OpenLLMetry emit differently, and what did the normalizer map it to? -->

That matters because changing frameworks shouldn't mean relearning what a model call or a tool invocation looks like. Shared conventions give you a common starting point for comparing and connecting the evidence.

## Evidence is not a verdict

What interests me most is what you can actually conclude from all that telemetry.

In the demo, the investigators could pull an audit log that identified goose as the client behind the deletions. goose's own telemetry added the rest: the sequence of calls, the arguments passed to the deletion tool, and what the agent reported afterwards. Connected, those two views gave a much better picture than either one alone.

<!-- TODO: how did it end? Did all three investigators identify goose, and
did any of them get it wrong? -->

We can already collect a lot of evidence. Depending on the instrumentation and what you choose to capture, you can inspect model inputs and outputs, tool calls with their arguments and results, and the order of the steps an agent took.

Someone still has to put that evidence together and judge whether the outcome was expected. Each deletion was, as far as the tool was concerned, a success. And an agent's own explanation is not a complete account of why it behaved the way it did.

<figure class="portrait">
<img src="/blog-images/sreday-london-2026-05.jpg" alt="Adriana smiling at the lectern next to the projected slide">
<figcaption>Adriana at the lectern, with the "without guardrails" slide still on screen.</figcaption>
</figure>

This is where we touched on LLM-as-judge. In the demo, a judge reads the incident prompt, the ordered tool calls and the investigator's report, then returns a score with an explanation. That gives you a second mechanism for assessing the outcome of an agent workflow.

<!-- TODO: what score did the judge give, and did you agree with it? -->

It also raises questions I enjoy more than the answers I have. When do you stop evaluating? Do you need a second judge to check the first, or a full jury going through the evidence? If they disagree, when does a human step in? And not every action deserves that level of scrutiny, so something has to decide which ones do.

I don't have neat answers yet, and they're exactly what I want to spend more time on. Capturing the evidence is becoming practical. Deciding how much evidence is enough to trust an outcome is the harder problem, and the more interesting one.

## The platform owns the plumbing

In the evening, my colleagues at Dash0 hosted a dinner, and I gave a short talk about treating observability as a platform product.

<figure>
<img src="/blog-images/sreday-london-2026-06.jpg" alt="Kasper speaking to a long dinner table of guests in a restaurant">
<figcaption>The Dash0 dinner on Thursday evening.</figcaption>
</figure>

I keep coming back to this topic because it's familiar from my eight years at Lunar, where I helped build our first Kubernetes-based platform. Giving developers access to powerful infrastructure primitives didn't give them a good developer experience. That took sensible defaults and a clear path through the complexity.

Observability needs the same treatment. An SDK, a Collector and access to a backend leave a lot of decisions for every team to make on its own: instrumentation, naming, correlation, sampling, routing. When each team solves those differently, whoever investigates the incident ends up joining the pieces by hand.

The contract I proposed at dinner was simple. The platform owns the plumbing. Product teams own the meaning. It's the same split I argued for in [In Search of Observability's Rails Moment](/blog/in-search-of-observabilitys-rails-moment), now with a room of people to push back on it.

The platform should deliver correctly instrumented, correlated telemetry by default, with consistent service identity and shared conventions. Teams build on that without assembling the plumbing themselves, and keep ownership of the business context: which events matter and what their service promises its users. OpenTelemetry is the foundation. Turning it into a product means designing for the people who use it, down to the defaults they inherit, the documentation they need and the way their feedback comes back.

That investment helps engineers today, and it matters more as we point AI systems at our telemetry and ask them to investigate incidents. If the evidence is fragmented or missing context, a more capable model still has to work around the gaps. Which is the afternoon's talk again: a judge can only weigh the evidence it's handed.

I'll go deeper on this at GOTO Copenhagen next week, in [Rethinking Observability as a Platform Product](/talks/rethinking-observability-as-a-platform-product-2026-09-30). If you're there, come and join the conversation.

## Competitors with a standard in common

The trip started on Wednesday evening with dinner with Mauricio Salatino, Andreas Grabner and Adriana. It was good to catch up with Mauricio, now a former colleague but still very much a friend, and hear about his new role at Apple.

<figure>
<img src="/blog-images/sreday-london-2026-02.jpg" alt="Adriana, Kasper, Andreas Grabner and Mauricio Salatino around a restaurant table">
<figcaption>Wednesday dinner with Adriana, Andi and Mauricio.</figcaption>
</figure>

It was also a reminder of something I value in this community. Across Dynatrace and Dash0, we work for competing vendors, but we have open source and OpenTelemetry in common. We share a belief in OpenTelemetry as the vendor-neutral way to collect telemetry, and helping people understand what it can do today benefits all of us. Doing that work with people you also enjoy having dinner with is a good arrangement.

The dinner conversations went well beyond observability. We talked about AI sovereignty and how people are building around it, and about coding agents turning more of the working day into reviewing generated pull requests. We also spent a long time on what we actually mean when we call something an agent, and how much depends on the model compared with the harness, tools and context around it. Does a given task need the largest model, or would a smaller one do the job with more precise context?

<!-- TODO: your answer to that last question, if you have one. -->

Then there was the question of what happens when these systems move into hardware that can physically hurt people, and whether the safeguards exist for that. Questions about trust and oversight get very concrete once the consequences reach the physical world.

## Final thoughts

The same question kept coming back, on stage and at both dinners: how much evidence is enough to trust what a system did? Collecting the evidence is getting easier. Deciding what it proves is the work. That is why I enjoy events like this: you share something you have been working on, hear how other people see it, and leave with more questions worth investigating.

Thanks to Adriana for a great first collaboration, to everyone who joined the session and came to talk afterwards, and to my Dash0 colleagues for putting the evening together.

<figure class="portrait">
<img src="/blog-images/sreday-london-2026-07.jpg" alt="Kasper after a run along the Thames, with the O2 arena behind him">
<figcaption>Part of the week's 30 km, along the Thames by the O2.</figcaption>
</figure>

I'm heading home with a new talk delivered and my weekly 30 km of running done. Now a few days at home before Copenhagen.
