const LADDER_URL = "https://wdcpickleball.com/app/ladder";
const LADDER_CACHE_NAME = "pickleball-round-robin-ladder-v1";
let activeDragName = null;
let activeDropTarget = null;

const state = {
  players: [],
  extraPlayers: [],
  checked: new Set(),
  firstOnly: new Set(),
  courtCount: 4,
  view: "checkin",
  checkinOrder: "round1",
  round1Groups: null,
  round2Groups: null
};

const els = {
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
    return;
  }

  const cachedPlayers = await fetchCachedLadderPlayers();
  if (cachedPlayers.length) {
    state.players = cachedPlayers;
    return;
  }

  const localPlayers = await fetchPlayerList("players.txt", parsePlainPlayerList);
  if (localPlayers.length) {
    state.players = localPlayers;
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
  els.addPlayerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = normalizePlayerName(els.newPlayerName.value);
    if (!name) return;
    const position = event.submitter?.value === "top" ? "top" : "bottom";
    addPlayer(name, position);
    els.newPlayerName.value = "";
    els.newPlayerName.blur();
    persist();
    render();
  });

  els.rosterList.addEventListener("click", (event) => {
    const button = event.target.closest(".player-row");
    if (!button) return;
    if (event.target.closest(".first-only-select")) return;
    if (!isLeftHalfOfScreen(event)) return;
    toggleChecked(button.dataset.name);
    persist();
    render();
  });

  els.rosterList.addEventListener("change", (event) => {
    const select = event.target.closest(".first-only-select");
    if (!select) return;
    setFirstOnly(select.dataset.name, select.value === "firstOnly");
    persist();
    render();
  });

  els.rosterList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const row = event.target.closest(".player-row");
    if (!row || event.target.closest(".first-only-select")) return;
    event.preventDefault();
    toggleChecked(row.dataset.name);
    persist();
    render();
  });

  els.courtCount.addEventListener("change", () => {
    state.courtCount = clampCourtCount(els.courtCount.value);
    state.round1Groups = null;
    state.round2Groups = null;
    persist();
    render();
  });

  els.viewInputs.forEach((input) => {
    input.addEventListener("change", () => {
      state.view = input.value;
      if (state.view === "round2") {
        state.round2Groups = makeRound2Groups(getRound1Groups());
      }
      persist();
      render();
    });
  });

  els.checkinOrderInputs.forEach((input) => {
    input.addEventListener("change", () => {
      state.checkinOrder = input.value;
      persist();
      render();
    });
  });

}

function addPlayer(name, position = "bottom") {
  const existing = state.players.find((player) => player.toLocaleLowerCase() === name.toLocaleLowerCase());
  const playerName = existing || name;
  if (!existing) {
    state.players = insertPlayerInOrder(state.players, playerName, position);
    state.extraPlayers.push(playerName);
    state.extraPlayers = uniqueNames(state.extraPlayers);
  }
  state.checked.add(playerName);
  state.round1Groups = null;
  state.round2Groups = null;
}

function insertPlayerInOrder(players, name, position = "bottom") {
  return position === "top" ? [name, ...players] : [...players, name];
}

function toggleChecked(name) {
  if (state.checked.has(name)) {
    state.checked.delete(name);
    state.firstOnly.delete(name);
  } else {
    state.checked.add(name);
  }
  state.round1Groups = null;
  state.round2Groups = null;
}

function setFirstOnly(name, enabled) {
  if (enabled) {
    state.firstOnly.add(name);
    state.checked.add(name);
  } else {
    state.firstOnly.delete(name);
  }
  state.round2Groups = null;
}

function normalizePlayerName(name) {
  return name.trim().replace(/\s+/g, " ");
}

function render() {
  els.checkedCount.textContent = state.checked.size;
  els.courtCount.value = String(state.courtCount);
  els.viewInputs.forEach((input) => {
    input.checked = input.value === state.view;
  });
  els.checkinOrderInputs.forEach((input) => {
    input.checked = input.value === state.checkinOrder;
  });
  Object.entries(els.screens).forEach(([view, screen]) => {
    screen.classList.toggle("hidden", view !== state.view);
  });

  renderRoster();
  renderRound1();
  renderRound2();
}

function renderRoster() {
  els.rosterList.innerHTML = "";
  if (!state.players.length) {
    els.rosterList.append(emptyState("No players found in players.txt"));
    return;
  }

  getRosterDisplayPlayers().forEach((name) => {
    const checked = state.checked.has(name);
    const firstOnly = state.firstOnly.has(name);
    const row = document.createElement("div");
    row.className = `player-row${checked ? " checked" : ""}${firstOnly ? " first-only" : ""}`;
    row.dataset.name = name;
    row.tabIndex = 0;
    row.role = "button";
    row.setAttribute("aria-pressed", checked ? "true" : "false");
    row.innerHTML = `
      <span class="checkmark" aria-hidden="true">✓</span>
      <span class="name"></span>
      <span class="row-action"></span>
    `;
    row.querySelector(".name").textContent = name;
    const action = row.querySelector(".row-action");
    if (checked) {
      const firstOnlySelect = document.createElement("select");
      firstOnlySelect.className = "first-only-select";
      firstOnlySelect.dataset.name = name;
      firstOnlySelect.innerHTML = `
        <option value="">...</option>
        <option value="firstOnly">1st only</option>
      `;
      firstOnlySelect.value = firstOnly ? "firstOnly" : "";
      firstOnlySelect.setAttribute("aria-label", `${name} round options`);
      action.append(firstOnlySelect);
    }
    els.rosterList.append(row);
  });
}

function getRosterDisplayPlayers() {
  if (state.checkinOrder === "alpha") {
    return [...state.players].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }
  return state.players;
}

function renderRound1() {
  const result = getRound1Result();
  updateNote(els.round1Note, result.note, result.warning);
  renderGroups(els.round1Groups, result.groups, { draggable: true });
}

function renderRound2() {
  if (!state.round2Groups) {
    state.round2Groups = makeRound2Groups(getRound1Groups());
  }
  const count = state.round2Groups.reduce((sum, group) => sum + group.length, 0);
  const firstOnlyCount = getFirstOnlyCheckedCount();
  const note = count
    ? `Generated from the current 1st round order.${firstOnlyCount ? ` ${firstOnlyCount} first-only player${firstOnlyCount === 1 ? "" : "s"} excluded.` : ""} ${count} total player${count === 1 ? "" : "s"}.`
    : "Check in players before creating the 2nd round.";
  updateNote(els.round2Note, note, !count);
  renderGroups(els.round2Groups, state.round2Groups, { draggable: false });
}

function getRound1Result() {
  if (!state.round1Groups) {
    state.round1Groups = makeDefaultRound1Groups();
  }
  const groups = state.round1Groups;
  const checkedPlayers = state.players.filter((name) => state.checked.has(name));
  const groupedCount = groups.reduce((sum, group) => sum + group.length, 0);
  const ungrouped = checkedPlayers.length - groupedCount;
  let note = `${groupedCount} checked in across ${groups.length} court${groups.length === 1 ? "" : "s"}.`;
  let warning = false;

  if (!checkedPlayers.length) {
    note = "Check in players to build round-one groups.";
    warning = true;
  } else if (ungrouped > 0) {
    note = `${groupedCount} grouped. ${ungrouped} player${ungrouped === 1 ? "" : "s"} left over because groups must be 4 or 5.`;
    warning = true;
  }

  return { groups, note, warning };
}

function getRound1Groups() {
  return getRound1Result().groups;
}

function makeDefaultRound1Groups() {
  const checkedPlayers = state.players.filter((name) => state.checked.has(name));
  const sizes = Grouping.chooseGroupSizes(checkedPlayers.length, state.courtCount);
  const groups = [];
  let offset = 0;

  sizes.forEach((size) => {
    groups.push(checkedPlayers.slice(offset, offset + size));
    offset += size;
  });
  return groups;
}

function makeRound2Groups(round1Groups) {
  const swappedGroups = Grouping.makeRound2Groups(round1Groups);
  const eligiblePlayers = swappedGroups
    .flat()
    .filter((name) => state.checked.has(name) && !state.firstOnly.has(name));
  return makeGroupsFromPlayers(eligiblePlayers);
}

function makeGroupsFromPlayers(players) {
  const sizes = Grouping.chooseGroupSizes(players.length, state.courtCount);
  const groups = [];
  let offset = 0;
  sizes.forEach((size) => {
    groups.push(players.slice(offset, offset + size));
    offset += size;
  });
  return groups;
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
        <span>${group.length} players</span>
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
    ${state.firstOnly.has(name) ? '<span class="round-one-badge" aria-label="First round only">1st</span>' : ""}
  `;
  item.querySelector(".name").textContent = name;
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
    const groups = getRound1Groups();
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
      if (activeDropTarget && !activeDropTarget.noMove && movePlayerInRound1(name, activeDropTarget)) {
        state.round2Groups = null;
        syncRosterOrderFromRound1();
      }
      activeDragName = null;
      activeDropTarget = null;
      syncRosterOrderFromRound1();
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
    const player = Array.from(document.querySelectorAll("#round1Groups .drag-player"))
      .find((element) => element.dataset.name === target.playerName);
    if (player) {
      player.classList.add(target.before ? "drop-before" : "drop-after");
    }
    return;
  }

  const list = document.querySelector(`#round1Groups .group-list[data-group-index="${target.groupIndex}"]`);
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
    const group = getRound1Groups()[groupIndex];
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
  const nextGroups = Grouping.movePlayerMaintainingGroupSizes(getRound1Groups(), movingName, target);
  if (!nextGroups) return false;
  if (JSON.stringify(nextGroups) === JSON.stringify(state.round1Groups)) return false;
  state.round1Groups = nextGroups;
  return true;
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
  if (!state.round1Groups) return;
  const grouped = state.round1Groups.flat();
  state.players = mergeGroupedPlayersIntoRosterOrder(state.players, grouped);
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
  return Math.min(20, Math.max(4, parsed));
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
