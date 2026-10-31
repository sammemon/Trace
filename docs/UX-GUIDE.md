# UX Guide

TRACE uses a responsive, mobile-style web layout with a calm green/terracotta palette, strong display typography, and compact cards designed for scanning.

## Required states

Every network-backed view should provide loading skeletons, an empty state with a next action, an error state with retry, and an offline state when cached content is available.

## Interaction rules

- Keep tap targets at least 44px.
- Never expose phone numbers, emails, OTPs, or private verification details.
- Use text and icons in addition to color for Lost, Found, warning, and success states.
- Keep claim verification before chat and handover confirmation before marking an item returned.
- Prefer public campus handover points and clear safety copy.