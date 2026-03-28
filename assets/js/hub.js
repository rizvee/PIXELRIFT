// assets/js/hub.js — PIXELRIFT Game Catalog Engine

const games = [
  // ── Arcade & Reflex ──────────────────────────────────────────────────
  {
    id: 'gravity-snake',
    title: 'Gravity Snake',
    category: 'Arcade',
    tags: ['Action', 'Physics'],
    difficulty: 'Hard',
    desc: 'Classic snake array traversal warped by a sine-wave gravity vector. Fight physics to survive.',
    live: true
  },
  {
    id: 'orbit-racer',
    title: 'Orbit Racer',
    category: 'Arcade',
    tags: ['Action', 'Physics'],
    difficulty: 'Hard',
    desc: 'Centripetal force calculation. Switch orbital rings to dodge debris at terminal velocity.',
    live: false
  },
  {
    id: 'color-flood',
    title: 'Color Flood',
    category: 'Arcade',
    tags: ['Strategy', 'Puzzle'],
    difficulty: 'Medium',
    desc: 'Flood-fill algorithm optimization. Paint the entire board in under 20 moves.',
    live: false
  },
  {
    id: 'rhythm-tap',
    title: 'Rhythm Tap',
    category: 'Arcade',
    tags: ['Reflex', 'Music'],
    difficulty: 'Medium',
    desc: 'Precise Date.now() timestamp matching for incoming visual beats. Perfect timing is everything.',
    live: false
  },
  {
    id: 'echo-runner',
    title: 'Echo Runner',
    category: 'Arcade',
    tags: ['Action', 'Memory'],
    difficulty: 'Hard',
    desc: 'Your movement is recorded and replayed as ghost trails you must dodge. Outsmart yourself.',
    live: false
  },
  {
    id: 'wall-bounce',
    title: 'Wall Bounce',
    category: 'Arcade',
    tags: ['Physics', 'Reflex'],
    difficulty: 'Medium',
    desc: 'Pure elastic collision physics. Keep the square alive inside a shrinking polygon.',
    live: false
  },
  {
    id: 'neon-dodge',
    title: 'Neon Dodge',
    category: 'Arcade',
    tags: ['Action', 'Reflex'],
    difficulty: 'Hard',
    desc: 'Bullet hell using object-pooled canvas rendering pushing 1000+ entities at 60fps.',
    live: true
  },
  {
    id: 'shape-shifter',
    title: 'Shape Shifter',
    category: 'Arcade',
    tags: ['Puzzle', 'Reflex'],
    difficulty: 'Medium',
    desc: 'Dynamic collision box morphing. Change shapes to pass through matching gates.',
    live: false
  },
  {
    id: 'pixel-jumper',
    title: 'Pixel Jumper',
    category: 'Arcade',
    tags: ['Platformer', 'Physics'],
    difficulty: 'Medium',
    desc: 'Sub-pixel rendering platformer with rigid-body momentum mechanics.',
    live: false
  },
  {
    id: 'time-reversal',
    title: 'Chrono Shift',
    category: 'Arcade',
    tags: ['Puzzle', 'Action'],
    difficulty: 'Hard',
    desc: 'Stores state history arrays. Hold spacebar to reverse time and undo your mistakes.',
    live: false
  },

  // ── Simulation & Physics ─────────────────────────────────────────────
  {
    id: 'sand-lab',
    title: 'Sand Lab',
    category: 'Simulation',
    tags: ['Cellular', 'Physics'],
    difficulty: 'Relaxing',
    desc: 'Cellular automata grid simulating granular physics. Mix Sand, Water, Fire, and Stone.',
    live: true
  },
  {
    id: 'fluid-sim',
    title: 'Fluid Flow',
    category: 'Simulation',
    tags: ['Physics', 'Math'],
    difficulty: 'Relaxing',
    desc: 'Eulerian grid-based fluid dynamics solver built entirely on CPU canvas.',
    live: false
  },
  {
    id: 'ragdoll-toss',
    title: 'Ragdoll Toss',
    category: 'Simulation',
    tags: ['Physics', 'Action'],
    difficulty: 'Relaxing',
    desc: 'Verlet integration physics engine with joint constraints and inverse kinematics.',
    live: false
  },
  {
    id: 'bridge-builder',
    title: 'Bridge Builder',
    category: 'Simulation',
    tags: ['Physics', 'Strategy'],
    difficulty: 'Hard',
    desc: 'Spring-mass system where structural integrity fails under real stress calculations.',
    live: false
  },
  {
    id: 'magnet-pull',
    title: 'Magnet Pull',
    category: 'Simulation',
    tags: ['Physics', 'Puzzle'],
    difficulty: 'Medium',
    desc: 'Inverse square law attraction/repulsion fields manipulating particle swarms.',
    live: false
  },
  {
    id: 'wind-glider',
    title: 'Wind Glider',
    category: 'Simulation',
    tags: ['Physics', 'Action'],
    difficulty: 'Medium',
    desc: 'Aerodynamic lift vector calculations based on surface angle and wind speed.',
    live: false
  },
  {
    id: 'orbit-slingshot',
    title: 'Orbit Slingshot',
    category: 'Simulation',
    tags: ['Physics', 'Strategy'],
    difficulty: 'Hard',
    desc: 'N-body gravity simulation. Plot trajectories to slingshot a probe past planets.',
    live: false
  },
  {
    id: 'balance-beam',
    title: 'Balance Beam',
    category: 'Simulation',
    tags: ['Physics', 'Puzzle'],
    difficulty: 'Medium',
    desc: 'Center-of-mass calculations. Stack irregular polygons without tipping the fulcrum.',
    live: false
  },
  {
    id: 'pendulum-chaos',
    title: 'Double Pendulum',
    category: 'Simulation',
    tags: ['Physics', 'Math'],
    difficulty: 'Relaxing',
    desc: 'Chaotic system mapping using Runge-Kutta integration. Mesmerizing and unpredictable.',
    live: false
  },
  {
    id: 'particle-web',
    title: 'Particle Web',
    category: 'Simulation',
    tags: ['Visual', 'Physics'],
    difficulty: 'Relaxing',
    desc: 'Distance-based rendering where nodes connect based on proximity thresholds.',
    live: true
  },

  // ── Puzzle & Logic ───────────────────────────────────────────────────
  {
    id: 'light-bend',
    title: 'Light Bend',
    category: 'Puzzle',
    tags: ['Raycasting', 'Logic'],
    difficulty: 'Medium',
    desc: 'Raycasting reflects vectors off placed mirrors. Guide the beam to hit every target.',
    live: true
  },
  {
    id: 'hex-connect',
    title: 'Hex Connect',
    category: 'Puzzle',
    tags: ['Strategy', 'Logic'],
    difficulty: 'Hard',
    desc: 'Hexagonal grid pathfinding. Connect opposite sides of the board before your opponent.',
    live: false
  },
  {
    id: 'mirror-maze',
    title: 'Mirror Maze',
    category: 'Puzzle',
    tags: ['Logic', 'Action'],
    difficulty: 'Medium',
    desc: 'Symmetrical input mirroring. Control two avatars simultaneously through inverted layouts.',
    live: false
  },
  {
    id: 'logic-gates',
    title: 'Logic Circuit',
    category: 'Puzzle',
    tags: ['Logic', 'Engineering'],
    difficulty: 'Hard',
    desc: 'Build working AND/OR/NOT gate chains. Boolean propagation in real time.',
    live: true
  },
  {
    id: 'cipher-crack',
    title: 'Cipher Crack',
    category: 'Puzzle',
    tags: ['Logic', 'Word'],
    difficulty: 'Medium',
    desc: 'Decode Caesar and Vigenere ciphers through string manipulation against a timer.',
    live: false
  },
  {
    id: 'math-drop',
    title: 'Math Drop',
    category: 'Puzzle',
    tags: ['Math', 'Reflex'],
    difficulty: 'Medium',
    desc: 'Rapid arithmetic evaluation. Parse falling string equations before they hit the ground.',
    live: false
  },
  {
    id: 'shadow-match',
    title: 'Shadow Match',
    category: 'Puzzle',
    tags: ['3D', 'Logic'],
    difficulty: 'Hard',
    desc: '3D-to-2D projection logic. Rotate a wireframe cube to match a target silhouette.',
    live: false
  },
  {
    id: 'grid-lock',
    title: 'Grid Lock',
    category: 'Puzzle',
    tags: ['Logic', 'Sliding'],
    difficulty: 'Medium',
    desc: 'Sliding tile puzzle using matrix transposition arrays to validate win states.',
    live: false
  },
  {
    id: 'flow-state',
    title: 'Flow State',
    category: 'Puzzle',
    tags: ['Pathfinding', 'Logic'],
    difficulty: 'Medium',
    desc: 'A* pathfinding visualization disguised as a puzzle. Draw paths without overlapping.',
    live: false
  },
  {
    id: 'minesweeper-z',
    title: 'Minesweeper Z',
    category: 'Puzzle',
    tags: ['Classic', 'Logic'],
    difficulty: 'Medium',
    desc: 'Recursive reveal algorithms on a dynamic, ever-expanding mine grid.',
    live: false
  },

  // ── Strategy & Systems ───────────────────────────────────────────────
  {
    id: 'virus-spread',
    title: 'Virus Spread',
    category: 'Strategy',
    tags: ['Simulation', 'Math'],
    difficulty: 'Medium',
    desc: 'SIR epidemiological model on a node graph. Deploy vaccines to contain the outbreak.',
    live: true
  },
  {
    id: 'micro-rts',
    title: 'Micro RTS',
    category: 'Strategy',
    tags: ['Strategy', 'Systems'],
    difficulty: 'Hard',
    desc: 'State machine architecture for units gathering resources and attacking autonomously.',
    live: false
  },
  {
    id: 'ant-farm',
    title: 'Ant Farm',
    category: 'Strategy',
    tags: ['Simulation', 'Emergence'],
    difficulty: 'Relaxing',
    desc: 'Emergent behavior via pheromone trail maps and state decay. Watch colonies form.',
    live: false
  },
  {
    id: 'auto-battler',
    title: 'Grid Brawl',
    category: 'Strategy',
    tags: ['Strategy', 'Combat'],
    difficulty: 'Medium',
    desc: 'Turn-based probability combat calculating DPS and armor stats autonomously.',
    live: false
  },
  {
    id: 'stock-ticker',
    title: 'Market Sim',
    category: 'Strategy',
    tags: ['Simulation', 'Finance'],
    difficulty: 'Medium',
    desc: 'Procedurally generated Brownian motion charts. Buy low, sell high, beat the market.',
    live: false
  },
  {
    id: 'colony-sim',
    title: 'Mars Colony',
    category: 'Strategy',
    tags: ['Simulation', 'Systems'],
    difficulty: 'Hard',
    desc: 'Resource degradation loops. Balance oxygen, water, and power arrays to survive.',
    live: false
  },
  {
    id: 'tower-defense',
    title: 'Path Guard',
    category: 'Strategy',
    tags: ['Strategy', 'Action'],
    difficulty: 'Medium',
    desc: 'Waypoint interpolation for enemies and radius proximity detection for towers.',
    live: false
  },
  {
    id: 'trade-route',
    title: 'Trade Route',
    category: 'Strategy',
    tags: ['Graph Theory', 'Strategy'],
    difficulty: 'Hard',
    desc: 'Graph theory optimization. Find the most profitable path between changing city nodes.',
    live: false
  },
  {
    id: 'space-miner',
    title: 'Space Miner',
    category: 'Strategy',
    tags: ['Action', 'Systems'],
    difficulty: 'Medium',
    desc: 'Upgradable drilling mechanics updating nested JSON config objects in real time.',
    live: false
  },
  {
    id: 'ecosystem-sim',
    title: 'Bio Balance',
    category: 'Strategy',
    tags: ['Simulation', 'Math'],
    difficulty: 'Medium',
    desc: 'Predator-prey Lotka-Volterra equations drive entity populations in real time.',
    live: false
  },

  // ── Experimental & Abstract ──────────────────────────────────────────
  {
    id: 'boid-herder',
    title: 'Boid Herder',
    category: 'Experimental',
    tags: ['Flocking', 'Simulation'],
    difficulty: 'Relaxing',
    desc: 'Boids flocking via separation, alignment, and cohesion. Herd them all to the target.',
    live: true
  },
  {
    id: 'fractal-dive',
    title: 'Fractal Dive',
    category: 'Experimental',
    tags: ['Math', 'Visual'],
    difficulty: 'Relaxing',
    desc: 'Mandelbrot set renderer. Click to zoom into infinite mathematical depth.',
    live: true
  },
  {
    id: 'ascii-adventure',
    title: 'Text Quest',
    category: 'Experimental',
    tags: ['RPG', 'Text'],
    difficulty: 'Medium',
    desc: 'DOM-manipulation RPG running entirely in a <pre> tag grid. Pure ASCII adventure.',
    live: false
  },
  {
    id: 'blind-echo',
    title: 'Blind Echo',
    category: 'Experimental',
    tags: ['Audio', 'Unique'],
    difficulty: 'Hard',
    desc: 'Audio spatialization API. Navigate a black screen using only stereo sound pings.',
    live: false
  },
  {
    id: 'quantum-states',
    title: 'Quantum States',
    category: 'Experimental',
    tags: ['Physics', 'Abstract'],
    difficulty: 'Hard',
    desc: 'Superposition mechanics where you exist in two coordinates until observed.',
    live: false
  },
  {
    id: 'glitch-maze',
    title: 'Glitch Maze',
    category: 'Experimental',
    tags: ['Abstract', 'Unique'],
    difficulty: 'Hard',
    desc: 'Intentional out-of-bounds rendering creates visually corrupted but playable spaces.',
    live: false
  },
  {
    id: 'type-racer',
    title: 'Ink Rush',
    category: 'Experimental',
    tags: ['Typing', 'Reflex'],
    difficulty: 'Medium',
    desc: 'Real-time keystroke listeners track WPM and accuracy against a moving target.',
    live: false
  },
  {
    id: 'conways-game',
    title: 'Life Board',
    category: 'Experimental',
    tags: ['Cellular', 'Classic'],
    difficulty: 'Relaxing',
    desc: "Conway's Game of Life with interactive drawing, generation counter and speed control.",
    live: true
  },
  {
    id: 'color-sort',
    title: 'HSL Sort',
    category: 'Experimental',
    tags: ['Visual', 'Sorting'],
    difficulty: 'Easy',
    desc: 'Array sorting visualization wrapped as a game. Reorder hues by numeric HSL values.',
    live: false
  },
  {
    id: 'gravity-invert',
    title: 'Ceiling Floor',
    category: 'Experimental',
    tags: ['Physics', 'Action'],
    difficulty: 'Medium',
    desc: 'Gravity constants toggle from positive to negative on click, resetting velocity vectors.',
    live: false
  }
];

// ── Render Engine ──────────────────────────────────────────────────────────
// Detect environment: local file:// vs. GitHub Pages
const isLocal = location.protocol === 'file:';
const BASE = isLocal ? '.' : '/PIXELRIFT';

const grid       = document.getElementById('game-grid');
const searchInput = document.getElementById('search-input');
const countEl    = document.getElementById('game-count-label');

let activeTag = 'All';

function diffClass(d) {
  const map = { Easy:'diff-easy', Medium:'diff-medium', Hard:'diff-hard', Relaxing:'diff-relaxing' };
  return map[d] || 'diff-medium';
}

function renderGames() {
  const q = searchInput.value.toLowerCase().trim();

  const filtered = games.filter(g => {
    const matchTag = activeTag === 'All' || g.category === activeTag || g.tags.includes(activeTag);
    const matchQ   = !q ||
      g.title.toLowerCase().includes(q) ||
      g.desc.toLowerCase().includes(q) ||
      g.tags.some(t => t.toLowerCase().includes(q)) ||
      g.category.toLowerCase().includes(q);
    return matchTag && matchQ;
  });

  if (countEl) countEl.textContent = `${filtered.length} game${filtered.length !== 1 ? 's' : ''}`;

  grid.innerHTML = '';

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><span>⌀</span><p>No games match "${q}"</p></div>`;
    return;
  }

  filtered.forEach(g => {
    const card = document.createElement('a');
    card.href  = `${BASE}/games/${g.id}/`;
    card.className = 'game-card';
    card.setAttribute('data-tags', g.tags.join(','));
    card.setAttribute('aria-label', g.title);

    const liveTag = g.live
      ? `<span class="card-tag" style="color:var(--success)">● LIVE</span>`
      : `<span class="card-tag" style="color:var(--muted2)">○ SOON</span>`;

    card.innerHTML = `
      <div class="card-category">${g.category}</div>
      <h3 class="card-title">${g.title}</h3>
      <p class="card-desc">${g.desc}</p>
      <div class="card-footer">
        <div class="card-tags">
          ${liveTag}
          ${g.tags.map(t => `<span class="card-tag">${t}</span>`).join('')}
        </div>
        <span class="difficulty-badge ${diffClass(g.difficulty)}">${g.difficulty}</span>
      </div>
      <span class="card-arrow">↗</span>
    `;

    grid.appendChild(card);
  });
}

// ── Tag Filter ─────────────────────────────────────────────────────────────
document.querySelectorAll('.tag-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.tag-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeTag = pill.dataset.tag;
    renderGames();
  });
});

// ── Search ─────────────────────────────────────────────────────────────────
searchInput.addEventListener('input', renderGames);

// ── Error Boundary ──────────────────────────────────────────────────────────
window.addEventListener('error', function(e) {
  console.error("PIXELRIFT System Fault:", e.message);
  // If we're in a game, we might need a more specific UI, 
  // but for the hub/general site, a console error is a start.
  // The specific game error boundary will be added to the game template logic.
});

// ── Init ───────────────────────────────────────────────────────────────────
renderGames();
