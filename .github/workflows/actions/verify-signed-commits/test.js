import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildAgentPrompt,
  buildFailureComment,
  COMMENT_MARKER,
  findUnsignedCommits,
  verifySignedCommits,
} from "./index.js";

const REPO = "vercel/streamdown";

function makeCommit(sha, { verified, reason, message = "feat: thing" }) {
  return {
    sha,
    author: { login: "octocat" },
    commit: {
      message,
      author: { name: "Octo Cat" },
      verification: { verified, reason },
    },
  };
}

function makeEvent() {
  return {
    pull_request: {
      number: 42,
      base: { ref: "main" },
      head: { sha: "abcdef1234567890" },
    },
  };
}

function makeGitHub({ commits, comments = [] }) {
  const calls = [];
  return {
    calls,
    paginate(path) {
      calls.push(["GET", path]);
      if (path.endsWith("/commits")) {
        return Promise.resolve(commits);
      }
      return Promise.resolve(comments);
    },
    request(method, path, body) {
      calls.push([method, path, body]);
      return Promise.resolve({});
    },
  };
}

const signed = makeCommit("1111111aaaa", { verified: true, reason: "valid" });
const unsigned = makeCommit("2222222bbbb", {
  verified: false,
  reason: "unsigned",
  message: "fix: oops\n\nbody text",
});
const unknownKey = makeCommit("3333333cccc", {
  verified: false,
  reason: "unknown_key",
});

test("findUnsignedCommits returns only unverified commits", () => {
  const result = findUnsignedCommits([signed, unsigned, unknownKey]);
  assert.deepStrictEqual(
    result.map((c) => [c.sha, c.subject, c.reason]),
    [
      ["2222222bbbb", "fix: oops", "unsigned"],
      ["3333333cccc", "feat: thing", "unknown_key"],
    ]
  );
  assert.ok(result[1].hint.includes("not added"));
});

test("findUnsignedCommits treats missing verification as unsigned", () => {
  const result = findUnsignedCommits([{ sha: "444", commit: {} }]);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].reason, "unsigned");
});

test("failure comment lists commits, fix steps and agent prompt", () => {
  const body = buildFailureComment({
    unsigned: findUnsignedCommits([unsigned]),
    total: 2,
    repository: REPO,
    baseRef: "main",
    headSha: "abcdef1234567890",
  });
  assert.ok(body.startsWith(COMMENT_MARKER));
  assert.ok(body.includes("**1 of 2**"));
  assert.ok(body.includes("`2222222` | fix: oops"));
  assert.ok(body.includes("git config --global commit.gpgsign true"));
  assert.ok(body.includes("git push --force-with-lease"));
  assert.ok(
    body.includes(buildAgentPrompt({ repository: REPO, baseRef: "main" }))
  );
});

test("failure comment escapes table-breaking characters and mentions", () => {
  const body = buildFailureComment({
    unsigned: findUnsignedCommits([
      makeCommit("5555555", {
        verified: false,
        reason: "unsigned",
        message: "a | b @someone <img>",
      }),
    ]),
    total: 1,
    repository: REPO,
    baseRef: "main",
    headSha: "abcdef1",
  });
  assert.ok(body.includes("a \\| b @\u200bsomeone &lt;img>"));
});

test("creates a comment and fails when commits are unsigned", async () => {
  const github = makeGitHub({ commits: [signed, unsigned] });
  const result = await verifySignedCommits(makeEvent(), github, REPO);

  assert.strictEqual(result.ok, false);
  const post = github.calls.find(([m]) => m === "POST");
  assert.strictEqual(post[1], `/repos/${REPO}/issues/42/comments`);
  assert.ok(post[2].body.includes("Unsigned commits found"));
});

test("updates the existing bot comment instead of posting a new one", async () => {
  const github = makeGitHub({
    commits: [unsigned],
    comments: [
      { id: 7, user: { type: "User" }, body: COMMENT_MARKER },
      { id: 9, user: { type: "Bot" }, body: `${COMMENT_MARKER}\nold` },
    ],
  });
  await verifySignedCommits(makeEvent(), github, REPO);

  assert.ok(!github.calls.some(([m]) => m === "POST"));
  const patch = github.calls.find(([m]) => m === "PATCH");
  assert.strictEqual(patch[1], `/repos/${REPO}/issues/comments/9`);
});

test("passes without commenting when all commits are signed", async () => {
  const github = makeGitHub({ commits: [signed] });
  const result = await verifySignedCommits(makeEvent(), github, REPO);

  assert.strictEqual(result.ok, true);
  assert.ok(!github.calls.some(([m]) => m === "POST" || m === "PATCH"));
});

test("marks a previous failure comment as resolved once fixed", async () => {
  const github = makeGitHub({
    commits: [signed],
    comments: [{ id: 9, user: { type: "Bot" }, body: COMMENT_MARKER }],
  });
  await verifySignedCommits(makeEvent(), github, REPO);

  const patch = github.calls.find(([m]) => m === "PATCH");
  assert.ok(patch[2].body.includes("All commits are signed"));
});
