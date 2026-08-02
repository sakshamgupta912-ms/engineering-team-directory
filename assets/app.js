const profiles = window.PROFILES || [];
const grid = document.querySelector("#profile-grid");
const searchInput = document.querySelector("#search");
const skillFilter = document.querySelector("#skill-filter");
const summary = document.querySelector("#result-summary");
const emptyState = document.querySelector("#empty-state");

function textElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

const ICON_BRIEFCASE = "M6.75 0h2.5C10.216 0 11 .784 11 1.75V3h3.25c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25v-8.5C0 3.784.784 3 1.75 3H5V1.75C5 .784 5.784 0 6.75 0ZM1.75 4.5a.25.25 0 0 0-.25.25V7h13V4.75a.25.25 0 0 0-.25-.25H1.75ZM14.5 8.5h-13v4.75c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V8.5ZM9.5 3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25V3h3Z";
const ICON_LOCATION = "m12.596 11.596-3.535 3.536a1.5 1.5 0 0 1-2.122 0l-3.535-3.536a6.5 6.5 0 1 1 9.192-9.193 6.5 6.5 0 0 1 0 9.193Zm-1.06-8.132a5 5 0 1 0-7.072 7.072L8 14.07l3.536-3.534a5 5 0 0 0 0-7.072ZM8 9a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 9Z";

function metaLine(className, iconPath, text) {
  const line = document.createElement("p");
  line.className = className;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", iconPath);
  svg.append(path);

  line.append(svg, document.createTextNode(text));
  return line;
}

function createProfileCard(profile, index) {
  const article = document.createElement("article");
  article.className = "profile-card";
  article.style.setProperty("--delay", `${index * 55}ms`);

  const head = document.createElement("div");
  head.className = "card-head";

  const portrait = document.createElement("div");
  portrait.className = "portrait";
  portrait.dataset.initials = profile.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const avatar = document.createElement("img");
  avatar.src = `https://github.com/${encodeURIComponent(profile.github)}.png?size=160`;
  avatar.alt = `${profile.name}'s GitHub avatar`;
  avatar.loading = "lazy";
  avatar.addEventListener("error", () => avatar.remove());
  portrait.append(avatar);

  const identity = document.createElement("div");
  identity.className = "identity";
  const heading = textElement("h3", "", profile.name);
  const profileLink = document.createElement("a");
  profileLink.className = "profile-link";
  profileLink.href = `https://github.com/${encodeURIComponent(profile.github)}`;
  profileLink.target = "_blank";
  profileLink.rel = "noreferrer";
  profileLink.textContent = `@${profile.github}`;
  profileLink.setAttribute("aria-label", `View ${profile.name} on GitHub`);
  identity.append(heading, profileLink);
  head.append(portrait, identity);

  const role = metaLine("role", ICON_BRIEFCASE, profile.role);
  const location = metaLine("location", ICON_LOCATION, profile.location);
  const bio = textElement("p", "bio", profile.bio);
  const skills = document.createElement("ul");
  skills.className = "skill-list";
  profile.skills.forEach((skill) => skills.append(textElement("li", "", skill)));

  article.append(head, role, location, bio, skills);
  return article;
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedSkill = skillFilter.value;
  const visibleProfiles = profiles.filter((profile) => {
    const searchable = [profile.name, profile.github, profile.role, profile.location, profile.bio, ...profile.skills]
      .join(" ").toLowerCase();
    return searchable.includes(query) && (!selectedSkill || profile.skills.includes(selectedSkill));
  });

  grid.replaceChildren(...visibleProfiles.map(createProfileCard));
  summary.textContent = `Showing ${visibleProfiles.length} of ${profiles.length} teammates`;
  emptyState.hidden = visibleProfiles.length !== 0;
}

const skills = [...new Set(profiles.flatMap((profile) => profile.skills))].sort();
skills.forEach((skill) => {
  const option = document.createElement("option");
  option.value = skill;
  option.textContent = skill;
  skillFilter.append(option);
});

document.querySelector("#member-count").textContent = profiles.length;
document.querySelector("#location-count").textContent = new Set(profiles.map((profile) => profile.location)).size;
document.querySelector("#skill-count").textContent = skills.length;
searchInput.addEventListener("input", render);
skillFilter.addEventListener("change", render);
document.querySelector("#clear-filters").addEventListener("click", () => {
  searchInput.value = "";
  skillFilter.value = "";
  render();
  searchInput.focus();
});
render();
