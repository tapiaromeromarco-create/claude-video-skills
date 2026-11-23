import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Highlight, StrikeThrough, Underline} from '@remotion/rough-notation';
import {C, fontDisplay, fontMono, fontSans, fontSerif, step12} from '../theme';
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
	kicker?: string;
	size?: number;
	dark?: boolean;
	ficha?: {title: string; sub?: string; year?: string; at?: number};
	align?: 'left' | 'center';
};

export const KineticScene: React.FC<KineticProps> = ({t0, lines, marks = {}, lineAt = [], kicker, size = 96, dark, ficha, align = 'left'}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const L = useLocal(t0);
	const sf = step12(frame, fps);
	return (
		<AbsoluteFill>
			{dark ? <AbsoluteFill style={{background: C.ink}} /> : <Paper />}
			<AbsoluteFill style={{padding: '120px 150px', justifyContent: 'center', alignItems: align === 'center' ? 'center' : 'flex-start', textAlign: align}}>
				{kicker ? <Kicker text={kicker} color={dark ? C.marker : C.rosa} style={{marginBottom: 28}} /> : null}
				{lines.map((line, i) => {
					const start = L(lineAt[i], i * 0.5);
					const p = interpolate(sf - start, [0, 6], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
					return (
						<div
							key={i}
							style={{
								fontFamily: fontDisplay,
								fontSize: size,
								lineHeight: 1.12,
								color: dark ? C.white : C.ink,
								opacity: p,
								translate: `0px ${(1 - p) * 30}px`,
								marginBottom: 10,
								maxWidth: 1620,
							}}
						>
							{parse(line).map((tk, j) => {
								const at = L(tk.key ? marks[tk.key] : undefined, i * 0.5 + 0.7);
								const prog = interpolate(frame, [at, at + Math.round(0.45 * fps)], [0, 1], clamp);
								if (tk.mode === 'hl')
									return (
										<Highlight key={j} color={C.markerRGBA} progress={prog} iterations={1} padding={{left: 6, right: 6}}>
											<span style={{color: C.ink}}>{tk.t}</span>
										</Highlight>
									);
								if (tk.mode === 'strike')
									return (
										<StrikeThrough key={j} color={C.rosa} strokeWidth={9} progress={prog} iterations={1}>
											<span style={{opacity: interpolate(prog, [0, 1], [1, 0.55])}}>{tk.t}</span>
										</StrikeThrough>
									);
								if (tk.mode === 'ul')
									return (
										<Underline key={j} color={C.metro} strokeWidth={8} progress={prog} iterations={1}>
											<span>{tk.t}</span>
										</Underline>
									);
								if (tk.mode === 'serif')
									return (
										<span key={j} style={{fontFamily: fontSerif, fontWeight: 400, color: dark ? C.marker : C.rosa, fontSize: size * 1.12}}>
											{tk.t}
										</span>
									);
								return <span key={j}>{tk.t}</span>;
							})}
						</div>
					);
				})}
				{ficha ? <FichaPop t0={t0} {...ficha} /> : null}
			</AbsoluteFill>
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

/* ============ Título principal ============ */
export const TitleScene: React.FC<Base & {credits?: string}> = ({t0, credits}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const sf = step12(frame, fps);
	const a = interpolate(sf, [0, 8], [0, 1], clamp);
	const b = interpolate(sf, [6, 14], [0, 1], clamp);
	const hl = interpolate(frame, [16, 30], [0, 1], clamp);
	return (
		<AbsoluteFill>
			<Paper />
			<OpArtBand opacity={0.18} />
			<AbsoluteFill style={{padding: '0 150px', justifyContent: 'center'}}>
				<Kicker text="Video-ensayo · Diseño gráfico" color={C.rosa} style={{opacity: a, marginBottom: 20}} />
				<div style={{fontFamily: fontDisplay, fontSize: 132, lineHeight: 1.0, color: C.ink, opacity: a, translate: `0px ${(1 - a) * 40}px`}}>
					La Época de Oro
				</div>
				<div style={{fontFamily: fontSerif, fontSize: 120, lineHeight: 1.05, color: C.rosa, opacity: b}}>del diseño gráfico</div>
				<div style={{fontFamily: fontDisplay, fontSize: 132, lineHeight: 1.0, color: C.ink, opacity: b}}>
					en{' '}
					<Highlight color={C.markerRGBA} progress={hl} iterations={1} padding={{left: 8, right: 8}}>
						México
					</Highlight>
				</div>
				<div style={{display: 'flex', gap: 30, alignItems: 'center', marginTop: 40, opacity: b}}>
					<div style={{fontFamily: fontMono, fontSize: 40, background: C.ink, color: C.white, padding: '8px 20px'}}>1968 — 1980</div>
					{credits ? <div style={{fontFamily: fontMono, fontSize: 30, color: C.inkSoft}}>{credits}</div> : null}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/* ============ Tarjeta de capítulo ============ */
export const ChapterScene: React.FC<Base & {num: string; title: string; years: string; color?: string}> = ({num, title, years, color = C.metro}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const sf = step12(frame, fps);
	const wipe = interpolate(sf, [0, 8], [0, 100], {...clamp, easing: Easing.out(Easing.cubic)});
	const t = interpolate(sf, [4, 12], [0, 1], clamp);
	const ul = interpolate(frame, [14, 30], [0, 1], clamp);
	return (
		<AbsoluteFill>
			<Paper />
			<AbsoluteFill style={{background: color, clipPath: `inset(0 ${100 - wipe}% 0 0)`}} />
			<AbsoluteFill style={{padding: '0 160px', justifyContent: 'center'}}>
				<div style={{fontFamily: fontDisplay, fontSize: 280, color: C.white, opacity: 0.25 * t, position: 'absolute', right: 140, top: 90}}>{num}</div>
				<Kicker text={`Capítulo ${num}`} color={C.white} style={{opacity: t, marginBottom: 24}} />
				<div style={{fontFamily: fontDisplay, fontSize: 104, lineHeight: 1.05, color: C.white, opacity: t, translate: `${(1 - t) * -40}px 0px`, maxWidth: 1500}}>
					{title}
				</div>
				<div style={{height: 12, width: 520, background: C.ink, marginTop: 18, scale: `${ul} 1`, transformOrigin: 'left center', opacity: t}} />
				<div style={{fontFamily: fontMono, fontSize: 40, color: C.ink, marginTop: 30, opacity: t, background: C.marker, alignSelf: 'flex-start', padding: '6px 16px'}}>
					{years}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/* ============ Año gigante ============ */
export const YearScene: React.FC<Base & {year: string; caption?: string; captionAt?: number; color?: string; image?: StickerItem}> = ({t0, year, caption, captionAt, color = C.rosa, image}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const L = useLocal(t0);
	const sf = step12(frame, fps);
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
	const tp = interpolate(step12(frame, fps) - Math.min(L(titleAt, 0), Math.round(0.4 * fps)), [0, 6], [0, 1], clamp); // el título entra al inicio
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
	const {fps} = useVideoConfig();
	const L = useLocal(t0);
	const tp = interpolate(step12(frame, fps), [0, 6], [0, 1], clamp);
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
	const {fps} = useVideoConfig();
	const L = useLocal(t0);
	const sf = step12(frame, fps);
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
	const {fps} = useVideoConfig();
	const L = useLocal(t0);
	const sf = step12(frame, fps);
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
	const {fps} = useVideoConfig();
	const L = useLocal(t0);
	const sf = step12(frame, fps);
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
	const {fps} = useVideoConfig();
	const L = useLocal(t0);
	const sf = step12(frame, fps);
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
	const {fps} = useVideoConfig();
	const L = useLocal(t0);
	const sf = step12(frame, fps);
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
	const {fps} = useVideoConfig();
	const L = useLocal(t0);
	const lines = [
		{c: '#E9468F', d: 'M120 300 L700 300 L900 500 L1800 500'},
		{c: '#00A2E0', d: 'M300 950 L300 600 L900 500 L1300 200 L1800 200'},
		{c: '#7DAA2E', d: 'M600 100 L700 300 L800 700 L900 980'},
		{c: '#F7A600', d: 'M1100 950 L1100 700 L1300 500 L1500 200'},
		{c: '#1F4E9C', d: 'M150 750 L800 700 L1300 700 L1800 820'},
	];
	const tp = interpolate(step12(frame, fps) - L(textAt, 2), [0, 6], [0, 1], clamp);
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
	const {fps} = useVideoConfig();
	const sf = step12(frame, fps);
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
