import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, Easing} from 'remotion';
import {useCurrentFrame, useVideoConfig} from '../time';
import {C, fontMono, fontSans, fontDisplay, step12} from '../theme';

/* ---------- Fondo: papel reciclado + cuadrícula milimétrica ---------- */
export const Paper: React.FC<{grid?: boolean; tone?: string; solid?: boolean}> = ({grid = true, tone = C.paper, solid = false}) => !solid ? null : (
	<AbsoluteFill style={{backgroundColor: tone}}>
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.55, mixBlendMode: 'multiply'}}>
			<filter id="paperNoise">
				<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="4" />
				<feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.28  0 0 0 0.35 0" />
			</filter>
			<rect width="100%" height="100%" filter="url(#paperNoise)" />
			<filter id="paperFibers">
				<feTurbulence type="fractalNoise" baseFrequency="0.012 0.08" numOctaves="2" seed="9" />
				<feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.42  0 0 0 0 0.3  0 0 0 0.18 0" />
			</filter>
			<rect width="100%" height="100%" filter="url(#paperFibers)" />
		</svg>
		{grid ? (
			<AbsoluteFill
				style={{
					opacity: 0.22,
					backgroundImage: `linear-gradient(${C.inkSoft}22 1px, transparent 1px), linear-gradient(90deg, ${C.inkSoft}22 1px, transparent 1px), linear-gradient(${C.inkSoft}55 1px, transparent 1px), linear-gradient(90deg, ${C.inkSoft}55 1px, transparent 1px)`,
					backgroundSize: '24px 24px, 24px 24px, 120px 120px, 120px 120px',
				}}
			/>
		) : null}
	</AbsoluteFill>
);

/* ---------- Grano cinematográfico + viñeta (encima de todo) ---------- */
export const Grain: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const seed = Math.floor(step12(frame, fps) / 2) % 8;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.16, mixBlendMode: 'multiply'}}>
				<filter id={`grain${seed}`}>
					<feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed={seed + 1} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter={`url(#grain${seed})`} />
			</svg>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(40,25,10,0.28) 100%)'}} />
		</AbsoluteFill>
	);
};

/* ---------- Borde irregular de recorte (polígono determinista) ---------- */
export const roughPolygon = (seed: string, jag = 1.2, n = 9) => {
	const pts: string[] = [];
	const side = (fx: (t: number) => [number, number]) => {
		for (let i = 0; i < n; i++) {
			const [x, y] = fx(i / n);
			pts.push(`${(x + (random(`${seed}x${pts.length}`) - 0.5) * jag).toFixed(2)}% ${(y + (random(`${seed}y${pts.length}`) - 0.5) * jag).toFixed(2)}%`);
		}
	};
	side((t) => [t * 100, 0.6]);
	side((t) => [99.4, t * 100]);
	side((t) => [100 - t * 100, 99.4]);
	side((t) => [0.6, 100 - t * 100]);
	return `polygon(${pts.join(',')})`;
};

/* ---------- Entrada stop-motion: aparece "a saltos" a 12 fps ---------- */
export const usePop = (startFrame: number, seed: string, dur = 8) => {
	const frame = useCurrentFrame();
	const f = frame - startFrame;
	const p = interpolate(f, [0, dur + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.3))});
	const jitter = 0; // sin vibración stop-motion: movimiento continuo
	return {p, visible: f >= 0, jitter};
};

/* ---------- Ficha museográfica ---------- */
export const Ficha: React.FC<{title: string; sub?: string; year?: string; dark?: boolean; style?: React.CSSProperties}> = ({title, sub, year, dark, style}) => (
	<div
		style={{
			background: dark ? C.ink : C.white,
			color: dark ? C.white : C.ink,
			padding: '14px 20px 16px',
			borderLeft: `8px solid ${C.metro}`,
			boxShadow: '0 6px 0 rgba(0,0,0,0.12)',
			fontFamily: fontMono,
			maxWidth: 560,
			...style,
		}}
	>
		<div style={{fontFamily: fontSans, fontWeight: 800, fontSize: 30, lineHeight: 1.1}}>{title}</div>
		{sub ? <div style={{fontSize: 22, marginTop: 6, opacity: 0.85}}>{sub}</div> : null}
		{year ? <div style={{fontSize: 22, marginTop: 6, color: dark ? C.marker : C.rosa, fontWeight: 600}}>{year}</div> : null}
	</div>
);

/* ---------- Sticker: foto real o hueco de foto de archivo pendiente ---------- */
export type StickerItem = {
	kind?: 'photo' | 'portrait' | 'cover' | 'poster' | 'logo' | 'bill' | 'stamp' | 'coin';
	src?: string; // ruta en public/
	label: string; // descripción (para el hueco y la ficha)
	sub?: string;
	year?: string;
	tint?: string;
};

const SIZES: Record<string, [number, number]> = {
	photo: [620, 430],
	portrait: [300, 380],
	cover: [330, 440],
	poster: [380, 540],
	logo: [380, 380],
	bill: [560, 250],
	stamp: [250, 300],
	coin: [300, 300],
};

export const Sticker: React.FC<{item: StickerItem; startFrame: number; seed: string; scale?: number; rotate?: number; showFicha?: boolean; kenBurns?: number}> = ({
	item,
	startFrame,
	seed,
	scale = 1,
	rotate,
	showFicha = true,
	kenBurns = 0,
}) => {
	const frame = useCurrentFrame();
	const {p, visible, jitter} = usePop(startFrame, seed);
	if (!visible) return null;
	const kind = item.kind ?? 'photo';
	const [w, h] = SIZES[kind];
	const rot = rotate ?? (random(seed + 'r') - 0.5) * 8;
	const tint = item.tint ?? [C.metro, C.rosa, C.blue][Math.floor(random(seed + 't') * 3)];
	const kb = interpolate(frame - startFrame, [0, 300], [1.0, 1.0 + kenBurns], {extrapolateRight: 'clamp'});
	const isRound = kind === 'coin';
	const border = kind === 'logo' ? 0 : 12;
	return (
		<div style={{position: 'relative', width: w * scale, scale: String(p), rotate: `${rot + jitter}deg`}}>
			<div
				style={{
					width: w * scale,
					height: h * scale,
					background: C.white,
					padding: border * scale,
					clipPath: isRound ? 'circle(50%)' : roughPolygon(seed, kind === 'stamp' ? 0 : 1.4),
					filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.25))',
					boxSizing: 'border-box',
				}}
			>
				<div style={{width: '100%', height: '100%', overflow: 'hidden', position: 'relative', borderRadius: isRound ? '50%' : 0}}>
					{item.src ? (
						<Img
							src={staticFile(item.src)}
							style={{width: '100%', height: '100%', objectFit: kind === 'logo' ? 'contain' : 'cover', scale: String(kb), background: kind === 'logo' ? C.white : undefined}}
						/>
					) : (
						<Pendiente item={item} tint={tint} kind={kind} />
					)}
				</div>
			</div>
			{kind === 'stamp' ? <Perforado w={w * scale} h={h * scale} /> : null}
			{showFicha && (item.sub || item.year) ? (
				<Ficha title={item.label} sub={item.sub} year={item.year} style={{position: 'absolute', left: 24 * scale, bottom: -54, fontSize: 18, minWidth: 260, maxWidth: Math.max(340, w * scale + 60)}} />
			) : null}
		</div>
	);
};

/* Hueco para foto de archivo pendiente: semitonos + descripción */
const Pendiente: React.FC<{item: StickerItem; tint: string; kind: string}> = ({item, tint, kind}) => (
	<AbsoluteFill
		style={{
			background: `radial-gradient(circle, ${tint} 1.6px, transparent 2px) 0 0 / 11px 11px, ${C.paperDark}`,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			flexDirection: 'column',
			textAlign: 'center',
			padding: 18,
		}}
	>
		<div style={{fontFamily: fontMono, fontSize: 15, letterSpacing: 2, background: C.ink, color: C.white, padding: '4px 10px', marginBottom: 10}}>
			{({bill: 'MUESTRA · SIN VALOR', portrait: 'RETRATO DE ARCHIVO', cover: 'PORTADA', poster: 'CARTEL', logo: 'LOGOTIPO', stamp: 'ESTAMPILLA', coin: 'MONEDA'} as Record<string, string>)[kind] ?? 'FOTO DE ARCHIVO'}
		</div>
		<div style={{fontFamily: fontDisplay, fontSize: kind === 'portrait' || kind === 'stamp' ? 30 : 40, lineHeight: 1.05, color: C.ink, background: `${C.white}cc`, padding: '6px 10px'}}>{item.label}</div>
	</AbsoluteFill>
);

const Perforado: React.FC<{w: number; h: number}> = ({w, h}) => (
	<svg width={w + 16} height={h + 16} style={{position: 'absolute', left: -8, top: -8, pointerEvents: 'none'}}>
		{Array.from({length: Math.floor(w / 18)}).map((_, i) => (
			<React.Fragment key={i}>
				<circle cx={8 + 9 + i * 18} cy={8} r={6} fill={C.paper} />
				<circle cx={8 + 9 + i * 18} cy={h + 8} r={6} fill={C.paper} />
			</React.Fragment>
		))}
		{Array.from({length: Math.floor(h / 18)}).map((_, i) => (
			<React.Fragment key={i}>
				<circle cx={8} cy={8 + 9 + i * 18} r={6} fill={C.paper} />
				<circle cx={w + 8} cy={8 + 9 + i * 18} r={6} fill={C.paper} />
			</React.Fragment>
		))}
	</svg>
);

/* ---------- Flecha dibujada a mano (12 fps) ---------- */
export const HandArrow: React.FC<{startFrame: number; d: string; color?: string; width?: number; height?: number; style?: React.CSSProperties}> = ({
	startFrame,
	d,
	color = C.ink,
	width = 300,
	height = 200,
	style,
}) => {
	const frame = useCurrentFrame();
	const prog = interpolate(frame - startFrame, [0, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
	return (
		<svg width={width} height={height} style={{position: 'absolute', overflow: 'visible', ...style}}>
			<path d={d} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog} />
		</svg>
	);
};

export const Kicker: React.FC<{text: string; color?: string; style?: React.CSSProperties}> = ({text, color = C.ink, style}) => (
	<div style={{fontFamily: fontMono, fontSize: 26, letterSpacing: 4, textTransform: 'uppercase', color, ...style}}>{text}</div>
);
