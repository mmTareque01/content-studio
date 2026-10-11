import React from 'react';
import {Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import type {Cue} from '../types';

type Hit = {at: number; sound: 'whoosh' | 'pop' | 'ding' | 'impact' | 'click' | 'sparkle'; vol?: number};

// Sound design per cue type. `at` is seconds relative to the cue start.
const hitsFor = (c: Cue, fps: number): Hit[] => {
	const items = (at: number[] | undefined, n: number): Hit[] =>
		Array.from({length: n}, (_, i) => ({at: at?.[i] !== undefined ? at[i] - c.from : (8 + i * 9) / fps, sound: 'pop' as const, vol: 0.8}));
	switch (c.type) {
		case 'title':
		case 'location':
		case 'image':
			return [{at: 0, sound: 'whoosh'}];
		case 'bullets':
		case 'steps':
			return [{at: 0, sound: 'whoosh'}, ...items(c.at, c.items.length)];
		case 'rating':
			return [{at: 0, sound: 'whoosh'}, ...items(c.at, c.items.length).map((h) => ({...h, sound: 'ding' as const, vol: 0.5}))];
		case 'compare':
			return [{at: 0, sound: 'whoosh'}, {at: 12 / fps, sound: 'impact', vol: 0.6}];
		case 'stat':
			return [{at: 0, sound: 'whoosh'}, {at: 36 / fps, sound: 'ding'}];
		case 'bars':
			return [{at: 0, sound: 'whoosh'}, {at: 0.3, sound: 'sparkle', vol: 0.7}];
		case 'icon':
			return [{at: 0, sound: 'pop'}, {at: 0.05, sound: 'sparkle', vol: 0.5}];
		case 'hook':
		case 'sticker':
			return [{at: 0, sound: 'impact'}];
		case 'burst':
			return [{at: 0, sound: 'pop'}, {at: 0.05, sound: 'sparkle'}];
		case 'pointer':
			return [{at: 0, sound: 'whoosh', vol: 0.6}, {at: 14 / fps, sound: 'pop'}];
		case 'cta':
			return [{at: 0, sound: 'whoosh'}, {at: 26 / fps, sound: 'click'}, {at: 27 / fps, sound: 'ding', vol: 0.6}];
		case 'zoom':
			return [{at: 0, sound: 'whoosh', vol: 0.5}];
		case 'scene':
			return [{at: 0, sound: 'whoosh', vol: 0.4}];
	}
};

export const Sfx: React.FC<{cues: Cue[]; volume: number}> = ({cues, volume}) => {
	const {fps} = useVideoConfig();
	return (
		<>
			{cues.flatMap((c, i) =>
				c.sfx === false
					? []
					: hitsFor(c, fps).map((h, j) => (
							<Sequence key={`${i}-${j}`} from={Math.max(0, Math.round((c.from + h.at) * fps))} durationInFrames={Math.round(1.5 * fps)} layout="none">
								<Audio src={staticFile(`assets/sfx/${h.sound}.wav`)} volume={volume * (h.vol ?? 1)} />
							</Sequence>
						)),
			)}
		</>
	);
};
