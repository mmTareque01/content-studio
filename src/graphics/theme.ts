import {loadFont as loadMontserrat} from '@remotion/google-fonts/Montserrat';
import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';

// System fonts stay in the stack so Bangla / CJK glyphs still render.
const fallback = '-apple-system, "SF Pro Display", "Helvetica Neue", "Noto Sans Bengali", sans-serif';
export const FONT = `${loadMontserrat('normal', {weights: ['600', '700', '800', '900'], subsets: ['latin']}).fontFamily}, ${fallback}`;
export const DISPLAY = `${loadAnton('normal', {weights: ['400'], subsets: ['latin']}).fontFamily}, ${FONT}`;

export const DEFAULT_ACCENT2 = '#FFE14D';

export const SPRING = {
	soft: {damping: 16, stiffness: 140},
	snappy: {damping: 12, stiffness: 220},
	bouncy: {damping: 8, stiffness: 160},
	slam: {damping: 18, stiffness: 400},
};

export const useEnter = (delay = 0, config: keyof typeof SPRING = 'soft') => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: frame - delay, fps, config: SPRING[config]});
};

// Deterministic pseudo-random in [0,1) so every render is identical.
export const rand = (seed: number) => {
	const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
	return x - Math.floor(x);
};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
