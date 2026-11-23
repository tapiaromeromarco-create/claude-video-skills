import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Tipografía local (public/fonts): sans contundente (estilo Helvetica/Univers), serif itálica para
// acentos y mono para fichas museográficas.
export const fontDisplay = 'Archivo Black';
export const fontSans = 'Archivo';
export const fontSerif = 'Instrument Serif';
export const fontMono = 'IBM Plex Mono';

const F = (family: string, file: string, weight: string, style = 'normal') =>
	loadFont({family, url: staticFile(`fonts/${file}`), weight, style});
export const fontsReady = Promise.all([
	F(fontDisplay, 'ArchivoBlack-400-normal.woff2', '400'),
	F(fontSans, 'Archivo-400-normal.woff2', '400'),
	F(fontSans, 'Archivo-600-normal.woff2', '600'),
	F(fontSans, 'Archivo-800-normal.woff2', '800'),
	F(fontSerif, 'InstrumentSerif-400-italic.woff2', '400', 'italic'),
	F(fontMono, 'IBMPlexMono-400-normal.woff2', '400'),
	F(fontMono, 'IBMPlexMono-600-normal.woff2', '600'),
]);

// Paleta: papel periódico, tinta, y acentos del diseño mexicano 60-70.
export const C = {
	paper: '#EFE6D2',
	paperDark: '#E2D6BC',
	ink: '#171412',
	inkSoft: '#4A433C',
	metro: '#F26B1D', // naranja Metro
	rosa: '#E4007C', // rosa mexicano (México 70)
	marker: '#FFE14D', // resaltador
	markerRGBA: 'rgba(255, 225, 77, 0.85)',
	white: '#FBF8F1',
	blue: '#1F4E9C',
};

export const ACCENTS = [C.metro, C.rosa, C.blue, C.ink];

// Animación "stop-motion" a 12 fps: devuelve el frame cuantizado.
export const step12 = (frame: number, fps: number) => {
	const k = Math.max(1, Math.round(fps / 12));
	return Math.floor(frame / k) * k;
};
