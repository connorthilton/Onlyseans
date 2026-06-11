// Outreach Dialer — backend.
// Serves the static frontend AND exposes a tiny outcomes API backed by a
// JSON file on disk. On Railway, point a Volume at DATA_DIR (default /data)
// and the data survives redeploys. Until a volume is mounted, it still runs —
// it just writes to the ephemeral container filesystem.

"use strict";

var express = require("express");
var path = require("path");
var fs = require("fs");

var app = express();
app.use(express.json());

// --- storage -------------------------------------------------------------
// DATA_DIR is the Railway Volume mount path. Defaults to /data so that
// mounting a volume there needs no extra configuration.
var DATA_DIR = process.env.DATA_DIR || "/data";
var DATA_FILE = path.join(DATA_DIR, "outcomes.json");

function ensureDir() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error("Could not create DATA_DIR (" + DATA_DIR + "):", e.message);
  }
}

function readAll() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) || {};
  } catch (e) {
    return {}; // missing/corrupt file -> start empty
  }
}

// Atomic write: write to a temp file then rename, so a crash mid-write can't
// corrupt the live data file.
function writeAll(obj) {
  ensureDir();
  var tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

// --- API -----------------------------------------------------------------
app.get("/api/outcomes", function (req, res) {
  res.json(readAll());
});

// Merge-and-stamp a single outcome, mirroring the original client logic.
app.put("/api/outcomes/:id", function (req, res) {
  var all = readAll();
  var id = req.params.id;
  all[id] = Object.assign({}, all[id], req.body, { updated: Date.now() });
  try {
    writeAll(all);
  } catch (e) {
    return res.status(500).json({ error: "write failed" });
  }
  res.json(all[id]);
});

// Simple health/info probe (also confirms where data is being written).
app.get("/api/health", function (req, res) {
  res.json({ ok: true, dataFile: DATA_FILE, persisted: fs.existsSync(DATA_FILE) });
});

// --- static frontend -----------------------------------------------------
app.use(express.static(__dirname));

// --- boot ----------------------------------------------------------------
var PORT = process.env.PORT || 3000;
ensureDir();
var server = app.listen(PORT, function () {
  console.log("Outreach Dialer listening on " + PORT + " — data at " + DATA_FILE);
});

// Railway sends SIGTERM on redeploy; exit 0 so it's a clean stop, not a "crash".
process.on("SIGTERM", function () {
  server.close(function () {
    process.exit(0);
  });
});
