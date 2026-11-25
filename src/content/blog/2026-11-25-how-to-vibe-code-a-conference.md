---
title: "How to Vibe Code a Conference"
date: 2026-11-25
summary: "How we used Claude, Sessionize, ElevenLabs and a fair bit of software engineering to build the website, the graphics, the decks and our own stage production for Cloud Native Denmark 2026. Including a 10-metre LED wall, a voice of god, and a conference song."
tags: ["conferences", "community", "ai"]
hero: "how-to-vibe-code-a-conference-desk-view.jpg"
draft: false
---
In [my recap of Cloud Native Denmark 2026](/blog/cloud-native-denmark-2026/) last week, I briefly mentioned that we had vibe coded pretty much everything you saw on the big LED wall: the graphics, the animations, the music, the speaker introductions, and the control panel we used to run it all. A few people have asked me since how we actually did it, so here's a bit more about what went into it.

We're a team of ten community organisers, and none of us is a graphic designer. Yet this year we had a 10 by 3 metre LED wall arriving on 12 pallets, and we needed to put something on it. So naturally, I started experimenting with Claude.

What started as a weekend experiment back in April turned into a project spanning seven months, two Git repositories and, for some reason, our very own conference song.

## It started with a weekend

Back in April, when [Claude Design](https://claude.ai/design) launched, I spent part of my weekend playing around with what a new visual identity for Cloud Native Denmark could look like. I tried layouts, colours and different ways of turning the logo into shapes, and threw most of it away again. You can explore twenty directions in an afternoon and keep the two that feel right.

By Sunday we had a direction we liked, and Alek and I took it straight into the conference website. Two components from that work, a brand shape and a portrait frame built from it, ended up everywhere this year, from LinkedIn posts to the wall behind the speakers. By Tuesday evening, the weekend experiment was live on the conference website.

## Where we still needed a designer

We did, however, run into a problem. AI got us a concept and a website, but it didn't get us print-ready artwork. Nobody on the team knew how to prepare files for a printer, and a banner that looks right on a laptop can come out very wrong on a two-metre roll-up.

So we brought in a designer for a short engagement, based on what we had made in Claude Design. He turned it into proper source files, and his frames became the base for several of our social media graphics. Those files gave us the foundation to build everything else ourselves, and they ended up playing a much bigger role in the project than I had expected.

## One repository for everything else

In August, I started a second repository for everything that wasn't the website. At this point, my platform engineering background probably started to show. If we were going to generate hundreds of graphics, I didn't want to rely on Claude remembering what our brand looked like every time I started a new conversation.

So I started by writing a short design spec, and then had Claude pull the palette, type specs, logo artwork and frame geometry out of the designer's files and the Claude Design style, and into a `tokens.json` and a set of SVGs. This is what we ended up with:

<img src="/blog-images/how-to-vibe-code-a-conference-design-system.jpg" alt="The Cloud Native Denmark 2026 design system on a navy background: the lockup with the flag mark, nine colour tokens shown as rounded heptagons, Space Grotesk and Inter type samples, the brand shape as a portrait frame, the mark, and the hexagon field">

The brand shape is the rounded seven-sided outline from the Kubernetes logo, which our flag mark is built on. It frames every portrait and sponsor tile, while the true hexagons are reserved for the background field. Two checks run on every change:

- A token lint that fails if any colour outside `tokens.json` shows up anywhere.
- A pixel diff that renders the designer's twelve LinkedIn frames from scratch and compares them with his originals. If a corner radius drifts or a tab moves a few pixels, the test fails.

This is probably where the project became a little less about vibe coding and a little more about engineering. Without those checks, every new graphic would have drifted a tiny bit from the last one, and after a hundred of them we wouldn't have had a brand anymore. With them in place, I could ask for things in plain language and be much more confident in what came back. "Move Chainguard to gold and rebuild the sponsor graphics." "Make a countdown for ten days to go." The repository has a [Claude Code](https://www.anthropic.com/claude-code) skill that knows which template to use for what and the house rules, so it doesn't invent a new colour along the way.

After that, I mostly worked on content, and most of the content wasn't typed by us at all. It came from [Sessionize](https://sessionize.com/), where we run the call for papers and the schedule. Their API gives you every session with its title, speakers, job titles and photos, and that one feed ended up everywhere: the social media posts promoting a keynote, the talk slides in our decks, and the speaker introductions and break screens on the wall. When a speaker changed their job title or a talk moved, we re-synced, and every one of those places picked it up. The sponsor tiers and countdowns live in a JSON file next to it.

## Social, print and Canva

From all of that, we generated the social media graphics for the conference, 27 designs per build, each in a square and a 4:5 version. Print went through the same pipeline: the sponsor booth stamp card, the door signs and the track host guide, written in Markdown and rendered into branded A4 PDFs.

As much as I enjoy working in Git repositories, I can't really expect the rest of the organising team to do the same. So we exported every graphic Claude made to Canva, as editable designs, so anyone could make a small tweak without asking me. Getting there took a few tries. Import a PDF and Canva flattens it into one image, so you need HTML to get layers. And at one point, our carefully designed conference graphics showed up in Canva on a lovely stock background of blue skies and green grass. Not quite the visual identity we were going for. It turned out Canva didn't like our SVG data URIs.

## The decks

The LED wall sits between two projector screens, which carry the speakers' slides and our own decks for the opening, wrap-ups and announcements. They're built in HTML with the same design system, and they export to PowerPoint, so the other organisers could comment in Google Slides while I folded the changes back in.

We also generated a backup deck for every coffee break and lunch, in both rooms, in case the screens didn't work out. We never needed them, but it was nice to know they were there.

If you've ever organised a conference, you'll know that the schedule a week before isn't necessarily the schedule you end up with on the day. We had a keynote cancelled two days before the conference and a breakout speaker replaced the day before. Both times, we updated Sessionize, re-synced, and the decks and the wall followed. The new speaker only needed a fresh voice-of-god clip.

## An idea in a hotel room

Things escalated a little towards the end of September. I was in Copenhagen for [GOTO](/blog/goto-copenhagen-2026/), and one evening at the hotel I started playing around with Claude and the idea of what we could do with the big LED wall. I didn't even have the exact resolution at that point. I just knew it was going to be a very wide screen.

I wanted a control panel on my laptop, with the actual output running in a separate browser window that we could put on the big screen. I wanted to be able to play music, run countdowns, have an individual walk-on for each speaker, and control the whole thing from one place.

So I started building it.

I didn't really present the idea to the other organisers beforehand. I built something, recorded a video of it and shared it with the team. The reactions were positive, so I kept going. I don't think everyone fully realised what I had in mind until we put it on the LED wall the day before the conference.

Looking back, I'm quite happy I went down that rabbit hole.

## The wall

The part I was most excited about was the LED wall itself. It's one thing to build animations on a laptop, and quite another to have them on a 10-metre-wide screen behind a speaker in a room full of people.

The wall is 3696 × 1176 pixels, and that shape drove most of the decisions. Before building any scenes, I wrote down five rules in the repository, so Claude would follow them every time:

1. **The speaker comes first.** While they talk, content stays in the left and right thirds.
2. **No straight lines.** Every scene change is a hexagon wave.
3. **Keep the background dark.** White on LED is blinding and washes out the speaker on camera.
4. **Slow motion.** Behind a talk, the only movement is hexagons slowly breathing.
5. **Stick to the design system.**

<img src="/blog-images/how-to-vibe-code-a-conference-room.jpg" alt="A packed main hall seen from the back, with the LED wall showing Michael Coté's portrait in the brand shape and talk title between the two projector screens">

The scenes follow the day: a walk-in loop, a countdown before each block, walk-ons where the speaker's portrait and title fill the wall before gliding out to the sides, break scenes, a two-minute clock for the gold sponsor pitches, and an afterparty scene with hexagon confetti, clinking drinks and a burger.

<img src="/blog-images/how-to-vibe-code-a-conference-countdown.jpg" alt="The LED wall counting down to the day two keynotes at 15:45, with the next three main-stage sessions listed on the right and two speakers getting ready at the podium">

<img src="/blog-images/how-to-vibe-code-a-conference-pitch.jpg" alt="An AWS speaker giving a gold sponsor pitch, with the two-minute clock large on the wall next to a cluster of hexagons">

Of course, there's a difference between looking at this on your laptop and seeing it on the real thing. When we finally got everything set up on the Wednesday, we realised that the stage was slightly higher than the bottom of the screen, so we had to compensate for that in some of the layouts.

Another thing we hadn't really thought about was how hard it would be for the speakers to see their own slides. With the projector screens on either side of the wall, they didn't have a great view of either of them from the stage. Our AV wizard, Søren, came up with a solution: he overlaid the presentation feed directly onto the middle of the LED wall. It turned out that our design, with the portrait on one side, the talk title on the other and a quiet middle, worked perfectly for that.

After spending so many evenings looking at this thing on my laptop, the actual stage looked pretty much like what I had imagined in that hotel room in Copenhagen. That was quite satisfying.

### The control panel

One of the things I find quite funny about the whole setup is that the enormous LED wall was essentially a browser running in full screen. A small show server on the laptop holds the current cue, and every page follows it.

During the conference, whoever was running the wall needed to focus on the speakers, the stage and the timing, not fiddle around with software. So the control panel had to be simple enough to use with several conversations going on in a headset, and a presentation clicker works on it too. It shows a live preview of the wall, what's on now and what's next, big Next and Back buttons, music controls, countdown adjustments and the whole run of show. If the schedule slips, you press "+1 min" and the countdown moves.

<img src="/blog-images/how-to-vibe-code-a-conference-control-main.jpg" alt="The main stage control panel during Hannah Foxwell's walk-on: a live preview of the wall, now and next, a red Go live now button counting down 17 seconds, voice of god modes, countdown controls and the run of show">

During a walk-on, the big button turns red and counts down the 20 seconds until the talk goes live by itself. Press it, and it goes live straight away.

A few other details came from thinking about what could go wrong. The venue Wi-Fi was shared with every attendee, and we didn't want anyone on it accidentally (or deliberately) taking control of the wall, so changing the show requires a key. In the end, we just ran everything locally on the laptop, so that was never a concern, but better safe than sorry. If the wall window reloads, it comes back on the current cue. And there's a panic button: `B` leaves just a small logo, which is safe in the middle of any talk.

It also runs two rooms in two formats. The breakout room has a 1920 × 1080 projector, its own laptop and its own run of show, with the same scenes rearranged for 16:9.

<img src="/blog-images/how-to-vibe-code-a-conference-control-breakout.jpg" alt="The breakout room's control panel with a 16:9 preview of Adriana Villela and Diana Todea's walk-on, and the breakout's own run of show">

There was one thing that made me a little nervous in the days leading up to the conference, though: the audio. For some reason, getting the browser to start playing audio was occasionally a struggle. Some combination of toggling things on and off, switching scenes and refreshing the browser would eventually get it going, and once it was playing, it was rock solid. I still haven't figured out what was going on there.

It's one thing to vibe code something on your laptop. It's a different feeling when you're about to open the doors to more than 500 people and you're relying on that same piece of software to run your conference.

## Music and the Voice of God

All the music was generated with [ElevenLabs Music](https://elevenlabs.io/): a calm set for breakfast and breaks, a pre-show set of house and nu-disco before each block, and eight 20-second walk-on themes, taken in turn so two talks in a row never sound the same.

Then there was the Voice of God, the announcer voice you hear but never see. I'd been playing around with ElevenLabs for a while and already had a clone of my own voice, so naturally, that was the first thing I tried. It didn't quite have the effect I was after. What I really wanted was a big, slightly over-the-top American announcer. Something that would hopefully put a smile on people's faces when a speaker walked on. "Please welcome to the stage… from Saxo Bank… Johan Thomsen!"

Generating 42 introductions, for every speaker and for us hosts, turned out to be the easy part. Getting an American announcer to pronounce Danish, Swedish and various other names was a different challenge. The trick is to write the names the way they sound, so Allan Højgaard Jensen became "Hoy-gore" and Johanna Öjeling became "Er-yeling". Part of the charm is that it still sounds a little awkward at times, but we spent quite a bit of time listening to the clips and regenerating the ones that came out wrong.

The day before the conference, we added a switch to turn it off, or keep it only for our own welcomes and wrap-ups. That kind of change is much easier to make the day before when you own the code.

Judging by the reactions, I think most people enjoyed it. We also got feedback from people who weren't fond of it, which is perfectly fair. It was an experiment, and I had fun with it. I wanted to add a bit of excitement to the moment a speaker walks onto the stage.

## Show days

Wednesday was spent setting everything up, testing the wall, rehearsing the transitions and making quite a few adjustments to the run of show.
Once the conference kicked off on Thursday morning, I spent a good part of the two days wearing a headset. When I wasn't on stage hosting with Allan and Jinhong, I was checking in with speakers, making sure they were ready, and timing the transitions with Per, one of my fellow organisers: speaker's ready, walk-on, live, clear. Per ran the stage control panel most of the time, either directly at the computer or remotely with a clicker.

[Søren Østergaard](https://www.luminance.dk/) from Luminance was our AV Jedi master throughout the conference. Building the software is one thing. Making it work alongside everything else happening on and around a stage is quite another, and he made everything look like it was supposed to happen exactly when it did.

<img src="/blog-images/how-to-vibe-code-a-conference-desk.jpg" alt="The AV desk at the side of the main hall, with two crew members in headsets, the Luminance rack, laptops running the show and a brass bell">

Most attendees probably never saw what the setup looked like from behind, so here it is.

<img src="/blog-images/how-to-vibe-code-a-conference-behind.jpg" alt="Behind the LED wall: a tall rack of panels with orange power and data cables and flight cases on the floor">

We also learned a few things on day one that we wanted to change for day two. So, naturally, after the afterparty on Thursday evening, I was back on my laptop with Claude Code. The sponsor pitch logos moved closer to the edge of the wall, Per and Helena got their own walk-on for the HackYourFuture donation, and day two got the sing-along as its ending.

One idea we had after our rehearsal was to thank Claude during our closing remarks. I told Claude that I wanted a scene thanking it for helping us build all of this, with a dancing Claude mascot that winks at the audience now and then. By that point, the repository had all the context it needed: the design rules, the components and the show server. I didn't touch the implementation, and the result was pretty much exactly what I had in mind. Those are still the moments where I get quite excited about what's possible with these tools.

<img src="/blog-images/how-to-vibe-code-a-conference-thanks.jpg" alt="The organisers lined up on stage in white T-shirts under a giant pink pixel mascot and the line Every slide, every cue and every voice on this wall, built together with us">
## The November Beat

Apparently, building our own conference production system wasn't quite enough. We also ended up with our very own conference song.

We made "The November Beat" with ElevenLabs Music, and if you were at Cloud Native Denmark, you probably heard it a few times. We played it a couple of times during the day, and we built a sing-along scene for the wall as well, with the line being sung large across the screen and the next one dimmed below it. To get the timing right, I ran the song through [Whisper](https://github.com/openai/whisper) to get word timestamps.

> We are Cloud Native Denmark, unified and strong<br>
> From Copenhagen to the north where we belong<br>
> Aarhus is rising, Aalborg is in the sound<br>
> The greatest tech community that can be found!

I didn't hear too many people singing along, admittedly. But I saw quite a few people filming the screen, and a lot of smiles and laughs around the room. That was really what I was after. There's something nice about having our own little song about the Cloud Native Denmark community, whether you're from Copenhagen, Aarhus, Aalborg or somewhere else entirely.

If you're wondering what it sounds like, here's a video with the song and some of the photos from the conference.

<div class="aspect-video rounded-xl overflow-hidden">
  <iframe class="w-full h-full" src="https://www.youtube-nocookie.com/embed/HxwpZQSlvc4" title="The November Beat – Cloud Native Denmark 2026" loading="lazy" allowfullscreen></iframe>
</div>

Out of curiosity, I took a look at the Git history after the conference. The graphics repository ended up with 133 commits, and 100 of them were made in the two weeks leading up to the conference. The most active hour of the day? Ten in the evening. I'm not entirely sure how many evenings went into this project, but the Git history probably tells a fairly accurate story.

## What I'd tell another conference

Looking back, what's interesting to me is how much of this relied on things we already know from software engineering. A single source of truth, reusable components, automated checks and reproducible builds. Claude made it possible for me to build something I probably wouldn't have attempted otherwise. But the longer I worked on it, the more those engineering practices mattered.

- **Give the AI something to check against.** The token lint and the pixel diff did more for brand consistency than any prompt.
- **Use the data you already have.** Sessionize already knew every talk, speaker and photo, so a change only had to happen once.
- **Know where you still need people.** Print needed a designer, and the show needed Søren.
- **Listen to everything.** Claude can tell you a clip exists. It can't tell you that it mispronounces someone's name.

## Would I do it again?

Absolutely. I don't see us going back to doing all of this by hand, and I suspect we'll use AI even more when we organise next year's conference.

What I find most interesting, though, is how little of this is specific to Cloud Native Denmark. Most conferences have a schedule, speakers, sponsors, social media graphics, print, decks and some sort of stage production. The [graphics repository](https://github.com/cloudnativedenmark/graphics) is already public on GitHub, but it's very much built for us. I'd love to pull the reusable parts out into an open-source project, so you could bring your own visual identity and your Sessionize data, and get a starting point for everything from social media graphics to the live stage.

Having organised community conferences for quite a few years, I know how much time goes into all those little things. If we can make some of that easier for other organisers, that would be a pretty cool thing to give back to the community.

If you're organising a conference and this sounds like something you'd use, I'd love to hear from you.

*The photos from the conference are by our photographer, Kim Yen Nguyen. The control panel screenshots are from the show server, running locally.*
