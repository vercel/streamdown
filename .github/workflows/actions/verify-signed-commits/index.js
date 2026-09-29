import fs from "node:fs/promises";

export const COMMENT_MARKER = "<!-- verify-signed-commits -->";

const API_URL = process.env.GITHUB_API_URL || "https://api.github.com";
const MAX_LISTED_COMMITS = 50;
const SIGNING_DOCS_URL =
  "https://docs.github.com/en/authentication/managing-commit-signature-verification";

// Human-friendly explanations for `commit.verification.reason`
// https://docs.github.com/en/rest/commits/commits#signature-verification-object
const REASON_HINTS = {
  unsigned: "commit is not signed",
  unknown_key: "signing key is not added to the author's GitHub account",
  not_signing_key:
    "key is on GitHub as an authentication key, not as a signing key",
  bad_email: "author email does not match an email on the signing key",
  unverified_email: "author email is not verified on GitHub",
  no_user: "author email is not associated with any GitHub account",
  expired_key: "signing key has expired",
  invalid: "signature is invalid",
  malformed_signature: "signature could not be parsed",
  unknown_signature_type: "unsupported signature type",
  bad_cert: "signing certificate is invalid",
  gpgverify_error: "GitHub could not verify the signature, try again later",
  gpgverify_unavailable:
    "GitHub could not verify the signature, try again later",
  ocsp_pending: "certificate revocation check is pending, try again later",
  ocsp_error: "certificate revocation check failed",
  ocsp_revoked: "signing certificate has been revoked",
};

export function findUnsignedCommits(commits) {
  return commits
    .filter((c) => !c.commit?.verification?.verified)
    .map((c) => {
      const reason = c.commit?.verification?.reason || "unsigned";
      return {
        sha: c.sha,
        subject: (c.commit?.message || "").split("\n")[0],
        author: c.author?.login || c.commit?.author?.name || "unknown",
        reason,
        hint: REASON_HINTS[reason] || reason,
      };
    });
}

// Keep commit subjects from breaking out of the markdown table or pinging users
function escapeCell(text) {
  return text
    .replaceAll("|", "\\|")
    .replaceAll("@", "@\u200b")
    .replaceAll("<", "&lt;");
}

export function buildAgentPrompt({ repository, baseRef }) {
  return `My pull request to ${repository} is blocked because some commits are not signed with a verified signature. Please help me fix it:

1. Check whether commit signing is already configured: \`git config --get gpg.format\`, \`git config --get user.signingkey\`, \`git config --get commit.gpgsign\`, and \`git config --get user.email\`.
2. If signing is not configured, set up SSH commit signing: reuse an existing key in ~/.ssh (for example id_ed25519.pub) or generate one with \`ssh-keygen -t ed25519 -C "<my email>"\`, then run \`git config --global gpg.format ssh\`, \`git config --global user.signingkey <path to the .pub file>\`, and \`git config --global commit.gpgsign true\`.
3. Tell me to add the public key on GitHub at https://github.com/settings/ssh/new with "Key type" set to "Signing Key" (if \`gh\` is installed and authenticated with the admin:ssh_signing_key scope, you may run \`gh ssh-key add <path to .pub> --type signing\` instead). Also confirm that \`git config user.email\` is a verified email on my GitHub account (https://github.com/settings/emails). Wait for me to confirm before continuing.
4. Re-sign every commit on my branch without changing its content: fetch ${baseRef} from https://github.com/${repository}.git, then run \`git rebase --exec 'git commit --amend --no-edit --no-verify -S' $(git merge-base HEAD FETCH_HEAD)\`. Do not rebase onto a newer ${baseRef}, and do not squash, reorder, or edit commits.
5. Verify with \`git log --show-signature FETCH_HEAD..HEAD\` that every commit shows a good signature.
6. Ask me before running \`git push --force-with-lease\` to update the pull request branch.`;
}

export function buildFailureComment({
  unsigned,
  total,
  repository,
  baseRef,
  headSha,
}) {
  const rows = unsigned
    .slice(0, MAX_LISTED_COMMITS)
    .map(
      (c) =>
        `| \`${c.sha.slice(0, 7)}\` | ${escapeCell(c.subject)} | ${escapeCell(c.author)} | ${c.hint} |`
    );
  if (unsigned.length > MAX_LISTED_COMMITS) {
    rows.push(`| … | _and ${unsigned.length - MAX_LISTED_COMMITS} more_ | | |`);
  }

  return `${COMMENT_MARKER}
## ❌ Unsigned commits found

**${unsigned.length} of ${total}** commit(s) in this pull request do not have a verified signature. All commits must be signed before this PR can be merged.

| Commit | Subject | Author | Reason |
| --- | --- | --- | --- |
${rows.join("\n")}

### How to fix

**1. Set up commit signing** (one-time; SSH shown, [GPG and S/MIME also work](${SIGNING_DOCS_URL})):

\`\`\`sh
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
\`\`\`

**2. Add the key to GitHub as a _Signing Key_** at [github.com/settings/ssh/new](https://github.com/settings/ssh/new) (an authentication key alone is not enough), and make sure your \`git config user.email\` is a [verified email](https://github.com/settings/emails) on your account.

**3. Re-sign the commits on this branch and force-push:**

\`\`\`sh
git fetch https://github.com/${repository}.git ${baseRef}
git rebase --exec 'git commit --amend --no-edit --no-verify -S' $(git merge-base HEAD FETCH_HEAD)
git push --force-with-lease
\`\`\`

This check re-runs automatically when you push. See [CONTRIBUTING.md](https://github.com/${repository}/blob/${baseRef}/CONTRIBUTING.md#signing-commits) for more details.

<details>
<summary>🤖 Using an AI coding agent? Paste this prompt</summary>

\`\`\`text
${buildAgentPrompt({ repository, baseRef })}
\`\`\`

</details>

<sub>Checked at ${headSha.slice(0, 7)}.</sub>
`;
}

export function buildSuccessComment({ total, headSha }) {
  return `${COMMENT_MARKER}
## ✅ All commits are signed

All ${total} commit(s) in this pull request have a verified signature. Thanks!

<sub>Checked at ${headSha.slice(0, 7)}.</sub>
`;
}

export function createGitHubClient(token, fetchImpl = fetch) {
  async function request(method, path, body) {
    const response = await fetchImpl(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(
        `GitHub API ${method} ${path} failed: ${response.status} ${await response.text()}`
      );
    }
    return response.json();
  }

  async function paginate(path) {
    const results = [];
    for (let page = 1; ; page++) {
      const separator = path.includes("?") ? "&" : "?";
      const items = await request(
        "GET",
        `${path}${separator}per_page=100&page=${page}`
      );
      results.push(...items);
      if (items.length < 100) {
        return results;
      }
    }
  }

  return { request, paginate };
}

async function upsertComment(github, { repository, prNumber, body, create }) {
  const comments = await github.paginate(
    `/repos/${repository}/issues/${prNumber}/comments`
  );
  const existing = comments.find(
    (c) => c.user?.type === "Bot" && c.body?.includes(COMMENT_MARKER)
  );

  if (existing) {
    await github.request(
      "PATCH",
      `/repos/${repository}/issues/comments/${existing.id}`,
      { body }
    );
    return "updated";
  }
  if (create) {
    await github.request(
      "POST",
      `/repos/${repository}/issues/${prNumber}/comments`,
      { body }
    );
    return "created";
  }
  return "skipped";
}

export async function verifySignedCommits(event, github, repository) {
  const pr = event.pull_request;
  const commits = await github.paginate(
    `/repos/${repository}/pulls/${pr.number}/commits`
  );
  const unsigned = findUnsignedCommits(commits);
  const context = {
    unsigned,
    total: commits.length,
    repository,
    baseRef: pr.base.ref,
    headSha: pr.head.sha,
  };

  if (unsigned.length > 0) {
    await upsertComment(github, {
      repository,
      prNumber: pr.number,
      body: buildFailureComment(context),
      create: true,
    });
    return { ok: false, ...context };
  }

  // Only flip an existing failure comment to green; don't comment on clean PRs.
  await upsertComment(github, {
    repository,
    prNumber: pr.number,
    body: buildSuccessComment(context),
    create: false,
  });
  return { ok: true, ...context };
}

// check if current file is the entry point
if (import.meta.url.endsWith(process.argv[1])) {
  const event = JSON.parse(
    await fs.readFile(process.env.GITHUB_EVENT_PATH, "utf-8")
  );
  const github = createGitHubClient(process.env.GITHUB_TOKEN);
  const result = await verifySignedCommits(
    event,
    github,
    process.env.GITHUB_REPOSITORY
  );

  if (result.ok) {
    await fs.writeFile(
      process.env.GITHUB_STEP_SUMMARY,
      `## Signed commits verification passed ✅\n\nAll ${result.total} commit(s) are signed.\n`
    );
  } else {
    await fs.writeFile(
      process.env.GITHUB_STEP_SUMMARY,
      buildFailureComment(result)
    );
    for (const c of result.unsigned) {
      console.error(
        `::error title=Unsigned commit::${c.sha.slice(0, 7)} ${c.subject} (${c.hint})`
      );
    }
    process.exit(1);
  }
}
