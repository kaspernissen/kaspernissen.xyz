---
title: "Cloud Native Denmark 2026: Almost a Small KubeCon"
date: 2026-11-20
summary: "Two days in Copenhagen at the fourth edition of the conference I help organise. A 10-metre screen on 12 pallets, a lot of talks about platforms carrying more of the load, and a donation to HackYourFuture to finish it off."
tags: ["conferences", "community", "platform-engineering", "ai"]
hero: "cloud-native-denmark-2026-23.jpg"
draft: false
---
That's a wrap for Cloud Native Denmark 2026 in Copenhagen. This was our fourth edition, and with more than 520 attendees, probably our most ambitious one yet.

I've been part of organising this conference since the beginning. The first two editions were called [KCD Denmark](/talks/kcd-denmark-2024-2024-11-30/), before we became Cloud Native Denmark last year and [moved to Aarhus](/talks/cloud-native-denmark-2025-2025-10-31/). This year, we were back in Copenhagen.

Over the two days, I hosted the main stage in the mornings and afternoons together with Allan and Jinhong. The rest of the time, I was usually somewhere with a headset on, cueing speakers, closing doors, coordinating transitions and generally trying to keep everything running smoothly. The photo below pretty much sums up that part of the job.

<img src="/blog-images/cloud-native-denmark-2026-27.jpg" alt="Kasper smiling in front of the main stage screen, wearing a headset and a Cloud Native Denmark lanyard">

## Twelve pallets of screen

I won't pretend it wasn't stressful. This year we decided to put a massive 10 by 3 metre screen behind the main stage. It was a big investment for us, and seeing it arrive on 12 pallets was quite something. We were super excited to see it all assembled. We also vibe coded everything from the graphics and music to the control panel we used to run the whole thing.

<img src="/blog-images/cloud-native-denmark-2026-28.jpg" alt="The main stage screen half assembled, with stage risers and flight cases spread across the room">

It paid off. The feedback we kept hearing was that it almost felt like a small KubeCon. I definitely take that as a compliment.

<img src="/blog-images/cloud-native-denmark-2026-15.jpg" alt="A crew member in a headset at the control desk, with the vision mixer, laptops and a bell, and the packed main hall behind">

The other thing I'm proud of is that we can put on a conference of this size and quality that is still affordable compared to similar events, and still have money left over at the end to give away. More on that at the end.

## Speed is here, so what do we do with it?

After the welcome, we opened with HackYourFuture, which I'll come back to. Then Hannah Foxwell gave the first keynote, "The Reinvention of Software Engineering". I saw an earlier version of this talk at Øredev a couple of weeks ago and [wrote about it there](/blog/oredev-2026/), so I'll stick to what stood out the second time.

Her starting point: for years, platform engineering conferences were about developer velocity. That velocity has now arrived. She built the talk around three things she thinks won't change, however good the agents get. We must build something worth building. Speed requires safety. People matter.

One line I wrote down: "I genuinely do not care how quickly you built the wrong thing." Prototypes are cheap now, so test ideas with real users before they go into the product.

The part I found most relevant for this audience was the second anchor. Users will never ask for security and reliability, they'll just assume you've got it under control, and they'll notice the moment you don't. As she put it, platform engineering was a good idea before coding agents, and it's mandatory with them.

<img src="/blog-images/cloud-native-denmark-2026-16.jpg" alt="Hannah Foxwell on the main stage next to her three anchors: Build something worth building, Speed requires safety, People matter">

## Platform engineering for the many

Jessica Andersson's talk on day two, "Your platforms matter more than ever with AI", was the strongest version of that argument. I also covered [her Øredev talk](/blog/oredev-2026/), but this one had a sharper thesis: as output increases, complexity must decrease, otherwise agentic development won't be sustainable.

She brought numbers. On public GitHub repositories, merged pull requests more than tripled from Q3 2025 to Q3 2026. But that's output, not outcome. We haven't tripled the number of developers, yet teams are now responsible for more code, more applications and bigger systems. Without common standards, agents fragment things even further. She'd rather run 1,000 applications that look the same than 20 unique ones.

Her answer is the internal developer platform, now serving developers, citizen developers and agents. If your "platform" is a Jira ticket, a magic script and a wiki page, it isn't self-service, and you should start automating now, before someone asks you to put agents on it. She added context as a new platform capability: linters that run on every file the agent saves, and a small Golden Path CLI that gives the agent only the documentation it needs, and logs the searches that find nothing.

It's the same pattern I wrote about [after KubeCon last week](/blog/kubecon-na-2026/). The platform provides the guardrails, whether it's a person or an agent shipping the code.

<img src="/blog-images/cloud-native-denmark-2026-17.jpg" alt="Jessica Andersson on stage with her slide: issues created up from 4.85M to 15.65M and pull requests merged up from 14.81M to 47.04M between Q3 2025 and Q3 2026">

## Less load, more code

That idea came back several times, and the most fun version was "Trust Me, I'm Internal: Building a Custom Root of Trust for Kubernetes Workloads" by Jakub Krzywda and Cristian Klein on day two. They performed it as a play. Cristian was the platform engineer, and Jakub literally swapped hats as he became the curl developer, the Node.js developer and the Java developer.

The setup: compliance says every application must now trust an internal root CA, and turning off TLS verification isn't allowed. Every language then wanted it done differently, and Java's custom trust store ended up breaking requests to public endpoints.

Eventually the Java developer asked, on behalf of all the Jakubs, whether the platform could please just handle this. The fix was cert-manager's Trust Manager to distribute the bundle and a Kyverno policy to inject it into pods that opt in. About 100 lines of platform code, zero lines of application code. Their closing line was "less load, more code".

<img src="/blog-images/cloud-native-denmark-2026-18.jpg" alt="Cristian Klein and Jakub Krzywda at the podium under their title slide, Trust Me, I'm Internal">

It's the kind of problem nobody puts on a roadmap. Each team would have to work it out separately, and every one of them would get it slightly differently wrong.

Day two had opened on the same note. In the opening keynote, "The Developer's Nightmare: How To Survive Compliance Checklists (and Still Ship Fast)", Thomas Vitale and Alexandra Hou Aldershaab tried to get one feature to production. Alexandra's PR was approved, but she still wasn't allowed to deploy, because she hadn't pleased the Guardians of Compliance: licences, checklists, sign-offs, vulnerabilities, a change approval board and a lot of meetings. Thomas turned the list into a song on stage. By the end they had automated the whole process and shipped both fast and safely.

<img src="/blog-images/cloud-native-denmark-2026-24.jpg" alt="Thomas Vitale and Alexandra Hou Aldershaab on the main stage next to their Guardians of Compliance slide: licenses, meetings, sign-offs, checklists, tickets and more meetings">



## Policies as the human in the loop

Kyverno was also the subject of a whole talk on day one: "Observing Kubernetes Policies with Kyverno and VictoriaMetrics" by Diana Todea and Cortney Nickerson. They walked through the five policy types with a "good app" and a "bad app" that was missing its labels. Practical advice: always start in audit mode, since an enforced deletion policy can wipe out a workload you didn't mean to touch. And if you run Kyverno today, migrate to the CEL-based policy types before upgrading to 1.20, which no longer executes the legacy ones.

The part I liked was observing the policies once they're in place. Kyverno exposes metrics, so you can see over time how many requests get denied. A spike in denials can reveal friction in your platform. Maybe the policy is wrong, or maybe a team needs help. Either way you have data to start the conversation instead of a feeling.

<img src="/blog-images/cloud-native-denmark-2026-19.jpg" alt="Diana Todea and Cortney Nickerson on the main stage in front of a large number five, for the five Kyverno policy types">

Cortney also made a point I hadn't thought about in quite this way. Humans write the policies, and they apply to whatever makes the request, people or agents. They don't replace human review, but they enforce human decisions on every request, without a human having to be in the loop all the time.

## Mandated or voluntary?

Jacob Avlund from the LEGO Group asked a question I think a lot of platform teams avoid: should people have to use your platform? His talk, "Building platforms for teams that asked for them, and teams that didn't", compared two platforms he's responsible for. The container platform is voluntary. The observability platform is mandated.

Both come with trade-offs. The container team said no to kubectl access, and some teams left. "We wish them well, but it was the right decision." On the mandated observability platform, a networking team spent far too long trying to make something fit that never would. Adoption went to the mandated platform, 133 teams against 63. User satisfaction, measured by NPS, went to the voluntary one. Strategic goals were a draw.

<img src="/blog-images/cloud-native-denmark-2026-08.jpg" alt="Jacob Avlund's slide on cumulative platform adoption: 133 teams on the observability platform, 63 on the container platform">

What stuck with me is his point that on a voluntary platform, people can leave, and that's the strongest feedback signal a platform can get. On a mandated platform, nobody can leave, so you have to work much harder to listen. He also brought up an idea from a conversation with Manuel Pais: mandate the standard rather than the platform. You don't have to use our observability stack, but you do have to use OpenTelemetry. I've been arguing for this approach for a while. Standardising on OpenTelemetry gives teams a common foundation without forcing them into one particular backend, and the platform can still provide useful defaults, guardrails and instrumentation without dictating every decision a team makes. That feels like a much better balance between consistency and freedom.

He finished with more questions than answers. If agents do most of the work, does it still matter whether a platform is voluntary, or do agents just need documentation, tools and guardrails?

## Agents need somewhere to run

Agent Substrate came up [all week at KubeCon](/blog/kubecon-na-2026/), so it was good to have Abdel Sghiouar from Google explain it properly on day one, a week after it reached 1.0. Coding agents spend most of their time waiting, so giving each one its own pod wastes compute. Substrate snapshots idle agents, memory and file system included, and resumes them later, possibly on another pod. Abdel called it teleportation. Then he gave everyone in the room their own agent through a QR code, and we watched the cluster scale out as people started chatting. His advice in the Q&A was refreshingly honest: Agent Substrate is for platform teams. Everyone else should use something built on top of it, like kagent.

<img src="/blog-images/cloud-native-denmark-2026-09.jpg" alt="A full room watching Abdel Sghiouar's slide: Where does an agent run today? Laptop, Kubernetes and Agent Substrate compared">

Rasmus Steiniche, CEO of Neurospace (on stage with his shoes off, as usual), came at it from the other end: what if the agent can't leave the laptop at all? Many of their customers in defence don't allow code to leave their premises. In "Digital Sovereign Agentic Coding" he showed a setup that runs entirely on a laptop, with Goose, llama.cpp, small open-weight models and gVisor as the sandbox. To prove it, he turned off the Wi-Fi on stage, and the agent kept working.

<img src="/blog-images/cloud-native-denmark-2026-10.jpg" alt="Rasmus Steiniche's architecture slide: Goose as the agent, llama.cpp for inference, open-weight models and gVisor as the sandbox">

With small models, he said, the harness matters more than the model, roughly 70/30. The best moment came in the Q&A. Rasmus uses a skill that bans em dashes from everything his agents write, and the audience question tool filled up with people arguing for and against em dashes.

On day two, Henrik Rexed from Dynatrace compared three open source frameworks for SRE agents in "Observability in the Matrix: Choosing the Right AI Agent to Escape the Chaos": kagent, HolmesGPT and Sympozium, Alex Jones's newer project. Across 13 troubleshooting scenarios on his homelab, the results came down to how many tools each framework loads into the prompt. HolmesGPT, with a long list of integrations enabled by default, used 24 times more tokens than Sympozium. kagent was his overall winner, mainly for its isolation. It's the same point Jessica made about context: give the agent only what it needs.

<img src="/blog-images/cloud-native-denmark-2026-11.jpg" alt="Henrik Rexed's slide: Who are the agents? kagent, HolmesGPT and Sympozium drawn as Matrix characters">

These three talks fit together well. One was about running agents efficiently at scale on Kubernetes, one about a single agent on a laptop with no network, and one about choosing the framework you'd put on top. All of them treat the agent as something that has to be contained rather than trusted.

## Where should the capability live?

Michael Coté approached a related question from a completely different angle in his day one keynote, "What goblins and druids can teach us about enterprise AI": where should a capability actually live? He'd tried letting an AI run his D&D game. The first week was magic, then it got repetitive and forgot anything older than an hour. His slide had the honest scorecard: good at imagination and running combat, bad at secrets, remembering and dice. Fixing that led him to the same choices teams face at work: a prompt, an Agent Skill or an MCP server, and who owns, versions and pays for it, and rolls it back when every NPC suddenly speaks in haiku.

<img src="/blog-images/cloud-native-denmark-2026-26.jpg" alt="Michael Coté on the main stage in front of his slide listing what an AI game master is good at, like imagination and running combat, and bad at, like secrets, remembering and maths and dice">

## Seeing inside the database

Gabriele Rossini from EDB gave what he called his first talk as an "apprentice speaker", and asked the audience for feedback afterwards. "Unified Observability for PostgreSQL on Kubernetes" started at 3 a.m. with a slow checkout API, and traces that stop at the database client.

Tracking every executed query with the usual Prometheus stack costs so much memory that most teams drop it. His setup used CloudNativePG with two Postgres extensions and an OpenTelemetry pipeline into ClickHouse, with the query ID linking metrics, logs and traces. In the demo, a migration dropped an index, and you could see the lookup query switch from an index scan to a sequential scan.

He was honest about the trade-off: for plain metrics Prometheus is usually faster, and ClickHouse wins when your labels are highly unique. He also said native OpenTelemetry logs are planned for CloudNativePG 1.31.

<img src="/blog-images/cloud-native-denmark-2026-20.jpg" alt="Gabriele Rossini on stage in front of his architecture slide: OTel gateway, ClickHouse with one schema for three signals, and Grafana as one data source">

## The side effects we're starting to talk about

Marcus Noble from Monzo spent the first day as one of our track hosts, then gave the talk on day two that pulled the most threads together: "The AI side effects we're not talking about". Judging by the two days we'd just had, he said, it should really be called "the AI side effects we're now starting to talk about". This talk was about people.

He covered four side effects. The first is the move from software engineer to software approver. An agent produces a 13,000-line pull request, the author moves on, and the review work lands on someone else, usually a senior engineer. The second is skill decline. Reading code isn't the same as writing it, and when everyone plans features with agents instead of colleagues, you lose the conversations that make a product hang together. As he put it, an agent won't tell you your idea is silly. A colleague will.

The third is the human cost. Fewer junior hires today means fewer senior engineers in a generation. The fourth he called pay to play. We've spent twenty years making it free to learn to code, and now the useful tools cost a monthly subscription. He said that if this had been the case when he was learning, he wouldn't be standing there today.

<img src="/blog-images/cloud-native-denmark-2026-13.jpg" alt="Marcus Noble's Pay to Play slide: If this was the case when I started learning to code, I likely wouldn't be standing here today">

He didn't claim to have all the answers, but he had some. Understand what you submit, write the PR description yourself, and don't be a "meat proxy" for your agent. Write some code by hand now and then. Invest in juniors, and in reviews, "transfer wisdom, not syntax", a line he borrowed from the day before.

That line came from Adriana Villela and Josh Lee, whose day one keynote, "Whose Code is it Anyways?", looked at the same problem from the open source side. AI lowers the cost of making a contribution, but not the cost of maintaining it, and maintenance means trust, quality, context and community as much as code. Adriana had collected stories from the OpenTelemetry community, like a PR resubmitted with lipstick on after a maintainer pointed to the guidelines, and a translation of the docs from someone who didn't speak the language.

<img src="/blog-images/cloud-native-denmark-2026-25.jpg" alt="Adriana Villela and Josh Lee on the main stage, with their slide How Has AI Changed OSS Contributions? listing drive-by contributions, PRs instead of issues, slop PRs and merit badge collectors">

Their advice for maintainers was to write an AI policy (OpenTelemetry has one in its community repo), expect contributors to explain a change without a model, and be firm but polite. The real sign of a healthy project is the second contribution. For newcomers: start with why, stay curious and don't abdicate your thinking. For both: talk to each other, ideally before the PR.

All these conversations about AI, skills and the future of software engineering made the way we opened and closed the conference feel even more relevant.

## Talent is everywhere, opportunities are not

Day one opened with Helena Birkholm, managing director of HackYourFuture. HackYourFuture is a free coding programme for refugees and others who struggle to get into the Danish job market. With volunteer mentors and partners, they teach the skills employers want and help people rebuild their network. Their measure of success isn't how many people finish the programme. It's how many get a job in tech.

Saloumeh, their technical programme lead, joined her on stage. She started as a trainee, landed her first job as a front-end developer, volunteered for five years and now runs the programme. Helena's line "Talent is everywhere, opportunities are not" stayed with me, and so did her example of people with PhDs cleaning toilets at the airport. She also admitted that when we first reached out, she thought it was too good to be true and assumed it was spam.

We closed day two the same way. Per presented our donation of the conference's profit to HackYourFuture: DKK 200,000.

<img src="/blog-images/cloud-native-denmark-2026-21.jpg" alt="Four people on the main stage holding the Cloud Native Denmark donation cheque to HackYourFuture for DKK 200,000">

## Wrapping up

Looking back over the two days, one theme kept coming up. Agents make software cheaper and faster to produce, but the work doesn't disappear. It moves into reviewing, operating and understanding what was built.

That's where platform engineering matters even more. Humans and agents both need paved paths, guardrails and observability, without the platform adding complexity of its own. And Marcus reminded us not to forget the people: the reviewers, the juniors who aren't getting hired, and the people who can't afford the subscription.

That's why ending the conference with a DKK 200,000 donation to HackYourFuture felt right. We spend a lot of time talking about how technology is changing, but we also need to make sure more people get the opportunity to be part of it.

A huge thank you to all our speakers, sponsors and everyone who joined us in Copenhagen. And an especially big thank you to my nine fellow organisers: Jinhong Brejnholt, Per Hedegaard Christiansen, Mert Gungor, Thor Anker Kvisgård Lange, Allan Højgaard Jensen, Søren Boss Jacobsen, Mads Høgstedt Danquah, Aleksander Nowak and Robert Jensen. It's a lot of work putting something like this together, but seeing it all come together makes it worth it.

<img src="/blog-images/cloud-native-denmark-2026-22.jpg" alt="The organiser team in white T-shirts cheering in front of the Cloud Native Denmark sponsor wall">

Early Blind Bird tickets for next year are already available for DKK 999 at [cloudnativedenmark.dk](https://cloudnativedenmark.dk/). If you attended, please [leave us some feedback](https://forms.gle/4XVnmNoEa5koLV238), or find yourself in the [photo gallery](https://www.picdrop.com/kim-yennguyen/PtE1CyXcQm) from the two days.

See you next year!

Most of the photos in this post are by our conference photographer, Kim Yen Nguyen.
