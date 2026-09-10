# 🚀 Recently Added Features

This document provides a consolidated list of all the new features and enhancements recently integrated into the **AEGIS-INTELLIGENCE** platform.

---

## 1. "Explain This Link" Analyst Dashboard
*A complete redesign of the edge selection panel to provide human-readable, explainable AI attribution.*

- **Granular Signal Breakdown**: Replaces the single score with a breakdown of 5 individual signals (Semantic, Lexical, Syntactic, Punctuation, Temporal), displayed as sleek progress bars.
- **Dynamic Evidence Generation**: Automatically generates natural language statements identifying exactly what behaviors correlated, separating them into **Supporting Evidence** (e.g., "Shared distinctive lexical patterns") and **Contradictory Evidence** (e.g., "Large sentence-length variance").
- **Pairwise Comparison Statistics**: A side-by-side table comparing the aliases' average sentence length, total post count, and active UTC window.
- **Shared Linguistic Patterns**: Displays the exact phrases, slang, or n-grams shared between the two identities.
- **Analyst Assessment**: A clear summary statement advising the analyst of the potential linkage while reminding them that analyst verification is required.
- **Backend Optimizations**: The `/explain/{alias_a}/{alias_b}` endpoint computes Lexical (Jaccard vocabulary index) and Temporal (active window overlap) metrics on the fly using in-memory data, ensuring zero ML inference latency.

## 2. Analyst Investigation Mode
*A structured 4-step intelligence workflow accessible via the UI.*

- **Step 1: Target Selection**: Select an initial threat actor alias to investigate.
- **Step 2: Candidate Correlation**: The system automatically generates a list of mathematically probable matching identities.
- **Step 3: Evidence Comparison**: Side-by-side breakdown of why the system correlated them.
- **Step 4: Intelligence Report Generation**: Automatically drafts a presentation-ready threat intelligence summary based on the findings.

## 3. Threat Actor Evolution Timeline
*A dual-track temporal visualizer built directly into the Evidence Comparison stage.*

- Automatically plots the historical post activity of the target and candidate aliases on a shared timeline.
- Visually highlights periods of concurrent activity.
- Classifies the temporal relationship (e.g., identifying a sequential identity handover where one alias ceased operations right before the other emerged).

## 4. Confidence Scoring System
*Translating raw math into actionable intelligence labels.*

- The raw stylometric similarity score is now translated into distinct confidence bands:
  - `0–40` → **Weak Link**
  - `40–65` → **Possible Link**
  - `65–80` → **Probable Link**
  - `80–100` → **High-Confidence Potential Link**

## 5. Expanded Ground-Truth Dataset (20 Personas)
*A drastically expanded simulation environment to make live demonstrations more impressive and challenging.*

- Increased the dataset from 8 to **20 distinct personas**, totaling 31 aliases and over 100 posts.
- **Added "Normal User" Noise**: To prove the system doesn't just correlate everyone, normal users (gamers, tech support, fitness enthusiasts) were added as background noise.
- **Added Decoys**: Speculative Crypto Moonboy vs. Quantitative Crypto Analyst. This proves the system successfully distinguishes *stylometric writing style* over simple keyword matching, as both discuss cryptocurrency but don't get falsely linked.
