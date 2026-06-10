// Outreach Dialer — static, localStorage-backed.
// Data layer is intentionally isolated (loadOutcomes/saveOutcome) so it can be
// swapped for a Railway backend later without touching the UI.

(function () {
  "use strict";

  var STORAGE_KEY = "dialer.outcomes.v1";
  var companies = window.COMPANIES || [];

  // --- data layer ---------------------------------------------------------
  function loadOutcomes() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveOutcome(id, outcome) {
    var all = loadOutcomes();
    all[id] = Object.assign({}, all[id], outcome, { updated: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  // --- derived state ------------------------------------------------------
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
      var o = outcomes[c.id];
      if (o && o.interested === "yes") set[c.industry] = true;
    });
    return set;
  }

  // --- rendering ----------------------------------------------------------
  var state = { active: null };
  var tabsEl = document.getElementById("industryTabs");
  var listEl = document.getElementById("list");

  function render() {
    var outcomes = loadOutcomes();
    var inds = industries();
    if (!state.active || inds.indexOf(state.active) === -1) state.active = inds[0];
    var secured = securedIndustries(outcomes);

    renderTabs(inds, secured);
    renderList(outcomes, secured);
  }

  function renderTabs(inds, secured) {
    tabsEl.innerHTML = "";
    inds.forEach(function (ind) {
      var b = document.createElement("button");
      b.className = "tab" + (ind === state.active ? " active" : "");
      b.textContent = ind;
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

  function statusOf(o) {
    if (!o) return null;
    if (o.interested === "yes") return { cls: "interested", label: "Interested" };
    if (o.interested === "no") return { cls: "not-interested", label: "Not interested" };
    if (o.answered === "no") return { cls: "no-answer", label: "No answer" };
    if (o.answered === "yes") return { cls: "interested", label: "Answered" };
    return null;
  }

  function renderList(outcomes, secured) {
    listEl.innerHTML = "";

    if (secured[state.active]) {
      var banner = document.createElement("div");
      banner.className = "secured-banner";
      banner.textContent = "✓ " + state.active + " secured — you can stop calling this one.";
      listEl.appendChild(banner);
    }

    companies
      .filter(function (c) { return c.industry === state.active; })
      .forEach(function (c) {
        var o = outcomes[c.id];
        var st = statusOf(o);

        var card = document.createElement("div");
        card.className = "card" + (o ? " done" : "");

        var name = document.createElement("p");
        name.className = "name";
        name.textContent = c.name;
        card.appendChild(name);

        var meta = document.createElement("p");
        meta.className = "meta";
        meta.textContent = [c.city, c.phone].filter(Boolean).join(" · ");
        card.appendChild(meta);

        if (st) {
          var pill = document.createElement("span");
          pill.className = "status-pill " + st.cls;
          pill.textContent = st.label;
          card.appendChild(pill);
        }

        if (o && o.note) {
          var noteEl = document.createElement("p");
          noteEl.className = "note-shown";
          noteEl.textContent = "“" + o.note + "”";
          card.appendChild(noteEl);
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
        log.textContent = "Log";
        log.addEventListener("click", function () { openSheet(c); });
        actions.appendChild(log);

        card.appendChild(actions);
        listEl.appendChild(card);
      });
  }

  // --- outcome sheet ------------------------------------------------------
  var backdrop = document.getElementById("sheetBackdrop");
  var sheetSub = document.getElementById("sheetSub");
  var stepInterested = document.getElementById("stepInterested");
  var noteInput = document.getElementById("noteInput");
  var draft = { company: null, answered: null, interested: null };

  function openSheet(company) {
    var existing = loadOutcomes()[company.id] || {};
    draft = {
      company: company,
      answered: existing.answered || null,
      interested: existing.interested || null
    };
    sheetSub.textContent = company.name + " · " + company.phone;
    noteInput.value = existing.note || "";
    syncSheet();
    backdrop.hidden = false;
  }

  function closeSheet() {
    backdrop.hidden = true;
  }

  function syncSheet() {
    // Interested question only shown if they answered.
    stepInterested.hidden = draft.answered !== "yes";
    setActive("[data-answered]", "answered");
    setActive("[data-interested]", "interested");
  }

  function setActive(selector, key) {
    document.querySelectorAll(selector).forEach(function (btn) {
      var val = btn.getAttribute("data-" + key);
      btn.classList.toggle("active-choice", draft[key] === val);
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
    saveOutcome(draft.company.id, {
      answered: draft.answered,
      interested: draft.answered === "yes" ? draft.interested : null,
      note: noteInput.value.trim()
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

  render();
})();
