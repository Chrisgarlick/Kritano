/**
 * EN 301 549 → WCAG 2.1 Level A & AA Mapping
 *
 * Maps Section 9 (Web) requirements of EN 301 549 v3.2.1 to WCAG 2.1 success criteria.
 * The European Accessibility Act (EAA) mandates conformance with EN 301 549,
 * which incorporates WCAG 2.1 Level AA for Web content (Section 9).
 *
 * Kritano tests against WCAG 2.2 AA — the mapping is 1:1 for Section 9 requirements
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
export declare const enMapping: ENClause[];
/**
 * Build a lookup map from WCAG criterion → EN 301 549 clauses.
 * A single WCAG criterion maps to exactly one EN clause in Section 9,
 * but this returns an array for forward-compatibility.
 */
export declare function buildWcagToEnMap(): Map<string, ENClause[]>;
//# sourceMappingURL=en-301-549-mapping.d.ts.map