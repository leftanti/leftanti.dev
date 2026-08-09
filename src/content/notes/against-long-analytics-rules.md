---
title: Why I stopped writing 500-line analytics rules
date: 2026-06-22
description: Long detections feel thorough and behave badly. What actually goes wrong when one rule tries to cover six behaviours, and what to do instead.
tags: [detection-engineering, opinion]
draft: true
---

There is a stage in detection engineering where the obvious move is to make the
rule bigger. A false positive arrives, you add a condition. An edge case turns
up, you add a branch. The rule grows, and because it keeps working, growing it
feels like progress.

It is not. It is deferred cost, and the interest compounds.

## What actually goes wrong

**You cannot tell which clause fired.** An alert from a rule with six behaviours
in it tells you something matched, not what. The analyst reconstructs the logic
from the entity list every single time. That reconstruction is the real cost of a
long rule, and it is paid on every alert, forever.

**Tuning one behaviour degrades the others.** Suppress the noisy branch and you
have widened an exclusion across all six. This is where genuine detection gaps
come from — not from missing rules, but from suppression bleeding sideways into
behaviours nobody was thinking about.

**The tests do not exist.** Nobody writes coverage for a 500-line query. So the
rule is validated by whether it still returns rows, which is not the same as
whether it still detects the thing it was built for.

**It cannot be deleted.** Retiring one behaviour means understanding all six well
enough to prove the others are unaffected. So the rule stays, accumulating
branches, long after most of it stopped earning its place.

## What I do instead

One behaviour, one rule. If the KQL needs a comment explaining which section
handles which case, that is two rules wearing a coat.

The specific practices that follow from it:

- **Name the rule after the behaviour, not the tool.** "Service created over
  SMB", not "Lateral movement detection v3". If you cannot name the behaviour in
  a short phrase, the scope is still wrong.
- **Push suppression into data.** Watchlists, not `where` clauses. An exclusion
  should be a row somebody can audit, with an owner and a date.
- **Let correlation happen downstream.** Incident grouping is the platform's job.
  Doing it inside the query is how one rule ends up owning six behaviours.
- **Set severity per rule, not per family.** Six behaviours in one rule forces
  one severity onto all of them, which is invariably wrong for at least four.

## The objection

Yes, this means more rules. Yes, that is more objects to manage.

But rule *count* is not the thing that hurts. Rule *comprehensibility* is. Thirty
rules an analyst can read in a minute each cost far less than five nobody fully
understands — and when one of the thirty misfires, you fix that one, at three in
the morning, without wondering what else you just changed.
