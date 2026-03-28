const fs = require('fs');
const path = require('path');

const gamesDir = 'C:\\Users\\HP\\OneDrive\\Desktop\\PIXELRIFT\\games';
const initialGames = ['gravity-snake', 'sand-lab', 'fractal-dive', 'conways-game', 'particle-web', 'neon-dodge', 'light-bend', 'logic-gates', 'boid-herder', 'virus-spread'];

const games = fs.readdirSync(gamesDir).filter(f => fs.statSync(path.join(gamesDir, f)).isDirectory());

games.forEach(game => {
    if (initialGames.includes(game)) return; // Skip already "ready" games

    const indexPath = path.join(gamesDir, game, 'index.html');
    if (!fs.existsSync(indexPath)) return;

    let content = fs.readFileSync(indexPath, 'utf8');

    // 1. Update header meta (Replace Coming Soon with Score/Best)
    const headerMetaSearch = /<div class="game-header-meta">[\s\S]*?<\/div>/;
    const headerMetaReplace = `<div class="game-header-meta">
        <span>SCORE: <span class="score-display" id="score-display">0</span></span>
        <span style="color:var(--muted2)">|</span>
        <span>BEST: <span class="score-display" id="best-display">0</span></span>
      </div>`;
    content = content.replace(headerMetaSearch, headerMetaReplace);

    // 2. Update overlay
    // Find the game-overlay div and replace its content
    const overlaySearch = /<div class="game-overlay"[\s\S]*?>[\s\S]*?<\/div>/;
    const gameName = game.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    // Extract description if possible
    const descMatch = content.match(/<meta name="description" content="(.*?)"/);
    const desc = descMatch ? descMatch[1] : `Play ${gameName} free online.`;

    const overlayReplace = `<div class="game-overlay" id="overlay">
        <p class="overlay-title" id="overlay-title">${gameName}</p>
        <p class="overlay-score" style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);text-align:center;max-width:320px;margin:8px 0">
          ${desc}
        </p>
        <button class="btn-primary" id="start-btn">START GAME</button>
      </div>`;
    
    content = content.replace(overlaySearch, overlayReplace);

    fs.writeFileSync(indexPath, content);
    console.log(`Updated ${game}/index.html`);
});
