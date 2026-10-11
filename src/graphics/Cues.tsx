import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Cue} from '../types';
import {EmojiBurst, Rays, Sparkles} from './Particles';
import {DISPLAY, FONT, clamp, useEnter} from './theme';

type C<T extends Cue['type']> = Extract<Cue, {type: T}>;
type Colors = {accent: string; accent2: string};

// Cues drawn over the whole frame (above the cutout person) instead of as a card in the upper area.
export const OVERLAY_TYPES = new Set<Cue['type']>(['burst', 'pointer', 'sticker']);

const stroke = (px: number): React.CSSProperties => ({WebkitTextStroke: `${px}px rgba(0,0,0,0.9)`, paintOrder: 'stroke fill'});
const gradText = (a: string, b: string): React.CSSProperties => ({
	background: `linear-gradient(180deg, ${b} 0%, ${a} 100%)`,
	WebkitBackgroundClip: 'text',
	backgroundClip: 'text',
	color: 'transparent',
});

const bare = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// Frame (relative to cue start) at which list item i appears: when spoken if `at` is given, else staggered.
const itemDelay = (cue: Cue, i: number, fps: number) => {
	const at = 'at' in cue ? cue.at : undefined;
	return at?.[i] !== undefined ? Math.round((at[i] - cue.from) * fps) : 8 + i * 9;
};

// ---------- building blocks ----------

// Glass panel with a rotating gradient rim and a one-time shine sweep.
const Card: React.FC<Colors & {children: React.ReactNode; pad?: string | number; style?: React.CSSProperties}> = ({accent, accent2, children, pad, style}) => {
	const frame = useCurrentFrame();
	const shine = interpolate(frame, [8, 30], [-60, 160], clamp);
	return (
		<div
			style={{
				position: 'relative',
				borderRadius: 44,
				background: 'var(--glass, rgba(14,10,30,0.5))',
				backdropFilter: 'blur(30px)',
				boxShadow: `0 30px 90px rgba(0,0,0,0.5), 0 0 70px ${accent}40`,
				color: '#fff',
				padding: pad ?? '44px 52px',
				overflow: 'hidden',
				...style,
			}}
		>
			{children}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: 44,
					padding: 4,
					background: `conic-gradient(from ${frame * 4}deg, ${accent}, ${accent2}, rgba(255,255,255,0.15) 35%, ${accent} 65%, rgba(255,255,255,0.15) 85%, ${accent})`,
					WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
					WebkitMaskComposite: 'xor',
					maskComposite: 'exclude',
					pointerEvents: 'none',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: -100,
					bottom: -100,
					left: `${shine}%`,
					width: '28%',
					background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
					transform: 'skewX(-20deg)',
					pointerEvents: 'none',
				}}
			/>
		</div>
	);
};

// One word dropping in with a 3D flip.
const DropWord: React.FC<{w: string; delay: number; style?: React.CSSProperties}> = ({w, delay, style}) => {
	const p = useEnter(delay, 'snappy');
	return (
		<span
			style={{
				display: 'inline-block',
				margin: '0 0.14em',
				opacity: Math.min(1, p * 1.5),
				transform: `perspective(800px) translateY(${(1 - p) * 60}px) rotateX(${(1 - p) * -90}deg)`,
				transformOrigin: '50% 100%',
				...style,
			}}
		>
			{w}
		</span>
	);
};

const Typewriter: React.FC<{text: string; delay: number; cps?: number; style?: React.CSSProperties}> = ({text, delay, cps = 40, style}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const chars = [...text];
	const n = Math.max(0, Math.floor(((frame - delay) / fps) * cps));
	const done = n >= chars.length;
	const caret = !done && frame >= delay && Math.floor(frame / 8) % 2 === 0;
	return (
		<div style={style}>
			{chars.slice(0, n).join('')}
			<span style={{opacity: caret ? 1 : 0}}>▍</span>
		</div>
	);
};

const Check: React.FC<{p: number; color: string}> = ({p, color}) => (
	<svg width={64} height={64} viewBox="0 0 64 64" style={{flex: 'none', transform: `scale(${0.6 + 0.4 * Math.min(p, 1.2)})`}}>
		<rect x={2} y={2} width={60} height={60} rx={18} fill={color} />
		<path d="M17 33 L28 44 L48 22" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, p)} />
	</svg>
);

const Star: React.FC<{fill: number; p: number; color: string}> = ({fill, p, color}) => {
	const d = 'M12 1.5l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.6 5.6 21.1 7 14l-5.3-5 7.2-.9z';
	return (
		<div style={{position: 'relative', width: 66, height: 66, transform: `scale(${p})`}}>
			<svg viewBox="0 0 24 24" width={66} height={66} style={{position: 'absolute'}}>
				<path d={d} fill="rgba(255,255,255,0.18)" />
			</svg>
			<div style={{position: 'absolute', inset: 0, width: `${fill * 100}%`, overflow: 'hidden'}}>
				<svg viewBox="0 0 24 24" width={66} height={66} style={{filter: `drop-shadow(0 0 10px ${color})`}}>
					<path d={d} fill={color} />
				</svg>
			</div>
		</div>
	);
};

// ---------- card cues ----------

const Title: React.FC<{cue: C<'title'>} & Colors> = ({cue, accent, accent2}) => (
	<Card accent={accent} accent2={accent2} style={{textAlign: 'center'}}>
		<div style={{fontSize: 96, fontWeight: 900, lineHeight: 1.08, letterSpacing: -2}}>
			{cue.text.split(' ').map((w, i) => (
				<DropWord key={i} w={w} delay={2 + i * 3} />
			))}
		</div>
		{cue.sub ? <Typewriter text={cue.sub} delay={6 + cue.text.split(' ').length * 3} style={{fontSize: 48, marginTop: 22, color: accent2, fontWeight: 800}} /> : null}
	</Card>
);

const ListItem: React.FC<{cue: C<'bullets' | 'steps'>; i: number; text: string; active: boolean} & Colors> = ({cue, i, text, active, accent, accent2}) => {
	const {fps} = useVideoConfig();
	const p = useEnter(itemDelay(cue, i, fps), 'snappy');
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 26,
				fontSize: 50,
				fontWeight: 700,
				margin: '12px -18px',
				padding: '10px 18px',
				borderRadius: 24,
				opacity: Math.min(1, p) * (active ? 1 : 0.72),
				transform: `translateX(${(1 - p) * -120}px) scale(${active ? 1.03 : 1})`,
				background: active ? `linear-gradient(90deg, ${accent}55, transparent)` : 'transparent',
			}}
		>
			{cue.type === 'steps' ? (
				<span
					style={{
						flex: 'none',
						width: 64,
						height: 64,
						borderRadius: 18,
						background: `linear-gradient(135deg, ${accent2}, ${accent})`,
						display: 'grid',
						placeItems: 'center',
						fontSize: 36,
						fontWeight: 900,
						color: '#111',
						transform: `scale(${Math.min(p, 1.3)}) rotate(${(1 - p) * -180}deg)`,
					}}
				>
					{i + 1}
				</span>
			) : (
				<Check p={p} color={accent} />
			)}
			{text}
		</div>
	);
};

const List: React.FC<{cue: C<'bullets' | 'steps'>} & Colors> = ({cue, ...colors}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const shown = cue.items.filter((_, i) => frame >= itemDelay(cue, i, fps)).length;
	return (
		<Card {...colors}>
			{cue.type === 'bullets' && cue.title ? <div style={{fontSize: 60, fontWeight: 900, marginBottom: 18, ...gradText(colors.accent, '#fff')}}>{cue.title}</div> : null}
			{cue.items.map((it, i) => (
				<ListItem key={i} cue={cue} i={i} text={it} active={i === shown - 1} {...colors} />
			))}
		</Card>
	);
};

const Stat: React.FC<{cue: C<'stat'>} & Colors> = ({cue, accent, accent2}) => {
	const frame = useCurrentFrame();
	const n = interpolate(frame, [0, 36], [0, cue.value], {...clamp, easing: Easing.out(Easing.cubic)});
	const shown = Number.isInteger(cue.value) ? Math.round(n).toLocaleString() : n.toFixed(1);
	const land = useEnter(36, 'bouncy');
	const ring = cue.suffix === '%' && cue.value <= 100;
	const R = 150;
	const C = 2 * Math.PI * R;
	return (
		<Card accent={accent} accent2={accent2} style={{textAlign: 'center'}}>
			<div style={{position: 'relative', display: 'grid', placeItems: 'center', height: ring ? 360 : 230}}>
				{ring ? (
					<svg width={360} height={360} style={{position: 'absolute', transform: 'rotate(-90deg)'}}>
						<circle cx={180} cy={180} r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={22} />
						<circle cx={180} cy={180} r={R} fill="none" stroke={accent} strokeWidth={22} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - n / 100)} style={{filter: `drop-shadow(0 0 14px ${accent})`}} />
					</svg>
				) : null}
				<div style={{fontSize: ring ? 130 : 200, fontWeight: 900, lineHeight: 1, letterSpacing: -4, transform: `scale(${1 + Math.sin(Math.min(1, land) * Math.PI) * 0.14})`, ...gradText(accent, accent2)}}>
					{cue.prefix ?? ''}
					{shown}
					{cue.suffix ?? ''}
				</div>
				{frame > 36 ? <Sparkles color={accent2} count={8} spread={0.7} /> : null}
			</div>
			<div style={{fontSize: 50, fontWeight: 700, marginTop: 14}}>{cue.label}</div>
		</Card>
	);
};

const Icon: React.FC<{cue: C<'icon'>} & Colors> = ({cue, accent, accent2}) => {
	const frame = useCurrentFrame();
	const pop = useEnter(0, 'bouncy');
	const label = useEnter(8, 'snappy');
	const wiggle = Math.sin(frame / 5) * 8 * Math.exp(-frame / 30);
	const bob = Math.sin(frame / 9) * 12;
	return (
		<div style={{textAlign: 'center', color: '#fff', position: 'relative'}}>
			<div style={{position: 'relative', height: 360}}>
				<Rays color={accent} size={900} opacity={0.45 * pop} />
				<Sparkles color={accent2} count={12} spread={0.9} />
				<div style={{fontSize: 280, lineHeight: '360px', transform: `translateY(${bob}px) scale(${pop}) rotate(${wiggle}deg)`, filter: `drop-shadow(0 0 60px ${accent})`}}>{cue.emoji}</div>
			</div>
			<div
				style={{
					display: 'inline-block',
					fontSize: 62,
					fontWeight: 900,
					marginTop: 6,
					padding: '16px 40px',
					borderRadius: 999,
					background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
					boxShadow: `0 16px 50px ${accent}88`,
					opacity: Math.min(1, label),
					transform: `translateY(${(1 - label) * 60}px) scale(${0.7 + 0.3 * label}) rotate(-2deg)`,
				}}
			>
				{cue.label}
			</div>
		</div>
	);
};

const Picture: React.FC<{cue: C<'image'>} & Colors> = ({cue, accent, accent2}) => {
	const frame = useCurrentFrame();
	const p = useEnter(0, 'bouncy');
	const zoom = interpolate(frame, [0, 150], [1.15, 1], clamp);
	return (
		<div style={{transform: `rotate(${-10 + p * 7}deg) scale(${0.6 + p * 0.4})`}}>
			<Card accent={accent} accent2={accent2} pad={18} style={{background: '#fff'}}>
				<div style={{borderRadius: 28, overflow: 'hidden', height: 580}}>
					<Img src={staticFile(cue.src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`}} />
				</div>
				{cue.caption ? <div style={{fontSize: 46, fontWeight: 900, textAlign: 'center', padding: '20px 0 6px', color: '#111'}}>{cue.caption}</div> : null}
			</Card>
		</div>
	);
};

const Compare: React.FC<{cue: C<'compare'>} & Colors> = ({cue, accent, accent2}) => {
	const {fps} = useVideoConfig();
	const l = useEnter(0, 'snappy');
	const r = useEnter(6, 'snappy');
	const vs = useEnter(12, 'bouncy');
	return (
		<div style={{position: 'relative', display: 'flex', gap: 28}}>
			{[cue.left, cue.right].map((side, s) => {
				const p = s ? r : l;
				return (
					<div key={s} style={{flex: 1, transform: `translateX(${(1 - p) * (s ? 500 : -500)}px) rotate(${(1 - p) * (s ? 8 : -8)}deg)`}}>
						<Card accent={s ? accent : '#ff4d6d'} accent2={s ? accent2 : '#ff4d6d'} pad="36px 34px" style={{height: '100%'}}>
							<div style={{fontSize: 54, fontWeight: 900, marginBottom: 12, color: s ? accent2 : '#ff6b8b'}}>{side.title}</div>
							{side.items.map((it, i) => (
								<CompareItem key={i} delay={itemDelay(cue, i + s * side.items.length, fps)} good={!!s} text={it} />
							))}
						</Card>
					</div>
				);
			})}
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: '50%',
					width: 120,
					height: 120,
					borderRadius: '50%',
					background: `linear-gradient(135deg, ${accent2}, ${accent})`,
					display: 'grid',
					placeItems: 'center',
					fontFamily: DISPLAY,
					fontSize: 58,
					color: '#111',
					boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
					border: '6px solid #fff',
					transform: `translate(-50%,-50%) scale(${vs}) rotate(${(1 - vs) * 200}deg)`,
				}}
			>
				VS
			</div>
		</div>
	);
};

const CompareItem: React.FC<{delay: number; good: boolean; text: string}> = ({delay, good, text}) => {
	const p = useEnter(delay, 'snappy');
	return <div style={{fontSize: 40, fontWeight: 700, margin: '14px 0', opacity: Math.min(1, p), transform: `translateY(${(1 - p) * 30}px)`}}>{good ? '✅ ' : '❌ '}{text}</div>;
};

const Hook: React.FC<{cue: C<'hook'>} & Colors> = ({cue, accent, accent2}) => {
	const marks = new Set((cue.highlight ?? []).map(bare));
	return (
		<div style={{textAlign: 'center', fontFamily: DISPLAY, textTransform: 'uppercase', lineHeight: 1.02}}>
			{cue.text.split(' ').map((w, i) => (
				<HookWord key={i} w={w} i={i} hot={marks.has(bare(w))} accent={accent} accent2={accent2} />
			))}
		</div>
	);
};

const HookWord: React.FC<{w: string; i: number; hot: boolean} & Colors> = ({w, i, hot, accent2}) => {
	const p = useEnter(i * 4, 'slam');
	const frame = useCurrentFrame();
	const blur = Math.max(0, (1 - p) * 16);
	return (
		<span
			style={{
				display: 'inline-block',
				margin: '0 14px',
				fontSize: 168,
				color: hot ? '#111' : '#fff',
				background: hot ? accent2 : 'transparent',
				padding: hot ? '0 22px' : 0,
				borderRadius: 14,
				...(hot ? {} : stroke(14)),
				textShadow: hot ? 'none' : '0 12px 40px rgba(0,0,0,0.6)',
				boxShadow: hot ? `0 14px 50px ${accent2}88` : 'none',
				opacity: frame < i * 4 ? 0 : 1,
				transform: `scale(${1 + (1 - p) * 1.8}) rotate(${hot ? -3 : 0}deg)`,
				filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
			}}
		>
			{w}
		</span>
	);
};

const Rating: React.FC<{cue: C<'rating'>} & Colors> = ({cue, accent, accent2}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<Card accent={accent} accent2={accent2}>
			{cue.title ? <div style={{fontSize: 58, fontWeight: 900, marginBottom: 18}}>{cue.title}</div> : null}
			{cue.items.map((it, i) => {
				const d = itemDelay(cue, i, fps);
				return (
					<div key={i} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0', opacity: frame >= d ? 1 : 0}}>
						<div style={{fontSize: 46, fontWeight: 800}}>{it.label}</div>
						<div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
							{[0, 1, 2, 3, 4].map((s) => (
								<StarSlot key={s} delay={d + s * 3} fill={Math.max(0, Math.min(1, it.value - s))} color={accent2} />
							))}
							<div style={{fontSize: 46, fontWeight: 900, width: 90, textAlign: 'right', color: accent2}}>{it.value}</div>
						</div>
					</div>
				);
			})}
		</Card>
	);
};

const StarSlot: React.FC<{delay: number; fill: number; color: string}> = ({delay, fill, color}) => <Star fill={fill} p={useEnter(delay, 'bouncy')} color={color} />;

const Bars: React.FC<{cue: C<'bars'>} & Colors> = ({cue, accent, accent2}) => {
	const max = Math.max(...cue.items.map((it) => it.value), 1);
	return (
		<Card accent={accent} accent2={accent2}>
			{cue.title ? <div style={{fontSize: 58, fontWeight: 900, marginBottom: 20}}>{cue.title}</div> : null}
			{cue.items.map((it, i) => (
				<Bar key={i} i={i} label={it.label} value={it.value} max={max} suffix={cue.suffix} top={it.value === max} accent={accent} accent2={accent2} />
			))}
		</Card>
	);
};

const Bar: React.FC<{i: number; label: string; value: number; max: number; suffix?: string; top: boolean} & Colors> = ({i, label, value, max, suffix, top, accent, accent2}) => {
	const p = useEnter(6 + i * 7, 'soft');
	const v = value * Math.min(1, p);
	return (
		<div style={{margin: '18px 0'}}>
			<div style={{display: 'flex', justifyContent: 'space-between', fontSize: 42, fontWeight: 800, marginBottom: 8}}>
				<span>{label}</span>
				<span style={{color: top ? accent2 : '#fff'}}>
					{Number.isInteger(value) ? Math.round(v) : v.toFixed(1)}
					{suffix ?? ''}
				</span>
			</div>
			<div style={{height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.12)', overflow: 'hidden'}}>
				<div
					style={{
						height: '100%',
						width: `${(v / max) * 100}%`,
						borderRadius: 18,
						background: top ? `linear-gradient(90deg, ${accent}, ${accent2})` : 'rgba(255,255,255,0.55)',
						boxShadow: top ? `0 0 24px ${accent}` : 'none',
					}}
				/>
			</div>
		</div>
	);
};

const Cta: React.FC<{cue: C<'cta'>} & Colors> = ({cue, accent, accent2}) => {
	const frame = useCurrentFrame();
	const card = useEnter(0, 'snappy');
	const CLICK = 26;
	const cursor = interpolate(frame, [6, CLICK - 2], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const press = frame >= CLICK && frame < CLICK + 5 ? 0.9 : 1;
	const done = frame >= CLICK;
	const pulse = done ? 1 + Math.sin((frame - CLICK) / 5) * 0.03 : 1;
	return (
		<div style={{position: 'relative', textAlign: 'center', transform: `scale(${0.7 + 0.3 * card})`, opacity: Math.min(1, card)}}>
			<div style={{fontSize: 74, fontWeight: 900, color: '#fff', ...stroke(10), textShadow: '0 10px 40px rgba(0,0,0,0.6)', marginBottom: 30}}>{cue.text}</div>
			<div style={{position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 26, padding: '20px 26px 20px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.95)', boxShadow: `0 20px 60px rgba(0,0,0,0.45), 0 0 60px ${accent}66`}}>
				<div style={{width: 96, height: 96, borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accent2})`, display: 'grid', placeItems: 'center', fontSize: 52}}>🙂</div>
				<div style={{fontSize: 44, fontWeight: 900, color: '#111'}}>{cue.handle ?? '@you'}</div>
				<div
					style={{
						fontSize: 42,
						fontWeight: 900,
						color: '#fff',
						padding: '18px 40px',
						borderRadius: 999,
						background: done ? '#222' : `linear-gradient(135deg, ${accent}, ${accent}dd)`,
						transform: `scale(${press * pulse})`,
					}}
				>
					{done ? 'Following ✓' : 'Follow'}
				</div>
				{/* cursor */}
				<div style={{position: 'absolute', right: 70 - (1 - cursor) * 260, top: 70 + (1 - cursor) * 320, fontSize: 90, transform: `scale(${press})`, opacity: interpolate(frame, [CLICK + 6, CLICK + 12], [1, 0], clamp), filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))'}}>👆</div>
			</div>
			<Sequence from={CLICK} layout="none">
				<div style={{position: 'absolute', inset: '-400px -200px'}}>
					<EmojiBurst emoji={['❤️', '🔥', '✨']} count={14} mode="explode" x={740} y={560} seed={9} />
				</div>
			</Sequence>
		</div>
	);
};

const Location: React.FC<{cue: C<'location'>} & Colors> = ({cue, accent, accent2}) => {
	const drop = useEnter(0, 'bouncy');
	return (
		<Card accent={accent} accent2={accent2} pad="34px 44px">
			<div style={{display: 'flex', alignItems: 'center', gap: 30}}>
				<div style={{position: 'relative', width: 110, height: 130, flex: 'none'}}>
					<div style={{position: 'absolute', left: 25, bottom: 0, width: 60, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', transform: `scale(${drop})`}} />
					<div style={{position: 'absolute', left: 0, top: 0, fontSize: 110, lineHeight: 1, transform: `translateY(${(1 - drop) * -260}px)`}}>📍</div>
				</div>
				<div>
					<Typewriter text={cue.place} delay={8} cps={30} style={{fontSize: 64, fontWeight: 900, lineHeight: 1.1}} />
					{cue.sub ? <Typewriter text={cue.sub} delay={8 + Math.ceil((cue.place.length / 30) * 30)} cps={40} style={{fontSize: 40, fontWeight: 700, color: accent2, marginTop: 6}} /> : null}
				</div>
			</div>
		</Card>
	);
};

// ---------- overlay cues ----------

const Pointer: React.FC<{cue: C<'pointer'>} & Colors> = ({cue, accent, accent2}) => {
	const frame = useCurrentFrame();
	const draw = interpolate(frame, [2, 18], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
	const label = useEnter(14, 'bouncy');
	const x = (cue.x / 100) * 1080;
	const y = (cue.y / 100) * 1920;
	const size = cue.size ?? 240;
	const shape = cue.shape ?? 'circle';
	// Label sits above the target (or below if the target is near the top).
	const lx = Math.min(860, Math.max(220, x + (x < 540 ? 140 : -140)));
	const ly = cue.y < 30 ? y + size + 160 : y - size - 120;
	let d: string;
	if (shape === 'circle') {
		const pts: string[] = [];
		for (let a = 0; a <= Math.PI * 2.15; a += 0.08) {
			const r = 1 + 0.06 * Math.sin(a * 3 + 1);
			pts.push(`${x + Math.cos(a - 2) * (size / 2) * r * 1.15},${y + Math.sin(a - 2) * (size / 2) * r * 0.85}`);
		}
		d = `M${pts.join(' L')}`;
	} else {
		const ex = x + (lx - x) * 0.12;
		const ey = y + (ly - y) * 0.12;
		d = `M${lx},${ly + (ly < y ? 50 : -50)} Q${(lx + ex) / 2 + 120},${(ly + ey) / 2} ${ex},${ey}`;
	}
	const ang = shape === 'arrow' ? Math.atan2(y - ly, x - lx) : 0;
	const hx = x + (lx - x) * 0.12;
	const hy = y + (ly - y) * 0.12;
	return (
		<AbsoluteFill>
			<svg width={1080} height={1920} style={{position: 'absolute', overflow: 'visible', filter: `drop-shadow(0 0 12px ${accent}) drop-shadow(0 6px 10px rgba(0,0,0,0.5))`}}>
				<path d={d} fill="none" stroke={accent2} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
				{shape === 'arrow' && draw > 0.95 ? (
					<path
						d="M0 0 L-46 -26 M0 0 L-46 26"
						stroke={accent2}
						strokeWidth={14}
						strokeLinecap="round"
						transform={`translate(${hx},${hy}) rotate(${(ang * 180) / Math.PI})`}
					/>
				) : null}
			</svg>
			{cue.label ? (
				<div
					style={{
						position: 'absolute',
						left: lx,
						top: ly,
						transform: `translate(-50%,-50%) scale(${label}) rotate(-3deg)`,
						fontFamily: FONT,
						fontSize: 56,
						fontWeight: 900,
						color: '#111',
						background: accent2,
						padding: '14px 32px',
						borderRadius: 20,
						whiteSpace: 'nowrap',
						boxShadow: '0 14px 40px rgba(0,0,0,0.45)',
					}}
				>
					{cue.label}
				</div>
			) : null}
		</AbsoluteFill>
	);
};

const Sticker: React.FC<{cue: C<'sticker'>} & Colors> = ({cue, accent, accent2}) => {
	const frame = useCurrentFrame();
	const p = useEnter(0, 'slam');
	const rot = (cue.rotate ?? -8) + Math.sin(frame / 10) * 2;
	return (
		<div
			style={{
				position: 'absolute',
				left: `${cue.x ?? 70}%`,
				top: `${cue.y ?? 30}%`,
				transform: `translate(-50%,-50%) scale(${1 + (1 - p) * 2.2}) rotate(${rot}deg)`,
				opacity: frame < 1 ? 0 : 1,
				fontFamily: DISPLAY,
				fontSize: 118,
				textTransform: 'uppercase',
				color: '#fff',
				background: `linear-gradient(135deg, ${accent}, ${accent2})`,
				padding: '18px 40px',
				borderRadius: 26,
				border: '8px solid #fff',
				boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
				whiteSpace: 'nowrap',
				...stroke(6),
			}}
		>
			{cue.emoji ? `${cue.emoji} ` : ''}
			{cue.text}
		</div>
	);
};

// ---------- scenes ----------

// Frames a scene keeps showing past its `to`, so the next scene crossfades over it instead of over black.
export const SCENE_FADE = 12;

const MOVES = {
	in: {s: [1.05, 1.22], x: [0, 0], y: [0, 0]},
	out: {s: [1.22, 1.05], x: [0, 0], y: [0, 0]},
	left: {s: [1.18, 1.18], x: [4, -4], y: [0, 0]},
	right: {s: [1.18, 1.18], x: [-4, 4], y: [0, 0]},
	up: {s: [1.18, 1.18], x: [0, 0], y: [4, -4]},
	down: {s: [1.18, 1.18], x: [0, 0], y: [-4, 4]},
} as const;

// Full-screen stock photo or clip with a slow Ken Burns move, drawn under the cards.
export const Scene: React.FC<{cue: C<'scene'>; dur: number; index: number}> = ({cue, dur, index}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const order = ['in', 'right', 'out', 'left', 'up', 'down'] as const;
	const m = MOVES[cue.move ?? order[index % order.length]];
	const t = interpolate(frame, [0, dur], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
	const lerp = (r: readonly [number, number]) => r[0] + (r[1] - r[0]) * t;
	const fade = interpolate(frame, [0, SCENE_FADE], [0, 1], clamp);
	const style: React.CSSProperties = {
		width: '100%',
		height: '100%',
		objectFit: 'cover',
		transform: `translate(${lerp(m.x)}%, ${lerp(m.y)}%) scale(${lerp(m.s)})`,
	};
	return (
		<AbsoluteFill style={{opacity: fade, overflow: 'hidden'}}>
			{/\.(mp4|webm|mov)$/i.test(cue.src) ? (
				<OffthreadVideo src={staticFile(cue.src)} muted trimBefore={Math.round((cue.start ?? 0) * fps)} style={style} />
			) : (
				<Img src={staticFile(cue.src)} style={style} />
			)}
			<AbsoluteFill style={{backgroundColor: `rgba(0,0,0,${cue.dim ?? 0.35})`}} />
		</AbsoluteFill>
	);
};

// ---------- placement ----------

const Body: React.FC<{cue: Cue} & Colors> = ({cue, ...colors}) => {
	switch (cue.type) {
		case 'title':
			return <Title cue={cue} {...colors} />;
		case 'bullets':
		case 'steps':
			return <List cue={cue} {...colors} />;
		case 'stat':
			return <Stat cue={cue} {...colors} />;
		case 'icon':
			return <Icon cue={cue} {...colors} />;
		case 'image':
			return <Picture cue={cue} {...colors} />;
		case 'compare':
			return <Compare cue={cue} {...colors} />;
		case 'hook':
			return <Hook cue={cue} {...colors} />;
		case 'rating':
			return <Rating cue={cue} {...colors} />;
		case 'bars':
			return <Bars cue={cue} {...colors} />;
		case 'cta':
			return <Cta cue={cue} {...colors} />;
		case 'location':
			return <Location cue={cue} {...colors} />;
		case 'pointer':
			return <Pointer cue={cue} {...colors} />;
		case 'sticker':
			return <Sticker cue={cue} {...colors} />;
		case 'burst':
			return <EmojiBurst emoji={Array.isArray(cue.emoji) ? cue.emoji : [cue.emoji]} count={cue.count ?? 22} mode={cue.mode ?? 'explode'} seed={Math.round(cue.from * 10)} />;
		case 'zoom':
		case 'scene':
			return null;
	}
};

const POS = {top: {top: 150}, center: {top: '50%'}, bottom: {bottom: 470}} as const;

// Card cues: 3D spring-in to the upper area, blur-pop out. Overlay cues: full frame.
export const CueView: React.FC<{cue: Cue; accent: string; accent2: string; dur: number; dark?: boolean}> = ({cue, accent, accent2, dur, dark}) => {
	const frame = useCurrentFrame();
	const enter = useEnter(0, 'snappy');
	const exit = interpolate(frame, [dur - 7, dur], [1, 0], clamp);
	const vars = dark ? ({'--glass': 'rgba(8,6,16,0.62)'} as React.CSSProperties) : {};

	if (cue.type === 'zoom' || cue.type === 'scene') return null;
	if (OVERLAY_TYPES.has(cue.type)) {
		return (
			<AbsoluteFill style={{...vars, fontFamily: FONT, opacity: exit, transform: `scale(${1 + (1 - exit) * 0.08})`}}>
				<Body cue={cue} accent={accent} accent2={accent2} />
			</AbsoluteFill>
		);
	}

	const pos = cue.pos ?? 'top';
	const blur = (1 - Math.min(1, enter)) * 14 + (1 - exit) * 12;
	return (
		<div
			style={{
				position: 'absolute',
				left: 64,
				right: 64,
				...POS[pos],
				...vars,
				fontFamily: FONT,
				opacity: Math.min(1, enter * 1.4, exit),
				transform: `${pos === 'center' ? 'translateY(-50%) ' : ''}perspective(1400px) translateY(${(1 - enter) * 140}px) rotateX(${(1 - enter) * 40}deg) scale(${(0.8 + enter * 0.2) * (1 + (1 - exit) * 0.12)})`,
				filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
			}}
		>
			<Body cue={cue} accent={accent} accent2={accent2} />
		</div>
	);
};
