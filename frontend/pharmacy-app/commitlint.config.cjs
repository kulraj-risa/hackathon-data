// commitlint.config.cjs
module.exports = {
  parserPreset: {
    parserOpts: {
      headerPattern: /^((?:[\p{Emoji}\u{FE0E}\u{FE0F}]+\s)?(\w+))(\(.+\))?: (.+)$/u,
      headerCorrespondence: ['type', 'baseType', 'scope', 'subject']
    }
  },
  rules: {
    'header-max-length': [2, 'always', 120],
    'type-enum': [2, 'always', [
      '✨ feat', '🐛 fix', '📝 docs', '💄 style', '♻️ refactor', 
      '✅ test', '🚀 ci', '🔧 chore', '🚧 wip', '🦾 enhance',
      'feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'ci',
      '🪣 git'
    ]],
    'subject-empty': [2, 'never']
  }
};
