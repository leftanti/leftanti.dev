---
title: TITLE HERE
date: 2026-01-01
description: One or two sentences. Shown on listings and used as the meta description.
tags: [tag-one, tag-two]
dataTable: SigninLogs
technique: T1078.004
severity: medium
draft: true
---

A paragraph on what this rule detects and why it matters.

## The logic

```kql
SigninLogs
| where TimeGenerated > ago(1d)
```

## False positives

What causes them and how to suppress safely.

## Tuning

Thresholds to adjust as the environment changes.
