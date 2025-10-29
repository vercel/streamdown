import fs from "node:fs/promises";

const BYPASS_LABELS = ["minor", "major"];
const CHANGESET_FILE_PATTERN = /^\.changeset\/[a-z-]+\.md/;
const FRONTMATTER_PATTERN = /---\n([\s\S]+?)\n---/;

// check if current file is the entry point
if (import.meta.url.endsWith(process.argv[1])) {
  // https://docs.github.com/en/webhooks/webhook-events-and-payloads#pull_request
  const pullRequestEvent = JSON.parse(
    await fs.readFile(process.env.GITHUB_EVENT_PATH, "utf-8")
  );

  try {
    const message = await verifyChangesets(
      pullRequestEvent,
      process.env,
      fs.readFile
    );
    await fs.writeFile(
      process.env.GITHUB_STEP_SUMMARY,
      `## Changeset verification passed ✅\n\n${message || ""}`
    );
  } catch (error) {
    await fs.writeFile(
      process.env.GITHUB_STEP_SUMMARY,
      `## Changeset verification failed ❌

${error.message}`
    );

    if (error.path) {
      await fs.appendFile(
        process.env.GITHUB_STEP_SUMMARY,
        `\n\nFile: \`${error.path}\``
      );
    }

    if (error.content) {
      await fs.appendFile(
        process.env.GITHUB_STEP_SUMMARY,
        `\n\n\`\`\`yaml\n${error.content}\n\`\`\``
      );
    }

    process.exit(1);
  }
}

function validateChangesetPath(path) {
  if (!CHANGESET_FILE_PATTERN.test(path)) {
    throw Object.assign(new Error("Invalid file - not a .changeset file"), {
      path,
    });
  }
}

function extractFrontmatter(content, path) {
  const result = content.match(FRONTMATTER_PATTERN);
  if (!result) {
    throw Object.assign(
      new Error("Invalid .changeset file - no frontmatter found"),
      { path, content }
    );
  }
  return result[0];
}

function parseVersionBumps(frontmatter, path, content) {
  const lines = frontmatter.split("\n").slice(1, -1);
  const versionBumps = {};

  for (const line of lines) {
    const [packageName, versionBump] = line.split(":").map((s) => s.trim());
    if (!(packageName && versionBump)) {
      throw Object.assign(
        new Error("Invalid .changeset file - invalid frontmatter", {
          path,
          content,
        })
      );
    }

    if (versionBumps[packageName]) {
      throw Object.assign(
        new Error(
          `Invalid .changeset file - duplicate package name "${packageName}"`
        ),
        { path, content }
      );
    }

    versionBumps[packageName] = versionBump;
  }

  return versionBumps;
}

function validateVersionBumps(versionBumps, path, content) {
  const invalidVersionBumps = Object.entries(versionBumps).filter(
    ([, versionBump]) => versionBump !== "patch"
  );

  if (invalidVersionBumps.length > 0) {
    throw Object.assign(
      new Error(
        `Invalid .changeset file - invalid version bump (only "patch" is allowed, see https://ai-sdk.dev/docs/migration-guides/versioning). To bypass, add one of the following labels: ${BYPASS_LABELS.join(", ")}`
      ),
      { path, content }
    );
  }
}

export async function verifyChangesets(
  event,
  env = process.env,
  readFile = fs.readFile
) {
  // Skip check if pull request has "minor-release" label
  const byPassLabel = event.pull_request.labels.find((label) =>
    BYPASS_LABELS.includes(label.name)
  );
  if (byPassLabel) {
    return `Skipping changeset verification - "${byPassLabel.name}" label found`;
  }

  // Iterate through all changed .changeset/*.md files
  for (const path of env.CHANGED_FILES.trim().split(" ")) {
    // ignore README.md file
    if (path === ".changeset/README.md") {
      continue;
    }

    validateChangesetPath(path);

    const content = await readFile(`../../../../${path}`, "utf-8");
    const frontmatter = extractFrontmatter(content, path);
    const versionBumps = parseVersionBumps(frontmatter, path, content);
    validateVersionBumps(versionBumps, path, content);
  }
}
