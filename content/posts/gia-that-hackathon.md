---
title: Building Giá Thật for Google AI Riser Vietnam
date: 2026-08-05
tags: [hackathon, ai, vietnam]
excerpt: Notes on the fake review detector I'm building for Vietnamese e-commerce, and the core design problem I'm stuck on.
---

Giá Thật is my entry for the Google AI Riser Vietnam 2026 hackathon: a tool that looks at a screenshot of product reviews from a Vietnamese e-commerce platform and flags whether they look trustworthy.

## The pipeline so far

- Screenshot comes in
- Gemini vision reads the review text, ratings, and reviewer patterns
- The service runs on Cloud Run so it scales down to zero between demo runs

## The hard part

The real design problem isn't calling Gemini — it's figuring out *which* signals actually separate a real review from a fake one, and doing it cheaply enough to run at scale. Things I'm weighing:

- Reviewer language patterns (generic praise vs specific product detail)
- Timing clusters (a wall of 5-star reviews posted within minutes of each other)
- Cross-referencing reviewer history where it's visible in the screenshot

Deadline is August 30. More notes as the trustworthiness scoring takes shape.
