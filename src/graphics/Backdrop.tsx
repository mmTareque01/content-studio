import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {rand} from './theme';

// Default animated "studio" environment: drifting glow orbs, light beams, floating dust over a perspective grid.
export const Backdrop: React.FC<{accent: string; accent2: string}> = ({accent, accent2}) => {
	const frame = useCurrentFrame();
	const t = frame / 30;
	const orb = (x: number, y: number, size: number, color: string, speed: number, phase: number) => (
		<div
			style={{
				position: 'absolute',
				left: `${x + Math.sin(t * speed + phase) * 12}%`,
				top: `${y + Math.cos(t * speed * 0.8 + phase) * 8}%`,
				width: size,
				height: size,
				borderRadius: '50%',
				background: color,
				filter: 'blur(120px)',
				opacity: 0.55,
				transform: 'translate(-50%, -50%)',
			}}
		/>
	);

	return (
		<AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 0%, #1a1433 0%, #07060d 70%)', overflow: 'hidden'}}>
			{orb(20, 20, 700, accent, 0.35, 0)}
			{orb(85, 35, 600, '#00d4ff', 0.28, 2)}
			{orb(50, 80, 800, '#ff3d8b', 0.22, 4)}
			{/* Sweeping stage beams */}
			{[0, 1, 2].map((i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: '50%',
						top: -200,
						width: 260,
						height: 2600,
						transformOrigin: '50% 0%',
						transform: `translateX(-50%) rotate(${(i - 1) * 28 + Math.sin(t * 0.6 + i * 2) * 14}deg)`,
						background: `linear-gradient(to bottom, ${i === 1 ? accent2 : accent}55, transparent 70%)`,
						filter: 'blur(30px)',
						mixBlendMode: 'screen',
					}}
				/>
			))}
			{/* Floating dust */}
			{Array.from({length: 40}, (_, i) => {
				const y = (((rand(i * 3) * 1920 - t * (20 + rand(i * 5) * 50)) % 1920) + 1920) % 1920;
				const s = 3 + rand(i * 7) * 7;
				return (
					<div
						key={`d${i}`}
						style={{
							position: 'absolute',
							left: rand(i * 11) * 1080 + Math.sin(t + i) * 20,
							top: y,
							width: s,
							height: s,
							borderRadius: '50%',
							background: '#fff',
							opacity: 0.25 + 0.35 * Math.abs(Math.sin(t * 1.5 + i)),
							boxShadow: `0 0 ${s * 3}px ${accent2}`,
						}}
					/>
				);
			})}
			<div
				style={{
					position: 'absolute',
					left: '-50%',
					right: '-50%',
					bottom: '-10%',
					height: '60%',
					backgroundImage: `linear-gradient(${accent}33 2px, transparent 2px), linear-gradient(90deg, ${accent}33 2px, transparent 2px)`,
					backgroundSize: '90px 90px',
					backgroundPosition: `0 ${(t * 40) % 90}px`,
					transform: 'perspective(600px) rotateX(62deg)',
					maskImage: 'linear-gradient(to top, black 30%, transparent)',
				}}
			/>
		</AbsoluteFill>
	);
};
