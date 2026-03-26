---
title: "Integrating Accessibility Testing into Your CI/CD Pipeline with PagePulser"
slug: "accessibility-testing-cicd-pipeline-pagepulser"
date: "2026-03-18"
author: "Chris Garlick"
description: "Catch accessibility regressions before they reach production. Here's how to integrate PagePulser's API into GitHub Actions and GitLab CI with real examples."
keyword: "accessibility testing CI/CD"
category: "accessibility"
tags:
  - "accessibility"
  - "wcag"
  - "website-audit"
post_type: "how-to"
reading_time: "8 min read"
featured: false
---

# Integrating Accessibility Testing into Your CI/CD Pipeline with PagePulser

Have you ever shipped a feature, felt good about it, and then discovered a week later that it broke accessibility for an entire section of your site? A missing form label here, a contrast failure there, a heading hierarchy that got mangled during a refactor — small things that slip through code review because nobody's checking for them systematically.

I've been there. And the fix isn't "be more careful" — it's automation. If your CI/CD pipeline runs linting, unit tests, and maybe even visual regression tests, there's no reason it shouldn't also catch accessibility regressions before they reach production.

PagePulser's API makes this straightforward. You can trigger an audit, wait for results, and fail the build if the accessibility score drops below a threshold you define — all within a standard GitHub Actions or GitLab CI workflow. Let me walk you through exactly how to set it up.

## Why Automated Accessibility Testing Matters

Manual accessibility audits are essential, but they're a point-in-time check. You run one, fix the issues, and everything's great — until the next sprint introduces new ones. Without automated testing in your pipeline, accessibility is something you check periodically rather than enforce continuously.

Here's what changes when you add it to CI/CD:

- **Regressions get caught immediately.** A developer adds a form without labels? The build fails before it's merged. No more discovering issues in production a month later
- **Accessibility becomes part of the development workflow**, not a separate audit that happens quarterly. It shifts from "something we do before launch" to "something we do on every pull request"
- **The [accessibility score](/blog/understanding-website-accessibility-scores) becomes a trackable metric.** You can set a baseline, monitor trends, and hold the team accountable to a standard — just like you would with test coverage or performance budgets
- **It scales.** Manual testing doesn't scale across a team of ten developers pushing multiple PRs a day. Automated testing does

However, there are a few things to think about. Automated testing catches roughly 30-40% of accessibility issues — the structural, detectable ones like missing [alt text, contrast failures, broken labels](/blog/improve-accessibility-score-20-points), and heading hierarchy problems. It won't catch usability issues that require human judgement, like whether alt text is actually useful or whether a custom component makes sense to a screen reader user. Automated testing is a safety net, not a replacement for [manual testing](/blog/ecommerce-accessibility-guide-online-retailers).

## Step 1: Get Your API Key

Head to your PagePulser dashboard and navigate to **Settings > API Keys**. Create a new key with the `audits:write` and `audits:read` scopes.

Your key will look something like `pp_live_xxxxxxxxxxxxxxxx`. Store it as a secret in your CI/CD platform — never commit it to your repository.

**In GitHub:** Go to your repository Settings > Secrets and variables > Actions, and add a new secret called `PAGEPULSER_API_KEY`.

**In GitLab:** Go to Settings > CI/CD > Variables and add `PAGEPULSER_API_KEY` as a masked variable.

## Step 2: Understand the API Flow

The PagePulser API uses an asynchronous audit model:

1. **Create an audit** — `POST /api/v1/audits` with the target URL and options
2. **Poll for completion** — `GET /api/v1/audits/:id` until the status is `completed`
3. **Check the results** — Read the scores and findings from the completed audit

The API authenticates via the `X-API-Key` header or `Authorization: Bearer pp_live_xxx`.

## Step 3: GitHub Actions Example

Here's a complete workflow that runs a PagePulser accessibility audit on every pull request and fails the build if the score drops below your threshold:

```yaml
name: Accessibility Audit

on:
  pull_request:
    branches: [main]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger PagePulser Audit
        id: trigger
        run: |
          RESPONSE=$(curl -s -X POST \
            https://pagepulser.com/api/v1/audits \
            -H "X-API-Key: ${{ secrets.PAGEPULSER_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "url": "https://your-staging-url.com",
              "options": {
                "checks": ["accessibility"],
                "maxPages": 5,
                "maxDepth": 2
              }
            }')
          AUDIT_ID=$(echo $RESPONSE | jq -r '.id')
          echo "audit_id=$AUDIT_ID" >> $GITHUB_OUTPUT

      - name: Wait for Audit Completion
        id: results
        run: |
          AUDIT_ID=${{ steps.trigger.outputs.audit_id }}
          for i in $(seq 1 30); do
            RESULT=$(curl -s \
              https://pagepulser.com/api/v1/audits/$AUDIT_ID \
              -H "X-API-Key: ${{ secrets.PAGEPULSER_API_KEY }}")
            STATUS=$(echo $RESULT | jq -r '.status')
            if [ "$STATUS" = "completed" ]; then
              A11Y_SCORE=$(echo $RESULT | jq -r '.scores.accessibility')
              echo "score=$A11Y_SCORE" >> $GITHUB_OUTPUT
              echo "Accessibility score: $A11Y_SCORE"
              break
            elif [ "$STATUS" = "failed" ]; then
              echo "Audit failed"
              exit 1
            fi
            echo "Audit status: $STATUS — waiting 20s..."
            sleep 20
          done

      - name: Check Accessibility Threshold
        run: |
          SCORE=${{ steps.results.outputs.score }}
          THRESHOLD=70
          echo "Accessibility score: $SCORE (threshold: $THRESHOLD)"
          if [ "$SCORE" -lt "$THRESHOLD" ]; then
            echo "::error::Accessibility score $SCORE is below threshold of $THRESHOLD"
            exit 1
          fi
          echo "Accessibility check passed"
```

**What this does:** On every PR to main, it triggers a PagePulser audit against your staging URL, waits for it to complete (checking every 20 seconds for up to 10 minutes), and fails the build if the accessibility score is below 70.

**Important note:** You'll want to point this at a staging or preview deployment, not production. If you're using Vercel, Netlify, or similar platforms that generate preview URLs for PRs, you can dynamically pass that URL into the audit. Here's how you'd reference a Vercel preview URL:

```yaml
-d "{\"url\": \"${{ github.event.deployment.payload.web_url }}\"}"
```

## Step 4: GitLab CI Example

The same approach works in GitLab CI:

```yaml
accessibility_audit:
  stage: test
  image: alpine/curl
  variables:
    A11Y_THRESHOLD: "70"
  script:
    - apk add --no-cache jq
    - |
      RESPONSE=$(curl -s -X POST \
        https://pagepulser.com/api/v1/audits \
        -H "X-API-Key: ${PAGEPULSER_API_KEY}" \
        -H "Content-Type: application/json" \
        -d "{
          \"url\": \"${CI_ENVIRONMENT_URL}\",
          \"options\": {
            \"checks\": [\"accessibility\"],
            \"maxPages\": 5,
            \"maxDepth\": 2
          }
        }")
      AUDIT_ID=$(echo $RESPONSE | jq -r '.id')
    - |
      for i in $(seq 1 30); do
        RESULT=$(curl -s \
          https://pagepulser.com/api/v1/audits/$AUDIT_ID \
          -H "X-API-Key: ${PAGEPULSER_API_KEY}")
        STATUS=$(echo $RESULT | jq -r '.status')
        if [ "$STATUS" = "completed" ]; then
          SCORE=$(echo $RESULT | jq -r '.scores.accessibility')
          echo "Accessibility score: $SCORE"
          if [ "$SCORE" -lt "$A11Y_THRESHOLD" ]; then
            echo "FAILED: Score $SCORE is below threshold $A11Y_THRESHOLD"
            exit 1
          fi
          echo "PASSED"
          exit 0
        elif [ "$STATUS" = "failed" ]; then
          echo "Audit failed"
          exit 1
        fi
        echo "Waiting... ($STATUS)"
        sleep 20
      done
      echo "Audit timed out"
      exit 1
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
```

**`CI_ENVIRONMENT_URL`** is GitLab's variable for the deployment URL — set this up in your environment configuration or replace it with your staging URL.

## Step 5: Setting Meaningful Thresholds

This is the part most people get wrong. They either set the threshold too high and every build fails (which leads to the team disabling the check), or they set it too low and it never catches anything useful.

Here's how I'd approach it:

### Start With Your Current Score

Run an audit on your current production site. Whatever the score is — that's your baseline. Don't set a threshold above your current score on day one, or every single build will fail until someone goes back and fixes legacy issues.

### Ratchet Up Gradually

Set your initial threshold **5 points below your current score** as a safety net against regressions. Then, every time you fix a batch of issues and your score improves, raise the threshold to match. This "ratchet" approach means the score can only go up over time.

For example:
- Current score: 64. Set threshold to 59
- Fix alt text issues, score rises to 72. Raise threshold to 67
- Fix contrast issues, score rises to 78. Raise threshold to 73

### Suggested Targets by Maturity

| Stage | Threshold | Rationale |
|-------|-----------|-----------|
| Just starting out | 50 | Catch catastrophic regressions only |
| Active improvement | 65 | Prevents backsliding while you improve |
| Established standard | 75 | Solid baseline that catches most serious issues |
| High compliance need | 85 | Appropriate for sites with legal requirements |

### Consider Separate Thresholds

If you're auditing multiple pages, consider setting different thresholds for different sections. Your marketing pages might score 80 while your app dashboard scores 65 — and that might be fine as long as both are improving.

## Going Further: Multi-Check Audits

The examples above only check accessibility, but you can audit multiple dimensions in the same pipeline run:

```json
{
  "url": "https://your-staging-url.com",
  "options": {
    "checks": ["accessibility", "seo", "security", "performance"],
    "maxPages": 10
  }
}
```

Then check each score independently:

```bash
A11Y=$(echo $RESULT | jq -r '.scores.accessibility')
SEO=$(echo $RESULT | jq -r '.scores.seo')
SECURITY=$(echo $RESULT | jq -r '.scores.security')
PERF=$(echo $RESULT | jq -r '.scores.performance')
```

You could enforce a hard fail on accessibility and security (non-negotiable) while treating SEO and performance as warnings that post a comment on the PR without blocking the merge.

## Common Pitfalls

**Don't audit localhost.** The PagePulser API needs a publicly accessible URL. Point it at your staging deployment, not your local dev server.

**Don't set and forget the threshold.** If your score improves and you never raise the threshold, the check becomes useless — it'll only catch catastrophic regressions, not the gradual drift that actually happens in practice.

**Don't ignore flaky results.** If the same page scores 72 one run and 68 the next, the variation might be normal (especially for performance). For accessibility, scores should be more stable — if they're fluctuating, investigate whether dynamic content is affecting the results.

**Don't skip manual testing.** I'll say it again: automated testing catches the structural issues. It won't tell you that your modal is confusing, your tab order is illogical, or your error messages are unhelpful. Run manual accessibility testing at least quarterly alongside your automated checks.

## Wrapping Up

Adding accessibility testing to your CI/CD pipeline is one of the highest-leverage things you can do for long-term accessibility. It turns a periodic audit into a continuous standard, catches regressions before users do, and makes accessibility a first-class concern in your development workflow.

In my honest opinion, every team that claims to care about accessibility should have automated testing in their pipeline. It's not difficult to set up — you've seen the code above, it's a few dozen lines — and it prevents the slow regression that turns a well-audited site back into an inaccessible one within a few months.

If you haven't got a PagePulser API key yet, head to pagepulser.com and set one up. The API is available on all paid tiers, and you can be running accessibility checks in your pipeline by the end of today.

<!-- Internal linking suggestions:
- Link "accessibility score" to the understanding accessibility scores post
- Link "alt text, contrast, labels" to the improve score by 20 points post
- Link "WCAG" to the web accessibility 2026 post
- Link "manual accessibility testing" to the e-commerce accessibility guide
- Link "PagePulser API" to the API docs page
-->
