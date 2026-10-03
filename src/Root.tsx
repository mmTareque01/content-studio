import React from 'react';
import {Composition, staticFile} from 'remotion';
import {Explainer} from './Explainer';
import type {CueFile, ExplainerProps, Word} from './types';

export type LoadedProps = ExplainerProps & {words?: Word[]; cues?: CueFile};

export const RemotionRoot: React.FC = () => (
	<Composition
		id="Explainer"
		component={Explainer}
		width={1080}
		height={1920}
		fps={30}
		durationInFrames={300}
		defaultProps={{name: 'test'} as LoadedProps}
		calculateMetadata={async ({props}) => {
			const base = `videos/${props.name}`;
			const load = (f: string) => fetch(staticFile(`${base}/${f}`)).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))));
			let meta, words, cues;
			try {
				[meta, words, cues] = await Promise.all([load('meta.json'), load('words.json'), load('cues.json')]);
			} catch {
				// Fresh clone: no prepared video yet. Show an empty studio instead of crashing.
				console.warn(`No prepared video "${props.name}" in public/${base}: run scripts/prepare.sh first`);
				return {durationInFrames: 300, props: {...props, words: [], cues: undefined}};
			}
			return {
				durationInFrames: Math.ceil(meta.duration * 30),
				props: {...props, words: words.words, cues},
			};
		}}
	/>
);
