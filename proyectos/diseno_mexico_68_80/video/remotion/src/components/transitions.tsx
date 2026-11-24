import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, random, staticFile} from 'remotion';
import {useCurrentFrame, useVideoConfig} from '../time';

/* =====================================================================================
   TRANSICIONES CREATIVAS (con la estética de cada capítulo) y "GOLPES" de palabra.
   Cada transición dura DUR frames: la primera mitad cubre la pantalla, la segunda la descubre;
   el corte entre escenas ocurre justo a la mitad, oculto debajo.
   ===================================================================================== */

export const DUR_TR = 26;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.7, 0, 0.3, 1);

// cobertura 0→1→0 a lo largo de la transición
const useCover = () => {
	const f = useCurrentFrame();
	const h = DUR_TR / 2;
	const p = f < h ? interpolate(f, [0, h], [0, 1], {...clamp, easing: ease}) : interpolate(f, [h, DUR_TR], [1, 0], {...clamp, easing: ease});
	return {p, f, entrando: f < h};
};

/* Semitono Ben-Day: puntos que crecen hasta cubrir (historieta) */
const Semitono: React.FC<{color: string; fondo: string}> = ({color, fondo}) => {
	const {p} = useCover();
	const cell = 54;
	const cols = Math.ceil(1920 / cell) + 1, rows = Math.ceil(1080 / cell) + 1;
	const dots: React.ReactNode[] = [];
	for (let y = 0; y < rows; y++)
		for (let x = 0; x < cols; x++) {
			// onda diagonal: los puntos de la esquina crecen primero
			const d = (x / cols + y / rows) / 2;
			const q = Math.max(0, Math.min(1, p * 1.6 - d * 0.6));
			const r = q * cell * 0.78;
			if (r > 0.5) dots.push(<circle key={`${x}-${y}`} cx={x * cell + (y % 2) * (cell / 2)} cy={y * cell} r={r} fill={color} />);
		}
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{background: fondo, opacity: p > 0.92 ? 1 : 0}} />
			<svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
				{dots}
			</svg>
		</AbsoluteFill>
	);
};

/* Anillos op art que se ensanchan hasta cubrir (México 68) */
const OpArtCubre: React.FC = () => {
	const {p, f} = useCover();
	const n = 26, gap = 46;
	return (
		<svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
			{Array.from({length: n}).map((_, i) => {
				const r = 20 + i * gap + (f * 3) % gap;
				const sw = Math.max(0.01, p * gap * 1.05);
				return <rect key={i} x={960 - r * 1.7} y={540 - r} width={r * 3.4} height={r * 2} rx={r} fill="none" stroke={i % 2 ? '#171412' : '#E4007C'} strokeWidth={sw} />;
			})}
			<rect x={960 - 30} y={540 - 18} width={60} height={36} rx={18} fill={p > 0.5 ? '#E4007C' : 'none'} />
		</svg>
	);
};

/* Tren del Metro: bloque naranja con esquina redondeada y la M cruza la pantalla */
const TrenMetro: React.FC = () => {
	const f = useCurrentFrame();
	const x = interpolate(f, [0, DUR_TR], [-2300, 2100], {...clamp, easing: Easing.bezier(0.5, 0, 0.5, 1)});
	return (
		<AbsoluteFill>
			{/* rieles */}
			<svg width="1920" height="1080" style={{position: 'absolute', inset: 0, opacity: interpolate(f, [0, 4, DUR_TR - 4, DUR_TR], [0, 1, 1, 0], clamp)}}>
				{[860, 900].map((y) => (
					<line key={y} x1={0} y1={y} x2={1920} y2={y} stroke="#3A3330" strokeWidth={10} />
				))}
			</svg>
			<div style={{position: 'absolute', left: x, top: -60, width: 2200, height: 1200, background: '#F26B1D', borderTopRightRadius: 520, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 60px rgba(0,0,0,0.35)'}}>
				{/* ventanas */}
				{Array.from({length: 7}).map((_, i) => (
					<div key={i} style={{position: 'absolute', left: 120 + i * 290, top: 220, width: 200, height: 150, background: 'rgba(255,255,255,0.85)', borderRadius: 18}} />
				))}
				<div style={{position: 'absolute', left: 0, right: 0, top: 700, height: 18, background: '#FFFFFF'}} />
				<Img src={staticFile('img/metro_logo.png')} style={{width: 420, height: 420, objectFit: 'contain', filter: 'brightness(0) invert(1)', marginTop: 260}} />
			</div>
		</AbsoluteFill>
	);
};

/* Billete gigante que barre la pantalla (identidad y billetes) */
const BilleteBarre: React.FC = () => {
	const f = useCurrentFrame();
	const x = interpolate(f, [0, DUR_TR], [2000, -2600], {...clamp, easing: Easing.bezier(0.5, 0, 0.5, 1)});
	const rot = interpolate(f, [0, DUR_TR], [-8, 6]);
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', left: x, top: -260, width: 2600, height: 1600, rotate: `${rot}deg`, background: '#DCE8D6', boxShadow: '0 30px 80px rgba(0,0,0,0.45)', overflow: 'hidden'}}>
				<Img src={staticFile('img/st/billete_20.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.95}} />
				<AbsoluteFill style={{backgroundImage: 'repeating-radial-gradient(circle at 30% 50%, rgba(46,107,82,0.25) 0 2px, transparent 2px 9px)'}} />
			</div>
		</AbsoluteFill>
	);
};

/* Papel rasgado que sube y se va (de la tarjeta de capítulo al tablero) */
const PapelRasgado: React.FC = () => {
	const f = useCurrentFrame();
	const y = interpolate(f, [0, DUR_TR], [1300, -1500], {...clamp, easing: Easing.bezier(0.55, 0, 0.45, 1)});
	const borde = (top: boolean) => {
		const pts: string[] = [];
		for (let i = 0; i <= 40; i++) {
			const x = (i / 40) * 100;
			const j = (random(`rasg${top}${i}`) * 3.2).toFixed(2);
			pts.push(`${x}% ${top ? j : 100 - Number(j)}%`);
		}
		return pts;
	};
	const poly = `polygon(${borde(true).join(',')}, ${borde(false).reverse().join(',')})`;
	return (
		<div style={{position: 'absolute', left: -40, top: y, width: 2000, height: 1400, background: '#EFE6D3', clipPath: poly, filter: 'drop-shadow(0 -20px 30px rgba(0,0,0,0.35))'}}>
			<AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(0deg, rgba(60,50,40,0.10) 0 10px, transparent 10px 34px)', top: 120}} />
		</div>
	);
};

export const Transicion: React.FC<{kind: string}> = ({kind}) => {
	if (kind === 'semitono') return <Semitono color="#E2231A" fondo="#E2231A" />;
	if (kind === 'op') return <OpArtCubre />;
	if (kind === 'metro') return <TrenMetro />;
	if (kind === 'billete') return <BilleteBarre />;
	if (kind === 'papel') return <PapelRasgado />;
	return null;
};

/* "Golpe" de palabra: entra gigante, se asienta con sacudida y sale (estímulo breve) */
export const Golpe: React.FC<{text: string; color?: string; fondo?: string; font?: 'op' | 'display' | 'comic'; t0: number; t1: number}> = ({text, color = '#171412', fondo = '#FFE14D', font = 'display', t0, t1}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const dur = Math.max(10, Math.round((t1 - t0) * fps));
	const s = interpolate(f, [0, 12], [1.7, 1], {...clamp, easing: Easing.out(Easing.back(1.3))});
	const out = interpolate(f, [0, 5, dur - 8, dur], [0, 1, 1, 0], clamp);
	const sh = 0; // sin temblor: movimiento limpio
	const ff = font === 'op' ? 'Monoton' : font === 'comic' ? 'Bangers' : 'Archivo Black';
	return (
		<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 70, pointerEvents: 'none'}}>
			<div
				style={{
					fontFamily: ff,
					fontSize: font === 'op' ? 110 : 124,
					lineHeight: 1,
					color,
					background: fondo,
					padding: '18px 54px 26px',
					scale: String(s),
					opacity: out,
					translate: `${sh}px ${-sh * 0.4}px`,
					rotate: `${(random(text) - 0.5) * 8}deg`,
					boxShadow: '16px 16px 0 #171412',
					textAlign: 'center',
					whiteSpace: 'pre',
					letterSpacing: font === 'comic' ? 4 : 0,
				}}
			>
				{text}
			</div>
		</AbsoluteFill>
	);
};
