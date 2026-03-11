# Claude Code Instructions

## Competitors
Competitors should NEVER be brought back into the application. A user would be able to scan their competitors and only have it on a small amount of domains. We do NOT want to promote scanning of websites that are NOT verified, even though users may still do it. 

## Tiers 
Whenever there is a new feature added, always update the tiers.md file and the front end to reflect new changes. 

## Audit Exports
Whenever anything is added to an audit, it should always appear on any export, whether it's PDF, CSV or anything new. New features should always be added to replicate this.

## Security
Security is a must. This app needs to be as secure as possible - we don't want users to be able to edit their plans for example in the front end. 

## Audit Issues
Please always use the unique amount of issues rather than the total issues.

## Project Context

This is **PagePulser**, a web accessibility auditing SaaS platform built with:
- **Backend**: Node.js, Express, PostgreSQL, BullMQ
- **Frontend**: React, TypeScript, Tailwind CSS
- **Infrastructure**: Docker, Redis

## Brand Guidelines (IMPORTANT)

When implementing any UI changes, **always reference the brand guidelines** at `/docs/BRAND_GUIDELINES.md`.

This includes:
- **Colors**: Use the indigo primary palette (`indigo-600` as primary brand color) and amber accent palette
- **Typography**: Instrument Serif for display, Outfit for body, JetBrains Mono for code
- **Spacing**: 4px base unit with 8px primary scale
- **Components**: Follow button, card, and input patterns defined in the guidelines
- **Semantic Colors**: Use defined colors for status states (pending, processing, completed, failed) and severity levels (critical, serious, moderate, minor, info)

Quick reference:
- Primary buttons: `bg-indigo-600 hover:bg-indigo-700 text-white`
- Secondary buttons: `bg-white border-slate-200 text-slate-700 hover:bg-slate-50`
- Cards: `bg-white border border-slate-200 rounded-lg shadow-sm p-6`
- Focus states: `ring-2 ring-indigo-500/20 border-indigo-500`

## Project Documentation Requirements

### Ultrathink Plans

Every `ultrathink` plan must be stored in the `/docs` folder with a descriptive filename.

When asked to create an "ultrathink" plan (a comprehensive, in-depth implementation plan), you must:

1. Create the plan document in `/docs/<feature-name>.md`
2. Include the following sections:
   - Overview/Summary
   - Key Decisions
   - Database Changes (if applicable)
   - Backend Changes (if applicable)
   - Frontend Changes (if applicable)
   - Critical Files Summary
   - Testing Plan
   - Implementation Order

This ensures all major architectural decisions and implementation details are documented and accessible for future reference. After a plan has been implemented, add 'DONE_' to the front of the file name.

### Example

If asked to "ultrathink plan" a feature called "user notifications", create:
- `/docs/user-notifications.md`

## Key Documentation

- `/docs/BRAND_GUIDELINES.md` - Brand identity, color system, typography, and component patterns
- `/docs/liability-protection-system.md` - Domain verification, consent logging, and scan restrictions
