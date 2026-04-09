#!/usr/bin/env node

/**
 * CLI tool for pulling PostHog analytics data.
 *
 * Usage:
 *   node scripts/analytics.mjs projects                     — list org projects
 *   node scripts/analytics.mjs usage [--days 7] [--project name]
 *   node scripts/analytics.mjs contacts [--days 30] [--project name]
 *
 * Requires POSTHOG_PERSONAL_API_KEY in .env
 * Get one from PostHog → Settings → Personal API Keys
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env") });

const API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const API_HOST = "https://eu.posthog.com"; // API host (not ingestion host)

if (!API_KEY) {
  console.error(
    "Missing POSTHOG_PERSONAL_API_KEY in .env\n" +
      "Get one from PostHog → Settings → Personal API Keys"
  );
  process.exit(1);
}

// --- API helpers ---

async function fetchPostHog(endpoint, params = {}) {
  const url = new URL(endpoint, API_HOST);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PostHog API ${res.status}: ${body}`);
  }
  return res.json();
}

async function getProjects() {
  const data = await fetchPostHog("/api/projects/");
  if (!data.results?.length) throw new Error("No PostHog projects found");
  return data.results;
}

async function getProjectId(projectName) {
  const projects = await getProjects();
  if (projectName) {
    const match = projects.find(
      (p) => p.name.toLowerCase() === projectName.toLowerCase()
    );
    if (!match) {
      console.error(
        `Project "${projectName}" not found. Available projects:\n` +
          projects.map((p) => `  - ${p.name}`).join("\n")
      );
      process.exit(1);
    }
    return match.id;
  }
  if (projects.length > 1) {
    console.error(
      "Multiple projects found — use --project <name> to select one:\n" +
        projects.map((p) => `  - ${p.name}`).join("\n")
    );
    process.exit(1);
  }
  return projects[0].id;
}

async function fetchAllEvents(projectId, eventName, after) {
  const events = [];
  let url = `/api/projects/${projectId}/events/`;
  let params = { event: eventName, after, limit: "100", orderBy: '["-timestamp"]' };

  while (true) {
    const data = await fetchPostHog(url, params);
    events.push(...(data.results || []));
    if (!data.next) break;
    const nextUrl = new URL(data.next);
    url = nextUrl.pathname;
    params = Object.fromEntries(nextUrl.searchParams);
  }
  return events.filter((e) => !isLocalhost(e));
}

function isLocalhost(event) {
  const url = event.properties?.$current_url || "";
  return url.includes("localhost") || url.includes("127.0.0.1");
}

// --- Commands ---

async function cmdProjects() {
  const projects = await getProjects();
  console.log(`\nOrg projects (${projects.length})\n${"─".repeat(40)}`);
  for (const p of projects) {
    console.log(`  ${p.name} (id: ${p.id})`);
  }
  console.log("");
}

async function cmdUsage(days, projectName) {
  const projectId = await getProjectId(projectName);
  const after = daysAgo(days);

  console.log(`\nUsage stats — last ${days} days\n${"─".repeat(40)}`);

  const pageviews = await fetchAllEvents(projectId, "$pageview", after);
  console.log(`\nPageviews: ${pageviews.length}`);

  const pageCounts = {};
  for (const e of pageviews) {
    const page = e.properties?.$pathname || "unknown";
    pageCounts[page] = (pageCounts[page] || 0) + 1;
  }
  const sortedPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]);
  console.log("\nTop pages:");
  for (const [page, count] of sortedPages.slice(0, 15)) {
    console.log(`  ${String(count).padStart(5)}  ${page}`);
  }

  const uniqueVisitors = new Set(pageviews.map((e) => e.distinct_id));
  console.log(`\nUnique visitors: ${uniqueVisitors.size}`);

  const keyEvents = ["contact_submitted"];

  console.log("\nKey events:");
  for (const eventName of keyEvents) {
    const events = await fetchAllEvents(projectId, eventName, after);
    if (events.length > 0) {
      console.log(`  ${String(events.length).padStart(5)}  ${eventName}`);
    }
  }

  console.log("");
}

async function cmdContacts(days, projectName) {
  const projectId = await getProjectId(projectName);
  const after = daysAgo(days);

  console.log(`\nContact submissions — last ${days} days\n${"─".repeat(40)}\n`);

  const events = await fetchAllEvents(projectId, "contact_submitted", after);

  if (events.length === 0) {
    console.log("No contact submissions found.");
    return;
  }

  for (const e of events) {
    const date = new Date(e.timestamp).toLocaleString();
    const name = e.properties?.name || "—";
    const email = e.properties?.email || "—";
    const website = e.properties?.website || "—";
    const message = e.properties?.message || "—";
    console.log(`Date:    ${date}`);
    console.log(`Name:    ${name}`);
    console.log(`Email:   ${email}`);
    console.log(`Website: ${website}`);
    console.log(`Message: ${message}`);
    console.log("─".repeat(40));
  }

  console.log(`\nTotal: ${events.length} submission(s)\n`);
}

// --- Helpers ---

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const KNOWN_FLAGS = new Set(["--days", "--project"]);

function showHelp(exitCode = 0) {
  console.log(
    "Usage:\n" +
      "  node scripts/analytics.mjs projects                              — list org projects\n" +
      "  node scripts/analytics.mjs usage    [--days 7] [--project name]  — pageviews, visitors, key events\n" +
      "  node scripts/analytics.mjs contacts [--days 30] [--project name] — contact form submissions"
  );
  process.exit(exitCode);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];

  const flags = args.filter((a) => a.startsWith("--"));
  const unknown = flags.filter((f) => !KNOWN_FLAGS.has(f));
  if (unknown.length > 0) {
    console.error(`Unknown flag(s): ${unknown.join(", ")}\n`);
    showHelp(1);
  }

  let days = 7;
  const daysIdx = args.indexOf("--days");
  if (daysIdx !== -1 && args[daysIdx + 1]) {
    days = parseInt(args[daysIdx + 1], 10);
  }
  let project;
  const projIdx = args.indexOf("--project");
  if (projIdx !== -1 && args[projIdx + 1]) {
    project = args[projIdx + 1];
  }
  return { command, days, project };
}

// --- Main ---

const { command, days, project } = parseArgs();

switch (command) {
  case "projects":
    await cmdProjects();
    break;
  case "usage":
    await cmdUsage(days, project);
    break;
  case "contacts":
    await cmdContacts(days, project);
    break;
  default:
    showHelp(command ? 1 : 0);
}
