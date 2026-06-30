'use client';
import { useEffect, useRef, useState } from 'react';
import type { AppWindowProps } from '../../os/types';

// ─── Canvas dimensions ────────────────────────────────────────────────────────
const CW = 920;
const CH = 480;
const GROUND_Y = 370;

// ─── Physics ──────────────────────────────────────────────────────────────────
const GRAVITY = 0.7;
const JUMP_FORCE = -15;
const JUMP_HOLD = -0.5; // per-frame bonus while space held
const JUMP_HOLD_MAX = 10; // max frames of hold bonus

// ─── Game tuning ─────────────────────────────────────────────────────────────
const BASE_SPEED = 5.5;
const MAX_SPEED = 14;
const ACCEL = 0.0065;
const PLAYER_X = 130;
const PLAYER_W = 42;
const PLAYER_H = 54;
const DUCK_H = 30;
const INVINCIBILITY_MS = 900;
const ROCKET_DURATION_MS = 5000;
const THEME_THRESHOLDS = [0, 600, 1400, 2600, 4200];
const DAMAGE: Record<string, number> = { bug: 15, fire: 30, drone: 20 };

// ─── Palette ─────────────────────────────────────────────────────────────────
const P = {
  sky0: ['#f9d976', '#f3a951', '#e07b39'],       // College Campus (warm gold sunset)
  sky1: ['#1a0533', '#2d0b5e', '#4a1580'],       // Hackathon Hall (purple night)
  sky2: ['#050d1a', '#0a1628', '#0d2040'],       // Night Coding Room (deep navy)
  sky3: ['#a8d8ea', '#74c0e0', '#3da0cc'],       // Singapore Skyline (cyan)
  sky4: ['#e8ecf0', '#d0d8e0', '#c0ccd8'],       // Startup Office (light gray)
  ground: ['#c8a06a', '#1a0b2e', '#0a0f1a', '#1a3a4a', '#c8d0d8'],
  groundLine: ['#a07840', '#2d1555', '#0d1526', '#0d2a38', '#a8b0b8'],
};

// ─── Notification messages ────────────────────────────────────────────────────
const MILESTONE_NOTIFS = [
  'Production looks stable.',
  'Commit streak looking good.',
  'AI Copilot is impressed.',
  'Push to main. No conflicts.',
  'Build passed. All green.',
  'Zero bugs. For now.',
  'Linting clean.',
  'Tests passing.',
  'Code review approved.',
  'Deployment pipeline green.',
];

// ─── Types ───────────────────────────────────────────────────────────────────
type GameState = 'splash' | 'playing' | 'paused' | 'gameover';

interface PlayerState {
  y: number; vy: number;
  grounded: boolean;
  jumping: boolean;
  jumpHeld: boolean; jumpHeldFrames: number;
  ducking: boolean;
  animFrame: number; animTimer: number;
  hitTimer: number;
  bobPhase: number;
  state: 'run' | 'jump' | 'fall' | 'duck' | 'hit';
}

interface Obstacle {
  id: number; type: 'bug' | 'fire' | 'drone';
  x: number; w: number; h: number; y: number;
  frame: number; frameTimer: number;
}

interface PowerUp {
  id: number; type: 'coffee' | 'star' | 'rocket';
  x: number; y: number;
  frame: number; frameTimer: number;
  collected: boolean;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number;
  r: number; g: number; b: number; a: number;
  size: number;
  type: 'dust' | 'damage' | 'sparkle' | 'exhaust' | 'steam' | 'firefly';
}

interface NotifItem { id: number; text: string; }
interface AchievementItem { id: string; title: string; desc: string; }

// ─── Sound Manager ────────────────────────────────────────────────────────────
class SoundManager {
  private sounds: Record<string, HTMLAudioElement> = {};
  private musicReady = false;
  private muted = false;

  load() {
    const files: Record<string, string> = {
      jump: '/sounds/jump.mp3',
      pickup: '/sounds/pickup.mp3',
      damage: '/sounds/damage.mp3',
      achievement: '/sounds/achievement.mp3',
      click: '/sounds/click.mp3',
      music: '/sounds/soundtrack.mp3',
    };
    for (const [k, src] of Object.entries(files)) {
      const a = new Audio(src);
      a.preload = 'auto';
      if (k === 'music') { a.loop = true; a.volume = 0.30; }
      else { a.volume = 0.45; }
      this.sounds[k] = a;
    }
    this.musicReady = true;
  }

  private play(key: string) {
    if (this.muted) return;
    const src = this.sounds[key];
    if (!src) return;
    const clone = src.cloneNode() as HTMLAudioElement;
    clone.volume = src.volume;
    clone.play().catch(() => {});
  }

  jump() { this.play('jump'); }
  pickup() { this.play('pickup'); }
  damage() { this.play('damage'); }
  achievement() { this.play('achievement'); }
  click() { this.play('click'); }

  startMusic() {
    if (this.muted || !this.musicReady) return;
    const m = this.sounds['music'];
    if (m && m.paused) m.play().catch(() => {});
  }

  stopMusic() {
    const m = this.sounds['music'];
    if (m && !m.paused) { m.pause(); m.currentTime = 0; }
  }

  pauseMusic() {
    const m = this.sounds['music'];
    if (m && !m.paused) m.pause();
  }

  resumeMusic() {
    if (this.muted) return;
    const m = this.sounds['music'];
    if (m && m.paused) m.play().catch(() => {});
  }

  destroy() {
    this.stopMusic();
    for (const a of Object.values(this.sounds)) { a.src = ''; }
  }
}

// ─── Pixel art drawing helpers ────────────────────────────────────────────────
function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function drawBug(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  const f = frame % 2;
  const bx = x, by = y;
  // Body
  px(ctx, bx + 4, by + 4, 12, 8, '#22c55e');
  px(ctx, bx + 6, by + 2, 8, 4, '#16a34a');
  // Head
  px(ctx, bx, by + 4, 6, 6, '#16a34a');
  // Eyes
  px(ctx, bx + 1, by + 4, 2, 2, '#ff0000');
  // Antennae
  px(ctx, bx + 2, by, 2, 4, '#15803d');
  px(ctx, bx + 4, by, 2, 2, '#15803d');
  // Legs
  const legY = f === 0 ? by + 10 : by + 11;
  px(ctx, bx + 6, legY, 2, 3, '#166534');
  px(ctx, bx + 10, legY, 2, 3, '#166534');
  px(ctx, bx + 14, legY, 2, 3, '#166534');
  // Shell dots
  px(ctx, bx + 8, by + 5, 2, 2, '#86efac');
  px(ctx, bx + 12, by + 6, 2, 2, '#86efac');
}

function drawFire(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  const f = frame % 3;
  const offsets = [[0, 0], [-1, 0], [1, 0]];
  const [ox] = offsets[f];
  // Base
  px(ctx, x + 4 + ox, y + 24, 24, 10, '#dc2626');
  px(ctx, x + 2 + ox, y + 20, 28, 10, '#ea580c');
  // Mid
  px(ctx, x + 6 + ox, y + 12, 20, 12, '#f97316');
  px(ctx, x + 10 + ox, y + 6, 12, 10, '#fbbf24');
  // Tip
  px(ctx, x + 12 + ox, y, 8, 8, '#fde68a');
  px(ctx, x + 14 + ox, y - 4, 4, 6, '#fff7ed');
  // Side flames
  px(ctx, x + ox, y + 18, 6, 16, '#ef4444');
  px(ctx, x + 26 + ox, y + 18, 6, 16, '#ef4444');
}

function drawDrone(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  const f = frame % 4;
  const propAngle = f * 4;
  // Body
  px(ctx, x + 6, y + 8, 28, 14, '#64748b');
  px(ctx, x + 10, y + 6, 20, 18, '#475569');
  // Camera
  px(ctx, x + 16, y + 14, 8, 6, '#1e293b');
  px(ctx, x + 18, y + 15, 4, 4, '#7dd3fc');
  // Arms
  px(ctx, x, y + 8, 10, 4, '#94a3b8');
  px(ctx, x + 30, y + 8, 10, 4, '#94a3b8');
  // Propellers (animated spin)
  const pw = propAngle % 8 < 4 ? 16 : 6;
  const ph = propAngle % 8 < 4 ? 3 : 3;
  px(ctx, x - 8, y + 4, pw, ph, '#cbd5e1');
  px(ctx, x + 32, y + 4, pw, ph, '#cbd5e1');
  // Warning LED
  if (f % 2 === 0) px(ctx, x + 18, y + 8, 4, 4, '#ef4444');
}

function drawCoffee(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  const f = frame % 4;
  // Cup
  px(ctx, x + 4, y + 14, 22, 20, '#92400e');
  px(ctx, x + 6, y + 12, 18, 4, '#b45309');
  px(ctx, x + 2, y + 30, 26, 4, '#78350f');
  // Handle
  px(ctx, x + 26, y + 16, 4, 12, '#92400e');
  // Coffee surface
  px(ctx, x + 6, y + 16, 18, 4, '#7c2d12');
  // Steam
  const steamShift = [0, -1, -2, -1][f];
  px(ctx, x + 8, y + steamShift + 2, 2, 10, '#e2e8f0');
  px(ctx, x + 14, y + steamShift, 2, 12, '#e2e8f0');
  px(ctx, x + 20, y + steamShift + 2, 2, 10, '#e2e8f0');
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  const f = frame % 4;
  const glow = f < 2 ? '#fde68a' : '#fbbf24';
  // 5-point pixel star
  const cx2 = x + 14, cy2 = y + 14;
  // Center
  px(ctx, cx2 - 4, cy2 - 4, 8, 8, glow);
  // Points
  px(ctx, cx2 - 2, cy2 - 12, 4, 10, glow);  // top
  px(ctx, cx2 - 2, cy2 + 2, 4, 10, glow);   // bottom
  px(ctx, cx2 - 12, cy2 - 2, 10, 4, glow);  // left
  px(ctx, cx2 + 2, cy2 - 2, 10, 4, glow);   // right
  px(ctx, cx2 - 10, cy2 - 10, 6, 6, '#fbbf24'); // TL
  px(ctx, cx2 + 4, cy2 - 10, 6, 6, '#fbbf24');  // TR
  px(ctx, cx2 - 10, cy2 + 4, 6, 6, '#fbbf24');  // BL
  px(ctx, cx2 + 4, cy2 + 4, 6, 6, '#fbbf24');   // BR
  // Sparkle
  if (f === 0 || f === 2) {
    px(ctx, cx2 - 16, cy2 - 2, 4, 4, '#fef9c3');
    px(ctx, cx2 + 12, cy2 - 2, 4, 4, '#fef9c3');
  }
}

function drawRocket(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  const f = frame % 2;
  // Body
  px(ctx, x + 8, y + 8, 16, 28, '#e2e8f0');
  // Nose
  px(ctx, x + 10, y, 12, 10, '#f43f5e');
  px(ctx, x + 12, y - 6, 8, 8, '#f43f5e');
  px(ctx, x + 14, y - 10, 4, 6, '#fb7185');
  // Window
  px(ctx, x + 12, y + 14, 8, 8, '#7dd3fc');
  px(ctx, x + 14, y + 16, 4, 4, '#38bdf8');
  // Fins
  px(ctx, x + 2, y + 28, 8, 10, '#94a3b8');
  px(ctx, x + 22, y + 28, 8, 10, '#94a3b8');
  // Exhaust
  const exhaustC = f === 0 ? '#fb923c' : '#fbbf24';
  px(ctx, x + 10, y + 36, 12, 8, exhaustC);
  px(ctx, x + 12, y + 44, 8, 6, f === 0 ? '#fbbf24' : '#fde68a');
  px(ctx, x + 14, y + 50, 4, 4, '#fff7ed');
}

// ─── Background themes ────────────────────────────────────────────────────────
function drawTheme(ctx: CanvasRenderingContext2D, theme: number, scroll: number[], alpha: number) {
  ctx.globalAlpha = alpha;
  switch (theme) {
    case 0: drawCollegeCampus(ctx, scroll); break;
    case 1: drawHackathonHall(ctx, scroll); break;
    case 2: drawNightCodingRoom(ctx, scroll); break;
    case 3: drawSingaporeSkyline(ctx, scroll); break;
    case 4: drawStartupOffice(ctx, scroll); break;
    default: drawCollegeCampus(ctx, scroll);
  }
  ctx.globalAlpha = 1;
}

function drawCollegeCampus(ctx: CanvasRenderingContext2D, scroll: number[]) {
  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, '#f9c74f');
  grad.addColorStop(0.5, '#f9844a');
  grad.addColorStop(1, '#f3722c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, GROUND_Y);

  // Distant buildings (layer 0 — slowest)
  const s0 = scroll[0] % 400;
  for (let i = -1; i < 4; i++) {
    const bx = i * 400 - s0;
    px(ctx, bx + 20, GROUND_Y - 120, 60, 120, '#7c6f5a');
    px(ctx, bx + 90, GROUND_Y - 90, 50, 90, '#6b5e4a');
    px(ctx, bx + 150, GROUND_Y - 140, 55, 140, '#7c6f5a');
    px(ctx, bx + 210, GROUND_Y - 80, 45, 80, '#6b5e4a');
    px(ctx, bx + 260, GROUND_Y - 110, 70, 110, '#8c7e6a');
    // Windows
    for (let r = 0; r < 4; r++) {
      for (let c2 = 0; c2 < 3; c2++) {
        px(ctx, bx + 24 + c2 * 18, GROUND_Y - 110 + r * 24, 10, 14, '#fde68a');
      }
    }
  }

  // Mid trees (layer 1)
  const s1 = scroll[1] % 300;
  for (let i = -1; i < 5; i++) {
    const tx = i * 300 - s1;
    // Trunk
    px(ctx, tx + 30, GROUND_Y - 80, 12, 80, '#92400e');
    // Foliage
    px(ctx, tx + 10, GROUND_Y - 130, 52, 60, '#15803d');
    px(ctx, tx + 16, GROUND_Y - 160, 40, 40, '#16a34a');
    px(ctx, tx + 22, GROUND_Y - 180, 28, 30, '#22c55e');
  }

  // Ground
  px(ctx, 0, GROUND_Y, CW, CH - GROUND_Y, '#c8a06a');
  px(ctx, 0, GROUND_Y, CW, 6, '#a07840');

  // Near path marks (layer 2)
  const s2 = scroll[2] % 120;
  for (let i = -1; i < 10; i++) {
    px(ctx, i * 120 - s2 + 40, GROUND_Y + 20, 40, 6, '#b08950');
  }
}

function drawHackathonHall(ctx: CanvasRenderingContext2D, scroll: number[]) {
  // Dark interior
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, '#0f0720');
  grad.addColorStop(1, '#1a0b40');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, GROUND_Y);

  // Banner signs (layer 0)
  const s0 = scroll[0] % 500;
  for (let i = -1; i < 3; i++) {
    const bx = i * 500 - s0;
    // Banner
    px(ctx, bx + 60, 20, 200, 60, '#4c1d95');
    px(ctx, bx + 62, 22, 196, 56, '#5b21b6');
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('HACK THE FUTURE', bx + 78, 56);
    // Glow lines
    px(ctx, bx + 60, 78, 200, 4, '#7c3aed');
    // Table silhouettes
    px(ctx, bx + 20, GROUND_Y - 60, 140, 10, '#2d1b69');
    px(ctx, bx + 30, GROUND_Y - 50, 8, 50, '#2d1b69');
    px(ctx, bx + 150, GROUND_Y - 50, 8, 50, '#2d1b69');
    // Laptop glow
    px(ctx, bx + 60, GROUND_Y - 70, 30, 20, '#1e3a8a');
    px(ctx, bx + 64, GROUND_Y - 68, 22, 16, '#3b82f6');
    // Overhead lights
    for (let l = 0; l < 5; l++) {
      px(ctx, bx + l * 50, 0, 6, 12, '#6d28d9');
      // Light cone
      ctx.fillStyle = 'rgba(167,139,250,0.08)';
      ctx.beginPath();
      ctx.moveTo(bx + l * 50 + 3, 12);
      ctx.lineTo(bx + l * 50 - 30, GROUND_Y);
      ctx.lineTo(bx + l * 50 + 36, GROUND_Y);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Floor
  px(ctx, 0, GROUND_Y, CW, CH - GROUND_Y, '#0a0520');
  px(ctx, 0, GROUND_Y, CW, 4, '#4c1d95');

  // Floor reflection
  const s2 = scroll[2] % 80;
  for (let i = -1; i < 14; i++) {
    px(ctx, i * 80 - s2, GROUND_Y + 8, 40, 2, '#2e1065');
  }
}

function drawNightCodingRoom(ctx: CanvasRenderingContext2D, scroll: number[]) {
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, '#020617');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, GROUND_Y);

  // Monitors (layer 0)
  const s0 = scroll[0] % 450;
  for (let i = -1; i < 3; i++) {
    const mx = i * 450 - s0;
    // Monitor
    px(ctx, mx + 40, GROUND_Y - 120, 80, 60, '#1e293b');
    px(ctx, mx + 44, GROUND_Y - 116, 72, 52, '#0f172a');
    // Code lines on screen
    const codeColors = ['#22d3ee', '#a78bfa', '#34d399', '#fb923c'];
    for (let r = 0; r < 5; r++) {
      const len = [40, 28, 36, 20, 32][r];
      px(ctx, mx + 48, GROUND_Y - 110 + r * 9, len, 3, codeColors[r % 4]);
    }
    // Screen glow
    ctx.fillStyle = 'rgba(14,165,233,0.06)';
    ctx.fillRect(mx + 20, GROUND_Y - 140, 120, 120);
    // Stand
    px(ctx, mx + 76, GROUND_Y - 60, 8, 20, '#334155');
    px(ctx, mx + 60, GROUND_Y - 40, 40, 6, '#334155');
    // Second monitor
    px(ctx, mx + 130, GROUND_Y - 110, 70, 50, '#1e293b');
    px(ctx, mx + 134, GROUND_Y - 106, 62, 42, '#0f172a');
    for (let r = 0; r < 4; r++) {
      px(ctx, mx + 138, GROUND_Y - 100 + r * 9, [30, 22, 26, 16][r], 3, codeColors[(r + 2) % 4]);
    }
  }

  // Stars in background
  const s1 = scroll[1] % 600;
  for (let i = 0; i < 40; i++) {
    const sx = ((i * 137 + 600 - s1) % 600);
    const sy = (i * 89) % (GROUND_Y - 60);
    const brightness = i % 3 === 0 ? '255' : '180';
    px(ctx, sx, sy, 2, 2, `rgb(${brightness},${brightness},${brightness})`);
  }

  // Floor
  px(ctx, 0, GROUND_Y, CW, CH - GROUND_Y, '#020617');
  px(ctx, 0, GROUND_Y, CW, 3, '#1e293b');

  // Subtle floor glow
  const s2 = scroll[2] % 100;
  for (let i = -1; i < 11; i++) {
    px(ctx, i * 100 - s2, GROUND_Y + 4, 60, 1, '#1e3a5f');
  }
}

function drawSingaporeSkyline(ctx: CanvasRenderingContext2D, scroll: number[]) {
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, '#bae6fd');
  grad.addColorStop(0.6, '#7dd3fc');
  grad.addColorStop(1, '#38bdf8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, GROUND_Y);

  // MBS + skyline (layer 0 — slow)
  const s0 = scroll[0] % 800;
  for (let i = -1; i < 2; i++) {
    const bx = i * 800 - s0;
    // Marina Bay Sands
    px(ctx, bx + 60, GROUND_Y - 180, 30, 180, '#94a3b8');
    px(ctx, bx + 100, GROUND_Y - 200, 30, 200, '#94a3b8');
    px(ctx, bx + 140, GROUND_Y - 180, 30, 180, '#94a3b8');
    // Sky park (roof connecting the 3 towers)
    px(ctx, bx + 40, GROUND_Y - 200, 150, 24, '#78716c');
    px(ctx, bx + 50, GROUND_Y - 220, 130, 24, '#a8a29e');
    // Skyscrapers
    px(ctx, bx + 250, GROUND_Y - 140, 40, 140, '#a1a1aa');
    px(ctx, bx + 300, GROUND_Y - 170, 35, 170, '#9ca3af');
    px(ctx, bx + 345, GROUND_Y - 120, 30, 120, '#d1d5db');
    px(ctx, bx + 420, GROUND_Y - 200, 50, 200, '#6b7280');
    px(ctx, bx + 480, GROUND_Y - 150, 35, 150, '#9ca3af');
    // Windows on skyline
    for (let r = 0; r < 6; r++) {
      px(ctx, bx + 254, GROUND_Y - 130 + r * 20, 8, 10, '#fef9c3');
      px(ctx, bx + 266, GROUND_Y - 130 + r * 20, 8, 10, '#fef9c3');
    }
    // Water reflection
    px(ctx, bx, GROUND_Y - 40, 800, 40, 'rgba(186,230,253,0.3)');
  }

  // Water
  px(ctx, 0, GROUND_Y, CW, CH - GROUND_Y, '#0ea5e9');
  px(ctx, 0, GROUND_Y, CW, 4, '#38bdf8');

  // Water ripples
  const s2 = scroll[2] % 150;
  for (let i = -1; i < 8; i++) {
    px(ctx, i * 150 - s2 + 30, GROUND_Y + 12, 80, 2, 'rgba(255,255,255,0.2)');
    px(ctx, i * 150 - s2 + 70, GROUND_Y + 24, 50, 2, 'rgba(255,255,255,0.15)');
  }
}

function drawStartupOffice(ctx: CanvasRenderingContext2D, scroll: number[]) {
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, '#f8fafc');
  grad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, GROUND_Y);

  // Large windows (layer 0)
  const s0 = scroll[0] % 600;
  for (let i = -1; i < 3; i++) {
    const wx = i * 600 - s0;
    // Window frame
    px(ctx, wx + 30, 20, 200, GROUND_Y - 20, '#cbd5e1');
    px(ctx, wx + 34, 24, 192, GROUND_Y - 28, '#e0f2fe');
    // City outside window
    px(ctx, wx + 34, GROUND_Y - 100, 192, 76, '#bae6fd');
    for (let b = 0; b < 6; b++) {
      const bh = 40 + b * 20;
      px(ctx, wx + 38 + b * 30, GROUND_Y - bh, 20, bh, '#64748b');
    }
    // Window cross
    px(ctx, wx + 127, 24, 4, GROUND_Y - 28, '#cbd5e1');
    px(ctx, wx + 34, (GROUND_Y - 28) / 2, 192, 4, '#cbd5e1');
    // Plant
    px(ctx, wx + 240, GROUND_Y - 60, 16, 60, '#16a34a');
    px(ctx, wx + 230, GROUND_Y - 80, 36, 30, '#15803d');
    px(ctx, wx + 235, GROUND_Y - 100, 26, 30, '#22c55e');
    // Desk
    px(ctx, wx + 270, GROUND_Y - 50, 100, 10, '#d4a574');
    px(ctx, wx + 272, GROUND_Y - 40, 6, 40, '#b8865a');
    px(ctx, wx + 362, GROUND_Y - 40, 6, 40, '#b8865a');
    // Coffee cup on desk
    px(ctx, wx + 320, GROUND_Y - 68, 12, 18, '#7c3aed');
    px(ctx, wx + 322, GROUND_Y - 70, 8, 4, '#8b5cf6');
  }

  // Floor
  px(ctx, 0, GROUND_Y, CW, CH - GROUND_Y, '#f1f5f9');
  px(ctx, 0, GROUND_Y, CW, 4, '#cbd5e1');

  // Floor tiles
  const s2 = scroll[2] % 100;
  for (let i = -1; i < 11; i++) {
    px(ctx, i * 100 - s2, GROUND_Y, 98, 1, '#e2e8f0');
    px(ctx, i * 100 - s2, GROUND_Y + 2, 1, CH - GROUND_Y, '#e2e8f0');
  }
}

function drawGround(ctx: CanvasRenderingContext2D, theme: number, scroll: number[]) {
  // Ground is drawn inside each theme function; this adds running surface detail
  const s3 = scroll[3] % 60;
  const colors = ['#a07840', '#3b0764', '#0f172a', '#0284c7', '#94a3b8'];
  for (let i = -1; i < 20; i++) {
    px(ctx, i * 60 - s3, GROUND_Y + 6, 28, 3, colors[theme] + '60');
  }
}

// ─── HUD drawing ─────────────────────────────────────────────────────────────
function drawHUD(
  ctx: CanvasRenderingContext2D,
  commits: number, energy: number, best: number,
  rocketActive: boolean, rocketTime: number
) {
  // HUD background strip
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, CW, 40);

  // Commits (left)
  ctx.fillStyle = '#f0f0f0';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('COMMITS', 14, 16);
  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(String(commits).padStart(5, '0'), 14, 34);

  // Energy bar (center)
  const barX = CW / 2 - 80, barY = 10, barW = 160, barH = 12;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(barX, barY, barW, barH);
  const pct = Math.max(0, Math.min(1, energy / 100));
  const barColor = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#f59e0b' : '#ef4444';
  const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  barGrad.addColorStop(0, barColor);
  barGrad.addColorStop(1, barColor + 'aa');
  ctx.fillStyle = barGrad;
  ctx.fillRect(barX, barY, barW * pct, barH);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`ENERGY  ${energy}/100`, CW / 2, 34);
  ctx.textAlign = 'left';

  // Best (right)
  ctx.fillStyle = '#f0f0f0';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('BEST', CW - 14, 16);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(String(best).padStart(5, '0'), CW - 14, 34);
  ctx.textAlign = 'left';

  // Rocket timer
  if (rocketActive) {
    const t = rocketTime / ROCKET_DURATION_MS;
    ctx.fillStyle = `rgba(99,102,241,${0.15 + 0.1 * Math.sin(Date.now() * 0.008)})`;
    ctx.fillRect(0, 0, CW, CH);
    // Timer arc (top center)
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CW / 2, 20, 16, -Math.PI / 2, -Math.PI / 2 + t * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#c7d2fe';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🚀', CW / 2, 24);
    ctx.textAlign = 'left';
  }
}

function drawSplash(ctx: CanvasRenderingContext2D, best: number, charImg: HTMLImageElement | null, t: number) {
  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, CH);
  grad.addColorStop(0, '#0f0720');
  grad.addColorStop(1, '#1a0b40');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  // Animated grid
  ctx.strokeStyle = 'rgba(99,102,241,0.12)';
  ctx.lineWidth = 1;
  const gridOff = (t * 0.02) % 40;
  for (let x = gridOff; x < CW; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke(); }
  for (let y = gridOff; y < CH; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke(); }

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#818cf8';
  ctx.shadowBlur = 20;
  ctx.fillText('HACKATHON RUSH', CW / 2, CH / 2 - 80);
  ctx.shadowBlur = 0;

  // Subtitle
  ctx.fillStyle = '#a78bfa';
  ctx.font = '18px monospace';
  ctx.fillText('commit. survive. ship.', CW / 2, CH / 2 - 44);

  // Character
  if (charImg && charImg.complete) {
    const bob = Math.sin(t * 0.006) * 6;
    ctx.drawImage(charImg, CW / 2 - 32, CH / 2 - 12 + bob, 64, 64);
  }

  // Tap to start
  const blink = Math.sin(t * 0.005) > 0;
  if (blink) {
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('TAP ANYWHERE OR PRESS ENTER', CW / 2, CH / 2 + 90);
  }

  // Best
  if (best > 0) {
    ctx.fillStyle = '#fbbf24';
    ctx.font = '14px monospace';
    ctx.fillText(`BEST: ${best} commits`, CW / 2, CH / 2 + 120);
  }

  ctx.textAlign = 'left';

  // Controls hint
  ctx.fillStyle = 'rgba(200,200,200,0.5)';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ENTER / TAP: start · SPACE: jump   ↓: duck   P: pause', CW / 2, CH - 20);
  ctx.textAlign = 'left';
}

function drawGameOver(ctx: CanvasRenderingContext2D, commits: number, best: number, t: number) {
  // Overlay
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, CW, CH);

  ctx.textAlign = 'center';
  // Title
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.shadowColor = '#dc2626';
  ctx.shadowBlur = 16;
  ctx.fillText('DEPLOYMENT FAILED', CW / 2, CH / 2 - 80);
  ctx.shadowBlur = 0;

  // Stats
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '20px monospace';
  ctx.fillText(`Final Commits: ${commits}`, CW / 2, CH / 2 - 20);
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(`Best Streak: ${best}`, CW / 2, CH / 2 + 14);

  // Blink restart
  if (Math.sin(t * 0.006) > 0) {
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('TAP ANYWHERE OR PRESS ENTER', CW / 2, CH / 2 + 60);
  }

  ctx.textAlign = 'left';
}

function drawPaused(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', CW / 2, CH / 2);
  ctx.fillStyle = 'rgba(200,200,200,0.7)';
  ctx.font = '16px monospace';
  ctx.fillText('P to resume', CW / 2, CH / 2 + 36);
  ctx.textAlign = 'left';
}

// ─── Particle helpers ─────────────────────────────────────────────────────────
function spawnParticles(
  pool: Particle[], x: number, y: number,
  type: Particle['type'], count: number
) {
  for (let i = 0; i < count; i++) {
    pool.push({
      x, y,
      vx: (Math.random() - 0.5) * (type === 'damage' ? 5 : 3),
      vy: type === 'steam' ? -Math.random() * 2 - 1 : -Math.random() * 3 - 0.5,
      life: 1, maxLife: 1,
      r: type === 'damage' ? 239 : type === 'sparkle' ? 251 : type === 'exhaust' ? 129 : 200,
      g: type === 'damage' ? 68 : type === 'sparkle' ? 191 : type === 'exhaust' ? 140 : 200,
      b: type === 'damage' ? 68 : type === 'sparkle' ? 36 : type === 'exhaust' ? 36 : 200,
      a: 1,
      size: type === 'dust' ? 3 : type === 'sparkle' ? 4 : 5,
      type,
    });
  }
  // Cap pool
  if (pool.length > 300) pool.splice(0, pool.length - 300);
}

// ─── Persistence ──────────────────────────────────────────────────────────────
const LS_BEST = 'hr_best';
const LS_TOTAL = 'hr_total';
const LS_GAMES = 'hr_games';
const LS_ACH = 'hr_achievements';

function loadBest() { return parseInt(localStorage.getItem(LS_BEST) || '0', 10); }
function saveBest(v: number) { localStorage.setItem(LS_BEST, String(v)); }
function loadTotal() { return parseInt(localStorage.getItem(LS_TOTAL) || '0', 10); }
function saveTotal(v: number) { localStorage.setItem(LS_TOTAL, String(v)); }
function loadGames() { return parseInt(localStorage.getItem(LS_GAMES) || '0', 10); }
function saveGames(v: number) { localStorage.setItem(LS_GAMES, String(v)); }
function loadAchievements(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_ACH) || '[]'); }
  catch { return []; }
}
function saveAchievements(arr: string[]) { localStorage.setItem(LS_ACH, JSON.stringify(arr)); }

const ACHIEVEMENTS: Record<string, { title: string; desc: string }> = {
  'bug-hunter': { title: 'Bug Hunter', desc: 'Survived 10 bug hits' },
  'caffeine-addict': { title: 'Caffeine Addict', desc: 'Collected 5 coffees' },
  'open-source-hero': { title: 'Open Source Hero', desc: 'Collected 5 GitHub stars' },
  'zero-downtime': { title: 'Zero Downtime', desc: 'Survived 500 commits without damage' },
  'night-owl': { title: 'Night Owl', desc: 'Reached the Night Coding Room' },
  'speedrunner': { title: 'Speedrunner', desc: 'Reached max speed' },
};

// ─── Game Engine ──────────────────────────────────────────────────────────────
type NotifCb = (n: NotifItem) => void;
type AchievCb = (a: AchievementItem) => void;

class GameEngine {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private rafId = 0;
  private lastTime = 0;
  private elapsed = 0; // ms since game start (for blink/anim)

  state: GameState = 'splash';

  // Player
  private player: PlayerState = {
    y: GROUND_Y - PLAYER_H, vy: 0, grounded: true,
    jumping: false,
    jumpHeld: false, jumpHeldFrames: 0,
    ducking: false, animFrame: 0, animTimer: 0,
    hitTimer: 0, bobPhase: 0,
    state: 'run',
  };

  // Entities
  private obstacles: Obstacle[] = [];
  private powerUps: PowerUp[] = [];
  private particles: Particle[] = [];

  // Scrolling
  private bgScrollX = [0, 0, 0, 0]; // 4 parallax layers

  // Game state
  private commits = 0;
  private energy = 100;
  private speed = BASE_SPEED;
  private distance = 0;
  private themeIndex = 0;
  private prevThemeIndex = 0;
  private themeAlpha = 1; // 1 = fully new theme
  private rocketActive = false;
  private rocketTimer = 0;
  private screenShake = { x: 0, y: 0, timer: 0 };

  // Spawn timers
  private obstacleTimer = 0;
  private powerUpTimer = 0;
  private notifTimer = 0;
  private eid = 0;

  // Stats
  private bugHits = 0;
  private coffees = 0;
  private stars = 0;
  private damageFreePeriod = 0;
  private unlockedAch: string[] = [];

  // Persist
  bestCommits = 0;
  totalCommits = 0;
  gamesPlayed = 0;

  // Assets
  private charImg: HTMLImageElement | null = null;
  sound = new SoundManager();

  // Callbacks
  private notifCb: NotifCb = () => {};
  private achievCb: AchievCb = () => {};

  init(canvas: HTMLCanvasElement, notifCb: NotifCb, achievCb: AchievCb) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;

    this.notifCb = notifCb;
    this.achievCb = achievCb;

    // Load char image
    const img = new Image();
    img.src = '/character.png';
    img.onload = () => { this.charImg = img; };
    img.onerror = () => { this.charImg = null; };

    // Load sounds
    this.sound.load();

    // Load persistence
    this.bestCommits = loadBest();
    this.totalCommits = loadTotal();
    this.gamesPlayed = loadGames();
    this.unlockedAch = loadAchievements();

    this.rafId = requestAnimationFrame(this.loop);
  }

  private loop = (ts: number) => {
    const dt = Math.min(ts - this.lastTime, 50); // cap at 50ms (20 FPS min)
    this.lastTime = ts;
    this.elapsed += dt;

    if (this.state === 'playing') {
      this.update(dt);
    }
    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const dtf = dt / 16.67; // normalize to 60 FPS

    // Speed ramp
    this.speed = Math.min(BASE_SPEED + this.commits * ACCEL, MAX_SPEED);
    const spd = this.rocketActive ? this.speed * 1.5 : this.speed;

    // Distance & commits
    this.distance += spd * dtf;
    this.commits = Math.floor(this.distance / 10);

    // Theme transitions
    const newTheme = THEME_THRESHOLDS.findLastIndex ?
      THEME_THRESHOLDS.findLastIndex((t) => this.commits >= t) :
      [...THEME_THRESHOLDS].reverse().findIndex((t) => this.commits >= t);
    const ti = THEME_THRESHOLDS.findLastIndex
      ? THEME_THRESHOLDS.findLastIndex((t) => this.commits >= t)
      : Math.max(0, THEME_THRESHOLDS.filter((t) => this.commits >= t).length - 1);
    if (ti !== this.themeIndex) {
      this.prevThemeIndex = this.themeIndex;
      this.themeIndex = ti;
      this.themeAlpha = 0;
    }
    if (this.themeAlpha < 1) {
      this.themeAlpha = Math.min(1, this.themeAlpha + dtf * 0.012);
    }
    void newTheme; // suppress unused

    // Scroll parallax (speeds: 0.08, 0.2, 0.4, 0.8 of ground speed)
    const gspd = spd * dtf;
    this.bgScrollX[0] += gspd * 0.08;
    this.bgScrollX[1] += gspd * 0.2;
    this.bgScrollX[2] += gspd * 0.45;
    this.bgScrollX[3] += gspd * 0.9;

    // Player physics
    const p = this.player;
    p.animTimer += dt;
    p.bobPhase += dtf * 0.25;

    if (!p.grounded) {
      p.vy += GRAVITY * dtf;
      if (p.jumpHeld && p.jumpHeldFrames < JUMP_HOLD_MAX) {
        p.vy += JUMP_HOLD * dtf;
        p.jumpHeldFrames += dtf;
      }
    }
    p.y += p.vy * dtf;

    const groundY = GROUND_Y - (p.ducking ? DUCK_H : PLAYER_H);
    if (p.y >= groundY) {
      p.y = groundY;
      p.vy = 0;
      p.grounded = true;
      p.jumping = false;
    } else {
      p.grounded = false;
    }

    // Player animation state
    if (p.hitTimer > 0) { p.hitTimer -= dt; p.state = 'hit'; }
    else if (p.ducking) { p.state = 'duck'; }
    else if (!p.grounded && p.vy < 0) { p.state = 'jump'; }
    else if (!p.grounded && p.vy >= 0) { p.state = 'fall'; }
    else { p.state = 'run'; }

    // Anim frame (8-frame run cycle at ~12 FPS)
    if (p.animTimer > 83) { p.animFrame = (p.animFrame + 1) % 8; p.animTimer = 0; }

    // Hit timer
    if (p.hitTimer < 0) p.hitTimer = 0;

    // Invincibility
    const invincible = p.hitTimer > 0 || this.rocketActive;

    // Rocket timer
    if (this.rocketActive) {
      this.rocketTimer -= dt;
      if (this.rocketTimer <= 0) { this.rocketActive = false; this.rocketTimer = 0; }
      // Exhaust particles
      if (Math.random() < 0.5) spawnParticles(this.particles, PLAYER_X - 10, p.y + PLAYER_H / 2, 'exhaust', 1);
    }

    // Screen shake decay
    if (this.screenShake.timer > 0) {
      this.screenShake.timer -= dt;
      const s = this.screenShake.timer / 300 * 6;
      this.screenShake.x = (Math.random() - 0.5) * s;
      this.screenShake.y = (Math.random() - 0.5) * s;
    } else { this.screenShake.x = 0; this.screenShake.y = 0; }

    // Spawn obstacles
    this.obstacleTimer -= dt;
    if (this.obstacleTimer <= 0) {
      this.spawnObstacle();
      const minInterval = 800;
      const interval = Math.max(minInterval, 1900 - this.commits * 0.3);
      this.obstacleTimer = interval + Math.random() * 300;
    }

    // Spawn power-ups
    this.powerUpTimer -= dt;
    if (this.powerUpTimer <= 0) {
      this.spawnPowerUp();
      this.powerUpTimer = 4000 + Math.random() * 3000;
    }

    // Move obstacles
    for (const obs of this.obstacles) {
      obs.x -= spd * dtf;
      obs.frameTimer += dt;
      if (obs.frameTimer > 150) { obs.frame = (obs.frame + 1) % 4; obs.frameTimer = 0; }
    }
    this.obstacles = this.obstacles.filter((o) => o.x > -80);

    // Move power-ups
    for (const pu of this.powerUps) {
      pu.x -= spd * dtf;
      pu.frameTimer += dt;
      if (pu.frameTimer > 200) { pu.frame = (pu.frame + 1) % 4; pu.frameTimer = 0; }
    }
    this.powerUps = this.powerUps.filter((pu) => pu.x > -60 && !pu.collected);

    // Update particles
    for (const part of this.particles) {
      part.x += part.vx * dtf;
      part.y += part.vy * dtf;
      part.vy += 0.08 * dtf;
      part.life -= dtf / (part.maxLife * 60);
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);

    // Dust particles while running
    if (p.grounded && p.state === 'run' && Math.random() < 0.25) {
      spawnParticles(this.particles, PLAYER_X + Math.random() * 10, GROUND_Y + 2, 'dust', 1);
    }

    // Collision detection
    if (!invincible) {
      const px1 = PLAYER_X + 6;
      const py1 = p.y + 6;
      const pw1 = PLAYER_W - 12;
      const ph1 = (p.ducking ? DUCK_H : PLAYER_H) - 6;

      for (const obs of this.obstacles) {
        const ox = obs.x + 4, oy = obs.y + 4, ow = obs.w - 8, oh = obs.h - 8;
        if (px1 < ox + ow && px1 + pw1 > ox && py1 < oy + oh && py1 + ph1 > oy) {
          this.takeDamage(obs);
          break;
        }
      }
    }

    // Power-up collision
    for (const pu of this.powerUps) {
      if (pu.collected) continue;
      const px1 = PLAYER_X + 4, py1 = p.y + 4, pw1 = PLAYER_W - 8, ph1 = PLAYER_H - 8;
      const pux = pu.x, puy = pu.y, puw = 28, puh = 28;
      if (px1 < pux + puw && px1 + pw1 > pux && py1 < puy + puh && py1 + ph1 > puy) {
        this.collectPowerUp(pu);
        pu.collected = true;
      }
    }

    // Notifications every 200 commits
    this.notifTimer -= dt;
    if (this.notifTimer <= 0) {
      if (this.commits > 0 && this.commits % 200 < 20) {
        const msg = MILESTONE_NOTIFS[Math.floor(Math.random() * MILESTONE_NOTIFS.length)];
        this.notifCb({ id: Date.now(), text: msg });
      }
      this.notifTimer = 200 + Math.random() * 100;
    }

    // Achievements
    this.damageFreePeriod += dtf;
    this.checkAchievement('zero-downtime', this.damageFreePeriod >= 3000);
    this.checkAchievement('night-owl', this.themeIndex >= 2);
    this.checkAchievement('speedrunner', this.speed >= MAX_SPEED * 0.95);
  }

  private spawnObstacle() {
    const r = Math.random();
    let type: Obstacle['type'];
    if (this.commits < 400) {
      type = r < 0.65 ? 'bug' : 'fire';
    } else {
      type = r < 0.5 ? 'bug' : r < 0.8 ? 'fire' : 'drone';
    }

    const isDrone = type === 'drone';
    const h = type === 'bug' ? 22 : type === 'fire' ? 38 : 28;
    const w = type === 'bug' ? 24 : type === 'fire' ? 32 : 44;
    const y = isDrone
      ? GROUND_Y - PLAYER_H - 10 - Math.floor(Math.random() * 2) * 20 // floating high
      : GROUND_Y - h;

    this.obstacles.push({ id: this.eid++, type, x: CW + 20, w, h, y, frame: 0, frameTimer: 0 });
  }

  private spawnPowerUp() {
    const r = Math.random();
    const type: PowerUp['type'] = r < 0.55 ? 'coffee' : r < 0.85 ? 'star' : 'rocket';
    const y = GROUND_Y - 44 - Math.random() * 20;
    this.powerUps.push({ id: this.eid++, type, x: CW + 20, y, frame: 0, frameTimer: 0, collected: false });
  }

  private takeDamage(obs: Obstacle) {
    const dmg = DAMAGE[obs.type] ?? 15;
    this.energy = Math.max(0, this.energy - dmg);
    this.player.hitTimer = INVINCIBILITY_MS;
    this.player.state = 'hit';
    this.screenShake.timer = 300;
    this.damageFreePeriod = 0;
    this.sound.damage();
    spawnParticles(this.particles, PLAYER_X, this.player.y, 'damage', 6);
    if (obs.type === 'bug') this.bugHits++;
    this.checkAchievement('bug-hunter', this.bugHits >= 10);
    this.notifCb({ id: Date.now(), text: 'Taking damage! Watch out!' });
    if (this.energy <= 0) this.triggerGameOver();
  }

  private collectPowerUp(pu: PowerUp) {
    this.sound.pickup();
    spawnParticles(this.particles, pu.x + 14, pu.y + 14, 'sparkle', 8);
    if (pu.type === 'coffee') {
      this.energy = Math.min(100, this.energy + 20);
      this.coffees++;
      this.notifCb({ id: Date.now(), text: 'Coffee levels restored. ☕' });
      this.checkAchievement('caffeine-addict', this.coffees >= 5);
    } else if (pu.type === 'star') {
      this.distance += 500;
      this.stars++;
      this.notifCb({ id: Date.now(), text: 'GitHub star! +bonus commits ⭐' });
      this.checkAchievement('open-source-hero', this.stars >= 5);
    } else if (pu.type === 'rocket') {
      this.rocketActive = true;
      this.rocketTimer = ROCKET_DURATION_MS;
      this.notifCb({ id: Date.now(), text: 'Deploy rocket activated! 🚀' });
    }
  }

  private checkAchievement(id: string, condition: boolean) {
    if (!condition) return;
    if (this.unlockedAch.includes(id)) return;
    const def = ACHIEVEMENTS[id];
    if (!def) return;
    this.unlockedAch.push(id);
    saveAchievements(this.unlockedAch);
    this.sound.achievement();
    this.achievCb({ id, title: def.title, desc: def.desc });
  }

  private triggerGameOver() {
    this.state = 'gameover';
    this.sound.stopMusic();
    if (this.commits > this.bestCommits) {
      this.bestCommits = this.commits;
      saveBest(this.bestCommits);
    }
    this.totalCommits += this.commits;
    this.gamesPlayed++;
    saveTotal(this.totalCommits);
    saveGames(this.gamesPlayed);
  }

  private render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.screenShake.x, this.screenShake.y);
    ctx.imageSmoothingEnabled = false;

    // Draw background (crossfade between themes)
    if (this.themeAlpha < 1) {
      drawTheme(ctx, this.prevThemeIndex, this.bgScrollX, 1 - this.themeAlpha);
      drawTheme(ctx, this.themeIndex, this.bgScrollX, this.themeAlpha);
    } else {
      drawTheme(ctx, this.themeIndex, this.bgScrollX, 1);
    }

    drawGround(ctx, this.themeIndex, this.bgScrollX);

    // Particles (behind player)
    for (const pt of this.particles) {
      if (pt.type === 'dust' || pt.type === 'steam') {
        ctx.globalAlpha = pt.life * 0.6;
        ctx.fillStyle = `rgba(${pt.r},${pt.g},${pt.b},1)`;
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
        ctx.globalAlpha = 1;
      }
    }

    // Power-ups
    for (const pu of this.powerUps) {
      if (pu.collected) continue;
      if (pu.type === 'coffee') drawCoffee(ctx, pu.x, pu.y, pu.frame);
      else if (pu.type === 'star') drawStar(ctx, pu.x, pu.y, pu.frame);
      else drawRocket(ctx, pu.x, pu.y - 16, pu.frame);
    }

    // Obstacles
    for (const obs of this.obstacles) {
      if (obs.type === 'bug') drawBug(ctx, obs.x, obs.y, obs.frame);
      else if (obs.type === 'fire') drawFire(ctx, obs.x, obs.y, obs.frame);
      else drawDrone(ctx, obs.x, obs.y, obs.frame);
    }

    // Player
    this.renderPlayer(ctx);

    // Particles (in front of player)
    for (const pt of this.particles) {
      if (pt.type !== 'dust' && pt.type !== 'steam') {
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillStyle = `rgba(${pt.r},${pt.g},${pt.b},1)`;
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
        ctx.globalAlpha = 1;
      }
    }

    // HUD
    if (this.state === 'playing' || this.state === 'gameover' || this.state === 'paused') {
      drawHUD(ctx, this.commits, this.energy, this.bestCommits, this.rocketActive, this.rocketTimer);
    }

    // Screens
    if (this.state === 'splash') drawSplash(ctx, this.bestCommits, this.charImg, this.elapsed);
    if (this.state === 'gameover') drawGameOver(ctx, this.commits, this.bestCommits, this.elapsed);
    if (this.state === 'paused') drawPaused(ctx);

    ctx.restore();
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    const ph = p.ducking ? DUCK_H : PLAYER_H;
    const flash = p.hitTimer > 0 && Math.floor(p.hitTimer / 80) % 2 === 0;

    ctx.save();

    // Bob while running
    let drawY = p.y;
    if (p.state === 'run' && p.grounded) {
      drawY += Math.sin(p.bobPhase) * 3;
    }

    // Slight lean
    let lean = 0;
    if (p.state === 'jump') lean = -0.12;
    else if (p.state === 'fall') lean = 0.08;

    ctx.translate(PLAYER_X + PLAYER_W / 2, drawY + ph / 2);
    ctx.rotate(lean);

    if (flash) ctx.globalAlpha = 0.4;

    if (this.charImg && this.charImg.complete && this.charImg.naturalWidth > 0) {
      // Duck: squash vertically
      if (p.ducking) ctx.scale(1, 0.6);
      ctx.drawImage(this.charImg, -PLAYER_W / 2, -ph / 2, PLAYER_W, ph);
    } else {
      // Fallback: simple pixel person (dark hoodie, laptop)
      const cw = PLAYER_W, ch = ph;
      // Body (dark hoodie)
      px(ctx, -cw / 2 + 4, -ch / 2 + 16, cw - 8, ch - 20, '#1e1b4b');
      // Head
      px(ctx, -cw / 2 + 8, -ch / 2, 24, 20, '#fde68a');
      // Hair
      px(ctx, -cw / 2 + 8, -ch / 2, 24, 6, '#78350f');
      // Laptop
      px(ctx, -cw / 2 + 2, -ch / 2 + 24, 22, 14, '#374151');
      px(ctx, -cw / 2 + 4, -ch / 2 + 26, 18, 10, '#7dd3fc');
      // Legs (animated)
      const legO = Math.sin(p.bobPhase * 2) * 5;
      px(ctx, -cw / 2 + 6, ch / 2 - 16, 8, 16, '#312e81');
      px(ctx, -cw / 2 + 18, ch / 2 - 16 - legO, 8, 16, '#312e81');
      // Hoodie strings
      const hs = Math.sin(p.bobPhase) * 2;
      px(ctx, -cw / 2 + 12, -ch / 2 + 20 + hs, 2, 12, '#c7d2fe');
      px(ctx, -cw / 2 + 18, -ch / 2 + 20 - hs, 2, 12, '#c7d2fe');
    }

    if (this.rocketActive) {
      // Blue glow
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#818cf8';
      ctx.fillRect(-PLAYER_W / 2 - 4, -ph / 2 - 4, PLAYER_W + 8, ph + 8);
      ctx.globalAlpha = flash ? 0.4 : 1;
    }

    ctx.restore();
  }

  // ─── Input ─────────────────────────────────────────────────────────────────
  handleKey(code: string, down: boolean) {
    const p = this.player;

    if (code === 'KeyP' && down) {
      if (this.state === 'playing') { this.state = 'paused'; this.sound.pauseMusic(); }
      else if (this.state === 'paused') { this.state = 'playing'; this.sound.resumeMusic(); }
      return;
    }

    if (down && (code === 'Enter' || code === 'NumpadEnter')) {
      if (this.state === 'splash' || this.state === 'gameover') {
        this.handleTap();
      }
      return;
    }

    if (code === 'Space') {
      if (down) {
        if (this.state === 'playing') {
          if (p.grounded && !p.ducking) {
            p.vy = JUMP_FORCE;
            p.grounded = false;
            p.jumping = true;
            p.jumpHeld = true;
            p.jumpHeldFrames = 0;
            this.sound.jump();
          } else if (!p.grounded) {
            p.jumpHeld = true;
          }
        }
      } else {
        p.jumpHeld = false;
      }
    }

    if (code === 'ArrowDown') {
      if (down && this.state === 'playing') { p.ducking = true; }
      else { p.ducking = false; }
    }
  }

  start() {
    this.state = 'playing';
    this.sound.startMusic();
  }

  /** Tap / click anywhere — start from splash or restart after game over. */
  handleTap() {
    if (this.state === 'splash') this.start();
    else if (this.state === 'gameover') this.restart();
  }

  /** Pointer down — menu taps, or jump while playing (touch + mouse). */
  handlePointerDown() {
    if (this.state === 'splash' || this.state === 'gameover') {
      this.handleTap();
      return;
    }
    if (this.state !== 'playing') return;
    const p = this.player;
    if (p.grounded && !p.ducking) {
      p.vy = JUMP_FORCE;
      p.grounded = false;
      p.jumping = true;
      p.jumpHeld = true;
      p.jumpHeldFrames = 0;
      this.sound.jump();
    } else if (!p.grounded) {
      p.jumpHeld = true;
    }
  }

  handlePointerUp() {
    this.player.jumpHeld = false;
    this.player.ducking = false;
  }

  private restart() {
    this.state = 'playing';
    this.commits = 0;
    this.energy = 100;
    this.speed = BASE_SPEED;
    this.distance = 0;
    this.themeIndex = 0;
    this.prevThemeIndex = 0;
    this.themeAlpha = 1;
    this.rocketActive = false;
    this.rocketTimer = 0;
    this.obstacles = [];
    this.powerUps = [];
    this.particles = [];
    this.bgScrollX = [0, 0, 0, 0];
    this.obstacleTimer = 1200;
    this.powerUpTimer = 4000;
    this.notifTimer = 2000;
    this.bugHits = 0;
    this.coffees = 0;
    this.stars = 0;
    this.damageFreePeriod = 0;
    this.screenShake = { x: 0, y: 0, timer: 0 };
    this.player = {
      y: GROUND_Y - PLAYER_H, vy: 0, grounded: true,
      jumping: false,
      jumpHeld: false, jumpHeldFrames: 0,
      ducking: false, animFrame: 0, animTimer: 0,
      hitTimer: 0, bobPhase: 0,
      state: 'run',
    };
    this.sound.startMusic();
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    this.sound.destroy();
  }
}

// ─── Notification / Achievement overlay components ────────────────────────────
function NotifBanner({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-xl text-xs text-white backdrop-blur-sm"
      style={{
        background: 'rgba(15,7,40,0.82)',
        border: '1px solid rgba(167,139,250,0.3)',
        animation: 'hr-notif-in 0.3s ease-out',
      }}
    >
      <span className="text-base">🏃</span>
      <span className="font-medium">{text}</span>
    </div>
  );
}

function AchievBanner({ title, desc, onDone }: { title: string; desc: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white backdrop-blur-sm"
      style={{
        background: 'rgba(30,5,60,0.9)',
        border: '1px solid rgba(251,191,36,0.4)',
        animation: 'hr-notif-in 0.35s ease-out',
        maxWidth: 220,
      }}
    >
      <span className="text-2xl">🏆</span>
      <div>
        <div className="text-xs font-bold text-amber-400 uppercase tracking-wide">Achievement Unlocked</div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-white/60">{desc}</div>
      </div>
    </div>
  );
}

// ─── Main React Component ─────────────────────────────────────────────────────
export default function HackathonRush({ windowId: _windowId, onClose: _onClose }: AppWindowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [achievs, setAchievs] = useState<AchievementItem[]>([]);
  const [showTouchHint, setShowTouchHint] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartY = useRef(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CW;
    canvas.height = CH;

    const engine = new GameEngine();
    engineRef.current = engine;
    engine.init(
      canvas,
      (n) => setNotifs((prev) => [...prev.slice(-2), n]),
      (a) => setAchievs((prev) => [...prev.slice(-2), a]),
    );

    return () => { engine.destroy(); engineRef.current = null; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      if (['Space', 'ArrowDown', 'KeyP', 'Enter', 'NumpadEnter'].includes(e.code)) {
        e.preventDefault();
        engineRef.current.handleKey(e.code, e.type === 'keydown');
      }
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('keyup', handler);
    };
  }, []);

  const dismissNotif = (id: number) => setNotifs((p) => p.filter((n) => n.id !== id));
  const dismissAchiev = (id: string) => setAchievs((p) => p.filter((a) => a.id !== id));

  return (
    <>
      <style>{`
        @keyframes hr-notif-in {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div className="relative w-full h-full bg-black overflow-hidden select-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ imageRendering: 'pixelated', display: 'block', transform: 'translateZ(0)', willChange: 'transform', touchAction: 'none', cursor: 'pointer' }}
          onPointerDown={(e) => {
            e.preventDefault();
            setShowTouchHint(false);
            touchStartY.current = e.clientY;
            engineRef.current?.handlePointerDown();
          }}
          onPointerMove={(e) => {
            if (e.buttons === 0) return;
            e.preventDefault();
            const dy = e.clientY - touchStartY.current;
            if (dy > 30) engineRef.current?.handleKey('ArrowDown', true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            engineRef.current?.handlePointerUp();
            engineRef.current?.handleKey('ArrowDown', false);
          }}
          onPointerLeave={(e) => {
            engineRef.current?.handlePointerUp();
            engineRef.current?.handleKey('ArrowDown', false);
          }}
        />
        {/* Mobile touch hint — shown on splash screen until first tap */}
        {isMobile && showTouchHint && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
            <div className="px-4 py-2 rounded-full text-xs text-white/70 font-mono whitespace-nowrap" style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.12)' }}>
              Tap anywhere or Enter to start · Hold = high jump · ↓ = duck
            </div>
          </div>
        )}
        {/* macOS-style notification banners (top right) */}
        <div className="absolute top-12 right-3 flex flex-col gap-2 pointer-events-none z-20">
          {notifs.map((n) => (
            <NotifBanner key={n.id} text={n.text} onDone={() => dismissNotif(n.id)} />
          ))}
        </div>
        {/* Achievement banners (bottom right) */}
        <div className="absolute bottom-4 right-3 flex flex-col gap-2 pointer-events-none z-20">
          {achievs.map((a) => (
            <AchievBanner key={a.id} title={a.title} desc={a.desc} onDone={() => dismissAchiev(a.id)} />
          ))}
        </div>
      </div>
    </>
  );
}
