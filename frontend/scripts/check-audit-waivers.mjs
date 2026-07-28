#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const waiverPath = path.resolve(root, process.env.AUDIT_WAIVER_FILE || 'audit-waivers.json');
const severityRank = {
  info: 0,
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function runAudit() {
  try {
    const stdout = execFileSync('npm', ['audit', '--json'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return JSON.parse(stdout);
  } catch (error) {
    const stdout = error.stdout?.toString() || '';
    if (!stdout) {
      console.error(error.stderr?.toString() || error.message);
      process.exit(1);
    }
    return JSON.parse(stdout);
  }
}

function parseDateOnly(value) {
  const date = new Date(`${value}T23:59:59.999Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid waiver expiry date: ${value}`);
  }
  return date;
}

function daysUntil(date, now) {
  return Math.ceil((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

const waiverConfig = readJson(waiverPath);
const waivers = waiverConfig.waivers || {};
const audit = runAudit();
const now = new Date();
const maxDays = Number(waiverConfig.expiresNoLaterThanDays || 90);
const highVulnerabilities = Object.entries(audit.vulnerabilities || {}).filter(
  ([, vulnerability]) => severityRank[vulnerability.severity] >= severityRank.high
);

const failures = [];
const waived = [];

for (const [name, vulnerability] of highVulnerabilities) {
  const waiver = waivers[name];
  if (!waiver) {
    failures.push(`${name}: no waiver for ${vulnerability.severity} vulnerability`);
    continue;
  }

  const expiry = parseDateOnly(waiver.expires);
  const remainingDays = daysUntil(expiry, now);

  if (remainingDays < 0) {
    failures.push(`${name}: waiver expired on ${waiver.expires}`);
    continue;
  }

  if (remainingDays > maxDays) {
    failures.push(`${name}: waiver expiry ${waiver.expires} exceeds ${maxDays} day policy`);
    continue;
  }

  if (!waiver.owner || !waiver.reason || !waiver.tracking) {
    failures.push(`${name}: waiver must include owner, reason, and tracking`);
    continue;
  }

  waived.push(`${name} (${vulnerability.severity}, expires ${waiver.expires})`);
}

if (failures.length > 0) {
  console.error('High/critical npm audit vulnerabilities without valid waivers:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

if (waived.length > 0) {
  console.warn('High/critical npm audit vulnerabilities accepted by active waivers:');
  for (const item of waived) console.warn(`- ${item}`);
} else {
  console.log('No high/critical npm audit vulnerabilities found.');
}

const unusedWaivers = Object.keys(waivers).filter(
  (name) => !highVulnerabilities.some(([vulnerabilityName]) => vulnerabilityName === name)
);
if (unusedWaivers.length > 0) {
  console.warn('Unused audit waivers present:');
  for (const name of unusedWaivers) console.warn(`- ${name}`);
}
