/**
 * code-theme.mjs — the Shiki theme, expressed entirely in CSS custom properties.
 *
 * Shiki writes a theme's colour values straight into inline `style` attributes,
 * and it does not require them to be hex. So every value here is a `var()`
 * reference and the actual palette stays where it belongs: section 4 of
 * src/styles/theme.css. Highlighted code contains no colour value at all —
 * retune `--code-*` there and every code block on the site follows.
 *
 * The palette is deliberately cool and near-monochrome. Code blocks must not
 * compete with the section hues, which are the only meaningful colour on a page.
 *
 * `.mjs` rather than `.ts` because astro.config.mjs imports it at config-load
 * time, before any TypeScript pipeline exists. It is build configuration, not
 * application code.
 *
 * Scopes cover Kusto plus the languages likely to appear in write-ups (shell,
 * JSON, YAML, PowerShell). An unmatched scope simply falls through to the
 * default foreground, which is the desired behaviour rather than a gap.
 */

const fg = (foreground) => ({ foreground });

/** @type {import('shiki').ThemeRegistration} */
const codeTheme = {
  name: 'leftanti',
  type: 'dark',

  colors: {
    'editor.background': 'var(--code-bg)',
    'editor.foreground': 'var(--code-text)',
  },

  settings: [
    // Default foreground for anything not matched below.
    { settings: fg('var(--code-text)') },

    {
      scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
      settings: fg('var(--code-comment)'),
    },
    {
      scope: [
        'keyword',
        'keyword.control',
        'keyword.other',
        'storage',
        'storage.type',
        'storage.modifier',
        'entity.name.tag',
      ],
      settings: fg('var(--code-keyword)'),
    },
    {
      scope: ['string', 'string.quoted', 'punctuation.definition.string', 'meta.embedded.assembly'],
      settings: fg('var(--code-string)'),
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character', 'constant.other'],
      settings: fg('var(--code-number)'),
    },
    {
      scope: [
        'entity.name.function',
        'support.function',
        'meta.function-call',
        'entity.name.type',
        'support.type',
        'support.class',
      ],
      settings: fg('var(--code-function)'),
    },
    {
      scope: ['keyword.operator', 'punctuation.separator.operator'],
      settings: fg('var(--code-operator)'),
    },
    {
      scope: [
        'punctuation',
        'meta.brace',
        'punctuation.separator',
        'punctuation.terminator',
        'punctuation.definition.parameters',
      ],
      settings: fg('var(--code-punctuation)'),
    },
    {
      scope: ['variable', 'variable.other', 'variable.parameter', 'meta.object-literal.key'],
      settings: fg('var(--code-text)'),
    },
    {
      scope: ['invalid', 'invalid.illegal'],
      settings: fg('var(--code-text)'),
    },
  ],
};

export default codeTheme;
