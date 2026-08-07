---
title: Swapping IntoMath's semantic router for something lighter
date: 2026-07-20
tags: [intomath, architecture]
excerpt: Weighing whether an LLM-based classifier is overkill for routing geometry commands, and sketching an embedding-based replacement.
---

IntoMath 2.0 turns a math problem into an interactive GeoGebra visualization. Under the hood, `model_router.py` decides which of the 502 commands in the geometry DSL apply to a given problem — right now that decision goes through an LLM call.

## Why that might be overkill

An LLM-based semantic classifier is flexible, but it's slow and expensive for something that's really just "does this problem look like circle geometry or coordinate geometry." A frozen multilingual embedding model with a small linear head on top should get most of the way there for a fraction of the cost.

## What I sketched

`embedding_router_sketch.py` — a rough version that:

- Embeds the incoming problem text
- Runs it through a lightweight linear classifier head
- Falls back to the LLM router only when confidence is low

Still validating this against real extraction failures before I rip out the LLM path entirely.
