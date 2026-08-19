/**
 * Conventional Commits. Le hook .githooks/commit-msg couvre en plus l'interdiction
 * des mentions d'outils d'IA et des emoji, que commitlint ne sait pas exprimer.
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'perf', 'docs', 'chore', 'build', 'test', 'style', 'revert'],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'auth',
        'articles',
        'categories',
        'clients',
        'fournisseurs',
        'commandes-client',
        'commandes-fournisseur',
        'mouvements-stock',
        'ventes',
        'entreprise',
        'utilisateurs',
        'dashboard',
        'parametres',
        'ui',
        'theme',
        'layout',
        'core',
        'http',
        'docs',
        'repo',
        'scripts',
        'lint',
        'hooks',
        'ci',
      ],
    ],
    'scope-empty': [2, 'never'],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
  },
};
