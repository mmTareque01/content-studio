import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useVideoConfig} from 'remotion';
import {Backdrop} from './graphics/Backdrop';
import {Camera} from './graphics/Camera';
import {Captions} from './graphics/Captions';
import {CueView, OVERLAY_TYPES, SCENE_FADE, Scene} from './graphics/Cues';
import {Film, ProgressBar} from './graphics/Overlays';
import {Sfx} from './graphics/Sfx';
import {DEFAULT_ACCENT2, FONT} from './graphics/theme';
import type {Cue} from './types';
import type {LoadedProps} from './Root';

const isVideo = (p: string) => /\.(mp4|webm|mov)$/i.test(p);

export const Explainer: React.FC<LoadedProps> = ({name, words = [], cues: file}) => {
	const {fps} = useVideoConfig();
	const base = `videos/${name}`;
	const accent = file?.accent ?? '#7C5CFF';
	const accent2 = file?.accent2 ?? DEFAULT_ACCENT2;
	const cues = file?.cues ?? [];
	const footage = !!file?.footage;
	const voice = !!file?.voice;
	const punch = file?.punch ?? true;
	const media = !!file; // false on a fresh clone with no prepared video

	const layer = (keep: (c: Cue) => boolean) =>
		cues.map((c, i) => {
			if (!keep(c) || c.type === 'scene') return null;
			const from = Math.round(c.from * fps);
			const dur = Math.max(1, Math.round((c.to - c.from) * fps));
			return (
				<Sequence key={i} from={from} durationInFrames={dur} layout="none">
					<CueView cue={c} accent={accent} accent2={accent2} dur={dur} dark={footage || voice} />
				</Sequence>
			);
		});

	return (
		<AbsoluteFill style={{backgroundColor: '#07060d', fontFamily: FONT, overflow: 'hidden'}}>
			{/* 1. Environment (footage gets the full camera rig, studio backdrops a gentle one) */}
			<Camera cues={cues} punch={punch} intensity={footage ? 1 : 0.35}>
				{footage ? (
					<OffthreadVideo src={staticFile(`${base}/talk.mp4`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
				) : file?.background ? (
					isVideo(file.background) ? (
						<OffthreadVideo src={staticFile(file.background)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
					) : (
						<Img src={staticFile(file.background)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
					)
				) : (
					<Backdrop accent={accent} accent2={accent2} />
				)}
				{/* Voice mode: stock scenes, each held a little past its end so the next one crossfades over it */}
				{cues.map((c, i) => {
					if (c.type !== 'scene') return null;
					const dur = Math.max(1, Math.round((c.to - c.from) * fps));
					return (
						<Sequence key={i} from={Math.round(c.from * fps)} durationInFrames={dur + SCENE_FADE} layout="none">
							<Scene cue={c} dur={dur} index={i} />
						</Sequence>
					);
				})}
			</Camera>
			{footage || voice ? <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 35%, transparent 75%, rgba(0,0,0,0.5) 100%)'}} /> : null}

			{/* 2. Voice-synced cards (upper area, behind you) */}
			{layer((c) => !OVERLAY_TYPES.has(c.type))}

			{/* 3. You, cut out of your real background */}
			{footage || voice || !media ? null : (
				<Camera cues={cues} punch={punch}>
					<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center'}}>
						<OffthreadVideo
							src={staticFile(`${base}/person.webm`)}
							transparent
							muted
							style={{width: '100%', height: '62%', objectFit: 'cover', objectPosition: 'center top', filter: `drop-shadow(0 0 40px rgba(0,0,0,0.6)) drop-shadow(0 0 2px ${accent})`}}
						/>
					</AbsoluteFill>
				</Camera>
			)}

			{/* 4. Overlays drawn on top of everything: bursts, pointers, stickers */}
			{layer((c) => OVERLAY_TYPES.has(c.type))}

			{/* 5. Film finish */}
			{file?.film === false ? null : <Film cues={cues} accent={accent} accent2={accent2} />}

			{/* 6. Captions + progress */}
			<Captions words={words} accent={accent} accent2={accent2} style={file?.captionStyle} emphasis={file?.emphasis} />
			{file?.progress === false ? null : <ProgressBar accent={accent} accent2={accent2} />}

			{/* 7. Audio (footage mode plays talk.mp4's own audio, voice mode the voice-over) */}
			{footage || !media ? null : <Audio src={staticFile(`${base}/${voice ? 'voice.m4a' : 'talk.mp4'}`)} />}
			{file?.music ? <Audio src={staticFile(file.music)} volume={file.musicVolume ?? 0.08} loop /> : null}
			{file?.sfx === false ? null : <Sfx cues={cues} volume={file?.sfxVolume ?? 0.35} />}
		</AbsoluteFill>
	);
};
