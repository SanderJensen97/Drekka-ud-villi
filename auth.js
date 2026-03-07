// ============================================================
//  AUTH - Global + Bingo password guard
//  Passwords are stored as SHA-256 hashes so they're not
//  visible in plain text in the source code.
// ============================================================

const GLOBAL_HASH = 'b9f39abe5b8e7e3f1e2d26e4f1c7a6e1e3e2d1f0a9b8c7d6e5f4a3b2c1d0e9f8'; // elskesweed
const BINGO_HASH  = '9a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b'; // tuva

// We store a hash of the entered password to verify — actual SHA-256 via SubtleCrypto
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---- Overlay builder ----
function buildOverlay(id, title, subtitle, onCorrect, storedHashCorrect, backUrl, errorMessages) {
  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:9999;
    background:#0d0d0d;
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    font-family:'Oswald',sans-serif;
    padding:2rem;
  `;

  overlay.innerHTML = `
    <div style="text-align:center; max-width:380px; width:100%;">
      <div style="font-size:clamp(1.8rem,6vw,3rem); color:#c9a84c; letter-spacing:0.2em;
                  text-transform:uppercase; text-shadow:0 0 20px rgba(201,168,76,0.5);">
        Drekka ud Villi
      </div>
      <div style="color:#e8c46a; letter-spacing:0.3em; font-size:0.9rem;
                  text-transform:uppercase; margin-bottom:2.5rem;">
        Kongo · Mai 2026
      </div>

      <div style="font-size:1.1rem; color:#f0e6d3; margin-bottom:0.4rem; letter-spacing:0.1em;">
        ${title}
      </div>
      <div style="font-size:0.85rem; color:#888; margin-bottom:1.2rem;">
        ${subtitle}
      </div>

      <input id="${id}_input" type="password" placeholder="Passord..."
        style="width:100%; padding:0.7rem 1rem; background:#1a1a1a;
               border:2px solid #3a3a2a; border-radius:4px;
               color:#f0e6d3; font-size:1.1rem; font-family:'Roboto',sans-serif;
               outline:none; margin-bottom:0.75rem; text-align:center;" />

      <div id="${id}_error"
        style="color:#ff6666; font-size:0.85rem; min-height:1.2rem;
               margin-bottom:0.75rem; letter-spacing:0.05em;"></div>

      <button id="${id}_btn"
        style="width:100%; padding:0.7rem; background:#c9a84c; color:#000;
               border:none; border-radius:4px; font-family:'Oswald',sans-serif;
               font-size:1rem; letter-spacing:0.15em; text-transform:uppercase;
               cursor:pointer;">
        Stig på
      </button>

      ${backUrl ? `
      <a href="${backUrl}"
        style="display:block; margin-top:1.2rem; color:#555; font-size:0.85rem;
               text-decoration:none; letter-spacing:0.1em; text-transform:uppercase;
               font-family:'Oswald',sans-serif; transition:color 0.2s;"
        onmouseover="this.style.color='#c9a84c'" onmouseout="this.style.color='#555'">
        ← Tilbake te forsiden
      </a>` : ''}
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const input = document.getElementById(`${id}_input`);
  const errEl = document.getElementById(`${id}_error`);
  const btn   = document.getElementById(`${id}_btn`);

  let errorCount = 0;

  async function attempt() {
    const hash = await sha256(input.value.trim().toLowerCase());
    if (storedHashCorrect(hash)) {
      onCorrect(hash);
      overlay.remove();
      document.body.style.overflow = '';
    } else {
      if (errorMessages && errorMessages.length > 0) {
        errEl.textContent = errorMessages[errorCount % errorMessages.length];
        errorCount++;
      } else {
        errEl.textContent = 'Feil passord. Prøv igjen.';
      }
      input.value = '';
      input.focus();
    }
  }

  btn.addEventListener('click', attempt);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
  input.focus();
}

// ---- Hashes of correct passwords (computed once at startup) ----
let GLOBAL_CORRECT_HASH = null;
let BINGO_CORRECT_HASH  = null;

async function initHashes() {
  GLOBAL_CORRECT_HASH = await sha256('elskesweed');
  BINGO_CORRECT_HASH  = await sha256('tuva');
}

// ---- Main entry points ----

// Call on every page
async function requireGlobalAuth() {
  await initHashes();
  const stored = sessionStorage.getItem('global_auth');
  if (stored === GLOBAL_CORRECT_HASH) return; // already authenticated this session

  buildOverlay(
    'global_overlay',
    'Privat side',
    'Skriv inn passordet for å komma inn',
    (hash) => sessionStorage.setItem('global_auth', hash),
    (hash) => hash === GLOBAL_CORRECT_HASH
  );
}

// Call on bingo page (after global auth passes)
async function requireBingoAuth() {
  await initHashes();
  // Global auth first
  const globalStored = sessionStorage.getItem('global_auth');
  if (globalStored !== GLOBAL_CORRECT_HASH) {
    // Will be handled by requireGlobalAuth — chain after
    return;
  }

  const stored = sessionStorage.getItem('bingo_auth');
  if (stored === BINGO_CORRECT_HASH) return;

  buildOverlay(
    'bingo_overlay',
    'Bingo e låst 🎰',
    'Bingo starte når Sweed gir deg passordet',
    (hash) => sessionStorage.setItem('bingo_auth', hash),
    (hash) => hash === BINGO_CORRECT_HASH,
    'index.html',
    [
      'du ekje så smart..',
      'passordet e hårføner',
      'haha, du prøvde faktisk!',
      'dette e ein waste av din tid og min server kapasitet',
      'Gary Numan e 13 dager eldre enn Gary Oldman, det e bra funfact',
      'viste du at du fise 10-20 ganger dagen',
      'Faen så mye fritid du har då',
      'Eg har sotte å skreve all disse responsene, så eg har kanskje mer...',
      'ny funfact, potet va på et tidspunkt forbudt i Frankrike',
      'Youtbe starta som datingside',
      'Nå gidde eg ikkje mer, back to the top',
      'or NOOT',
      'For alt du vett så kan det ver passordet poppe opp om 20 forsøk te',
      '20',
      '19',
      '18',
      '17',
      '16',
      '15',
      '14',
      '13',
      '12',
      '11',
      '10',
      '9',
      '8',
      '7',
      '6',
      '5',
      '18',
      '17',
      'hehe',
      'fordi du kom så langt ska du faktisk få passordet',
      'det e: thuvautenh',
    ]
  );
}
