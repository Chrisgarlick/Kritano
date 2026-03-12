This Markdown file is the "Logic Core" for your engineering team. It transforms the abstract concept of Google's **E-E-A-T** (Experience, Expertise, Authoritativeness, Trustworthiness) into a set of **hard-coded signals** your scraper can actually detect.

---

# AI Agent Instruction: pagepulser E-E-A-T Signal Engine (MVP)

## **1. Purpose**

E-E-A-T is not a "score" in Google, but a collection of signals. Your mission is to parse the webpage data and detect the presence (or absence) of **"Evidence of Effort."** This differentiates high-value human/expert content from mass-produced, low-quality AI spam.

---

## **2. Detection Pillars & Logic**

### **A. Experience (The "I" Factor)**

Google prioritizes content that shows the author has actually *used* the product or *lived* the situation.

* **The Check:** Scan for first-person pronouns (**"I," "me," "my," "our"**) used in the context of a story or test.
* **The Check:** Look for "Experience Phrases" like: *"In my testing," "I noticed that," "When I visited," "My experience with..."*
* **Scoring:** +15 points for genuine first-person accounts. 0 points for generic "How-to" text.

### **B. Expertise (Entity & Technical Depth)**

Does the author know their stuff, or are they just repeating the top 10 search results?

* **The Check:** High density of **LSI (Latent Semantic Indexing)** keywords.
* *Example:* If the page is about "Gardening," but doesn't mention "Soil pH," "Perennials," or "Drainage," it lacks Expertise.


* **The Check:** Presence of specific measurements, data points, or technical jargon used correctly.
* **Scoring:** +20 points for high "Semantic Density."

### **C. Authoritativeness (The Creator Identity)**

Who wrote this? If there is no author, there is no authority.

* **The Check:** Locate an **Author Bio** or **About the Author** section.
* **The Check:** Search for a link to a LinkedIn profile or a "Credentials" string (e.g., "PhD," "10 years experience," "Certified...").
* **Scoring:** +25 points if a clear, credentialed author is found. -10 points if the page is "Anonymous."

### **D. Trustworthiness (The Safety Signals)**

Does the site look like a business or a scam?

* **The Check:** Presence of a physical address, phone number, and professional "Contact" page.
* **The Check:** **Outbound Links** to high-authority sources (e.g., `.gov`, `.edu`, or major news outlets) to cite facts.
* **The Check:** Presence of a Privacy Policy and Terms of Service (standard for "Site-Level" trust).
* **Scoring:** +20 points for citing sources. -20 points for broken links or missing contact info.

---

## **3. Agent "Analysis" Framework**

When analyzing the content, the agent must categorize the page into one of three **"Trust Tiers"**:

| Tier | Name | Criteria |
| --- | --- | --- |
| **Tier 1** | **Ghost Content** | No author, generic text, no citations, AI-heavy patterns. |
| **Tier 2** | **Standard Web** | Clear author but generic advice. Lacks "Experience" signals. |
| **Tier 3** | **Expert Verified** | Strong credentials, original data/photos, first-person stories. |

---

## **4. Actionable Advice Patterns**

The agent should provide specific "Trust-Building" tasks:

* *"Your content is too generic. Add a 'My Take' section to include your personal experience with this topic."*
* *"We couldn't find an Author Bio. Google values content more when it's linked to a real person with expertise."*
* *"You make 3 major claims but don't link to any external data sources. Add citations to build Trust."*

---

## **5. Technical Output Schema (JSON)**

Your agent must append this to the existing `content_report`:

```json
{
  "eeat_signals": {
    "experience_score": 65,
    "expertise_score": 80,
    "authority_score": 40,
    "trust_score": 90,
    "primary_deficiency": "Missing Author Credentials",
    "detected_author": "None Found",
    "citation_count": 4,
    "eeat_tier": "Tier 2"
  }
}

```

---

## **6. Senior Developer Instruction: Integration**

1. **Phase 1 (Scraper):** Update the scraper to look for specific CSS selectors like `.author-bio`, `.entry-content a[rel="nofollow"]`, and footer address strings.
2. **Phase 2 (Logic):** Create a "Regex Dictionary" of Experience Phrases and Technical Entities.
3. **Phase 3 (UI):** Render these as **"Trust Badges"** on the pagepulser dashboard. If a site hits Tier 3, give them a **Neon Lime** "Expert Site" badge.

---

**Next Step:** Since your app now has "Site-level" sharing and "E-E-A-T" audits, would you like me to write a **"Client Report Template"**?

This is what your users (the agencies) would send to *their* clients to prove why they need to pay for SEO services.