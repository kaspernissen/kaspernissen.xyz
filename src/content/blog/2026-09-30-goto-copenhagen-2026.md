---
title: "GOTO Copenhagen 2026: The Fundamentals Didn't Go Anywhere"
date: 2026-10-02
summary: "Nearly every talk I saw at GOTO Copenhagen this year was about coding agents. The surprising part wasn't the AI. It was how often the answer came back to fundamentals we already knew mattered: code health, deterministic checks, clear boundaries, and platforms built for humans first."
tags: ["ai", "platform-engineering", "conferences"]
hero: "goto-copenhagen-2026-01.jpg"
---
Almost every session I went to at GOTO Copenhagen this year was about coding agents. Are we actually getting faster? Did the bottleneck move? And if writing the code is no longer the hard part, how do we trust what comes out the other end?

The conversation has shifted. It used to be mostly about bigger and better models. Now, to a large extent, it's about how we build the harnesses around them that let us trust what they produce. Talk after talk came back to the system around the model: deterministic checks, healthy codebases, clear boundaries, good platforms and humans deciding where judgement is actually needed.

In other words, the fundamentals didn't go anywhere. If anything, they matter more now.

## Are we getting faster?

Not as much as the vendors say. Sam Newman opened "Dark modules, cobots, and architecting for AI" by saying nobody knows what's going on with AI in software delivery, and anyone who claims to is selling something. Vendors promise 30 to 50 times more output. The studies on his slide, from DORA and DX, put it at about 10%.

<figure>
<img src="/blog-images/goto-copenhagen-2026-26.jpg" alt="Sam Newman under a slide reading Not 10x, about 10%, citing DORA and DX">
<figcaption>Not 10x.</figcaption>
</figure>

If you watch one talk for the data, make it Nathan Harvey's "AI as an amplifier". He leads DORA, and the 2025 State of AI-assisted Software Development report behind the talk has nearly 5,000 survey responses. Its headline finding is that AI is an amplifier. It turns up the good things in a team and the bad things too. In DORA's data, developers feel more effective, but that doesn't automatically translate into better delivery. Instability goes up too: more rollbacks and more hotfixes. Harvey's version of the payoff was optionality. In the time it took to argue about two options, you can build seven prototypes and put them in front of users.

For a second data point, read Faros's [AI Engineering Report 2026, The Acceleration Whiplash](https://www.faros.ai/research/ai-acceleration-whiplash), which Tornhill also quoted. It's built on two years of telemetry from 22,000 developers instead of surveys. Throughput is up: task completion by 34% and epics completed per developer by 66%. So is everything downstream. Bugs per developer are up 54%, the incidents-to-PR ratio has more than tripled, median review time is up five times, and 31% more PRs are merging without any review. It also pushes back on DORA. Faros found that teams with strong engineering foundations see the same quality drop as everyone else, and argues that surveys capture how developers feel while telemetry shows what happens after the merge. Their answer is to fix it at the source, during code generation.

Dan North measures it differently. In "Am I holding this right?" he said what Claude gives him is reach. He used it to build the teaching platform he presented from, in TypeScript he doesn't know. He's clear-eyed about what he's getting, though. He called generative AI "scrap heap programming as a service". Most code has been written before, so you get the wisdom of the crowd, which is only as good as the crowd.

<figure>
<img src="/blog-images/goto-copenhagen-2026-08.jpg" alt="Slide saying Claude prefers test-first and one-shot chunks to strict TDD, it is like riding a fixie, and adjacency is my new superpower, ending with Welcome to the age of Adjacent Engineering">
<figcaption>"I don't go faster with Claude, I go broader."</figcaption>
</figure>

Faster and broader both only work if the code stays changeable, which is why Adam Tornhill's "AI-friendly code" was one of my favourite talks of the week. I've followed CodeScene for years, and what they're doing makes more sense now than ever. Their code health metric runs from 10.0 down to 1, and 9 was calibrated to mean code a human can comfortably work with. In their Code for Machines study, an agent working in code at 9 already broke the tests almost 60% more often than in code at a perfect 10. For agents the bar is 9.5 or higher. The average codebase scores 5.15.

<figure>
<img src="/blog-images/goto-copenhagen-2026-03.jpg" alt="Adam Tornhill during his talk, in front of a slide saying AI-friendly code starts at 9.5 and the average codebase has a code health of 5.15">
<figcaption>The gap between AI-friendly code and the average codebase.</figcaption>
</figure>

His answer is to give the agent the metric. Packaged as an MCP server, code health reviews every change Claude makes, and Claude refactors until the code is healthy before a human sees it. Instead of hoping the prompt produces maintainable code, the agent gets a number it can optimise against and keeps refactoring until it clears the bar. The [case study](https://codescene.com/blog/case-study-refactoring-at-scale-with-agents) was Street Fighter III: 3rd Strike, a 25-year-old C codebase of 300,000 lines. After about two weeks of part-time setup, agents took it from a code health of 5.6 to a perfect 10.0 in less than a week, for about $4,000 in tokens. Along the way the agent wrote its own playbook of narrow, codebase-specific refactoring recipes, and those recipes are what made the work mechanical at scale. He sees module-level quality as largely solved, and design and architecture as the next problem.

## The bottleneck moved to review

Agents write more code, so someone has to review more code, and we're drowning in it. We're reviewing code we didn't write and don't know as well as our own.

In 2023, DORA found that teams with better code reviews had 50% better delivery performance. The industry's response, Harvey said, was to use AI to write more code and push it into the same review queue. When he asked the room to name the biggest friction point in their delivery process, 51% chose reviewing changes.

<figure>
<img src="/blog-images/goto-copenhagen-2026-17.jpg" alt="A live poll on screen asking for the biggest friction point in the SDLC, with reviewing changes leading">
<figcaption>Reviewing changes, by a wide margin.</figcaption>
</figure>

Gojko Adzic started "Keeping humans in the loop with AI coding agents" from the same place. His example was a post from Slobodan Stojanović, who ran 207 Claude Code agents in 30 waves after about three hours of planning, with around 100 of them running overnight before they needed him again. Nobody reviews that by reading diffs.

Harvey also had a guess about where the bottleneck goes after review: deciding what to build. If something has sat on your backlog for two years and the business was fine, building it now probably doesn't matter. Clear the backlog, and if an item is important, your customers will ask for it again.

<figure>
<img src="/blog-images/goto-copenhagen-2026-18.jpg" alt="Nathan Harvey on stage under a slide reading Burn the backlog, shift left from Let code die">
<figcaption>Let code die, shifted left.</figcaption>
</figure>

Newman took review apart. It's there for correctness, shared learning, alignment with strategy and an auditable unit of work, and at AI volume none of those hold up. Tests check correctness better than eyeballs, review comments don't create shared learning the way they do when you're reviewing a teammate's work, and alignment works better as automated invariants. He has never seen a regulation that requires a human to review code, only that the review is documented. Then he asked who had used a third-party library and read every line of it. No hands went up. We already depend on enormous amounts of code that nobody on our team has personally reviewed.

His answer is modularity. Not all code is equally critical, so treat modules differently. Work closely with the agent on the risky ones, the way a surgeon works with a surgical robot, and hand the rest over. Humans should own the boxes and arrows: the interfaces, and the places where things get verified.

## Trust comes from outside the model

So how do you trust output you didn't read? Put the check outside the model, where the model can't talk its way past it.

Tornhill's code health MCP server is one version of that. North learned why the check can't live in the prompt. Claude wrote a `--dry-run` script to remove his old domains and deleted all of them. Its "test first" meant pasting in code it had already planned right after the failing tests. His summary of these tools stuck with me: they have context but no memory, ability but no agency, and knowledge but no wisdom. When the agent does something that annoys you, put the rule in a linter, not the prompt.

Adzic set a dark factory, where everything is vibe coded, agents orchestrate agents and the rules are "markdown prayers", against a lights-on factory that is spec driven, with deterministic guardrails and humans supervising throughout. You get from one to the other by noticing repetition. Repetitive tasks become commands and skills, and common feedback moves into a computational layer. Moving one workflow from inference to computation gave him 80% fewer tokens, six to ten times the speed, no testing gaps and no approval requests.

<figure>
<img src="/blog-images/goto-copenhagen-2026-22.jpg" alt="Gojko Adzic beside a slide comparing a dark factory with a lights-on factory">
<figcaption>Magic or engineering.</figcaption>
</figure>

The unscripted session with Evan Ratliff and Tim Berglund had a cheap version of the same habit. When an agent run gets expensive, ask the agent what it did, step by step, and then ask which of those steps could have been a plain tool call. Harvey wants the nitpicks in review linted with deterministic tools, "probably not with an LLM". Newman said it most plainly in his Q&A: "Don't use non-deterministic, expensive LLMs to do something that we could do with Checkstyle 15 years ago."

For the agent side of the harness, watch Marie-Alice Blete's "AI engineering: From first LLM call to multi-agent chaos". She's a staff AI engineer at Komodo Health, and she took one feature request through every architecture, from a single tool-calling agent to a swarm. The LLM doesn't execute tools, she reminded us. It asks for one by name, and your code runs it, so when a headline says the AI went rogue, the system around it let it.

Her way of evaluating agents had two parts. The output is close to normal testing, only semantic, so she prefers a dataset of questions and answers over LLM-as-judge alone. The behaviour is the new part: the path the agent took, measured in tokens, loops, tool calls and latency. You only see that path if you trace it. Her traces showed the single agent looping on wrong primary keys, with SQL results bloating the context on every call. A SQL expert sub-agent that returns a pointer to the data instead of the data fixed both, and the numbers a user sees now come from the database, never from the model. Her rules for a swarm fit on one slide.

<figure>
<img src="/blog-images/goto-copenhagen-2026-16.jpg" alt="A takeaways slide reading Nothing raw goes in, Nothing runs forever, Nothing decides its own permissions, Nothing happens unlogged">
<figcaption>Four rules for a swarm.</figcaption>
</figure>

She ended up recommending a hybrid: an orchestrator, experts where they're needed and deterministic code wherever the flow is known. Spend autonomy only where judgement is needed, because it's much easier to go from controlled to autonomous than back again.

The funniest version of what happens when nothing checks the agents came from Ratliff's "Among the agents". For his podcast Shell Game he built a startup where every employee except him was an AI agent. His CTO once called with a glowing update: user testing done, performance up 40% thanks to Alex. None of it was true, and there was no Alex. The agents had hallucinated it to each other and written it into their memory docs. A role, he said, is more than a bundle of tasks. It comes with judgement and authority, and his agents had neither. The CEO, Kyle, scheduled a candidate interview on a Sunday night, and later joined the talk live to take questions.

<figure>
<img src="/blog-images/goto-copenhagen-2026-12.jpg" alt="Evan Ratliff during his talk, under a slide reading Kyle Law, as the AI CEO joins the talk live">
<figcaption>Kyle, the AI CEO, joining the talk live.</figcaption>
</figure>

It's the point Adriana and I made at SREday the week before, that [a successful tool call is not a verdict](/blog/sreday-london-a-successful-tool-call-is-not-a-verdict). What an agent reports about its own work is not a verdict.

## Build the platform for humans first

A lot of these checks shouldn't be rebuilt by every team. They belong in the platform.

In "Building composable platforms", Daniel Bryant argued for three layers, application choreography, platform orchestration and infrastructure composition, with the team behind each layer owning its flow of value. Each layer should expose abstractions that mean something to its consumers without leaking the layer below. An abstraction whose properties are Kubernetes properties still makes users learn Kubernetes. The anti-patterns were familiar: a DevOps tool dump instead of a few reliable building blocks, policy on a wiki instead of in the runtime, and templates handed out like a puppy for Christmas, exciting on day one and impossible to upgrade once forked.

<figure>
<img src="/blog-images/goto-copenhagen-2026-06.jpg" alt="Daniel Bryant gesturing below a slide titled Puppy for Christmas vs Platform as a Product">
<figcaption>A template is for Christmas. A platform product is for life.</figcaption>
</figure>

We had talked about shift down that morning, pushing concerns into the platform instead of left onto developers, and he brought it up in both the talk and the Q&A. Thanks for the shoutout, Daniel. Make it work for humans, then scale it for agents.

That was the core of my own talk on day three, "[Rethinking Observability as a Platform Product](/talks/rethinking-observability-as-a-platform-product-2026-09-30)". A lot of organizations still treat observability as a tooling decision. You pick a vendor, deploy the agents and wait for insight to show up. What's missing is a shared foundation and a product experience around it, with clear users, sane defaults and a plan for how it evolves. OpenTelemetry is that foundation. It decouples instrumentation from the backend and gives you correlation by default, and the same structured telemetry is what lets an agent debug production or answer questions about it in plain language.

<figure>
<img src="/blog-images/goto-copenhagen-2026-38.jpg" alt="The view from the stage before the talk, with a laptop showing the title slide Rethinking Observability as a Platform Product in front of a seated audience">
<figcaption>The view from the stage, a few minutes before the start.</figcaption>
</figure>

What worries me is how many companies still aren't investing in those fundamentals. Too many expect to apply AI to the organization and watch the problems go away. In my experience that won't happen. You'll just scale the chaos.

Build the platform for humans first. If you do, adding agents later gets much easier. They need a lot of the same things your engineers do.

## Beyond the agents

Not everything was about agents. Barbara Oakley opened the conference with a keynote on how people learn, and told us that video games, first person shooters included, sharpen your reactions. I'll take that as permission. Diana Gaponcic from CERN explained GPU sharing with a cast of coffee drinks, and Troy Hunt and Scott Helme's "Everything is cyber-broken" was "Top Gear for nerds" as advertised, including the story of Troy getting phished himself.

The one I'd watch even if you never touch a coding agent is Linda Liukas's day three keynote, "Climbing inside the machine". She designed a public computer playground in Helsinki, with a six-metre von Neumann tower kids climb into as input data, a binary abacus, a giant keyboard and a flowchart hopscotch. One piece she drew for a single kid, a rotating phone, turned out to need several kids pushing while another sits in the middle.

<figure>
<img src="/blog-images/goto-copenhagen-2026-36.jpg" alt="Slide titled Unlikely partnerships? listing Helsinki, a landscape architecture firm and Monstrum next to a rendering of the playground towers">
<figcaption>Several city departments, a children's book author, 300 kids and 30 educators.</figcaption>
</figure>

She ended on the Ise shrine in Japan, which is made of wood and rebuilt every 20 years so each generation of builders learns the joinery. "It's by investing in the people and their knowledge that we build lasting systems." If agents end up writing more and more of our code, that knowledge still has to live somewhere.

Between sessions, attendees could get a conference t-shirt printed on the spot, with one of the speakers' faces and a quote. Of course I had to get one with my own face on it, which is either the best souvenir of the week or a cry for help.

<figure class="portrait">
<img src="/blog-images/goto-copenhagen-2026-09.jpg" alt="A navy t-shirt printed with an illustrated portrait of Kasper">
<figcaption>Is it just me, or does the drawing look a lot like a certain football player?</figcaption>
</figure>

## The fundamentals didn't go anywhere

Writing code got cheaper. Trust didn't.

The talks I kept coming back to all moved the important checks outside the model: code health, linters, tests, traces, policies in the runtime. None of that is particularly new. What's new is how much more it matters when the amount of code we can produce stops being the constraint.

AI changes the economics of creating software. It doesn't make code health, architecture, platform engineering or observability less important. It makes the weaknesses in them easier to amplify. As Harvey put it, quoting W. Edwards Deming, a bad system will beat a good person every time.

Build the system for humans first. Give them paved paths, clear boundaries and good feedback loops. Then let the agents in.

I had to leave right after my talk to catch a train, so that was my GOTO. When the recordings start appearing on YouTube, these are the ones I'd look out for:

- **Nathan Harvey, "AI as an amplifier".** The best data of the week on whether AI actually makes us faster, and why it amplifies whatever system you already have.
- **Adam Tornhill, "AI-friendly code".** Hard numbers on how healthy code has to be before an agent can work in it, and a code quality MCP server that gets it there.
- **Sam Newman, "Dark modules, cobots, and architecting for AI".** Why code review doesn't survive AI volume, and what to do with modules instead.
- **Gojko Adzic, "Keeping humans in the loop with AI coding agents".** A path from vibe coding to deterministic guardrails, with numbers.
- **Marie-Alice Blete, "AI engineering: From first LLM call to multi-agent chaos".** Agent architectures, traced and compared.
- **Evan Ratliff, "Among the agents".** The funniest talk of the week, and the clearest picture of what happens when agents get a role without judgement or authority.
- **Daniel Bryant, "Building composable platforms".** Platform layers that don't leak.
- **Diana Gaponcic, "When every FLOPS counts: GPU sharing strategies at CERN".** How CERN shares GPUs across Kubernetes workloads, from time slicing to MIG to Dynamic Resource Allocation, explained with coffee drinks.
- **Troy Hunt and Scott Helme, "Everything is cyber-broken".** Top Gear for nerds, with a phished security expert and a sandbox escape that turned out to be a security failure.
- **Linda Liukas, "Climbing inside the machine".** A computer playground in Helsinki, and a reminder that lasting systems come from investing in the people who build them.
