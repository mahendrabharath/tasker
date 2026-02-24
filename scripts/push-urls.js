#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function loadEnv(file) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) return;
  fs.readFileSync(p, "utf8")
    .split("\n")
    .forEach((line) => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) {
        const val = m[2].trim().replace(/^["']|["']$/g, "");
        process.env[m[1].trim()] = val;
      }
    });
}

loadEnv(".env.local");
loadEnv(".env");

const base =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.VERCEL_URL ||
  "http://localhost:3000";
const baseUrl = base.startsWith("http") ? base : `https://${base}`;
const secret = process.env.PUSH_CRON_SECRET || "YOUR_SECRET";

const debugUrl = `${baseUrl.replace(/\/$/, "")}/api/push/send?secret=${secret}&debug=1`;
const cronUrl = `${baseUrl.replace(/\/$/, "")}/api/push/send?secret=${secret}`;

console.log("Debug URL (use in browser to inspect):");
console.log(debugUrl);
console.log("");
console.log("Cron URL (use in Supabase scheduler):");
console.log(cronUrl);
console.log("");
console.log(
  "Tip: Add NEXT_PUBLIC_APP_URL to .env.local with your Vercel domain (e.g. https://tasker.vercel.app)"
);
