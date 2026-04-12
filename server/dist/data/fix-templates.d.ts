/**
 * Fix Template Snippets
 *
 * Maps rule_id to actionable code-fix templates for common audit findings.
 * Variables use {{variable}} placeholders. When a variable cannot be resolved
 * from context the fallbackTemplate is used instead.
 */
export interface FixTemplate {
    ruleId: string;
    fixType: 'code' | 'config' | 'content' | 'manual';
    language: 'html' | 'css' | 'javascript' | 'json' | 'config' | 'text';
    template: string;
    variables: string[];
    fallbackTemplate: string;
    explanation: string;
    effort: 'small' | 'medium' | 'large';
    learnMoreUrl: string;
}
export interface ResolvedFixSnippet {
    fixType: FixTemplate['fixType'];
    language: FixTemplate['language'];
    code: string;
    explanation: string;
    effort: FixTemplate['effort'];
    learnMoreUrl: string;
}
export declare const fixTemplates: Record<string, FixTemplate>;
/**
 * Resolve a fix snippet for a given finding rule_id.
 *
 * Returns a ready-to-display snippet with variables replaced, or null if no
 * template exists for the rule.
 */
export declare function resolveFixSnippet(ruleId: string, context: {
    selector?: string;
    snippet?: string;
    pageUrl?: string;
    message?: string;
}): ResolvedFixSnippet | null;
//# sourceMappingURL=fix-templates.d.ts.map