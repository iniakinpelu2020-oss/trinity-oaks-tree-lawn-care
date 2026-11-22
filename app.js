/* Trinity Oaks — interactions */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var clamp = function (v, min, max) { return Math.min(max, Math.max(min, v)); };

  var PHONE = "+18176924418";
  var PHONE_LABEL = "(817) 692-4418";
  var TZ = "America/Chicago";

  var SERVICES = {
    mowing: { title: "Mowing & Edging", note: "Weekly or fortnightly, edges cut and blown down.", price: 55, img: "1500382017468-9049fed747ef" },
    shrub: { title: "Shrub Sculpting", note: "Beds shaped, hedges squared, clippings taken away.", price: 95, img: "1518495973542-4542c06a5843" },
    prune: { title: "Canopy Pruning", note: "Deadwood out, clearance over roof and drive restored.", price: 240, img: "1441974231531-c6227db76b6e" },
    stump: { title: "Stump Grinding", note: "Ground below grade, chips raked and taken.", price: 145, img: "1502082553048-f009c37129b9" },
    cleanup: { title: "Seasonal Cleanup", note: "Leaves, fallen limbs and tired beds reset in one visit.", price: 175, img: "1523712999610-f77fbcfc3843" }
  };

  var TRIOS = {
    lawn: ["mowing", "shrub", "cleanup"],
    canopy: ["prune", "stump", "shrub"],
    reset: ["cleanup", "stump", "prune"]
  };

  /* ---------- boot overlay failsafe ---------- */
  var boot = $("#boot");
  if (boot) {
    window.setTimeout(function () {
      if (boot && boot.parentNode) { boot.parentNode.removeChild(boot); }
    }, 2600);
  }

  /* ---------- hours: highlight today in Fort Worth ---------- */
  (function today() {
    var rows = $$(".hours tr[data-day]");
    if (!rows.length) { return; }
    var label = "Mon";
    try {
      label = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: TZ }).format(new Date());
    } catch (err) {
      label = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
    }
    rows.forEach(function (row) {
      if (row.getAttribute("data-day") === label) {
        row.classList.add("is-today");
        var cell = $(".hours__now", row);
        if (cell) { cell.textContent = "Today"; }
      }
    });
  })();

  /* ---------- canopy deck ---------- */
  var deck = $("#deck");

  function paintDeck(ids) {
    if (!deck) { return; }
    $$(".deck__slot", deck).forEach(function (slot, i) {
      var key = ids[i];
      var data = SERVICES[key];
      var card = $(".card3d", slot);
      if (!data || !card) { return; }
      card.setAttribute("data-service", key);
      var img = $(".card3d__media img", card);
      if (img) {
        img.src = "https://images.unsplash.com/photo-" + data.img + "?auto=format&fit=crop&w=700&q=70";
        img.alt = data.title;
        img.classList.remove("is-missing");
      }
      var h3 = $("h3", card);
      if (h3) { h3.textContent = data.title; }
      var note = $(".card3d__note", card);
      if (note) { note.textContent = data.note; }
      var price = $(".card3d__price", card);
      if (price) { price.innerHTML = "<span>Starting</span> $" + data.price; }
      slot.classList.remove("is-active");
    });
  }

  $$(".trio").forEach(function (btn) {
    btn.addEventListener("click", function () {
      $$(".trio").forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      paintDeck(TRIOS[btn.getAttribute("data-trio")] || TRIOS.lawn);
    });
  });

  /* pointer tilt on the cards */
  $$(".card3d").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") { return; }
      var box = card.getBoundingClientRect();
      if (!box.width || !box.height) { return; }
      var px = (e.clientX - box.left) / box.width - 0.5;
      var py = (e.clientY - box.top) / box.height - 0.5;
      card.style.setProperty("--cy", clamp(px * 14, -6, 6).toFixed(2) + "deg");
      card.style.setProperty("--cx", clamp(-py * 12, -5, 5).toFixed(2) + "deg");
      card.style.setProperty("--lift", "16px");
    });
    card.addEventListener("pointerleave", function () {
      card.style.removeProperty("--cy");
      card.style.removeProperty("--cx");
      card.style.removeProperty("--lift");
    });
    card.addEventListener("click", function () {
      var slot = card.parentNode;
      $$(".deck__slot").forEach(function (s) { s.classList.toggle("is-active", s === slot); });
    });
  });

  /* ---------- estimate ---------- */
  var totalNum = $("#totalNum");
  var totalList = $("#totalList");
  var drawerTotal = $("#drawerTotal");
  var drawerList = $("#drawerList");
  var drawerCall = $("#drawerCall");
  var drawerText = $("#drawerText");
  var money = function (n) { return "$" + n; };

  function chosen(groupName) {
    var wrap = $('.pills[data-group="' + groupName + '"]');
    if (!wrap) { return null; }
    var btn = $('button[aria-pressed="true"]', wrap);
    if (!btn) { return null; }
    var label = btn.getAttribute("data-label") || (btn.firstChild && btn.firstChild.textContent ? btn.firstChild.textContent.trim() : "");
    var amount = btn.hasAttribute("data-price") ? parseInt(btn.getAttribute("data-price"), 10) : parseInt(btn.getAttribute("data-add") || "0", 10);
    return { label: label, amount: isNaN(amount) ? 0 : amount };
  }

  function readEstimate() {
    var service = chosen("service");
    var property = chosen("property");
    var timing = chosen("timing");
    var items = [];
    if (service) { items.push({ label: service.label, amount: service.amount, base: true }); }
    if (property) { items.push({ label: property.label, amount: property.amount }); }
    if (timing) { items.push({ label: timing.label, amount: timing.amount }); }
    var total = items.reduce(function (sum, item) { return sum + item.amount; }, 0);
    return { items: items, total: total, service: service, property: property, timing: timing };
  }

  function rowHTML(item) {
    var sign = item.base ? "" : "+";
    return "<li><span>" + item.label + "</span><span>" + sign + money(item.amount) + "</span></li>";
  }

  function message(est) {
    var parts = est.items.map(function (item) {
      return item.label + " " + (item.base ? money(item.amount) : "+" + money(item.amount));
    });
    return "Hi Trinity Oaks — estimate from your site: " + parts.join(" · ") + " = " + money(est.total) + ". Can you confirm?";
  }

  function render(pop) {
    var est = readEstimate();
    if (totalNum) {
      totalNum.textContent = money(est.total);
      if (pop) {
        totalNum.classList.add("pop");
        window.setTimeout(function () { totalNum.classList.remove("pop"); }, 240);
      }
    }
    var html = est.items.map(rowHTML).join("");
    if (totalList) { totalList.innerHTML = html; }
    if (drawerTotal) { drawerTotal.textContent = money(est.total); }
    if (drawerList) { drawerList.innerHTML = html; }
    var body = encodeURIComponent(message(est));
    if (drawerCall) { drawerCall.href = "tel:" + PHONE; }
    if (drawerText) { drawerText.href = "sms:" + PHONE + "?&body=" + body; }
  }

  $$('.pills').forEach(function (wrap) {
    wrap.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("button") : null;
      if (!btn || !wrap.contains(btn)) { return; }
      $$('button', wrap).forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      render(true);
    });
  });

  render(false);

  /* ---------- drawer ---------- */
  var drawer = $("#drawer");
  var scrim = $("#scrim");
  var drawerClose = $("#drawerClose");
  var lastFocus = null;

  function openDrawer() {
    if (!drawer) { return; }
    lastFocus = document.activeElement;
    render(false);
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    if (scrim) { scrim.hidden = false; scrim.classList.add("is-open"); }
    document.body.style.overflow = "hidden";
    if (drawerClose) { drawerClose.focus(); }
  }

  function closeDrawer() {
    if (!drawer) { return; }
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    if (scrim) {
      scrim.classList.remove("is-open");
      window.setTimeout(function () { if (!drawer.classList.contains("is-open")) { scrim.hidden = true; } }, 420);
    }
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }

  $$("[data-open-estimate]").forEach(function (btn) { btn.addEventListener("click", openDrawer); });
  if (drawerClose) { drawerClose.addEventListener("click", closeDrawer); }
  if (scrim) { scrim.addEventListener("click", closeDrawer); }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) { closeDrawer(); }
  });

  /* ---------- comparison slider ---------- */
  var wipeFrame = $("#wipeFrame");
  var wipe = $("#wipe");
  if (wipeFrame && wipe) {
    var syncWipe = function () { wipeFrame.style.setProperty("--wipe", wipe.value + "%"); };
    wipe.addEventListener("input", syncWipe);
    syncWipe();
  }
})();
