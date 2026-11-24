import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, random, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, fontDisplay, fontMono, fontSans, fontOp} from '../theme';
import {roughPolygon} from './base';
import {CartelVestirScene, GestaltScene, MetroMScene, MuseografiaScene, NetworkScene, StationsScene} from './scenes';

/* =====================================================================================
   TABLERO DE COLLAGE: un lienzo grande por capítulo y una cámara que se desliza entre zonas.
   Estética: collage de archivo (papel, cinta, recortes, notas a mano en rojo) + lenguaje
   gráfico de México 68 (líneas concéntricas, rotulación de líneas paralelas, colores de boleto).
   ===================================================================================== */

export const CANVAS = {w: 6000, h: 3500};
const ROJO = '#D7262E';
const MARKER = 'Permanent Marker';
const CAVEAT = 'Caveat';
const OSWALD = 'Oswald';
const TYPE = 'Special Elite';
const M68 = ['#E4007C', '#009FDA', '#7AB800', '#F7A600', '#F26B1D'];

type Cam = {at: number; x: number; y: number; z: number; dur?: number};
export type BoardItem = {
	type: string;
	x: number;
	y: number;
	w?: number;
	h?: number;
	rot?: number;
	at?: number | null; // segundo absoluto en que aparece (sin "at" = visible desde el inicio)
	from?: 'left' | 'right' | 'top' | 'bottom' | 'drop';
	z?: number; // orden de apilado
	[k: string]: unknown;
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* ---------- Cámara: viajes suaves entre paradas + deriva leve permanente ---------- */
type Golpe = {at: number; fuerza: number; sacude?: boolean};
const useCam = (t0: number, cams: Cam[], golpes: Golpe[] = []) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = t0 + frame / fps;
	const cs = cams.map((c, i) => (c.at == null && i === 0 ? {...c, at: t0} : c)).filter((c) => c.at != null).sort((a, b) => a.at - b.at);
	let cur = cs[0];
	let x = cur.x, y = cur.y, z = cur.z;
	for (let i = 1; i < cs.length; i++) {
		const c = cs[i];
		const dur = c.dur ?? Math.min(1.3, Math.max(0.75, 0.6 + Math.hypot(c.x - cur.x, c.y - cur.y) / 3500));
		if (t >= c.at) {
			const p = interpolate(t, [c.at, c.at + dur], [0, 1], {...clamp, easing: Easing.bezier(0.8, 0, 0.2, 1)});
			x = cur.x + (c.x - cur.x) * p;
			y = cur.y + (c.y - cur.y) * p;
			// la cámara se aleja un poco a mitad del viaje (sensación de recorrido)
			const lift = Math.sin(p * Math.PI) * 0.12 * Math.min(1, Math.hypot(c.x - cur.x, c.y - cur.y) / 1500);
			z = (cur.z + (c.z - cur.z) * p) * (1 - lift);
			if (p >= 1) cur = c;
		}
	}
	// deriva leve: acercamiento lento y vaivén suave
	const since = t - (cur.at ?? t0);
	z *= 1 + Math.min(since, 12) * 0.004;
	x += Math.sin(t * 0.35) * 14;
	y += Math.cos(t * 0.27) * 9;
	// golpes al ritmo: empujón de zoom que decae + sacudida breve en los golpes fuertes
	let shx = 0, shy = 0;
	for (const g of golpes) {
		const dt = t - g.at;
		if (dt < 0 || dt > 0.8) continue;
		z *= 1 + g.fuerza * Math.exp(-dt * 7) * Math.min(1, dt * 30);
		if (g.sacude && dt < 0.25) {
			const k = (1 - dt / 0.25) * 9;
			shx += Math.sin(dt * 140) * k;
			shy += Math.cos(dt * 120) * k * 0.7;
		}
	}
	// velocidad (para el desenfoque de movimiento en los viajes)
	const tp = t - 1 / fps;
	let vx = 0;
	for (let i = 1; i < cs.length; i++) {
		const c = cs[i], prev = cs[i - 1];
		const dur = c.dur ?? Math.min(1.3, Math.max(0.75, 0.6 + Math.hypot(c.x - prev.x, c.y - prev.y) / 3500));
		if (t >= c.at && t <= c.at + dur) {
			const e = (tt: number) => Easing.bezier(0.8, 0, 0.2, 1)(Math.max(0, Math.min(1, (tt - c.at) / dur)));
			vx = Math.hypot(c.x - prev.x, c.y - prev.y) * (e(t) - e(tp));
		}
	}
	return {x: x + shx, y: y + shy, z, t, v: vx};
};

/* ---------- Entrada animada de cada pieza ---------- */
const useEntrada = (it: BoardItem, t0: number) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (it.at == null) return {vis: true, style: {}};
	const st = Math.round((it.at - t0) * fps);
	const f = frame - st;
	if (f < 0) return {vis: false, style: {}};
	const p = interpolate(f, [0, 18], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.15))});
	const o = interpolate(f, [0, 6], [0, 1], clamp);
	const d = it.from ?? (['left', 'right', 'top', 'bottom', 'drop'] as const)[Math.floor(random(`${it.x}${it.y}`) * 5)];
	const off = (1 - p) * 120;
	const tr = d === 'left' ? `${-off}px 0px` : d === 'right' ? `${off}px 0px` : d === 'top' ? `0px ${-off}px` : d === 'bottom' ? `0px ${off}px` : '0px 0px';
	const sc = d === 'drop' ? 1.25 - 0.25 * p : 0.92 + 0.08 * p;
	return {vis: true, style: {opacity: o, translate: tr, scale: String(sc)} as React.CSSProperties, f};
};

const useDraw = (it: BoardItem, t0: number, frames = 14) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (it.at == null) return 1;
	return interpolate(frame - Math.round((it.at - t0) * fps), [0, frames], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
};

/* ---------- Materiales ---------- */

const Papel: React.FC<{it: BoardItem}> = ({it}) => {
	const w = it.w ?? 900, h = it.h ?? 1200, v = (it.variant as string) ?? 'page';
	const seed = `${it.x}-${it.y}`;
	const bg =
		v === 'kraft'
			? '#C59B66'
			: v === 'grid'
				? '#F7F5EF'
				: v === 'yellow'
					? '#E9C64A'
					: v === 'black'
						? '#1A1714'
						: '#EFE6D3';
	return (
		<div style={{width: w, height: h}}>
			<div style={{width: '100%', height: '100%', background: bg, clipPath: roughPolygon(seed, v === 'torn' ? 3 : 0.9, 12), position: 'relative', overflow: 'hidden'}}>
				{v === 'kraft' ? (
					<AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(8deg, rgba(90,60,30,0.10) 0 2px, transparent 2px 9px), radial-gradient(circle at 30% 20%, rgba(255,255,255,0.18), transparent 60%)'}} />
				) : null}
				{v === 'grid' ? (
					<AbsoluteFill style={{backgroundImage: 'linear-gradient(#9DB8D433 2px, transparent 2px), linear-gradient(90deg, #9DB8D433 2px, transparent 2px)', backgroundSize: '44px 44px'}} />
				) : null}
				{v === 'page' || v === 'torn' ? (
					<div style={{position: 'absolute', inset: '70px 60px', display: 'flex', flexDirection: 'column', gap: 18}}>
						<div style={{fontFamily: TYPE, fontSize: 30, color: '#6b6256'}}>{String(it.page ?? 298)}</div>
						{Array.from({length: Math.floor((h - 160) / 34)}).map((_, i) => (
							<div key={i} style={{height: 10, width: `${70 + random(seed + i) * 28}%`, background: 'rgba(60,50,40,0.16)', borderRadius: 3}} />
						))}
					</div>
				) : null}
			</div>
		</div>
	);
};

const Cinta: React.FC<{it: BoardItem}> = ({it}) => (
	<div
		style={{
			width: it.w ?? 220,
			height: it.h ?? 64,
			background: 'rgba(232, 220, 180, 0.78)',
			clipPath: 'polygon(0 8%, 4% 0, 9% 10%, 14% 0, 100% 4%, 97% 50%, 100% 96%, 92% 100%, 86% 90%, 80% 100%, 0 96%, 3% 50%)',
			boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
			backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.14) 0 3px, transparent 3px 7px)',
		}}
	/>
);

/* Foto / portada / recorte. Sin src muestra un hueco de archivo con semitono. */
const Foto: React.FC<{it: BoardItem; t0: number}> = ({it, t0}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const w = it.w ?? 600, h = it.h ?? 450;
	const src = it.src as string | undefined;
	const cutout = Boolean(it.cutout);
	const border = (it.border as number | undefined) ?? (cutout ? 0 : 16);
	const kb = interpolate(frame - Math.round(((it.at ?? t0) - t0) * fps), [0, 14 * fps], [1, 1.07], clamp); // Ken Burns
	const bw = Boolean(it.bw);
	const seed = `${it.x}${it.y}`;
	if (cutout && src)
		return <Img src={staticFile(src)} style={{width: w, height: h, objectFit: 'contain'}} />;
	return (
		<div style={{width: w, height: h}}>
			<div style={{width: '100%', height: '100%', background: '#FBF8F1', padding: border, boxSizing: 'border-box', clipPath: roughPolygon(seed, 1.1, 10)}}>
				<div style={{width: '100%', height: '100%', overflow: 'hidden', position: 'relative', background: '#D9CFBD'}}>
					{src ? (
						<Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: (it.fit as 'cover' | 'contain') ?? 'cover', scale: String(kb), filter: bw ? 'grayscale(1) contrast(1.15)' : 'saturate(0.92) contrast(1.04)'}} />
					) : (
						<AbsoluteFill
							style={{
								background: 'radial-gradient(circle, rgba(40,34,28,0.55) 2px, transparent 2.6px) 0 0 / 11px 11px, linear-gradient(160deg, #CFC6B6, #A99F8F)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexDirection: 'column',
								textAlign: 'center',
								padding: 24,
							}}
						>
							<div style={{fontFamily: fontMono, fontSize: 22, letterSpacing: 3, background: C.ink, color: '#fff', padding: '4px 12px', marginBottom: 12}}>{String(it.tag ?? 'FOTO DE ARCHIVO')}</div>
							<div style={{fontFamily: fontDisplay, fontSize: Math.max(30, Math.min(64, w / 11)), lineHeight: 1.05, color: C.ink, background: 'rgba(251,248,241,0.85)', padding: '6px 12px'}}>{String(it.label ?? '')}</div>
						</AbsoluteFill>
					)}
					{bw || it.halftone ? (
						<AbsoluteFill style={{backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.22) 1.3px, transparent 1.6px)', backgroundSize: '7px 7px', mixBlendMode: 'multiply'}} />
					) : null}
				</div>
			</div>
		</div>
	);
};

/* Nota a mano en rojo (se escribe de izquierda a derecha) */
const Mano: React.FC<{it: BoardItem; t0: number}> = ({it, t0}) => {
	const p = useDraw(it, t0, 16);
	const font = it.font === 'caveat' ? CAVEAT : MARKER;
	return (
		<div
			style={{
				fontFamily: font,
				fontSize: (it.size as number) ?? 90,
				color: (it.color as string) ?? ROJO,
				lineHeight: 1,
				whiteSpace: 'pre',
				clipPath: `inset(-20% ${(1 - p) * 100}% -20% -5%)`,
				textDecoration: it.underline ? 'underline' : undefined,
				textDecorationThickness: 6,
				textUnderlineOffset: 10,
			}}
		>
			{String(it.text)}
		</div>
	);
};

/* Flecha dibujada a mano: path en coordenadas locales */
const Flecha: React.FC<{it: BoardItem; t0: number}> = ({it, t0}) => {
	const p = useDraw(it, t0, 14);
	const d = it.d as string;
	const w = it.w ?? 400, h = it.h ?? 300;
	const color = (it.color as string) ?? ROJO;
	const head = (it.head as string) ?? '';
	return (
		<svg width={w} height={h} style={{overflow: 'visible'}}>
			<path d={d} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
			{head ? <path d={head} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={p > 0.9 ? 1 : 0} /> : null}
		</svg>
	);
};

/* Círculo a mano (dos vueltas imperfectas) */
const Circulo: React.FC<{it: BoardItem; t0: number}> = ({it, t0}) => {
	const p = useDraw(it, t0, 16);
	const w = it.w ?? 400, h = it.h ?? 300;
	const rx = w / 2, ry = h / 2;
	const d = `M ${w * 0.15} ${h * 0.22} C ${w * 0.45} ${-h * 0.08}, ${w * 1.05} ${h * 0.05}, ${w * 0.98} ${h * 0.5} C ${w * 0.95} ${h * 0.95}, ${w * 0.25} ${h * 1.05}, ${w * 0.04} ${h * 0.6} C ${-w * 0.06} ${h * 0.3}, ${w * 0.35} ${h * 0.02}, ${w * 0.62} ${h * 0.06}`;
	return (
		<svg width={w} height={h} style={{overflow: 'visible'}} data-r={rx + ry}>
			<path d={d} fill="none" stroke={(it.color as string) ?? ROJO} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
		</svg>
	);
};

const Asterisco: React.FC<{it: BoardItem}> = ({it}) => (
	<svg width={it.w ?? 90} height={it.w ?? 90} viewBox="0 0 100 100">
		<path d="M50 8 L52 92 M12 30 L88 72 M88 28 L12 70" stroke={(it.color as string) ?? C.ink} strokeWidth={11} strokeLinecap="round" />
	</svg>
);

/* Etiqueta con resaltador amarillo (p. ej. Los llamados "moneros") */
const Etiqueta: React.FC<{it: BoardItem; t0: number}> = ({it, t0}) => {
	const p = useDraw(it, t0, 16);
	const parts = String(it.text).split(/(\*\*[^*]+\*\*)/);
	return (
		<div style={{fontFamily: (it.font as string) === 'display' ? fontDisplay : fontSans, fontWeight: 700, fontSize: (it.size as number) ?? 64, color: C.ink, background: it.bg === false ? undefined : 'rgba(251,248,241,0.95)', padding: '10px 26px', boxShadow: it.bg === false ? undefined : '0 6px 14px rgba(0,0,0,0.18)', whiteSpace: 'pre'}}>
			{parts.map((s, i) =>
				s.startsWith('**') ? (
					<span key={i} style={{backgroundImage: 'linear-gradient(#F4E33B, #F4E33B)', backgroundSize: `${p * 100}% 78%`, backgroundPosition: '0 70%', backgroundRepeat: 'no-repeat', padding: '0 6px'}}>
						{s.slice(2, -2)}
					</span>
				) : (
					<span key={i}>{s}</span>
				),
			)}
		</div>
	);
};

const Tag: React.FC<{it: BoardItem}> = ({it}) => (
	<div style={{fontFamily: fontMono, fontSize: (it.size as number) ?? 30, letterSpacing: 3, border: `3px solid ${C.ink}`, padding: '6px 16px', color: C.ink, background: 'rgba(251,248,241,0.9)'}}>{String(it.text ?? 'ARCHIVO')}</div>
);

/* Ficha mecanografiada (RIUS / Eduardo del Río / Caricaturista) */
const Ficha: React.FC<{it: BoardItem}> = ({it}) => (
	<div style={{background: '#F4EEDF', padding: '20px 28px', fontFamily: TYPE, color: C.ink, boxShadow: '0 8px 16px rgba(0,0,0,0.22)', borderLeft: `10px solid ${(it.color as string) ?? M68[0]}`, maxWidth: it.w ?? 520}}>
		<div style={{fontSize: 44, fontWeight: 700, letterSpacing: 1}}>{String(it.title)}</div>
		{it.sub ? <div style={{fontSize: 30, marginTop: 6, lineHeight: 1.25}}>{String(it.sub)}</div> : null}
		{it.year ? <div style={{fontSize: 30, marginTop: 6, color: ROJO}}>{String(it.year)}</div> : null}
	</div>
);

/* Rotulación estilo MEXICO68 (líneas paralelas) */
const Rotulo68: React.FC<{it: BoardItem; t0: number}> = ({it, t0}) => {
	const p = useDraw(it, t0, 18);
	return (
		<div style={{fontFamily: fontOp, fontSize: (it.size as number) ?? 200, lineHeight: 1, color: (it.color as string) ?? C.ink, clipPath: `inset(-10% ${(1 - p) * 100}% -10% 0)`, whiteSpace: 'pre', background: it.bg ? String(it.bg) : undefined, padding: it.bg ? '10px 34px 18px' : undefined}}>
			{String(it.text)}
		</div>
	);
};

/* Bloque op art: anillos concéntricos animados (lenguaje de México 68) */
const OpArt: React.FC<{it: BoardItem}> = ({it}) => {
	const frame = useCurrentFrame();
	const w = it.w ?? 800, h = it.h ?? 600;
	const color = (it.color as string) ?? M68[0];
	const n = Math.ceil(Math.max(w, h) / 26);
	const off = (frame * 0.7) % 26;
	return (
		<svg width={w} height={h} style={{overflow: 'hidden', background: (it.bg as string) ?? 'transparent'}}>
			{Array.from({length: n}).map((_, i) => {
				const r = 10 + i * 26 + off;
				return <rect key={i} x={w / 2 - r * 1.5} y={h / 2 - r} width={r * 3} height={r * 2} rx={r} fill="none" stroke={color} strokeWidth={10} />;
			})}
		</svg>
	);
};

/* Pictogramas en losetas (estilo de los boletos y señalética de México 68) */
const Picto: React.FC<{name: string; color: string}> = ({name, color}) => {
	const s = {fill: 'none', stroke: '#fff', strokeWidth: 10, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
	return (
		<svg viewBox="0 0 200 200" width="100%" height="100%">
			<rect width="200" height="200" rx="14" fill={color} />
			{name === 'box' ? (
				<g {...s}>
					<path d="M60 120 C50 70 80 45 115 50 C150 55 160 90 145 120 Z" fill="#fff" />
					<path d="M65 120 h80 v30 h-80 z" />
				</g>
			) : null}
			{name === 'bici' ? (
				<g {...s}>
					<circle cx="60" cy="125" r="32" />
					<circle cx="140" cy="125" r="32" />
					<path d="M60 125 L90 80 L125 80 L140 125 M90 80 L100 125 L125 80 M82 66 h20" />
				</g>
			) : null}
			{name === 'aro' ? (
				<g {...s}>
					<rect x="55" y="40" width="90" height="60" />
					<ellipse cx="100" cy="112" rx="32" ry="8" />
					<path d="M70 112 L82 160 M130 112 L118 160 M100 120 L100 160 M86 136 h28" />
				</g>
			) : null}
			{name === 'balon' ? (
				<g {...s}>
					<circle cx="100" cy="100" r="58" />
					<path d="M100 62 L132 85 L120 122 L80 122 L68 85 Z" fill="#fff" />
				</g>
			) : null}
			{name === 'figura' ? (
				<g {...s}>
					<circle cx="100" cy="48" r="16" />
					<path d="M100 66 L100 120 M100 82 L65 105 M100 82 L140 66 M100 120 L72 165 M100 120 L132 160" />
				</g>
			) : null}
		</svg>
	);
};

const Pictos: React.FC<{it: BoardItem; t0: number}> = ({it, t0}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const list = (it.items as {name: string; at?: number}[]) ?? [];
	const size = (it.size as number) ?? 240;
	return (
		<div style={{display: 'flex', gap: 34, flexWrap: 'wrap', width: it.w}}>
			{list.map((pc, i) => {
				const st = pc.at != null ? Math.round((pc.at - t0) * fps) : 0;
				const p = interpolate(frame - st, [0, 14], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
				return (
					<div key={i} style={{width: size, height: size, scale: String(p), rotate: `${(random(pc.name + i) - 0.5) * 8}deg`, filter: 'drop-shadow(8px 14px 10px rgba(30,20,10,0.35))'}}>
						<Picto name={pc.name} color={['#3A3330', '#7A5230', '#1A1714'][i % 3]} />
					</div>
				);
			})}
		</div>
	);
};

/* Año gigante con rotulación de líneas */
const Anio: React.FC<{it: BoardItem; t0: number}> = ({it, t0}) => {
	const p = useDraw(it, t0, 20);
	return (
		<div style={{fontFamily: fontOp, fontSize: (it.size as number) ?? 420, lineHeight: 0.9, color: (it.color as string) ?? M68[0], clipPath: `inset(-10% ${(1 - p) * 100}% -10% 0)`}}>{String(it.text)}</div>
	);
};

/* Escenas especiales incrustadas en el tablero (se renderizan en una caja 1920x1080) */
const EMBED: Record<string, React.FC<any>> = {metroM: MetroMScene, gestalt: GestaltScene, stations: StationsScene, network: NetworkScene, museografia: MuseografiaScene, cartelVestir: CartelVestirScene};
const Incrustada: React.FC<{it: BoardItem; t0: number}> = ({it, t0}) => {
	const {fps} = useVideoConfig();
	const Comp = EMBED[it.scene as string];
	const w = it.w ?? 1920;
	const lw = (it.sceneW as number | undefined) ?? 1920; // tamaño lógico de la escena (por defecto 1920x1080)
	const lh = (it.sceneH as number | undefined) ?? 1080;
	const st = Math.round(((it.at ?? t0) - t0) * fps);
	return (
		<div style={{width: w, height: (w * lh) / lw, overflow: 'hidden', position: 'relative'}}>
			<div style={{width: lw, height: lh, scale: String(w / lw), transformOrigin: '0 0', position: 'absolute'}}>
				<Sequence from={st} layout="none">
					<Comp t0={it.at ?? t0} {...((it.props as object) ?? {})} />
				</Sequence>
			</div>
		</div>
	);
};

const RENDER: Record<string, React.FC<{it: BoardItem; t0: number}>> = {
	paper: ({it}) => <Papel it={it} />,
	tape: ({it}) => <Cinta it={it} />,
	photo: Foto,
	hand: Mano,
	arrow: Flecha,
	circle: Circulo,
	asterisk: ({it}) => <Asterisco it={it} />,
	label: Etiqueta,
	tag: ({it}) => <Tag it={it} />,
	ficha: ({it}) => <Ficha it={it} />,
	rotulo: Rotulo68,
	opart: ({it}) => <OpArt it={it} />,
	pictos: Pictos,
	year: Anio,
	embed: Incrustada,
};

// Capas de profundidad por tipo (0 = fondo, 3 = encima de todo)
const PROF: Record<string, number> = {paper: 0.3, opart: 0, embed: 0.4, rotulo: 1, year: 1, photo: 1.6, pictos: 1.6, label: 2, ficha: 2, tag: 2, tape: 2.6, hand: 2.4, arrow: 2.4, circle: 2.4, asterisk: 2.4};
type CamT = {x: number; y: number; z: number; t: number};

const Pieza: React.FC<{it: BoardItem; t0: number; cam: CamT}> = ({it, t0, cam}) => {
	const e = useEntrada(it, t0);
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (!e.vis) return null;
	const R = RENDER[it.type];
	if (!R) return null;
	const d = (it.depth as number | undefined) ?? (it.type === 'photo' && it.cutout ? 2 : PROF[it.type] ?? 1);
	const w = it.w ?? 400, h = it.h ?? 300;
	const cx = it.x + w / 2, cy = it.y + h / 2;
	// parallax: las capas altas se desplazan más con la cámara
	const k = (d - 1) * 0.045;
	const px = (cx - cam.x) * k, py = (cy - cam.y) * k;
	// caída al entrar: la pieza "aterriza" (sombra grande -> normal)
	const since = it.at == null ? 999 : frame - Math.round((it.at - t0) * fps);
	const lift = interpolate(since, [0, 18], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const alt = d + lift * 3; // altura efectiva
	const shadow = d < 0.2 ? 'none' : `drop-shadow(${(4 + alt * 7).toFixed(1)}px ${(6 + alt * 10).toFixed(1)}px ${(6 + alt * 9).toFixed(1)}px rgba(25,15,5,${(0.18 + alt * 0.06).toFixed(2)}))`;
	// inclinación 3D según la posición respecto a la cámara + flotación leve
	const ry = Math.max(-7, Math.min(7, ((cx - cam.x) / 960) * 5 * Math.min(1, d)));
	const rx = Math.max(-6, Math.min(6, ((cam.y - cy) / 540) * 4 * Math.min(1, d)));
	const fl = Math.sin(cam.t * 0.8 + (random(`${it.x}f${it.y}`) * 6)) * 2.5 * Math.max(0, d - 1);
	const sc = 1 + lift * 0.06;
	return (
		<div
			style={{
				position: 'absolute',
				left: it.x,
				top: it.y,
				zIndex: it.z ?? 1,
				translate: `${px.toFixed(1)}px ${(py + fl).toFixed(1)}px`,
				filter: shadow,
			}}
		>
			<div style={{rotate: `${it.rot ?? 0}deg`, transform: `perspective(1600px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${sc.toFixed(3)})`, ...e.style}}>
				<R it={it} t0={t0} />
			</div>
		</div>
	);
};

/* ---------- Barra inferior del capítulo (negro + amarillo, rótulo condensado) ---------- */
export const BarraCapitulo: React.FC<{era: string; title: string; t0: number; showAt?: number}> = ({era, title, t0, showAt}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const st = Math.round(((showAt ?? t0 + 0.6) - t0) * fps);
	const p = interpolate(frame - st, [0, 16], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	if (p <= 0) return null;
	return (
		<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 118, translate: `0px ${(1 - p) * 130}px`, display: 'flex', alignItems: 'stretch', fontFamily: OSWALD, fontWeight: 700}}>
			<div style={{background: '#E7B92E', flex: 1, display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', borderTop: `6px solid ${C.ink}`}}>
				{/* franjas finas, guiño a las líneas de México 68 */}
				<div style={{position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.07) 0 3px, transparent 3px 12px)'}} />
				<div style={{background: C.ink, color: '#E7B92E', height: '100%', display: 'flex', alignItems: 'center', padding: '0 34px', fontSize: 68, position: 'relative', whiteSpace: 'nowrap'}}>{era}</div>
				<div style={{width: 5, height: 70, background: C.ink, margin: '0 28px', position: 'relative'}} />
				<div style={{fontSize: 66, color: C.ink, letterSpacing: 1, textTransform: 'uppercase', position: 'relative', whiteSpace: 'nowrap'}}>{title}</div>
			</div>
		</div>
	);
};

/* ---------- Escena tablero ---------- */
export const BoardScene: React.FC<{t0: number; items: BoardItem[]; cams: Cam[]; era?: string; title?: string; barAt?: number}> = ({t0, items, cams, era, title, barAt}) => {
	const golpes: Golpe[] = items
		.filter((it) => it.at != null && ['photo', 'year', 'rotulo', 'label', 'pictos'].includes(it.type))
		.map((it) => ({at: it.at as number, fuerza: it.type === 'year' || it.type === 'rotulo' ? 0.035 : 0.018, sacude: it.type === 'year' || it.type === 'rotulo'}));
	const cam = useCam(t0, cams, golpes);
	const blur = Math.min(5, cam.v * 0.045);
	const tx = 960 - cam.x * cam.z;
	const ty = 540 - cam.y * cam.z;
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#E9E5DC'}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: CANVAS.w, height: CANVAS.h, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${cam.z})`, filter: blur > 0.6 ? `blur(${blur.toFixed(1)}px)` : undefined}}>
				<Img src={staticFile('img/papel_arrugado.jpg')} style={{position: 'absolute', inset: 0, width: CANVAS.w, height: CANVAS.h}} />
				<div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(120,140,160,0.10) 2px, transparent 2px), linear-gradient(90deg, rgba(120,140,160,0.10) 2px, transparent 2px)', backgroundSize: '60px 60px'}} />
				{[...items].sort((a, b) => (a.z ?? 1) - (b.z ?? 1)).map((it, i) => (
					<Pieza key={i} it={it} t0={t0} cam={cam} />
				))}
			</div>
			{era && title ? <BarraCapitulo era={era} title={title} t0={t0} showAt={barAt} /> : null}
		</AbsoluteFill>
	);
};
