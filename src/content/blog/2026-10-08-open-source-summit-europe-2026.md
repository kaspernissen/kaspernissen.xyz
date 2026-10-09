---
title: "Open Source Summit Europe 2026: No Sovereignty Without Participation"
date: 2026-10-08
summary: "Two days of Open Source Summit Europe in Prague. The keynotes kept returning to Europe's governance gap in open source and to defending maintainers when AI makes vulnerabilities cheap to find: a 20x jump in OpenStack advisories, curl's bug bounty noise, Akrites, and Kubernetes publishing SLSA verification summaries for its images. Plus agentgateway, the Kubernetes Agent Sandbox, a benchmark of agent memory backends, and our own talk."
tags: ["open-source", "conferences", "ai", "security"]
hero: "open-source-summit-europe-2026-03.jpg"
---
After Observability Summit on Monday, I stayed in Prague for Open Source Summit Europe, which ran alongside Embedded Linux Conference at the Prague Congress Centre from 7 to 9 October. This post covers Wednesday and Thursday. One of the hot topics in the keynotes was the gap between how much code Europe writes in open source and how little say it has in how that code is governed. The afternoons were about agents, and on Thursday Adriana and I gave our talk.

## Europe and the global commons

Thierry Carrez, General Manager of Linux Foundation Europe, opened with the question people ask whenever they meet someone from the foundation: what does the Linux Foundation actually do? The short answer is that it gives organisations a neutral legal home and the services to build open source together.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-02.jpg" alt="Thierry Carrez in front of a slide full of Linux Foundation project logos, including Kubernetes, PyTorch, OpenStack and OpenTelemetry">
<figcaption>Thierry Carrez and a small part of what the Linux Foundation hosts.</figcaption>
</figure>

Thierry's example of Europe using the commons was the European Central Bank's Pontes, built on LF Decentralized Trust projects. Over the last 12 months, 139 European organisations joined the Linux Foundation, among them Mistral AI and Germany's Federal Office for Information Security. AWS joined as the newest platinum member.

## The State of Open Source in Europe

Mirko Boehm and Paula Grzegorzewska from Linux Foundation Europe presented the [2026 State of Open Source in Europe](https://www.linuxfoundation.org/research) report, released that morning. It's based on a survey of 367 European organisations.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-03.jpg" alt="Mirko Boehm and Paula Grzegorzewska on stage next to the cover of the 2026 State of Open Source in Europe report">
<figcaption>Mirko Boehm and Paula Grzegorzewska with the report.</figcaption>
</figure>

94% of European organisations already use or pilot generative AI coding tools, and 48% say those tools make them use more open source. Mirko was clear that it cuts both ways. Contributions are up, and so are security advisories, often by multiples, for maintainers who were overwhelmed before AI.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-04.jpg" alt="Slide: 48% of European organisations use more open source because of AI coding assistants, 5% use less; 76% get more value from the open source they run; 94% use or pilot generative AI coding tools">
<figcaption>48% use more open source because of AI coding assistants. Only 5% use less.</figcaption>
</figure>

The governance numbers stuck with me. 59% of organisations contribute code upstream, but only 37% take part in governance. Those that only consume report a 3.6x return on what they put in, and those most involved in governance report 4.6x. Participation is also how you see breaking changes coming. Neutrally governed, foundation-hosted projects are Europe's preferred model, at 52%. In Mirko's words, Europe favours openly governed projects and then lets others govern them.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-05.jpg" alt="Slide: 59% contribute code upstream but only 37% participate in governance; open source returns 4.1x on average, from 3.6x to 4.6x with mature governance; 52% prefer foundation-hosted projects">
<figcaption>The governance gap, in four numbers.</figcaption>
</figure>

Paula, who works on policy in Brussels, covered digital sovereignty. 94% of European organisations call it strategically important, and Europe weighs national and regional interests 12 percentage points higher than the rest of the world. The European Commission's Tech Sovereignty Package plans at least €2 billion for open source over seven years. The European public sector spends more than €264 billion on proprietary IT every year.

## No sovereignty without participation

Thierry came back on stage to talk about sovereignty. The worry used to be foreign governments reading your data. Now it's kill switches and dependencies turned into weapons, and the goal is being strong enough to take part as an equal.

Open source is often sold as the shortcut, and Thierry pushed back twice. Single-vendor open source still leaves you depending on one company that can be acquired or change direction. And openly governed open source only gives you control in theory if nobody on your side knows the project, its release process or how it handles vulnerabilities. "There can be no sovereignty without participation."

The Linux Foundation's own numbers show the gap. Across its 620 projects, 38% of code contributions in the last 12 months came from Europe, 44% for the Linux kernel and more than half for Zephyr. Only 15% of membership dues came from Europe. US and Asian companies, Thierry said, worked out long ago that funding openly governed open source is strategic.

I agree with Thierry. Governance is the less visible half of open source work. It rarely shows up in an engineering team's goals, and it decides where the project goes.

## Organising the defence

Thierry helped start OpenStack 16 years ago and was its release manager. OpenStack had six security advisories in 2021, none in 2022, three in 2023, five in 2024 and two in 2025. Thierry asked the room to guess the number for the first three quarters of 2026.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-09.jpg" alt="Thierry Carrez next to a bar chart of OpenStack security advisories: a handful per year from 2021 to 2025, then 42 for 2026">
<figcaption>Same software, same team.</figcaption>
</figure>

It was 42, on track to pass 60 by year end, and the same small team handles all of them. AI has made offence cheap, so Thierry wants the defence organised in the open too: pooled security resources and shared defensive tooling.

Mark Weatherford, AI cybersecurity strategist at NVIDIA, presented one piece of that, the Open Secure AI Alliance. NVIDIA announced it in late July with 30 partners. After more than 2,000 companies applied in two weeks, NVIDIA asked the Linux Foundation to run it. Its first initiative is SAFE, the Shared AI Finding Exchange, where members share incidents involving agentic AI so everyone can learn from the root causes. Mark called it "an incident learning initiative, not an enforcement body". It will be announced later this month.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-10.jpg" alt="Mark Weatherford on stage next to a slide titled Open Secure AI Alliance: The Journey So Far">
<figcaption>Mark Weatherford on the Open Secure AI Alliance.</figcaption>
</figure>

Gabriele Columbro, Executive Director of FINOS, gave the banking version. Patching is the easy part for a bank. Getting the patch into production means change records, regression runs and reports to regulators, from budgets where around 70% goes to keeping the lights on. FINOS's Open Source Enterprise Resilience Alliance, launched in June, pools that work. Banks share what they depend on, FINOS contracts vendors to fix it, and the hardened releases are published as open forks with attestations. After 100 days it has six members and 50 projects.

## Open Grid

Alice Yake, VP of Grids at Breakthrough Energy, launched the Open Grid Foundation with a question: if you had a billion dollars for the energy transition, would you spend it on panels or on the software to plan the system? Grid investment needs to roughly double to around $600 billion a year, and nothing gets built without a plan. The open source planning tools exist, but you often need a PhD to use them and they don't work together. Open Grid wants to make them interoperable and usable by regulators and planners.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-12.jpg" alt="Alice Yake walking across the stage in front of the OpenGrid logo">
<figcaption>Alice Yake launching Open Grid.</figcaption>
</figure>

## Docs for humans and their agents

Erin McKean from the Google Open Source Programs Office gave the funniest keynote of the morning. [Docsy](https://www.docsy.dev/), the Hugo theme for technical docs that Kubernetes, OpenTelemetry and many others use, is moving to the Linux Foundation. Erin thanked Patrice Chalin, in practice the lead maintainer since 2021.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-14.jpg" alt="Erin McKean next to a slide reading: Docsy is short for Docsy McDocsface. Its full name is Sir David Attenborough.">
<figcaption>The naming is settled.</figcaption>
</figure>

Then came the "Yay, AI" slide, next to a Bronzino portrait with exactly the expression you'd expect. Documentation people are a bit salty that docs get resources now that the robots want them, Erin admitted, but it doesn't matter how information reaches people as long as it does. "If someone told me that there was evidence that said opera is the best way to reach your project users, I'd be writing operas."

<figure>
<img src="/blog-images/open-source-summit-europe-2026-17.jpg" alt="Erin McKean next to a slide reading Yay, AI beside Bronzino's Portrait of Eleanor of Toledo">
<figcaption>Yay, AI.</figcaption>
</figure>

Docsy is adding features for agents: pointing LLMs to the pages that explain your project, and publishing Markdown next to the rendered docs. AF doc scores, for agent-friendly, are coming soon. Erin would very much like to call the project DocsAF.

## Trust for agents

Laura Tacho, now Senior Principal Technologist at AWS, talked about open standards for trusted agentic workloads. Jellyfish data shows the share of pull requests with autonomous agent involvement taking off in 2026, reaching 28.2% at the median company in September and 58.3% for the top 10%.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-19.jpg" alt="Laura Tacho next to a Jellyfish chart of autonomous agent involvement in pull requests, rising sharply through 2026 to 28.2% at P50 and 58.3% at P90">
<figcaption>Agent involvement in pull requests, January 2025 to September 2026.</figcaption>
</figure>

Trust isn't keeping up. 89% of developers say AI coding tools help them, while only 62% think their company manages the risks of AI-generated code well. Laura argued the fix has to be structural. Systems of agents keep crossing trust boundaries, and if every governance wrapper is proprietary, we build walls between them. Laura tied it to Prague, a city known for its bridges.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-20.jpg" alt="Laura Tacho next to a slide titled The AI Governance Gap: 89% say AI coding tools help, 62% say they manage the risks of AI-generated code">
<figcaption>A trust gap and a governance gap.</figcaption>
</figure>

Laura highlighted two projects. [Cedar](https://www.cedarpolicy.com/), a CNCF sandbox project, is a policy language and engine that keeps authorisation outside your application. You can let an agent `git push`, but only to branches other than `main`. [Dogwood](https://github.com/dogwood-policy) builds on Cedar with history: the agent can push only if the tests passed within the last 15 minutes. If it waits too long, it has to run them again.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-22.jpg" alt="Laura Tacho next to a Dogwood policy that lets an agent git push to a non-main branch only if tests passed in the last 15 minutes">
<figcaption>Push only if the tests passed in the last 15 minutes.</figcaption>
</figure>

This is close to [our agent forensics talk](/blog/observability-summit-europe-2026/). Telemetry tells you afterwards what an agent did. Policies like this decide beforehand what it may do, and open, portable formats make that easier to reason about across vendors.

## Open source at a crossroads

The morning closed with Nithya Ruff, chair of the Linux Foundation board, talking with Johan Linåker from RISE Research Institutes of Sweden.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-23.jpg" alt="Nithya Ruff and Johan Linåker in armchairs on stage beneath the title Open Source At The Crossroads And The Fight To Stay Open">
<figcaption>Nithya Ruff and Johan Linåker.</figcaption>
</figure>

Decades of outsourcing left governments with capability gaps and lock-in, and geopolitics turned those dependencies into security risks. Nithya has seen fierce competitors collaborate on the core, and Johan thinks governments can do the same, sharing digital public infrastructure even when they disagree politically, as long as they also invest in maintaining it. Johan pointed to X-Road from Estonia and to OS2 in Denmark, which brings Danish municipalities together. Nice to see a Danish example on the main stage. Their closing line: talk to your governments.

## One gateway in front of the agents

Lin Sun, head of open source at Solo.io, gave "Agent Gateway: The One Decision That Eliminates AI Engineering Complexity". The slides hadn't saved, so it was all live demo.

[agentgateway](https://agentgateway.dev/), one of the new projects in the Agentic AI Foundation, sits between your agents and the LLMs, MCP servers and other agents they talk to. Think API gateway or service mesh, but for agents.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-41.jpg" alt="Lin Sun on stage in front of the agentgateway.dev homepage">
<figcaption>Lin Sun, no slides, straight into the browser.</figcaption>
</figure>

The demo added credential injection, prompt logging, a token rate limit, and a virtual MCP server that only showed the agent the tools it needed. In the finale, a director agent making a short film of the audience ran out of its daily token budget, so Lin raised it with a live config reload. Jaeger showed 62 spans for the whole run.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-42.jpg" alt="Terminal showing a 429 Budget exceeded error, then the director agent taking the audience photo">
<figcaption>The token budget running out mid-demo.</figcaption>
</figure>

MCP servers only accept traffic from the gateway and agents never get model credentials, so nothing goes around it. That makes it a good place to collect agent telemetry, whatever framework the agent uses.

## Fences for agents

Later, Henrik Rexed from Dynatrace gave "Life Finds A Way, Sandboxed Agents, Observable Verdicts", with a Jurassic Park theme and Henrik as the maintenance guy responsible for the fences.

Henrik started with agent CVEs from 2026. In DeepSeek's coding harness, a prompt injection got the agent to curl the harness's own control API and turn the sandbox off. In Flowise, an injected prompt made the LLM rewrite the validation regex to always pass.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-43.jpg" alt="Henrik Rexed next to a Jurassic Park slide titled MCP without auth">
<figcaption>Henrik on MCP servers without authentication.</figcaption>
</figure>

The fences were the Kubernetes [Agent Sandbox](https://github.com/kubernetes-sigs/agent-sandbox) operator. Agents have their own state and need to start in seconds, so it adds four CRDs: `SandboxTemplate`, `Sandbox`, `SandboxWarmPool` and `SandboxClaim`. Isolation comes from gVisor or Kata Containers.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-44.jpg" alt="Henrik next to a slide explaining that a Sandbox is the running instance of a SandboxTemplate">
<figcaption>The Agent Sandbox CRDs.</figcaption>
</figure>

To see when something tests the fences, Henrik combined GenAI traces, sandbox metrics, and Tetragon eBPF policies that alert or block at the kernel.

In the demo, two OpenClaw instances got the same prompt. The unrestricted one found the default service account token, installed kubectl and listed the cluster's secrets. The one in gVisor was blocked and could only suggest commands. Henrik's advice: block, observe, and tighten the rules with what you see.

## The after party

Wednesday evening's party was at Palác Žofín, and it went almost full James Bond: classic cars on a red carpet outside, casino games inside, and props celebrating 35 years of Linux.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-45.jpg" alt="Adriana, Henrik, Diana and Kasper with party props around a classic blue convertible">
<figcaption>Adriana, Henrik, Diana and me outside Palác Žofín.</figcaption>
</figure>

<figure class="portrait">
<img src="/blog-images/open-source-summit-europe-2026-49.jpg" alt="Ballroom at Palác Žofín with a large chandelier, a painted ceiling and cocktail tables">
<figcaption>The ballroom before it filled up.</figcaption>
</figure>

## Hardened images and an OS for agents

On Thursday I came in partway through the keynotes and caught the last three. They picked up where Thierry's OpenStack chart left off.

N. Harrison Ripps, Director of Engineering at Red Hat, had five minutes for "Red Hat Hardened Images: Zero CVEs, Zero Cost". Harrison told it through a side project: a companion web app for a science fiction role-playing game, written in Perl in 2010, hosted in a friend's basement, ported to Go in 2025, and quietly collecting CVEs most of that time. The first arrived less than a year after it went live, and Harrison didn't know.

Red Hat Hardened Images, built on Fedora Hummingbird Linux, watch upstream for fixes, rebuild and republish. The target is 80% of fixes within seven days, and the median today is around 17 hours. The images are distroless, so they're also smaller and faster to start. Harrison now pulls the `latest` tag daily and redeploys every 24 hours, which took two lines of code. They're at images.redhat.com, no account needed.

Xinwei Hu, chairman of the openEuler Technical Committee, followed with "Scaling with openEuler in AI Era". The idea I liked was agentic scaling: an agent forks, tries different solutions in isolation, and only keeps the ones that pass checks. An OS can't make a model's answer correct, Xinwei said, but it can give it controlled execution, isolation and the resources to check the results.

## Signal versus noise

Jamie Thomas, IBM's Chief Client Innovation Officer and Enterprise Security Executive, closed the keynotes with "The Future of Open Source Security in the Age of AI".

<figure>
<img src="/blog-images/open-source-summit-europe-2026-25.jpg" alt="Jamie Thomas on the Congress Hall stage next to the title slide The Future of Open Source Security in the Age of AI">
<figcaption>Jamie Thomas on open source security in the age of AI.</figcaption>
</figure>

About 66,000 vulnerability disclosures are expected this year, four times as many as in 2019. CrowdStrike puts the time to exploit at 29 minutes, and often the disclosure arrives before the patch.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-26.jpg" alt="Slide titled AI Vulnerability Reports: Signal vs Noise. curl: 75% unverified noise, 20% AI-generated reports, 5% genuine signal. Linux kernel: two thirds of AI-generated patches needed human cleanup, 27 of 30 remediated AI reports introduced critical regressions">
<figcaption>Signal versus noise, from curl and the Linux kernel.</figcaption>
</figure>

This slide stuck. Only 5% of curl's bug bounty submissions were genuine signal, and 27 of 30 remediated AI reports in the kernel introduced critical regressions. Junior developers thought the AI fixes looked fine. It took experienced, mostly unpaid maintainers to find the regressions.

Jamie's answer was OpenSSF plus [Akrites](https://www.linuxfoundation.org/press/linux-foundation-and-industry-leaders-launch-akrites-to-defend-critical-open-source-software-against-ai-enabled-cyber-threats), launched in June as an incident response team for open source that helps maintainers decide what to fix first. Jamie also pointed to the Cyber Reasoning System from the DARPA AI competition, which caps what you spend on LLM-driven vulnerability hunting. You'd rather not spend $50,000 finding a defect a $1 scanner would catch.

## Just keep swimming

Back in Forum Hall, Henrik gave a second talk this week, "[Just Keep Swimming: Benchmarking OSS Agent Memory on Kubernetes With OpenTelemetry](https://sched.co/2RaaG)". Yesterday was Jurassic Park. Today was Finding Nemo.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-47.jpg" alt="Henrik Rexed on the wooden stage in Forum Hall next to the title slide Just Keep Swimming, with a robotic blue tang fish">
<figcaption>Henrik Rexed in Forum Hall.</figcaption>
</figure>

Without memory, an agent is Dory. It loses context after each conversation and repeats the same tool calls every time it meets the same problem.

Henrik looked at seven memory backends, from embedding layers over vector storage to temporal knowledge graphs: MemOS, MemPalace, Zep, Mem0, Honcho, Cognee and memU.

Zep, built on Graphiti, shows why time matters. If Dana worked at Acme and then moved to Globex, the Acme fact is invalidated instead of deleted, so you can ask where Dana works now and where Dana worked six months ago.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-32.jpg" alt="Henrik pointing at a Zep Graphiti slide: Dana works at Acme, invalidated at t2, and at Globex, valid from t2">
<figcaption>Facts are invalidated, not deleted.</figcaption>
</figure>

The agents ran in CrewAI behind one MCP server that routed to whichever backend was deployed. None of the backends emitted telemetry. Henrik opened eight pull requests adding OpenTelemetry instrumentation. Four were merged. The other four were declined as enterprise features, so the benchmark ran on forks.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-33.jpg" alt="Slide titled We need KPI to compare: add OpenTelemetry instrumentation to each solution, with spans for add, search and recall">
<figcaption>No telemetry, no benchmark.</figcaption>
</figure>

The scenarios were an agent investigating failures injected into a Kubernetes cluster, and a crew of eight agents building an expense app. Most of the span data had expired before the talk, but in what was left, only MemPalace and Zep saved tokens on the warm run. For others, recalled memories that didn't fit the problem sent the agent the wrong way. Henrik ranked MemPalace first and Zep second, both temporal knowledge graphs, and plans to rerun the benchmark and publish the code.

What I took from it is that Henrik had to instrument the backends before comparing them, and half the projects didn't want that upstream. Memory decides what an agent believes before it acts, and if you can't see what it recalled, you can't explain why it went the wrong way.

## Kubernetes supply chain security, four years on

After lunch, Stephen Augustus from Bloomberg and Adolfo García Veytia from Carabiner Systems, both in Kubernetes SIG Release, gave "[Still Leading the Pack: Modernizing Kubernetes Supply Chain Security](https://sched.co/2Rabr)".

<figure>
<img src="/blog-images/open-source-summit-europe-2026-36.jpg" alt="Stephen Augustus and Adolfo García Veytia on stage next to Stephen's intro slide listing Bloomberg, Kubernetes SIG Release and OpenSSF roles">
<figcaption>Stephen Augustus and Adolfo García Veytia.</figcaption>
</figure>

When Stephen started, a 5,000-line bash script released Kubernetes. The first SBOMs were flat lists, on purpose, because the tooling was limited and the SBOM is large. Today they're structured SPDX 3 in JSON, generated with Protobom from the OpenSSF.

Images reach registry.k8s.io through a promoter: a sub-project pushes to staging, opens a pull request, its reviewers approve, and the promoter copies and signs the image. Three things are new. Sub-projects can opt in to SLSA provenance, and the promoter checks it and issues a signed Verification Summary Attestation. If verification fails, the image isn't promoted. The promoter also attaches a promotion record with date, source and hashes, so a registry compromise shows up. And you need to trust the release managers less. Adolfo pointed out that the two of them could cut a release from a laptop using code from another repository. With signed provenance, you can check where it came from.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-38.jpg" alt="Adolfo and Stephen next to a screen inspecting the security-profiles-operator v1.1.1 image, with a promotion record, a SLSA verification summary and two signatures">
<figcaption>The first Kubernetes image with a promotion record and a VSA.</figcaption>
</figure>

The first image with all of this, the Security Profiles Operator v1.1.1, was published the Monday before. Adolfo verified it with Cosign, the new SLSA verifier, and Ampel, the OpenSSF policy engine Adolfo created. The proposal to use SLSA in Kubernetes had been open for about four years.

## Your agent did what?

Adriana and I gave "[Your Agent Did What? Forensic Observability for Systems That Don't Leave Obvious Footprints](/talks/your-agent-did-what-forensic-observability-for-systems-that-don-t-leave-obvious-footprints-2026-10-07/)" in Forum Hall, the same room as Henrik's talk that morning. It's a great room to present in, with a big wooden stage and a huge screen.

<figure class="portrait">
<img src="/blog-images/open-source-summit-europe-2026-48.jpg" alt="Kasper and Adriana on the Forum Hall stage in front of the Your Agent Did WHAT? title slide">
<figcaption>Adriana and me in Forum Hall before the talk.</figcaption>
</figure>

It was the long version of [our Observability Summit talk](/blog/observability-summit-europe-2026/): a goose agent deletes database rows, and three AI SRE agents, instrumented differently, investigate through one Collector.

It fit the week. Gateways and sandboxes decide what an agent may do, and memory shapes what it does. When it goes wrong anyway, telemetry tells you what happened.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-40.jpg" alt="The Becoming an AI observability wizard slide listing six takeaways, with the two of us on stage">
<figcaption>Our six takeaways.</figcaption>
</figure>

## Final thoughts

Most of the keynotes made the same point. If you depend on open source, you need people in the project, its security process and its governance. The OpenStack chart and Jamie's curl slide showed what AI-driven bug hunting does to maintainers, and the Open Secure AI Alliance, FINOS and Akrites are all attempts to share that load.

The other thread was proof. Red Hat rebuilds images faster than anyone can triage CVEs by hand, and Kubernetes now signs where each image came from and how it reached the registry. For agents, the gateway, the sandbox and the telemetry do the same job one level up.
