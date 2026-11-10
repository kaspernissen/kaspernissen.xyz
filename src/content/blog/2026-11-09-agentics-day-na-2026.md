---
title: "Agentics Day at KubeCon NA 2026 Co-located Events: Open, Secured and Running on Kubernetes"
date: 2026-11-09
summary: "A full day of MCP and agents at KubeCon + CloudNativeCon North America in Salt Lake City, which I co-chaired with Chris Mazur. Open governance, securing the tool layer and running agents on Kubernetes kept coming up, and most of it came back to platform engineering."
tags: ["conferences", "ai", "kubernetes", "security"]
hero: "agentics-day-na-2026-01.jpg"
draft: false
---
I flew in late last night from Copenhagen, through Boston, and landed in Salt Lake City around 11 p.m. Still on Danish time, I was up at 5. Pretty tired, but super excited about the day ahead: Agentics Day: MCP + Agents, one of the co-located events kicking off KubeCon + CloudNativeCon North America, which I had the pleasure of co-chairing with Chris Mazur.

Earlier this year, I stepped in to help Chris co-chair the event, taking over from Mauricio "Salaboy" Salatino and Patrick Debois. The first Agentics Day, in Amsterdam in March, was half a day, one track, and a full room. Here in Salt Lake City, we had a full day, two tracks, 27 sessions, 35 speakers, and once again, a packed room.

<figure>
<img src="/blog-images/agentics-day-na-2026-15.jpg" alt="Chris Mazur speaking into a handheld microphone at the Agentics Day podium while Kasper stands beside him">
<figcaption>Chris and me on stage.</figcaption>
</figure>

I'm not going to recap all 27 sessions. Here's what I took away from the ones I caught.

The topics that kept coming up: securing MCP as agents get access to real systems, running and orchestrating agents on Kubernetes, and open governance.

And a lot of it came back to platform engineering. Identity, access control, orchestration, scaling, tool discovery. Problems we've been working on in cloud native for years, now with a new kind of workload.

## Who keeps it open?

Manik Surtani opened the program with the story of the Agentic AI Foundation (AAIF). It started with a question. Goose, Block's open source coding agent, got around 30,000 GitHub stars in two months, and users kept asking: who keeps it open? The code was Apache licensed, but Block still held the trademark and the roadmap. Anthropic was getting the same question about MCP. So they started a foundation together, OpenAI joined soon after, and it launched with around 60 member companies.

<figure>
<img src="/blog-images/agentics-day-na-2026-03.jpg" alt="Manik Surtani speaking on the Agentics Day stage">
<figcaption>Manik Surtani on who keeps it open.</figcaption>
</figure>

In December, the foundation turns one, and the numbers are big: 308 member companies, close to one new member a day, and ten projects, up from three at launch (Goose, MCP and AGENTS.md). The ambassador program is less than six months old and already has 143 ambassadors across 41 countries, and last month's AGNTCon+MCPCon in San Jose drew 4,300 people.

Manik argued that "open" is present tense. A licence tells you what's open today, not who decides tomorrow. He contrasted two Google projects: Android stayed under one company, while Kubernetes went to a foundation. The goal is to do for agents what the CNCF did for cloud native. His two asks to the room: demand open protocols from your vendors and ask who can change the rules, and build in the open, inside a foundation that no single company can take back.

## The tool layer is the new attack surface

Security came up in almost every talk I saw, which makes sense when we're handing agents tools that touch production. Little of it was about prompt injection. Most of it was about identity, permissions and enforcing limits at runtime.

Saurabh Yergattikar (eBay) and Harshul Jain (Audible) broke the problem down into three areas. Traffic between an agent and an MCP server has three surfaces that are rarely guarded: the tool descriptions, the arguments to tool calls, and the tool responses. The root cause is that an agent can't tell data from instructions. Their answer is ShieldMCP, an open source proxy that inspects all three at runtime. In their evaluation of 487 synthesized attacks, it brought tool poisoning down from 74.1% to 8.6% and indirect injection from 47.2% to 5.8%, while 95% of benign tasks still passed, at 118 ms median overhead. They were honest that about 15% of cross-chain attacks still get through. Their checklist: read tool descriptions as an attacker would, treat tool responses like input from a web form, and start in shadow mode.

<figure>
<img src="/blog-images/agentics-day-na-2026-04.jpg" alt="ShieldMCP results slide: 487 attacks, 200 benign tasks, 40 servers; tool poisoning 74.1% to 8.6%, indirect injection 47.2% to 5.8%, 95% benign pass, 118 ms">
<figcaption>ShieldMCP's numbers. It helps a lot, and it doesn't catch everything.</figcaption>
</figure>

The other talks kept pushing the boundary out of the prompt and into the platform. Nikunj Doshi from Atos Syntel pointed out that we sign container images, Helm charts and SBOMs, but nobody signs MCP tool definitions, and argued we should, with Cosign, provenance and OPA at the gateway. Todd Neal from AWS focused on runtime isolation: use VMs as the boundary, ask whether the agent needs a shell or a network at all, and send egress through a proxy that injects credentials, so the agent never holds them. Agent Substrate and Apple's docs MCP server came back to the same idea from different angles: deny egress by default, and let the backend decide what a given user or agent may see.

eBay's MCP gateway, which Vijay Samuel and Nick Pordash presented, was the most complete example of this. They started with this number: 24,008 secrets found in public MCP config files, 2,117 of them still valid. When every server wants its own key in a JSON file on a laptop, people paste in long-lived personal tokens. As their slide put it, the easiest path was also the least safe one.

<figure>
<img src="/blog-images/agentics-day-na-2026-05.jpg" alt="eBay slide: Every server wanted its own key; 24,008 secrets in MCP config files, 2,117 still valid">
<figcaption>eBay on why they needed a gateway.</figcaption>
</figure>

Their gateway gives people one URL behind single sign-on. It never forwards tokens. It exchanges them for a narrowly scoped token for the target server. Every agent gets its own record in an agent registry and its own identity, and every call is checked against Cedar policies, denied by default.

<figure>
<img src="/blog-images/agentics-day-na-2026-06.jpg" alt="eBay slide: Agents get their own badge. Humans and agents share one door, but never one identity">
<figcaption>Humans and agents share one door, but never one identity.</figcaption>
</figure>

Baruch Sadogursky from Port explained why gateways are coming back. MCP is the new internal API surface, and organisations are recreating the API sprawl we had 15 years ago. The difference is the consumer. API consumers were developers we hired and trusted. MCP consumers are models with no memory, no determinism and no sense of right and wrong. So now both sides need governance: the servers and the agents calling them.

None of this is new if you've run Kubernetes in production. Workload identity, network policies, permissions, isolation: we know how to do this. What's new is a workload that decides for itself which tool to call.

### Fewer tools, better words

Design came up almost as often as security, and the two are connected. A smaller, clearer tool surface is easier to secure and easier for a model to use correctly.

Fabrizio Lazzaretti from Wavestone gave the clearest demo of the day. He generated an MCP server from the classic pet store OpenAPI spec and got 19 tools. Then he asked an agent to buy him a friendly dog. One model created a new dog instead of buying one. Another placed an order, but the dog stayed for sale, because in that API, buying means placing an order and also updating the pet. Nothing in the tool descriptions said so.

He then redesigned the server with domain-driven design, using the method from the book he co-wrote with Annegret Junker, *Crafting Great APIs with Domain-Driven Design*. Twelve commands collapsed into four tools, in business language, with one server per bounded context and per audience. The buyer never sees the admin tools. In his demo, the redesigned server needed 75% fewer tokens to load, and every model he tested got it right.

<figure>
<img src="/blog-images/agentics-day-na-2026-07.jpg" alt="Slide: This is a pet shop. Now imagine your APIs. 19 endpoints, minus 75% tokens; GitHub's server in 2025 had 102 tools. The bigger the API, the more the cut matters.">
<figcaption>Fabrizio Lazzaretti: the bigger the API, the more the cut matters.</figcaption>
</figure>

As his slide put it: "The rules live in the domain. MCP is just the adapter." He was also clear that not everything should be an MCP tool. Loops and joins are better as code in a sandbox, knowledge-heavy workflows are better as skills, and handing off a whole task is a job for A2A.

The same idea came up in other talks. eBay has hundreds of servers behind its gateway, so it exposes four discovery tools instead of thousands of tool definitions; in their experience, tool selection gets worse somewhere past 25 to 100 tools. Apple's docs server exposes its domain map as an MCP resource instead of a tool, so the model can read it instead of guessing parameters.

## Agents are workloads now

Then there's running all these agents on Kubernetes.

Derek Wang from Intuit split agents into two kinds. Task agents behave like Kubernetes Jobs. Service agents are long-running and serve many users, and most tooling ignores them. Intuit built Kynomesh for those: an AgentSet custom resource that declares the agents and how they talk (supervisor, handoff or sequential), with a broker sidecar that handles discovery, rate limiting and graceful shutdown. In the demo, he added a weather agent to a trip planner with nothing but a manifest, and the planner picked it up. His slide on the problem:

<figure>
<img src="/blog-images/agentics-day-na-2026-09.jpg" alt="Intuit slide: Every team re-solves orchestrate, discover, scale. None of this is agent logic. It's plumbing, and every team lays it again for every project.">
<figcaption>"None of this is agent logic. It's plumbing."</figcaption>
</figure>

That's a platform engineering problem, and it's the kind of problem I like.

Several talks ran into the same awkward fact: agents spend most of their time waiting on a model or on another agent. That breaks CPU-based autoscaling, which is why Kynomesh scales on in-flight requests instead. It also means you reserve a lot of capacity that sits idle. Alex Van Boxel showed how Agent Substrate, which just hit 1.0, deals with that. It suspends idle agents to disk and, according to the talk, wakes them in under 400 ms from golden snapshots. Because it works at the container level, anything in a container works, even a stateful Jupyter notebook.

<figure>
<img src="/blog-images/agentics-day-na-2026-08.jpg" alt="Agent Substrate slide: Your agent is mostly waiting, with a grid of mostly idle dots and a CPU bar">
<figcaption>Agent Substrate: your agent is mostly waiting.</figcaption>
</figure>

Aman Singh from Microsoft looked at the other end: how does an agent know when to act? Polling burns tokens. Drasi, a CNCF sandbox project, evaluates conditions with continuous queries and pushes a signal to the agent only when something happens, and with webhook delivery, the agent can scale to zero in between.

Then there are the models themselves. Ralph Squillace from Microsoft argued that models behave more like databases than like agents: tied to specific drivers and chips, with weights of hundreds of gigabytes. His slides put the fall in the cost of a given capability at about 13× a year since 2023, with the best open-weight models about four months behind the best closed ones. His advice: budget for capability, not tokens.

<figure>
<img src="/blog-images/agentics-day-na-2026-10.jpg" alt="Slide: A few numbers to remember about open weight models: 13× per year fall in the cost of a capability since 2023; about 4 months until the best open-weight model reaches the best closed models">
<figcaption>Ralph Squillace's two numbers to remember.</figcaption>
</figure>

Some of it is plain automation. Gonzalo Vazquez from Royal Bank of Canada started with lean management and value stream mapping, which isn't what you expect at an agents event. His pipeline uses Argo Events and Argo Workflows, with Claude classifying and enriching a GitHub issue before it becomes a Jira ticket. He reported cycle time going from 45 minutes to 3. Nothing fancy, which I think was the point.

<figure>
<img src="/blog-images/agentics-day-na-2026-11.jpg" alt="Slide: Event-driven pipeline on Kubernetes. GitHub issue to Argo Events to Argo Workflow to Jira ticket; inside the DAG, Claude classifies, enriches, and the pipeline creates the ticket">
<figcaption>RBC's ticket pipeline: Argo all the way down.</figcaption>
</figure>

## Still a human in the loop

The talk I'd point people to for a reality check was Kai Levin's from Ericsson. They release more than 100 microservices, and a 2025 survey found that release work took 11.1% of team capacity, about one day in ten. They built release personas: one agent per product, each with its own context and rules, on top of their existing CI, security and publishing systems, coordinated through a shared release portal.

When someone asked how autonomous it is in production, the answer was direct: it still runs under human supervision and needs a fair amount of human intervention. Every system action requires approval at the first level of their rollout. And their main lesson was that the shared framework around the agents mattered more than the individual agents, skills and tools.

<figure>
<img src="/blog-images/agentics-day-na-2026-12.jpg" alt="Ericsson slide: What we learnt. Many capabilities (agent, skill, MCP, script, tool, prompt) versus a framework for the scope of every agent and an ontology for how the agents relate to each other">
<figcaption>Ericsson: the framework mattered more than the parts.</figcaption>
</figure>

I liked that honesty. The demos make autonomy look easy. In production, people are still working out how much of it they're comfortable with, and how to enforce the limits without trusting the agent to follow instructions.

My take: give agents more autonomy, sure, but don't let them decide their own boundaries. We spent years learning to enforce identity, permissions and policy outside the application. Agents shouldn't be the exception.

## Where this leaves me

My main takeaway from the day: most of the hard problems with agents are platform problems. Identity, access, orchestration, scaling, policy. We've solved versions of all of them before. Now we need to solve them for workloads that make their own decisions.

The piece I think is still underrated is observability. Enforcing a policy is one thing. Knowing what happened is another. Which agent called which tool? What was it allowed to do? Why was a call approved or denied? Can you replay the whole workflow afterwards? Observability won't stop an agent. Evidence isn't a boundary. But without it, you're guessing.

<figure>
<img src="/blog-images/agentics-day-na-2026-02.jpg" alt="Packed Agentics Day room seen from the back, with two large screens">
<figcaption>Still a full room after lunch.</figcaption>
</figure>

That's what I'll be spending the rest of the week on.

Tomorrow, I'll be moderating a panel with Alexa Griffith, Joseph Sandoval, Jed Salazar and Juraci Paixão Kröhling on running agents on the platform. Who owns it, what should the platform guarantee, and where does its job stop? What does success look like for an agent? Where should enforcement happen? And what can observability tell us about what happened?

Then on Wednesday, William Rizzo and I will take some of those questions into a live demo. We'll put an insurance claims agent on a platform that decides what it may do, using SPIFFE/SPIRE, Linkerd, agentgateway, OpenFeature and Kyverno, and then use OpenTelemetry to trace what it actually did and prove it afterwards.

I didn't plan it this way, but today's talks set up both sessions well.

It was a great day. The hallway conversations were about the same things as the talks: safeguarding MCP, agent identity, orchestration and isolation. Lots more to talk about this week.

A big thank you to Chris for a great day of co-chairing, to the program committee for putting together a strong schedule, to all the speakers, and to everyone who joined us. The recordings will be available on the CNCF YouTube channel.

## What's next this week

KubeCon proper starts tomorrow, and I've got a few things on the schedule:

- **Tuesday, 12:00:** A short pop-up talk at the Dash0 booth (#134, Hall A) on rethinking observability as a platform product, building on OpenTelemetry, and what that enables when you use AI with your telemetry. [Details on Luma](https://luma.com/xjowqatv).
- **Tuesday, 4:40 p.m.:** Moderating "[Agents on the Platform: Four Perspectives on the Conversation We're Already Having in Private](/talks/agents-on-the-platform-four-perspectives-on-the-conversation-we-re-already-having-in-private-2026-11-09/)" with Alexa Griffith, Joseph Sandoval, Jed Salazar and Juraci Paixão Kröhling, in Grand Ballroom GI.
- **Wednesday, 11:00:** "[Verticalizing Platform Intelligence for Regulated Domains](/talks/verticalizing-platform-intelligence-for-regulated-domains-2026-11-11/)" with William Rizzo, in room 255 EF.

If you're in Salt Lake City, come say hi!
