// games/ascii-adventure/script.js — ASCII Adventure
// Text-based room navigation with string parser

const output = document.getElementById('score-display'); // We'll repurpose this for the status
const gameCanvas = document.getElementById('game-canvas');
const ctx = gameCanvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('overlay');

// Custom Terminal for the game
const term = document.createElement('div');
term.style.cssText = `
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: #060A10; color: #00FF88; padding: 20px;
    font-family: 'JetBrains Mono', monospace; font-size: 14px;
    overflow-y: auto; display: none; box-sizing: border-box;
    white-space: pre-wrap; word-wrap: break-word; line-height: 1.5;
`;
gameCanvas.parentElement.appendChild(term);

const inputLine = document.createElement('div');
inputLine.style.cssText = `display: flex; margin-top: 10px;`;
inputLine.innerHTML = `<span>> </span><input id="term-input" type="text" style="
    background: transparent; border: none; color: #FFF; flex: 1;
    font-family: inherit; font-size: inherit; outline: none; margin-left: 5px;
">`;
term.appendChild(inputLine);
const input = inputLine.querySelector('input');

let currentRoom = 'start';
const world = {
    start: {
        desc: "You are in a dark, pixelated void. There is a GLOWING GATE to the NORTH.",
        exits: { north: 'hallway' },
        items: []
    },
    hallway: {
        desc: "A narrow corridor lined with flickering neon strips. A HEAVY DOOR is to the EAST, and the GATE is back SOUTH.",
        exits: { south: 'start', east: 'armory' },
        items: ['key']
    },
    armory: {
        desc: "Rows of empty glass canisters. There is a console here. The exit is WEST.",
        exits: { west: 'hallway' },
        items: ['chip']
    }
};

let inventory = [];

function log(text, type = 'info') {
    const p = document.createElement('p');
    p.textContent = text;
    p.style.margin = '0';
    if (type === 'error') p.style.color = '#FF4D4D';
    if (type === 'room') p.style.color = '#00E5FF';
    term.insertBefore(p, inputLine);
    term.scrollTop = term.scrollHeight;
}

function parse(cmd) {
    log(`> ${cmd}`, 'user');
    const tokens = cmd.toLowerCase().trim().split(' ');
    const action = tokens[0];
    const target = tokens[1];

    if (action === 'go' || action === 'move') {
        const dir = target;
        if (world[currentRoom].exits[dir]) {
            currentRoom = world[currentRoom].exits[dir];
            describe();
        } else {
            log("You can't go that way.", 'error');
        }
    } else if (action === 'look') {
        describe();
    } else if (action === 'take' || action === 'get') {
        const room = world[currentRoom];
        if (room.items.includes(target)) {
            room.items = room.items.filter(i => i !== target);
            inventory.push(target);
            log(`You picked up the ${target}.`);
        } else {
            log(`There is no ${target} here.`, 'error');
        }
    } else if (action === 'inv' || action === 'inventory') {
        log(`Inventory: ${inventory.length ? inventory.join(', ') : 'empty'}`);
    } else if (action === 'help') {
        log("Commands: GO [dir], LOOK, TAKE [item], INV, HELP");
    } else {
        log("I don't understand that command.", 'error');
    }
}

function describe() {
    log('\n' + world[currentRoom].desc, 'room');
    if (world[currentRoom].items.length) {
        log(`Items here: ${world[currentRoom].items.join(', ')}`);
    }
    log(`Exits: ${Object.keys(world[currentRoom].exits).join(', ')}`);
}

function startGame() {
    term.style.display = 'block';
    overlay.style.display = 'none';
    log("=== PIXELRIFT ASCII ADVENTURE ===");
    log("Type 'HELP' for commands.");
    describe();
    input.focus();
}

input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        const cmd = input.value;
        input.value = '';
        if (cmd) parse(cmd);
    }
});

// Click terminal to focus input
term.addEventListener('click', () => input.focus());

startBtn.addEventListener('click', startGame);

// Draw static background on canvas
function drawStatic() {
    ctx.fillStyle = '#060A10';
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
}
drawStatic();
