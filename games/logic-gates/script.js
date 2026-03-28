// games/logic-gates/script.js — Boolean Logic Gate Simulator

const canvas   = document.getElementById('game-canvas');
const ctx      = canvas.getContext('2d');
const clearBtn = document.getElementById('btn-clear-circuit');

let W, H;

// ── Gate definitions ───────────────────────────────────────────────────────
const GATE_W = 80, GATE_H = 50;

const PALETTE = [
  { type: 'INPUT', label: 'IN',  color: '#4FC3F7', value: 0 },
  { type: 'AND',   label: 'AND', color: '#FFB800' },
  { type: 'OR',    label: 'OR',  color: '#FF6D00' },
  { type: 'NOT',   label: 'NOT', color: '#AA44FF' },
  { type: 'NAND',  label: 'NND', color: '#FF4D4D' },
  { type: 'OUTPUT',label: 'OUT', color: '#00FF88' }
];

let gates = [];
let wires = [];
let dragging = null, dragOffset = { x: 0, y: 0 };
let wireSrc = null; // { gate, port: 'out'|'in0'|'in1' }
let hoverPort = null;
let placingType = null;

function resize() {
  const wrap = canvas.parentElement;
  W = canvas.width  = wrap.clientWidth;
  H = canvas.height = wrap.clientHeight;
  render();
}

// ── Gate logic ─────────────────────────────────────────────────────────────
function evaluate(gate) {
  const inputs = wires
    .filter(w => w.toGate === gate)
    .map(w => getOutput(w.fromGate));
  const [a, b] = inputs;
  switch (gate.type) {
    case 'INPUT':  return gate.value ?? 0;
    case 'AND':    return (a && b) ? 1 : 0;
    case 'OR':     return (a || b) ? 1 : 0;
    case 'NOT':    return a ? 0 : 1;
    case 'NAND':   return (a && b) ? 0 : 1;
    case 'OUTPUT': return a ?? 0;
    default:       return 0;
  }
}

function getOutput(gate) {
  return evaluate(gate);
}

// ── Port positions ──────────────────────────────────────────────────────────
function portPos(gate, port) {
  const { x, y } = gate;
  const cx = x + GATE_W / 2, cy = y + GATE_H / 2;
  switch (port) {
    case 'out': return { x: x + GATE_W, y: cy };
    case 'in0': return { x, y: cy - 12 };
    case 'in1': return { x, y: cy + 12 };
    default:    return { x: cx, y };
  }
}

function portsForType(type) {
  if (type === 'NOT' || type === 'INPUT') return ['in0'];
  if (type === 'OUTPUT') return ['in0'];
  return ['in0', 'in1'];
}

// ── Render ─────────────────────────────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, W, H);

  // Dotted grid background
  ctx.fillStyle = '#141414';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let x = 0; x < W; x += 24) for (let y = 0; y < H; y += 24)
    ctx.fillRect(x, y, 1, 1);

  // Palette strip
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, 56);
  ctx.strokeStyle = '#1E1E1E';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0,56); ctx.lineTo(W,56); ctx.stroke();

  PALETTE.forEach((p, i) => {
    const px = 20 + i * 100, py = 8;
    const active = placingType === p.type;
    ctx.fillStyle = active ? p.color : 'rgba(255,255,255,0.05)';
    ctx.strokeStyle = active ? p.color : '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(px, py, 80, 38, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = active ? '#000' : p.color;
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(p.label, px+40, py+24);
  });

  // Wires
  wires.forEach(w => {
    const a = portPos(w.fromGate, 'out');
    const b = portPos(w.toGate, w.toPort);
    const val = getOutput(w.fromGate);
    ctx.strokeStyle = val ? '#00FF88' : '#444';
    ctx.shadowColor = val ? '#00FF88' : 'transparent';
    ctx.shadowBlur  = val ? 6 : 0;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.bezierCurveTo(a.x+40, a.y, b.x-40, b.y, b.x, b.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
  });

  // Wire being drawn
  if (wireSrc && hoverPort) {
    const a = portPos(wireSrc.gate, wireSrc.port);
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4,4]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(hoverPort.x, hoverPort.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Gates
  gates.forEach(gate => {
    const val = gate.type === 'OUTPUT' ? getOutput(gate) : 0;
    const col = PALETTE.find(p => p.type === gate.type)?.color ?? '#888';

    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = col;
    ctx.shadowBlur  = 4;
    ctx.beginPath();
    ctx.roundRect(gate.x, gate.y, GATE_W, GATE_H, 6);
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;

    // Label
    ctx.fillStyle = col;
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(gate.label ?? gate.type, gate.x+GATE_W/2, gate.y+GATE_H/2+4);

    // Output value for INPUT & OUTPUT
    if (gate.type === 'INPUT') {
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = gate.value ? '#00FF88' : '#666';
      ctx.fillText(gate.value ? '1' : '0', gate.x+GATE_W/2, gate.y+GATE_H-8);
    }
    if (gate.type === 'OUTPUT') {
      ctx.font = '16px JetBrains Mono, monospace';
      ctx.fillStyle = val ? '#00FF88' : '#444';
      ctx.shadowColor = val ? '#00FF88' : 'transparent';
      ctx.shadowBlur  = val ? 14 : 0;
      ctx.fillText(val ? '●' : '○', gate.x+GATE_W/2, gate.y+GATE_H-4);
      ctx.shadowBlur = 0;
    }

    // Ports
    const outP = portPos(gate, 'out');
    ctx.fillStyle = '#00E5FF'; ctx.strokeStyle = '#00E5FF';
    ctx.beginPath(); ctx.arc(outP.x, outP.y, 4, 0, Math.PI*2); ctx.fill();

    portsForType(gate.type).forEach(port => {
      const p = portPos(gate, port);
      ctx.fillStyle = '#888'; ctx.strokeStyle = '#555';
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
    });
  });

  ctx.textAlign = 'left';
}

// ── Helpers ────────────────────────────────────────────────────────────────
function hitGate(x, y) {
  return gates.find(g => x >= g.x && x <= g.x+GATE_W && y >= g.y && y <= g.y+GATE_H);
}

function hitPort(x, y, gate) {
  const ports = ['out', ...portsForType(gate.type)];
  for (const port of ports) {
    const p = portPos(gate, port);
    if (Math.abs(p.x-x) < 10 && Math.abs(p.y-y) < 10) return port;
  }
  return null;
}

function addGate(type, x, y) {
  const def = PALETTE.find(p => p.type === type);
  gates.push({ type, x, y, label: def?.label ?? type, value: 0 });
}

// ── Events ─────────────────────────────────────────────────────────────────
canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX-rect.left, my = e.clientY-rect.top;

  // Palette click
  if (my < 56) {
    PALETTE.forEach((p, i) => {
      const px = 20 + i * 100;
      if (mx >= px && mx <= px+80) placingType = p.type === placingType ? null : p.type;
    });
    render(); return;
  }

  // Place new gate
  if (placingType) {
    addGate(placingType, mx - GATE_W/2, my - GATE_H/2);
    placingType = null;
    render(); return;
  }

  // Check port click
  for (const gate of gates) {
    const port = hitPort(mx, my, gate);
    if (port) {
      if (wireSrc) {
        // Complete wire
        if (wireSrc.gate !== gate && port !== 'out' && wireSrc.port === 'out') {
          // Remove existing wire on this input port
          wires = wires.filter(w => !(w.toGate === gate && w.toPort === port));
          wires.push({ fromGate: wireSrc.gate, toGate: gate, toPort: port });
        }
        wireSrc = null; hoverPort = null;
      } else {
        wireSrc = { gate, port };
      }
      render(); return;
    }
  }

  wireSrc = null;

  // Drag gate
  const g = hitGate(mx, my);
  if (g) {
    dragging = g;
    dragOffset = { x: mx - g.x, y: my - g.y };
    return;
  }

  // Double-click INPUT toggle handled on dblclick
});

canvas.addEventListener('dblclick', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX-rect.left, my = e.clientY-rect.top;
  const g = hitGate(mx, my);
  if (g && g.type === 'INPUT') { g.value = g.value ? 0 : 1; render(); }
  // Delete gate on double-click non-input
  else if (g) {
    gates = gates.filter(x => x !== g);
    wires = wires.filter(w => w.fromGate !== g && w.toGate !== g);
    render();
  }
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX-rect.left, my = e.clientY-rect.top;
  if (dragging) {
    dragging.x = mx - dragOffset.x;
    dragging.y = my - dragOffset.y;
    render(); return;
  }
  if (wireSrc) {
    hoverPort = { x: mx, y: my };
    for (const gate of gates) {
      const port = hitPort(mx, my, gate);
      if (port) hoverPort = portPos(gate, port);
    }
    render();
  }
});

canvas.addEventListener('mouseup', () => { dragging = null; });

clearBtn.addEventListener('click', () => { gates = []; wires = []; placingType = null; render(); });

window.addEventListener('resize', resize);
resize();

// Starter circuit
addGate('INPUT', 80, 150);
addGate('INPUT', 80, 250);
addGate('AND',   250, 175);
addGate('OUTPUT',440, 175);
wires.push({ fromGate: gates[0], toGate: gates[2], toPort: 'in0' });
wires.push({ fromGate: gates[1], toGate: gates[2], toPort: 'in1' });
wires.push({ fromGate: gates[2], toGate: gates[3], toPort: 'in0' });
render();
