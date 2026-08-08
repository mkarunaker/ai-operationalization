# ADR 0003: Adopt the lean local editorial-workspace contract

## Status

Accepted by the user on 2026-08-06.

## Context

The original 27-section specification describes a broader, production-oriented application. The user subsequently approved a narrower direction: a private, local workspace for capturing ideas, developing them with a BOK-grounded editorial process, creating user-owned posts, and recording publication learning.

Older planning and architecture documents retain useful implementation detail, but some still describe the former dashboard, five-question intake, Content Intent Brief, and three-path flow as active behavior. This created conflicting sources of truth.

## Decision

The active product contract is the lean local application defined by `BUILD_ROADMAP.md` and `LEAN_PRODUCT_SCOPE.md`, subject to the user's explicit decisions in the current conversation. `AI_Editorial_Board_Spec.md` remains the source for requirements not superseded by the lean contract.

The active public editorial taxonomy is:

1. See through the AI hype
2. Understand the operationalization gap
3. Improve leadership judgment
4. Select the right work
5. Build, adopt, and operate with principles

The BOK remains a read-only external source. Proposed content maps belong in the Editorial Notebook until deliberately approved as BOK content. A proposed system-design sequence is named `B1–B6`; it does not renumber or replace canonical BOK principles `P1–P8`.

## Consequences

- The root route is the idea queue; `/dashboard`, legacy intake, and legacy board routes remain compatibility surfaces until useful logic is migrated or retired.
- The visible lean workflow must describe deterministic/mock behavior honestly until it is genuinely BOK- and voice-grounded.
- New work follows milestone order in `BUILD_ROADMAP.md`.
- Documentation may preserve historical detail, but must prominently identify it as legacy when it no longer describes the active path.
