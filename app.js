"use strict";
/* ===== utilidades ===== */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch (e) { return d } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } } };
const ss = { g: k => { try { return sessionStorage.getItem(k) } catch (e) { return null } }, s: (k, v) => { try { sessionStorage.setItem(k, v) } catch (e) { } } };
const fmt = n => n.toFixed(1).replace(".", ",");
const hue = s => [...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) * 37 % 360;
const bg = s => `hsl(${hue(s)} 38% 32%)`;
const TIPO = { album: "Álbum", artist: "Artista", track: "Música" };
const GEN = ["Rock", "Pop", "Hip Hop", "MPB", "Eletrônica", "Jazz"];
const MAP = [[0, /rock|indie|punk|metal|grunge|alternative/], [1, /pop/], [2, /hip hop|rap|trap/], [3, /mpb|bossa|samba|tropic|pagode|brazilian/], [4, /electro|edm|house|techno|dance|synth/], [5, /jazz/]];
const gv = g => { const t = (g || []).join(" ").toLowerCase(), v = [0, 0, 0, 0, 0, 0]; MAP.forEach(([i, re]) => { if (re.test(t)) v[i] = 1 }); return v };

/* ===== catálogo de exemplo (offline) ===== */
const CAT = [
  ["Abbey Road", "The Beatles", [.9, .5, 0, 0, 0, 0]], ["Thriller", "Michael Jackson", [.2, .9, .2, 0, .2, 0]],
  ["To Pimp a Butterfly", "Kendrick Lamar", [0, .1, .9, 0, 0, .4]], ["Clube da Esquina", "Milton Nascimento", [.2, 0, 0, .9, 0, .2]],
  ["Random Access Memories", "Daft Punk", [0, .4, 0, 0, .9, 0]], ["Kind of Blue", "Miles Davis", [0, 0, 0, 0, 0, 1]],
  ["OK Computer", "Radiohead", [.9, 0, 0, 0, .3, 0]], ["Elis & Tom", "Elis Regina", [0, 0, 0, .9, 0, .5]]
].map(([nome, sub, p], i) => ({ k: "local:" + (i + 1), tipo: "album", nome, sub, p }));
const mkRev = (i, nota, txt, data) => ({ ...CAT[i], nota, txt, data, u: i + 1 });
const SEED = () => [mkRev(0, 4, "Lado B perfeito. As harmonias seguram a gente até o fim.", "2026-09-02"), mkRev(6, 5, "Obra-prima do rock alternativo, cada faixa se completa.", "2026-09-10"), mkRev(1, 2, "Conhecido demais, mas não me conquistou.", "2026-09-18")];

/* ===== estado ===== */
let R = store.get("rs2-rev", null) || SEED();
let P = store.get("rs2-prof", null);
const S = { name: null, vec: null, arts: [], tracks: [], err: "" };
let SEL = null, LAST = [], TAB = "rev", VIEW = "home", tmpPhoto = null;
const saveR = () => store.set("rs2-rev", R);

/* ===== cálculo do perfil e recomendação (mesma lógica do protótipo em C) ===== */
function perfil() { const p = Array(6).fill(0); R.forEach(r => (r.p || []).forEach((w, g) => p[g] += (r.nota - 3) * w)); return p }
function combinado() { const p = perfil(); if (!S.vec) return p; const m = Math.max(...p.map(Math.abs), 0) || 1, v = Math.max(...S.vec, 1); return p.map((x, i) => x / m + .5 * S.vec[i] / v) }
function cos(a, b) { let d = 0, x = 0, y = 0; a.forEach((v, i) => { d += v * b[i]; x += v * v; y += b[i] * b[i] }); return x && y ? d / Math.sqrt(x * y) : 0 }
const avg = k => { const l = R.filter(r => r.k === k); return l.length ? [l.reduce((s, r) => s + r.nota, 0) / l.length, l.length] : null };
const stars = (n, c) => { const r = Math.round(n); return `<span class="st" role="img" aria-label="${fmt(n)} de 5">${"★".repeat(r)}${"☆".repeat(5 - r)}</span>${c ? ` <span class="meta">${fmt(n)} (${c})</span>` : ""}` };

/* ===== navegação ===== */
function show(v) {
  VIEW = v;
  $$("[data-view]").forEach(s => s.hidden = s.dataset.view !== v);
  $("#sbtn").classList.toggle("on", v === "search"); $("#avbtn").classList.toggle("on", v === "profile");
  if (v === "home") { renderRate(); renderCat(); renderRec() }
  if (v === "profile") renderProfile();
  fillSp(); window.scrollTo(0, 0);
}
function renderAvatar() { $("#avbtn").innerHTML = P && P.photo ? `<img src="${esc(P.photo)}" alt="">` : esc(((P && P.name) || "?")[0].toUpperCase()) }

/* ===== avaliação por estrelas ===== */
function renderRate(msg) {
  $("#rate").innerHTML = `<h2>Sistema de avaliação</h2>` + (SEL ? `<form class="form" id="rf"><div><b>${esc(SEL.nome)}</b><span class="tag">${TIPO[SEL.tipo]}</span><div class="meta">${esc(SEL.sub)}</div></div>
<fieldset class="rate" aria-label="Nota de 1 a 5 estrelas">${[5, 4, 3, 2, 1].map(n => `<input type="radio" name="nota" id="s${n}" value="${n}"><label for="s${n}" title="${n} estrela${n > 1 ? "s" : ""}"><span class="sr">${n} estrelas</span>★</label>`).join("")}</fieldset>
<div><label for="rt">Sua resenha</label><textarea id="rt" maxlength="300" placeholder="O que você achou?"></textarea></div>
<button class="btn acc" data-act="pub" type="button">Publicar resenha</button><div class="err" role="status">${msg || ""}</div></form>`
    : `<p class="meta">Escolha uma obra no catálogo ou pesquise no Spotify para avaliar de 1 a 5 estrelas.</p><div class="err" role="status" style="color:var(--acc)">${msg || ""}</div>`);
}
async function publish() {
  const n = $("#rf input:checked"), txt = $("#rt").value.trim();
  if (!n) return renderRateKeep("Escolha de 1 a 5 estrelas.");
  if (!txt) return renderRateKeep("Escreva o texto da resenha.");
  let p = SEL.p, g = SEL.g;
  if (!p) { if (!g) { try { g = (await api("/artists/" + SEL.aid, ss.g("sp_tok"))).genres || [] } catch (e) { g = [] } } p = gv(g) }
  R.push({ k: SEL.k, tipo: SEL.tipo, nome: SEL.nome, sub: SEL.sub, p, nota: +n.value, txt, data: new Date().toISOString().slice(0, 10), u: Date.now() });
  saveR(); const nome = SEL.nome; SEL = null; renderRate("Resenha de “" + esc(nome) + "” publicada. Veja no seu perfil."); renderCat(); renderRec();
}
function renderRateKeep(m) { const n = $("#rf input:checked"), t = $("#rt").value, v = n && n.value; renderRate(m); if (v) $("#s" + v).checked = true; $("#rt").value = t }

/* ===== catálogo e descobre ===== */
function renderCat() {
  $("#cat").innerHTML = CAT.map(a => { const m = avg(a.k); return `<article class="card"><div class="cv" style="background:${bg(a.nome)}">${esc(a.nome)}</div><div class="cb"><span class="meta">${esc(a.sub)}</span>${m ? stars(m[0], m[1]) : '<span class="meta">Sem notas ainda</span>'}<button class="btn" data-act="pick" data-v="${a.k}">Avaliar</button></div></article>` }).join("");
}
function renderRec() {
  if (!R.length && !S.vec) { $("#rec").innerHTML = '<p class="meta">Avalie ao menos uma obra para receber sugestões.</p>'; return }
  const p = combinado(), done = new Set(R.map(r => r.k));
  const l = CAT.filter(a => !done.has(a.k)).map(a => ({ a, s: cos(p, a.p) })).sort((x, y) => y.s - x.s).slice(0, 3);
  $("#rec").innerHTML = l.map(({ a, s }) => { const g = a.p.map((w, i) => p[i] * w).reduce((m, v, i, ar) => v > ar[m] ? i : m, 0);
    return `<div class="row" style="align-items:flex-start;flex-direction:column;gap:4px"><b>${esc(a.nome)}</b><span class="meta">${esc(a.sub)} · ${Math.max(0, Math.round(s * 100))}% de afinidade</span><span class="why">Porque ${R.length ? "você avaliou bem obras de" : "seus artistas mais ouvidos têm muito de"} ${GEN[g]}.</span></div>` }).join("");
}

/* ===== perfil estilo Instagram ===== */
function renderProfile() {
  const root = $('[data-view="profile"]'), n = R.length, m = n ? R.reduce((s, r) => s + r.nota, 0) / n : 0;
  const ord = [...R].sort((a, b) => (b.data + b.u).localeCompare(a.data + a.u));
  const av = P && P.photo ? `<img src="${esc(P.photo)}" alt="Foto de perfil">` : esc(((P && P.name) || "?")[0].toUpperCase());
  let body = "";
  if (TAB === "rev") body = n ? `<div class="tiles">${ord.map(r => `<article class="tile" style="background:${bg(r.nome)}"><button class="x" data-act="del" data-v="${r.u}" aria-label="Excluir resenha de ${esc(r.nome)}">×</button><span class="meta" style="color:#ffffffcc">${TIPO[r.tipo]} · ${r.data.split("-").reverse().join("/")}</span><b>${esc(r.nome)}</b>${stars(r.nota)}<p>${esc(r.txt)}</p></article>`).join("")}</div>` : '<p class="meta" style="text-align:center;margin-top:24px">Você ainda não fez resenhas.</p>';
  else if (!S.name) body = '<div class="spslot" style="margin-top:18px"></div>';
  else if (TAB === "art") body = `<div class="arts">${S.arts.map(a => `<div>${a.img ? `<img src="${esc(a.img)}" alt="">` : '<div class="ph"></div>'}<b>${esc(a.n)}</b><div class="meta">${esc(a.g.slice(0, 2).join(", "))}</div></div>`).join("") || '<p class="meta">O Spotify ainda não tem dados suficientes.</p>'}</div>`;
  else body = `<div style="margin-top:18px">${S.tracks.map((t, i) => `<div class="row"><i>${i + 1}</i>${t.img ? `<img src="${esc(t.img)}" alt="">` : ""}<div><b>${esc(t.n)}</b><div class="meta">${esc(t.a)}</div></div></div>`).join("") || '<p class="meta">O Spotify ainda não tem dados suficientes.</p>'}</div>`;
  root.innerHTML = `<div class="phead"><div class="pav">${av}</div><div class="pinfo"><h1>@${esc(P ? P.user : "")}</h1><button class="btn ghost" data-act="edit">Editar perfil</button>
<div class="stats"><div><b>${n}</b><span class="meta">resenhas</span></div><div><b>${n ? fmt(m) : "–"}</b><span class="meta">nota média</span></div><div><b>${S.name ? "Sim" : "Não"}</b><span class="meta">Spotify</span></div></div>
<div><b>${esc(P ? P.name : "")}</b></div><div style="white-space:pre-wrap">${esc(P ? P.bio : "")}</div></div></div>
<div class="tabs" role="tablist">${[["rev", "Resenhas"], ["art", "Artistas mais ouvidos"], ["trk", "Músicas mais ouvidas"]].map(([k, l]) => `<button role="tab" aria-selected="${TAB === k}" data-act="tab" data-v="${k}">${l}</button>`).join("")}</div>${body}`;
}
function openProfile(first) {
  $("#pmt").textContent = first ? "Crie seu perfil" : "Editar perfil";
  $("#puser").value = P ? P.user : ""; $("#pname").value = P ? P.name : S.name || ""; $("#pbio").value = P ? P.bio : "";
  tmpPhoto = P ? P.photo : null; prevPhoto(); $("#bcnt").textContent = $("#pbio").value.length + "/150"; $("#pm").showModal();
}
function prevPhoto() { $("#pprev").innerHTML = tmpPhoto ? `<img src="${esc(tmpPhoto)}" alt="">` : esc(($("#pname").value || "?")[0].toUpperCase()) }
function toDataURL(file) {
  return new Promise(ok => { const im = new Image(), fr = new FileReader(); fr.onload = () => { im.onload = () => { const c = document.createElement("canvas"), s = Math.min(im.width, im.height); c.width = c.height = 256; c.getContext("2d").drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 256, 256); ok(c.toDataURL("image/jpeg", .82)) }; im.src = fr.result }; fr.readAsDataURL(file) });
}

/* ===== Spotify: login (PKCE), busca e dados do usuário ===== */
const REDIR = location.origin + location.pathname;
const lsg = k => { try { return localStorage.getItem(k) || "" } catch (e) { return "" } };
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function api(path, tok) { const r = await fetch("https://api.spotify.com/v1" + path, { headers: { Authorization: "Bearer " + tok } }); if (!r.ok) throw new Error(r.status); return r.json() }
async function login(cid) {
  if (!cid) { S.err = "Cole o Client ID do seu app."; return fillSp() }
  try { localStorage.setItem("sp_cid", cid) } catch (e) { }
  const ver = b64(crypto.getRandomValues(new Uint8Array(48))); ss.s("sp_ver", ver);
  const ch = b64(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ver)));
  location.href = "https://accounts.spotify.com/authorize?" + new URLSearchParams({ response_type: "code", client_id: cid, scope: "user-top-read", redirect_uri: REDIR, code_challenge_method: "S256", code_challenge: ch });
}
async function spLoad() {
  let tok = ss.g("sp_tok"); const q = new URLSearchParams(location.search);
  if (q.get("error")) { S.err = "Acesso negado no Spotify."; history.replaceState({}, "", REDIR) }
  if (q.get("code")) {
    history.replaceState({}, "", REDIR);
    try {
      const r = await fetch("https://accounts.spotify.com/api/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", code: q.get("code"), redirect_uri: REDIR, client_id: lsg("sp_cid"), code_verifier: ss.g("sp_ver") || "" }) });
      const j = await r.json(); if (!j.access_token) throw new Error(j.error_description || "falha no login"); tok = j.access_token; ss.s("sp_tok", tok);
    } catch (e) { S.err = "Não foi possível entrar: " + e.message; return fillSp() }
  }
  if (!tok) return fillSp();
  try {
    const me = await api("/me", tok); S.name = me.display_name || me.id;
    const ta = await api("/me/top/artists?limit=12&time_range=medium_term", tok), tt = await api("/me/top/tracks?limit=10&time_range=medium_term", tok);
    S.arts = ta.items.map(a => ({ n: a.name, g: a.genres || [], img: (a.images || []).slice(-2)[0] && a.images.slice(-2)[0].url }));
    S.tracks = tt.items.map(t => ({ n: t.name, a: t.artists.map(x => x.name).join(", "), img: ((t.album || {}).images || []).slice(-1)[0] && t.album.images.slice(-1)[0].url }));
    const v = Array(6).fill(0); S.arts.forEach(a => { const g = a.g.join(" ").toLowerCase(); MAP.forEach(([i, re]) => { if (re.test(g)) v[i]++ }) }); S.vec = v; S.err = "";
    if (!P) { $("#pname").value = S.name }
  } catch (e) { S.err = e.message === "401" ? "Sessão expirada. Conecte de novo." : "O Spotify recusou o acesso (" + e.message + "). No modo de desenvolvimento, seu e-mail precisa estar na lista de usuários do app."; ss.s("sp_tok", "") }
  show(VIEW);
}
function spCard() {
  if (S.name) return `<div class="box row" style="justify-content:space-between"><span>Spotify conectado: <b>${esc(S.name)}</b>. Os dados ficam só nesta sessão.</span><button class="btn ghost" data-act="out">Desconectar</button></div>`;
  if (location.protocol === "file:") return `<div class="box"><b>Spotify</b><p class="meta">Para conectar, abra por um servidor local: no terminal, dentro da pasta, <code>python -m http.server 8080</code>, e acesse <code>http://127.0.0.1:8080/demo.html</code>.</p></div>`;
  return `<div class="box form"><b>Conectar ao Spotify</b><span class="meta">Cadastre <code>${esc(REDIR)}</code> como Redirect URI no painel do seu app.</span><div class="pick"><input class="cid" value="${esc(lsg("sp_cid"))}" placeholder="Client ID" aria-label="Client ID"><button class="btn acc" data-act="go">Conectar</button></div>${S.err ? `<div class="err" role="alert">${esc(S.err)}</div>` : ""}</div>`;
}
const fillSp = () => $$(".spslot").forEach(e => e.innerHTML = spCard());
async function buscar(e) {
  e.preventDefault(); const q = $("#q").value.trim(), tok = ss.g("sp_tok"), out = $("#res"); if (!q) return;
  if (!tok) { out.innerHTML = '<p class="meta">Conecte ao Spotify (no seu perfil) para pesquisar.</p>'; return }
  out.innerHTML = '<p class="meta">Buscando…</p>';
  try {
    const j = await api("/search?" + new URLSearchParams({ q, type: $("#ty").value, limit: 6 }), tok), L = [], im = a => (a || []).slice(-2)[0] && a.slice(-2)[0].url;
    ((j.albums || {}).items || []).filter(Boolean).forEach(x => L.push({ k: "album:" + x.id, tipo: "album", nome: x.name, sub: x.artists.map(a => a.name).join(", ") + (x.release_date ? " · " + x.release_date.slice(0, 4) : ""), img: im(x.images), aid: x.artists[0] && x.artists[0].id, url: (x.external_urls || {}).spotify }));
    ((j.artists || {}).items || []).filter(Boolean).forEach(x => L.push({ k: "artist:" + x.id, tipo: "artist", nome: x.name, sub: (x.genres || []).slice(0, 2).join(", ") || "Artista", img: im(x.images), aid: x.id, g: x.genres || [], url: (x.external_urls || {}).spotify }));
    ((j.tracks || {}).items || []).filter(Boolean).forEach(x => L.push({ k: "track:" + x.id, tipo: "track", nome: x.name, sub: x.artists.map(a => a.name).join(", ") + " · " + (x.album || {}).name, img: im((x.album || {}).images), aid: x.artists[0] && x.artists[0].id, url: (x.external_urls || {}).spotify }));
    LAST = L;
    out.innerHTML = L.length ? L.map(it => { const m = avg(it.k); return `<article class="card"><div class="cv" style="background:${it.img ? `center/cover url('${esc(it.img)}')` : bg(it.nome)}"></div><div class="cb"><b>${esc(it.nome)}</b><span class="meta">${TIPO[it.tipo]} · ${esc(it.sub)}</span>${m ? stars(m[0], m[1]) : '<span class="meta">Sem resenhas ainda</span>'}<button class="btn" data-act="pick" data-v="${esc(it.k)}">Avaliar</button>${it.url ? `<a class="meta" href="${esc(it.url)}" target="_blank" rel="noopener">Abrir no Spotify</a>` : ""}</div></article>` }).join("") : '<p class="meta">Nada encontrado.</p>';
  } catch (err) { out.innerHTML = `<p class="err" role="alert">${err.message === "401" ? "Sessão expirada. Conecte de novo." : "A busca falhou (" + esc(err.message) + ")."}</p>` }
}

/* ===== eventos ===== */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) return; const a = b.dataset.act, v = b.dataset.v;
  if (a === "view") show(v);
  else if (a === "pick") { SEL = CAT.find(x => x.k === v) || LAST.find(x => x.k === v); show("home"); const t = $("#rf"); if (t) t.scrollIntoView({ behavior: "smooth", block: "center" }) }
  else if (a === "pub") publish();
  else if (a === "del") { R = R.filter(r => String(r.u) !== v); saveR(); renderProfile() }
  else if (a === "tab") { TAB = v; renderProfile(); fillSp() }
  else if (a === "edit") openProfile(false);
  else if (a === "close") { $("#pm").close(); if (!P) { P = { user: "ouvinte", name: "Ouvinte", bio: "", photo: null }; store.set("rs2-prof", P); renderAvatar() } }
  else if (a === "go") login(b.closest(".box").querySelector(".cid").value.trim());
  else if (a === "out") { ss.s("sp_tok", ""); S.name = null; S.vec = null; S.arts = []; S.tracks = []; show(VIEW) }
});
$("#sf").addEventListener("submit", buscar);
$("#pf").addEventListener("submit", e => {
  e.preventDefault();
  P = { user: $("#puser").value.trim(), name: $("#pname").value.trim(), bio: $("#pbio").value.trim(), photo: tmpPhoto };
  store.set("rs2-prof", P); $("#pm").close(); renderAvatar(); if (VIEW === "profile") renderProfile();
});
$("#pfoto").addEventListener("change", async e => { const f = e.target.files[0]; if (f) { tmpPhoto = await toDataURL(f); prevPhoto() } });
$("#pbio").addEventListener("input", e => $("#bcnt").textContent = e.target.value.length + "/150");
$("#pname").addEventListener("input", () => { if (!tmpPhoto) prevPhoto() });

/* ===== início ===== */
renderAvatar(); show("home"); spLoad();
if (!P) openProfile(true);
