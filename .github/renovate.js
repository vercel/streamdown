// Self-hosted Renovate config for keeping @vercel/geistdocs current.
// Policy mirrors vercel/geistdocs//renovate/consumer (the canonical source);
// it's inlined here because geistdocs is private and this repo's scoped CI
// token can't read a cross-repo preset. Keep in sync with that preset.
module.exports = {
  onboarding: false,
  requireConfig: "optional",
  repositories: ["vercel/streamdown"],
  enabledManagers: ["npm"],
  dependencyDashboard: true,

  packageRules: [
    // Manage only @vercel/geistdocs; leave every other dependency alone.
    {
      matchPackageNames: ["!@vercel/geistdocs"],
      enabled: false,
    },
    {
      matchPackageNames: ["@vercel/geistdocs"],
      groupName: "geistdocs",
      // Batch overnight to avoid mid-day churn.
      schedule: ["after 1am and before 6am"],
    },
    // Auto-merge patch once required CI is green (nothing merges on red);
    // minor and major open a review PR.
    {
      matchPackageNames: ["@vercel/geistdocs"],
      matchUpdateTypes: ["patch"],
      automerge: true,
      automergeType: "pr",
      platformAutomerge: true,
    },
  ],

  hostRules: [
    {
      hostType: "npm",
      matchHost: "registry.npmjs.org",
      token: process.env.RENOVATE_NPM_TOKEN,
    },
  ],
};
