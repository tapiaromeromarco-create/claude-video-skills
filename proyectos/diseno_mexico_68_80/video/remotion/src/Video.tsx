import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import data from './data/storyboard.json';
import {Grain} from './components/base';
import {FondoCapitulo} from './components/fondos';
import {TEMAS, TemaCtx} from './theme';
import {BoardScene} from './components/board';
import {FullScene} from './components/full';
import {DUR_TR, Golpe, Transicion} from './components/transitions';
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

/* Salida por franjas (inversa) para las imágenes a pantalla completa */
const SalidaFranjas: React.FC<{children: React.ReactNode; dur: number}> = ({children, dur}) => {
	const frame = useCurrentFrame();
	const q = interpolate(frame, [dur - TR, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
	if (q >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
	const w = 64;
	const mask = `repeating-linear-gradient(115deg, #000 0px, #000 ${(q * w).toFixed(1)}px, transparent ${(q * w).toFixed(1)}px, transparent ${w}px)`;
	return <AbsoluteFill style={{maskImage: mask, WebkitMaskImage: mask}}>{children}</AbsoluteFill>;
};

// Transición temática al entrar a cada capítulo (con la estética de lo que viene)
const TR_CAPITULO: Record<string, string> = {b2: 'semitono', b3: 'op', b4: 'metro', b5: 'billete'};
const transicionDe = (scenes: Scene[], i: number): string | null => {
	if (i === 0) return null;
	const s = scenes[i];
	if (s.type === 'chapter') return TR_CAPITULO[s.block] ?? 'op';
	if (scenes[i - 1].type === 'chapter') return 'papel';
	if (s.type === 'end') return 'op';
	return null;
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
							<Franjas on={i > 0 && !transicionDe(scenes, i)}>
								<Comp t0={s.t0} {...s.props} />
							</Franjas>
						</TemaCtx.Provider>
					</Sequence>
				);
			})}
			{/* Transiciones temáticas entre capítulos (cubren el corte) */}
			{scenes.map((s, i) => {
				const kind = transicionDe(scenes, i);
				if (!kind) return null;
				return (
					<Sequence key={`tr${i}`} name={`transición ${kind}`} from={Math.round(s.t0 * fps) - DUR_TR / 2} durationInFrames={DUR_TR}>
						<Transicion kind={kind} />
					</Sequence>
				);
			})}
			{/* Golpes de palabra (estímulos breves) */}
			{((data as unknown as {overlays?: Scene[]}).overlays ?? []).filter((s) => s.type === 'golpe').map((s, i) => (
				<Sequence key={`g${i}`} name={`golpe ${i}`} from={Math.round(s.t0 * fps)} durationInFrames={Math.max(10, Math.round((s.t1 - s.t0) * fps))}>
					<Golpe t0={s.t0} t1={s.t1} {...(s.props as {text: string})} />
				</Sequence>
			))}
			{/* Imágenes a pantalla completa: encima del tablero, sin cortar su recorrido */}
			{((data as unknown as {overlays?: Scene[]}).overlays ?? []).filter((s) => s.type !== 'golpe').map((s, i) => {
				const from = Math.round(s.t0 * fps);
				const dur = Math.max(1, Math.round(s.t1 * fps) - from) + TR;
				return (
					<Sequence key={`ov${i}`} name={`pantalla completa ${i}`} from={from} durationInFrames={dur}>
						<Franjas on>
							<SalidaFranjas dur={dur}>
								<FullScene t0={s.t0} t1={s.t1} {...(s.props as {src: string})} />
							</SalidaFranjas>
						</Franjas>
					</Sequence>
				);
			})}
			<Grain />
			<Audio src={staticFile('audio/voz_maestra.wav')} />
		</AbsoluteFill>
	);
};
