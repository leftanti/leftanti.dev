---
title: TITLE HERE
date: 2026-01-01
description: One or two sentences. Shown on listings and used as the meta description.
tags: [tag-one, tag-two]
dataTable: AuditLogs
technique: T1098.001
draft: true
---

## Hypothesis

What you expected to find, and why.

## The hunt

```kql
AuditLogs
| where TimeGenerated > ago(30d)
```

## Reading the results

What the output means and how to triage it.

## What this does not cover

Related cases this hunt does not catch.

## Outcome

What came of running it — findings, or a clean result.
