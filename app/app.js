const LADDER_URL = "https://wdcpickleball.com/app/ladder";
const LADDER_CACHE_NAME = "pickleball-round-robin-ladder-v1";
let activeDragName = null;
let activeDropTarget = null;

const state = {
  players: [],
  registeredCount: 0,
  registeredPlayers: new Set(),
  knownAbsent: new Set(),
  standby: new Set(),
  extraPlayers: [],
  checked: new Set(),
  firstOnly: new Set(),
  secondOnly: new Set(),
  bulkCheckIn: null,
  histories: { round1: [], round2: [] },
  manual: { round1: false, round2: false },
  attendanceProvisional: false,
  courtCount: 4,
  view: "checkin",
  checkinOrder: "round1",
  round1Groups: null,
  round2CourtCount: 4,
  round2Groups: null
};

const els = {
  round2CourtCount: document.querySelector("#round2CourtCount"),
  round2Provisional: document.querySelector("#round2Provisional"),
  bulkAttendance: document.querySelector("#bulkAttendance"),
  provisionalBadge: document.querySelector("#provisionalBadge"),
  round1Provisional: document.querySelector("#round1Provisional"),
  unassignedArea: document.querySelector("#unassignedArea"),
  unassignedTitle: document.querySelector("#unassignedTitle"),
  placePlayerForm: document.querySelector("#placePlayerForm"),
  unassignedPlayer: document.querySelector("#unassignedPlayer"),
  placementCourt: document.querySelector("#placementCourt"),
  placementResult: document.querySelector("#placementResult"),
  attendanceSummary: document.querySelector("#attendanceSummary"),
  knownAbsentCount: document.querySelector("#knownAbsentCount"),
  expectedCount: document.querySelector("#expectedCount"),
  registeredCount: document.querySelector("#registeredCount"),
  standbyCount: document.querySelector("#standbyCount"),
  firstOnlyCount: document.querySelector("#firstOnlyCount"),
  round1Summary: document.querySelector("#round1Summary"),
  checkedCount: document.querySelector("#checkedCount"),
  rosterList: document.querySelector("#rosterList"),
  addPlayerForm: document.querySelector("#addPlayerForm"),
  newPlayerName: document.querySelector("#newPlayerName"),
  courtCount: document.querySelector("#courtCount"),
  round1Groups: document.querySelector("#round1Groups"),
  round2Groups: document.querySelector("#round2Groups"),
  round1Note: document.querySelector("#round1Note"),
  round2Note: document.querySelector("#round2Note"),
  viewInputs: Array.from(document.querySelectorAll("input[name='view']")),
  checkinOrderInputs: Array.from(document.querySelectorAll("input[name='checkinOrder']")),
  screens: {
    checkin: document.querySelector("#checkinView"),
    round1: document.querySelector("#round1View"),
    round2: document.querySelector("#round2View")
  }
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadPlayers();
  bindEvents();
  render();
  registerServiceWorker();
}

async function loadPlayers() {
  const livePlayers = await fetchAndCacheLadderPlayers();
  if (livePlayers.length) {
    state.players = livePlayers;
    state.registeredCount = livePlayers.length;
    state.registeredPlayers = new Set(livePlayers);
    return;
  }

  const cachedPlayers = await fetchCachedLadderPlayers();
  if (cachedPlayers.length) {
    state.players = cachedPlayers;
    state.registeredCount = cachedPlayers.length;
    state.registeredPlayers = new Set(cachedPlayers);
    return;
  }

  const localPlayers = await fetchPlayerList("players.txt", parsePlainPlayerList);
  if (localPlayers.length) {
    state.players = localPlayers;
    state.registeredCount = localPlayers.length;
    state.registeredPlayers = new Set(localPlayers);
    return;
  }

  state.players = [
    "Add player names to players.txt",
    "One player per line"
  ];
}

async function fetchAndCacheLadderPlayers() {
  try {
    const response = await fetch(LADDER_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`${LADDER_URL} could not be read`);
    await cacheLadderResponse(response.clone());
    return parseLadderPlayers(await response.text());
  } catch (error) {
    return [];
  }
}

async function cacheLadderResponse(response) {
  if (!("caches" in window)) return;
  const cache = await caches.open(LADDER_CACHE_NAME);
  await cache.put(LADDER_URL, response);
}

async function fetchCachedLadderPlayers() {
  if (!("caches" in window)) return [];
  const cache = await caches.open(LADDER_CACHE_NAME);
  const response = await cache.match(LADDER_URL);
  if (!response) return [];
  return parseLadderPlayers(await response.text());
}

async function fetchPlayerList(url, parser) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${url} could not be read`);
    const text = await response.text();
    return parser(text);
  } catch (error) {
    return [];
  }
}

function parseLadderPlayers(text) {
  return uniqueNames(text
    .split(/\r?\n/)
    .map((line) => stripLadderPrefix(line.split(",")[0].trim()))
    .filter(Boolean));
}

function stripLadderPrefix(name) {
  return name.replace(/^[A-Za-z]{1,3}-/, "");
}

function parsePlainPlayerList(text) {
  return uniqueNames(text
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean));
}

function uniqueNames(names) {
  const seen = new Set();
  return names.filter((name) => {
    const key = name.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function bindEvents() {
  for (const round of ["round1", "round2"]) {
    const selects = round === "round1"
      ? [els.courtCount, document.getElementById("checkinCourtCount")]
      : [els.round2CourtCount];
    for (const select of selects) {
      select.replaceChildren(...Array.from({ length: 20 }, (_, i) => new Option(String(i + 1), String(i + 1))));
      select.addEventListener("change", () => {
        regroupRound(round, Number(select.value));
        render();
      });
    }
    document.getElementById(`${round}Regroup`).addEventListener("click", () => { regroupRound(round); render(); });
    document.getElementById(`${round}Undo`).addEventListener("click", () => { undoGrouping(round); render(); });
    const form = document.getElementById(round === "round1" ? "placePlayerForm" : "round2PlacePlayerForm");
    form.addEventListener("submit", event => {
      event.preventDefault();
      const name = form.querySelector("[data-placement-player]").value;
      const court = Number(form.querySelector("[data-placement-court]").value);
      if (placeUnassignedPlayer(name, court, round)) {
        document.getElementById(round === "round1" ? "placementResult" : "round2PlacementResult").textContent = `${name} placed on Court ${court + 1}.`;
        render();
      }
    });
    form.querySelector("[data-placement-filter]").addEventListener("input", () => renderUnassigned(round));
  }
  els.bulkAttendance.addEventListener("click", () => {
    if (state.attendanceProvisional) confirmAttendance(); else checkInAllExpected();
    render();
  });
  document.getElementById("undoBulkAttendance").addEventListener("click", () => { undoBulkCheckIn(); render(); });
  els.addPlayerForm.addEventListener("submit", event => {
    event.preventDefault();
    const name = normalizePlayerName(els.newPlayerName.value);
    if (!name) return;
    addPlayer(name, event.submitter?.value || "bottom");
    els.newPlayerName.value = "";
    render();
  });
  els.rosterList.addEventListener("click", event => {
    const button = event.target.closest(".player-main");
    if (button) { toggleChecked(button.dataset.name); render(); }
  });
  els.rosterList.addEventListener("change", event => {
    const select = event.target.closest(".player-status");
    if (select) { setPlayerStatus(select.dataset.name, select.value); render(); }
  });
  els.viewInputs.forEach(input => input.addEventListener("change", () => { state.view = input.value; render(); }));
  els.checkinOrderInputs.forEach(input => input.addEventListener("change", () => { state.checkinOrder = input.value; render(); }));
  document.getElementById("findPlayer").addEventListener("input", renderPlayerSearch);
  document.getElementById("round2AddForm").addEventListener("submit", event => {
    event.preventDefault();
    const input = document.getElementById("round2AddName");
    const name = normalizePlayerName(input.value);
    if (!name) return;
    const existing = state.players.find(p => p.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (!existing && state.players.some(p => p.toLocaleLowerCase().includes(name.toLocaleLowerCase()))) {
      document.getElementById("round2AddResult").textContent = "Choose the matching player's full name from the suggestions.";
      return;
    }
    const player = addToRound2(existing || name);
    document.getElementById("round2AddResult").textContent = `${player}: ${playerStatusText(player)}. Round 2: ${assignmentText(player, "round2")}.`;
    input.value = "";
    render();
  });
  document.getElementById("moveCancel").addEventListener("click", () => document.getElementById("moveDialog").close());
  document.getElementById("moveForm").addEventListener("submit", event => {
    event.preventDefault();
    const dialog = document.getElementById("moveDialog");
    const target = Number(document.getElementById("moveCourt").value);
    movePlayerInRound(dialog.dataset.round, dialog.dataset.name, { groupIndex: target });
    dialog.close();
    render();
  });
}

function addPlayer(name, position = "bottom") {
  const existing = state.players.find(player => player.toLocaleLowerCase() === name.toLocaleLowerCase());
  const playerName = existing || name;
  if (!existing) {
    state.players.push(playerName);
    state.extraPlayers.push(playerName);
  }
  markIndividualEdit(playerName);
  if (position === "standby") setPlayerStatus(playerName, "standby");
  else {
    state.standby.delete(playerName);
    state.knownAbsent.delete(playerName);
    state.checked.add(playerName);
  }
  reconcileRound1Attendance();
  return playerName;
}

function insertPlayerInOrder(players, name, position = "bottom") {
  return position === "top" ? [name, ...players] : [...players, name];
}

function toggleChecked(name) {
  markIndividualEdit(name);
  if (state.checked.has(name)) state.checked.delete(name);
  else {
    state.standby.delete(name);
    state.knownAbsent.delete(name);
    state.checked.add(name);
  }
  reconcileRound1Attendance();
}

function setFirstOnly(name, enabled) {
  markIndividualEdit(name);
  if (enabled) { state.firstOnly.add(name); state.secondOnly.delete(name); }
  else state.firstOnly.delete(name);
  reconcileRound1Attendance();
}

function setPlayerStatus(name, status) {
  markIndividualEdit(name);
  if (status === "standby" || status === "absent") {
    state.checked.delete(name);
    state.standby.delete(name);
    state.knownAbsent.delete(name);
    (status === "standby" ? state.standby : state.knownAbsent).add(name);
  } else {
    state.standby.delete(name);
    state.knownAbsent.delete(name);
    state.firstOnly.delete(name);
    state.secondOnly.delete(name);
    if (status === "firstOnly") state.firstOnly.add(name);
    if (status === "secondOnly") state.secondOnly.add(name);
  }
  reconcileRound1Attendance();
}

function checkInAllExpected() {
  if (state.attendanceProvisional) return;
  const added = new Set();
  for (const name of state.registeredPlayers) {
    if (!state.knownAbsent.has(name) && !state.standby.has(name) && !state.checked.has(name)) {
      state.checked.add(name);
      added.add(name);
    }
  }
  state.bulkCheckIn = { added, edited: new Set() };
  state.attendanceProvisional = true;
  reconcileRound1Attendance();
}

function confirmAttendance() {
  state.attendanceProvisional = false;
}

function reconcileRound1Attendance() {
  // Attendance changes only remove now-ineligible memberships; arrivals stay Unassigned.
  for (const round of ["round1", "round2"]) {
    if (state[`${round}Groups`] !== null) state[`${round}Groups`] = sanitizeGroups(round, state[`${round}Groups`]);
    clearPlacementFeedback(round);
  }
  // A prior placement search must not hide newly activated Round 2 players.
  document.querySelector("#round2PlacePlayerForm [data-placement-filter]").value = "";
}

function getUnassignedPlayers(round = "round1") {
  const assigned = new Set((state[`${round}Groups`] || []).flat());
  return getEligiblePlayers(round).filter(name => !assigned.has(name));
}

function placeUnassignedPlayer(name, courtIndex, round = "round1") {
  if (!getUnassignedPlayers(round).includes(name)) return false;
  return movePlayerInRound(round, name, { groupIndex: courtIndex });
}

function normalizePlayerName(name) {
  return name.trim().replace(/\s+/g, " ");
}

function markIndividualEdit(name) { state.bulkCheckIn?.edited.add(name); }

function undoBulkCheckIn() {
  const bulk = state.bulkCheckIn;
  if (!bulk) return;
  for (const name of bulk.added) if (!bulk.edited.has(name)) state.checked.delete(name);
  state.bulkCheckIn = null;
  state.attendanceProvisional = false;
  reconcileRound1Attendance();
}

function addToRound2(name) {
  const existing = state.players.find(p => p.toLocaleLowerCase() === name.toLocaleLowerCase());
  if (existing && getEligiblePlayers("round2").includes(existing)) {
    markIndividualEdit(existing);
    return existing;
  }
  const player = existing || name;
  const playedRound1 = state.firstOnly.has(player) || (state.round1Groups || []).flat().includes(player);
  addPlayer(player);
  state.firstOnly.delete(player);
  if (!playedRound1) state.secondOnly.add(player);
  else state.secondOnly.delete(player);
  reconcileRound1Attendance();
  return player;
}

function getEligiblePlayers(round) {
  return state.players.filter(n => state.checked.has(n) && !state.standby.has(n) && !state.knownAbsent.has(n) &&
    !(round === "round1" ? state.secondOnly : state.firstOnly).has(n));
}

function courtCountKey(round) { return round === "round1" ? "courtCount" : "round2CourtCount"; }

function sanitizeGroups(round, groups) {
  const eligible = new Set(getEligiblePlayers(round)), seen = new Set();
  return Array.from({ length: state[courtCountKey(round)] }, (_, i) => (groups[i] || []).filter(n => {
    if (!eligible.has(n) || seen.has(n)) return false;
    seen.add(n);
    return true;
  }));
}

function validateRoundAccounting(round) {
  const eligible = getEligiblePlayers(round);
  const assigned = (state[`${round}Groups`] || []).flat();
  const all = [...assigned, ...getUnassignedPlayers(round)];
  return all.length === eligible.length && new Set(all).size === all.length && all.every(n => eligible.includes(n));
}

function splitAutomatic(players, courts) {
  let offset = 0;
  return Grouping.chooseGroupSizes(players.length, courts).map(size => {
    const group = players.slice(offset, offset + size);
    offset += size;
    return group;
  });
}

function ensureRound(round) {
  if (state[`${round}Groups`] === null) {
    state[`${round}Groups`] = round === "round1" ? makeDefaultRound1Groups() : makeRound2Groups(state.round1Groups ?? makeDefaultRound1Groups());
  }
}

function clearPlacementFeedback(round) {
  document.getElementById(round === "round1" ? "placementResult" : "round2PlacementResult").textContent = "";
}

function saveGrouping(round) {
  clearPlacementFeedback(round);
  const history = state.histories[round];
  history.push({ groups: (state[`${round}Groups`] || []).map(g => [...g]), courts: state[courtCountKey(round)], manual: state.manual[round] });
  if (history.length > 30) history.shift();
}

function regroupRound(round, courts = state[courtCountKey(round)]) {
  if (state.manual[round] && !window.confirm("Regroup will replace this round's manual placements. Continue?")) return false;
  ensureRound(round);
  saveGrouping(round);
  state[courtCountKey(round)] = Math.min(20, Math.max(1, courts));
  state[`${round}Groups`] = round === "round1" ? makeDefaultRound1Groups() : makeRound2Groups(state.round1Groups ?? makeDefaultRound1Groups());
  state.manual[round] = false;
  return true;
}

function undoGrouping(round) {
  clearPlacementFeedback(round);
  const previous = state.histories[round].pop();
  if (!previous) return false;
  state[courtCountKey(round)] = previous.courts;
  state[`${round}Groups`] = sanitizeGroups(round, previous.groups);
  state.manual[round] = previous.manual;
  return true;
}

function movePlayerInRound(round, name, target) {
  if (!getEligiblePlayers(round).includes(name)) return false;
  ensureRound(round);
  const groups = state[`${round}Groups`].map(g => [...g]);
  const index = target.groupIndex;
  if (!Number.isInteger(index) || index < -1 || index >= groups.length) return false;
  if (target.playerName === name) return false;
  if (target.playerName && !groups[index]?.includes(target.playerName)) return false;
  for (const group of groups) { const i = group.indexOf(name); if (i >= 0) group.splice(i, 1); }
  if (index >= 0) {
    const destination = groups[index];
    let at = destination.length;
    if (target.playerName) at = destination.indexOf(target.playerName) + (target.before ? 0 : 1);
    destination.splice(at, 0, name);
  }
  if (JSON.stringify(groups) === JSON.stringify(state[`${round}Groups`])) return false;
  saveGrouping(round);
  state[`${round}Groups`] = groups;
  state.manual[round] = true;
  return true;
}

function renderRound(round) {
  ensureRound(round);
  // Recover only invalid memberships; never hide otherwise valid courts.
  if (!validateRoundAccounting(round)) {
    state[`${round}Groups`] = sanitizeGroups(round, state[`${round}Groups`]);
    document.getElementById(`${round}Note`).textContent = "Invalid memberships removed. Review Unassigned for players needing placement.";
  }
  const summary = document.getElementById(`${round}Summary`);
  summary.replaceChildren();
  for (const [className, text] of [["grouping-active", `${getEligiblePlayers(round).length} attendees · ${state[courtCountKey(round)]} courts`],
    ["grouping-result", `${state[`${round}Groups`].flat().length} assigned · ${getUnassignedPlayers(round).length} unassigned`]]) {
    const span = document.createElement("span"); span.className = className; span.textContent = text; summary.append(span);
  }
  document.getElementById(`${round}Undo`).disabled = !state.histories[round].length;
  renderUnassigned(round);
  renderGroups(els[`${round}Groups`], state[`${round}Groups`], { draggable: true });
  if (round === "round2") document.getElementById("round2PlayerNames").replaceChildren(...state.players.map(n => new Option(n, n)));
}

function playerStatusText(name) {
  const attendance = state.knownAbsent.has(name) ? "Known Absent" : state.standby.has(name) ? "Standby" : state.checked.has(name) ? "Checked in" : "Not checked in";
  return attendance + (state.firstOnly.has(name) ? " · 1st only" : state.secondOnly.has(name) ? " · 2nd only" : "");
}

function assignmentText(name, round) {
  if (!getEligiblePlayers(round).includes(name)) return "Not participating";
  const index = (state[`${round}Groups`] || []).findIndex(g => g.includes(name));
  return index < 0 ? "Unassigned" : `Court ${index + 1}`;
}

function renderPlayerSearch() {
  const query = document.getElementById("findPlayer").value.trim().toLocaleLowerCase();
  const results = document.getElementById("findResults");
  results.replaceChildren();
  if (!query) return;
  const names = state.players.filter(n => n.toLocaleLowerCase().includes(query));
  for (const name of names) {
    const row = document.createElement("div"); row.className = "find-result";
    const title = document.createElement("strong"); title.textContent = name;
    const status = document.createElement("p"); status.textContent = playerStatusText(name);
    const assignments = document.createElement("p"); assignments.textContent = `Round 1: ${assignmentText(name, "round1")} · Round 2: ${assignmentText(name, "round2")}`;
    const actions = document.createElement("div"); actions.className = "find-actions";
    const edit = document.createElement("button"); edit.className = "secondary-button"; edit.textContent = "Edit status";
    edit.onclick = () => {
      state.view = "checkin"; render();
      const rosterRow = [...els.rosterList.children].find(e => e.dataset.name === name);
      rosterRow?.scrollIntoView({ block: "center" }); rosterRow?.querySelector(".player-status").focus({ preventScroll: true });
    };
    actions.append(edit);
    for (const round of ["round1", "round2"]) if (getEligiblePlayers(round).includes(name)) {
      const button = document.createElement("button"); button.className = "secondary-button";
      button.textContent = round === "round1" ? "Place R1" : "Place R2";
      button.onclick = () => { state.view = round; render(); openMoveDialog(round, name); };
      actions.append(button);
    }
    row.append(title, status, assignments, actions); results.append(row);
  }
  if (!names.length) results.textContent = "No matching players.";
}

function openMoveDialog(round, name) {
  const dialog = document.getElementById("moveDialog");
  dialog.dataset.round = round; dialog.dataset.name = name;
  document.getElementById("moveTitle").textContent = name;
  const select = document.getElementById("moveCourt");
  select.replaceChildren(new Option("Unassigned", "-1"), ...(state[`${round}Groups`] || []).map((g, i) => new Option(`Court ${i + 1}${g.length ? "" : " · empty"}`, String(i))));
  select.value = String((state[`${round}Groups`] || []).findIndex(g => g.includes(name)));
  dialog.showModal();
}

function render() {
  els.bulkAttendance.textContent = state.attendanceProvisional ? "Confirm attendance" : "Check in all expected";
  els.provisionalBadge.classList.toggle("hidden", !state.attendanceProvisional);
  els.round1Provisional.classList.toggle("hidden", !state.attendanceProvisional);
  const registeredAbsent = [...state.knownAbsent].filter(name => state.registeredPlayers.has(name)).length;
  els.knownAbsentCount.textContent = registeredAbsent;
  els.expectedCount.textContent = state.registeredCount - registeredAbsent;
  els.attendanceSummary.classList.toggle("hidden", state.view !== "checkin");
  els.registeredCount.textContent = state.registeredCount;
  els.standbyCount.textContent = state.standby.size;
  els.firstOnlyCount.textContent = getFirstOnlyCheckedCount();
  els.checkedCount.textContent = state.checked.size;
  els.courtCount.value = String(state.courtCount);
  document.getElementById("checkinCourtCount").value = String(state.courtCount);
  document.getElementById("checkinCourtsControl").classList.toggle("hidden", state.view !== "checkin");
  els.viewInputs.forEach((input) => {
    input.checked = input.value === state.view;
  });
  els.checkinOrderInputs.forEach((input) => {
    input.checked = input.value === state.checkinOrder;
  });
  Object.entries(els.screens).forEach(([view, screen]) => {
    screen.classList.toggle("hidden", view !== state.view);
  });

  document.getElementById("undoBulkAttendance").disabled = !state.bulkCheckIn;
  document.getElementById("secondOnlyCount").textContent = [...state.secondOnly].filter(n => state.checked.has(n)).length;
  renderRoster();
  if (state.view === "round1") renderRound1();
  if (state.view === "round2") renderRound2();
  renderPlayerSearch();
}

function renderRoster() {
  const focused = els.rosterList.contains(document.activeElement)
    ? { name: document.activeElement.dataset.name, status: document.activeElement.matches(".player-status") }
    : null;
  els.rosterList.innerHTML = "";
  if (!state.players.length) {
    els.rosterList.append(emptyState("No players found in players.txt"));
    return;
  }

  getRosterDisplayPlayers().forEach((name) => {
    const checked = state.checked.has(name);
    const firstOnly = state.firstOnly.has(name);
    const standby = state.standby.has(name);
    const absent = state.knownAbsent.has(name);
    const row = document.createElement("div");
    row.className = `player-row${checked ? " checked" : ""}${firstOnly ? " first-only" : ""}${standby ? " standby" : ""}${absent ? " absent" : ""}`;
    row.dataset.name = name;
    row.innerHTML = `
      <button type="button" class="player-main">
        <span class="checkmark" aria-hidden="true">✓</span>
        <span class="name"></span>
      </button>
      <select class="player-status">
        <option value="normal">Normal</option>
        <option value="standby">Standby</option>
        <option value="firstOnly">1st only</option>
        <option value="secondOnly">2nd only</option>
        <option value="absent">Absent</option>
      </select>
    `;
    const main = row.querySelector(".player-main");
    main.dataset.name = name;
    main.setAttribute("aria-pressed", String(checked));
    main.setAttribute("aria-label", `${name}: ${checked ? "checked in" : standby ? "standby; tap to check in" : absent ? "known absent; tap to check in" : "not checked in"}${firstOnly ? ", 1st only" : ""}`);
    row.querySelector(".name").textContent = name;
    const select = row.querySelector(".player-status");
    select.dataset.name = name;
    select.value = absent ? "absent" : standby ? "standby" : firstOnly ? "firstOnly" : state.secondOnly.has(name) ? "secondOnly" : "normal";

    select.setAttribute("aria-label", `${name} status`);
    els.rosterList.append(row);
    if (focused?.name === name) {
      (focused.status ? select : main).focus({ preventScroll: true });
    }
  });
}

function getRosterDisplayPlayers() {
  if (state.checkinOrder === "alpha") {
    return [...state.players].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }
  return state.players;
}

function renderRound1() { renderRound("round1"); }

function renderUnassigned(round = "round1") {
  const prefix = round === "round1" ? "" : "round2";
  const byId = id => document.getElementById(prefix ? prefix + id[0].toUpperCase() + id.slice(1) : id);
  const players = getUnassignedPlayers(round);
  const form = byId("placePlayerForm");
  const select = form.querySelector("[data-placement-player]");
  const court = form.querySelector("[data-placement-court]");
  const filter = form.querySelector("[data-placement-filter]");
  const selectedName = select.value, selectedCourt = court.value;
  const groups = state[`${round}Groups`] || [];
  byId("unassignedArea").classList.toggle("hidden", !players.length && !byId("placementResult").textContent);
  byId("unassignedTitle").textContent = `Unassigned (${players.length}) · Place player`;
  const matches = players.filter(n => n.toLocaleLowerCase().includes(filter.value.toLocaleLowerCase()));
  select.replaceChildren(...(matches.length ? matches.map(name => new Option(name, name)) : [new Option(players.length ? "No matching players" : "No unassigned players", "")]));
  if (matches.includes(selectedName)) select.value = selectedName;
  court.replaceChildren(...groups.map((g, i) => new Option(`Court ${i + 1}${g.length ? "" : " · empty"}`, String(i))));
  if (selectedCourt !== "" && Number(selectedCourt) < groups.length) court.value = selectedCourt;
  form.querySelector("button").disabled = !matches.length || !groups.length;
}

function renderRound2() {
  els.round2CourtCount.value = String(state.round2CourtCount);
  els.round2Provisional.classList.toggle("hidden", !state.attendanceProvisional);
  renderRound("round2");
}

function getRound1Result() {
  ensureRound("round1");
  const groups = state.round1Groups;
  return { groups, activeCount: getEligiblePlayers("round1").length, groupedCount: groups.flat().length,
    ungrouped: getUnassignedPlayers().length, note: "", warning: false };
}

function getRound1Groups() {
  return getRound1Result().groups;
}

function makeDefaultRound1Groups() {
  return splitAutomatic(getEligiblePlayers("round1"), state.courtCount);
}

function getRound2EligiblePlayers() { return getEligiblePlayers("round2"); }

function makeRound2Groups(round1Groups) {
  const eligible = new Set(getEligiblePlayers("round2"));
  const ordered = Grouping.makeRound2Groups(round1Groups).flat().filter(n => eligible.has(n));
  // Keep the results/boundary movement order. Insert a known late arrival next
  // to their ladder neighbors instead of appending them at the lowest level.
  for (const name of state.players) {
    if (!eligible.has(name) || ordered.includes(name)) continue;
    const rank = state.players.indexOf(name);
    const index = ordered.findIndex(n => state.registeredPlayers.has(n) && state.players.indexOf(n) > rank);
    ordered.splice(index < 0 ? ordered.length : index, 0, name);
  }
  return makeGroupsFromPlayers(uniqueNames(ordered));
}

function makeGroupsFromPlayers(players) {
  return splitAutomatic(players, state.round2CourtCount);
}

function getFirstOnlyCheckedCount() {
  return [...state.firstOnly].filter((name) => state.checked.has(name)).length;
}

function renderGroups(container, groups, options) {
  container.innerHTML = "";
  if (!groups.length) {
    container.append(emptyState("No groups yet"));
    return;
  }

  groups.forEach((group, groupIndex) => {
    const card = document.createElement("article");
    card.className = "group-card";
    card.innerHTML = `
      <div class="group-title">
        <span>Court ${groupIndex + 1}</span>
        <span class="${group.length && group.length !== 4 && group.length !== 5 ? "court-size-warning" : ""}">${group.length ? `${group.length} players${group.length !== 4 && group.length !== 5 ? " · CHECK" : ""}` : "Empty · available"}</span>
      </div>
      <div class="group-list"></div>
    `;
    const list = card.querySelector(".group-list");
    list.dataset.groupIndex = String(groupIndex);
    group.forEach((name) => list.append(playerDragItem(name, options.draggable)));
    container.append(card);
  });
}

function playerDragItem(name, draggable) {
  const item = document.createElement("div");
  item.className = `drag-player${activeDragName === name ? " dragging" : ""}${state.firstOnly.has(name) ? " round-one-only" : ""}`;
  item.dataset.name = name;
  item.innerHTML = `
    <span class="drag-start-zone" aria-hidden="true"><span class="drag-grip"></span></span>
    <span class="name"></span>
    ${state.firstOnly.has(name) ? '<span class="round-one-badge" aria-label="First round only">1st only</span>' : state.secondOnly.has(name) ? '<span class="round-one-badge" aria-label="Second round only">2nd only</span>' : ""}
  `;
  item.querySelector(".name").textContent = name;
  item.tabIndex = 0;
  item.setAttribute("role", "button");
  item.setAttribute("aria-label", `${name}: move or send to Unassigned`);
  item.addEventListener("click", event => { if (!event.target.closest(".drag-start-zone")) openMoveDialog(state.view, name); });
  item.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openMoveDialog(state.view, name); } });
  if (draggable) attachPointerDrag(item);
  return item;
}

function attachPointerDrag(item) {
  item.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  item.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    if (!isDragStartZone(event)) return;
    event.preventDefault();
    const name = item.dataset.name;
    const round = state.view;
    const groups = state[`${round}Groups`];
    const source = findPlayerInGroups(groups, name);
    if (!source) return;
    activeDragName = name;
    const ghost = item.cloneNode(true);
    ghost.classList.add("drag-ghost");
    document.body.append(ghost);
    item.classList.add("dragging");
    item.setPointerCapture(event.pointerId);
    moveGhost(ghost, event.clientX, event.clientY);

    const onMove = (moveEvent) => {
      moveEvent.preventDefault();
      moveGhost(ghost, moveEvent.clientX, moveEvent.clientY);
      activeDropTarget = findDropTarget(moveEvent.clientX, moveEvent.clientY, name);
      renderDropTarget(activeDropTarget);
    };

    const onUp = (upEvent) => {
      if (item.hasPointerCapture(event.pointerId)) {
        item.releasePointerCapture(event.pointerId);
      }
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      ghost.remove();
      activeDropTarget = findDropTarget(upEvent.clientX, upEvent.clientY, name) || activeDropTarget;
      clearDropTarget();
      if (upEvent.type !== "pointercancel" && activeDropTarget && !activeDropTarget.noMove) movePlayerInRound(round, name, activeDropTarget);
      activeDragName = null;
      activeDropTarget = null;
      persist();
      render();
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  });
}

function isDragStartZone(event) {
  return Boolean(event.target.closest(".drag-start-zone")) && isLeftHalfOfScreen(event);
}

function isLeftHalfOfScreen(event) {
  return event.clientX <= window.innerWidth / 2;
}

function renderDropTarget(target) {
  clearDropTarget();
  if (!target || target.noMove) return;

  if (target.playerName) {
    const player = Array.from(document.querySelectorAll(`#${state.view}Groups .drag-player`))
      .find((element) => element.dataset.name === target.playerName);
    if (player) {
      player.classList.add(target.before ? "drop-before" : "drop-after");
    }
    return;
  }

  const list = document.querySelector(`#${state.view}Groups .group-list[data-group-index="${target.groupIndex}"]`);
  if (list) {
    list.classList.add("drop-append");
  }
}

function clearDropTarget() {
  document.querySelectorAll(".drop-before, .drop-after, .drop-append").forEach((element) => {
    element.classList.remove("drop-before", "drop-after", "drop-append");
  });
}

function moveGhost(ghost, x, y) {
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
}

function findDropTarget(x, y, movingName) {
  const elements = document.elementsFromPoint(x, y);
  const touchedPlayer = elements
    .map((element) => element.closest?.(".drag-player"))
    .find(Boolean);
  if (touchedPlayer?.dataset.name === movingName) {
    return { noMove: true };
  }

  const player = touchedPlayer?.classList.contains("dragging") ? null : touchedPlayer;
  if (player) {
    const rect = player.getBoundingClientRect();
    const list = player.closest(".group-list");
    if (list) {
      return {
        groupIndex: Number.parseInt(list.dataset.groupIndex, 10),
        playerName: player.dataset.name,
        before: y < rect.top + rect.height / 2
      };
    }
  }

  const list = elements.find((element) => element.classList?.contains("group-list"));
  if (list) {
    const groupIndex = Number.parseInt(list.dataset.groupIndex, 10);
    const group = state[`${state.view}Groups`]?.[groupIndex];
    if (!group) return null;
    return {
      groupIndex,
      playerName: null,
      before: false
    };
  }

  return null;
}

function movePlayerInRound1(movingName, target) {
  return movePlayerInRound("round1", movingName, target);
}

function findPlayerInGroups(groups, name) {
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const playerIndex = groups[groupIndex].indexOf(name);
    if (playerIndex >= 0) {
      return { groupIndex, playerIndex, group: groups[groupIndex] };
    }
  }
  return null;
}

function syncRosterOrderFromRound1() {
  // Results order is stored in round1Groups, independently of the original ladder.
}

function mergeGroupedPlayersIntoRosterOrder(players, grouped) {
  const groupedNames = new Set(grouped);
  let groupedIndex = 0;
  const merged = players.map((name) => {
    if (!groupedNames.has(name)) return name;
    const nextName = grouped[groupedIndex];
    groupedIndex += 1;
    return nextName;
  });

  return merged.concat(grouped.slice(groupedIndex));
}

function updateNote(element, text, warning) {
  element.textContent = text;
  element.classList.toggle("warning", warning);
}

function emptyState(text) {
  const div = document.createElement("div");
  div.className = "empty-state";
  div.textContent = text;
  return div;
}

function clampCourtCount(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 4;
  return Math.min(20, Math.max(1, parsed));
}

function persist() {
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    insertPlayerInOrder,
    mergeGroupedPlayersIntoRosterOrder,
    normalizePlayerName,
    parseLadderPlayers,
    parsePlainPlayerList,
    stripLadderPrefix
  };
}
