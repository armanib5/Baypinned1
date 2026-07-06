/* Vendor Hub — data, rendering, and interactions.
   Depends on globals from js/app.js (C, evts, openDetail, showMap) and
   js/storage.js (Storage). Loaded after both. */
var vendors = [];
var vActiveCat = "all";
var vSearchTerm = "";
var vShowFavOnly = false;
var VFAV_KEY = "vendor-favs-v1";
var VDATA_KEY = "vendors-v1";

function loadVendors() {
  vendors = Storage.get(VDATA_KEY, null) || JSON.parse(JSON.stringify(VENDOR_DEF));
}
function saveVendors() { Storage.set(VDATA_KEY, vendors); }

function getFavs() { return Storage.get(VFAV_KEY, []); }
function isFav(id) { return getFavs().indexOf(id) >= 0; }
function toggleFav(id) {
  var favs = getFavs();
  var i = favs.indexOf(id);
  if (i >= 0) favs.splice(i, 1); else favs.push(id);
  Storage.set(VFAV_KEY, favs);
  renderVendorHub();
}

function vendorEvents(v) {
  return (v.events || []).map(function (id) {
    return evts.find(function (e) { return e.id === id; });
  }).filter(Boolean);
}

function vBoostLabel(tier) {
  var labels = { flash: "Flash Boost", anchor: "Event Anchor", hood: "Neighborhood" };
  return labels[tier] || "Boosted";
}

function renderVendorHub() {
  var grid = document.getElementById("vGrid");
  if (!grid) return;
  grid.innerHTML = "";

  var list = vendors.filter(function (v) {
    if (vShowFavOnly && !isFav(v.id)) return false;
    if (vActiveCat !== "all" && v.cat !== vActiveCat) return false;
    if (vSearchTerm) {
      var hay = (v.name + " " + v.desc).toLowerCase();
      if (hay.indexOf(vSearchTerm.toLowerCase()) < 0) return false;
    }
    return true;
  });

  list.sort(function (a, b) {
    var av = (a.featured ? 2 : 0) + (a.boost && a.boost.active ? 1 : 0);
    var bv = (b.featured ? 2 : 0) + (b.boost && b.boost.active ? 1 : 0);
    if (bv !== av) return bv - av;
    return a.name.localeCompare(b.name);
  });

  if (!list.length) {
    var none = document.createElement("div");
    none.style.cssText = "grid-column:1/-1;color:rgba(218,184,112,.4);padding:20px;font-size:13px;";
    none.textContent = "No vendors match yet.";
    grid.appendChild(none);
  } else {
    list.forEach(function (v) { grid.appendChild(mkVendorCard(v)); });
  }

  var addHu = document.createElement("div"); addHu.className = "hu";
  var afc = document.createElement("div"); afc.className = "afc";
  afc.innerHTML = "<div class='ap'>+</div><div class='al'>Add Your Business</div>";
  afc.addEventListener("click", function () { openVendorForm(""); });
  addHu.appendChild(afc);
  grid.appendChild(addHu);

  renderVendorPins();
}

function mkVendorCard(v) {
  var cat = C[v.cat] || { l: v.cat, i: "&#128204;", c: "#666" };

  var hu = document.createElement("div"); hu.className = "hu";
  var thr = document.createElement("div"); thr.className = "thr";
  var flip = document.createElement("div"); flip.className = "vflip"; flip.id = "vflip-" + v.id;
  var inner = document.createElement("div"); inner.className = "vflip-inner";

  var front = mkVendorFront(v, cat, flip);
  var back = mkVendorBack(v, flip);

  inner.appendChild(front); inner.appendChild(back);
  flip.appendChild(inner);
  hu.appendChild(thr); hu.appendChild(flip);
  return hu;
}

function mkVendorFront(v, cat, flipEl) {
  var front = document.createElement("div"); front.className = "vcard vcard-front";

  var img = document.createElement("div"); img.className = "vimg" + (v.cover ? " hp" : "");
  if (v.cover) { img.style.backgroundImage = "url(" + v.cover + ")"; img.style.backgroundSize = "cover"; img.style.backgroundPosition = "center"; }
  else { img.innerHTML = v.logo ? v.logo : cat.i; }
  if (v.featured) { var fb = document.createElement("div"); fb.className = "vbadge feat"; fb.textContent = "Featured"; img.appendChild(fb); }
  if (v.boost && v.boost.active) { var bb = document.createElement("div"); bb.className = "vbadge boost"; bb.textContent = vBoostLabel(v.boost.tier); img.appendChild(bb); }

  var body = document.createElement("div"); body.className = "vbody";
  var rib = document.createElement("span"); rib.className = "rib " + v.cat; rib.textContent = cat.l;
  var h3 = document.createElement("h3"); h3.textContent = v.name;
  var rate = document.createElement("div"); rate.className = "vrate"; rate.textContent = "Rating coming soon";
  body.appendChild(rib); body.appendChild(h3); body.appendChild(rate);

  var hint = document.createElement("div"); hint.className = "vhint"; hint.textContent = "Tap to flip";

  front.appendChild(img); front.appendChild(body); front.appendChild(hint);
  front.addEventListener("click", function () { flipEl.classList.add("flipped"); });
  return front;
}

function mkVendorBack(v, flipEl) {
  var back = document.createElement("div"); back.className = "vcard vcard-back";

  var xb = document.createElement("button"); xb.className = "vback-x"; xb.textContent = "X";
  xb.addEventListener("click", function (e) { e.stopPropagation(); flipEl.classList.remove("flipped"); });
  back.appendChild(xb);

  var scroll = document.createElement("div"); scroll.className = "vback-scroll";

  var name = document.createElement("div"); name.className = "vback-name"; name.textContent = v.name;
  scroll.appendChild(name);

  var desc = document.createElement("p"); desc.className = "vback-desc"; desc.textContent = v.desc || "No description yet.";
  scroll.appendChild(desc);

  var crow = document.createElement("div"); crow.className = "vcontact-row";
  if (v.contact && v.contact.phone) { var a = document.createElement("a"); a.className = "ab blue"; a.href = "tel:" + v.contact.phone; a.textContent = "Call"; crow.appendChild(a); }
  if (v.contact && v.contact.email) { var a2 = document.createElement("a"); a2.className = "ab gray"; a2.href = "mailto:" + v.contact.email; a2.textContent = "Email"; crow.appendChild(a2); }
  if (v.website) { var a3 = document.createElement("a"); a3.className = "ab green"; a3.href = v.website; a3.target = "_blank"; a3.textContent = "Website"; crow.appendChild(a3); }
  if (crow.children.length) scroll.appendChild(crow);

  var socialKeys = Object.keys(v.social || {}).filter(function (k) { return v.social[k]; });
  if (socialKeys.length) {
    var srow = document.createElement("div"); srow.className = "vsocial-row";
    socialKeys.forEach(function (k) {
      var s = document.createElement("a"); s.href = v.social[k]; s.target = "_blank"; s.className = "vsoc";
      s.textContent = k.charAt(0).toUpperCase() + k.slice(1);
      srow.appendChild(s);
    });
    scroll.appendChild(srow);
  }

  var hoursLbl = document.createElement("div"); hoursLbl.className = "vsec-lbl"; hoursLbl.textContent = "Hours";
  scroll.appendChild(hoursLbl);
  var hgrid = document.createElement("div"); hgrid.className = "vhours";
  [["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"]].forEach(function (d) {
    var row = document.createElement("div"); row.className = "vhrow";
    var l = document.createElement("span"); l.textContent = d[1];
    var r = document.createElement("span"); r.textContent = (v.hours && v.hours[d[0]]) || "Closed";
    row.appendChild(l); row.appendChild(r);
    hgrid.appendChild(row);
  });
  scroll.appendChild(hgrid);

  var vEvts = vendorEvents(v);
  if (vEvts.length) {
    var eh = document.createElement("div"); eh.className = "vsec-lbl"; eh.textContent = "Upcoming Events";
    scroll.appendChild(eh);
    vEvts.forEach(function (ev) {
      var el = document.createElement("div"); el.className = "vevt";
      el.textContent = ev.t + " — " + ev.w;
      el.addEventListener("click", function (e) { e.stopPropagation(); cls(); openDetail(ev.id); });
      scroll.appendChild(el);
    });
  }

  var locLbl = document.createElement("div"); locLbl.className = "vsec-lbl"; locLbl.textContent = "Location";
  scroll.appendChild(locLbl);
  var loc = document.createElement("div"); loc.className = "vloc-row"; loc.textContent = v.address || "Address on file";
  scroll.appendChild(loc);

  var btnrow = document.createElement("div"); btnrow.className = "vbtnrow";
  var mapBtn = document.createElement("button"); mapBtn.className = "ab blue"; mapBtn.textContent = "View on Map";
  mapBtn.addEventListener("click", function (e) { e.stopPropagation(); showVendorOnMap(v.id); });
  var dirBtn = document.createElement("a"); dirBtn.className = "ab green"; dirBtn.target = "_blank";
  dirBtn.href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(v.address || v.name);
  dirBtn.textContent = "Directions";
  btnrow.appendChild(mapBtn); btnrow.appendChild(dirBtn);
  scroll.appendChild(btnrow);

  var anLbl = document.createElement("div"); anLbl.className = "vsec-lbl"; anLbl.textContent = "Vendor Analytics";
  scroll.appendChild(anLbl);
  var an = document.createElement("div"); an.className = "vanalytics";
  an.textContent = "Profile views, favorites, and click-throughs coming soon.";
  scroll.appendChild(an);

  back.appendChild(scroll);

  var footer = document.createElement("div"); footer.className = "vback-footer";
  var favBtn = document.createElement("button");
  favBtn.className = "ab " + (isFav(v.id) ? "dark" : "gray");
  favBtn.textContent = isFav(v.id) ? "Saved" : "Save";
  favBtn.addEventListener("click", function (e) { e.stopPropagation(); toggleFav(v.id); });
  var shareBtn = document.createElement("button"); shareBtn.className = "ab gray"; shareBtn.textContent = "Share";
  shareBtn.addEventListener("click", function (e) { e.stopPropagation(); shareVendor(v.id); });
  var msgBtn = document.createElement("button"); msgBtn.className = "ab gray"; msgBtn.disabled = true;
  msgBtn.style.opacity = ".5"; msgBtn.textContent = "Message (Soon)";
  var editBtn = document.createElement("button"); editBtn.className = "ab green"; editBtn.textContent = "Edit";
  editBtn.addEventListener("click", function (e) { e.stopPropagation(); openVendorForm(v.cat, v.id); });
  footer.appendChild(favBtn); footer.appendChild(shareBtn); footer.appendChild(msgBtn); footer.appendChild(editBtn);
  back.appendChild(footer);

  return back;
}

function shareVendor(id) {
  var v = vendors.find(function (x) { return x.id === id; }); if (!v) return;
  if (navigator.share) navigator.share({ title: v.name, text: v.desc, url: location.href });
  else { try { navigator.clipboard.writeText(location.href).then(function () { alert("Link copied!"); }); } catch (e) { alert("Copy the URL from your browser bar."); } }
}

function showVendorOnMap(id) {
  showMap();
  hVendorPin(id);
}

/* ── MAP PINS (square markers, distinct from the round event pins) ── */
function renderVendorPins() {
  var g = document.getElementById("vPins"); if (!g) return;
  g.innerHTML = "";
  vendors.filter(function (v) { return v.mx && v.my; }).forEach(function (v) {
    var cat = C[v.cat] || { c: "#666", i: "&#128204;" };
    var pg = document.createElementNS("http://www.w3.org/2000/svg", "g");
    pg.setAttribute("class", "vp"); pg.setAttribute("id", "vpin-" + v.id);
    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", v.mx - 9); rect.setAttribute("y", v.my - 9);
    rect.setAttribute("width", "18"); rect.setAttribute("height", "18"); rect.setAttribute("rx", "4");
    rect.setAttribute("fill", cat.c); rect.setAttribute("stroke", "white"); rect.setAttribute("stroke-width", "2.5");
    rect.setAttribute("opacity", v.featured ? "1" : "0.82");
    var txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", v.mx); txt.setAttribute("y", v.my + 4);
    txt.setAttribute("text-anchor", "middle"); txt.setAttribute("font-size", "10");
    txt.style.pointerEvents = "none"; txt.innerHTML = cat.i;
    pg.appendChild(rect); pg.appendChild(txt);
    pg.addEventListener("click", function () { showVendors(); flipVendorCard(v.id); });
    g.appendChild(pg);
  });
}
function hVendorPin(id) {
  document.querySelectorAll(".vp.pulse").forEach(function (p) { p.classList.remove("pulse"); });
  var p = document.getElementById("vpin-" + id); if (p) p.classList.add("pulse");
}
function flipVendorCard(id) {
  var el = document.getElementById("vflip-" + id);
  if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("flipped"); }
}

/* ── SEARCH / FILTER TOOLBAR ── */
function vSetCat(btn, cat) {
  vActiveCat = cat;
  var wrap = btn.parentElement;
  wrap.querySelectorAll(".cc").forEach(function (b) { b.classList.remove("on"); });
  btn.classList.add("on");
  renderVendorHub();
}
function vSetSearch(val) { vSearchTerm = val; renderVendorHub(); }
function vToggleFavFilter(btn) {
  vShowFavOnly = !vShowFavOnly;
  btn.classList.toggle("on", vShowFavOnly);
  renderVendorHub();
}

/* ── NAV ── */
function showVendors() {
  document.getElementById("bView").style.display = "none";
  document.getElementById("tdwrap").style.display = "none";
  document.getElementById("mapSec").style.display = "none";
  document.getElementById("vendorSec").style.display = "block";
  document.getElementById("adminSec").style.display = "none";
  document.getElementById("nV").classList.add("on");
  document.getElementById("nB").classList.remove("on");
  document.getElementById("nM").classList.remove("on");
  renderVendorHub();
}

/* ── ADMIN MODERATION PLACEHOLDER ──
   Hidden behind ?admin=1 until real accounts/roles exist. Lets a site
   operator approve pending vendor listings and flip boost tiers on/off. */
function maybeShowAdminNav() {
  if (location.search.indexOf("admin=1") >= 0) {
    document.getElementById("nAdmin").style.display = "inline-block";
  }
}
function showAdmin() {
  document.getElementById("bView").style.display = "none";
  document.getElementById("tdwrap").style.display = "none";
  document.getElementById("mapSec").style.display = "none";
  document.getElementById("vendorSec").style.display = "none";
  document.getElementById("adminSec").style.display = "block";
  renderAdminList();
}
function renderAdminList() {
  var list = document.getElementById("adminList");
  if (!list) return;
  list.innerHTML = "";
  vendors.forEach(function (v) {
    var row = document.createElement("div");
    row.style.cssText = "background:rgba(253,246,224,.06);border:1px solid rgba(218,184,112,.2);border-radius:6px;padding:10px 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;";

    var name = document.createElement("div");
    name.style.cssText = "font-family:'Special Elite',monospace;font-size:12.5px;color:var(--cl);flex:1;min-width:140px;";
    name.textContent = v.name + " (" + v.status + ")";
    row.appendChild(name);

    var approveBtn = document.createElement("button");
    approveBtn.className = "nb"; approveBtn.textContent = "Approve";
    approveBtn.onclick = function () { v.status = "approved"; saveVendors(); renderAdminList(); };
    var rejectBtn = document.createElement("button");
    rejectBtn.className = "nb"; rejectBtn.textContent = "Reject";
    rejectBtn.onclick = function () { v.status = "rejected"; saveVendors(); renderAdminList(); };
    row.appendChild(approveBtn); row.appendChild(rejectBtn);

    ["flash", "anchor", "hood"].forEach(function (tier) {
      var isOn = v.boost && v.boost.active && v.boost.tier === tier;
      var btn = document.createElement("button");
      btn.className = "nb" + (isOn ? " on" : "");
      btn.textContent = vBoostLabel(tier);
      btn.onclick = function () {
        if (isOn) v.boost = { tier: null, active: false, until: "", radius: null };
        else v.boost = { tier: tier, active: true, until: "", radius: tier === "hood" ? 1 : null };
        saveVendors(); renderAdminList();
      };
      row.appendChild(btn);
    });

    list.appendChild(row);
  });
}

/* ── ADD / EDIT FORM (a lightweight vendor dashboard placeholder — no
   real auth yet, so anyone can edit any listing, same permission model
   the existing event flyer form already uses) ── */
function openVendorForm(defCat, vid) {
  var fp = document.getElementById("vfrmPanel");
  var opts = Object.entries(C).map(function (e) { return "<option value='" + e[0] + "'>" + e[1].l + "</option>"; }).join("");
  fp.innerHTML = "<div class='fi'><h2>" + (vid ? "Edit Your Business" : "Add Your Business") + "</h2>" +
    "<label>Business Name *</label><input id='vn' type='text' placeholder='e.g. Xiong Farms'>" +
    "<label>Category</label><select id='vcat'>" + opts + "</select>" +
    "<label>Description</label><textarea id='vd' placeholder='Tell customers about your business...'></textarea>" +
    "<label>Address</label><input id='va' type='text' placeholder='Street address'>" +
    "<label>Phone</label><input id='vph' type='text' placeholder='(408) 555-0100'>" +
    "<label>Email</label><input id='vem' type='text' placeholder='hello@business.com'>" +
    "<label>Website</label><input id='vwb' type='text' placeholder='https://'>" +
    "<label>Instagram</label><input id='vig' type='text' placeholder='https://instagram.com/yourbiz'>" +
    "<label>Logo (optional upload)</label><input id='vlg' type='file' accept='image/*'>" +
    "<label>Cover Photo (optional upload)</label><input id='vcv' type='file' accept='image/*'>" +
    "<div class='facts'><button class='bcan' id='vfrmCan'>Cancel</button><button class='bsub' id='vfrmSub'>Save Business</button></div>" +
    "</div>";
  fp.dataset.vid = vid || "";
  if (defCat) document.getElementById("vcat").value = defCat;
  document.getElementById("vfrmCan").onclick = vCls;
  document.getElementById("vfrmSub").onclick = subVendorForm;
  if (vid) {
    var v = vendors.find(function (x) { return x.id === vid; });
    if (v) {
      function sv(i, val) { var el = document.getElementById(i); if (el) el.value = val || ""; }
      sv("vn", v.name); sv("vd", v.desc); sv("va", v.address);
      sv("vph", v.contact && v.contact.phone); sv("vem", v.contact && v.contact.email);
      sv("vwb", v.website); sv("vig", v.social && v.social.instagram);
      document.getElementById("vcat").value = v.cat;
    }
  }
  document.getElementById("vfrmOv").classList.add("on");
}

function vCls() {
  document.getElementById("vfrmOv").classList.remove("on");
  document.getElementById("vfrmPanel").innerHTML = "";
}

function subVendorForm() {
  var name = document.getElementById("vn").value.trim();
  if (!name) { alert("Please add a business name."); return; }
  var vid = document.getElementById("vfrmPanel").dataset.vid;
  var cat = document.getElementById("vcat").value;
  var v = {
    id: vid || "vu" + Date.now(), name: name, cat: cat,
    desc: document.getElementById("vd").value.trim(),
    address: document.getElementById("va").value.trim(),
    contact: { phone: document.getElementById("vph").value.trim(), email: document.getElementById("vem").value.trim() },
    website: document.getElementById("vwb").value.trim(),
    social: { instagram: document.getElementById("vig").value.trim() },
    hours: {}, featured: false, verified: false,
    boost: { tier: null, active: false, until: "", radius: null },
    mx: 380 + (Math.random() - 0.5) * 120, my: 420 + (Math.random() - 0.5) * 80,
    city: "sj", events: [], gallery: [], logo: "", cover: "", status: "pending"
  };
  function done() {
    if (vid) {
      var i = vendors.findIndex(function (x) { return x.id === vid; });
      if (i >= 0) {
        var old = vendors[i];
        v.hours = old.hours; v.featured = old.featured; v.boost = old.boost;
        v.mx = old.mx; v.my = old.my; v.events = old.events; v.gallery = old.gallery; v.status = old.status;
        v.logo = v.logo || old.logo; v.cover = v.cover || old.cover;
        vendors[i] = v;
      }
    } else vendors.push(v);
    saveVendors(); vCls(); renderVendorHub();
  }
  var logoFile = document.getElementById("vlg").files[0];
  var coverFile = document.getElementById("vcv").files[0];
  if (coverFile) {
    var rd = new FileReader();
    rd.onload = function (e) {
      v.cover = e.target.result;
      if (logoFile) { var rd2 = new FileReader(); rd2.onload = function (e2) { v.logo = e2.target.result; done(); }; rd2.readAsDataURL(logoFile); }
      else done();
    };
    rd.readAsDataURL(coverFile);
  } else if (logoFile) {
    var rd3 = new FileReader(); rd3.onload = function (e3) { v.logo = e3.target.result; done(); }; rd3.readAsDataURL(logoFile);
  } else done();
}

document.addEventListener("DOMContentLoaded", function () {
  loadVendors();
  renderVendorHub();
  maybeShowAdminNav();
});
