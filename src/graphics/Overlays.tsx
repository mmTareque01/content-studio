import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Cue} from '../types';
import {clamp} from './theme';

// Frames since the most recent cue start (Infinity if none yet).
const sinceCue = (cues: Cue[], frame: number, fps: number) => {
	let best = Infinity;
	for (const c of cues) {
		const f = frame - Math.round(c.from * fps);
		if (f >= 0 && f < best) best = f;
	}
	return best;
};

export const Film: React.FC<{cues: Cue[]; accent: string; accent2: string}> = ({cues, accent, accent2}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const since = sinceCue(cues, frame, fps);
	const flash = interpolate(since, [0, 1, 7], [0.0, 0.32, 0], clamp);
	const leak = 0.1 + interpolate(since, [0, 4, 30], [0, 0.5, 0], clamp);

	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{/* Light leaks: drift constantly, flare on every cue */}
			<AbsoluteFill style={{mixBlendMode: 'screen', opacity: leak}}>
				<div
					style={{
						position: 'absolute',
						width: 1400,
						height: 1400,
						left: -500 + Math.sin(t * 0.4) * 160,
						top: -400 + Math.cos(t * 0.3) * 200,
						background: `radial-gradient(circle, ${accent} 0%, transparent 60%)`,
						filter: 'blur(40px)',
					}}
				/>
				<div
					style={{
						position: 'absolute',
						width: 1200,
						height: 1200,
						right: -560 + Math.cos(t * 0.35) * 180,
						bottom: -300 + Math.sin(t * 0.5) * 220,
						background: `radial-gradient(circle, ${accent2} 0%, #ff4d2e 25%, transparent 60%)`,
						filter: 'blur(40px)',
					}}
				/>
			</AbsoluteFill>
			{/* Cut flash */}
			<AbsoluteFill style={{background: '#fff', opacity: flash}} />
			{/* Vignette */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 75% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />
			{/* Grain */}
			<AbsoluteFill style={{opacity: 0.13, mixBlendMode: 'overlay'}}>
				<svg width="100%" height="100%">
					<filter id="grain">
						<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 12} stitchTiles="stitch" />
						<feColorMatrix type="saturate" values="0" />
					</filter>
					<rect width="100%" height="100%" filter="url(#grain)" />
				</svg>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

export const ProgressBar: React.FC<{accent: string; accent2: string}> = ({accent, accent2}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const p = frame / Math.max(1, durationInFrames - 1);
	return (
		<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 12, background: 'rgba(255,255,255,0.15)'}}>
			<div
				style={{
					width: `${p * 100}%`,
					height: '100%',
					background: `linear-gradient(90deg, ${accent}, ${accent2})`,
					boxShadow: `0 0 24px ${accent}, 0 0 8px ${accent2}`,
					borderRadius: '0 8px 8px 0',
				}}
			/>
		</div>
	);
};
