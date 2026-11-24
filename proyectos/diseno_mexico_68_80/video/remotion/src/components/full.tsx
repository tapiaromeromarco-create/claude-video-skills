import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile} from 'remotion';
import {useCurrentFrame, useVideoConfig} from '../time';

/* Imagen a pantalla completa (respiro entre collages): Ken Burns, grano, viñeta, ficha y nota a mano. */
type Props = {
	t0: number;
	t1: number;
	src: string;
	fit?: 'cover' | 'contain'; // contain = imagen vertical completa sobre fondo desenfocado
	move?: 'in' | 'out' | 'left' | 'right';
	bw?: boolean;
	ficha?: {title: string; sub?: string};
	nota?: {text: string; x: number; y: number; at?: number; rot?: number};
	circulo?: {x: number; y: number; w: number; h: number; at?: number};
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const FullScene: React.FC<Props> = ({t0, t1, src, fit = 'cover', move = 'in', bw, ficha, nota, circulo}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const dur = Math.max(1, (t1 - t0) * fps);
	const p = interpolate(frame, [0, dur], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
	const sc = move === 'out' ? 1.14 - 0.1 * p : 1.02 + 0.1 * p;
	const tx = move === 'left' ? 40 - 80 * p : move === 'right' ? -40 + 80 * p : 0;
	const filt = bw ? 'grayscale(1) contrast(1.12) brightness(1.02)' : 'saturate(0.95) contrast(1.05)';
	const L = (sec: number | undefined, fb: number) => Math.round(((sec ?? t0 + fb) - t0) * fps);
	const fp = interpolate(frame, [10, 24], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const np = interpolate(frame - L(nota?.at, 0.8), [0, 16], [0, 1], clamp);
	const cp = interpolate(frame - L(circulo?.at, 1.0), [0, 16], [0, 1], clamp);
	return (
		<AbsoluteFill style={{background: '#111'}}>
			{fit === 'contain' ? (
				<Img src={staticFile(src)} style={{position: 'absolute', inset: -60, width: 2040, height: 1200, objectFit: 'cover', filter: `${filt} blur(28px) brightness(0.55)`}} />
			) : null}
			<AbsoluteFill style={{scale: String(sc), translate: `${tx}px 0px`}}>
				<Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: fit, filter: fit === 'contain' ? `${filt} drop-shadow(0 20px 40px rgba(0,0,0,0.6))` : filt}} />
			</AbsoluteFill>
			{/* grano + viñeta de película */}
			<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.18, mixBlendMode: 'overlay'}}>
				<filter id={`gr${Math.floor(frame / 2) % 6}`}>
					<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed={Math.floor(frame / 2) % 6} />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter={`url(#gr${Math.floor(frame / 2) % 6})`} />
			</svg>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)'}} />
			{circulo ? (
				<svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
					<ellipse cx={circulo.x + circulo.w / 2} cy={circulo.y + circulo.h / 2} rx={circulo.w / 2} ry={circulo.h / 2} fill="none" stroke="#E5323B" strokeWidth={9} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - cp} transform={`rotate(-6 ${circulo.x + circulo.w / 2} ${circulo.y + circulo.h / 2})`} />
				</svg>
			) : null}
			{nota ? (
				<div style={{position: 'absolute', left: nota.x, top: nota.y, fontFamily: 'Permanent Marker', fontSize: 84, color: '#FF3B44', rotate: `${nota.rot ?? -4}deg`, clipPath: `inset(-20% ${(1 - np) * 100}% -20% -5%)`, textShadow: '0 3px 10px rgba(0,0,0,0.5)', whiteSpace: 'pre'}}>
					{nota.text}
				</div>
			) : null}
			{ficha ? (
				<div style={{position: 'absolute', left: 90, bottom: 90, background: '#F4EEDF', padding: '16px 26px', fontFamily: 'Special Elite', color: '#171412', borderLeft: '10px solid #E4007C', boxShadow: '0 10px 24px rgba(0,0,0,0.45)', opacity: fp, translate: `${(1 - fp) * -40}px 0px`, maxWidth: 900}}>
					<div style={{fontSize: 40}}>{ficha.title}</div>
					{ficha.sub ? <div style={{fontSize: 28, marginTop: 4}}>{ficha.sub}</div> : null}
				</div>
			) : null}
		</AbsoluteFill>
	);
};
