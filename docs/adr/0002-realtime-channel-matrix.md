# ADR 0002: Realtime Channel Matrix

Date: 2026-07-20

## Status

Accepted

## Context

Supabase Realtime can create idle WebSocket egress when mounted broadly. The product needs live behavior only on named surfaces.

## Decision

Realtime is globally off unless `NEXT_PUBLIC_ENABLE_REALTIME=true` and `NEXT_PUBLIC_DISABLE_REALTIME` is not true. Each channel also requires its own explicit flag, documented in `docs/perf/realtime-channel-matrix.md`.

## Consequences

Logged-out public routes do not open Realtime sockets by default. Product can opt into individual channels without enabling full-table realtime globally.
