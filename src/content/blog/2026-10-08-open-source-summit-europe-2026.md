---
title: "Open Source Summit Europe 2026: No Sovereignty Without Participation"
date: 2026-10-08
summary: "My first Open Source Summit, and the end of a week in Prague. The idea that kept coming back was participation: in the governance of the projects Europe depends on, in defending maintainers now that AI makes vulnerabilities cheap to find, and in the instrumentation and guardrails that let us trust agents. Plus agentgateway, the Kubernetes Agent Sandbox, a benchmark of agent memory backends, and the talk Adriana and I gave."
tags: ["open-source", "conferences", "ai", "security"]
hero: "open-source-summit-europe-2026-03.jpg"
---
This was my first Open Source Summit, and I wasn't entirely sure what to expect. I spend most of my conference time at KubeCon and other cloud native events, and Open Source Summit covers a much broader part of the ecosystem. Digital sovereignty, energy grids, documentation, bank patching, Kubernetes release engineering and agent sandboxes all shared the same two days.

That range is what I enjoyed most. It pulled me out of my usual bubble, and it made the connections between topics easier to spot.

The phrase I took home came from Thierry Carrez's keynote: "There can be no sovereignty without participation." It was said about Europe and open source governance, but it kept fitting the rest of the week. Maintainers drowning in AI-generated vulnerability reports need more people in the security process. The Kubernetes supply chain got stronger because a few people kept pushing for four years. And Henrik Rexed couldn't benchmark agent memory until the instrumentation went upstream.

This post covers Wednesday and Thursday, and wraps up a week in Prague that started with [Observability Summit on Monday](/blog/observability-summit-europe-2026/).

## Europe uses open source, but doesn't steer it

Mirko Boehm and Paula Grzegorzewska from Linux Foundation Europe opened with the [2026 State of Open Source in Europe](https://www.linuxfoundation.org/research) report, released that morning. Most of it confirmed what you'd expect. European organisations use a lot of open source, and AI coding assistants make them use more.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-03.jpg" alt="Mirko Boehm and Paula Grzegorzewska on stage next to the cover of the 2026 State of Open Source in Europe report">
<figcaption>Mirko Boehm and Paula Grzegorzewska with the report.</figcaption>
</figure>

The governance numbers were the interesting part. 59% of organisations contribute code upstream, but only 37% take part in governance. The ones most involved in governance also report the best return on what they put in, 4.6x against 3.6x for those that mostly consume. Mirko summed it up well: Europe favours openly governed projects, and then lets others govern them.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-05.jpg" alt="Slide: 59% contribute code upstream but only 37% participate in governance; open source returns 4.1x on average, from 3.6x to 4.6x with mature governance; 52% prefer foundation-hosted projects">
<figcaption>The governance gap, in four numbers.</figcaption>
</figure>

Thierry, General Manager of Linux Foundation Europe, made the same point from the foundation's side. Across its 620 projects, 38% of code contributions in the last 12 months came from Europe, but only 15% of membership dues. US and Asian companies, Thierry said, worked out long ago that funding openly governed open source is strategic.

Thierry also pushed back on open source as a shortcut to sovereignty. Single-vendor open source still leaves you depending on one company that can be acquired or change direction. And openly governed projects only give you control in theory if nobody on your side knows the project, its release process or how it handles vulnerabilities.

I agree. Governance is the less visible half of open source work. It rarely shows up in an engineering team's goals, but it decides where the project goes and whether you see breaking changes coming. I see the same thing in OpenTelemetry. The companies that show up in the SIGs and spec discussions shape what the rest of us end up running.

Nithya Ruff, chair of the Linux Foundation board, and Johan Linåker from RISE Research Institutes of Sweden took it to governments. Decades of outsourcing left the public sector with capability gaps and lock-in, and geopolitics turned those dependencies into security risks. Johan thinks governments can share digital public infrastructure even when they disagree politically, as long as they also invest in maintaining it. The examples were X-Road from Estonia and OS2, which brings Danish municipalities together. Nice to see a Danish example on the main stage. Their closing line was simple: talk to your governments.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-23.jpg" alt="Nithya Ruff and Johan Linåker in armchairs on stage beneath the title Open Source At The Crossroads And The Fight To Stay Open">
<figcaption>Nithya Ruff and Johan Linåker.</figcaption>
</figure>

## AI changed the economics of security

The slide that stuck with me most all week was a plain bar chart. Thierry helped start OpenStack 16 years ago and was its release manager. OpenStack had between zero and six security advisories a year from 2021 to 2025. In the first three quarters of 2026 it had 42, on track to pass 60, handled by the same small team.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-09.jpg" alt="Thierry Carrez next to a bar chart of OpenStack security advisories: a handful per year from 2021 to 2025, then 42 for 2026">
<figcaption>Same software, same team.</figcaption>
</figure>

The code didn't get worse. Finding vulnerabilities got cheap. AI made offence cheap, so Thierry wants the defence organised in the open too, with pooled security resources and shared defensive tooling.

On Thursday, Jamie Thomas from IBM showed what that looks like from a maintainer's inbox. In curl's bug bounty queue, only 5% of submissions were genuine signal. In the Linux kernel, 27 of 30 remediated AI reports introduced critical regressions. Junior developers thought the AI fixes looked fine. It took experienced, mostly unpaid maintainers to find the problems.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-26.jpg" alt="Slide titled AI Vulnerability Reports: Signal vs Noise. curl: 75% unverified noise, 20% AI-generated reports, 5% genuine signal. Linux kernel: two thirds of AI-generated patches needed human cleanup, 27 of 30 remediated AI reports introduced critical regressions">
<figcaption>Signal versus noise, from curl and the Linux kernel.</figcaption>
</figure>

This is the same pattern I wrote about after [GOTO Copenhagen](/blog/goto-copenhagen-2026/). There, agents produced more code than anyone could review. Here, they produce more vulnerability reports than anyone can triage. More output doesn't create more value on its own. Verification becomes the bottleneck, and the people doing the verifying are the scarce resource.

Several of the answers on stage were about sharing that load. The Open Secure AI Alliance, which NVIDIA handed to the Linux Foundation after more than 2,000 companies applied in two weeks, starts with an exchange where members share incidents involving agentic AI so everyone can learn from the root causes. [Akrites](https://www.linuxfoundation.org/press/linux-foundation-and-industry-leaders-launch-akrites-to-defend-critical-open-source-software-against-ai-enabled-cyber-threats), launched in June, is an incident response team for open source that helps maintainers decide what to fix first. FINOS's new resilience alliance does it for banks, where patching is the easy part and getting the patch through change records, regression runs and regulators is not. Members share what they depend on, FINOS contracts vendors to fix it, and the hardened releases are published as open forks.

Harrison Ripps from Red Hat had the most relatable version of the problem: a companion web app for a science fiction role-playing game, written in Perl in 2010, ported to Go in 2025, and collecting CVEs for most of its life without Harrison knowing. Red Hat Hardened Images watch upstream for fixes, rebuild and republish, with a median of around 17 hours today. Harrison now pulls the `latest` tag daily and redeploys every 24 hours, which took two lines of code. If you can't triage faster than the reports arrive, rebuilding faster than they arrive is a reasonable answer.

## Proving where an image came from

The supply chain talk on Thursday afternoon had the most engineering detail I didn't already know. Stephen Augustus and Adolfo García Veytia, both in Kubernetes SIG Release, gave "[Still Leading the Pack: Modernizing Kubernetes Supply Chain Security](https://sched.co/2Rabr)".

<figure>
<img src="/blog-images/open-source-summit-europe-2026-36.jpg" alt="Stephen Augustus and Adolfo García Veytia on stage next to Stephen's intro slide listing Bloomberg, Kubernetes SIG Release and OpenSSF roles">
<figcaption>Stephen Augustus and Adolfo García Veytia.</figcaption>
</figure>

When Stephen started, Kubernetes was released by a 5,000-line bash script. The first SBOMs were flat lists, on purpose, because the tooling was limited. Today they're structured SPDX 3, generated with Protobom from the OpenSSF.

Images reach registry.k8s.io through a promoter. A sub-project pushes to staging, opens a pull request, its reviewers approve, and the promoter copies and signs the image. Three things are new. Sub-projects can opt in to SLSA provenance, and the promoter verifies it and issues a signed Verification Summary Attestation. If verification fails, the image isn't promoted. The promoter also attaches a promotion record with date, source and hashes, so a registry compromise shows up. And you need to trust the release managers less. Adolfo pointed out that the two of them could cut a release from a laptop using code from another repository. With signed provenance, you can check.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-38.jpg" alt="Adolfo and Stephen next to a screen inspecting the security-profiles-operator v1.1.1 image, with a promotion record, a SLSA verification summary and two signatures">
<figcaption>The first Kubernetes image with a promotion record and a VSA.</figcaption>
</figure>

The first image with all of this, the Security Profiles Operator v1.1.1, was published the Monday before. The proposal to use SLSA in Kubernetes had been open for about four years. That's participation too. Someone has to keep showing up to SIG meetings until a four-year-old proposal ships.

## Fences for agents

The afternoons were mostly about agents, and the talks I went to all landed in the same place. Don't trust the agent to follow instructions. Put the boundary somewhere the agent can't talk its way past.

Laura Tacho, now at AWS, framed the problem in a Wednesday keynote. Jellyfish data shows autonomous agents involved in 28.2% of pull requests at the median company by September. Developers say the tools help, but far fewer think their company manages the risks. Laura pointed to [Cedar](https://www.cedarpolicy.com/), a CNCF sandbox policy language that keeps authorisation outside your application, and [Dogwood](https://github.com/dogwood-policy), which adds history. An agent can `git push`, but only to branches other than `main`, and only if the tests passed in the last 15 minutes. If it waits too long, it has to run them again.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-22.jpg" alt="Laura Tacho next to a Dogwood policy that lets an agent git push to a non-main branch only if tests passed in the last 15 minutes">
<figcaption>Push only if the tests passed in the last 15 minutes.</figcaption>
</figure>

Lin Sun from Solo.io showed the network version with [agentgateway](https://agentgateway.dev/), now part of the Agentic AI Foundation. The slides hadn't saved, so the whole session was a live demo. The gateway sits between your agents and the LLMs, MCP servers and other agents they talk to. Lin layered on credential injection, prompt logging, a token rate limit, and a virtual MCP server that only exposed the tools the agent needed. In the finale, a director agent making a short film of the audience ran out of its daily token budget mid-demo, and Lin raised it with a live config reload.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-42.jpg" alt="Terminal showing a 429 Budget exceeded error, then the director agent taking the audience photo">
<figcaption>The token budget running out mid-demo.</figcaption>
</figure>

The part I liked most was the answer to "how do you know nothing bypasses the gateway?" MCP servers only accept traffic from the gateway, and agents never get model credentials, so there's no other way through. That's a platform decision, not an agent decision, and it's the same shift down idea I keep coming back to: push the concern into the platform instead of asking every team, or every agent, to get it right. It also makes the gateway a natural place to collect agent telemetry, whatever framework the agent was built with.

Henrik Rexed's "Life Finds A Way, Sandboxed Agents, Observable Verdicts" took the boundary down to the kernel, with a Jurassic Park theme and Henrik as the maintenance guy responsible for the fences. The CVEs from 2026 were a good reminder of why prompts aren't fences. In one coding harness, a prompt injection got the agent to curl the harness's own control API and turn the sandbox off. In Flowise, an injected prompt made the LLM rewrite the validation regex so it always passed.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-44.jpg" alt="Henrik next to a slide explaining that a Sandbox is the running instance of a SandboxTemplate">
<figcaption>The Agent Sandbox CRDs.</figcaption>
</figure>

The fences were the Kubernetes [Agent Sandbox](https://github.com/kubernetes-sigs/agent-sandbox) operator, with CRDs for templates, sandboxes, warm pools and claims, and isolation from gVisor or Kata Containers. In the demo, two OpenClaw instances got the same prompt. The unrestricted one found the default service account token, installed kubectl and listed the cluster's secrets. The one in gVisor was blocked and could only suggest commands. Henrik's advice was to block, observe, and tighten the rules with what you see, using GenAI traces, sandbox metrics and Tetragon policies at the kernel.

Xinwei Hu from openEuler came at it from the operating system. An OS can't make a model's answer correct, but it can give agents controlled execution, isolation and the resources to check results. The idea I liked was agentic scaling, where an agent forks, tries different solutions in isolation, and only keeps the ones that pass checks.

## What did the agent remember?

On Thursday morning, Henrik was back in Forum Hall with "[Just Keep Swimming: Benchmarking OSS Agent Memory on Kubernetes With OpenTelemetry](https://sched.co/2RaaG)". Yesterday was Jurassic Park. Today was Finding Nemo.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-47.jpg" alt="Henrik Rexed on the wooden stage in Forum Hall next to the title slide Just Keep Swimming, with a robotic blue tang fish">
<figcaption>Henrik Rexed in Forum Hall.</figcaption>
</figure>

Without memory, an agent is Dory. It loses context after each conversation and repeats the same tool calls every time it meets the same problem. Henrik compared seven memory backends, from embedding layers over vector storage to temporal knowledge graphs. Zep, built on Graphiti, shows why time matters. If Dana worked at Acme and then moved to Globex, the Acme fact is invalidated instead of deleted, so you can ask both where Dana works now and where Dana worked six months ago.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-32.jpg" alt="Henrik pointing at a Zep Graphiti slide: Dana works at Acme, invalidated at t2, and at Globex, valid from t2">
<figcaption>Facts are invalidated, not deleted.</figcaption>
</figure>

To compare them, Henrik needed numbers, and none of the backends emitted telemetry. Henrik opened eight pull requests adding OpenTelemetry instrumentation. Four were merged. The other four were declined as enterprise features, so the benchmark ran on forks. In the results that survived, only MemPalace and Zep, both temporal knowledge graphs, saved tokens on a warm run. For the others, recalled memories that didn't fit the problem sent the agent the wrong way.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-33.jpg" alt="Slide titled We need KPI to compare: add OpenTelemetry instrumentation to each solution, with spans for add, search and recall">
<figcaption>No telemetry, no benchmark.</figcaption>
</figure>

Henrik was open about it being a messy benchmark, and the ranking wasn't what stuck with me. The setup was. Memory decides what an agent believes before it acts. If a recalled memory sends it the wrong way, and you can't see what it recalled, you can't explain the decision afterwards. You can only see the bad outcome.

It's also the participation theme again. Half the projects didn't want instrumentation upstream, so anyone who wants to understand their agents has to maintain a fork. On Monday, the [GenAI talks at Observability Summit](/blog/observability-summit-europe-2026/) were about getting that telemetry to converge on OpenTelemetry. Henrik's pull requests show how far there still is to go.

## Beyond my usual bubble

Some of my favourite moments had nothing to do with agents or Kubernetes.

Erin McKean from the Google Open Source Programs Office gave the funniest keynote of the week. [Docsy](https://www.docsy.dev/), the Hugo theme that Kubernetes, OpenTelemetry and many others use for their docs, is moving to the Linux Foundation. Documentation people are a bit salty that docs get resources now that the robots want them, Erin admitted, but it doesn't matter how information reaches people as long as it does. "If someone told me that there was evidence that said opera is the best way to reach your project users, I'd be writing operas." Docsy is adding features for agents, like publishing Markdown next to the rendered docs, and Erin would very much like to call the project DocsAF.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-14.jpg" alt="Erin McKean next to a slide reading: Docsy is short for Docsy McDocsface. Its full name is Sir David Attenborough.">
<figcaption>The naming is settled.</figcaption>
</figure>

Alice Yake from Breakthrough Energy launched the Open Grid Foundation with a question: if you had a billion dollars for the energy transition, would you spend it on panels or on the software to plan the system? Nothing gets built without a plan, and the open source planning tools that exist often need a PhD to use and don't work together. It's not my field at all, which is exactly why I liked seeing it on the main stage.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-12.jpg" alt="Alice Yake walking across the stage in front of the OpenGrid logo">
<figcaption>Alice Yake launching Open Grid.</figcaption>
</figure>

## Our talk, and the people

Adriana and I gave "[Your Agent Did What? Forensic Observability for Systems That Don't Leave Obvious Footprints](/talks/your-agent-did-what-forensic-observability-for-systems-that-don-t-leave-obvious-footprints-2026-10-07/)" on Thursday in Forum Hall, the same room as Henrik's memory talk that morning. It's a great room to present in, with a big wooden stage and a huge screen.

<figure class="portrait">
<img src="/blog-images/open-source-summit-europe-2026-48.jpg" alt="Kasper and Adriana on the Forum Hall stage in front of the Your Agent Did WHAT? title slide">
<figcaption>Adriana and me in Forum Hall before the talk.</figcaption>
</figure>

It was the longer version of the talk we gave at Observability Summit on Monday, and the third time we've given it since [SREday London](/blog/sreday-london-a-successful-tool-call-is-not-a-verdict/). A goose agent deletes rows from a database, and three AI SRE agents, each instrumented differently, investigate what happened through one Collector.

After two days of talks, it fit in the right place. Laura's policies, Lin's gateway and Henrik's sandbox decide what an agent is allowed to do. Henrik's memory benchmark showed how much what it remembers shapes what it does. Our talk was about what's left when something goes wrong anyway: the telemetry, and whether it tells you enough to work out what happened. Our six takeaways ran from instrumenting agents and LLM calls to following the `gen_ai.*` semantic conventions and propagating context all the way through.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-40.jpg" alt="The Becoming an AI observability wizard slide listing six takeaways, with the two of us on stage">
<figcaption>Our six takeaways.</figcaption>
</figure>

As always, the hallway track was just as valuable as the talks. Catching up with people between sessions is a big part of why I go to these events, and with a broader crowd than KubeCon, there were plenty of new faces too.

The Wednesday evening party was at Palác Žofín, and it went almost full James Bond: classic cars on a red carpet outside, casino games inside, and props celebrating 35 years of Linux.

<figure>
<img src="/blog-images/open-source-summit-europe-2026-45.jpg" alt="Adriana, Henrik, Diana and Kasper with party props around a classic blue convertible">
<figcaption>Adriana, Henrik, Diana Todea and me outside Palác Žofín.</figcaption>
</figure>

<figure class="portrait">
<img src="/blog-images/open-source-summit-europe-2026-49.jpg" alt="Ballroom at Palác Žofín with a large chandelier, a painted ceiling and cocktail tables">
<figcaption>The ballroom before it filled up.</figcaption>
</figure>

## Wrapping up a week in Prague

The week started with Observability Summit on Monday, where the talks assumed you already run OpenTelemetry and asked how to run it well. It ended with Open Source Summit asking who takes part in running open source at all.

Those turned out to be the same question at different scales. Europe contributes code but not governance. Maintainers get the AI-generated reports but not the help to triage them. Kubernetes supply chain security improved because a few people kept showing up for four years. And agent memory stays hard to observe when projects won't take instrumentation upstream. In every case, the people who participate shape the outcome, and everyone else depends on them.

For agents, the week gave me a clearer picture of the layers. Policies and gateways decide what an agent may do, sandboxes contain what it can do, memory shapes what it believes, and telemetry tells you what it actually did. None of those layers should rely on the agent behaving.

I only made it to the first two days of Open Source Summit. I skipped Friday to head home for my oldest son's birthday, which is the best reason I can think of to leave a conference early. If you only watch a few recordings from Wednesday and Thursday, these are the ones I'd pick:

- **Thierry Carrez's keynotes.** The governance gap and the OpenStack chart.
- **Jamie Thomas, "The Future of Open Source Security in the Age of AI".** The curl and kernel numbers on AI vulnerability reports.
- **Lin Sun, "Agent Gateway".** A live demo of putting one gateway in front of your agents.
- **Henrik Rexed, "Just Keep Swimming".** Benchmarking agent memory, and why you have to instrument it first.
- **Stephen Augustus and Adolfo García Veytia, "Still Leading the Pack".** How Kubernetes proves where its images came from.
- **Erin McKean on Docsy.** For the opera line alone.

Thanks to Adriana for another round of capybaras, to everyone who came to Forum Hall on Thursday, and to everyone who made it such a good week in Prague.
