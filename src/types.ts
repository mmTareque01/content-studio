export type Word = {w: string; s: number; e: number};

type Pos = 'top' | 'center' | 'bottom';
type Scored = {label: string; value: number};

// A graphic shown behind/above you between `from` and `to` (seconds).
// `pos` moves a card cue, `sfx: false` silences it, `shake: true` adds a camera hit.
export type Cue = {from: number; to: number; pos?: Pos; sfx?: boolean; shake?: boolean} & (
	| {type: 'title'; text: string; sub?: string}
	| {type: 'bullets'; title?: string; items: string[]; at?: number[]}
	| {type: 'stat'; value: number; prefix?: string; suffix?: string; label: string}
	| {type: 'icon'; emoji: string; label: string}
	| {type: 'image'; src: string; caption?: string}
	| {type: 'compare'; left: {title: string; items: string[]}; right: {title: string; items: string[]}}
	| {type: 'steps'; items: string[]; at?: number[]}
	// Giant slammed-in hook text; words in `highlight` get the accent slab.
	| {type: 'hook'; text: string; highlight?: string[]}
	// Full-screen emoji particles.
	| {type: 'burst'; emoji: string | string[]; count?: number; mode?: 'explode' | 'rain'}
	// Hand-drawn circle/arrow at x,y (% of frame) pointing at something in the shot.
	| {type: 'pointer'; x: number; y: number; shape?: 'circle' | 'arrow'; label?: string; size?: number}
	// Tilted badge slapped onto the frame.
	| {type: 'sticker'; text: string; emoji?: string; x?: number; y?: number; rotate?: number}
	| {type: 'rating'; title?: string; items: Scored[]; at?: number[]}
	| {type: 'bars'; title?: string; items: Scored[]; suffix?: string}
	| {type: 'cta'; text: string; handle?: string}
	| {type: 'location'; place: string; sub?: string}
	// Full-screen stock photo/clip behind the cards, with a slow Ken Burns move. Crossfades from the previous scene.
	| {type: 'scene'; src: string; move?: 'in' | 'out' | 'left' | 'right' | 'up' | 'down'; dim?: number; start?: number}
	// Invisible: camera push into x,y (% of frame).
	| {type: 'zoom'; scale?: number; x?: number; y?: number}
);

export type CueFile = {
	accent: string;
	accent2?: string; // secondary color for emphasis words & gradients (default: warm yellow)
	background: string | null; // image or video under public/, e.g. "assets/backgrounds/city.mp4"
	music: string | null; // e.g. "assets/music/lofi.mp3"
	musicVolume?: number;
	footage?: boolean; // true = full-screen b-roll (talk.mp4 incl. its audio), no cutout/captions
	voice?: boolean; // true = voice-over only (voice.m4a), no person; visuals come from `scene` cues + cards
	sfx?: boolean; // auto sound effects on cues (default true)
	sfxVolume?: number; // default 0.35
	punch?: boolean; // snap-zoom the camera on every cue (default true)
	film?: boolean; // grain, vignette, light leaks (default true)
	progress?: boolean; // retention progress bar on top (default true)
	captionStyle?: 'pop' | 'box'; // pop = words appear as spoken (default), box = full line w/ highlight
	emphasis?: string[]; // caption words to color & enlarge (numbers are emphasized automatically)
	cues: Cue[];
};

export type ExplainerProps = {name: string};
