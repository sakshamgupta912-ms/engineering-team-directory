const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const profilesDirectory = path.join(root, "profiles");
const outputFile = path.join(root, "assets", "profiles-data.js");
const requiredFields = ["name", "github", "role", "location", "skills"];
const profileFormat = [
  "---",
  "name: Your Name",
  "github: your-github-username",
  "role: Your Role",
  "location: City, Country",
  "skills: Skill One, Skill Two, Skill Three",
  "---",
  "",
  "Write a short introduction about yourself here.",
].join("\n");

function profileError(fileName, problem, fix, example) {
  return new Error([
    `There is a problem with profiles/${fileName}.`,
    `Problem: ${problem}`,
    `How to fix it: ${fix}`,
    example ? `\nCorrect format:\n${example}` : null,
    "Use profiles/sample.md as a working example.",
  ].filter(Boolean).join("\n"));
}

function parseProfile(fileName) {
  const source = fs.readFileSync(path.join(profilesDirectory, fileName), "utf8").trim();
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n([\s\S]*))?$/);

  if (!match) {
    throw profileError(
      fileName,
      "The profile fields must be placed between two lines containing only ---.",
      "Copy the format below and replace the example values with your information.",
      profileFormat,
    );
  }

  if (!match[2]?.trim()) {
    throw profileError(
      fileName,
      "The short introduction below the second --- line is missing.",
      "Add one or two sentences about yourself after the second --- line.",
    );
  }

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      throw profileError(
        fileName,
        `The line "${line}" is not written as a field and value.`,
        "Write the line as field: value. For example: role: Consultant",
      );
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    fields[key] = value;
  }

  for (const field of requiredFields) {
    if (!fields[field]) {
      throw profileError(
        fileName,
        `The required field "${field}" is missing or empty.`,
        `Add ${field}: followed by your information between the two --- lines.`,
      );
    }
  }

  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(fields.github)) {
    throw profileError(
      fileName,
      `"${fields.github}" is not a valid GitHub username.`,
      "Enter only your GitHub username, without @ or a profile URL. For example: github: octocat",
    );
  }

  const expectedFileName = `${fields.github.toLowerCase()}.md`;
  if (fileName !== "sample.md" && fileName.toLowerCase() !== expectedFileName) {
    throw profileError(
      fileName,
      `The filename does not match the GitHub username "${fields.github}".`,
      `Rename the file to ${expectedFileName}.`,
    );
  }

  return {
    ...fields,
    bio: match[2].trim(),
    skills: fields.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
  };
}

const files = fs.readdirSync(profilesDirectory)
  .filter((fileName) => fileName.endsWith(".md"))
  .sort();

if (files.length === 0) {
  throw new Error("No Markdown profiles found in profiles/");
}

try {
  const profiles = files.map(parseProfile);
  const usernames = profiles.map((profile) => profile.github.toLowerCase());
  const duplicate = usernames.find((username, index) => usernames.indexOf(username) !== index);

  if (duplicate) {
    throw new Error(`Duplicate GitHub username: ${duplicate}`);
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `window.PROFILES = ${JSON.stringify(profiles, null, 2)};\n`);
  console.log(`Validated and built ${profiles.length} profile(s).`);
} catch (error) {
  console.error("\nPROFILE CHECK FAILED");
  console.error("====================");
  console.error(error.message);
  console.error("\nFix the profile, commit the change, and push it to update this check.");
  process.exitCode = 1;
}