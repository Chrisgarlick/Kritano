# Retention Strategy -- Kritano

---

## Habit Loop Design

**Cue:** Scheduled audit completes, email notification arrives
**Routine:** User checks dashboard, reviews scores, sees what changed
**Reward:** Score improvements feel like progress; new issues feel actionable

### Natural Return Triggers
1. **Scheduled audits** -- automated re-audits create a reason to return weekly/monthly
2. **Score change notifications** -- "Your performance score dropped 8 points since last week"
3. **Issue resolution tracking** -- "You've fixed 12 of 47 issues" creates completion motivation
4. **New feature alerts** -- "We now check for X -- re-run your audit to see results"

---

## Notification Strategy

| Trigger | Channel | Timing | Frequency Cap |
|---------|---------|--------|---------------|
| Audit complete | Email + in-app | Immediate | Per audit |
| Score improvement | Email | Within 1 hour | 1/week per site |
| Score decline | Email + in-app | Within 1 hour | 1/week per site |
| New issues found | In-app | On next login | Per audit |
| Scheduled audit summary | Email | Weekly digest | 1/week |
| Feature announcement | Email | On release | 1/month max |
| Inactivity nudge | Email | After 14 days | See re-engagement sequence |

**Rule:** Never send more than 3 emails per week to any user. Batch notifications into digests where possible.

---

## Re-Engagement Triggers

| Days Inactive | Status | Action |
|---------------|--------|--------|
| 7 | At risk | In-app banner: "Your last audit was 7 days ago. Things change fast -- re-audit?" |
| 14 | Churning | Email: "Your website may have changed since your last audit" |
| 21 | Churning | Email: "New feature: [X] -- your audit results are waiting" |
| 30 | Near-churned | Email: "We miss you" + offer 1 free premium audit |
| 60 | Churned | Final email: "Quick question -- what held you back?" (reply-to, learn why) |

---

## Feature Discovery

Users don't know what they haven't seen. Surface unused features naturally:

1. **Contextual prompts:** After viewing accessibility results: "Did you know you can generate an accessibility statement from these results?"
2. **Dashboard cards:** "You haven't tried: Shareable Reports, Scheduled Audits, Team Collaboration"
3. **Post-audit suggestions:** "Your security score is 45. Here are the 3 headers that would bring it to 80."
4. **Weekly email digest:** Include one "feature spotlight" per email

---

## Retention KPIs

| Metric | Target (Month 3) | Target (Month 6) |
|--------|-------------------|-------------------|
| Day 7 retention | 40% | 50% |
| Day 30 retention | 25% | 35% |
| Weekly active users (% of total) | 30% | 40% |
| Re-audit rate (users who audit 2+ times) | 50% | 65% |
| Feature adoption (3+ features used) | 20% | 35% |
