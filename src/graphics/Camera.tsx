import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Cue} from '../types';
import {SPRING, rand} from './theme';

type Shot = {scale: number; x: number; y: number};

const SHAKERS = new Set(['hook', 'sticker']);

// Where the camera wants to be once `cue` has started.
const target = (c: Cue, i: number, punch: boolean): Shot => {
	if (c.type === 'zoom') return {scale: c.scale ?? 1.35, x: c.x ?? 50, y: c.y ?? 45};
	// A new scene settles the camera wide; the scene does its own slow Ken Burns move.
	if (c.type === 'scene') return {scale: 1, x: 50, y: 38};
	// Alternate tight/wide on every cue: the classic jump-cut punch-in.
	return {scale: punch && i % 2 === 0 ? 1.1 : 1, x: 50, y: 38};
};

const shotAt = (cues: Cue[], frame: number, fps: number, punch: boolean): Shot => {
	let s: Shot = {scale: 1, x: 50, y: 38};
	cues.forEach((c, i) => {
		const start = Math.round(c.from * fps);
		if (frame < start) return;
		const tgt = target(c, i, punch);
		const p = spring({frame: frame - start, fps, config: c.type === 'zoom' ? {damping: 30, stiffness: 60} : SPRING.slam});
		s = {scale: s.scale + (tgt.scale - s.scale) * p, x: s.x + (tgt.x - s.x) * p, y: s.y + (tgt.y - s.y) * p};
		// A zoom cue returns to wide when it ends.
		if (c.type === 'zoom') {
			const end = Math.round(c.to * fps);
			if (frame >= end) {
				const q = spring({frame: frame - end, fps, config: SPRING.soft});
				s = {scale: s.scale + (1 - s.scale) * q, x: s.x + (50 - s.x) * q, y: s.y + (38 - s.y) * q};
			}
		}
	});
	return s;
};

// Decaying camera hit after impact cues.
const shakeAt = (cues: Cue[], frame: number, fps: number) => {
	let dx = 0;
	let dy = 0;
	let rot = 0;
	for (const c of cues) {
		if (!(c.shake || SHAKERS.has(c.type))) continue;
		const f = frame - Math.round(c.from * fps);
		if (f < 0 || f > 14) continue;
		const k = (1 - f / 14) ** 2;
		dx += (rand(frame * 3.1) - 0.5) * 50 * k;
		dy += (rand(frame * 7.7) - 0.5) * 50 * k;
		rot += (rand(frame * 1.3) - 0.5) * 3 * k;
	}
	return {dx, dy, rot};
};

export const Camera: React.FC<{cues: Cue[]; punch: boolean; intensity?: number; children: React.ReactNode}> = ({
	cues,
	punch,
	intensity = 1,
	children,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const now = shotAt(cues, frame, fps, punch);
	const prev = shotAt(cues, frame - 1, fps, punch);
	const {dx, dy, rot} = shakeAt(cues, frame, fps);

	// Handheld drift so the frame is never dead-still.
	const driftX = (Math.sin(t * 0.7) * 7 + Math.sin(t * 1.9) * 3) * intensity;
	const driftY = (Math.cos(t * 0.6) * 6 + Math.sin(t * 1.4) * 2) * intensity;
	const driftR = Math.sin(t * 0.45) * 0.35 * intensity;

	const scale = 1 + (now.scale - 1) * intensity + 0.03 * intensity; // headroom so drift never shows edges
	const blur = Math.min(10, Math.abs(now.scale - prev.scale) * 260 * intensity);

	return (
		<AbsoluteFill
			style={{
				transformOrigin: `${now.x}% ${now.y}%`,
				transform: `translate(${driftX + dx * intensity}px, ${driftY + dy * intensity}px) rotate(${driftR + rot * intensity}deg) scale(${scale})`,
				filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};
