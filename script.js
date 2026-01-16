// ==============================
// DOM REFERENCES & GLOBAL STATE (const, document.get)
// ============================== 
const nameInputs = [
  document.getElementById("p1-name"),
  document.getElementById("p2-name"),
  document.getElementById("p3-name"),
  document.getElementById("p4-name"),
  

];

const partyPokemonLevelInput = document.getElementById("party-pokemon-level");
const manualSaveBtn = document.getElementById("manual-save");
const toggleEditBtn = document.getElementById("toggle-edit");
const sheetRoot = document.getElementById("sheet");
const greatMoveSlot = document.querySelector(".great-move-slot");
const signatureMoveSelect = document.getElementById("signature-move-select");
const signatureMovePreviewBtn =
  document.getElementById("signature-move-preview");

const trainerActionMoveSelect =
  document.getElementById("trainer-action-move-select");

const exportSheetBtn = document.getElementById("export-sheet");
const importSheetBtn = document.getElementById("import-sheet");

let importFileInput = null;
function getImportFileInput() {
  if (importFileInput) return importFileInput;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.style.display = "none";
  document.body.appendChild(input);
  importFileInput = input;
  return importFileInput;
}




  

// ==============================
// APP STATE (let)
// ==============================





// Trainer Action move selected per Pokémon slot
// Stores moveId or moveName (string), or null if none selected
let trainerActionMoveBySlot = {
  1: null,
  2: null,
  3: null,
  4: null
};

// Trainer Action resource tracking (UI-only)
// Uses = PB + 2, not enforced
// Trainer Action resource tracking (trainer-level, UI-only)
// Resets on rest (manual)
let trainerActionUses = {
  used: 0
};



let signatureMoveUsesBySlot = {
  1: { used: 0 },
  2: { used: 0 },
  3: { used: 0 },
  4: { used: 0 }
};

/*
Example stored value:
{
  baseMoveId: "ember",
  overrides: {
    element: "water",
    category: "physical",
    baseDice: 3,
    description: "A superheated jet of boiling water..."
  },
  uses: {
    max: 2,
    used: 0
  }
}
*/

const SIGNATURE_MOVE_TEMPLATE = {
  baseMoveId: null,

  overrides: {
    // Identity
    name: null,
    element: null,
    category: null,

    // Damage
    baseDice: null,

    // Description augmentation
    descriptionPrefix: "",
    descriptionSuffix: "",

    // Targeting / economy
    range: null,
    target: null,
    economy: null,

    // Tags
    tags: null
  },

  uses: {
    max: 1,
    used: 0
  }
};

/*
==============================
SIGNATURE MOVE EDITING GUIDE
==============================

This section is the ONLY place you should edit Signature Moves.

📍 LOCATION RULE (IMPORTANT)
- All Signature Move edits belong HERE, in the APP STATE section.
- Do NOT edit moves.json.
- Do NOT edit showMove().
- Do NOT edit resolver logic.
- You ONLY edit data inside signatureMoveBySlot.

--------------------------------
HOW THIS IS STRUCTURED
--------------------------------

Each Pokémon slot (1–4) has its OWN signature move object:

signatureMoveBySlot[1] → Pokémon 1
signatureMoveBySlot[2] → Pokémon 2
signatureMoveBySlot[3] → Pokémon 3
signatureMoveBySlot[4] → Pokémon 4

These are fully independent.
Editing one will NEVER affect another.

--------------------------------
HOW TO EDIT A SIGNATURE MOVE
--------------------------------

You ALWAYS follow this pattern:

1️⃣ Choose the Pokémon slot (1–4)
2️⃣ Set baseMoveId (required)
3️⃣ Edit ONLY the overrides you want to change

Example: Pokémon 1
--------------------------------
signatureMoveBySlot[1].baseMoveId = "ember";

signatureMoveBySlot[1].overrides.element = "water";
signatureMoveBySlot[1].overrides.baseDice = 3;
signatureMoveBySlot[1].overrides.descriptionPrefix =
  "Bond Technique: ";

--------------------------------
Example: Pokémon 2
--------------------------------
signatureMoveBySlot[2].baseMoveId = "fake_out";

signatureMoveBySlot[2].overrides.category = "special";
signatureMoveBySlot[2].overrides.descriptionSuffix =
  " This move does not cause flinch.";

--------------------------------
FIELDS YOU ARE ALLOWED TO EDIT
--------------------------------

Inside .overrides you may set:

- name                (string)
- element             (string)
- category            (string)
- baseDice            (number)

- descriptionPrefix   (string)
- descriptionSuffix   (string)

- range               (string)
- target              (string)
- economy             (string)

- tags                (array of strings)

If a value is NULL or empty, the base move’s value is used.

--------------------------------
IMPORTANT RULES (DO NOT BREAK)
--------------------------------

❌ Do NOT overwrite the entire overrides object
❌ Do NOT mutate MOVES_DB
❌ Do NOT edit showMove()
❌ Do NOT duplicate full descriptions unless intentional

All logic merges happen automatically during preview.

--------------------------------
MENTAL MODEL
--------------------------------

Base Move (moves.json)
   ↓
Signature Overrides (THIS SECTION)
   ↓
Resolved Preview (read-only)
   ↓
Rendered by showMove()

If something looks wrong, check overrides FIRST.
*/


let signatureMoveBySlot = {
  1: structuredClone(SIGNATURE_MOVE_TEMPLATE),
  2: structuredClone(SIGNATURE_MOVE_TEMPLATE),
  3: structuredClone(SIGNATURE_MOVE_TEMPLATE),
  4: structuredClone(SIGNATURE_MOVE_TEMPLATE)
};


let rolesData = null;
// Pokémon role progression per slot
// Example: ["striker", "striker", "reactor", "reactor", "striker"]
let pokemonRoleProgression = {
  1: [],
  2: [],
  3: [],
  4: []
};

let pokemonNicknames = {
  1: "",
  2: "",
  3: "",
  4: ""
};

// Pokémon species per slot (player choice; used to hydrate stats from pokemon.json)
let pokemonSpeciesBySlot = {
  1: "",
  2: "",
  3: "",
  4: ""
};


let greatMoveUses = {
  1: { used: 0 },
  2: { used: 0 },
  3: { used: 0 },
  4: { used: 0 }
};

let activeSlot = 1;

let isRestoring = false;

let isEditMode = false;

// Party Pokemon Level (shared by all Pokemon)
let PARTY_POKEMON_LEVEL = 1;

let POKEMON_DB = {};

let MOVES_DB = {};

// Ordered Nest moves per Pokémon slot
let knownNestMoves = {
  1: [],
  2: [],
  3: [],
  4: []
};

// Great moves per Pokémon slot (index 0-3)
let knownGreatMoves = {
  1: [null, null, null, null],
  2: [null, null, null, null],
  3: [null, null, null, null],
  4: [null, null, null, null]
};

let ABILITIES_DB = {};

let selectedAbilityBySlot = {
  1: null,
  2: null,
  3: null,
  4: null
};












// ==============================
// DATA LOADING (async, await)
// ==============================




async function loadPokemonDB() {
  try {
    const res = await fetch("pokemon.json");
    if (!res.ok) throw new Error(`Failed to load pokemon.json: ${res.status}`);
    POKEMON_DB = await res.json();
   
  } catch (err) {
    console.error(err);
  }
}

async function loadMovesDB() {
  try {
    const res = await fetch("moves.json");
    if (!res.ok) throw new Error(`Failed to load moves.json: ${res.status}`);
    MOVES_DB = await res.json();
    
  } catch (err) {
    console.error(err);
  }
}

async function loadAbilitiesDB() {
  try {
    const res = await fetch("abilities.json");
    if (!res.ok) {
      throw new Error(`Failed to load abilities.json: ${res.status}`);
    }
    ABILITIES_DB = await res.json();
    
  } catch (err) {
    console.error(err);
  }
}

async function loadRolesDB() {
  try {
    const res = await fetch("roles.json");
    if (!res.ok) throw new Error(`Failed to load roles.json: ${res.status}`);
    rolesData = await res.json();
  } catch (err) {
    console.error("Failed to load roles.json", err);
  }
}






// ==============================
// CALCS (return)
// ==============================
// ==============================





function getTotalRoleLevels() {
  let total = 0;

  for (let i = 1; i <= 4; i++) {
    const levelInput = document.getElementById(`role-${i}-level`);
    const level = Number(levelInput?.value || 0);

    if (Number.isFinite(level)) {
      total += level;
    }
  }

  return Math.max(1, total);
}


function getEligibleTrainerActionMoveIds() {
  const slot = Number(activeSlot);
  const role = getActivePokemonEffectiveRole();

  if (!role) return [];

  return (knownGreatMoves[slot] || []).filter(moveId => {
    const move = MOVES_DB[moveId];
    return (
      move &&
      move.tier === "great" &&
      Array.isArray(move.roles) &&
      move.roles.includes(role)
    );
  });
}


function getEligibleTrainerActionMoveIdsForSlot(slot) {
  const role = getPokemonEffectiveRoleForSlot(Number(slot));
  if (!role) return [];

  return (knownGreatMoves[Number(slot)] || []).filter(moveId => {
    const move = MOVES_DB[moveId];
    return (
      move &&
      move.tier === "great" &&
      Array.isArray(move.roles) &&
      move.roles.includes(role)
    );
  });
}



function getMaxSignatureUses() {
  const pb = pbFromTrainerLevel(getTotalRoleLevels());
  return pb + 2;
}

function getActivePokemonKnownMoveIds() {
  const slot = Number(activeSlot);
  const ids = new Set();

  // Nest moves
  (knownNestMoves[slot] || []).forEach(id => {
    if (id) ids.add(id);
  });

  // Great moves
  (knownGreatMoves[slot] || []).forEach(id => {
    if (id) ids.add(id);
  });

  return Array.from(ids);
}

function getResolvedSignatureMoveForPreview() {
  const sig = getActivePokemonSignatureMove();
  if (!sig?.baseMoveId) return null;

  const baseMove = MOVES_DB[sig.baseMoveId];
  if (!baseMove) return null;

  // Preview-only merge
  const resolved = { ...baseMove };

  SIGNATURE_OVERRIDE_KEYS.forEach(key => {
    if (sig.overrides[key] != null) {
      resolved[key] = sig.overrides[key];
    }
  });

  return resolved;

}




function getActivePokemonSignatureMove() {
  return signatureMoveBySlot[Number(activeSlot)] || null;
}


function activePokemonHasUnlockedSignatureMove() {
  const slot = Number(activeSlot);
  const progression = pokemonRoleProgression[slot];

  // Signature Moves unlock at progression level 5 (index 4)
  return Array.isArray(progression) && Boolean(progression[4]);
}

const SIGNATURE_OVERRIDE_KEYS = [
  "name",
  "element",
  "category",
  "baseDice",
  "descriptionPrefix",
  "descriptionSuffix",
  "range",
  "target",
  "economy",
  "tags", 
  "status",
  "buffDebuff"

];

function setSignatureOverride(slot, key, value) {
  if (!SIGNATURE_OVERRIDE_KEYS.includes(key)) {
    console.warn(`Blocked invalid signature override: ${key}`);
    return;
  }

  const sig = signatureMoveBySlot[slot];
  if (!sig || !sig.overrides) return;

  sig.overrides[key] =
    value === "" || value === undefined ? null : value;
}



function getPokemonAbilityRoleForSlot(slot) {
  const progression = pokemonRoleProgression[slot];
  if (!Array.isArray(progression)) return null;

  // Ability role is defined by progression level 4 (index 3)
  return progression[3] || null;
}

function getActivePokemonAbilityRole() {
  const slot = Number(activeSlot);
  return getPokemonAbilityRoleForSlot(slot);
}


// ==============================
// ABILITIES HELPERS (native + role)
// ==============================

function getAbilityRecord(abilityId) {
  if (!abilityId) return null;

  // Direct key hit (many are keyed by id)
  if (ABILITIES_DB?.[abilityId]) return ABILITIES_DB[abilityId];

  // Some keys contain spaces while ids use underscores (e.g. friend guard ↔ friend_guard)
  const spaced = String(abilityId).replace(/_/g, " ");
  if (ABILITIES_DB?.[spaced]) return ABILITIES_DB[spaced];

  // Fallback: scan for matching .id
  const match = Object.values(ABILITIES_DB || {}).find(a => a?.id === abilityId);
  return match || null;
}

function formatAbilityLabel(abilityId) {
  const rec = getAbilityRecord(abilityId);
  if (rec?.name) return rec.name;

  return String(abilityId)
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function collectNativeAbilityIds(pokemon) {
  const native = [];

  const add = (value) => {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach(add);
      return;
    }

    if (typeof value === "string") {
      const id = value.trim();
      if (id) native.push(id);
      return;
    }

    if (typeof value === "object") {
      // Common shapes:
      // - { primary: [...], secondary: [...], hidden: [...] }
      // - { ability: [...]} or { abilities: [...] }
      Object.values(value).forEach(add);
      add(value.ability);
      add(value.abilities);
      add(value.id);
    }
  };

  add(pokemon?.abilities);
  return [...new Set(native)];
}

function collectRoleAbilityIds(role, pokemonLevel) {
  if (!role) return [];

  const ids = [];
  const seen = new Set();

  Object.values(ABILITIES_DB || {}).forEach((ability) => {
    if (!ability?.id) return;
    if (seen.has(ability.id)) return; // dedupe (ABILITIES_DB keys are not consistent)
    seen.add(ability.id);

    if (!ability.sources?.includes("role")) return;
    if (!ability.roles?.includes(role)) return;
    if (typeof ability.unlocksAt === "number" && ability.unlocksAt > pokemonLevel) return;

    ids.push(ability.id);
  });

  return ids;
}

function getEligibleAbilityIdsForSlot(slot) {
  const pokemonLevel = getPokemonLevel();
  const nameInput = document.getElementById(`p${slot}-name`);
  const key = nameInput?.value?.trim().toLowerCase();
  const pokemon = key ? POKEMON_DB[key] : null;

  if (!pokemon) return [];

  const nativeIds = collectNativeAbilityIds(pokemon);
  const role = getPokemonAbilityRoleForSlot(slot);

  // Abilities unlock at Pokémon level 4+
  if (pokemonLevel < 4) return [];

  const eligible = new Set();

  // Native (allow even if not present in abilities.json)
  nativeIds.forEach(id => eligible.add(id));

  // Role-granted (only if ability-role segment is chosen)
  collectRoleAbilityIds(role, pokemonLevel).forEach(id => eligible.add(id));

  return Array.from(eligible);
}


function getActivePokemonDiceProfile() {
  const roles = getUniqueRolesInOrder(
    getActivePokemonUnlockedRolesUpToLevel(getPokemonLevel())
  );

  if (!roles.length) return null;

  const diceValues = {
    d4: 4,
    d6: 6,
    d8: 8,
    d10: 10,
    d12: 12
  };

  const result = { physical: [], special: [], healing: [] };

  roles.forEach(roleId => {
    const role = rolesData?.[roleId];
    if (!role?.dice) return;

    for (const type of ["physical", "special", "healing"]) {
      const die = role.dice[type];
      if (die && diceValues[die]) {
        result[type].push(diceValues[die]);
      }
    }
  });

  const averaged = {};
  for (const type in result) {
    if (!result[type].length) continue;

    const avg =
      result[type].reduce((a, b) => a + b, 0) / result[type].length;

    // Snap to nearest standard die
    if (avg <= 4) averaged[type] = "d4";
    else if (avg <= 6) averaged[type] = "d6";
    else if (avg <= 8) averaged[type] = "d8";
    else if (avg <= 10) averaged[type] = "d10";
    else averaged[type] = "d12";
  }

  return averaged;
}


function activePokemonHasUnlockedAbilities() {
  return getPokemonLevel() >= 4;
}




function getUniqueRolesInOrder(roleArray) {
  const seen = new Set();
  return roleArray.filter(role => {
    if (!role || seen.has(role)) return false;
    seen.add(role);
    return true;
  });
}

function getActivePokemonUnlockedRolesUpToLevel(level) {
  const slot = Number(activeSlot);
  const progression = pokemonRoleProgression[slot];
  if (!Array.isArray(progression)) return [];

  return progression
    .slice(0, level)
    .filter(Boolean);
}


function getActivePokemonGreatMoveRole() {
  const slot = Number(activeSlot);
  const progression = pokemonRoleProgression[slot];

  if (!Array.isArray(progression)) return null;

  return progression[0] || null; // Level 1 → index 0
}

// READ-ONLY: Returns Level 3 Trainer Action definition for active Pokémon
// Does NOT affect UI or existing trainer actions
function getActivePokemonLevel3TrainerActionDef() {
  const slot = Number(activeSlot);
  const progression = pokemonRoleProgression[slot];

  if (!Array.isArray(progression)) return null;

  const roleAt3 = progression[2]; // Level 3 → index 2
  if (!roleAt3) return null;

  const roleDef = getRoleDefinition(roleAt3);
  const level3Def = roleDef?.levels?.["3"];

  if (!level3Def) return null;
  if (level3Def.type !== "trainer_action") return null;

  return {
    role: roleAt3,
    roleName: roleDef.name,
    grants: level3Def.grants || null
  };
}


// READ-ONLY: Does the active Pokémon have a given role at or before a given role level?
function activePokemonHasRoleAtLevel(roleId, requiredLevel) {
  const slot = Number(activeSlot);
  const progression = pokemonRoleProgression[slot];

  if (!Array.isArray(progression)) return false;

  // requiredLevel is 1-based, array is 0-based
  const index = requiredLevel - 1;

  return progression[index] === roleId;
}




// READ-ONLY: Returns role definition from roles.json
function getRoleDefinition(roleId) {
  if (!rolesData) return null;
  if (!roleId) return null;

  return rolesData[roleId] || null;
}

function getPokemonEffectiveRoleForSlot(slot) {
  const level = getPokemonLevel();

  const progression = pokemonRoleProgression[slot];
  if (!Array.isArray(progression)) return null;

  // Levels are 1-based, arrays are 0-based
  const roleAtLevel = progression[level - 1];
  if (roleAtLevel) return roleAtLevel;

  return getRoleForSlot(slot) || getPrimaryRole() || null;
}

function getActivePokemonEffectiveRole() {
  const slot = Number(activeSlot);
  return getPokemonEffectiveRoleForSlot(slot);
}

// READ-ONLY: Returns stat boosts unlocked at Pokémon Level 3
// Does NOT apply stats. Does NOT touch UI.
function getActivePokemonStatBoosts() {
  const slot = Number(activeSlot);
  const level = getPokemonLevel();

  // Stat boosts only unlock at Level 3+
  if (level < 3) return {};

  const progression = pokemonRoleProgression[slot];
  if (!Array.isArray(progression)) return {};

  const roleAtLevel3 = progression[2]; // Level 3 → index 2
  if (!roleAtLevel3) return {};

  // --- Data-driven stat boosts (roles.json) ---
  const roleDef = getRoleDefinition(roleAtLevel3);

  if (roleDef?.statBoosts?.level3) {
    return { ...roleDef.statBoosts.level3 };
  }


  const boosts = {};

  switch (roleAtLevel3) {
    case "striker":
      boosts.atk = 2;
      break;
    case "mystic":
      boosts.spAtk = 2;
      break;
    case "reactor":
      boosts.spd = 2;
      break;
    case "balancer":
      boosts.spDef = 2;
      break;
    case "anchor":
      boosts.def = 2;
      break;
    case "manipulator":
      boosts.man = 2;
      break;
  }

  return boosts;
}

function applyRoleStatBoostsToStats(baseStats, boosts) {
  const result = { ...baseStats };

  for (const stat in boosts) {
    if (result[stat] != null) {
      result[stat] += boosts[stat];
    }
  }

  return result;
}














// Active Pokémon role resolver
function getActivePokemonRole() {
  const slot = Number(activeSlot);
  if (!slot) return null;

  const roleSelect = document.getElementById(`role-${slot}`);
  if (!roleSelect) return null;

  const role = roleSelect.value;
  return role || null;
}



// Ensure Pokémon role progression matches Pokémon level
function syncPokemonRoleProgression(slot, level) {
  if (!pokemonRoleProgression[slot]) {
    pokemonRoleProgression[slot] = [];
  }

  const progression = pokemonRoleProgression[slot];

  // Trim if level decreased
  while (progression.length > level) {
    progression.pop();
  }

  // Extend if level increased
  while (progression.length < level) {
    progression.push(null); // placeholder, no choice yet
  }
}



function capitalizeWord(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}


function clearSlotStats(slotNumber) {
  const statIds = [
    "atk", "def", "sp-atk", "sp-def", "man", "spd"
  ];

  statIds.forEach(stat => {
    const base = document.getElementById(`p${slotNumber}-${stat}`);
    const mod = document.getElementById(`p${slotNumber}-${stat}-mod`);

    if (base) base.value = "";
    if (mod) mod.value = "";
  });
}

function getMaxGreatUses(pokemonLevel) {
  return pokemonLevel <= 3 ? 3 : 4;
}


function getPokemonLevel() {
  const level = Number(getTotalRoleLevels());

  if (!Number.isFinite(level)) return 1;

  return Math.max(1, Math.min(5, level));
}



function getMaxGreatSlots(pokemonLevel) {
  if (pokemonLevel <= 2) return 3;
  return 4;
}


function hasConsumedRoleGreatMove(pokemonSlot) {
  const moveId = knownGreatMoves[pokemonSlot]?.[0];
  if (!moveId) return false;

  const slot = Number(pokemonSlot);
  const nameInput = document.getElementById(`p${slot}-name`);
  const key = nameInput?.value?.trim().toLowerCase();
  const pokemon = key ? POKEMON_DB[key] : null;

  if (!pokemon) return false;

  const nativeMoveIds = pokemon.moves?.native || [];

  // ✅ If the move is native, it does NOT consume the role slot
  if (nativeMoveIds.includes(moveId)) return false;

  const move = MOVES_DB[moveId];
  return Boolean(move?.grantableByRole);
}



function hasActivePokemonSelected() {
  const slot = Number(activeSlot);
  const nameInput = document.getElementById(`p${slot}-name`);
  const key = nameInput?.value?.trim().toLowerCase();
  return Boolean(key && POKEMON_DB[key]);
}


function getActivePokemonNativeNestMoves() {
  const slot = Number(activeSlot);
  const nameInput = document.getElementById(`p${slot}-name`);
  const key = nameInput?.value?.trim().toLowerCase();
  if (!key) return [];

  const pokemon = POKEMON_DB[key];
  if (!pokemon?.moves?.native) return [];

  return pokemon.moves.native
    .map(id => MOVES_DB[id])
    .filter(move => move && move.tier === "nest");
}


// Role ↔ Pokémon slot mapping (no behavior yet)
function getRoleForSlot(slotIndex) {
  const el = document.getElementById(`role-${slotIndex}`);
  return el?.value || null;
}


//Nest Move Limit
function getNestMoveLimit(pokemonLevel) {
  if (pokemonLevel === 1) return 3;
  if (pokemonLevel === 2) return 4;
  if (pokemonLevel === 3) return 4;
  if (pokemonLevel === 4) return 5;
  if (pokemonLevel >= 5) return 5;

  return 3; // safe fallback
}



//Stat mods
function statToMod(statValue) {
  const n = Number(statValue);

  if (!Number.isFinite(n)) return "";

  if (n < 34) return -2;
  if (n <= 49) return -1;
  if (n <= 59) return 0;
  if (n <= 74) return "+1";
  if (n <= 89) return "+2";
  if (n <= 109) return "+3";
  if (n <= 129) return "+4";
  if (n >= 160) return "+6";
  return "+5"; // 130–159
}

function movementFromSpdMod(spdMod) {
  const n = Number(spdMod);

  if (n >= 5) return 50;
  if (n === 4) return 45;
  if (n === 3 || n === 2) return 35;
  if (n === 1 || n === 0) return 30;
  if (n === -1 || n === -2) return 25;

  // fallback for anything weird/blank
  return "";
}

//PB
function pbFromTrainerLevel(level) {
  const n = Number(level);

  if (!Number.isFinite(n)) return "";

  if (n <= 4) return 2;
  if (n <= 8) return 3;
  if (n <= 12) return 4;
  if (n <= 16) return 5;
  return 6; // 17–20
}



//Aware
function calculateAwareness() {
  const spDefMod = Number(document.getElementById("sp-def-mod")?.value);

  if (!Number.isFinite(spDefMod)) return "";

  return 10 + spDefMod;
}

function calculateCE() {
  const spdMod = Number(document.getElementById("spd-mod")?.value);
  const defMod = Number(document.getElementById("def-mod")?.value);

  if (!Number.isFinite(spdMod) || !Number.isFinite(defMod)) return "";

  return 10 + spdMod + halfRoundedUp(defMod);
}

//Rolehelper - Calcs/ helpers
function getPrimaryRole() {
  const roleSelect = document.getElementById("role-1");
  if (!roleSelect) return null;
  return roleSelect.value || null;
}


function halfRoundedUp(n) {
  return Math.ceil(Number(n) / 2);
}

//roles
function getRoleLevels() {
  const roles = [];

  for (let i = 1; i <= 4; i++) {
    const role = document.getElementById(`role-${i}`)?.value;
    const level = Number(document.getElementById(`role-${i}-level`)?.value || 0);

    if (role && level > 0) {
      roles.push({ role, level });
    }
  }

  return roles;
}

function getSelectedRolesInOrder() {
  const roles = [];
  const seen = new Set();

  for (let i = 1; i <= 4; i++) {
    const role = document.getElementById(`role-${i}`)?.value || "";
    if (!role) continue;
    if (seen.has(role)) continue;

    seen.add(role);
    roles.push(role);
  }

  return roles;
}





// ==============================
// ==============================
// UPDATES ()
// ==============================
// ==============================




function syncTrainerAndPokemonLevelFromRoles(opts = { render: true }) {
  const derivedLevel = getTotalRoleLevels();

  const trainerLevelInput = document.getElementById("trainer-level");

  if (trainerLevelInput) {
    trainerLevelInput.value = derivedLevel;
  }

  if (partyPokemonLevelInput) {
    partyPokemonLevelInput.value = derivedLevel;
  }

  syncPokemonRoleProgression(activeSlot, derivedLevel);

  if (opts && opts.render === false) return;

  renderPokemonRoleProgress();
  renderActivePokemonEffectiveRole();
  renderAbilities();
  renderSignatureMoveSelector();
  renderTrainerActionMoveSelector();
  updateTrainerActions();

  renderNestMoveSlots();
  renderGreatMoveSlots();
  renderGreatMoveUses();
}


function renderTrainerActionUses() {
  const container = document.getElementById("trainer-action-uses");
  if (!container) return;

  container.innerHTML = "";

  const state = trainerActionUses;


  const trainerLevel = getTotalRoleLevels();
  const maxUses = pbFromTrainerLevel(trainerLevel) + 2;

  for (let i = 0; i < maxUses; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.classList.add("trainer-action-use");

    const spent = i < state.used;

    btn.textContent = spent ? "●" : "○";

    btn.addEventListener("click", () => {
      trainerActionUses.used =
        spent ? state.used - 1 : state.used + 1;

      trainerActionUses.used = Math.max(
        0,
        Math.min(trainerActionUses.used, maxUses)
      );


      renderTrainerActionUses();
      saveSheetState();
    });

    container.appendChild(btn);
  }
}

function renderTrainerActionMoveSelector() {
  if (!trainerActionMoveSelect) return;

  trainerActionMoveSelect.innerHTML =
    `<option value="">Select Trainer Action move</option>`;

 const trainerActionDef = getActivePokemonLevel3TrainerActionDef();

  // Selector always enabled (Trainer Actions exist at Level 1)
  trainerActionMoveSelect.disabled = false;

  // But no options unless Trainer Command is unlocked
  if (!trainerActionDef) {
    trainerActionMoveSelect.innerHTML =
      `<option value="">Trainer Command unlocks at Level 3</option>`;
    return;
  }


  const moveIds = getEligibleTrainerActionMoveIds();
  trainerActionMoveSelect.disabled = false;

  moveIds.forEach(id => {
    const move = MOVES_DB[id];
    if (!move) return;

    const option = document.createElement("option");
    option.value = id;
    option.textContent = move.name;
    trainerActionMoveSelect.appendChild(option);
  });

  // ✅ NEW: restore saved selection if still valid
  const slot = Number(activeSlot);
  const saved = trainerActionMoveBySlot[slot];

  if (saved && moveIds.includes(saved)) {
    trainerActionMoveSelect.value = saved;
  }
}


function renderSignatureMoveEditor() {
  const slot = Number(activeSlot);               // 👈 KEY LINE
  const sig = signatureMoveBySlot[slot];
  const editor = document.getElementById("signature-move-editor");

  if (!editor) return;

  // No signature move → hide editor and STOP
  if (!sig || !sig.baseMoveId) {
    editor.style.display = "none";
    return;
  }

  editor.style.display = "block";


  document.getElementById("sig-element").value =
    sig.overrides.element ?? "";

  document.getElementById("sig-category").value =
    sig.overrides.category ?? "";

  document.getElementById("sig-base-dice").value =
    sig.overrides.baseDice ?? "";

  document.getElementById("sig-desc-prefix").value =
    sig.overrides.descriptionPrefix ?? "";

  document.getElementById("sig-desc-suffix").value =
    sig.overrides.descriptionSuffix ?? "";
  document.getElementById("sig-range").value =
    sig.overrides.range ?? "";

  document.getElementById("sig-target").value =
    sig.overrides.target ?? "";

  document.getElementById("sig-tags").value =
    Array.isArray(sig.overrides.tags)
      ? sig.overrides.tags.join(", ")
      : "";
  // Status
  document.getElementById("sig-status").value =
    sig.overrides.status?.inflicts ?? "";

  // Buff / Debuff
  document.getElementById("sig-buff-stat").value =
    sig.overrides.buffDebuff?.stat ?? "";

  document.getElementById("sig-buff-amount").value =
    sig.overrides.buffDebuff?.amount ?? "";

  document.getElementById("sig-buff-duration").value =
    sig.overrides.buffDebuff?.duration ?? "";


}


function renderSignatureMoveSelector() {
  if (!signatureMoveSelect) return;

  signatureMoveSelect.innerHTML =
    `<option value="">Select a signature move</option>`;

  if (!activePokemonHasUnlockedSignatureMove()) {
    signatureMoveSelect.disabled = true;
    return;
  }

  const moveIds = getActivePokemonKnownMoveIds();
  signatureMoveSelect.disabled = false;

  moveIds.forEach(id => {
    const move = MOVES_DB[id];
    if (!move) return;

    const option = document.createElement("option");
    option.value = id;
    option.textContent = move.name;
    signatureMoveSelect.appendChild(option);
  });

  const saved = signatureMoveBySlot[Number(activeSlot)];
  if (saved?.baseMoveId) {
    signatureMoveSelect.value = saved.baseMoveId;
  }
  if (signatureMovePreviewBtn) {
  const sig = getActivePokemonSignatureMove();
  signatureMovePreviewBtn.disabled = !sig?.baseMoveId;
  }

}


function renderAbilities() {
  const select = document.getElementById("ability-select");
  const box = document.getElementById("abilities");
  if (!select || !box) return;

  const pokemonLevel = getPokemonLevel();
  const slot = Number(activeSlot);

  select.innerHTML = `<option value="">Select an ability</option>`;
  box.value = "";

  const nameInput = document.getElementById(`p${slot}-name`);
  const key = nameInput?.value?.trim().toLowerCase();
  const pokemon = key ? POKEMON_DB[key] : null;

  const unlocked = pokemonLevel >= 4 && !!pokemon;
  select.disabled = !unlocked;

  if (!unlocked) {
    autoResizeTextarea(box);
    return;
  }

  const nativeIds = collectNativeAbilityIds(pokemon);
  const role = getActivePokemonAbilityRole();
  const roleIds = role ? collectRoleAbilityIds(role, pokemonLevel) : [];

  // Native group
  if (nativeIds.length) {
    const og = document.createElement("optgroup");
    og.label = "Native Abilities";

    nativeIds.forEach((id) => {
      const rec = getAbilityRecord(id);
      if (rec && typeof rec.unlocksAt === "number" && rec.unlocksAt > pokemonLevel) return;

      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = formatAbilityLabel(id);
      og.appendChild(opt);
    });

    if (og.children.length) select.appendChild(og);
  }

  // Role group (only when the L4 role segment is chosen)
  if (roleIds.length) {
    const og = document.createElement("optgroup");
    og.label = "Role Abilities";

    roleIds.forEach((id) => {
      const rec = getAbilityRecord(id);
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = rec?.name || formatAbilityLabel(id);
      og.appendChild(opt);
    });

    if (og.children.length) select.appendChild(og);
  }

  // Restore selection
  const saved = selectedAbilityBySlot[slot];
  if (saved && select.querySelector(`option[value="${saved}"]`)) {
    select.value = saved;
    const ability = getAbilityRecord(saved);
    box.value = ability ? (ability.description || "") : "";
  }

  autoResizeTextarea(box);
}



function refreshActivePokemonRoleUI() {
  renderPokemonRoleProgress();
  renderActivePokemonEffectiveRole();
  updateTrainerFeatures();
  updateTrainerActions();
}


function renderActivePokemonEffectiveRole() {
  const el = document.getElementById("pokemon-effective-role");
  if (!el) return;

  const rawRoles = getActivePokemonUnlockedRolesUpToLevel(getPokemonLevel());
  const roles = getUniqueRolesInOrder(rawRoles);


  el.textContent = roles.length
    ? `Roles: ${roles.map(capitalizeWord).join(" / ")}`
    : "Roles: —";
}



function renderPokemonRoleProgress() {
  const container = document.getElementById("pokemon-role-progress");
  if (!container) return;

  container.innerHTML = "";

  const slot = Number(activeSlot);
  const progression = pokemonRoleProgression[slot] || [];

  // Cycle order is driven by the currently selected roles (role-1..role-4), unique, in order.
  // Cycle: role A → role B → ... → off
  const availableRoles = getSelectedRolesInOrder();

  progression.forEach((_, index) => {
    const role = pokemonRoleProgression[slot]?.[index] ?? null;

    const seg = document.createElement("div");
    seg.classList.add("role-segment");

    if (!role) {
      seg.classList.add("empty");
      seg.title = "off";
    } else {
      seg.classList.add(role);
      seg.title = role;
    }

    seg.addEventListener("click", () => {
      if (!isEditMode) return;
      if (availableRoles.length === 0) return;

      const cycle = [...availableRoles, null];
      const current = pokemonRoleProgression[slot]?.[index] ?? null;

      let currentIndex = cycle.indexOf(current);
      if (currentIndex < 0) currentIndex = cycle.length - 1; // treat unknown as off

      const nextRole = cycle[(currentIndex + 1) % cycle.length];
      pokemonRoleProgression[slot][index] = nextRole;

      const eligibleTrainerActionMoves =
        getEligibleTrainerActionMoveIdsForSlot(slot);
      if (
        trainerActionMoveBySlot[slot] &&
        !eligibleTrainerActionMoves.includes(trainerActionMoveBySlot[slot])
      ) {
        trainerActionMoveBySlot[slot] = null;
      }

      const eligibleAbilities = getEligibleAbilityIdsForSlot(slot);
      if (
        selectedAbilityBySlot[slot] &&
        !eligibleAbilities.includes(selectedAbilityBySlot[slot])
      ) {
        selectedAbilityBySlot[slot] = null;
      }

      refreshActivePokemonRoleUI();
      renderGreatMoveSlots();
      renderAbilities();
      renderSignatureMoveSelector();

      saveSheetState();
    });

    container.appendChild(seg);
    renderActivePokemonEffectiveRole();
  });
}

function updateActivePokemonName() {
  const slot = Number(activeSlot);
  const display = document.getElementById("active-pokemon-name");
  if (!display) return;

  const nickname = pokemonNicknames[slot];
  const rawSpecies = document.getElementById(`p${slot}-name`)?.value?.trim();

  const species = capitalizeWord(rawSpecies);

  display.textContent = nickname || species || "Pokémon";

}

function autoResizeTextarea(textarea) {
  if (!textarea) return;

  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

function renderSignatureMoveUses() {
  const container = document.getElementById("signature-move-uses");
  if (!container) return;

  container.innerHTML = "";

  const slot = Number(activeSlot);
  const sig = signatureMoveBySlot[slot];

  // No signature move → no usage UI
  if (!sig?.baseMoveId) return;

  const state = signatureMoveUsesBySlot[slot];
  const maxUses = getMaxSignatureUses();

  for (let i = 0; i < maxUses; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.classList.add("sig-use");

    const spent = i < state.used;
    btn.textContent = spent ? "●" : "○";

    btn.addEventListener("click", () => {
      state.used = spent ? state.used - 1 : state.used + 1;
      state.used = Math.max(0, Math.min(state.used, maxUses));
      renderSignatureMoveUses();
      saveSheetState();
    });

    container.appendChild(btn);
  }
}


function renderGreatMoveUses() {
  const container = document.getElementById("great-move-uses");
  if (!container) return;

  container.innerHTML = "";

  const pokemonSlot = Number(activeSlot);
  const pokemonLevel = getPokemonLevel();
  const maxUses = getMaxGreatUses(pokemonLevel);

  const state = greatMoveUses[pokemonSlot];
  if (!state) return;

  for (let i = 0; i < maxUses; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.classList.add("great-use");

    const spent = i < state.used;
    btn.textContent = spent ? "●" : "○";

    btn.addEventListener("click", () => {
      state.used = spent ? state.used - 1 : state.used + 1;
      state.used = Math.max(0, Math.min(state.used, maxUses));
      renderGreatMoveUses();
      saveSheetState();
    });

    container.appendChild(btn);
  }
}



function renderGreatMoveSlots() {
  const container = document.getElementById("great-move-container");
  if (!container) return;

  // Remove previously rendered Great preview buttons
  container.querySelectorAll(".great-move-preview").forEach(el => el.remove());


  // Remove previously rendered extra slots
  container.querySelectorAll(".great-move-extra").forEach(el => el.remove());

  const pokemonLevel = getPokemonLevel(activeSlot);
  const slotCount = getMaxGreatSlots(pokemonLevel);
  const enabled = hasActivePokemonSelected();

  // FIRST (real) Great slot
  greatMoveSlot.disabled = !enabled;
  populateGreatMoveSlot();

  // Restore saved Great moves for active Pokémon
  const pokemonSlot = Number(activeSlot);
  const savedGreatMoves = knownGreatMoves[pokemonSlot] || [];

// Slot 1 (main Great slot)
if (savedGreatMoves[0]) {
  greatMoveSlot.value = savedGreatMoves[0];
}


  // Extra Great slots (all unlocked at this level)
  for (let i = 1; i < slotCount; i++) {
    const select = document.createElement("select");
    const slot = Number(activeSlot);
    const nameInput = document.getElementById(`p${slot}-name`);
    const key = nameInput?.value?.trim().toLowerCase();
    const activePokemon = key ? POKEMON_DB[key] : null;

    const nativeGreatMoveIds = activePokemon?.moves?.native || [];


    

    select.classList.add("great-move-slot", "great-move-extra");
    select.disabled = !enabled;
    select.dataset.index = i;
    select.addEventListener("change", handleGreatMoveChange);


    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = enabled
     ? `-- Great Move ${i + 1} --`
    : `Select a Pokémon first`;

    select.appendChild(placeholder);

    const role = getPrimaryRole();

    const pokemonSlot = Number(activeSlot);
    const alreadyPickedRoleMove = hasConsumedRoleGreatMove(pokemonSlot);

    nativeGreatMoveIds.forEach(id => {
      const move = MOVES_DB[id];
      if (!move) return;
      if (move.tier !== "great") return;

      // ✅ Allow native moves even if they are role-grantable
      const option = document.createElement("option");
      option.value = move.id;
      option.textContent = move.name;

      select.appendChild(option);
    });



    // Restore saved Great move for this slot (if any)
    if (savedGreatMoves[i]) {
      select.value = savedGreatMoves[i];
    }

    // Preview button for this Great slot
    const wrapper = document.createElement("div");
    wrapper.classList.add("great-move-row");

    const previewBtn = document.createElement("button");
    previewBtn.classList.add("great-move-preview");

    previewBtn.type = "button";
    previewBtn.textContent = "👁";
    previewBtn.title = "Preview Great Move";

    previewBtn.addEventListener("click", () => {
      const pokemonSlot = Number(activeSlot);
      const moveId = knownGreatMoves[pokemonSlot]?.[i];
      if (moveId) showMove(moveId);
    });

    wrapper.appendChild(select);
    wrapper.appendChild(previewBtn);
    container.appendChild(wrapper);

  }
}





function populateGreatMoveSlot() {
  greatMoveSlot.innerHTML = `<option value="">Great Move</option>`;
 //one more undo to get to working state
  const slot = Number(activeSlot);
  const nameInput = document.getElementById(`p${slot}-name`);
  const key = nameInput?.value?.trim().toLowerCase();
  const activePokemon = key ? POKEMON_DB[key] : null;
  if (!activePokemon) return;

  const nativeMoveIds = activePokemon.moves?.native || [];



  
  // Role for Great Move eligibility comes strictly from Pokémon Level 1
  const slotIndex = Number(activeSlot);
  const progression = pokemonRoleProgression[slotIndex];
  const role = getActivePokemonGreatMoveRole();



  if (!role) return;

  const pokemonSlot = Number(activeSlot);
  const alreadyPickedRoleMove = hasConsumedRoleGreatMove(pokemonSlot);
  const savedMoveId = knownGreatMoves[pokemonSlot]?.[0];


// 1️⃣ Role-granted Great moves (role-matching only)
Object.values(MOVES_DB).forEach(move => {
  if (move.tier !== "great") return;
  if (!move.grantableByRole) return;
  if (!Array.isArray(move.roles)) return;
  if (!move.roles.includes(role)) return;

  if (alreadyPickedRoleMove && move.id !== savedMoveId) return;

  const option = document.createElement("option");
  option.value = move.id;
  option.textContent = `${move.name} (${role.charAt(0).toUpperCase() + role.slice(1)})`;

  greatMoveSlot.appendChild(option);
});

// 2️⃣ Native Great moves only
nativeMoveIds.forEach(id => {
  const move = MOVES_DB[id];
  if (!move) return;
  if (move.tier !== "great") return;

  const option = document.createElement("option");
  option.value = move.id;
  option.textContent = move.name;

  greatMoveSlot.appendChild(option);
});
}



function handleGreatMoveChange(e) {
  const moveId = e.target.value || null;
  const index = Number(e.target.dataset.index);
  const pokemonSlot = Number(activeSlot);

  knownGreatMoves[pokemonSlot][index] = moveId;

  const eligibleTrainerActionMoves =
    getEligibleTrainerActionMoveIdsForSlot(pokemonSlot);
  if (
    trainerActionMoveBySlot[pokemonSlot] &&
    !eligibleTrainerActionMoves.includes(trainerActionMoveBySlot[pokemonSlot])
  ) {
    trainerActionMoveBySlot[pokemonSlot] = null;
  }

  if (moveId) showMove(moveId);
  renderSignatureMoveSelector();
  renderTrainerActionMoveSelector();
  updateTrainerActions();

  saveSheetState();

}


function handleNestMoveChange(e) {
  const moveId = e.target.value;
  const nestIndex = Number(e.target.dataset.slot);
  const pokemonSlot = Number(activeSlot);

  if (!moveId) return;

  if (!knownNestMoves[pokemonSlot]) {
    knownNestMoves[pokemonSlot] = [];
  }

  knownNestMoves[pokemonSlot][nestIndex] = moveId;

  showMove(moveId);
  renderSignatureMoveSelector();
  renderTrainerActionMoveSelector();
  updateTrainerActions();

  saveSheetState();
}



function renderNestMoveSlots() {
  const container = document.getElementById("nest-move-slots");
  if (!container) return;

  container.innerHTML = "";

  const level = getPokemonLevel();
  const limit = getNestMoveLimit(level);
 
  const enabled = hasActivePokemonSelected();
  

  // --- Great Move Preview Button ---
  let greatPreviewBtn = document.getElementById("great-preview-btn");

  if (!greatPreviewBtn) {
  greatPreviewBtn = document.createElement("button");
  greatPreviewBtn.id = "great-preview-btn";
  greatPreviewBtn.type = "button";
  greatPreviewBtn.textContent = "👁";
  greatPreviewBtn.title = "Preview Great Move";

  greatPreviewBtn.addEventListener("click", () => {
    const pokemonSlot = Number(activeSlot);
    const moveId = knownGreatMoves[pokemonSlot]?.[0];

    if (moveId) showMove(moveId);
  });

  greatMoveSlot.after(greatPreviewBtn);
  }


  const pokemonSlot = Number(activeSlot);
  const savedGreat = knownGreatMoves[pokemonSlot];

  if (savedGreat) {
  greatMoveSlot.value = savedGreat;
  }




  for (let i = 0; i < limit; i++) {
    const select = document.createElement("select");
   
    select.disabled = !enabled;

    select.dataset.slot = i;
    select.addEventListener("change", handleNestMoveChange);

    select.addEventListener("click", () => {
      if (select.value) showMove(select.value);
    });

    // Preview button (tiny affordance)
    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.textContent = "👁";
    previewBtn.title = "Preview move";

    previewBtn.addEventListener("click", () => {
      const pokemonSlot = Number(activeSlot);
      const moveId = knownNestMoves[pokemonSlot]?.[i];
      if (moveId) showMove(moveId);
    });

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = enabled
  ? `-- Nest Move ${i + 1} --`
  : `Select a Pokémon first`;

    
    select.appendChild(placeholder);

    container.appendChild(select);
    container.appendChild(previewBtn);


    const nativeNestMoves = getActivePokemonNativeNestMoves();

    nativeNestMoves.forEach(move => {
      const opt = document.createElement("option");
      opt.value = move.id;
      opt.textContent = move.name;
      select.appendChild(opt);
    });

      const pokemonSlot = Number(activeSlot);
      const savedMove = knownNestMoves[pokemonSlot][i];

      if (savedMove) {
        select.value = savedMove;
      }

    
  }
  


}

function showResolvedMove(resolvedMove) {
  if (!resolvedMove?.id) return;

  // Temporarily render as if it were in MOVES_DB
  const original = MOVES_DB[resolvedMove.id];

  // Safety: do nothing if base move missing
  if (!original) return;

  // Swap in resolved version
  MOVES_DB[resolvedMove.id] = resolvedMove;

  // Render
  showMove(resolvedMove.id);

  // Restore original immediately
  MOVES_DB[resolvedMove.id] = original;
}


// call moves
function showMove(moveOrId) {

  const box = document.getElementById("move-preview-content");
  if (!box) return;

  const move =
    typeof moveOrId === "string"
      ? MOVES_DB[moveOrId]
      : moveOrId;

  const slot = Number(activeSlot);

  const nickname = pokemonNicknames[slot]?.trim();
  const rawSpecies = document.getElementById(`p${slot}-name`)?.value?.trim();

  const speciesName = capitalizeWord(rawSpecies);

  const displayName = nickname || speciesName || "Pokémon";


  if (!move) {
    box.textContent = "Move not found.";
    return;
  }

  // ✅ GET CURRENT ROLE HERE
  
    const role =
      getActivePokemonEffectiveRole() ||
      "striker";


 // const role = getPrimaryRole(activeSlot) || "striker";


  // ✅ RENDER LOGIC CONTINUES HERE
  const diceProfile = getActivePokemonDiceProfile() || {
    physical: "d6",
    special: "d6",
    healing: "d6"
  };

  const die =
    move.category === "healing"
      ? diceProfile.healing
      : move.category === "physical"
        ? diceProfile.physical
        : diceProfile.special;


  let damageText = "";

  if (move.baseDice && die) {
    damageText = `${move.baseDice}${die}`;
  }


  const prefix = move.descriptionPrefix || "";
  const suffix = move.descriptionSuffix || "";

  const description =
    prefix +
    move.description.replace("{damage}", damageText) +
    suffix;

  const elementText = move.element
  ? move.element.charAt(0).toUpperCase() + move.element.slice(1)
  : "";

  const tierText = move.tier
    ? move.tier.charAt(0).toUpperCase() + move.tier.slice(1)
    : "";

  const categoryText = move.category
    ? move.category.charAt(0).toUpperCase() + move.category.slice(1)
    : "";


  box.innerHTML = `
    <strong>${displayName}</strong><br>
    <strong>${move.name} (${elementText})</strong><br>
    <em>${move.economy} (${tierText}) · ${categoryText}</em><br><br>

    ${description}

    ${move.notes ? `<br><br><em>Notes:</em> ${move.notes}` : ""}

    <hr>

    <strong>Target:</strong> ${move.target}<br>
    <strong>Range:</strong> ${move.range}<br>
    <strong>Tags:</strong> ${move.tags?.join(", ") || "None"}<br><br>

    <strong>Status:</strong> ${
      move.status?.inflicts && move.status.inflicts !== "none"
        ? move.status.inflicts
        : "None"
  }<br>

  <strong>Buff/Debuff:</strong> ${
    move.buffDebuff?.stat && move.buffDebuff.stat !== "none"
      ? `${move.buffDebuff.stat.toUpperCase()} ${move.buffDebuff.amount} (${move.buffDebuff.duration})`
      : "None"
  }
`;

}




function setStat(id, value) {
  document.getElementById(id).value = value ?? "";
}



//populate stats
function fillSlotStats(slotNumber, stats) {
  document.getElementById(`p${slotNumber}-atk`).value = stats.atk ?? "";
  document.getElementById(`p${slotNumber}-def`).value = stats.def ?? "";
  document.getElementById(`p${slotNumber}-sp-atk`).value = stats.spAtk ?? "";
  document.getElementById(`p${slotNumber}-sp-def`).value = stats.spDef ?? "";
  document.getElementById(`p${slotNumber}-man`).value = stats.man ?? "";
  document.getElementById(`p${slotNumber}-spd`).value = stats.spd ?? "";
}



//call PokemonDB
function handleNameInput() {
  const slotNumber = this.id[1];
  const rawSpecies = this.value.trim();

  pokemonSpeciesBySlot[slotNumber] = rawSpecies;

  const key = rawSpecies.toLowerCase();
  const pokemon = key ? POKEMON_DB[key] : null;

  if (!pokemon) {
    clearSlotStats(slotNumber);
    clearSlotMods(slotNumber);
    saveSheetState();
    return;
  }

  const stats = pokemon.baseStats;

  fillSlotStats(slotNumber, {
    atk: stats.atk,
    def: stats.def,
    spAtk: stats.spAtk,
    spDef: stats.spDef,
    man: stats.man,
    spd: stats.spd
  });

  fillSlotModsFromStats(slotNumber);
  updateActivePokemonName();
  saveSheetState();
  updateActiveSlotButtonsUI();
}


function setMod(id, value) {
  document.getElementById(id).value = value ?? "";
}

function fillActiveMods() {
  setMod("atk-mod", 0);
  setMod("def-mod", 0);
  setMod("sp-atk-mod", 0);
  setMod("sp-def-mod", 0);
  setMod("man-mod", 0);
  setMod("spd-mod", 0);
}


function fillSlotMods(slotNumber) {
  document.getElementById(`p${slotNumber}-atk-mod`).value = 0;
  document.getElementById(`p${slotNumber}-def-mod`).value = 0;
  document.getElementById(`p${slotNumber}-sp-atk-mod`).value = 0;
  document.getElementById(`p${slotNumber}-sp-def-mod`).value = 0;
  document.getElementById(`p${slotNumber}-man-mod`).value = 0;
  document.getElementById(`p${slotNumber}-spd-mod`).value = 0;
}

function clearSlotMods(slotNumber) {
  document.getElementById(`p${slotNumber}-atk-mod`).value = "";
  document.getElementById(`p${slotNumber}-def-mod`).value = "";
  document.getElementById(`p${slotNumber}-sp-atk-mod`).value = "";
  document.getElementById(`p${slotNumber}-sp-def-mod`).value = "";
  document.getElementById(`p${slotNumber}-man-mod`).value = "";
  document.getElementById(`p${slotNumber}-spd-mod`).value = "";
}


  // Base stats
function copySlotToActive(slotNumber) {
  const baseStats = {
    atk: Number(document.getElementById(`p${slotNumber}-atk`).value),
    def: Number(document.getElementById(`p${slotNumber}-def`).value),
    spAtk: Number(document.getElementById(`p${slotNumber}-sp-atk`).value),
    spDef: Number(document.getElementById(`p${slotNumber}-sp-def`).value),
    man: Number(document.getElementById(`p${slotNumber}-man`).value),
    spd: Number(document.getElementById(`p${slotNumber}-spd`).value)
  };

  const finalStats = baseStats;

  

  setStat("atk", finalStats.atk);
  setStat("def", finalStats.def);
  setStat("sp-atk", finalStats.spAtk);
  setStat("sp-def", finalStats.spDef);
  setStat("man", finalStats.man);
  setStat("spd", finalStats.spd);

  fillActiveMods();
  updateDerivedMiniStats();



  // Modifiers
  document.getElementById("atk-mod").value = document.getElementById(`p${slotNumber}-atk-mod`).value;
  document.getElementById("def-mod").value = document.getElementById(`p${slotNumber}-def-mod`).value;
  document.getElementById("sp-atk-mod").value = document.getElementById(`p${slotNumber}-sp-atk-mod`).value;
  document.getElementById("sp-def-mod").value = document.getElementById(`p${slotNumber}-sp-def-mod`).value;
  document.getElementById("man-mod").value = document.getElementById(`p${slotNumber}-man-mod`).value;
  document.getElementById("spd-mod").value = document.getElementById(`p${slotNumber}-spd-mod`).value;
  
  // Derived stats (NEW)
  updateDerivedMiniStats();

}



function fillSlotModsFromStats(slotNumber) {
  document.getElementById(`p${slotNumber}-atk-mod`).value = statToMod(document.getElementById(`p${slotNumber}-atk`).value);
  document.getElementById(`p${slotNumber}-def-mod`).value = statToMod(document.getElementById(`p${slotNumber}-def`).value);
  document.getElementById(`p${slotNumber}-sp-atk-mod`).value = statToMod(document.getElementById(`p${slotNumber}-sp-atk`).value);
  document.getElementById(`p${slotNumber}-sp-def-mod`).value = statToMod(document.getElementById(`p${slotNumber}-sp-def`).value);
  document.getElementById(`p${slotNumber}-man-mod`).value = statToMod(document.getElementById(`p${slotNumber}-man`).value);
  document.getElementById(`p${slotNumber}-spd-mod`).value = statToMod(document.getElementById(`p${slotNumber}-spd`).value);
}

function setActiveSlot(slotNumber) {
  activeSlot = Number(slotNumber);

  // Hydrate active panel inputs from the selected slot
  copySlotToActive(activeSlot);

  // remove highlight from all slots
  document.querySelectorAll(".pokemon-slot").forEach((slot) => {
    slot.classList.remove("is-active");
  });

  // add highlight to the active slot
  const activeDiv = document.getElementById(`pokemon-slot-${activeSlot}`);
  if (activeDiv) activeDiv.classList.add("is-active");

  updateActiveSlotButtonsUI();
  updateActivePokemonName();

  // View-only renders
  renderNestMoveSlots();
  renderGreatMoveSlots();
  renderGreatMoveUses();

  syncPokemonRoleProgression(activeSlot, getPokemonLevel());
  renderPokemonRoleProgress();
  renderActivePokemonEffectiveRole();
  renderAbilities();
  renderSignatureMoveSelector();
  renderSignatureMoveEditor();
  renderSignatureMoveUses();
  renderTrainerActionMoveSelector();
  renderTrainerActionUses();
  updateTrainerActions();
  updateDerivedMiniStats();
}



//Mini Stats
function updateDerivedMiniStats() {
  //Movespeed
  const spdModValue = document.getElementById("spd-mod")?.value;
  const moveSpeed = movementFromSpdMod(spdModValue);

  const moveSpeedBox = document.getElementById("move-speed");
  if (moveSpeedBox) moveSpeedBox.value = moveSpeed;

  //CE
  const ceBox = document.getElementById("ce");
  if (ceBox) ceBox.value = calculateCE();

  //Awareness
  const awareBox = document.getElementById("aware");
  if (awareBox) awareBox.value = calculateAwareness();
}

function updateTrainerPB(opts = { renderUses: true }) {
  const levelInput = document.getElementById("trainer-level");
  const pbBox = document.getElementById("pb");

  if (!levelInput || !pbBox) return;

  const trainerLevel = getTotalRoleLevels();

  pbBox.value = pbFromTrainerLevel(trainerLevel);

  if (opts.renderUses) {
    renderSignatureMoveUses();
    renderTrainerActionUses();
  }


}

//Trainer Actions
function updateTrainerActions() {
  const actionsBox = document.getElementById("trainer-actions");
  if (!actionsBox) return;

  const actionLines = [];

  // Baseline Trainer Actions (always available)
  actionLines.push("Use Item");
  actionLines.push("Swap Pokémon");
  actionLines.push("Quick Switch (Reaction)\nCost: 1");

  // Pokémon-driven Level 3 Trainer Command
  const actionDef = getActivePokemonLevel3TrainerActionDef();

  if (actionDef) {
    const slot = Number(activeSlot);
    const selectedMoveId = trainerActionMoveBySlot[slot];
    const selectedMove = selectedMoveId
      ? MOVES_DB[selectedMoveId]
      : null;

    if (selectedMove) {
      actionLines.push(
        `Trainer Command: ${selectedMove.name}\nCost: 1`
      );
    } else {
      actionLines.push(
        `${actionDef.roleName} (Level 3): Trainer Command\n` +
        `Select a Great move you know that matches your role.\n` +
        `Cost: 1`
      );
    }
  }

  actionsBox.value = actionLines.join("\n");
  autoResizeTextarea(actionsBox);
}





function updateTrainerFeatures() {
  const featuresBox = document.getElementById("trainer-features");
  if (!featuresBox) return;

  const featureLines = [];

  const slot = Number(activeSlot);
  const progression = pokemonRoleProgression[slot];

  // -------------------------
  // Pokémon-driven Level 2
  // -------------------------
  if (Array.isArray(progression)) {
    const roleAt2 = progression[1]; // Level 2 → index 1

    if (roleAt2) {
      const roleDef = getRoleDefinition(roleAt2);
      const level2Def = roleDef?.levels?.["2"];

      if (level2Def?.type === "feature" && level2Def.description) {
        featureLines.push(
          `${roleDef.name} (Level 2): ${level2Def.description}`
        );
      }
    }
  }

  // -------------------------
  // Pokémon-driven Level 3 (text only for now)
  // -------------------------
  const roleAt3 = progression?.[2];

  if (roleAt3) {
    const roleDef = getRoleDefinition(roleAt3);
    const level3Def = roleDef?.levels?.["3"];

    if (level3Def?.statBoost?.displayOnly) {
      featureLines.push(
        `${roleDef.name} (Level 3): +${level3Def.statBoost.amount} ${level3Def.statBoost.stat.toUpperCase()}`
      );
    }
  }

  featuresBox.value = featureLines.join("\n");
  autoResizeTextarea(featuresBox);
}






// ==============================
// ==============================
// ON(EVENT)
// ==============================
// ==============================



manualSaveBtn?.addEventListener("click", () => {
  saveSheetState();
  if (manualSaveBtn) {
    const original = manualSaveBtn.textContent;
    manualSaveBtn.textContent = "Saved!";
    window.setTimeout(() => {
      manualSaveBtn.textContent = original || "Save";
    }, 800);
  }
});

toggleEditBtn?.addEventListener("click", () => {
  applyEditMode(!isEditMode);
});
exportSheetBtn?.addEventListener("click", () => {
  // Ensure LocalStorage state matches current UI before exporting.
  saveSheetState();

  const trainerName = document.getElementById("trainer-name")?.value || "";
  const safeName = sanitizeExportFilename(trainerName);
  const fileName = `${safeName || "trainer"}-sheet.json`;

  const envelope = buildExportEnvelope();
  downloadJsonFile(envelope, fileName);
});

importSheetBtn?.addEventListener("click", () => {
  const input = getImportFileInput();
  input.value = "";
  input.click();
});

getImportFileInput().addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const raw = JSON.parse(text);

    const payload = unwrapImportedPayload(raw);
    if (!isValidImportedState(payload)) {
      window.alert("Import failed: invalid or incompatible sheet file.");
      return;
    }

    // Restore contract: no saves during restore, no render until end.
    isRestoring = true;
    restoreStateFromPayload(payload);
    isRestoring = false;

    // Finalize: match existing boot ordering but avoid rebinding listeners.
    updateTrainerPB();
    updateTrainerFeatures();
    setActiveSlot(1);
    applyEditMode(false);

    // Persist the imported state for reloads (after restore is complete).
    saveSheetState();
  } catch (err) {
    console.error("Import failed", err);
    window.alert("Import failed: could not read that file.");
  } finally {
    // allow re-importing the same file in the future
    e.target.value = "";
  }
});


// ==============================
// MOVE TABS (Nest / Great / Signature) - always swappable
// ==============================

let activeMovesTab = "nest";

function setMovesTab(tabName) {
  const tab = String(tabName || "nest");
  activeMovesTab = tab;

  document.querySelectorAll(".move-tab").forEach((btn) => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  document.querySelectorAll(".move-tab-panel").forEach((panel) => {
    const isActive = panel.dataset.tab === tab;
    panel.hidden = !isActive;
  });
}

function bindMoveTabs() {
  document.querySelectorAll(".move-tab").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setMovesTab(btn.dataset.tab);
    });
  });

  setMovesTab(activeMovesTab);
}


// ==============================
// ACTIVE SLOT SWITCHER (circles)
// ==============================

function getSlotDisplayName(slotNumber) {
  const slot = Number(slotNumber);
  const nickname = (pokemonNicknames?.[slot] || "").trim();
  const rawSpecies = (pokemonSpeciesBySlot?.[slot] || "").trim();
  const species = rawSpecies ? capitalizeWord(rawSpecies) : "";
  return nickname || species || `Slot ${slot}`;
}

function updateActiveSlotButtonsUI() {
  document.querySelectorAll(".active-slot-btn").forEach((btn) => {
    const slot = Number(btn.dataset.slot);
    const label = getSlotDisplayName(slot);
    btn.classList.toggle("is-active", slot === Number(activeSlot));
    btn.title = label;
    btn.setAttribute("aria-label", label);
  });
}

function bindActiveSlotButtons() {
  document.querySelectorAll(".active-slot-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const slot = Number(btn.dataset.slot);
      if (!slot || Number.isNaN(slot)) return;
      setActiveSlot(slot);
    });
  });
}

const isEditBypassTarget = (target) => {
  if (!target) return false;
  return Boolean(
    target.closest("#toggle-edit, #manual-save, #export-sheet, #import-sheet, .set-active, .active-slot-btn, .move-tab, #signature-move-preview, .move-tile__preview")
  );
};

const blockIfLocked = (e) => {
  if (isEditMode) return;
  if (isEditBypassTarget(e.target)) return;
  e.preventDefault();
  e.stopImmediatePropagation();
};

sheetRoot?.addEventListener("click", blockIfLocked, true);
sheetRoot?.addEventListener("input", blockIfLocked, true);
sheetRoot?.addEventListener("change", blockIfLocked, true);




trainerActionMoveSelect?.addEventListener("change", (e) => {
  const slot = Number(activeSlot);
  const moveId = e.target.value || null;

  trainerActionMoveBySlot[slot] = moveId;
  updateTrainerActions();
  saveSheetState();

});


function bindSignatureEditor() {
  const getSlot = () => Number(activeSlot);

  document.getElementById("sig-element")?.addEventListener("input", e => {
    setSignatureOverride(getSlot(), "element", e.target.value);
    saveSheetState();
  });

  document.getElementById("sig-category")?.addEventListener("change", e => {
    setSignatureOverride(getSlot(), "category", e.target.value);
    saveSheetState();
  });

  document.getElementById("sig-base-dice")?.addEventListener("input", e => {
    const v = Number(e.target.value);
    setSignatureOverride(getSlot(), "baseDice", Number.isFinite(v) ? v : null);
    saveSheetState();
  });

  document.getElementById("sig-desc-prefix")?.addEventListener("input", e => {
    setSignatureOverride(getSlot(), "descriptionPrefix", e.target.value);
    saveSheetState();
  });

  document.getElementById("sig-desc-suffix")?.addEventListener("input", e => {
    setSignatureOverride(getSlot(), "descriptionSuffix", e.target.value);
    saveSheetState();
  });

  document.getElementById("sig-range")?.addEventListener("input", e => {
    setSignatureOverride(getSlot(), "range", e.target.value);
    saveSheetState();
  });

  document.getElementById("sig-target")?.addEventListener("input", e => {
    setSignatureOverride(getSlot(), "target", e.target.value);
    saveSheetState();
  });

  document.getElementById("sig-tags")?.addEventListener("input", e => {
    const tags = e.target.value
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    setSignatureOverride(getSlot(), "tags", tags.length ? tags : null);
    saveSheetState();
  });
// STATUS
  document.getElementById("sig-status")?.addEventListener("change", e => {
    const value = e.target.value;

    setSignatureOverride(
      activeSlot,
      "status",
      value
        ? { inflicts: value }
        : null
    );
    saveSheetState();
  });

  // BUFF / DEBUFF
  const updateBuffDebuff = () => {
    const stat = document.getElementById("sig-buff-stat")?.value;
    const amount = Number(document.getElementById("sig-buff-amount")?.value);
    const duration = document.getElementById("sig-buff-duration")?.value;

    if (!stat || !Number.isFinite(amount)) {
      setSignatureOverride(activeSlot, "buffDebuff", null);
      saveSheetState();
      return;
    }

    setSignatureOverride(activeSlot, "buffDebuff", {
      stat,
      amount,
      duration: duration || "1 round"
    });
    saveSheetState();
  };

  ["sig-buff-stat", "sig-buff-amount", "sig-buff-duration"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", updateBuffDebuff);
  });

}



signatureMoveSelect?.addEventListener("change", (e) => {
  const moveId = e.target.value || null;
  const slot = Number(activeSlot);

  if (!moveId) {
    signatureMoveBySlot[slot] = structuredClone(SIGNATURE_MOVE_TEMPLATE);
    renderSignatureMoveEditor();
    saveSheetState();
    return;
  }


  const sig = structuredClone(SIGNATURE_MOVE_TEMPLATE);
  sig.baseMoveId = moveId;

  // OPTIONAL test defaults (safe)
  sig.overrides.element = "fire";
  sig.overrides.baseDice = 3;
  sig.overrides.descriptionPrefix =
    "This move has been altered by your bond. ";

  signatureMoveBySlot[slot] = sig;


  signatureMoveUsesBySlot[slot].used = 0;
  renderSignatureMoveUses();

  
  renderSignatureMoveSelector();
  renderSignatureMoveEditor();
  saveSheetState();
  


});


document.getElementById("ability-select")?.addEventListener("change", (e) => {
  const slot = Number(activeSlot);
  const abilityId = e.target.value || null;

  selectedAbilityBySlot[slot] = abilityId;

  const box = document.getElementById("abilities");
  const ability = getAbilityRecord(abilityId);

  box.value = ability ? ability.description : "";
  autoResizeTextarea(box);
  saveSheetState();
});


document.getElementById("role-1")?.addEventListener("change", () => {
 
});


//Great Moves Preview
greatMoveSlot.dataset.index = 0;
greatMoveSlot.addEventListener("change", handleGreatMoveChange);



greatMoveSlot.addEventListener("click", () => {
  if (greatMoveSlot.value) showMove(greatMoveSlot.value);
});



nameInputs.forEach((input) => {
  input.addEventListener("input", handleNameInput);
});

document.querySelectorAll(".set-active").forEach((btn) => {
  btn.addEventListener("click", () => {
    const slotNumber = btn.dataset.slot; // "1", "2", "3", or "4"
    copySlotToActive(slotNumber);
    setActiveSlot(slotNumber);

  });
});

document
  .getElementById("toggle-signature-editor")
  ?.addEventListener("change", e => {
    const editor = document.getElementById("signature-move-editor");
    if (editor) editor.style.display = e.target.checked ? "block" : "none";
  });

// Sync initial signature editor visibility (default is OFF)
(() => {
  const toggle = document.getElementById("toggle-signature-editor");
  const editor = document.getElementById("signature-move-editor");
  if (toggle && editor) editor.style.display = toggle.checked ? "block" : "none";
})();


document.getElementById("trainer-level")?.addEventListener("input", updateTrainerPB);


for (let i = 1; i <= 4; i++) {
  document.getElementById(`role-${i}`)?.addEventListener("change", () => {
    updateTrainerFeatures();
    renderAbilities();
    syncTrainerAndPokemonLevelFromRoles();
    saveSheetState();
  });

  document.getElementById(`role-${i}-level`)?.addEventListener("input", () => {
    updateTrainerFeatures();
    updateTrainerActions();
    syncTrainerAndPokemonLevelFromRoles();
    saveSheetState();
  });
}



//Trainer Actions update

for (let i = 1; i <= 4; i++) {
  document.getElementById(`role-${i}`)?.addEventListener("change", updateTrainerActions);
  document.getElementById(`role-${i}-level`)?.addEventListener("input", updateTrainerActions);
}



document.addEventListener("DOMContentLoaded", () => {
  void bootstrapApp();
});


partyPokemonLevelInput?.addEventListener("input", () => {
  renderNestMoveSlots();
});

partyPokemonLevelInput?.addEventListener("input", () => {
  renderGreatMoveSlots();
});

partyPokemonLevelInput?.addEventListener("input", () => {
  syncPokemonRoleProgression(activeSlot, getPokemonLevel());
  renderPokemonRoleProgress();
  renderActivePokemonEffectiveRole();

});

partyPokemonLevelInput?.addEventListener("input", renderAbilities);

partyPokemonLevelInput?.addEventListener("input", renderSignatureMoveSelector);

signatureMovePreviewBtn?.addEventListener("click", () => {
  const move = getResolvedSignatureMoveForPreview();
  if (!move) return;

  showResolvedMove(move);
});





for (let slot = 1; slot <= 4; slot++) {
  const nicknameInput = document.getElementById(`p${slot}-nickname`);
  if (!nicknameInput) continue;

  nicknameInput.addEventListener("input", () => {
  const value = nicknameInput.value.trim();

  // Capitalize first letter only
  const formatted =
    value.length > 0
      ? value.charAt(0).toUpperCase() + value.slice(1)
      : "";

  pokemonNicknames[slot] = formatted;
  saveSheetState();
});

}







// ==============================
// LOCAL STORAGE (STATE + USER INPUTS ONLY)
// ==============================

const STORAGE_KEY = "pokemon_trainer_sheet_v1";
const STORAGE_VERSION = 1;

function buildSavePayload() {
  const trainer = {
    playerName: document.getElementById("player-name")?.value ?? "",
    trainerName: document.getElementById("trainer-name")?.value ?? "",
    trainerClass: document.getElementById("trainer-class")?.value ?? "",
    // Role selections/levels are player choices (not derived values)
    roleSelections: {},
    roleLevels: {},
    // Freeform notes
    textareas: {
      trainerActions: document.getElementById("trainer-actions")?.value ?? "",
      trainerFeatures: document.getElementById("trainer-features")?.value ?? "",
      bag: document.getElementById("bag")?.value ?? ""
    }
  };

  for (let i = 1; i <= 4; i++) {
    trainer.roleSelections[i] = document.getElementById(`role-${i}`)?.value ?? "";
    trainer.roleLevels[i] = Number(document.getElementById(`role-${i}-level`)?.value ?? 0);
  }

  const pokemon = {};
  for (let slot = 1; slot <= 4; slot++) {
    const rawSpecies =
      (pokemonSpeciesBySlot?.[slot] ?? document.getElementById(`p${slot}-name`)?.value ?? "").trim();

    pokemon[slot] = {
      species: rawSpecies,
      nickname: (pokemonNicknames?.[slot] ?? document.getElementById(`p${slot}-nickname`)?.value ?? "").trim()
    };
  }

  return {
    version: STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    trainer,
    pokemon,

    // App state (authoritative)
    pokemonRoleProgression,
    knownNestMoves,
    knownGreatMoves,
    greatMoveUses,

    selectedAbilityBySlot,
    trainerActionMoveBySlot,
    trainerActionUses,

    signatureMoveBySlot,
    signatureMoveUsesBySlot
  };
}

function saveSheetState() {
  if (isRestoring) return;

  try {
    const payload = buildSavePayload();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to save sheet state", err);
  }
}

function readSheetState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== "object") return null;
    return payload;
  } catch (err) {
    console.error("Failed to parse saved sheet state", err);
    return null;
  }
}

const EXPORT_FORMAT = "pokemon-trainer-sheet";
const EXPORT_FORMAT_VERSION = 1;

function sanitizeExportFilename(raw) {
  const base = String(raw || "sheet")
    .trim()
    .replace(/[^a-z0-9._-]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
  return base || "sheet";
}

function downloadJsonFile(data, filename) {
  const jsonText = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonText], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function buildExportEnvelope() {
  return {
    exportFormat: EXPORT_FORMAT,
    exportFormatVersion: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    state: buildSavePayload()
  };
}

function unwrapImportedPayload(raw) {
  if (!raw || typeof raw !== "object") return null;

  // Accept either:
  // 1) { exportFormat, exportFormatVersion, state: { ... } }
  // 2) { ...state... } (direct localStorage payload)
  const maybeEnvelope = raw;
  if (maybeEnvelope.state && typeof maybeEnvelope.state === "object") {
    if (maybeEnvelope.exportFormat && maybeEnvelope.exportFormat !== EXPORT_FORMAT) return null;
    if (
      maybeEnvelope.exportFormatVersion != null &&
      Number(maybeEnvelope.exportFormatVersion) !== EXPORT_FORMAT_VERSION
    ) {
      return null;
    }
    return maybeEnvelope.state;
  }

  return raw;
}

function isValidImportedState(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (payload.version == null) return false;
  if (Number(payload.version) !== Number(STORAGE_VERSION)) return false;

  if (!payload.trainer || typeof payload.trainer !== "object") return false;
  if (!payload.pokemon || typeof payload.pokemon !== "object") return false;

  return true;
}

function restoreStateFromPayload(payload) {
  if (!payload) return;

  // Phase: Load saved state into JS objects only
  if (payload.pokemonRoleProgression) pokemonRoleProgression = payload.pokemonRoleProgression;
  if (payload.knownNestMoves) knownNestMoves = payload.knownNestMoves;
  if (payload.knownGreatMoves) knownGreatMoves = payload.knownGreatMoves;
  if (payload.greatMoveUses) greatMoveUses = payload.greatMoveUses;

  if (payload.selectedAbilityBySlot) selectedAbilityBySlot = payload.selectedAbilityBySlot;
  if (payload.trainerActionMoveBySlot) trainerActionMoveBySlot = payload.trainerActionMoveBySlot;
  if (payload.trainerActionUses) trainerActionUses = payload.trainerActionUses;

  if (payload.signatureMoveBySlot) signatureMoveBySlot = payload.signatureMoveBySlot;
  if (payload.signatureMoveUsesBySlot) signatureMoveUsesBySlot = payload.signatureMoveUsesBySlot;

  // Restore Trainer fields (inputs only)
  const trainer = payload.trainer || {};
  const playerNameEl = document.getElementById("player-name");
  if (playerNameEl) playerNameEl.value = trainer.playerName || "";
  const trainerNameEl = document.getElementById("trainer-name");
  if (trainerNameEl) trainerNameEl.value = trainer.trainerName || "";
  const trainerClassEl = document.getElementById("trainer-class");
  if (trainerClassEl) trainerClassEl.value = trainer.trainerClass || "";

  if (trainer.textareas) {
    const actionsEl = document.getElementById("trainer-actions");
    if (actionsEl) actionsEl.value = trainer.textareas.trainerActions || "";

    const featuresEl = document.getElementById("trainer-features");
    if (featuresEl) featuresEl.value = trainer.textareas.trainerFeatures || "";

    const bagEl = document.getElementById("bag");
    if (bagEl) bagEl.value = trainer.textareas.bag || "";
  }

  // Restore role selections + role levels (inputs only)
  if (trainer.roleSelections) {
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`role-${i}`);
      if (el) el.value = trainer.roleSelections[i] || "";
    }
  }
  if (trainer.roleLevels) {
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`role-${i}-level`);
      if (el) el.value = Number(trainer.roleLevels[i] || 0);
    }
  }

  // Sync Trainer & Pokémon levels once (no render)
  syncTrainerAndPokemonLevelFromRoles({ render: false });
  const derivedLevel = getTotalRoleLevels();

  // Restore Pokémon role progression arrays (then sync length)
  for (let slot = 1; slot <= 4; slot++) {
    const arr = payload.pokemonRoleProgression?.[slot];
    pokemonRoleProgression[slot] = Array.isArray(arr) ? arr : [];
    syncPokemonRoleProgression(slot, derivedLevel);
  }

  // Restore Pokémon species + nicknames (silent stat hydration)
  if (payload.pokemon) {
    for (let slot = 1; slot <= 4; slot++) {
      const species = (payload.pokemon?.[slot]?.species || "").trim();
      pokemonSpeciesBySlot[slot] = species;

      const nameEl = document.getElementById(`p${slot}-name`);
      if (nameEl) {
        nameEl.value = species;
        // Hydrate stats without triggering saves (guarded by isRestoring)
        handleNameInput.call(nameEl);
      }

      const nickname = (payload.pokemon?.[slot]?.nickname || "").trim();
      pokemonNicknames[slot] = nickname;
      const nickEl = document.getElementById(`p${slot}-nickname`);
      if (nickEl) nickEl.value = nickname;
    }
  }
}

// ==============================
// ==============================
// INIT / LISTENERS
// ==============================
// ==============================






  const autoResizeIds = [
  "trainer-actions",
  "trainer-features",
  "signature-moves",
  "bag",
  "abilities"
];

autoResizeIds.forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener("input", () => {
    autoResizeTextarea(el);
    saveSheetState();
  });
});

async function bootstrapApp() {
  // 1) Load JSON databases first (required for restoration)
  await Promise.all([
    loadPokemonDB(),
    loadMovesDB(),
    loadAbilitiesDB(),
    loadRolesDB()
  ]);

  // 2) Restore (no rendering until the end)
  isRestoring = true;

  const payload = readSheetState();

  if (payload) {
    // Phase: Load LocalStorage state into JS objects only
    if (payload.pokemonRoleProgression) pokemonRoleProgression = payload.pokemonRoleProgression;
    if (payload.knownNestMoves) knownNestMoves = payload.knownNestMoves;
    if (payload.knownGreatMoves) knownGreatMoves = payload.knownGreatMoves;
    if (payload.greatMoveUses) greatMoveUses = payload.greatMoveUses;

    if (payload.selectedAbilityBySlot) selectedAbilityBySlot = payload.selectedAbilityBySlot;
    if (payload.trainerActionMoveBySlot) trainerActionMoveBySlot = payload.trainerActionMoveBySlot;
    if (payload.trainerActionUses) trainerActionUses = payload.trainerActionUses;

    if (payload.signatureMoveBySlot) signatureMoveBySlot = payload.signatureMoveBySlot;
    if (payload.signatureMoveUsesBySlot) signatureMoveUsesBySlot = payload.signatureMoveUsesBySlot;

    // Restore Trainer fields (inputs only)
    const trainer = payload.trainer || {};
    if (document.getElementById("player-name")) document.getElementById("player-name").value = trainer.playerName || "";
    if (document.getElementById("trainer-name")) document.getElementById("trainer-name").value = trainer.trainerName || "";
    if (document.getElementById("trainer-class")) document.getElementById("trainer-class").value = trainer.trainerClass || "";

    if (trainer.textareas) {
      const actionsEl = document.getElementById("trainer-actions");
      if (actionsEl) actionsEl.value = trainer.textareas.trainerActions || "";

      const featuresEl = document.getElementById("trainer-features");
      if (featuresEl) featuresEl.value = trainer.textareas.trainerFeatures || "";

      const bagEl = document.getElementById("bag");
      if (bagEl) bagEl.value = trainer.textareas.bag || "";
    }

    // Restore role selections + role levels (inputs only)
    if (trainer.roleSelections) {
      for (let i = 1; i <= 4; i++) {
        const el = document.getElementById(`role-${i}`);
        if (el) el.value = trainer.roleSelections[i] || "";
      }
    }
    if (trainer.roleLevels) {
      for (let i = 1; i <= 4; i++) {
        const el = document.getElementById(`role-${i}-level`);
        if (el) el.value = Number(trainer.roleLevels[i] || 0);
      }
    }

    // Sync Trainer & Pokémon levels once (no render)
    syncTrainerAndPokemonLevelFromRoles({ render: false });
    const derivedLevel = getTotalRoleLevels();

    // Restore Pokémon role progression arrays (then sync length)
    for (let slot = 1; slot <= 4; slot++) {
      const arr = payload.pokemonRoleProgression?.[slot];
      pokemonRoleProgression[slot] = Array.isArray(arr) ? arr : [];
      syncPokemonRoleProgression(slot, derivedLevel);
    }

    // Restore Pokémon species + nicknames (silent stat hydration)
    if (payload.pokemon) {
      for (let slot = 1; slot <= 4; slot++) {
        const species = (payload.pokemon?.[slot]?.species || "").trim();
        pokemonSpeciesBySlot[slot] = species;

        const nameEl = document.getElementById(`p${slot}-name`);
        if (nameEl) {
          nameEl.value = species;
          // Hydrate stats without triggering saves (guarded by isRestoring)
          handleNameInput.call(nameEl);
        }

        const nickname = (payload.pokemon?.[slot]?.nickname || "").trim();
        pokemonNicknames[slot] = nickname;
        const nickEl = document.getElementById(`p${slot}-nickname`);
        if (nickEl) nickEl.value = nickname;
      }
    }

    // Restore Nest moves
    if (payload.knownNestMoves) knownNestMoves = payload.knownNestMoves;

    // Restore Great moves
    if (payload.knownGreatMoves) knownGreatMoves = payload.knownGreatMoves;
    if (payload.greatMoveUses) greatMoveUses = payload.greatMoveUses;

    // Restore Trainer Command + Ability
    if (payload.trainerActionMoveBySlot) trainerActionMoveBySlot = payload.trainerActionMoveBySlot;
    if (payload.trainerActionUses) trainerActionUses = payload.trainerActionUses;
    if (payload.selectedAbilityBySlot) selectedAbilityBySlot = payload.selectedAbilityBySlot;

    // Restore Signature Moves (last)
    if (payload.signatureMoveBySlot) signatureMoveBySlot = payload.signatureMoveBySlot;
    if (payload.signatureMoveUsesBySlot) signatureMoveUsesBySlot = payload.signatureMoveUsesBySlot;
  }

  isRestoring = false;

  // 3) ONE explicit render at the very end
  updateTrainerPB();
  updateTrainerFeatures();
  bindSignatureEditor();
  updateTrainerActions();
  bindMoveTabs();
  bindActiveSlotButtons();
  setActiveSlot(1);
  applyEditMode(false);

  renderAbilities();
  restoreNicknames();
}





// ==============================
// LOCK DERIVED LEVEL INPUTS
// ==============================

const trainerLevelInput = document.getElementById("trainer-level");
if (trainerLevelInput) {
  trainerLevelInput.disabled = true;
}

if (partyPokemonLevelInput) {
  partyPokemonLevelInput.disabled = true;
}




function restoreNicknames() {
  for (let slot = 1; slot <= 4; slot++) {
    const nicknameInput = document.getElementById(`p${slot}-nickname`);
    if (!nicknameInput) continue;

    nicknameInput.value = pokemonNicknames[slot] || "";
  }
}

restoreNicknames();















function applyEditMode(enabled) {
  isEditMode = Boolean(enabled);
  document.body.classList.toggle("sheet-locked", !isEditMode);

  if (toggleEditBtn) toggleEditBtn.textContent = isEditMode ? "Done" : "Edit";

  const isBypassButton = (btn) => {
    if (!btn) return false;
    if (btn.matches?.("#toggle-edit, #manual-save, #export-sheet, #import-sheet, #signature-move-preview")) return true;
    if (btn.classList?.contains("set-active")) return true;
    if (btn.classList?.contains("active-slot-btn")) return true;
    if (btn.classList?.contains("move-tab")) return true; // tabs are view-only
    if (btn.classList?.contains("move-tile__preview")) return true; // preview must work in Done mode
    return false;
  };

  document.querySelectorAll("input, select, textarea, button").forEach((el) => {
    if (el instanceof HTMLButtonElement) {
      if (isBypassButton(el)) return;
      el.disabled = !isEditMode;
      return;
    }

    if (el instanceof HTMLSelectElement) {
      el.disabled = !isEditMode;
      return;
    }

    if (el instanceof HTMLTextAreaElement) {
      el.readOnly = !isEditMode;
      return;
    }

    if (el instanceof HTMLInputElement) {
      const type = (el.type || "").toLowerCase();
      const readonlyOk = ["text", "number", "search", "email", "url", "tel", "password"].includes(type);

      if (readonlyOk) {
        el.readOnly = !isEditMode;
        el.disabled = false;
      } else {
        el.disabled = !isEditMode;
      }
    }
  });
}


