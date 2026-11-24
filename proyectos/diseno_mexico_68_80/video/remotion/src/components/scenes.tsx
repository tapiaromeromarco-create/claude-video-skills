import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, random, staticFile} from 'remotion';
import {useCurrentFrame, useVideoConfig} from '../time';
import {Highlight} from '@remotion/rough-notation';
import {C, fontDisplay, fontMono, fontSans, fontSerif, fontOp, fontComic, useTema} from '../theme';
import {Ficha, HandArrow, Kicker, Paper, Sticker, StickerItem, usePop} from './base';

/* Todas las escenas reciben t0 (s) y anclas absolutas en segundos; convertimos a frames locales. */
type Base = {t0: number};
const useLocal = (t0: number) => {
	const {fps} = useVideoConfig();
	return (sec: number | undefined, fallback = 0) => Math.round(((sec ?? t0 + fallback) - t0) * fps);
};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* ============ Texto cinético con resaltador / tachado / acento serif ============ */
// Marcado: **texto** resaltado, ~~texto~~ tachado, __texto__ subrayado, _texto_ serif itálica.
type Token = {t: string; mode: 'plain' | 'hl' | 'strike' | 'ul' | 'serif'; key?: string};
const parse = (s: string): Token[] => {
	const re = /(\*\*[^*]+\*\*|~~[^~]+~~|__[^_]+__|_[^_]+_)/g;
	return s
		.split(re)
		.filter(Boolean)
		.map((p) => {
			if (p.startsWith('**')) return {t: p.slice(2, -2), mode: 'hl' as const, key: p.slice(2, -2)};
			if (p.startsWith('~~')) return {t: p.slice(2, -2), mode: 'strike' as const, key: p.slice(2, -2)};
			if (p.startsWith('__')) return {t: p.slice(2, -2), mode: 'ul' as const, key: p.slice(2, -2)};
			if (p.startsWith('_')) return {t: p.slice(1, -1), mode: 'serif' as const};
			return {t: p, mode: 'plain' as const};
		});
};

export type KineticProps = Base & {
	lines: string[];
	marks?: Record<string, number>; // segundo absoluto en que se dibuja cada marca
	lineAt?: number[]; // segundo absoluto en que aparece cada línea
	wordTimes?: (number | null)[][]; // segundo de cada palabra (sincronía con la voz)
	kicker?: string;
	size?: number;
	dark?: boolean;
	ficha?: {title: string; sub?: string; year?: string; at?: number};
	align?: 'left' | 'center';
};

/* Texto en bloques sólidos (como letreros y carteles de la época); cada palabra entra al decirse. */
export const KineticScene: React.FC<KineticProps> = ({t0, lines, marks = {}, lineAt = [], wordTimes = [], kicker, size = 96, ficha}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const T = useTema();
	const L = useLocal(t0);
	const drift = interpolate(frame, [0, 10 * fps], [0, -30], clamp);
	const tk = interpolate(frame, [0, 10], [0, 1], clamp);
	return (
		<AbsoluteFill style={{padding: '110px 140px', justifyContent: 'center', translate: `${drift}px 0px`}}>
			{kicker ? (
				<div style={{fontFamily: fontMono, fontSize: 28, letterSpacing: 5, textTransform: 'uppercase', color: T.acento, marginBottom: 26, opacity: tk}}>{kicker}</div>
			) : null}
			{lines.map((line, i) => {
				const wt = wordTimes[i] ?? [];
				const lineStart = L(lineAt[i] ?? (wt.find((x) => x != null) ?? undefined), i * 0.6);
				const bp = interpolate(frame - lineStart + 4, [0, 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
				let w = 0;
				return (
					<div key={i} style={{marginBottom: 14}}>
						<span
							style={{
								display: 'inline-block',
								background: T.bloque,
								color: T.textoBloque,
								fontFamily: fontDisplay,
								fontSize: size,
								lineHeight: 1.14,
								padding: '6px 26px 12px',
								clipPath: `inset(0 ${(1 - bp) * 100}% 0 0)`,
								maxWidth: 1640,
								boxShadow: `10px 10px 0 ${T.acento}`,
							}}
						>
							{parse(line).map((tok, j) => {
								const at = L(tok.key ? marks[tok.key] : undefined, i * 0.6 + 0.8);
								const prog = interpolate(frame, [at, at + Math.round(0.4 * fps)], [0, 1], clamp);
								const words = tok.t.split(/(\s+)/);
								const inner = words.map((wd, k) => {
									if (!wd.trim()) return <span key={k}>{wd}</span>;
									const tw = wt[w++];
									const st = tw != null ? L(tw) : lineStart + w * 3;
									const op = interpolate(frame - st, [-2, 5], [0, 1], clamp);
									return (
										<span key={k} style={{opacity: op, display: 'inline-block', translate: `0px ${(1 - op) * 18}px`}}>
											{wd}
										</span>
									);
								});
								if (tok.mode === 'hl')
									return (
										<span key={j} style={{backgroundImage: `linear-gradient(${T.marcador}, ${T.marcador})`, backgroundSize: `${prog * 100}% 100%`, backgroundRepeat: 'no-repeat', color: prog > 0.3 ? C.ink : T.textoBloque, padding: '0 8px'}}>
											{inner}
										</span>
									);
								if (tok.mode === 'strike')
									return (
										<span key={j} style={{backgroundImage: `linear-gradient(transparent 46%, ${T.acento === C.ink ? C.rosa : T.acento} 46%, ${T.acento === C.ink ? C.rosa : T.acento} 60%, transparent 60%)`, backgroundSize: `${prog * 100}% 100%`, backgroundRepeat: 'no-repeat', opacity: 1 - prog * 0.35}}>
											{inner}
										</span>
									);
								if (tok.mode === 'serif' || tok.mode === 'ul')
									return (
										<span key={j} style={{fontFamily: fontSerif, fontSize: size * 1.12, color: T.marcador}}>
											{inner}
										</span>
									);
								return <span key={j}>{inner}</span>;
							})}
						</span>
					</div>
				);
			})}
			{ficha ? <FichaPop t0={t0} {...ficha} /> : null}
		</AbsoluteFill>
	);
};

const FichaPop: React.FC<{t0: number; title: string; sub?: string; year?: string; at?: number}> = ({t0, title, sub, year, at}) => {
	const L = useLocal(t0);
	const {p, visible} = usePop(L(at, 1.2), title);
	if (!visible) return null;
	return (
		<div style={{marginTop: 40, scale: String(p), transformOrigin: 'left center'}}>
			<Ficha title={title} sub={sub} year={year} />
		</div>
	);
};

/* ============ Título principal: rotulación de líneas paralelas, como MEXICO68 ============ */
export const TitleScene: React.FC<Base & {credits?: string}> = ({credits}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const a = interpolate(frame, [0, 14], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const b = interpolate(frame, [10, 26], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const hl = interpolate(frame, [26, 40], [0, 1], clamp);
	const push = interpolate(frame, [0, 8 * fps], [1, 1.05], clamp);
	return (
		<AbsoluteFill style={{padding: '0 140px', justifyContent: 'center', scale: String(push)}}>
			<div style={{fontFamily: fontMono, fontSize: 28, letterSpacing: 6, color: C.rosa, opacity: a, marginBottom: 10}}>VIDEO-ENSAYO · DISEÑO GRÁFICO MEXICANO</div>
			<div style={{fontFamily: fontOp, fontSize: 168, lineHeight: 1.0, color: C.ink, opacity: a, translate: `${(1 - a) * -60}px 0px`}}>LA ÉPOCA</div>
			<div style={{fontFamily: fontOp, fontSize: 168, lineHeight: 1.0, color: C.rosa, opacity: a, translate: `${(1 - a) * 60}px 0px`}}>DE ORO</div>
			<div style={{fontFamily: fontSerif, fontSize: 92, color: C.ink, opacity: b, marginTop: 6}}>
				del diseño gráfico en{' '}
				<Highlight color={C.markerRGBA} progress={hl} iterations={1} padding={{left: 8, right: 8}}>
					México
				</Highlight>
			</div>
			<div style={{display: 'flex', gap: 30, alignItems: 'center', marginTop: 30, opacity: b}}>
				<div style={{fontFamily: fontOp, fontSize: 70, color: C.ink, background: C.white, padding: '4px 22px', boxShadow: `8px 8px 0 ${C.rosa}`}}>1968—1980</div>
				{credits ? <div style={{fontFamily: fontMono, fontSize: 30, color: C.inkSoft}}>{credits}</div> : null}
			</div>
		</AbsoluteFill>
	);
};

/* ============ Tarjeta de capítulo (tipografía y color de la época) ============ */
export const ChapterScene: React.FC<Base & {num: string; title: string; years: string; color?: string}> = ({num, title, years, color = C.metro}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const T = useTema();
	const wipe = interpolate(frame, [0, 12], [0, 100], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const t = interpolate(frame, [8, 22], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const bar = interpolate(frame, [18, 34], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const push = interpolate(frame, [0, 4 * fps], [1, 1.04], clamp);
	const comic = T.titulo === fontComic;
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{background: color, clipPath: `inset(0 ${100 - wipe}% 0 0)`}} />
			{comic ? (
				<AbsoluteFill style={{clipPath: `inset(0 ${100 - wipe}% 0 0)`, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.28) 3px, transparent 3.5px)', backgroundSize: '22px 22px'}} />
			) : (
				<svg width="1920" height="1080" style={{position: 'absolute', inset: 0, opacity: 0.18 * t, clipPath: `inset(0 ${100 - wipe}% 0 0)`}}>
					{Array.from({length: 18}).map((_, i) => (
						<rect key={i} x={1500 - i * 40} y={540 - i * 40} width={i * 80 + 40} height={i * 80 + 40} rx={i * 40} fill="none" stroke="#fff" strokeWidth={12} />
					))}
				</svg>
			)}
			<AbsoluteFill style={{padding: '0 150px', justifyContent: 'center', scale: String(push)}}>
				<div style={{fontFamily: fontOp, fontSize: 300, color: '#fff', opacity: 0.35 * t, position: 'absolute', right: 120, top: 70}}>{num}</div>
				<div style={{fontFamily: fontMono, fontSize: 30, letterSpacing: 6, color: '#fff', opacity: t, marginBottom: 20}}>CAPÍTULO {num}</div>
				<div
					style={{
						fontFamily: T.titulo,
						fontSize: T.titulo === fontOp ? 112 : comic ? 140 : 100,
						lineHeight: 1.04,
						color: '#fff',
						opacity: t,
						translate: `${(1 - t) * -50}px 0px`,
						maxWidth: 1450,
						textShadow: comic ? `6px 6px 0 ${C.ink}` : undefined,
						WebkitTextStroke: comic ? `3px ${C.ink}` : undefined,
						letterSpacing: comic ? 2 : undefined,
					}}
				>
					{title}
				</div>
				<div style={{height: 14, width: 560, background: C.ink, marginTop: 22, scale: `${bar} 1`, transformOrigin: 'left center'}} />
				<div style={{fontFamily: fontMono, fontSize: 40, color: C.ink, marginTop: 24, opacity: t, background: C.marker, alignSelf: 'flex-start', padding: '6px 16px'}}>{years}</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/* ============ Año gigante ============ */
export const YearScene: React.FC<Base & {year: string; caption?: string; captionAt?: number; color?: string; image?: StickerItem}> = ({t0, year, caption, captionAt, color = C.rosa, image}) => {
	const frame = useCurrentFrame();
	const L = useLocal(t0);
	const sf = frame;
	const digits = year.split('');
	const cp = interpolate(sf - L(captionAt, 0.8), [0, 6], [0, 1], clamp);
	return (
		<AbsoluteFill>
			<Paper />
			<AbsoluteFill style={{justifyContent: 'center', padding: '0 150px'}}>
				<div style={{display: 'flex'}}>
					{digits.map((d, i) => {
						const p = interpolate(sf - i * 2, [0, 6], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});
						return (
							<span key={i} style={{fontFamily: fontDisplay, fontSize: 340, lineHeight: 1, color: i % 2 ? C.ink : color, scale: String(p), display: 'inline-block', rotate: `${(random(year + i) - 0.5) * 6}deg`}}>
								{d}
							</span>
						);
					})}
				</div>
				{caption ? (
					<div style={{fontFamily: fontSans, fontWeight: 800, fontSize: 64, color: C.ink, opacity: cp, translate: `0px ${(1 - cp) * 20}px`, maxWidth: image ? 900 : 1500, marginTop: 10}}>
						{caption}
					</div>
				) : null}
			</AbsoluteFill>
			{image ? (
				<div style={{position: 'absolute', right: 150, top: 300}}>
					<Sticker item={image} startFrame={L(captionAt, 0.8)} seed={year + 'img'} kenBurns={0.06} />
				</div>
			) : null}
		</AbsoluteFill>
	);
};

/* ============ Collage de recortes ============ */
export type CollageItem = StickerItem & {at?: number; x: number; y: number; scale?: number; rotate?: number};
export const CollageScene: React.FC<Base & {items: CollageItem[]; title?: string; titleAt?: number; marks?: Record<string, number>}> = ({t0, items, title, titleAt}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const L = useLocal(t0);
	const tp = interpolate(frame - Math.min(L(titleAt, 0), Math.round(0.4 * fps)), [0, 6], [0, 1], clamp); // el título entra al inicio
	// cámara suave (parallax / Ken Burns del conjunto)
	const cam = interpolate(frame, [0, 12 * fps], [1, 1.06], clamp);
	return (
		<AbsoluteFill>
			<Paper />
			<AbsoluteFill style={{scale: String(cam)}}>
				{items.map((it, i) => (
					<div key={i} style={{position: 'absolute', left: it.x, top: it.y}}>
						<Sticker item={it} startFrame={L(it.at, i * 0.35)} seed={`${it.label}${i}`} scale={it.scale} rotate={it.rotate} kenBurns={0.08} />
					</div>
				))}
			</AbsoluteFill>
			{title ? (
				<div style={{position: 'absolute', left: 120, bottom: 90, opacity: tp, fontFamily: fontDisplay, fontSize: 64, lineHeight: 1.15, color: C.ink, maxWidth: 1400}}>
					<span style={{background: C.marker, padding: '4px 18px', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>{title}</span>
				</div>
			) : null}
		</AbsoluteFill>
	);
};

/* ============ Lista de nombres con retratos ============ */
export const NamesScene: React.FC<Base & {title: string; items: {name: string; sub?: string; at?: number; src?: string}[]; cols?: number}> = ({t0, title, items, cols = 3}) => {
	const frame = useCurrentFrame();
	const L = useLocal(t0);
	const tp = interpolate(frame, [0, 6], [0, 1], clamp);
	const cellW = 1600 / cols;
	return (
		<AbsoluteFill>
			<Paper />
			<div style={{position: 'absolute', left: 150, top: 90, fontFamily: fontDisplay, fontSize: 64, color: C.ink, opacity: tp}}>{title}</div>
			<div style={{position: 'absolute', left: 160, top: 210, width: 1600, display: 'flex', flexWrap: 'wrap', rowGap: 40}}>
				{items.map((it, i) => {
					const st = L(it.at, 0.6 + i * 0.5);
					const hl = interpolate(frame, [st + 4, st + 16], [0, 1], clamp);
					return (
						<div key={i} style={{width: cellW, display: 'flex', alignItems: 'center', gap: 22}}>
							<Sticker item={{kind: 'portrait', label: it.name, src: it.src}} startFrame={st} seed={it.name} scale={items.length > 6 ? 0.5 : 0.62} showFicha={false} />
							{frame >= st ? (
								<div>
									<div style={{fontFamily: fontSans, fontWeight: 800, fontSize: 40, color: C.ink}}>
										<Highlight color={C.markerRGBA} progress={hl} iterations={1}>
											{it.name}
										</Highlight>
									</div>
									{it.sub ? <div style={{fontFamily: fontMono, fontSize: 22, color: C.inkSoft, marginTop: 6}}>{it.sub}</div> : null}
								</div>
							) : null}
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

/* ============ Lista con casillas (hoja de ruta) ============ */
export const ListScene: React.FC<Base & {title: string; items: {text: string; at?: number}[]}> = ({t0, title, items}) => {
	const frame = useCurrentFrame();
	const L = useLocal(t0);
	const sf = frame;
	return (
		<AbsoluteFill>
			<Paper />
			<AbsoluteFill style={{padding: '110px 160px', justifyContent: 'center'}}>
				<div style={{fontFamily: fontDisplay, fontSize: 72, color: C.ink, marginBottom: 36}}>{title}</div>
				<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px 60px'}}>
					{items.map((it, i) => {
						const st = L(it.at, 0.5 + i * 0.4);
						const p = interpolate(sf - st, [0, 6], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.5))});
						const chk = interpolate(frame - st, [4, 12], [0, 1], clamp);
						return (
							<div key={i} style={{display: 'flex', alignItems: 'center', gap: 22, opacity: p, translate: `${(1 - p) * -30}px 0px`, background: C.white, padding: '16px 24px', boxShadow: '0 5px 0 rgba(0,0,0,0.12)'}}>
								<svg width={52} height={52} viewBox="0 0 52 52">
									<rect x={3} y={3} width={46} height={46} rx={8} fill={chk > 0 ? C.metro : 'none'} stroke={C.metro} strokeWidth={4} />
									<path d="M13 27 L23 37 L40 16" fill="none" stroke={C.white} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - chk} />
								</svg>
								<span style={{fontFamily: fontSans, fontWeight: 800, fontSize: 46, color: C.ink}}>{it.text}</span>
							</div>
						);
					})}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/* ============ Op art: líneas que se expanden (inspirado en el estilo de México 68) ============ */
export const OpArtBand: React.FC<{opacity?: number; color?: string}> = ({opacity = 1, color = C.rosa}) => {
	const frame = useCurrentFrame();
	const n = 26;
	const off = (frame * 0.6) % 28;
	return (
		<svg width="1920" height="1080" style={{position: 'absolute', inset: 0, opacity}}>
			{Array.from({length: n}).map((_, i) => {
				const r = 40 + i * 28 + off;
				return <rect key={i} x={960 - r * 1.6} y={540 - r} width={r * 3.2} height={r * 2} rx={r} fill="none" stroke={color} strokeWidth={9} />;
			})}
		</svg>
	);
};

export const OpArtScene: React.FC<Base & {text?: string; textAt?: number; emblemAt?: number; showEmblem?: boolean; plus?: {a: string; b: string; at?: number}}> = ({t0, text, textAt, emblemAt, showEmblem = true, plus}) => {
	const frame = useCurrentFrame();
	const L = useLocal(t0);
	const sf = frame;
	const e = interpolate(sf - L(emblemAt, 0.3), [0, 8], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.4))});
	const tp = interpolate(sf - L(textAt, 1.5), [0, 6], [0, 1], clamp);
	const pp = interpolate(sf - L(plus?.at, 0.5), [0, 8], [0, 1], clamp);
	return (
		<AbsoluteFill>
			<Paper grid={false} />
			<OpArtBand opacity={0.85} />
			{showEmblem ? (
				<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
					<div style={{background: C.white, padding: '36px 50px', scale: String(e), boxShadow: '0 14px 30px rgba(0,0,0,0.25)', rotate: '-2deg'}}>
						<Img src={staticFile('img/mexico68_emblema.png')} style={{width: 980}} />
					</div>
				</AbsoluteFill>
			) : null}
			{plus ? (
				<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 50, opacity: pp}}>
					<div style={{fontFamily: fontDisplay, fontSize: 96, background: C.ink, color: C.white, padding: '10px 30px'}}>{plus.a}</div>
					<div style={{fontFamily: fontDisplay, fontSize: 140, color: C.ink}}>+</div>
					<div style={{fontFamily: fontDisplay, fontSize: 96, background: C.marker, color: C.ink, padding: '10px 30px'}}>{plus.b}</div>
				</AbsoluteFill>
			) : null}
			{text ? (
				<div style={{position: 'absolute', left: 0, right: 0, bottom: 110, textAlign: 'center', opacity: tp}}>
					<span style={{fontFamily: fontSans, fontWeight: 800, fontSize: 56, background: C.white, padding: '10px 26px', color: C.ink}}>{text}</span>
				</div>
			) : null}
		</AbsoluteFill>
	);
};

/* ============ Pictogramas deportivos (dibujo original, línea simple) ============ */
const Icon: React.FC<{name: string; color: string}> = ({name, color}) => {
	const s = {fill: 'none', stroke: C.white, strokeWidth: 10, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
	return (
		<svg viewBox="0 0 200 200" width="100%" height="100%">
			<rect width="200" height="200" rx="18" fill={color} />
			{name === 'box' ? (
				<g {...s}>
					<path d="M60 120 C50 70 80 45 115 50 C150 55 160 90 145 120 Z" fill={C.white} />
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
			{name === 'figura' ? (
				<g {...s}>
					<circle cx="100" cy="48" r="16" />
					<path d="M100 66 L100 120 M100 82 L65 105 M100 82 L140 66 M100 120 L72 165 M100 120 L132 160" />
				</g>
			) : null}
			{name === 'mundo' ? (
				<g {...s}>
					<circle cx="100" cy="100" r="62" />
					<ellipse cx="100" cy="100" rx="26" ry="62" />
					<path d="M40 100 h120 M50 70 h100 M50 130 h100" />
				</g>
			) : null}
		</svg>
	);
};

export const PictogramScene: React.FC<Base & {cross?: {at?: number}; icons: {name: string; label: string; at?: number}[]; caption?: string; captionAt?: number}> = ({t0, cross, icons, caption, captionAt}) => {
	const frame = useCurrentFrame();
	const L = useLocal(t0);
	const sf = frame;
	const colors = [C.rosa, C.metro, C.blue, C.ink];
	const crossP = interpolate(frame - L(cross?.at, 0.8), [0, 10], [0, 1], clamp);
	const cp = interpolate(sf - L(captionAt, 3), [0, 6], [0, 1], clamp);
	return (
		<AbsoluteFill>
			<Paper />
			<AbsoluteFill style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 60, paddingBottom: 80}}>
				{cross ? (
					<div style={{width: 300, height: 300, position: 'relative', opacity: interpolate(crossP, [0, 1], [1, 0.6])}}>
						<Icon name="figura" color={C.inkSoft} />
						<svg viewBox="0 0 300 300" width={300} height={300} style={{position: 'absolute', inset: 0}}>
							<path d="M20 20 L280 280 M280 20 L20 280" stroke={C.rosa} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - crossP} />
						</svg>
						<div style={{fontFamily: fontMono, fontSize: 24, textAlign: 'center', marginTop: 14, color: C.inkSoft}}>otras olimpiadas</div>
					</div>
				) : null}
				{icons.map((ic, i) => {
					const st = L(ic.at, 0.6 + i * 0.6);
					const p = interpolate(sf - st, [0, 6], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.8))});
					return (
						<div key={i} style={{width: 300, scale: String(p), rotate: `${(random(ic.name) - 0.5) * 6}deg`}}>
							<div style={{width: 300, height: 300}}>
								<Icon name={ic.name} color={colors[i % colors.length]} />
							</div>
							<div style={{fontFamily: fontSans, fontWeight: 800, fontSize: 34, textAlign: 'center', marginTop: 14, color: C.ink}}>{ic.label}</div>
						</div>
					);
				})}
			</AbsoluteFill>
			{caption ? (
				<div style={{position: 'absolute', left: 0, right: 0, bottom: 100, textAlign: 'center', opacity: cp}}>
					<span style={{fontFamily: fontSans, fontWeight: 800, fontSize: 50, background: C.marker, padding: '8px 24px', color: C.ink}}>{caption}</span>
				</div>
			) : null}
		</AbsoluteFill>
	);
};

/* ============ La "M" del Metro: rieles -> símbolo -> esquina redondeada ============ */
export const MetroMScene: React.FC<Base & {railsAt?: number; squareAt?: number; arrowAt?: number}> = ({t0, railsAt, squareAt, arrowAt}) => {
	const frame = useCurrentFrame();
	const L = useLocal(t0);
	const sf = frame;
	const r = interpolate(sf - L(railsAt, 0.3), [0, 14], [0, 1], clamp);
	const lg = interpolate(sf - L(squareAt, 3), [0, 8], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.3))});
	return (
		<AbsoluteFill>
			<Paper />
			<svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
				{[0, 1, 2, 3].map((i) => (
					<line key={i} x1={160} y1={300 + i * 70} x2={160 + 1600 * r} y2={300 + i * 70} stroke={C.ink} strokeWidth={i % 3 === 0 ? 14 : 6} opacity={0.6} />
				))}
				{Array.from({length: 20}).map((_, i) => (
					<line key={i} x1={200 + i * 80} y1={280} x2={200 + i * 80} y2={530} stroke={C.inkSoft} strokeWidth={10} opacity={r > i / 20 ? 0.35 : 0} />
				))}
			</svg>
			<Kicker text="rieles → símbolo" style={{position: 'absolute', left: 160, top: 200, opacity: r}} />
			<div style={{position: 'absolute', left: 700, top: 560, scale: String(lg), rotate: '-3deg', background: C.white, padding: 24, boxShadow: '0 12px 26px rgba(0,0,0,0.25)'}}>
				<Img src={staticFile('img/metro_logo.png')} style={{width: 420, height: 420, objectFit: 'contain'}} />
			</div>
			<HandArrow startFrame={L(arrowAt, 5)} d="M60 180 C 20 110, 60 30, 150 20" width={200} height={200} color={C.rosa} style={{left: 1200, top: 560}} />
			<div style={{position: 'absolute', left: 1240, top: 800, fontFamily: fontSerif, fontSize: 56, color: C.rosa, opacity: interpolate(sf - L(arrowAt, 5), [6, 12], [0, 1], clamp)}}>
				la esquina guía la vista
			</div>
		</AbsoluteFill>
	);
};

/* ============ Gestalt: figura-fondo (mismo ícono en positivo y negativo) ============ */
const Manzanas: React.FC<{fill: string}> = ({fill}) => (
	<g fill={fill}>
		{[
			[70, 75],
			[130, 75],
			[70, 135],
			[130, 135],
			[100, 105],
		].map(([x, y], i) => (
			<g key={i}>
				<circle cx={x - 9} cy={y} r={17} />
				<circle cx={x + 9} cy={y} r={17} />
				<rect x={x - 2} y={y - 30} width={4} height={14} />
			</g>
		))}
	</g>
);

export const GestaltScene: React.FC<Base & {text?: string; textAt?: number}> = ({t0, text, textAt}) => {
	const frame = useCurrentFrame();
	const L = useLocal(t0);
	const sf = frame;
	const a = interpolate(sf, [0, 8], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.5))});
	const b = interpolate(sf, [10, 18], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.5))});
	const tp = interpolate(sf - L(textAt, 3), [0, 6], [0, 1], clamp);
	return (
		<AbsoluteFill>
			<Paper />
			<div style={{position: 'absolute', left: 150, top: 110}}>
				<Kicker text="Leyes de la Gestalt" color={C.rosa} />
				<div style={{fontFamily: fontDisplay, fontSize: 96, lineHeight: 1.05, color: C.ink, marginTop: 12}}>
					figura <span style={{fontFamily: fontSerif, color: C.rosa, fontSize: 108}}>y</span> fondo
				</div>
			</div>
			<AbsoluteFill style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 120, paddingTop: 170}}>
				<div style={{textAlign: 'center', scale: String(a)}}>
					<svg width={380} height={380} viewBox="0 0 200 200">
						<path d="M0 0 H160 A40 40 0 0 1 200 40 V200 H0 Z" fill={C.metro} />
						<Manzanas fill={C.white} />
					</svg>
					<div style={{fontFamily: fontMono, fontSize: 28, marginTop: 12}}>la figura</div>
				</div>
				<div style={{fontFamily: fontDisplay, fontSize: 90, color: C.ink, opacity: b}}>⇄</div>
				<div style={{textAlign: 'center', scale: String(b)}}>
					<svg width={380} height={380} viewBox="0 0 200 200">
						<path d="M0 0 H160 A40 40 0 0 1 200 40 V200 H0 Z" fill={C.white} stroke={C.metro} strokeWidth={6} />
						<Manzanas fill={C.metro} />
					</svg>
					<div style={{fontFamily: fontMono, fontSize: 28, marginTop: 12}}>el fondo</div>
				</div>
			</AbsoluteFill>
			{text ? (
				<div style={{position: 'absolute', left: 0, right: 0, bottom: 80, textAlign: 'center', opacity: tp}}>
					<span style={{fontFamily: fontSans, fontWeight: 800, fontSize: 48, background: C.marker, padding: '8px 24px'}}>{text}</span>
				</div>
			) : null}
		</AbsoluteFill>
	);
};

/* ============ Íconos de estación (dibujo propio, inspirado en el sistema) ============ */
const Station: React.FC<{name: string; kind: 'chapulin' | 'manzana' | 'pendiente'; color: string}> = ({name, kind, color}) => (
	<div style={{textAlign: 'center'}}>
		<svg width={320} height={320} viewBox="0 0 200 200">
			<path d="M0 0 H160 A40 40 0 0 1 200 40 V200 H0 Z" fill={color} />
			{kind === 'manzana' ? (
				<g fill={C.white}>
					{[
						[70, 75],
						[130, 75],
						[70, 135],
						[130, 135],
						[100, 105],
					].map(([x, y], i) => (
						<g key={i}>
							<circle cx={x - 9} cy={y} r={17} />
							<circle cx={x + 9} cy={y} r={17} />
							<rect x={x - 2} y={y - 30} width={4} height={14} />
						</g>
					))}
				</g>
			) : null}
			{kind === 'chapulin' ? (
				<g fill={C.white} stroke={C.white} strokeLinecap="round">
					<ellipse cx="95" cy="110" rx="52" ry="22" />
					<circle cx="150" cy="98" r="18" />
					<path d="M70 115 L45 160 M100 120 L90 165 M125 105 L150 160 M150 85 L175 50 M145 85 L160 45" strokeWidth={8} fill="none" />
				</g>
			) : null}
			{kind === 'pendiente' ? <text x="100" y="115" textAnchor="middle" fontFamily={fontDisplay} fontSize="70" fill={C.white}>?</text> : null}
		</svg>
		<div style={{fontFamily: fontSans, fontWeight: 800, fontSize: 38, color: C.ink, marginTop: 10}}>{name}</div>
	</div>
);

export const StationsScene: React.FC<Base & {items: {name: string; kind: 'chapulin' | 'manzana' | 'pendiente'; at?: number}[]; note?: string}> = ({t0, items, note}) => {
	const L = useLocal(t0);
	return (
		<AbsoluteFill>
			<Paper />
			<AbsoluteFill style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 80}}>
				{items.map((it, i) => (
					<PopWrap key={i} start={L(it.at, 0.5 + i * 0.7)} seed={it.name}>
						<Station name={it.name} kind={it.kind} color={C.metro} />
					</PopWrap>
				))}
			</AbsoluteFill>
			{note ? <div style={{position: 'absolute', right: 120, bottom: 70, fontFamily: fontMono, fontSize: 20, color: C.inkSoft}}>{note}</div> : null}
		</AbsoluteFill>
	);
};

const PopWrap: React.FC<{start: number; seed: string; children: React.ReactNode}> = ({start, seed, children}) => {
	const {p, visible, jitter} = usePop(start, seed);
	if (!visible) return <div style={{width: 320}} />;
	return <div style={{scale: String(p), rotate: `${jitter}deg`}}>{children}</div>;
};

/* ============ Red del Metro animada (líneas genéricas) ============ */
export const NetworkScene: React.FC<Base & {text?: string; textAt?: number}> = ({t0, text, textAt}) => {
	const frame = useCurrentFrame();
	const L = useLocal(t0);
	const lines = [
		{c: '#E9468F', d: 'M120 300 L700 300 L900 500 L1800 500'},
		{c: '#00A2E0', d: 'M300 950 L300 600 L900 500 L1300 200 L1800 200'},
		{c: '#7DAA2E', d: 'M600 100 L700 300 L800 700 L900 980'},
		{c: '#F7A600', d: 'M1100 950 L1100 700 L1300 500 L1500 200'},
		{c: '#1F4E9C', d: 'M150 750 L800 700 L1300 700 L1800 820'},
	];
	const tp = interpolate(frame - L(textAt, 2), [0, 6], [0, 1], clamp);
	return (
		<AbsoluteFill>
			<Paper />
			<svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
				{lines.map((l, i) => {
					const p = interpolate(frame, [i * 8, i * 8 + 50], [0, 1], clamp);
					return <path key={i} d={l.d} fill="none" stroke={l.c} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />;
				})}
				{[
					[700, 300],
					[900, 500],
					[1300, 200],
					[800, 700],
					[1300, 700],
					[1100, 700],
				].map(([x, y], i) => (
					<circle key={i} cx={x} cy={y} r={20} fill={C.white} stroke={C.ink} strokeWidth={8} opacity={interpolate(frame, [40 + i * 4, 46 + i * 4], [0, 1], clamp)} />
				))}
			</svg>
			{text ? (
				<div style={{position: 'absolute', left: 120, bottom: 90, opacity: tp, fontFamily: fontSans, fontWeight: 800, fontSize: 54, background: C.white, padding: '10px 24px', color: C.ink, maxWidth: 1300}}>{text}</div>
			) : null}
			<div style={{position: 'absolute', right: 120, top: 70, fontFamily: fontMono, fontSize: 20, color: C.inkSoft}}>Esquema ilustrativo, no es el mapa oficial</div>
		</AbsoluteFill>
	);
};

/* ============ Cierre ============ */
export const EndScene: React.FC<Base & {credits: string[]}> = ({credits}) => {
	const frame = useCurrentFrame();
	const sf = frame;
	const a = interpolate(sf, [0, 8], [0, 1], clamp);
	const hl = interpolate(frame, [10, 26], [0, 1], clamp);
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{background: C.ink}} />
			<OpArtBand opacity={0.12} color={C.metro} />
			<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: a}}>
				<div style={{fontFamily: fontDisplay, fontSize: 120, color: C.white}}>
					¡Muchas{' '}
					<Highlight color={C.rosa} progress={hl} iterations={1}>
						gracias
					</Highlight>
					!
				</div>
				<div style={{fontFamily: fontSerif, fontSize: 64, color: C.marker, marginTop: 10}}>por acompañarnos</div>
				<div style={{fontFamily: fontMono, fontSize: 28, color: C.white, opacity: 0.8, marginTop: 60, lineHeight: 1.6}}>
					{credits.map((c, i) => (
						<div key={i}>{c}</div>
					))}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/* ============ MUCA + Galería Aristos: museografía moderna (ilustración animada, elevación de sala) ============ */
export const MuseografiaScene: React.FC<Base & {text?: string; textAt?: number}> = ({t0, text, textAt}) => {
	const frame = useCurrentFrame();
	const L = useLocal(t0);
	const pop = (s: number) => interpolate(frame - s, [0, 10], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.4))});
	const fade = (s: number, d = 8) => interpolate(frame - s, [0, d], [0, 1], clamp);
	const lamps = [410, 830, 1280, 1700];
	const walk = interpolate(frame, [34, 130], [150, 1560], {...clamp, easing: Easing.inOut(Easing.quad)});
	const bob = Math.sin(frame * 0.55) * 6;
	const tp = interpolate(frame - L(textAt, 3), [0, 6], [0, 1], clamp);
	const label = (x: number, y: number, s: number) => (
		<g opacity={fade(s)}>
			<rect x={x} y={y} width={120} height={22} fill={C.paperDark} stroke={C.inkSoft} strokeWidth={2} />
			<line x1={x + 12} y1={y + 8} x2={x + 98} y2={y + 8} stroke={C.inkSoft} strokeWidth={3} />
			<line x1={x + 12} y1={y + 15} x2={x + 70} y2={y + 15} stroke={C.inkSoft} strokeWidth={3} />
		</g>
	);
	return (
		<AbsoluteFill>
			<Paper />
			<div style={{position: 'absolute', left: 130, top: 70, display: 'flex', gap: 28, whiteSpace: 'nowrap'}}>
				{['MUCA', 'Galería Aristos'].map((n, i) => (
					<div key={n} style={{scale: String(pop(4 + i * 8)), rotate: i ? '2deg' : '-3deg', fontFamily: fontDisplay, fontSize: 64, background: i ? C.blue : C.metro, color: '#fff', padding: '6px 26px', boxShadow: '0 8px 18px rgba(0,0,0,0.25)'}}>
						{n}
					</div>
				))}
			</div>
			<svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
				{/* sala: pared, piso, riel de luces */}
				<rect x={110} y={250} width={1700} height={560} fill={C.white} stroke={C.ink} strokeWidth={6} opacity={fade(0, 10)} />
				<rect x={110} y={810} width={1700} height={190} fill="#8E8576" opacity={fade(2, 10)} />
				<line x1={110} y1={810} x2={1810} y2={810} stroke={C.ink} strokeWidth={8} opacity={fade(2, 10)} />
				<line x1={110} y1={225} x2={1810} y2={225} stroke={C.ink} strokeWidth={10} opacity={fade(4, 10)} />
				{/* focos y conos de luz */}
				{lamps.map((x, i) => (
					<g key={x} opacity={fade(14 + i * 6, 10)}>
						<polygon points={`${x - 16},232 ${x + 16},232 ${x + 190},800 ${x - 190},800`} fill="rgba(255,236,150,0.30)" />
						<rect x={x - 22} y={225} width={44} height={34} rx={8} fill={C.ink} />
					</g>
				))}
				{/* obra 1: op-art concéntrico */}
				<g opacity={fade(12)}>
					<rect x={220} y={330} width={380} height={360} fill={C.rosa} stroke={C.ink} strokeWidth={8} />
					{[150, 120, 90, 60, 30].map((r, i) => (
						<circle key={r} cx={410} cy={510} r={r * (0.85 + 0.15 * pop(12))} fill={i % 2 ? C.rosa : C.white} stroke={C.ink} strokeWidth={4} />
					))}
				</g>
				{label(290, 712, 20)}
				{/* obra 2: rayas azules */}
				<g opacity={fade(20)}>
					<rect x={700} y={380} width={260} height={340} fill={C.blue} stroke={C.ink} strokeWidth={8} />
					{Array.from({length: 7}).map((_, i) => (
						<rect key={i} x={716} y={398 + i * 46} width={228} height={14} fill={i % 2 ? C.marker : C.white} />
					))}
				</g>
				{label(770, 742, 28)}
				{/* obras 3: grupo de cuadros pequeños (salón) */}
				{[
					[1060, 340, '#7AB800'],
					[1270, 340, C.metro],
					[1060, 520, C.marker],
					[1270, 520, C.ink],
				].map(([x, y, f], i) => (
					<g key={i} opacity={fade(26 + i * 5)}>
						<rect x={x as number} y={y as number} width={190} height={150} fill={f as string} stroke={C.ink} strokeWidth={6} />
						<circle cx={(x as number) + 95} cy={(y as number) + 75} r={34} fill="none" stroke={C.white} strokeWidth={8} />
					</g>
				))}
				{label(1130, 690, 46)}
				{/* obra 4: sol negro sobre amarillo */}
				<g opacity={fade(34)}>
					<rect x={1580} y={340} width={230} height={380} fill="#F7A600" stroke={C.ink} strokeWidth={8} />
					<circle cx={1695} cy={470} r={70} fill={C.ink} />
					<rect x={1630} y={600} width={130} height={20} fill={C.ink} />
				</g>
				{label(1635, 742, 52)}
				{/* visitante recorriendo la sala */}
				<g transform={`translate(${walk}, ${bob})`} opacity={fade(30)}>
					<ellipse cx={0} cy={992 - bob} rx={60} ry={12} fill="rgba(0,0,0,0.25)" />
					<circle cx={0} cy={724} r={34} fill={C.ink} />
					<path d="M-44 770 H44 L58 960 H-58 Z" fill={C.ink} />
					<path d="M-26 960 V990 M26 960 V990" stroke={C.ink} strokeWidth={16} strokeLinecap="round" />
				</g>
			</svg>
			{text ? (
				<div style={{position: 'absolute', left: 0, right: 0, bottom: 20, textAlign: 'center', opacity: tp}}>
					<span style={{fontFamily: fontSans, fontWeight: 800, fontSize: 56, background: C.marker, padding: '6px 26px'}}>{text}</span>
				</div>
			) : null}
		</AbsoluteFill>
	);
};

/* ============ "Si los artistas nos vistieran…" (1977): ilustración explicativa, NO es el cartel original ============ */
export const CartelVestirScene: React.FC<Base & {year?: string}> = ({year = '1977'}) => {
	const frame = useCurrentFrame();
	const pop = (s: number, d = 10) => interpolate(frame - s, [0, d], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.3))});
	const fade = (s: number, d = 8) => interpolate(frame - s, [0, d], [0, 1], clamp);
	const lines = [
		['SI LOS', C.ink],
		['ARTISTAS', C.rosa],
		['NOS', C.ink],
		['VISTIERAN…', C.blue],
	] as const;
	const tunic = 'M360 60 L440 40 Q500 100 560 40 L640 60 L770 210 L695 255 L655 200 L665 650 L335 650 L345 200 L305 255 L230 210 Z';
	return (
		<AbsoluteFill style={{background: C.white}}>
			<div style={{position: 'absolute', inset: 36, border: `8px solid ${C.ink}`}} />
			<div style={{position: 'absolute', left: 80, top: 74, fontFamily: fontMono, fontWeight: 600, fontSize: 34, letterSpacing: 4, opacity: fade(0)}}>MUCA · UNAM · {year}</div>
			<div style={{position: 'absolute', left: 80, top: 140, fontFamily: fontDisplay, fontSize: 118, lineHeight: 0.94}}>
				{lines.map(([t, c], i) => (
					<div key={t} style={{color: c, clipPath: `inset(-10% ${(1 - interpolate(frame - (4 + i * 7), [0, 12], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)})) * 100}% -10% 0)`}}>
						{t}
					</div>
				))}
			</div>
			<svg width="880" height="669" viewBox="0 0 1000 760" style={{position: 'absolute', left: 60, top: 600}}>
				<defs>
					<clipPath id="tunica">
						<path d={tunic} transform="translate(0,100)" />
					</clipPath>
				</defs>
				<g opacity={fade(30)} transform={`translate(0, ${(1 - pop(30)) * -60})`}>
					<path d="M500 140 Q500 70 548 70 Q585 70 585 108" fill="none" stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
					<path d="M500 140 L330 205 M500 140 L670 205" stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
					<path d={tunic} transform="translate(0,100)" fill={C.paperDark} stroke={C.ink} strokeWidth={10} strokeLinejoin="round" />
					{/* estampado: las obras se vuelven tela */}
					<g clipPath="url(#tunica)">
						<g opacity={fade(44)} transform={`translate(0, ${(1 - fade(44, 14)) * 30})`}>
							{Array.from({length: 7}).map((_, i) => (
								<rect key={i} x={200} y={200 + i * 62} width={600} height={22} fill={i % 2 ? C.metro : C.marker} />
							))}
						</g>
						<g transform={`translate(500, 420) scale(${pop(54)})`}>
							{[170, 135, 100, 66, 34].map((r, i) => (
								<circle key={r} r={r} fill={i % 2 ? C.rosa : C.white} stroke={C.ink} strokeWidth={5} />
							))}
						</g>
						<polygon points="330,760 400,610 470,760" fill={C.blue} stroke={C.ink} strokeWidth={5} opacity={fade(64)} />
						<circle cx={640} cy={330} r={46} fill="#7AB800" stroke={C.ink} strokeWidth={5} opacity={fade(70)} />
					</g>
					<path d={tunic} transform="translate(0,100)" fill="none" stroke={C.ink} strokeWidth={10} strokeLinejoin="round" />
				</g>
			</svg>
			<div style={{position: 'absolute', left: 80, right: 80, bottom: 70, textAlign: 'center', opacity: fade(80)}}>
				<span style={{fontFamily: fontSerif, fontSize: 52, color: C.rosa}}>el arte sale del museo y se lleva puesto</span>
			</div>
			<div style={{position: 'absolute', right: 60, top: 70, rotate: '4deg', fontFamily: fontMono, fontWeight: 600, fontSize: 28, letterSpacing: 3, background: C.ink, color: '#fff', padding: '4px 14px', opacity: fade(2)}}>
				ILUSTRACIÓN
			</div>
		</AbsoluteFill>
	);
};
