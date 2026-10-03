import React, {useMemo} from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Word} from '../types';
import {FONT, SPRING} from './theme';

const MAX_WORDS = 3;

// Groups words into short punchy lines, breaking on punctuation and pauses.
const chunk = (words: Word[]) => {
	const out: Word[][] = [];
	let cur: Word[] = [];
	words.forEach((w, i) => {
		cur.push(w);
		const next = words[i + 1];
		const pause = next ? next.s - w.e > 0.35 : true;
		if (cur.length >= MAX_WORDS || /[.,!?।]$/.test(w.w) || pause) {
			out.push(cur);
			cur = [];
		}
	});
	if (cur.length) out.push(cur);
	return out;
};

const clean = (w: string) => w.replace(/[.,!?।]$/, '');
const key = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

type Props = {words: Word[]; accent: string; accent2: string; style?: 'pop' | 'box'; emphasis?: string[]};

export const Captions: React.FC<Props> = ({words, accent, accent2, style = 'pop', emphasis = []}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const lines = useMemo(() => chunk(words), [words]);
	const marks = useMemo(() => new Set(emphasis.map(key)), [emphasis]);
	const line = lines.find((l, i) => t >= l[0].s - 0.05 && t < (lines[i + 1]?.[0].s ?? l[l.length - 1].e + 0.4));
	if (!line) return null;

	const lineIn = spring({frame: frame - Math.round(line[0].s * fps), fps, config: SPRING.snappy});

	return (
		<div style={{position: 'absolute', left: 50, right: 50, top: '75%', textAlign: 'center', fontFamily: FONT, transform: `scale(${0.85 + lineIn * 0.15})`}}>
			{line.map((w, i) => {
				const spoken = t >= w.s - 0.03;
				const active = t >= w.s && t < w.e + 0.05;
				const hot = /\d/.test(w.w) || marks.has(key(w.w));
				const p = spring({frame: frame - Math.round(w.s * fps), fps, config: SPRING.bouncy});
				const pop = style === 'pop';
				return (
					<span
						key={i}
						style={{
							display: 'inline-block',
							margin: '0 10px',
							fontSize: hot ? 100 : 86,
							fontWeight: 900,
							textTransform: 'uppercase',
							letterSpacing: -1,
							lineHeight: 1.15,
							padding: '0 14px',
							borderRadius: 16,
							color: !hot && pop && active ? accent2 : '#fff',
							background: hot ? accent : !pop && active ? accent : 'transparent',
							WebkitTextStroke: hot || (!pop && active) ? '0' : '12px rgba(0,0,0,0.92)',
							paintOrder: 'stroke fill',
							textShadow: '0 8px 30px rgba(0,0,0,0.55)',
							opacity: pop && !spoken ? 0 : 1,
							boxShadow: hot ? `0 10px 40px ${accent}aa` : 'none',
							transform: `translateY(${pop ? (1 - p) * 40 : 0}px) scale(${(pop ? 0.5 + p * 0.5 : 1) * (active ? 1.1 : 1)}) rotate(${hot ? -3 : 0}deg)`,
						}}
					>
						{clean(w.w)}
					</span>
				);
			})}
		</div>
	);
};
