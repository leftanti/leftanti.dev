---
title: Phish Fortunes, a game board for phishing investigation training
date: 2026-11-06
description: A Family Fortunes-style board for running phishing investigation training with SOC analysts. One page, no build step, runs in the browser.
tags: [phishing, triage, training, javascript]
draft: true
---

<!--
  HOW TO USE THIS FILE
  Everything in an HTML comment like this one is a note to you. It does not show
  on the page, but it DOES ship in the page source, so delete each comment as you
  replace it with your own writing, and delete this block last.
  Delete any section you don't need. The structure, the links, and the keyboard
  table are already done.

  While draft: true the page is excluded from the build. Flip it to false when
  https://phish.leftanti.dev loads over HTTPS, so the article never links to a
  broken address.

  Keep examples generic and invented. No real tenants, incidents, or anything
  from an employer or client.
-->

I got tired of writing normal plain training documents and let Claude build a
simple Family Fortunes-style game, which I can use as an interactive training
platform for new analysts.

**[Play it at phish.leftanti.dev](https://phish.leftanti.dev)**

## Why I built it

Every time a new starter joins a company, they are flooded with mandatory
training, follow-along workbooks and documents. All of these lack proper
engagement.

## How a session runs

The app is designed to be used in either a one-to-one call, or a call involving
several new starters or analysts. One host opens the site and clicks the host
button at the top, which opens a second window with all the host controls. The
host then shares their screen, and the analysts guess the phishing triage steps
they would take in Microsoft Defender, in the order they should do them.

All results have a little training note.

<!--
  Optional: room size, how long a session takes, how you pick teams, what you do
  when a team gets stuck.
-->

Step by step:

1. Open the board, maximise it, and share that window with the room.
2. Click **Host controls**. A second window opens with every answer and a
   speaker note per step. Keep it off-screen.
3. Ask the question: a user reports a phishing email, so what do you do?
4. Reveal answers as people shout them out, in any order.
5. A wrong answer is a strike. Three strikes and the round ends.
6. Good answers that are not on the board go into honourable mentions.

### The three phases

The seventeen steps are grouped into three phases, plus a bonus.

| Phase | What it covers |
| --- | --- |
| Triage | <!-- one line --> |
| Scope and impact | <!-- one line --> |
| Containment | <!-- one line --> |

## Controls

Everything the host needs is on the keyboard.

| Key | Action |
| --- | --- |
| `1` to `17` | Type a step number, then pause or press `Enter`, to flip it |
| `X` | Strike |
| `Z` | Undo a strike |
| `B` | Bonus |
| `H` | Host controls drawer |

Progress is saved in the browser, so a refresh will not lose the board.
Resetting the game clears it.

## What I'd want people to take away

<!--
  The real point of the exercise. Which step do people most often miss, and
  what does that say about how they investigate? This is the most valuable
  section, so spend your words here.
-->

## How it's built

It is a single HTML file with inline styles and script, no framework and no build
step. The two windows talk to each other with `BroadcastChannel`, progress lives
in `localStorage`, and the sound effects come from the Web Audio API, so there
are no audio files either. Fonts are self-hosted, so the page makes no
third-party requests.

<!-- Anything you want to add: what was awkward, what you'd change. -->

## Run your own

The source is at [github.com/leftanti/phish](https://github.com/leftanti/phish).
It is one file, so forking it and editing the steps is the whole process.

<!--
  Invite changes? Say what you would like feedback on, and how to reach you.
  Contact details belong on the About page, not here.
-->
