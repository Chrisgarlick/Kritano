/**
 * EN 301 549 → WCAG 2.1 Level A & AA Mapping
 *
 * Maps Section 9 (Web) requirements of EN 301 549 v3.2.1 to WCAG 2.1 success criteria.
 * The European Accessibility Act (EAA) mandates conformance with EN 301 549,
 * which incorporates WCAG 2.1 Level AA for Web content (Section 9).
 *
 * PagePulser tests against WCAG 2.2 AA — the mapping is 1:1 for Section 9 requirements
 * since WCAG 2.2 is a superset of 2.1.
 */

export interface ENClause {
  /** EN 301 549 clause number, e.g. "9.1.1.1" */
  clause: string;
  /** Human-readable clause title */
  title: string;
  /** Section of EN 301 549 — always "Web" for Section 9 */
  section: string;
  /** Corresponding WCAG success criterion, e.g. "1.1.1" */
  wcagCriteria: string;
  /** WCAG conformance level */
  level: 'A' | 'AA' | 'AAA';
  /** True if automated testing cannot fully verify this criterion */
  manualOnly: boolean;
}

export const enMapping: ENClause[] = [
  // ─── 1.1 Text Alternatives ───────────────────────────────────────────
  {
    clause: '9.1.1.1',
    title: 'Non-text Content',
    section: 'Web',
    wcagCriteria: '1.1.1',
    level: 'A',
    manualOnly: false,
  },

  // ─── 1.2 Time-based Media ───────────────────────────────────────────
  {
    clause: '9.1.2.1',
    title: 'Audio-only and Video-only (Pre-recorded)',
    section: 'Web',
    wcagCriteria: '1.2.1',
    level: 'A',
    manualOnly: true,
  },
  {
    clause: '9.1.2.2',
    title: 'Captions (Pre-recorded)',
    section: 'Web',
    wcagCriteria: '1.2.2',
    level: 'A',
    manualOnly: true,
  },
  {
    clause: '9.1.2.3',
    title: 'Audio Description or Media Alternative (Pre-recorded)',
    section: 'Web',
    wcagCriteria: '1.2.3',
    level: 'A',
    manualOnly: true,
  },
  {
    clause: '9.1.2.4',
    title: 'Captions (Live)',
    section: 'Web',
    wcagCriteria: '1.2.4',
    level: 'AA',
    manualOnly: true,
  },
  {
    clause: '9.1.2.5',
    title: 'Audio Description (Pre-recorded)',
    section: 'Web',
    wcagCriteria: '1.2.5',
    level: 'AA',
    manualOnly: true,
  },

  // ─── 1.3 Adaptable ─────────────────────────────────────────────────
  {
    clause: '9.1.3.1',
    title: 'Info and Relationships',
    section: 'Web',
    wcagCriteria: '1.3.1',
    level: 'A',
    manualOnly: false,
  },
  {
    clause: '9.1.3.2',
    title: 'Meaningful Sequence',
    section: 'Web',
    wcagCriteria: '1.3.2',
    level: 'A',
    manualOnly: true,
  },
  {
    clause: '9.1.3.3',
    title: 'Sensory Characteristics',
    section: 'Web',
    wcagCriteria: '1.3.3',
    level: 'A',
    manualOnly: true,
  },
  {
    clause: '9.1.3.4',
    title: 'Orientation',
    section: 'Web',
    wcagCriteria: '1.3.4',
    level: 'AA',
    manualOnly: true,
  },
  {
    clause: '9.1.3.5',
    title: 'Identify Input Purpose',
    section: 'Web',
    wcagCriteria: '1.3.5',
    level: 'AA',
    manualOnly: false,
  },

  // ─── 1.4 Distinguishable ───────────────────────────────────────────
  {
    clause: '9.1.4.1',
    title: 'Use of Colour',
    section: 'Web',
    wcagCriteria: '1.4.1',
    level: 'A',
    manualOnly: true,
  },
  {
    clause: '9.1.4.2',
    title: 'Audio Control',
    section: 'Web',
    wcagCriteria: '1.4.2',
    level: 'A',
    manualOnly: true,
  },
  {
    clause: '9.1.4.3',
    title: 'Contrast (Minimum)',
    section: 'Web',
    wcagCriteria: '1.4.3',
    level: 'AA',
    manualOnly: false,
  },
  {
    clause: '9.1.4.4',
    title: 'Resize Text',
    section: 'Web',
    wcagCriteria: '1.4.4',
    level: 'AA',
    manualOnly: true,
  },
  {
    clause: '9.1.4.5',
    title: 'Images of Text',
    section: 'Web',
    wcagCriteria: '1.4.5',
    level: 'AA',
    manualOnly: true,
  },
  {
    clause: '9.1.4.10',
    title: 'Reflow',
    section: 'Web',
    wcagCriteria: '1.4.10',
    level: 'AA',
    manualOnly: true,
  },
  {
    clause: '9.1.4.11',
    title: 'Non-text Contrast',
    section: 'Web',
    wcagCriteria: '1.4.11',
    level: 'AA',
    manualOnly: false,
  },
  {
    clause: '9.1.4.12',
    title: 'Text Spacing',
    section: 'Web',
    wcagCriteria: '1.4.12',
    level: 'AA',
    manualOnly: true,
  },
  {
    clause: '9.1.4.13',
    title: 'Content on Hover or Focus',
    section: 'Web',
    wcagCriteria: '1.4.13',
    level: 'AA',
    manualOnly: true,
  },

  // ─── 2.1 Keyboard Accessible ───────────────────────────────────────
  {
    clause: '9.2.1.1',
    title: 'Keyboard',
    section: 'Web',
    wcagCriteria: '2.1.1',
    level: 'A',
    manualOnly: false,
  },
  {
    clause: '9.2.1.2',
    title: 'No Keyboard Trap',
    section: 'Web',
    wcagCriteria: '2.1.2',
    level: 'A',
    manualOnly: true,
  },
  {
    clause: '9.2.1.4',
    title: 'Character Key Shortcuts',
    section: 'Web',
    wcagCriteria: '2.1.4',
    level: 'A',
    manualOnly: true,
  },

  // ─── 2.2 Enough Time ──────────────────────────────────────────────
  {
    clause: '9.2.2.1',
    title: 'Timing Adjustable',
    section: 'Web',
    wcagCriteria: '2.2.1',
    level: 'A',
    manualOnly: true,
  },
  {
    clause: '9.2.2.2',
    title: 'Pause, Stop, Hide',
    section: 'Web',
    wcagCriteria: '2.2.2',
    level: 'A',
    manualOnly: true,
  },

  // ─── 2.3 Seizures and Physical Reactions ───────────────────────────
  {
    clause: '9.2.3.1',
    title: 'Three Flashes or Below Threshold',
    section: 'Web',
    wcagCriteria: '2.3.1',
    level: 'A',
    manualOnly: true,
  },

  // ─── 2.4 Navigable ────────────────────────────────────────────────
  {
    clause: '9.2.4.1',
    title: 'Bypass Blocks',
    section: 'Web',
    wcagCriteria: '2.4.1',
    level: 'A',
    manualOnly: false,
  },
  {
    clause: '9.2.4.2',
    title: 'Page Titled',
    section: 'Web',
    wcagCriteria: '2.4.2',
    level: 'A',
    manualOnly: false,
  },
  {
    clause: '9.2.4.3',
    title: 'Focus Order',
    section: 'Web',
    wcagCriteria: '2.4.3',
    level: 'A',
    manualOnly: true,
  },
  {
    clause: '9.2.4.4',
    title: 'Link Purpose (In Context)',
    section: 'Web',
    wcagCriteria: '2.4.4',
    level: 'A',
    manualOnly: false,
  },
  {
    clause: '9.2.4.5',
    title: 'Multiple Ways',
    section: 'Web',
    wcagCriteria: '2.4.5',
    level: 'AA',
    manualOnly: true,
  },
  {
    clause: '9.2.4.6',
    title: 'Headings and Labels',
    section: 'Web',
    wcagCriteria: '2.4.6',
    level: 'AA',
    manualOnly: false,
  },
  {
    clause: '9.2.4.7',
    title: 'Focus Visible',
    section: 'Web',
    wcagCriteria: '2.4.7',
    level: 'AA',
    manualOnly: false,
  },

  // ─── 2.5 Input Modalities ─────────────────────────────────────────
  {
    clause: '9.2.5.1',
    title: 'Pointer Gestures',
    section: 'Web',
    wcagCriteria: '2.5.1',
    level: 'A',
    manualOnly: true,
  },
  {
    clause: '9.2.5.2',
    title: 'Pointer Cancellation',
    section: 'Web',
    wcagCriteria: '2.5.2',
    level: 'A',
    manualOnly: true,
  },
  {
    clause: '9.2.5.3',
    title: 'Label in Name',
    section: 'Web',
    wcagCriteria: '2.5.3',
    level: 'A',
    manualOnly: false,
  },
  {
    clause: '9.2.5.4',
    title: 'Motion Actuation',
    section: 'Web',
    wcagCriteria: '2.5.4',
    level: 'A',
    manualOnly: true,
  },

  // ─── 3.1 Readable ─────────────────────────────────────────────────
  {
    clause: '9.3.1.1',
    title: 'Language of Page',
    section: 'Web',
    wcagCriteria: '3.1.1',
    level: 'A',
    manualOnly: false,
  },
  {
    clause: '9.3.1.2',
    title: 'Language of Parts',
    section: 'Web',
    wcagCriteria: '3.1.2',
    level: 'AA',
    manualOnly: true,
  },

  // ─── 3.2 Predictable ──────────────────────────────────────────────
  {
    clause: '9.3.2.1',
    title: 'On Focus',
    section: 'Web',
    wcagCriteria: '3.2.1',
    level: 'A',
    manualOnly: true,
  },
  {
    clause: '9.3.2.2',
    title: 'On Input',
    section: 'Web',
    wcagCriteria: '3.2.2',
    level: 'A',
    manualOnly: true,
  },
  {
    clause: '9.3.2.3',
    title: 'Consistent Navigation',
    section: 'Web',
    wcagCriteria: '3.2.3',
    level: 'AA',
    manualOnly: true,
  },
  {
    clause: '9.3.2.4',
    title: 'Consistent Identification',
    section: 'Web',
    wcagCriteria: '3.2.4',
    level: 'AA',
    manualOnly: true,
  },

  // ─── 3.3 Input Assistance ─────────────────────────────────────────
  {
    clause: '9.3.3.1',
    title: 'Error Identification',
    section: 'Web',
    wcagCriteria: '3.3.1',
    level: 'A',
    manualOnly: false,
  },
  {
    clause: '9.3.3.2',
    title: 'Labels or Instructions',
    section: 'Web',
    wcagCriteria: '3.3.2',
    level: 'A',
    manualOnly: false,
  },
  {
    clause: '9.3.3.3',
    title: 'Error Suggestion',
    section: 'Web',
    wcagCriteria: '3.3.3',
    level: 'AA',
    manualOnly: true,
  },
  {
    clause: '9.3.3.4',
    title: 'Error Prevention (Legal, Financial, Data)',
    section: 'Web',
    wcagCriteria: '3.3.4',
    level: 'AA',
    manualOnly: true,
  },

  // ─── 4.1 Compatible ───────────────────────────────────────────────
  {
    clause: '9.4.1.1',
    title: 'Parsing',
    section: 'Web',
    wcagCriteria: '4.1.1',
    level: 'A',
    manualOnly: false,
  },
  {
    clause: '9.4.1.2',
    title: 'Name, Role, Value',
    section: 'Web',
    wcagCriteria: '4.1.2',
    level: 'A',
    manualOnly: false,
  },
  {
    clause: '9.4.1.3',
    title: 'Status Messages',
    section: 'Web',
    wcagCriteria: '4.1.3',
    level: 'AA',
    manualOnly: true,
  },
];

/**
 * Build a lookup map from WCAG criterion → EN 301 549 clauses.
 * A single WCAG criterion maps to exactly one EN clause in Section 9,
 * but this returns an array for forward-compatibility.
 */
export function buildWcagToEnMap(): Map<string, ENClause[]> {
  const map = new Map<string, ENClause[]>();
  for (const clause of enMapping) {
    const existing = map.get(clause.wcagCriteria) || [];
    existing.push(clause);
    map.set(clause.wcagCriteria, existing);
  }
  return map;
}
