// Sleeping Gods Companion App - Main Application Logic

// ============================================================
// STATE MANAGEMENT
// ============================================================

let gameState = null;
let currentScreen = 'welcome';
let currentTab = 'ship';
let currentLocationDetail = null;

function saveState() {
  if (gameState) {
    localStorage.setItem('sleepingGodsState', JSON.stringify(gameState));
  }
}

function loadState() {
  const saved = localStorage.getItem('sleepingGodsState');
  if (saved) {
    try {
      gameState = JSON.parse(saved);
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

function clearState() {
  localStorage.removeItem('sleepingGodsState');
  gameState = null;
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

// ============================================================
// SCREEN MANAGEMENT
// ============================================================

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(screenId);
  if (screen) screen.classList.add('active');
  currentScreen = screenId;

  // Show/hide nav
  const nav = document.getElementById('mainNav');
  const header = document.getElementById('mainHeader');
  const gameScreens = ['screen-ship', 'screen-locations', 'screen-crew', 'screen-journal', 'screen-save'];
  if (gameScreens.includes(screenId)) {
    nav.classList.remove('hidden');
    header.classList.remove('hidden');
    updateHeader();
  } else {
    nav.classList.add('hidden');
    if (screenId !== 'screen-welcome') header.classList.remove('hidden');
    else header.classList.add('hidden');
  }
}

function switchTab(tabName) {
  currentTab = tabName;
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

  const screenMap = {
    ship: 'screen-ship',
    locations: 'screen-locations',
    crew: 'screen-crew',
    journal: 'screen-journal',
    save: 'screen-save'
  };
  showScreen(screenMap[tabName]);

  // Re-render the active screen
  if (tabName === 'ship') renderShipScreen();
  if (tabName === 'locations') renderLocationsScreen();
  if (tabName === 'crew') renderCrewScreen();
  if (tabName === 'journal') renderJournalScreen();
  if (tabName === 'save') renderSaveScreen();
}

function updateHeader() {
  const badge = document.getElementById('sessionBadge');
  if (gameState && badge) {
    badge.textContent = `Session ${gameState.sessionCount}`;
  }
}

// ============================================================
// WELCOME SCREEN
// ============================================================

function initWelcomeScreen() {
  const hasSave = loadState();
  const continueBtn = document.getElementById('btnContinue');
  if (hasSave && continueBtn) {
    continueBtn.classList.remove('hidden');
  }
}

function startNewGame() {
  gameState = getDefaultGameState();
  showScreen('screen-setup');
  renderSetupScreen();
}

function continueGame() {
  if (loadState()) {
    switchTab('ship');
    showToast('Welcome back, Captain!');
  }
}

// ============================================================
// SETUP SCREEN
// ============================================================

let setupPlayers = [{ name: '', characters: [] }];

function renderSetupScreen() {
  setupPlayers = [{ name: '', characters: [] }];
  const container = document.getElementById('setupPlayers');
  renderSetupPlayers(container);
}

function renderSetupPlayers(container) {
  const allAssigned = getAssignedCharacters();

  let html = '';
  setupPlayers.forEach((player, pi) => {
    html += `<div class="player-setup-card">
      <div class="flex-between mb-8">
        <label style="margin:0;">Player ${pi + 1}</label>
        ${setupPlayers.length > 1 ? `<button class="btn btn-sm btn-outline" onclick="removeSetupPlayer(${pi})">Remove</button>` : ''}
      </div>
      <input type="text" placeholder="Enter player name" value="${escHtml(player.name)}"
        onchange="setupPlayers[${pi}].name = this.value" />
      <label class="mt-8">Assign Characters</label>
      <div class="character-chips">`;

    CHARACTERS.forEach(ch => {
      const isSelected = player.characters.includes(ch);
      const isTaken = !isSelected && allAssigned.includes(ch);
      let cls = 'char-chip';
      if (isSelected) cls += ' selected';
      if (isTaken) cls += ' taken';
      html += `<button class="${cls}" ${isTaken ? 'disabled' : ''}
        onclick="toggleSetupCharacter(${pi}, '${ch}')">${ch}</button>`;
    });

    html += `</div></div>`;
  });

  container.innerHTML = html;
  updateSetupValidation();
}

function getAssignedCharacters() {
  return setupPlayers.flatMap(p => p.characters);
}

function toggleSetupCharacter(playerIndex, character) {
  const player = setupPlayers[playerIndex];
  const idx = player.characters.indexOf(character);
  if (idx >= 0) {
    player.characters.splice(idx, 1);
  } else {
    player.characters.push(character);
  }
  renderSetupPlayers(document.getElementById('setupPlayers'));
}

function addSetupPlayer() {
  setupPlayers.push({ name: '', characters: [] });
  renderSetupPlayers(document.getElementById('setupPlayers'));
}

function removeSetupPlayer(index) {
  setupPlayers.splice(index, 1);
  renderSetupPlayers(document.getElementById('setupPlayers'));
}

function updateSetupValidation() {
  const btn = document.getElementById('btnStartGame');
  const allAssigned = getAssignedCharacters();
  const allNamed = setupPlayers.every(p => p.name.trim().length > 0);
  const allHaveChars = setupPlayers.every(p => p.characters.length > 0);
  const allCharsAssigned = CHARACTERS.every(ch => allAssigned.includes(ch));

  btn.disabled = !(allNamed && allHaveChars && allCharsAssigned);

  const status = document.getElementById('setupStatus');
  if (allCharsAssigned) {
    status.textContent = 'All characters assigned!';
    status.style.color = 'var(--sea-green)';
  } else {
    const remaining = CHARACTERS.filter(ch => !allAssigned.includes(ch));
    status.textContent = `Unassigned: ${remaining.join(', ')}`;
    status.style.color = 'var(--brass-dark)';
  }
}

function startGame() {
  // Build player data
  gameState.players = setupPlayers.map(p => ({
    name: p.name.trim(),
    characters: [...p.characters],
    cardsInHand: [],
    commandTokens: 0
  }));

  // Build character data
  gameState.characters = {};
  CHARACTERS.forEach(ch => {
    gameState.characters[ch] = getDefaultCharacterState(ch);
  });

  saveState();
  switchTab('ship');
  showToast('Set sail, Captain! The Manticore awaits.');
}

// ============================================================
// SHIP SCREEN
// ============================================================

function renderShipScreen() {
  const container = document.getElementById('shipContent');
  if (!gameState) return;

  const locName = getLocationDisplayName(gameState.shipLocation);
  const page = LOCATION_TO_PAGE[gameState.shipLocation] || '?';

  let html = `
    <!-- Experience -->
    <div class="xp-display">
      <div>
        <div class="xp-label">Experience Points</div>
        <div class="xp-value">${gameState.experience}</div>
      </div>
      <div class="counter">
        <button onclick="adjustXP(-1)">−</button>
        <span class="counter-val" id="xpAdjust">1</span>
        <button onclick="adjustXP(1)">+</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:4px;">
        <button class="btn btn-sm btn-primary" onclick="earnXP()">Earn</button>
        <button class="btn btn-sm btn-outline" onclick="spendXP()">Spend</button>
      </div>
    </div>

    <!-- Ship Location -->
    <div class="card card-brass">
      <div class="card-header">
        <span>⚓ Current Position</span>
        <span class="location-page">Atlas Page ${page}</span>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <span class="location-number" style="font-size:1.3rem;">Loc ${gameState.shipLocation}</span>
        ${locName ? `<span class="location-name">${escHtml(locName)}</span>` : ''}
      </div>
      <div class="add-row mt-8">
        <input type="text" id="moveToLocation" placeholder="Move to location..." />
        <button class="btn btn-sm btn-navy" onclick="moveShip()">Move</button>
      </div>
    </div>

    <!-- Last Ship Action -->
    <div class="card">
      <div class="card-header">Last Ship Action</div>
      <div style="display:flex; flex-wrap:wrap; gap:6px;">
        ${SHIP_ACTIONS.map(a => `
          <button class="status-token ${gameState.lastShipAction === a ? 'active' : ''}"
            style="${gameState.lastShipAction === a ? 'background:var(--navy);border-color:var(--navy);' : ''}"
            onclick="setShipAction('${a}')">${a}</button>
        `).join('')}
      </div>
    </div>

    <!-- Ship Damage -->
    <div class="card">
      <div class="card-header">Ship Damage</div>
      <div class="damage-grid">
        ${[1,2,3,4,5,6].map(i => `
          <div class="damage-section">
            <label>Section ${i}</label>
            <div class="counter" style="margin-top:4px;">
              <button onclick="adjustDamage(${i-1}, -1)">−</button>
              <span class="counter-val">${gameState.shipDamage[i-1]}</span>
              <button onclick="adjustDamage(${i-1}, 1)">+</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Resources -->
    <div class="card">
      <div class="card-header">Ship Resources</div>
      <div class="resource-grid">
        ${RESOURCE_TYPES.map(r => `
          <div class="resource-item">
            <label>${r}</label>
            <div class="counter">
              <button onclick="adjustResource('${r}', -1)">−</button>
              <span class="counter-val">${gameState.resources[r]}</span>
              <button onclick="adjustResource('${r}', 1)">+</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.innerHTML = html;
}

let xpAdjustAmount = 1;

function adjustXP(delta) {
  xpAdjustAmount = Math.max(1, xpAdjustAmount + delta);
  const el = document.getElementById('xpAdjust');
  if (el) el.textContent = xpAdjustAmount;
}

function earnXP() {
  gameState.experience += xpAdjustAmount;
  saveState();
  renderShipScreen();
  showToast(`+${xpAdjustAmount} XP earned`);
}

function spendXP() {
  if (gameState.experience >= xpAdjustAmount) {
    gameState.experience -= xpAdjustAmount;
    saveState();
    renderShipScreen();
    showToast(`-${xpAdjustAmount} XP spent`);
  } else {
    showToast('Not enough XP!');
  }
}

function moveShip() {
  const input = document.getElementById('moveToLocation');
  const loc = input.value.trim();
  if (!loc) return;

  // Check if valid location
  if (!LOCATION_TO_PAGE[loc]) {
    showToast(`Location ${loc} not found in atlas`);
    return;
  }

  gameState.shipLocation = loc;

  // Auto-visit the location
  if (!gameState.locationsVisited.find(l => l.number === loc)) {
    visitLocation(loc);
  }

  saveState();
  renderShipScreen();
  showToast(`Sailed to Location ${loc}`);
}

function setShipAction(action) {
  gameState.lastShipAction = action;
  saveState();
  renderShipScreen();
}

function adjustDamage(section, delta) {
  gameState.shipDamage[section] = Math.max(0, gameState.shipDamage[section] + delta);
  saveState();
  renderShipScreen();
}

function adjustResource(resource, delta) {
  gameState.resources[resource] = Math.max(0, gameState.resources[resource] + delta);
  saveState();
  renderShipScreen();
}

// ============================================================
// LOCATIONS SCREEN
// ============================================================

let locationSearchQuery = '';
let locationInnerTab = 'visited';

function renderLocationsScreen() {
  const container = document.getElementById('locationsContent');
  if (!gameState) return;

  let html = `
    <!-- Inner tabs -->
    <div class="inner-tabs">
      <button class="inner-tab ${locationInnerTab === 'visited' ? 'active' : ''}"
        onclick="locationInnerTab='visited'; renderLocationsScreen();">Visited</button>
      <button class="inner-tab ${locationInnerTab === 'find' ? 'active' : ''}"
        onclick="locationInnerTab='find'; renderLocationsScreen();">Find Location</button>
      <button class="inner-tab ${locationInnerTab === 'keywords' ? 'active' : ''}"
        onclick="locationInnerTab='keywords'; renderLocationsScreen();">Keywords</button>
    </div>
  `;

  if (locationInnerTab === 'visited') {
    html += renderVisitedLocations();
  } else if (locationInnerTab === 'find') {
    html += renderLocationFinder();
  } else if (locationInnerTab === 'keywords') {
    html += renderKeywordsTab();
  }

  container.innerHTML = html;
}

function renderVisitedLocations() {
  const visited = gameState.locationsVisited;

  let html = `
    <div class="add-row mb-12">
      <input type="text" id="visitLocationInput" placeholder="Visit location number..." />
      <button class="btn btn-sm btn-navy" onclick="visitLocationFromInput()">Visit</button>
    </div>
    <div class="location-list">
  `;

  if (visited.length === 0) {
    html += '<div class="empty-state">No locations visited yet.</div>';
  } else {
    // Sort: current location first, then by number
    const sorted = [...visited].sort((a, b) => {
      if (a.number === gameState.shipLocation) return -1;
      if (b.number === gameState.shipLocation) return 1;
      return 0;
    });

    sorted.forEach(loc => {
      const page = LOCATION_TO_PAGE[loc.number] || '?';
      const isCurrent = loc.number === gameState.shipLocation;
      const name = loc.name || PRE_ASSIGNED_NAMES[loc.number] || '';
      const keywordCount = loc.keywords ? loc.keywords.length : 0;
      const unlockedCount = loc.keywords ? loc.keywords.filter(k => k.unlocked).length : 0;

      html += `
        <div class="location-item ${isCurrent ? 'current' : ''}" onclick="openLocationDetail('${loc.number}')">
          <div class="location-meta">
            <span class="location-number">${loc.number}</span>
            <span class="location-page">Page ${page}</span>
          </div>
          <div class="location-name">${name ? escHtml(name) : '<em style="opacity:0.5;">Unnamed</em>'}</div>
          ${keywordCount > 0 ? `<div class="tag-list" style="margin-top:6px;">
            ${loc.keywords.map(k => `
              <span class="keyword-tag ${k.unlocked ? 'unlocked' : 'needed'}">${escHtml(k.name)}${k.unlocked ? ' ✓' : ''}</span>
            `).join('')}
          </div>` : ''}
          ${isCurrent ? '<div style="font-size:0.7rem; color:var(--sea-green); margin-top:4px; font-family:var(--font-label);">⚓ Current Position</div>' : ''}
        </div>
      `;
    });
  }

  html += '</div>';
  return html;
}

function renderLocationFinder() {
  let html = `
    <div class="card">
      <div class="card-header">📍 Find a Location</div>
      <div class="finder-input">
        <input type="text" id="finderInput" placeholder="Enter location number..."
          onkeyup="findLocation()" />
      </div>
      <div id="finderResult"></div>
    </div>

    <div class="card mt-12">
      <div class="card-header">📖 Browse by Atlas Page</div>
      <select onchange="showPageLocations(this.value)" style="margin-bottom:8px;">
        <option value="">Select a page...</option>
        ${Object.keys(PAGE_LOCATIONS).sort((a,b) => parseInt(a) - parseInt(b)).map(p =>
          `<option value="${p}">Page ${p}</option>`
        ).join('')}
      </select>
      <div id="pageLocationsResult"></div>
    </div>
  `;
  return html;
}

function findLocation() {
  const input = document.getElementById('finderInput');
  const result = document.getElementById('finderResult');
  const loc = input.value.trim();
  if (!loc) { result.innerHTML = ''; return; }

  const page = LOCATION_TO_PAGE[loc];
  if (page) {
    const name = PRE_ASSIGNED_NAMES[loc] || '';
    const visited = gameState.locationsVisited.find(l => l.number === loc);
    result.innerHTML = `
      <div class="finder-result">
        <strong>Location ${loc}</strong>${name ? ` — ${escHtml(name)}` : ''}<br/>
        <span>Atlas Page ${page}</span>
        ${visited ? '<br/><span style="color:var(--sea-green);">✓ Visited</span>' : '<br/><span style="color:var(--ink-light);">Not yet visited</span>'}
      </div>
      ${!visited ? `<button class="btn btn-sm btn-navy" onclick="visitLocation('${loc}'); renderLocationsScreen();">Mark as Visited</button>` : ''}
    `;
  } else {
    result.innerHTML = '<div style="color:var(--danger); font-size:0.9rem;">Location not found in atlas.</div>';
  }
}

function showPageLocations(page) {
  const result = document.getElementById('pageLocationsResult');
  if (!page) { result.innerHTML = ''; return; }

  const locations = PAGE_LOCATIONS[parseInt(page)] || [];
  let html = '<div style="display:flex; flex-wrap:wrap; gap:6px;">';
  locations.forEach(loc => {
    const visited = gameState.locationsVisited.find(l => l.number === loc);
    const name = PRE_ASSIGNED_NAMES[loc] || '';
    html += `<button class="status-token ${visited ? 'active' : ''}"
      style="${visited ? 'background:var(--sea-green);border-color:var(--sea-green);' : ''}"
      onclick="if(!gameState.locationsVisited.find(l=>l.number==='${loc}')){visitLocation('${loc}'); renderLocationsScreen();}else{openLocationDetail('${loc}');}"
      title="${name || 'Location ' + loc}">
      ${loc}${name ? ' ·' : ''}
    </button>`;
  });
  html += '</div>';
  result.innerHTML = html;
}

function renderKeywordsTab() {
  let html = `
    <div class="card">
      <div class="card-header">Acquired Keywords</div>
      <div class="add-row mb-8">
        <input type="text" id="addKeywordInput" placeholder="Add keyword..." />
        <button class="btn btn-sm btn-navy" onclick="addAcquiredKeyword()">Add</button>
      </div>
      <div class="tag-list">
  `;

  if (gameState.acquiredKeywords.length === 0) {
    html += '<div class="empty-state">No keywords acquired yet.</div>';
  } else {
    gameState.acquiredKeywords.forEach((kw, i) => {
      html += `<span class="keyword-tag acquired">${escHtml(kw)}
        <button class="remove-btn" onclick="removeAcquiredKeyword(${i})">×</button>
      </span>`;
    });
  }

  html += `</div></div>`;
  return html;
}

function visitLocation(locNumber) {
  if (gameState.locationsVisited.find(l => l.number === locNumber)) return;

  const name = PRE_ASSIGNED_NAMES[locNumber] || '';
  gameState.locationsVisited.push({
    number: locNumber,
    name: name,
    keywords: []
  });

  saveState();
  if (!name) {
    // If no pre-assigned name, open detail to let them name it
    setTimeout(() => openLocationDetail(locNumber), 100);
  }
  showToast(`Visited Location ${locNumber}`);
}

function visitLocationFromInput() {
  const input = document.getElementById('visitLocationInput');
  const loc = input.value.trim();
  if (!loc) return;

  if (!LOCATION_TO_PAGE[loc]) {
    showToast(`Location ${loc} not found in atlas`);
    return;
  }

  if (gameState.locationsVisited.find(l => l.number === loc)) {
    showToast(`Already visited Location ${loc}`);
    openLocationDetail(loc);
    return;
  }

  visitLocation(loc);
  input.value = '';
  renderLocationsScreen();
}

function addAcquiredKeyword() {
  const input = document.getElementById('addKeywordInput');
  const kw = input.value.trim();
  if (!kw) return;
  if (gameState.acquiredKeywords.includes(kw)) {
    showToast('Keyword already acquired');
    return;
  }
  gameState.acquiredKeywords.push(kw);
  input.value = '';
  saveState();
  renderLocationsScreen();
  showToast(`Keyword "${kw}" acquired`);
}

function removeAcquiredKeyword(index) {
  const kw = gameState.acquiredKeywords[index];
  gameState.acquiredKeywords.splice(index, 1);
  saveState();
  renderLocationsScreen();
  showToast(`Keyword "${kw}" removed`);
}

// ============================================================
// LOCATION DETAIL MODAL
// ============================================================

function openLocationDetail(locNumber) {
  const loc = gameState.locationsVisited.find(l => l.number === locNumber);
  if (!loc) return;
  currentLocationDetail = locNumber;

  const page = LOCATION_TO_PAGE[locNumber] || '?';
  const preAssigned = PRE_ASSIGNED_NAMES[locNumber];

  let html = `
    <div class="modal-header">
      <h3>Location ${locNumber}</h3>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="location-detail-header">
      <span class="loc-page">Atlas Page ${page}</span>
    </div>

    <label>Location Name</label>
    ${preAssigned
      ? `<input type="text" value="${escHtml(preAssigned)}" disabled style="opacity:0.7;" />`
      : `<input type="text" id="locNameInput" value="${escHtml(loc.name)}" placeholder="Name this location..."
          onchange="updateLocationName('${locNumber}', this.value)" />`
    }

    <hr class="divider" />

    <div class="subsection-header">Keywords at this Location</div>
    <div class="tag-list mb-8">
      ${loc.keywords.length === 0 ? '<span style="font-size:0.85rem; color:var(--ink-light); font-style:italic;">No keywords yet</span>' : ''}
      ${loc.keywords.map((k, i) => `
        <span class="keyword-tag ${k.unlocked ? 'unlocked' : 'needed'}">
          ${escHtml(k.name)} ${k.unlocked ? '🔓' : '🔒'}
          <button class="remove-btn" onclick="toggleLocationKeyword('${locNumber}', ${i})">
            ${k.unlocked ? '🔒' : '🔓'}
          </button>
          <button class="remove-btn" onclick="removeLocationKeyword('${locNumber}', ${i})">×</button>
        </span>
      `).join('')}
    </div>
    <div class="add-row">
      <input type="text" id="locKeywordInput" placeholder="Add keyword..." />
      <button class="btn btn-sm btn-navy" onclick="addLocationKeyword('${locNumber}')">Add</button>
    </div>

    <hr class="divider" />

    <button class="btn btn-sm btn-danger" onclick="removeLocation('${locNumber}')">Remove from Visited</button>
  `;

  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  currentLocationDetail = null;
  // Re-render current screen
  if (currentTab === 'locations') renderLocationsScreen();
}

function updateLocationName(locNumber, name) {
  const loc = gameState.locationsVisited.find(l => l.number === locNumber);
  if (loc) {
    loc.name = name.trim();
    saveState();
  }
}

function addLocationKeyword(locNumber) {
  const input = document.getElementById('locKeywordInput');
  const kw = input.value.trim();
  if (!kw) return;

  const loc = gameState.locationsVisited.find(l => l.number === locNumber);
  if (loc) {
    loc.keywords.push({ name: kw, unlocked: false });
    input.value = '';
    saveState();
    openLocationDetail(locNumber); // refresh
  }
}

function toggleLocationKeyword(locNumber, keywordIndex) {
  const loc = gameState.locationsVisited.find(l => l.number === locNumber);
  if (loc && loc.keywords[keywordIndex]) {
    loc.keywords[keywordIndex].unlocked = !loc.keywords[keywordIndex].unlocked;
    saveState();
    openLocationDetail(locNumber);
  }
}

function removeLocationKeyword(locNumber, keywordIndex) {
  const loc = gameState.locationsVisited.find(l => l.number === locNumber);
  if (loc) {
    loc.keywords.splice(keywordIndex, 1);
    saveState();
    openLocationDetail(locNumber);
  }
}

function removeLocation(locNumber) {
  if (locNumber === gameState.shipLocation) {
    showToast("Can't remove your current location!");
    return;
  }
  gameState.locationsVisited = gameState.locationsVisited.filter(l => l.number !== locNumber);
  saveState();
  closeModal();
  showToast(`Location ${locNumber} removed`);
}

// ============================================================
// CREW SCREEN
// ============================================================

let crewInnerTab = 'players';

function renderCrewScreen() {
  const container = document.getElementById('crewContent');
  if (!gameState) return;

  let html = `
    <div class="inner-tabs">
      <button class="inner-tab ${crewInnerTab === 'players' ? 'active' : ''}"
        onclick="crewInnerTab='players'; renderCrewScreen();">Players</button>
      <button class="inner-tab ${crewInnerTab === 'characters' ? 'active' : ''}"
        onclick="crewInnerTab='characters'; renderCrewScreen();">Characters</button>
    </div>
  `;

  if (crewInnerTab === 'players') {
    html += renderPlayersTab();
  } else {
    html += renderCharactersTab();
  }

  container.innerHTML = html;
}

function renderPlayersTab() {
  let html = '';

  gameState.players.forEach((player, pi) => {
    html += `
      <div class="card">
        <div class="card-header">
          <span>${escHtml(player.name)}</span>
          <span style="font-size:0.75rem; color:var(--ink-light);">${player.characters.join(', ')}</span>
        </div>

        <div class="flex-between mb-8">
          <label style="margin:0;">Command Tokens</label>
          <div class="counter">
            <button onclick="adjustCommandTokens(${pi}, -1)">−</button>
            <span class="counter-val">${player.commandTokens}</span>
            <button onclick="adjustCommandTokens(${pi}, 1)">+</button>
          </div>
        </div>

        <label>Cards in Hand (${player.cardsInHand.length}/3)</label>
        <div class="inline-tags">
          ${player.cardsInHand.map((card, ci) => `
            <span class="tag">${escHtml(card)}
              <button class="remove-tag" onclick="removePlayerCard(${pi}, ${ci})">×</button>
            </span>
          `).join('')}
        </div>
        ${player.cardsInHand.length < 3 ? `
          <div class="add-row">
            <input type="text" id="playerCard${pi}" placeholder="Card name..." />
            <button class="btn btn-sm btn-navy" onclick="addPlayerCard(${pi})">Add</button>
          </div>
        ` : ''}
      </div>
    `;
  });

  return html;
}

function renderCharactersTab() {
  let html = '';

  CHARACTERS.forEach(charName => {
    const char = gameState.characters[charName];
    if (!char) return;
    const player = gameState.players.find(p => p.characters.includes(charName));

    html += `
      <div class="character-card">
        <div class="flex-between mb-8">
          <div>
            <div class="char-name">${charName}</div>
            <div class="char-player">${player ? player.name : 'Unassigned'}</div>
          </div>
        </div>

        <div class="char-stats">
          <div class="char-stat">
            <label style="margin:0;">Damage</label>
            <div class="counter">
              <button onclick="adjustCharStat('${charName}', 'damage', -1)">−</button>
              <span class="counter-val">${char.damage}</span>
              <button onclick="adjustCharStat('${charName}', 'damage', 1)">+</button>
            </div>
          </div>
          <div class="char-stat">
            <label style="margin:0;">Fatigue</label>
            <div class="counter">
              <button onclick="adjustCharFatigue('${charName}', -1)">−</button>
              <span class="counter-val">${char.fatigue}</span>
              <button onclick="adjustCharFatigue('${charName}', 1)">+</button>
            </div>
          </div>
        </div>

        <!-- Status Tokens -->
        <label>Status Tokens</label>
        <div class="status-tokens">
          ${STATUS_TOKENS.map(st => `
            <button class="status-token ${char.statusTokens[st] ? 'active' : ''}"
              onclick="toggleStatus('${charName}', '${st}')">${st}</button>
          `).join('')}
        </div>

        <!-- Card Slots -->
        <label class="mt-8">Card Slots (${char.cardSlots.length}/3)</label>
        <div class="inline-tags">
          ${char.cardSlots.map((card, ci) => `
            <span class="tag">${escHtml(card)}
              <button class="remove-tag" onclick="removeCharCard('${charName}', 'cardSlots', ${ci})">×</button>
            </span>
          `).join('')}
        </div>
        ${char.cardSlots.length < 3 ? `
          <div class="add-row">
            <input type="text" id="charSlot_${charName}" placeholder="Card name..." />
            <button class="btn btn-sm btn-navy" onclick="addCharCard('${charName}', 'cardSlots')">Add</button>
          </div>
        ` : ''}

        <!-- Upgrades -->
        <label class="mt-8">Upgrades (${char.upgrades.length}/3)</label>
        <div class="inline-tags">
          ${char.upgrades.map((u, ui) => `
            <span class="tag">${escHtml(u)}
              <button class="remove-tag" onclick="removeCharCard('${charName}', 'upgrades', ${ui})">×</button>
            </span>
          `).join('')}
        </div>
        ${char.upgrades.length < 3 ? `
          <div class="add-row">
            <input type="text" id="charUpgrade_${charName}" placeholder="Upgrade name..." />
            <button class="btn btn-sm btn-navy" onclick="addCharCard('${charName}', 'upgrades')">Add</button>
          </div>
        ` : ''}

        <!-- Weapons -->
        <label class="mt-8">Weapons</label>
        <div class="inline-tags">
          ${char.weapons.map((w, wi) => `
            <span class="tag">${escHtml(w)}
              <button class="remove-tag" onclick="removeCharCard('${charName}', 'weapons', ${wi})">×</button>
            </span>
          `).join('')}
        </div>
        <div class="add-row">
          <input type="text" id="charWeapon_${charName}" placeholder="Weapon name..." />
          <button class="btn btn-sm btn-navy" onclick="addCharCard('${charName}', 'weapons')">Add</button>
        </div>
      </div>
    `;
  });

  return html;
}

function adjustCommandTokens(playerIndex, delta) {
  gameState.players[playerIndex].commandTokens = Math.max(0, gameState.players[playerIndex].commandTokens + delta);
  saveState();
  renderCrewScreen();
}

function addPlayerCard(playerIndex) {
  const input = document.getElementById(`playerCard${playerIndex}`);
  const name = input.value.trim();
  if (!name) return;
  if (gameState.players[playerIndex].cardsInHand.length >= 3) return;
  gameState.players[playerIndex].cardsInHand.push(name);
  saveState();
  renderCrewScreen();
}

function removePlayerCard(playerIndex, cardIndex) {
  gameState.players[playerIndex].cardsInHand.splice(cardIndex, 1);
  saveState();
  renderCrewScreen();
}

function adjustCharStat(charName, stat, delta) {
  gameState.characters[charName][stat] = Math.max(0, gameState.characters[charName][stat] + delta);
  saveState();
  renderCrewScreen();
}

function adjustCharFatigue(charName, delta) {
  const cur = gameState.characters[charName].fatigue;
  gameState.characters[charName].fatigue = Math.max(0, Math.min(2, cur + delta));
  saveState();
  renderCrewScreen();
}

function toggleStatus(charName, statusName) {
  gameState.characters[charName].statusTokens[statusName] = !gameState.characters[charName].statusTokens[statusName];
  saveState();
  renderCrewScreen();
}

function addCharCard(charName, field) {
  const inputId = field === 'cardSlots' ? `charSlot_${charName}` :
                   field === 'upgrades' ? `charUpgrade_${charName}` :
                   `charWeapon_${charName}`;
  const input = document.getElementById(inputId);
  const name = input.value.trim();
  if (!name) return;
  gameState.characters[charName][field].push(name);
  saveState();
  renderCrewScreen();
}

function removeCharCard(charName, field, index) {
  gameState.characters[charName][field].splice(index, 1);
  saveState();
  renderCrewScreen();
}

// ============================================================
// JOURNAL SCREEN (Quests & Totems)
// ============================================================

let journalInnerTab = 'quests';

function renderJournalScreen() {
  const container = document.getElementById('journalContent');
  if (!gameState) return;

  let html = `
    <div class="inner-tabs">
      <button class="inner-tab ${journalInnerTab === 'quests' ? 'active' : ''}"
        onclick="journalInnerTab='quests'; renderJournalScreen();">Quests</button>
      <button class="inner-tab ${journalInnerTab === 'totems' ? 'active' : ''}"
        onclick="journalInnerTab='totems'; renderJournalScreen();">Totems</button>
    </div>
  `;

  if (journalInnerTab === 'quests') {
    html += renderQuestsTab();
  } else {
    html += renderTotemsTab();
  }

  container.innerHTML = html;
}

function renderQuestsTab() {
  let html = `
    <div class="add-row mb-12">
      <input type="text" id="addQuestInput" placeholder="Quest name..." />
      <button class="btn btn-sm btn-navy" onclick="addQuest()">Add Quest</button>
    </div>
  `;

  if (gameState.quests.length === 0) {
    html += '<div class="empty-state">No active quests. Your journey awaits...</div>';
  } else {
    gameState.quests.forEach((q, i) => {
      html += `
        <div class="quest-item">
          <span class="name">📜 ${escHtml(q)}</span>
          <button class="btn btn-sm btn-danger" onclick="removeQuest(${i})">×</button>
        </div>
      `;
    });
  }

  return html;
}

function renderTotemsTab() {
  let html = `
    <div class="flex-between mb-12">
      <div class="totem-count">🗿 Totems Collected: ${gameState.totems.length}</div>
    </div>
    <div class="add-row mb-12">
      <input type="text" id="addTotemInput" placeholder="Totem name..." />
      <button class="btn btn-sm btn-navy" onclick="addTotem()">Add Totem</button>
    </div>
  `;

  if (gameState.totems.length === 0) {
    html += '<div class="empty-state">No totems found yet. Keep searching...</div>';
  } else {
    gameState.totems.forEach((t, i) => {
      html += `
        <div class="totem-item">
          <span class="name">🗿 ${escHtml(t)}</span>
          <button class="btn btn-sm btn-danger" onclick="removeTotem(${i})">×</button>
        </div>
      `;
    });
  }

  return html;
}

function addQuest() {
  const input = document.getElementById('addQuestInput');
  const name = input.value.trim();
  if (!name) return;
  gameState.quests.push(name);
  input.value = '';
  saveState();
  renderJournalScreen();
  showToast('Quest added');
}

function removeQuest(index) {
  gameState.quests.splice(index, 1);
  saveState();
  renderJournalScreen();
  showToast('Quest removed');
}

function addTotem() {
  const input = document.getElementById('addTotemInput');
  const name = input.value.trim();
  if (!name) return;
  gameState.totems.push(name);
  input.value = '';
  saveState();
  renderJournalScreen();
  showToast('Totem collected!');
}

function removeTotem(index) {
  gameState.totems.splice(index, 1);
  saveState();
  renderJournalScreen();
  showToast('Totem removed');
}

// ============================================================
// SAVE SCREEN (Session Summary & Continue)
// ============================================================

function renderSaveScreen() {
  const container = document.getElementById('saveContent');
  if (!gameState) return;

  const locName = getLocationDisplayName(gameState.shipLocation);
  const page = LOCATION_TO_PAGE[gameState.shipLocation] || '?';
  const totalDamage = gameState.shipDamage.reduce((a, b) => a + b, 0);

  let html = `
    <div class="section-header"><span class="icon">📋</span> Session ${gameState.sessionCount} Summary</div>

    <div class="summary-grid mb-12">
      <div class="summary-stat">
        <div class="stat-label">Experience</div>
        <div class="stat-value">${gameState.experience}</div>
      </div>
      <div class="summary-stat">
        <div class="stat-label">Ship Location</div>
        <div class="stat-value">${gameState.shipLocation}</div>
      </div>
      <div class="summary-stat">
        <div class="stat-label">Atlas Page</div>
        <div class="stat-value">${page}</div>
      </div>
      <div class="summary-stat">
        <div class="stat-label">Totems</div>
        <div class="stat-value">${gameState.totems.length}</div>
      </div>
      <div class="summary-stat">
        <div class="stat-label">Locations Visited</div>
        <div class="stat-value">${gameState.locationsVisited.length}</div>
      </div>
      <div class="summary-stat">
        <div class="stat-label">Ship Damage</div>
        <div class="stat-value">${totalDamage}</div>
      </div>
    </div>

    <!-- Ship Action -->
    <div class="card">
      <div class="card-header">Last Ship Action</div>
      <div style="display:flex; flex-wrap:wrap; gap:6px;">
        ${SHIP_ACTIONS.map(a => `
          <button class="status-token ${gameState.lastShipAction === a ? 'active' : ''}"
            style="${gameState.lastShipAction === a ? 'background:var(--navy);border-color:var(--navy);' : ''}"
            onclick="setShipAction('${a}'); renderSaveScreen();">${a}</button>
        `).join('')}
      </div>
    </div>

    <!-- Resources Summary -->
    <div class="card">
      <div class="card-header">Resources</div>
      <div class="resource-grid">
        ${RESOURCE_TYPES.map(r => `
          <div class="resource-item">
            <label>${r}</label>
            <div style="font-family:var(--font-display);font-weight:700;font-size:1.1rem;color:var(--navy);">${gameState.resources[r]}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Quests & Totems Summary -->
    <div class="card">
      <div class="card-header">Quests (${gameState.quests.length})</div>
      ${gameState.quests.length > 0
        ? gameState.quests.map(q => `<div style="padding:4px 0;font-size:0.9rem;">📜 ${escHtml(q)}</div>`).join('')
        : '<div class="empty-state" style="padding:8px 0;">None</div>'
      }
    </div>

    <div class="card">
      <div class="card-header">Totems (${gameState.totems.length})</div>
      ${gameState.totems.length > 0
        ? gameState.totems.map(t => `<div style="padding:4px 0;font-size:0.9rem;">🗿 ${escHtml(t)}</div>`).join('')
        : '<div class="empty-state" style="padding:8px 0;">None</div>'
      }
    </div>

    <!-- Crew Summary -->
    <div class="card">
      <div class="card-header">Crew Status</div>
      ${gameState.players.map(p => `
        <div style="padding:6px 0; border-bottom:1px solid var(--parchment-dark);">
          <strong>${escHtml(p.name)}</strong>
          <span style="font-size:0.8rem; color:var(--ink-light);"> — ${p.characters.join(', ')}</span>
          <div style="font-size:0.8rem; color:var(--ink-light);">
            Tokens: ${p.commandTokens} | Cards: ${p.cardsInHand.length}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <div class="card-header">Character Details</div>
      ${CHARACTERS.map(ch => {
        const c = gameState.characters[ch];
        if (!c) return '';
        const activeStatuses = STATUS_TOKENS.filter(s => c.statusTokens[s]);
        return `
          <div style="padding:6px 0; border-bottom:1px solid var(--parchment-dark);">
            <strong>${ch}</strong>
            <span style="font-size:0.8rem;color:var(--ink-light);">
              DMG:${c.damage} FAT:${c.fatigue}
              ${activeStatuses.length > 0 ? ' | ' + activeStatuses.join(', ') : ''}
            </span>
            ${c.cardSlots.length > 0 ? `<div style="font-size:0.78rem;">Cards: ${c.cardSlots.join(', ')}</div>` : ''}
            ${c.upgrades.length > 0 ? `<div style="font-size:0.78rem;">Upgrades: ${c.upgrades.join(', ')}</div>` : ''}
            ${c.weapons.length > 0 ? `<div style="font-size:0.78rem;">Weapons: ${c.weapons.join(', ')}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>

    <hr class="divider" />

    <div style="display:flex; flex-direction:column; gap:10px; margin-top:16px;">
      <button class="btn btn-primary btn-block" onclick="saveAndEndSession()">
        💾 Save & End Session
      </button>
      <button class="btn btn-navy btn-block" onclick="beginNewSession()">
        ⛵ Begin New Session
      </button>
      <button class="btn btn-outline btn-block" onclick="if(confirm('This will erase ALL game data. Are you sure?')){clearState(); location.reload();}">
        🗑️ Delete Save Data
      </button>
    </div>
  `;

  container.innerHTML = html;
}

function saveAndEndSession() {
  saveState();
  showToast('Game saved! Until next time, Captain.');
}

function beginNewSession() {
  gameState.sessionCount = (gameState.sessionCount || 1) + 1;
  saveState();
  switchTab('ship');
  showToast(`Session ${gameState.sessionCount} begins!`);
}

// ============================================================
// UTILITIES
// ============================================================

function getLocationDisplayName(locNumber) {
  const visited = gameState.locationsVisited.find(l => l.number === locNumber);
  if (visited && visited.name) return visited.name;
  return PRE_ASSIGNED_NAMES[locNumber] || '';
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initWelcomeScreen();

  // Nav tab clicks
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });

  // Close modal on overlay click
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
});
