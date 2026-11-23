import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import data from './data/storyboard.json';
import {Grain} from './components/base';
import {FondoCapitulo} from './components/fondos';
import {TEMAS, TemaCtx} from './theme';
import {BoardScene} from './components/board';
import {
	ChapterScene,
	CollageScene,
	EndScene,
	GestaltScene,
	KineticScene,
	ListScene,
	MetroMScene,
	NamesScene,
	NetworkScene,
	OpArtScene,
	PictogramScene,
	StationsScene,
	TitleScene,
	YearScene,
} from './components/scenes';

type Scene = {block: string; type: string; t0: number; t1: number; props: Record<string, unknown>};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY: Record<string, React.FC<any>> = {
	board: BoardScene,
	kinetic: KineticScene,
	collage: CollageScene,
	list: ListScene,
	title: TitleScene,
	chapter: ChapterScene,
	year: YearScene,
	names: NamesScene,
	opart: OpArtScene,
	pictograms: PictogramScene,
	metroM: MetroMScene,
	gestalt: GestaltScene,
	stations: StationsScene,
	network: NetworkScene,
	end: EndScene,
};

const TR = 14; // frames de transición (las escenas se encadenan, sin cortes secos)

/* Transición de franjas: la escena nueva entra por bandas diagonales que se abren (op art) */
const Franjas: React.FC<{children: React.ReactNode; on: boolean}> = ({children, on}) => {
	const frame = useCurrentFrame();
	if (!on || frame >= TR) return <AbsoluteFill>{children}</AbsoluteFill>;
	const p = interpolate(frame, [0, TR], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
	const w = 64;
	const mask = `repeating-linear-gradient(115deg, #000 0px, #000 ${(p * w).toFixed(1)}px, transparent ${(p * w).toFixed(1)}px, transparent ${w}px)`;
	return <AbsoluteFill style={{maskImage: mask, WebkitMaskImage: mask}}>{children}</AbsoluteFill>;
};

export const VideoEnsayo: React.FC = () => {
	const {fps} = useVideoConfig();
	const scenes = data.scenes as Scene[];
	const blocks = Array.from(new Set(scenes.map((s) => s.block)));
	return (
		<AbsoluteFill style={{backgroundColor: '#F5F0E6'}}>
			{/* Fondo continuo por capítulo */}
			{blocks.map((b) => {
				const ss = scenes.filter((s) => s.block === b);
				const from = Math.round(ss[0].t0 * fps);
				const to = Math.round(ss[ss.length - 1].t1 * fps) + TR;
				return (
					<Sequence key={b} name={`fondo ${b}`} from={from} durationInFrames={to - from}>
						<FondoCapitulo t={TEMAS[b]} />
					</Sequence>
				);
			})}
			{/* Escenas */}
			{scenes.map((s, i) => {
				const Comp = REGISTRY[s.type];
				const from = Math.round(s.t0 * fps);
				const dur = Math.max(1, Math.round(s.t1 * fps) - from) + (i + 1 < scenes.length ? TR : 0);
				return (
					<Sequence key={i} name={`${String(i).padStart(2, '0')} ${s.block} ${s.type}`} from={from} durationInFrames={dur}>
						<TemaCtx.Provider value={TEMAS[s.block]}>
							<Franjas on={i > 0}>
								<Comp t0={s.t0} {...s.props} />
							</Franjas>
						</TemaCtx.Provider>
					</Sequence>
				);
			})}
			<Grain />
			<Audio src={staticFile('audio/voz_maestra.wav')} />
		</AbsoluteFill>
	);
};
