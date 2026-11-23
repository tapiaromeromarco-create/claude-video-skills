import React from 'react';
import {AbsoluteFill, Sequence, staticFile, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import data from './data/storyboard.json';
import {Grain} from './components/base';
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

export const VideoEnsayo: React.FC = () => {
	const {fps} = useVideoConfig();
	const scenes = data.scenes as Scene[];
	return (
		<AbsoluteFill style={{backgroundColor: '#EFE6D2'}}>
			{scenes.map((s, i) => {
				const Comp = REGISTRY[s.type];
				const from = Math.round(s.t0 * fps);
				const dur = Math.max(1, Math.round(s.t1 * fps) - from);
				return (
					<Sequence key={i} name={`${String(i).padStart(2, '0')} ${s.block} ${s.type}`} from={from} durationInFrames={dur}>
						<Comp t0={s.t0} {...s.props} />
					</Sequence>
				);
			})}
			<Grain />
			<Audio src={staticFile('audio/voz_maestra.wav')} />
			{/* Música de fondo: colocar public/audio/musica.mp3 y descomentar */}
			{/* <Audio src={staticFile('audio/musica.mp3')} volume={0.12} loop /> */}
		</AbsoluteFill>
	);
};
