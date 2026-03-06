import externalNodesData from './nodes.json';
import motivationalText from './motivationalText.json';

const COLOR_PALETTE = ["#00f2ff", "#00ff95", "#22d3ee", "#3b82f6", "#a855f7", "#ef4444"];

// Simple 3D distance squared helper
const distSq = (a, b) => {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
};

// Mulberry32 PRNG for deterministic layouts
const mulberry32 = (a) => {
  return () => {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Generate random point inside a sphere of given radius using provided rng
const randomPointInSphere = (radius, rng) => {
  const u = rng();
  const v = rng();
  const theta = u * 2 * Math.PI;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(rng()) * radius; // cube root for uniform density
  const sinPhi = Math.sin(phi);
  return [
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  ];
};

// Random unit vector
const randomUnit = (rng) => {
  const p = randomPointInSphere(1, rng);
  const len = Math.hypot(p[0], p[1], p[2]) || 1;
  return [p[0] / len, p[1] / len, p[2] / len];
};

const randomInt = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min;

const G_MINOR_SEMITONES = new Set([0, 2, 3, 5, 7, 8, 10]);

const randomGMinorMidi = (rng, min, max) => {
  const pool = [];
  for (let m = min; m <= max; m += 1) {
    if (G_MINOR_SEMITONES.has(((m % 12) + 12) % 12)) {
      pool.push(m);
    }
  }
  if (!pool.length) {
    return randomInt(rng, min, max);
  }
  return pool[Math.floor(rng() * pool.length)];
};

// Upward-biased point (y >= 0) to encourage vertical growth
const randomPointUpward = (radius, rng) => {
  const p = randomPointInSphere(radius, rng);
  return [p[0], Math.abs(p[1]), p[2]];
};

// Space Colonization-inspired branching with recursive leaf bursts
export const generateMycelium = (
  seedLeafCount = 120,
  {
    worldRadius = 10,
    influenceRadius = 20,
    killRadius = 2,
    segmentLength = 2,
    maxIterations = 220,
    maxNodes = 140,
    minNodeSpacing = 0.75,
    burstProbability = 0.25,
    burstChildCount = 2,
    burstSpread = 1.4,
    initialRoots = 5,
    rootRadius = 6,
    branchFanoutChance = 0.13,
    minMidi = 52,
    maxMidi = 76,
    seed = Math.floor(Math.random() * 1e9),
  } = {}
) => {
  const rng = mulberry32(seed);
  const externalNodes = Array.isArray(externalNodesData) ? externalNodesData : [];
  const motivationalQuotes = Array.isArray(motivationalText?.citas)
    ? motivationalText.citas
    : [];
  const nodeLimit = Math.max(maxNodes, (externalNodes.length || 0) + 5);
  const leaves = Array.from({ length: seedLeafCount }, () => randomPointUpward(worldRadius, rng));

  // Start with a root near the origin and several offset roots to encourage branching
  const baseY = -worldRadius * 0.8;
  const nodes = [{ id: 0, position: [0, baseY, 0], parent: null }];
  let nextId = 1;
  for (let r = 0; r < initialRoots; r++) {
    const offset = randomPointInSphere(rootRadius, rng);
    nodes.push({ id: nextId, position: [offset[0], baseY + Math.abs(offset[1]) * 0.4, offset[2]], parent: 0 });
    nextId += 1;
  }

  let iterations = 0;
  const verticalBias = 0.25;

  while (leaves.length > 0 && iterations < maxIterations && nodes.length < nodeLimit) {
    iterations++;

    // Track growth directions per node
    const growth = new Map(); // nodeIndex -> { dir: [x,y,z], count }

    // Associate leaves to nearest node within influence radius
    for (let i = leaves.length - 1; i >= 0; i--) {
      const leaf = leaves[i];
      let nearestIndex = -1;
      let nearestDistSq = Infinity;

      for (let n = 0; n < nodes.length; n++) {
        const d2 = distSq(leaf, nodes[n].position);
        if (d2 < killRadius * killRadius) {
          // Leaf is consumed
          leaves.splice(i, 1);
          nearestIndex = -1;
          break;
        }
        if (d2 < nearestDistSq) {
          nearestDistSq = d2;
          nearestIndex = n;
        }
      }

      if (nearestIndex === -1) continue;
      if (nearestDistSq > influenceRadius * influenceRadius) continue;

      // Accumulate growth direction
      const node = nodes[nearestIndex];
      const dir = [
        (leaf[0] - node.position[0]),
        (leaf[1] - node.position[1]),
        (leaf[2] - node.position[2])
      ];
      dir[1] += verticalBias; // empujar crecimiento hacia arriba
      const len = Math.hypot(dir[0], dir[1], dir[2]) || 1;
      dir[0] /= len; dir[1] /= len; dir[2] /= len;

      const current = growth.get(nearestIndex) || { dir: [0, 0, 0], count: 0 };
      current.dir[0] += dir[0];
      current.dir[1] += dir[1];
      current.dir[2] += dir[2];
      current.count += 1;
      growth.set(nearestIndex, current);
    }

    // Grow new nodes from accumulated directions
    growth.forEach((value, nodeIndex) => {
      const { dir, count } = value;
      if (count === 0) return;
      const norm = Math.hypot(dir[0], dir[1], dir[2]) || 1;
      const step = [
        (dir[0] / norm) * segmentLength,
        (dir[1] / norm) * segmentLength,
        (dir[2] / norm) * segmentLength,
      ];

      const base = nodes[nodeIndex].position;
      const newPos = [base[0] + step[0], base[1] + step[1], base[2] + step[2]];

      // Enforce minimum spacing to avoid very dense clusters
      const tooClose = nodes.some((n) => distSq(n.position, newPos) < minNodeSpacing * minNodeSpacing);
      if (!tooClose) {
        nodes.push({ id: nextId, position: newPos, parent: nodeIndex });
        nextId += 1;
      }

      // Fan-out branching when multiple leaves influenced this node
      if (count > 1 && nodes.length < nodeLimit && rng() < branchFanoutChance) {
        const jitterDir = randomUnit(rng);
        const branchDir = [
          dir[0] + jitterDir[0] * 0.6,
          dir[1] + jitterDir[1] * 0.6,
          dir[2] + jitterDir[2] * 0.6,
        ];
        const bNorm = Math.hypot(branchDir[0], branchDir[1], branchDir[2]) || 1;
        const branchStep = [
          (branchDir[0] / bNorm) * segmentLength,
          (branchDir[1] / bNorm) * segmentLength,
          (branchDir[2] / bNorm) * segmentLength,
        ];
        const branchPos = [
          base[0] + branchStep[0],
          base[1] + branchStep[1],
          base[2] + branchStep[2],
        ];
        const tooCloseBranch = nodes.some((n) => distSq(n.position, branchPos) < minNodeSpacing * minNodeSpacing);
        if (!tooCloseBranch && nodes.length < nodeLimit) {
          nodes.push({ id: nextId, position: branchPos, parent: nodeIndex });
          nextId += 1;
        }
      }

      // Recursive burst: add small random children occasionally for organic feel
      if (rng() < burstProbability && nodes.length < nodeLimit) {
        for (let b = 0; b < burstChildCount; b++) {
          const jitter = randomPointInSphere(burstSpread, rng);
          const childPos = [
            newPos[0] + jitter[0] * 0.2,
            newPos[1] + jitter[1] * 0.2,
            newPos[2] + jitter[2] * 0.2,
          ];
          const tooCloseChild = nodes.some((n) => distSq(n.position, childPos) < minNodeSpacing * minNodeSpacing);
          if (!tooCloseChild && nodes.length < nodeLimit) {
            nodes.push({ id: nextId, position: childPos, parent: nextId - 1 });
            nextId += 1;
          }
        }
      }
    });
  }

  // Convert to output format with colors and metadata
  const coloredNodes = nodes.map((n, idx) => {
    const quoteIndex = motivationalQuotes.length
      ? randomInt(rng, 0, motivationalQuotes.length - 1)
      : null;
    const quoteText = quoteIndex !== null ? motivationalQuotes[quoteIndex]?.texto : null;
    const quoteAuthor = quoteIndex !== null ? motivationalQuotes[quoteIndex]?.autor : null;
    const description = quoteText || `Punto de conexión biológica ${n.id}. Generado por colonización espacial (${iterations} iteraciones).`;

    return {
      id: n.id,
      position: n.position,
      title: !!quoteAuthor ? `${quoteAuthor}` : `Nodo ${n.id}`,
      color: COLOR_PALETTE[n.id % COLOR_PALETTE.length],
      // Solo los nodos externos pueden ser luminosos; los generados son estándar
      variant: 'standard',
      note: randomGMinorMidi(rng, minMidi, maxMidi),
      description,
      image: `https://picsum.photos/seed/${idx}-${n.id}/300/200`
    };
  });

  const links = nodes
    .filter((n) => n.parent !== null)
    .map((n) => ({
      startId: nodes[n.parent].id,
      endId: n.id,
      start: nodes[n.parent].position,
      end: n.position,
    }));

  // Merge external data nodes randomly into final list
  const finalNodes = [...coloredNodes];
  const finalLinks = [...links];

  externalNodes.forEach((ext, idx) => {
    const position = Array.isArray(ext.position) && ext.position.length === 3
      ? ext.position
      : randomPointInSphere(worldRadius * 0.8, rng);

    // Respect spacing
    const tooClose = finalNodes.some((n) => distSq(n.position, position) < minNodeSpacing * minNodeSpacing);
    if (tooClose) return;
    const node = {
      id: nextId,
      position,
      title: ext.title || `Nodo externo ${idx}`,
      color: ext.color || COLOR_PALETTE[nextId % COLOR_PALETTE.length],
      // Externos controlan el brillo; por defecto serán luminosos si no se especifica
      variant: ext.variant || 'luminous',
      note: typeof ext.note === 'number' ? ext.note : randomGMinorMidi(rng, minMidi, maxMidi),
      description: ext.description || 'Nodo externo',
      image: ext.image || `https://picsum.photos/seed/external-${idx}/300/200`,
    };
    finalNodes.push(node);

    // Link to nearest existing node for connectivity
    let nearest = null;
    let nearestDist = Infinity;
    for (const n of coloredNodes) {
      const d2 = distSq(n.position, position);
      if (d2 < nearestDist) {
        nearestDist = d2;
        nearest = n;
      }
    }
    if (nearest) {
      finalLinks.push({
        startId: nearest.id,
        endId: node.id,
        start: nearest.position,
        end: position,
      });
    }

    nextId += 1;
  });

  // Shuffle final nodes to mix generated and external entries
  for (let i = finalNodes.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [finalNodes[i], finalNodes[j]] = [finalNodes[j], finalNodes[i]];
  }

  return { nodes: finalNodes, links: finalLinks };
};