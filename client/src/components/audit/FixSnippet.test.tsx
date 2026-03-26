import { describe, it, expect } from 'vitest';
import { highlightCode } from './FixSnippet';

describe('highlightCode', () => {
  it('wraps HTML tag names in indigo-colored spans', () => {
    const result = highlightCode('<div class="test">', 'html');
    // Tag name should be wrapped in indigo
    expect(result).toContain('<span style="color:#818cf8">div</span>');
    // class attribute should be wrapped in indigo
    expect(result).toContain('<span style="color:#818cf8">class</span>=');
  });

  it('highlights JavaScript const keyword in indigo', () => {
    const result = highlightCode('const x = 42', 'javascript');
    expect(result).toContain('<span style="color:#818cf8">const</span>');
  });

  it('highlights JavaScript strings in emerald', () => {
    const result = highlightCode('const x = "hello"', 'javascript');
    // The string regex wraps "hello" (with literal quotes, since input has no angle brackets to escape)
    expect(result).toContain('<span style="color:#34d399">"hello"</span>');
  });

  it('highlights JavaScript single-line comments in slate', () => {
    // Use a comment without quotes to avoid interference from string regex
    const result = highlightCode('// a comment here', 'javascript');
    expect(result).toContain('color:#64748b');
    expect(result).toContain('// a comment here');
  });

  it('highlights HTML comments in slate', () => {
    // The comment regex matches after HTML escaping: &lt;!-- ... --&gt;
    const result = highlightCode('<!-- comment -->', 'html');
    expect(result).toContain('color:#64748b');
    expect(result).toContain('&lt;!-- comment --&gt;');
  });

  it('highlights CSS properties in indigo', () => {
    const result = highlightCode('color: red;', 'css');
    expect(result).toContain('<span style="color:#818cf8">color</span>');
  });

  it('returns plain escaped text for unknown/text language', () => {
    const result = highlightCode('plain text', 'text');
    expect(result).not.toContain('<span');
    expect(result).toBe('plain text');
  });

  it('escapes HTML entities to prevent XSS', () => {
    const result = highlightCode('<script>alert("xss")</script>', 'html');
    // Raw < and > must be escaped
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('</script>');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
  });
});
