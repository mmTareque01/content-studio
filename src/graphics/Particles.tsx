import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {rand} from './theme';

// Emoji particles exploding from a point or raining from the top. Coordinates are px in the 1080x1920 frame.
export const EmojiBurst: React.FC<{emoji: string[]; count: number; mode: 'explode' | 'rain'; x?: number; y?: number; seed?: number}> = ({
	emoji,
	count,
	mode,
	x = 540,
	y = 900,
	seed = 1,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
			{Array.from({length: count}, (_, i) => {
				const r = (k: number) => rand(seed * 100 + i * 7 + k);
				const size = 60 + r(1) * 90;
				let px: number;
				let py: number;
				let rot: number;
				let opacity = 1;
				if (mode === 'rain') {
					const delay = r(2) * 1.2;
					const tt = Math.max(0, t - delay);
					px = r(3) * 1080 + Math.sin(tt * 3 + i) * 40;
					py = -150 + tt * (700 + r(4) * 600);
					rot = (r(5) - 0.5) * 60 + tt * (r(6) - 0.5) * 300;
					opacity = t < delay ? 0 : 1;
				} else {
					const ang = r(2) * Math.PI * 2;
					const speed = 900 + r(3) * 1300;
					const tt = t;
					px = x + Math.cos(ang) * speed * tt * Math.exp(-tt * 1.4);
					py = y + Math.sin(ang) * speed * tt * Math.exp(-tt * 1.4) + 900 * tt * tt;
					rot = (r(4) - 0.5) * 720 * tt;
					opacity = Math.max(0, 1 - tt / 1.8);
				}
				const pop = Math.min(1, frame / 6);
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: px,
							top: py,
							fontSize: size,
							opacity,
							transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${pop})`,
							filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))',
						}}
					>
						{emoji[i % emoji.length]}
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

// Twinkling 4-point stars scattered around a box.
export const Sparkles: React.FC<{color: string; count?: number; spread?: number; seed?: number}> = ({color, count = 10, spread = 1, seed = 3}) => {
	const frame = useCurrentFrame();
	return (
		<div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
			{Array.from({length: count}, (_, i) => {
				const r = (k: number) => rand(seed * 50 + i * 11 + k);
				const phase = r(1) * 40;
				const tw = Math.max(0, Math.sin((frame + phase) / 7));
				const s = (18 + r(2) * 26) * tw;
				return (
					<svg
						key={i}
						width={s}
						height={s}
						viewBox="0 0 10 10"
						style={{
							position: 'absolute',
							left: `${50 + (r(3) - 0.5) * 120 * spread}%`,
							top: `${50 + (r(4) - 0.5) * 120 * spread}%`,
							transform: `translate(-50%,-50%) rotate(${frame * 2}deg)`,
							filter: `drop-shadow(0 0 6px ${color})`,
						}}
					>
						<path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" fill="#fff" />
					</svg>
				);
			})}
		</div>
	);
};

// Rotating sunburst behind a hero element.
export const Rays: React.FC<{color: string; size: number; opacity?: number}> = ({color, size, opacity = 0.5}) => {
	const frame = useCurrentFrame();
	return (
		<div
			style={{
				position: 'absolute',
				left: '50%',
				top: '50%',
				width: size,
				height: size,
				transform: `translate(-50%,-50%) rotate(${frame * 0.8}deg)`,
				background: `repeating-conic-gradient(${color} 0deg 8deg, transparent 8deg 22deg)`,
				maskImage: 'radial-gradient(circle, black 15%, transparent 68%)',
				WebkitMaskImage: 'radial-gradient(circle, black 15%, transparent 68%)',
				opacity,
				pointerEvents: 'none',
			}}
		/>
	);
};
