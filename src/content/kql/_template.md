---
title: TITLE HERE
date: 2026-01-01
description: One or two sentences. Shown on listings and used as the meta description.
tags: [tag-one, tag-two]
dataTable: SigninLogs
technique: T1110.003
draft: true
---

A paragraph explaining the problem this query solves.

## The query

```kql
SigninLogs
| where TimeGenerated > ago(1d)
```

## Data sources

Which table(s) this reads from, and anything to know about them.

## Tuning

Thresholds to adjust, and what causes false positives.
