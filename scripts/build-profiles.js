const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const profilesDirectory = path.join(root, "profiles");
const outputFile = path.join(root, "assets", "profiles-data.js");
const requiredFields = ["name", "github", "role", "location", "skills"];

function parseProfile(fileName) {
  const source = fs.readFileSync(path.join(profilesDirectory, fileName), "utf8").trim();
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/);

  if (!match) {
    throw new Error(`${fileName}: use YAML front matter followed by a short bio`);
  }

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      throw new Error(`${fileName}: invalid profile field "${line}"`);
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    fields[key] = value;
  }

  for (const field of requiredFields) {
    if (!fields[field]) {
      throw new Error(`${fileName}: missing required field "${field}"`);
    }
  }

  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(fields.github)) {
    throw new Error(`${fileName}: "github" must be a valid GitHub username`);
  }

  const expectedFileName = `${fields.github.toLowerCase()}.md`;
  if (fileName !== "sample.md" && fileName.toLowerCase() !== expectedFileName) {
    throw new Error(`${fileName}: rename this file to ${expectedFileName}`);
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
  console.error(`Profile validation failed: ${error.message}`);
  process.exitCode = 1;
}