import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const mainTs = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
const publicUiSource = `${indexHtml}\n${mainTs}`;

describe('public demonstration safety regressions', () => {
  it('does not reintroduce retired credentials or realistic synthetic identifiers', () => {
    expect(publicUiSource).not.toContain('lex2026');
    expect(publicUiSource).not.toContain('LexPetition2026!');
    expect(publicUiSource).not.toContain('auth-password');
    expect(publicUiSource).not.toContain('lexpetition_authenticated');
    expect(publicUiSource).not.toContain('4T1B11HK8JU123456');
    expect(publicUiSource).not.toMatch(/999-\d{2}-\d{4}/);
  });

  it('keeps the synthetic-only privacy boundary explicit', () => {
    expect(indexHtml).toContain('Use synthetic information only');
    expect(indexHtml).toContain('not approved for real client documents');
    expect(indexHtml).not.toContain('Upload real financial documents');
    expect(indexHtml).not.toContain('under penalty of perjury');
    expect(indexHtml).toContain('noindex,nofollow,noarchive');
  });
});
