// Outreach Dialer — backed by the server API (/api/outcomes), with an
// in-memory cache so rendering stays synchronous and a localStorage mirror
// for offline resilience (a dropped signal mid-call never loses a log).

(function () {
  "use strict";

  var STORAGE_KEY = "dialer.outcomes.v1";
  var companies = window.COMPANIES || [];

  // --- data layer ---------------------------------------------------------
  // `cache` is the single source of truth the UI reads from. It's filled once
  // at boot from the server (falling back to localStorage if offline), and
  // kept in sync on every save.
  var cache = {};

  function loadOutcomes() {
    return cache;
  }

  function saveOutcome(id, outcome) {
    cache[id] = Object.assign({}, cache[id], outcome, { updated: Date.now() });
    // Mirror locally first so the log survives even if the network drops.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch (e) {}
    // Persist to the server in the background; localStorage holds it if this
    // fails and the next successful load will reconcile.
    fetch("/api/outcomes/" + encodeURIComponent(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cache[id])
    }).catch(function () {});
  }

  // Load all outcomes once, then hand control to the callback (render).
  function bootstrap(done) {
    fetch("/api/outcomes")
      .then(function (r) {
        if (!r.ok) throw new Error("bad status");
        return r.json();
      })
      .then(function (data) {
        cache = data || {};
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
        } catch (e) {}
      })
      .catch(function () {
        // Server unreachable — fall back to the last known local mirror.
        try {
          cache = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch (e) {
          cache = {};
        }
      })
      .then(function () {
        done();
      });
  }

  // --- classification -----------------------------------------------------
  // A company lives in exactly one view based on its logged outcome:
  //   interested === "yes"  -> "interested"     (won; off the call list)
  //   interested === "no"   -> "notInterested"  (declined; off the call list)
  //   anything else         -> "toCall"         (new, no-answer, undecided)
  function viewOf(outcome) {
    if (outcome && outcome.interested === "yes") return "interested";
    if (outcome && outcome.interested === "no") return "notInterested";
    return "toCall";
  }

  // --- notes & callbacks ----------------------------------------------------
  // Notes are an append-only stack of { text, ts }. Older records stored a
  // single overwritten `note` string — fold that in as the first entry.
  function notesOf(o) {
    if (!o) return [];
    if (o.notes && o.notes.length) return o.notes;
    if (o.note) return [{ text: o.note, ts: o.updated || 0 }];
    return [];
  }

  var DAY = 86400000;
  function startOfDay(ts) {
    var d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  function startOfToday() { return startOfDay(Date.now()); }

  // null if no callback set; otherwise { due, overdueDays, at }.
  // A callback is "due" from its day onward — it never silently expires.
  function callbackState(o) {
    if (!o || !o.callbackAt) return null;
    var due = startOfDay(o.callbackAt) <= startOfToday();
    return {
      due: due,
      overdueDays: due ? Math.round((startOfToday() - startOfDay(o.callbackAt)) / DAY) : 0,
      at: o.callbackAt
    };
  }

  function fmtDate(ts) {
    var d = new Date(ts);
    return (d.getMonth() + 1) + "/" + d.getDate();
  }

  function industries() {
    var seen = [];
    companies.forEach(function (c) {
      if (seen.indexOf(c.industry) === -1) seen.push(c.industry);
    });
    return seen;
  }

  // An industry is "secured" once any company in it is marked interested.
  function securedIndustries(outcomes) {
    var set = {};
    companies.forEach(function (c) {
      if (viewOf(outcomes[c.id]) === "interested") set[c.industry] = true;
    });
    return set;
  }

  function counts(outcomes) {
    var c = { toCall: 0, interested: 0, notInterested: 0 };
    companies.forEach(function (co) { c[viewOf(outcomes[co.id])]++; });
    return c;
  }

  // --- elements -----------------------------------------------------------
  var switcherEl = document.getElementById("viewSwitcher");
  var tabsEl = document.getElementById("industryTabs");
  var listEl = document.getElementById("list");

  var state = { view: "toCall", active: null };

  // --- rendering ----------------------------------------------------------
  function render() {
    var outcomes = loadOutcomes();
    renderSwitcher(counts(outcomes));

    if (state.view === "toCall") {
      tabsEl.style.display = "";
      renderToCall(outcomes);
    } else {
      tabsEl.style.display = "none";
      renderResolved(outcomes, state.view);
    }
  }

  function renderSwitcher(c) {
    switcherEl.querySelectorAll(".view-btn").forEach(function (btn) {
      var v = btn.getAttribute("data-view");
      btn.classList.toggle("active", v === state.view);
      // Refresh the count badge without disturbing the label text node.
      var existing = btn.querySelector(".count");
      if (existing) existing.remove();
      var badge = document.createElement("span");
      badge.className = "count";
      badge.textContent = c[v];
      btn.appendChild(badge);
    });
  }

  // --- "To Call" view (industry tabs) ------------------------------------
  function renderToCall(outcomes) {
    var inds = industries();
    if (!state.active || inds.indexOf(state.active) === -1) state.active = inds[0];
    var secured = securedIndustries(outcomes);

    renderTabs(inds, secured, outcomes);

    listEl.innerHTML = "";

    // Due callbacks float to the top regardless of industry or status —
    // this is the follow-up queue, so it includes interested leads too.
    var due = companies.filter(function (c) {
      var cb = callbackState(outcomes[c.id]);
      return cb && cb.due;
    }).sort(function (a, b) {
      return outcomes[a.id].callbackAt - outcomes[b.id].callbackAt;
    });

    if (due.length) {
      var dueHeader = document.createElement("p");
      dueHeader.className = "group-header due-header";
      dueHeader.textContent = "⏰ Due callbacks (" + due.length + ")";
      listEl.appendChild(dueHeader);
      due.forEach(function (c) {
        listEl.appendChild(card(c, outcomes[c.id], { showIndustry: true }));
      });
      var listHeader = document.createElement("p");
      listHeader.className = "group-header";
      listHeader.textContent = state.active;
      listEl.appendChild(listHeader);
    }

    if (secured[state.active]) {
      var banner = document.createElement("div");
      banner.className = "secured-banner";
      banner.textContent = "✓ " + state.active + " secured — you can stop calling this one.";
      listEl.appendChild(banner);
    }

    var pending = companies.filter(function (c) {
      var cb = callbackState(outcomes[c.id]);
      return c.industry === state.active &&
        viewOf(outcomes[c.id]) === "toCall" &&
        !(cb && cb.due); // already shown in the due section
    });

    if (!pending.length) {
      listEl.appendChild(emptyState("No one left to call in " + state.active + "."));
      return;
    }

    pending.forEach(function (c) {
      listEl.appendChild(card(c, outcomes[c.id]));
    });
  }

  function renderTabs(inds, secured, outcomes) {
    tabsEl.innerHTML = "";
    inds.forEach(function (ind) {
      var remaining = companies.filter(function (c) {
        return c.industry === ind && viewOf(outcomes[c.id]) === "toCall";
      }).length;

      var b = document.createElement("button");
      b.className = "tab" + (ind === state.active ? " active" : "");
      b.textContent = ind + " (" + remaining + ")";
      if (secured[ind]) {
        var dot = document.createElement("span");
        dot.className = "secured-dot";
        b.appendChild(dot);
      }
      b.addEventListener("click", function () {
        state.active = ind;
        render();
      });
      tabsEl.appendChild(b);
    });
  }

  // --- "Interested" / "Not Interested" views (grouped by industry) -------
  function renderResolved(outcomes, view) {
    listEl.innerHTML = "";

    var matches = companies.filter(function (c) {
      return viewOf(outcomes[c.id]) === view;
    });

    if (!matches.length) {
      listEl.appendChild(emptyState(
        view === "interested"
          ? "No interested businesses logged yet."
          : "No declines logged yet."
      ));
      return;
    }

    industries().forEach(function (ind) {
      var inGroup = matches.filter(function (c) { return c.industry === ind; });
      if (!inGroup.length) return;

      var h = document.createElement("p");
      h.className = "group-header";
      h.textContent = ind;
      listEl.appendChild(h);

      inGroup.forEach(function (c) {
        listEl.appendChild(card(c, outcomes[c.id]));
      });
    });
  }

  // --- shared card --------------------------------------------------------
  function statusOf(o) {
    if (!o) return null;
    if (o.interested === "yes") return { cls: "interested", label: "Interested" };
    if (o.interested === "no") return { cls: "not-interested", label: "Not interested" };
    if (o.answered === "no") return { cls: "no-answer", label: "No answer" };
    if (o.answered === "yes") return { cls: "interested", label: "Answered" };
    return null;
  }

  function card(c, o, opts) {
    var el = document.createElement("div");
    el.className = "card" + (o ? " done" : "");

    var name = document.createElement("p");
    name.className = "name";
    name.textContent = c.name;
    el.appendChild(name);

    var meta = document.createElement("p");
    meta.className = "meta";
    var metaParts = [c.city, c.phone];
    if (opts && opts.showIndustry) metaParts.unshift(c.industry);
    meta.textContent = metaParts.filter(Boolean).join(" · ");
    el.appendChild(meta);

    var st = statusOf(o);
    if (st) {
      var pill = document.createElement("span");
      pill.className = "status-pill " + st.cls;
      pill.textContent = st.label;
      el.appendChild(pill);
    }

    var cb = callbackState(o);
    if (cb) {
      var cbEl = document.createElement("p");
      cbEl.className = "callback-line " + (cb.due ? "due" : "scheduled");
      cbEl.textContent = cb.due
        ? (cb.overdueDays > 0
            ? "⏰ Overdue " + cb.overdueDays + (cb.overdueDays === 1 ? " day" : " days")
            : "⏰ Due today")
        : "📅 Call back " + fmtDate(cb.at);
      el.appendChild(cbEl);
    }

    // Full note history, newest first; latest entry stands out.
    var notes = notesOf(o);
    if (notes.length) {
      var stack = document.createElement("div");
      stack.className = "card-notes";
      for (var i = notes.length - 1; i >= 0; i--) {
        var line = document.createElement("p");
        line.className = "note-line" + (i === notes.length - 1 ? " latest" : "");
        if (notes[i].ts) {
          var dt = document.createElement("span");
          dt.className = "note-date";
          dt.textContent = fmtDate(notes[i].ts);
          line.appendChild(dt);
        }
        line.appendChild(document.createTextNode(notes[i].text));
        stack.appendChild(line);
      }
      el.appendChild(stack);
    }

    var actions = document.createElement("div");
    actions.className = "card-actions";

    var call = document.createElement("a");
    call.className = "call-btn";
    call.href = "tel:" + c.phone.replace(/[^0-9+]/g, "");
    call.textContent = "📞 Call";
    // Open the outcome sheet right after the call is initiated.
    call.addEventListener("click", function () {
      setTimeout(function () { openSheet(c); }, 400);
    });
    actions.appendChild(call);

    var log = document.createElement("button");
    log.className = "log-btn";
    log.textContent = o ? "Edit" : "Log";
    log.addEventListener("click", function () { openSheet(c); });
    actions.appendChild(log);

    el.appendChild(actions);
    return el;
  }

  function emptyState(msg) {
    var el = document.createElement("p");
    el.className = "empty-state";
    el.textContent = msg;
    return el;
  }

  // --- view switcher events ----------------------------------------------
  switcherEl.querySelectorAll(".view-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.view = btn.getAttribute("data-view");
      render();
    });
  });

  // --- outcome sheet ------------------------------------------------------
  var backdrop = document.getElementById("sheetBackdrop");
  var sheetSub = document.getElementById("sheetSub");
  var stepInterested = document.getElementById("stepInterested");
  var noteInput = document.getElementById("noteInput");
  var noteHistoryEl = document.getElementById("noteHistory");
  var chipsEl = document.getElementById("callbackChips");
  var callbackDateEl = document.getElementById("callbackDate");
  var callbackCurrentEl = document.getElementById("callbackCurrent");
  var draft = { company: null, answered: null, interested: null, callbackAt: null };

  // Preset chips land at noon local time N days out, so "due" math is stable
  // across DST and the same preset re-tapped maps to the same timestamp.
  function presetTs(days) { return startOfToday() + days * DAY + 12 * 3600000; }

  function openSheet(company) {
    var existing = loadOutcomes()[company.id] || {};
    draft = {
      company: company,
      answered: existing.answered || null,
      interested: existing.interested || null,
      callbackAt: existing.callbackAt || null
    };
    sheetSub.textContent = company.name + " · " + company.phone;
    noteInput.value = "";
    callbackDateEl.hidden = true;
    callbackDateEl.value = "";
    renderNoteHistory(existing);
    syncSheet();
    backdrop.hidden = false;
  }

  function renderNoteHistory(existing) {
    noteHistoryEl.innerHTML = "";
    var notes = notesOf(existing);
    noteHistoryEl.hidden = !notes.length;
    for (var i = notes.length - 1; i >= 0; i--) {
      var line = document.createElement("p");
      line.className = "note-line" + (i === notes.length - 1 ? " latest" : "");
      if (notes[i].ts) {
        var dt = document.createElement("span");
        dt.className = "note-date";
        dt.textContent = fmtDate(notes[i].ts);
        line.appendChild(dt);
      }
      line.appendChild(document.createTextNode(notes[i].text));
      noteHistoryEl.appendChild(line);
    }
  }

  function closeSheet() {
    backdrop.hidden = true;
  }

  function syncSheet() {
    // Interested question only shown if they answered.
    stepInterested.hidden = draft.answered !== "yes";
    setActive("[data-answered]", "answered");
    setActive("[data-interested]", "interested");
    syncChips();
  }

  function syncChips() {
    var presets = [1, 2, 3, 7];
    chipsEl.querySelectorAll(".chip").forEach(function (btn) {
      var v = btn.getAttribute("data-cb");
      var active = false;
      if (draft.callbackAt) {
        if (v === "custom") {
          active = presets.every(function (n) { return presetTs(n) !== draft.callbackAt; });
        } else {
          active = presetTs(parseInt(v, 10)) === draft.callbackAt;
        }
      }
      btn.classList.toggle("active", active);
    });
    callbackCurrentEl.hidden = !draft.callbackAt;
    if (draft.callbackAt) {
      callbackCurrentEl.textContent =
        "📅 Call back " + new Date(draft.callbackAt).toDateString().slice(0, 10) +
        " — tap the chip again to clear";
    }
  }

  chipsEl.querySelectorAll(".chip").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var v = btn.getAttribute("data-cb");
      if (btn.classList.contains("active")) {
        draft.callbackAt = null;
        callbackDateEl.hidden = true;
        syncChips();
        return;
      }
      if (v === "custom") {
        callbackDateEl.hidden = false;
        if (callbackDateEl.value) applyCustomDate();
        return;
      }
      callbackDateEl.hidden = true;
      draft.callbackAt = presetTs(parseInt(v, 10));
      syncChips();
    });
  });
  callbackDateEl.addEventListener("change", applyCustomDate);
  function applyCustomDate() {
    if (!callbackDateEl.value) return;
    var p = callbackDateEl.value.split("-");
    draft.callbackAt = new Date(+p[0], +p[1] - 1, +p[2], 12).getTime();
    syncChips();
  }

  function setActive(selector, key) {
    document.querySelectorAll(selector).forEach(function (btn) {
      var val = btn.getAttribute("data-" + key);
      btn.style.outline = draft[key] === val ? "3px solid rgba(255,255,255,0.5)" : "none";
    });
  }

  document.querySelectorAll("[data-answered]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      draft.answered = btn.getAttribute("data-answered");
      if (draft.answered === "no") draft.interested = null;
      syncSheet();
    });
  });
  document.querySelectorAll("[data-interested]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      draft.interested = btn.getAttribute("data-interested");
      syncSheet();
    });
  });

  document.getElementById("saveOutcome").addEventListener("click", function () {
    if (!draft.company) return closeSheet();
    var notes = notesOf(loadOutcomes()[draft.company.id]).slice();
    var text = noteInput.value.trim();
    if (text) notes.push({ text: text, ts: Date.now() });
    saveOutcome(draft.company.id, {
      answered: draft.answered,
      interested: draft.answered === "yes" ? draft.interested : null,
      notes: notes,
      // Legacy mirror of the latest note, so old localStorage mirrors stay coherent.
      note: notes.length ? notes[notes.length - 1].text : "",
      callbackAt: draft.callbackAt
    });
    closeSheet();
    toast("Logged ✓");
    render();
  });
  document.getElementById("cancelOutcome").addEventListener("click", closeSheet);
  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeSheet();
  });

  // --- toast --------------------------------------------------------------
  var toastEl = document.getElementById("toast");
  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 1800);
  }

  bootstrap(render);
})();
