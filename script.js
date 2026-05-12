/* Autoencoder Architecture Visualization
 * - No frameworks
 * - Works as static site (GitHub Pages)
 */

const NODE_CONFIG = {
  input: 6,
  encoder: 4,
  bottleneck: 2,
  decoder: 4,
  output: 6,
};

const STAGE_ORDER = ["input", "encoder", "bottleneck", "decoder", "output"];

// Simulation pacing: tuned for classroom-friendly viewing.
// Change to "normal" if you want a quicker run.
const SIM_PACE = "slow"; // "slow" | "normal"

const EXPLANATIONS = {
  input: {
    stage: "Input Layer",
    text:
      "Input adalah data mentah yang masuk (misalnya gambar, angka sensor, atau fitur). Pada tahap ini, jaringan hanya menerima sinyal tanpa mengubah ukurannya dulu.",
  },
  encoder: {
    stage: "Encoder",
    text:
      "Encoder mengompresi data: jumlah fitur diperkecil sambil mempertahankan informasi penting. Ini seperti merangkum data agar lebih ringkas.",
  },
  bottleneck: {
    stage: "Bottleneck (Latent Space)",
    text:
      "Bottleneck adalah representasi paling kecil. Di sinilah kompresi paling kuat terjadi. Jika bottleneck terlalu kecil, detail bisa hilang; jika terlalu besar, kompresi kurang efektif.",
  },
  decoder: {
    stage: "Decoder",
    text:
      "Decoder mencoba membangun kembali data dari representasi bottleneck. Ia belajar membalik proses encoder agar hasil rekonstruksi mendekati input.",
  },
  output: {
    stage: "Output Layer",
    text:
      "Output adalah hasil rekonstruksi. Target autoencoder biasanya: output ≈ input. Perbedaan (error rekonstruksi) dipakai untuk melatih jaringan.",
  },
  done: {
    stage: "Selesai",
    text:
      "Simulasi selesai. Ringkasnya: encoder memampatkan, bottleneck menyimpan inti informasi, dan decoder merekonstruksi kembali menjadi output.",
  },
};

const els = {
  bg: document.getElementById("bg"),
  stagesWrap: document.getElementById("stages"),
  stageCards: Array.from(document.querySelectorAll(".stage")),
  wires: document.getElementById("wires"),
  startBtn: document.getElementById("startBtn"),
  status: document.querySelector(".status"),
  statusText: document.getElementById("statusText"),
  explanation: document.getElementById("explanation"),
};

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function setStatus(state, text) {
  if (els.status) els.status.dataset.state = state;
  if (els.statusText) els.statusText.textContent = text;
}

function setExplanation(key) {
  const data = EXPLANATIONS[key];
  if (!data) return;

  const stageEl = els.explanation.querySelector(".explain__stage");
  const textEl = els.explanation.querySelector(".explain__text");

  stageEl.textContent = data.stage;
  textEl.textContent = data.text;
}

function clearActive() {
  for (const card of els.stageCards) {
    card.dataset.active = "false";
    for (const n of card.querySelectorAll(".node")) n.dataset.active = "false";
  }
  for (const line of els.wires.querySelectorAll("line")) line.classList.remove("wire--hot");
}

function buildNodes() {
  for (const card of els.stageCards) {
    const key = card.dataset.stage;
    const count = NODE_CONFIG[key] ?? 4;
    const host = card.querySelector(".stage__nodes");
    host.innerHTML = "";

    for (let i = 0; i < count; i += 1) {
      const node = document.createElement("div");
      node.className = "node";
      node.dataset.active = "false";
      node.title = `${card.dataset.title} • Node ${i + 1}`;
      host.appendChild(node);
    }
  }
}

function svgClear(svg) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
}

function getNodeCenters(card) {
  const cardRect = card.getBoundingClientRect();
  const nodes = Array.from(card.querySelectorAll(".node"));
  return nodes.map((n) => {
    const r = n.getBoundingClientRect();
    return {
      el: n,
      x: r.left + r.width / 2 - cardRect.left,
      y: r.top + r.height / 2 - cardRect.top,
    };
  });
}

function drawWires() {
  const wrap = els.stagesWrap.getBoundingClientRect();
  els.wires.setAttribute("viewBox", `0 0 ${wrap.width} ${wrap.height}`);
  els.wires.setAttribute("preserveAspectRatio", "none");

  svgClear(els.wires);

  const cards = els.stageCards;
  const cardRects = cards.map((c) => c.getBoundingClientRect());

  // For each adjacent pair, connect every node to every node
  for (let i = 0; i < cards.length - 1; i += 1) {
    const left = cards[i];
    const right = cards[i + 1];

    const leftNodes = Array.from(left.querySelectorAll(".node")).map((n) => ({
      el: n,
      rect: n.getBoundingClientRect(),
    }));
    const rightNodes = Array.from(right.querySelectorAll(".node")).map((n) => ({
      el: n,
      rect: n.getBoundingClientRect(),
    }));

    for (const a of leftNodes) {
      for (const b of rightNodes) {
        const x1 = a.rect.left + a.rect.width / 2 - wrap.left;
        const y1 = a.rect.top + a.rect.height / 2 - wrap.top;
        const x2 = b.rect.left + b.rect.width / 2 - wrap.left;
        const y2 = b.rect.top + b.rect.height / 2 - wrap.top;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.classList.add("wire");

        // Store endpoints for particles
        line.dataset.fromStage = left.dataset.stage;
        line.dataset.toStage = right.dataset.stage;

        els.wires.appendChild(line);
      }
    }
  }
}

let resizeTimer = null;
function scheduleRedraw() {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    drawWires();
  }, 60);
}

// --- Background neural network (canvas) ---
function startBackground() {
  const canvas = els.bg;
  const ctx = canvas.getContext("2d", { alpha: true });

  const DPR = Math.min(2, window.devicePixelRatio || 1);
  let w = 0;
  let h = 0;

  function resize() {
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  const count = Math.round(Math.sqrt(window.innerWidth * window.innerHeight) / 10);
  const points = new Array(count).fill(0).map(() => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: 1.2 + Math.random() * 1.8,
  }));

  const maxDist = 140;

  resize();
  window.addEventListener("resize", () => {
    resize();
  });

  let t0 = performance.now();
  function frame(t) {
    const dt = Math.min(40, t - t0);
    t0 = t;

    ctx.clearRect(0, 0, w, h);

    // background glow
    const g = ctx.createRadialGradient(w * 0.25, h * 0.2, 0, w * 0.25, h * 0.2, Math.max(w, h));
    g.addColorStop(0, "rgba(66,200,255,0.08)");
    g.addColorStop(0.55, "rgba(42,123,255,0.04)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    for (const p of points) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;
    }

    // lines
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i];
        const b = points[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d > maxDist) continue;
        const alpha = (1 - d / maxDist) * 0.22;
        ctx.strokeStyle = `rgba(66,200,255,${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // points
    for (const p of points) {
      ctx.fillStyle = "rgba(235,245,255,0.55)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(66,200,255,0.20)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

// --- Simulation ---
let running = false;
let rafId = null;
let particles = [];

function linesBetweenStages(fromStage, toStage) {
  return Array.from(els.wires.querySelectorAll("line")).filter(
    (l) => l.dataset.fromStage === fromStage && l.dataset.toStage === toStage,
  );
}

function activateStage(stageKey) {
  for (const card of els.stageCards) {
    card.dataset.active = card.dataset.stage === stageKey ? "true" : "false";
  }
  const activeCard = els.stageCards.find((c) => c.dataset.stage === stageKey);
  if (!activeCard) return;

  const nodes = Array.from(activeCard.querySelectorAll(".node"));
  for (const n of nodes) n.dataset.active = "true";

  // Slightly highlight the wires of adjacent step
  const idx = STAGE_ORDER.indexOf(stageKey);
  const prev = idx > 0 ? STAGE_ORDER[idx - 1] : null;
  const next = idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;

  for (const line of els.wires.querySelectorAll("line")) line.classList.remove("wire--hot");
  if (prev) for (const l of linesBetweenStages(prev, stageKey)) l.classList.add("wire--hot");
  if (next) for (const l of linesBetweenStages(stageKey, next)) l.classList.add("wire--hot");
}

function spawnParticles(fromStage, toStage, count) {
  const wrap = els.stagesWrap.getBoundingClientRect();
  const lines = linesBetweenStages(fromStage, toStage);
  if (lines.length === 0) return;

  for (let i = 0; i < count; i += 1) {
    const line = lines[Math.floor(Math.random() * lines.length)];
    const x1 = Number(line.getAttribute("x1"));
    const y1 = Number(line.getAttribute("y1"));
    const x2 = Number(line.getAttribute("x2"));
    const y2 = Number(line.getAttribute("y2"));

    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("r", "3.2");
    c.setAttribute("cx", x1);
    c.setAttribute("cy", y1);
    c.classList.add("particle");
    els.wires.appendChild(c);

    particles.push({
      el: c,
      x1,
      y1,
      x2,
      y2,
      t: 0,
      speed:
        (SIM_PACE === "slow" ? 0.006 : 0.010) +
        Math.random() * (SIM_PACE === "slow" ? 0.008 : 0.012),
      wrap,
    });
  }
}

function clearParticles() {
  for (const p of particles) p.el.remove();
  particles = [];
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function particleLoop() {
  for (const p of particles) {
    p.t = Math.min(1, p.t + p.speed);
    const k = easeInOut(p.t);
    const x = p.x1 + (p.x2 - p.x1) * k;
    const y = p.y1 + (p.y2 - p.y1) * k;
    p.el.setAttribute("cx", x);
    p.el.setAttribute("cy", y);

    if (p.t >= 1) {
      p.el.remove();
      p._dead = true;
    }
  }
  particles = particles.filter((p) => !p._dead);

  rafId = requestAnimationFrame(particleLoop);
}

function sleepMs(ms) {
  // Use rAF timing to avoid environments that clamp/accelerate timers.
  return new Promise((resolve) => {
    const start = performance.now();
    function tick(now) {
      if (now - start >= ms) return resolve();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

async function runSimulation() {
  if (running) return;

  running = true;
  clearActive();
  clearParticles();

  els.startBtn.disabled = true;
  setStatus("running", "Running...");

  const stepDelay = prefersReducedMotion() ? 450 : SIM_PACE === "slow" ? 1400 : 900;
  const flowCount = prefersReducedMotion() ? 4 : SIM_PACE === "slow" ? 10 : 7;

  // Ensure wires are aligned with current layout
  drawWires();

  if (!prefersReducedMotion()) {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(particleLoop);
  }

  for (let i = 0; i < STAGE_ORDER.length; i += 1) {
    const key = STAGE_ORDER[i];

    // reset node actives for clarity
    for (const card of els.stageCards) {
      for (const n of card.querySelectorAll(".node")) n.dataset.active = "false";
    }

    activateStage(key);
    setExplanation(key);

    if (i < STAGE_ORDER.length - 1 && !prefersReducedMotion()) {
      spawnParticles(key, STAGE_ORDER[i + 1], flowCount);
    }

    await sleepMs(stepDelay);
  }

  setExplanation("done");
  setStatus("done", "Done");

  // Let remaining particles finish
  if (!prefersReducedMotion()) await sleepMs(650);

  running = false;
  els.startBtn.disabled = false;
  els.startBtn.textContent = "Restart Simulation";
}

function init() {
  buildNodes();
  startBackground();

  // Build initial wires after layout
  requestAnimationFrame(() => {
    drawWires();
  });

  window.addEventListener("resize", () => {
    scheduleRedraw();
  });

  // Redraw wires when grid reflows (e.g., breakpoint changes, wrapping nodes on mobile).
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => scheduleRedraw());
    ro.observe(els.stagesWrap);
    for (const card of els.stageCards) ro.observe(card);
  }

  els.startBtn.addEventListener("click", () => {
    runSimulation();
  });

  // Recompute wires if fonts load late
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      scheduleRedraw();
    });
  }
}

init();
