---
title: "Observability Summit Europe 2026: OpenTelemetry Grows Up"
date: 2026-10-06
summary: "The first Observability Summit Europe took place in Prague, five months after OpenTelemetry graduated. The talks I caught were about what happens after hello world: getting the Collector into production, making it stable by default, and getting GenAI telemetry to converge on OpenTelemetry."
tags: ["observability", "opentelemetry", "ai", "conferences"]
hero: "observability-summit-europe-2026-01.jpg"
---
I almost didn't make it to Prague. On Sunday, the day before, I was supposed to fly from Billund via Amsterdam. Instead I was rebooked, and spent the evening at the airport hotel in Billund before a 6am flight via Frankfurt on Monday morning. Luckily, Adriana Villela and I had the last slot of the day, so I arrived with a few hours to spare.

The day was the first Observability Summit Europe, co-located with Open Source Summit Europe at the Prague Congress Centre. OpenTelemetry graduated in the CNCF in May, and the organisers marked it with graduation cupcakes. They were delicious.

<figure class="portrait">
<img src="/blog-images/observability-summit-europe-2026-11.jpg" alt="Cupcakes with OpenTelemetry flags in front of a sign congratulating OpenTelemetry on graduated status">
<figcaption>Graduation cupcakes.</figcaption>
</figure>

Graduation fit the talks I caught. Nobody was explaining what OpenTelemetry is. They were about what comes after hello world: running the Collector in production, keeping it stable when the schema underneath it changes, and choosing between agents with numbers rather than habit.

## Users already know how to get started

Juliano Costa and Johanna Öjeling maintain the OpenTelemetry Developer Experience SIG, and their talk, "What OpenTelemetry Users Taught Us About Developer Experience", started with an assumption that turned out to be wrong. When the SIG started, they took developer experience to mean the SDKs: easier configuration, clearer APIs, smoother onboarding. They asked SDK maintainers where they diverge from the spec and what their users ask for, and got answers that were all different. PHP's most requested feature was async exporting and a way to close dangling spans, but nothing applied across all the SIGs.

<figure>
<img src="/blog-images/observability-summit-europe-2026-02.jpg" alt="Juliano Costa in an OpenTelemetry t-shirt speaking into a microphone next to Johanna Öjeling">
<figcaption>Juliano Costa and Johanna Öjeling from the Developer Experience SIG.</figcaption>
</figure>

So they asked users instead. Together with the End User SIG, they ran a [survey](https://opentelemetry.io/blog/2025/devex-survey/) in early 2025. Of the 218 people who responded, 83% run OpenTelemetry in production and 77% work for an end-user organisation.

<figure>
<img src="/blog-images/observability-summit-europe-2026-03.jpg" alt="Johanna Öjeling giving her talk next to a slide: 218 community members responded, 83% run OpenTelemetry in production, 77% work for an end-user organization">
<figcaption>Who answered the survey.</figcaption>
</figure>

The strongest theme in the answers was that getting started is not the problem. There are plenty of hello world examples. What people wanted was clear guidance and practical examples for deploying and scaling the Collector.

<figure>
<img src="/blog-images/observability-summit-europe-2026-04.jpg" alt="Juliano and Johanna on stage next to a slide reading: Users already knew how to get started. What they needed was help getting to production.">
<figcaption>The finding that changed what the SIG works on.</figcaption>
</figure>

The SIG's answer was to interview companies of different sizes and publish their production setups, YAML and architecture diagrams included. Three stories are out so far.

**[Mastodon](https://opentelemetry.io/blog/2026/devex-mastodon/)** has one engineer running the Collectors, for about 300,000 daily active users. They run one Collector per namespace, which makes tail sampling easy, because every span of a trace already goes through the same Collector. They keep about 0.1% of successful traces and all of the error traces. In two years he hadn't had a single problem with the Collector itself. Version bumps and deprecations were the pain.

**[Adobe](https://opentelemetry.io/blog/2026/devex-adobe/)** has a central observability team and thousands of Collectors in a three-tier design. Service teams deploy a Helm chart that gives them a sidecar Collector and a deployment Collector in their own namespace. Those forward to a namespace the observability team manages, with one Collector per signal so a scaling problem with logs doesn't affect traces. From there, telemetry goes to whichever backends the team picked in its Helm values.

<figure>
<img src="/blog-images/observability-summit-europe-2026-05.jpg" alt="Slide titled Adobe: Three tiers deployment, showing an app with a sidecar Collector sending to a deployment Collector in the user namespace, then to metrics, logs and traces Collectors in a managed namespace, then to two backends">
<figcaption>Adobe's three tiers.</figcaption>
</figure>

The goal is that service teams don't have to become OpenTelemetry experts. The Operator's auto-instrumentation does most of that work. As Bogdan Stancu from Adobe put it: "People add two lines in their deployment. And it just works."

**[Skyscanner](https://opentelemetry.io/blog/2026/devex-skyscanner/)** has a six-person platform team running Collectors for more than 1,000 microservices, mostly Java, across 24 production clusters. Every service sends to one DNS name, and Istio routes it to the closest Collector. Gateway Collectors handle OTLP, and agent Collectors running as a DaemonSet scrape Prometheus endpoints where OTLP isn't an option yet. Their base Docker image ships the Java agent with auto-instrumentation switched off, except for gRPC and HTTP. "We disable everything, then enable what we need."

<figure>
<img src="/blog-images/observability-summit-europe-2026-06.jpg" alt="Slide titled Skyscanner: Two Collector types, with a gateway Collector replica set for app metrics, traces and span metrics and an agent Collector DaemonSet for infra metrics, both sending to one backend">
<figcaption>Skyscanner's two Collector types.</figcaption>
</figure>

Across the interviews, the first Collector was the hardest. Once teams knew the components and the deployment flow, the next ones got much easier. The organisations that do this well have three things in common.

<figure>
<img src="/blog-images/observability-summit-europe-2026-07.jpg" alt="Slide titled What teams are doing well: platform teams own the Collector, volume is controlled on purpose, declarative configuration everywhere">
<figcaption>Platform teams own the Collector, volume is controlled on purpose, and configuration is declarative everywhere.</figcaption>
</figure>

This is the [platform engineering argument I keep making](/blog/in-search-of-observabilitys-rails-moment/), backed by real production setups. The work now continues as [OpenTelemetry Blueprints and Reference Implementations](https://opentelemetry.io/blog/2026/blueprints-intro/). Blueprints are design-pattern guidance for common problems, and Reference Implementations are stories like these. Three more stories are written and waiting for company approval, which, as they found out, takes much longer than the interview itself.

## Three agents, one crown

Henrik Rexed's "Telemetry Colosseum" pitted the OpenTelemetry Collector against Fluent Bit v5 and OTel-Arrow, the Rust-based engine built around the OpenTelemetry Arrow protocol (OTAP). He was clear that this was feedback for the maintainers, not blame, and that OTel-Arrow is experimental enough that some of his findings may be out of date within months.

<figure>
<img src="/blog-images/observability-summit-europe-2026-08.jpg" alt="A full room watching Henrik Rexed's talk, with the Telemetry Colosseum title slide on screen">
<figcaption>A full room for the Colosseum.</figcaption>
</figure>

He started with the protocol, because it ended up being the conclusion. OTLP repeats the attributes on every record. The sender packs the data into protobuf, the next hop unpacks it, and packs it again for the hop after that. All of that costs CPU. OTAP is columnar and dictionary-encoded, so repeated values cross the network once and the data arrives in a shape that's easy to work with.

<figure>
<img src="/blog-images/observability-summit-europe-2026-09.jpg" alt="Henrik Rexed in front of a slide titled Protocol compatible for all signals, showing two gladiator busts labelled OTLP and OTAP">
<figcaption>OTLP and OTAP, as gladiators.</figcaption>
</figure>

On pipeline design he called it a draw. Fluent Bit's flat YAML with tags, the Collector's list of components wired together in a `service` section, and OTel-Arrow's nodes and connectors can all express the same pipelines. Which one you prefer is mostly habit. Plugin coverage was a different story. OTel-Arrow can't read logs from files yet, can't add Kubernetes metadata, can't scrape Prometheus or receive remote write, and has no sampling. Its transform language, OPL, will feel familiar to anyone who knows OTTL. Fluent Bit v5 added delta conversion for metrics and has had tail sampling since v4.

The benchmark ran the OpenTelemetry Demo with Istio, adding 50 users every 30 minutes up to 200 over two hours. Fed OTAP, OTel-Arrow was in a different league: around 10 millicores of CPU and almost no memory, against 100 to 120 millicores when the same engine received OTLP. Over OTLP it had no edge. It used more CPU and memory than the Collector, whose memory stayed flat, while Fluent Bit's memory climbed sharply. So the gain depends on OTAP end to end, and that's the catch today. SDKs don't emit OTAP yet, so a Collector has to translate in front of OTel-Arrow, and in his runs that Collector used more CPU and memory than anything else. The savings moved rather than disappeared. He has opened an issue and plans to retest.

<figure>
<img src="/blog-images/observability-summit-europe-2026-10.jpg" alt="Henrik Rexed in front of a radar chart comparing Fluent Bit, the Collector and OTel-Arrow on pipelines, Prometheus, log parsing, CPU, memory, telemetry metrics and OpenTelemetry support">
<figcaption>The scorecard.</figcaption>
</figure>

The network numbers are where OTAP pays off. For the same traces, metrics and logs, it sent a fraction of the TCP packets. On a cloud bill, that's real money. His ranking as of 5 October: the Collector first, Fluent Bit second, OTel-Arrow third. OTAP is the part to watch, and it gets interesting once SDKs and vendor endpoints speak it natively.

## Stable by default

The talk I was most curious about was "From Schema to Shipping Data: Making OpenTelemetry Stable by Default" by Christos Markou from Elastic and Pablo Baeyens from Datadog. It makes a point that's easy to miss. You can't make OpenTelemetry stable by stabilising the Collector alone, because the Collector emits a schema, and the schema is defined somewhere else, in the semantic conventions. Both have to stabilise together.

<figure>
<img src="/blog-images/observability-summit-europe-2026-12.jpg" alt="Christos Markou and Pablo Baeyens next to a slide of the OpenTelemetry ecosystem: applications, agent and gateway Collectors, backends, and semantic conventions running underneath all of it">
<figcaption>The semantic conventions run underneath everything else.</figcaption>
</figure>

Two stories showed why. The kubeletstats receiver shipped a metric called `k8s.node.cpu.utilization`, but in the semantic conventions "utilization" means a ratio between 0 and 1, and these were raw nanocore values. The fix was a rename to `k8s.node.cpu.usage`. Done carelessly, a rename means your dashboard goes blank and your alert stops firing after an upgrade. Done carefully, it sat behind a feature gate for more than 10 releases before it became the default. The HTTP semantic conventions were the same problem at a much larger scale. Renaming `http.method` to `http.request.method` and friends affected every Collector component, every language SDK and plenty of user pipelines.

<figure>
<img src="/blog-images/observability-summit-europe-2026-13.jpg" alt="Slide titled Story 1: Kubelet Stats, explaining that k8s.node.cpu.utilization was really raw nanocore values, was renamed to k8s.node.cpu.usage, and went through a multi-release deprecation">
<figcaption>Utilization means a ratio. These weren't.</figcaption>
</figure>

A bit over half of the respondents to the last Collector survey named stability as their top concern, and the same confusion came up in the CNCF's graduation interviews with adopters. For the semantic conventions, stable simply means names and values don't change. For a Collector component, it's broader: configuration, tests, documentation, internal telemetry, and a community of maintainers and real adopters behind it. The Collector SIG picked seven components to stabilise first, and uses them as a template for the rest.

<figure>
<img src="/blog-images/observability-summit-europe-2026-14.jpg" alt="Slide titled The 7 Highest-Priority Components: filelog, hostmetrics and prometheus receivers, and k8sattributes, resourcedetection, transform and filter processors, with tracking issue opentelemetry-collector-contrib#44130">
<figcaption>Three receivers and four processors. The tracking issue is <a href="https://github.com/open-telemetry/opentelemetry-collector-contrib/issues/44130">opentelemetry-collector-contrib#44130</a>.</figcaption>
</figure>

For schema changes, there's now a standard migration with two feature gates per component. First you can opt in to the new names, or publish both. Then the new names become the default and you can opt out. Because it's per component, different teams owning different parts of a pipeline can migrate at their own pace.

<figure>
<img src="/blog-images/observability-summit-europe-2026-15.jpg" alt="Timeline slide: Oct 2025 K8s metrics in semconv, Nov 2025 SIG alignment at KubeCon NA, Apr 2026 migration process RFC approved, Jun 2026 K8s attributes stable in semconv v1.42.0, Sep 2026 k8sattributes v1, the first contrib component to ship as v1, 2027 more to come">
<figcaption>From Kubernetes metrics in the semantic conventions to the first stable contrib component in a year.</figcaption>
</figure>

The Kubernetes semantic conventions SIG had ported every Kubernetes metric the Collector emits into the semantic conventions by October 2025. At KubeCon North America in November, the SIG decided to align with the Collector's list and stabilise the attributes those seven components actually use. The Kubernetes attributes went stable in semantic conventions v1.42.0 in June. In September, the k8sattributes processor became the first stable component in Collector contrib. Process metrics are a release candidate and already available as an opt-in in the hostmetrics receiver, and 34 Kubernetes and container metrics are release candidates waiting to be ported.

Next up are Prometheus interoperability, where one major question about mapping the data models remains, and OTTL, which is close to stable. Pablo has also opened an RFC for a v1 core distribution with a stability-level flag that defaults to stable components only. To use beta or alpha components, you'd lower the level on purpose.

That is the part I find most interesting. Stable by default turns stability from something each user has to research component by component into something they get unless they ask for less.

## Your agent did what?

Adriana and I closed the day with [Your Agent Did What? Forensic Observability for Systems That Don't Leave Obvious Footprints](/talks/your-agent-did-what-forensic-observability-for-systems-that-don-t-leave-obvious-footprints-2026-10-05/), the second outing for the talk we debuted at [SREday London](/blog/sreday-london-a-successful-tool-call-is-not-a-verdict/) less than two weeks ago. The slides are on the talk page.

<figure>
<img src="/blog-images/observability-summit-europe-2026-01.jpg" alt="Kasper and Adriana taking a selfie from the stage with the audience behind them">
<figcaption>The last slot of the day, and people still showed up.</figcaption>
</figure>

Our starting point a few months ago was that GenAI observability was fragmented. OpenInference, OpenLLMetry and framework-specific conventions solve the same problems with different attribute names. The model is `llm.model_name` in one and `gen_ai.request.model` in another. The good news is that most of them are converging on OpenTelemetry's GenAI semantic conventions. For the rest, there's the GenAI normalizer processor in Collector contrib, which maps OpenInference and OpenLLMetry attributes to `gen_ai.*` at the Collector.

<figure>
<img src="/blog-images/observability-summit-europe-2026-16.jpg" alt="Adriana speaking next to a slide titled The gen_ai semantic conventions: what can they answer today, mapping questions like which tool or what actually happened to gen_ai attributes, several of them opt-in">
<figcaption>Adriana on what the GenAI semantic conventions can answer today, and which attributes are opt-in.</figcaption>
</figure>

Then the demo. A rogue goose agent deletes rows from a database, and three AI SRE agents investigate: Capybara in Java with LangChain4j, Beaver in Python with OpenInference, and Otter in Python with OpenLLMetry. All three send telemetry through one Collector with the normalizer processor, so we can compare what each one captured.

<figure>
<img src="/blog-images/observability-summit-europe-2026-19.jpg" alt="Kasper giving the demo next to a Jaeger trace of capybara-sre POST /chat, with model completions and MCP tool calls to list_records and audit_log nested underneath">
<figcaption>Capybara's investigation in Jaeger.</figcaption>
</figure>

The investigation takes about 19 seconds, mostly model calls. The two tool calls that crack the case, `list_records` and `audit_log`, take 63 milliseconds between them. The answer is in the `audit_log` result. The DELETEs came from the client `goose`, using the `deploy_svc` database role. Goose did it.

<figure>
<img src="/blog-images/observability-summit-europe-2026-17.jpg" alt="Kasper next to a slide titled The 63 millisecond clue, with a capybara holding a magnifying glass over the two short tool call spans in a 19 second agent trace">
<figcaption>Nineteen seconds of investigation, 63 milliseconds of evidence.</figcaption>
</figure>

The telemetry can prove what the agent did, but not why. There's no `gen_ai.tool.call.reason`, and the model doesn't tell us everything. To judge whether the investigation was any good, we used LLM-as-judge, which is just another model call. It reads the incident prompt, every tool call in order, and what the agent reported, and returns a `gen_ai.evaluation.result` event with a score you can use as a metric and a label you can use as a gate.

<figure>
<img src="/blog-images/observability-summit-europe-2026-18.jpg" alt="Kasper next to a slide titled Enter LLM-as-judge, aka just another model call, with a capybara judge in a wig returning a gen_ai.evaluation.result log record">
<figcaption>CapybaraJudge, in a wig.</figcaption>
</figure>

The questions afterwards were about exactly this: how to observe agents, how quickly the different conventions are converging on OpenTelemetry, and, of course, the capybara, otter and beaver. The code is in the [demo repository](https://github.com/kaspernissen/your-agent-did-what).

Henrik and Iris Dyrmishi, who hosted the day, closed the summit right after us.

<figure>
<img src="/blog-images/observability-summit-europe-2026-20.jpg" alt="Iris Dyrmishi and Henrik Rexed on stage next to the Observability Summit Europe title slide">
<figcaption>Iris and Henrik closing the first Observability Summit Europe.</figcaption>
</figure>

## In between the talks

The conversations between the talks are always one of my favourite parts of these events, and this one had plenty. It was great to see Juliano Costa, Henrik Rexed, Iris Dyrmishi, Diana Todea, Andrej Kiripolsky, Severin Neumann and many more.

At the reception I finally met John Hayes. I've followed his [Observability 360](https://observability-360.com/) newsletter for a while, and we covered a lot of ground.

After the reception, Adriana, Henrik, Severin, Andrej, Iris and I went for dinner and cocktails at a rather weird Harry Potter-themed place. Odd venue, but great company and interesting conversations.

<figure>
<img src="/blog-images/observability-summit-europe-2026-21.jpg" alt="Five of us around a dark table under a Slytherin banner, holding the menus">
<figcaption>Dinner under the Slytherin banner.</figcaption>
</figure>

<figure class="portrait">
<img src="/blog-images/observability-summit-europe-2026-23.jpg" alt="A cocktail served in a small pink bathtub with a rubber duck next to it">
<figcaption>Yes, the cocktail came in a bathtub, with a duck.</figcaption>
</figure>

<figure>
<img src="/blog-images/observability-summit-europe-2026-22.jpg" alt="The six of us taking a group selfie outside at night">
<figcaption>The whole group, on the way out.</figcaption>
</figure>

## Final thoughts

For a first edition, Observability Summit Europe was a good day. Most of the talks I saw assumed you already run OpenTelemetry, and asked how to run it well, keep it stable and extend it to agents. I like that the questions have moved on.

Thanks to Henrik and Iris for hosting, to everyone who stayed for the last session of the day, and to Adriana for another round of capybaras.

I'm staying in Prague for the rest of the week for Open Source Summit Europe. On Thursday, Adriana and I will give a slightly longer version of our talk. If you're around, come and say hi.
