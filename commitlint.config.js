export default {
  extends: ["@commitlint/config-conventional"],
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w*): (.+) \(#(\d+)\)$/,
      headerCorrespondence: ["type", "subject", "ticket"],
    },
  },
  rules: {
    "type-case": [2, "always", "lower-case"],
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "test", "chore", "remove", "hotfix", "deprecated", "design"],
    ],
    "subject-empty": [2, "never"],
    "subject-case": [0],
    "subject-full-stop": [2, "never", "."],
    "body-leading-blank": [1, "always"],
  },
};
