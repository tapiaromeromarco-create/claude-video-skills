import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Tipografía local (public/fonts): sans contundente (estilo Helvetica/Univers), serif itálica para
// acentos y mono para fichas museográficas.
export const fontDisplay = 'Archivo Black';
export const fontSans = 'Archivo';
export const fontSerif = 'Instrument Serif';
export const fontMono = 'IBM Plex Mono';
export const fontOp = 'Monoton'; // líneas paralelas, como la rotulación de MEXICO68
export const fontComic = 'Bangers'; // rotulación de historieta
export const fontGroovy = 'Shrikhand'; // psicodelia setentera
export const fontSign = 'Bungee'; // señalética

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
	F(fontOp, 'Monoton-400-normal.woff2', '400'),
	F(fontComic, 'Bangers-400-normal.woff2', '400'),
	F(fontGroovy, 'Shrikhand-400-normal.woff2', '400'),
	F(fontSign, 'Bungee-400-normal.woff2', '400'),
	F('Permanent Marker', 'PermanentMarker-400-normal.woff2', '400'),
	F('Caveat', 'Caveat-600-normal.woff2', '600'),
	F('Oswald', 'Oswald-600-normal.woff2', '600'),
	F('Oswald', 'Oswald-700-normal.woff2', '700'),
	F('Special Elite', 'SpecialElite-400-normal.woff2', '400'),
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

/* ---------- Tema por capítulo: la estética del diseño del que se habla ---------- */
import {createContext, useContext} from 'react';

export type Tema = {
	id: string;
	fondo: 'op' | 'comic' | 'metro' | 'guilloche';
	base: string; // color de papel/fondo
	linea: string; // color del patrón
	acento: string; // color de resaltes y bloques
	bloque: string; // fondo de los bloques de texto
	textoBloque: string;
	titulo: string; // tipografía de títulos
	marcador: string; // color del resaltador
};

export const TEMAS: Record<string, Tema> = {
	// México 68: op art magenta/negro sobre blanco
	b1: {id: 'b1', fondo: 'op', base: '#F5F0E6', linea: '#E4007C', acento: '#E4007C', bloque: '#171412', textoBloque: '#FBF8F1', titulo: fontOp, marcador: '#FFE14D'},
	// Historieta: papel periódico, puntos Ben-Day rojos, tinta negra
	b2: {id: 'b2', fondo: 'comic', base: '#F3E2B3', linea: '#E2231A', acento: '#E2231A', bloque: '#171412', textoBloque: '#FFF6D8', titulo: fontComic, marcador: '#FFE14D'},
	// México 68 / 70: op art en la paleta deportiva (magenta, cian, verde)
	b3: {id: 'b3', fondo: 'op', base: '#F5F0E6', linea: '#009FDA', acento: '#E4007C', bloque: '#171412', textoBloque: '#FBF8F1', titulo: fontOp, marcador: '#FFE14D'},
	// Metro de Lance Wyman: naranja, retícula, esquina redondeada
	b4: {id: 'b4', fondo: 'metro', base: '#F4EEE3', linea: '#F26B1D', acento: '#F26B1D', bloque: '#F26B1D', textoBloque: '#FFFFFF', titulo: fontSign, marcador: '#FFE14D'},
	// Billetes y estampillas: guilloché verde, papel moneda
	b5: {id: 'b5', fondo: 'guilloche', base: '#E8EEE2', linea: '#2E6B52', acento: '#1F4E9C', bloque: '#1B3B2F', textoBloque: '#F4F1E6', titulo: fontDisplay, marcador: '#FFE14D'},
};

export const TemaCtx = createContext<Tema>(TEMAS.b1);
export const useTema = () => useContext(TemaCtx);
