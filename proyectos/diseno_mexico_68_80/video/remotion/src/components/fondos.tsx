import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {Tema} from '../theme';

/* Fondos continuos por capítulo: se animan durante todo el bloque, sin reiniciarse entre escenas. */

const PapelTextura: React.FC = () => (
	<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.5, mixBlendMode: 'multiply'}}>
		<filter id="papelF">
			<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="4" />
			<feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.28  0 0 0 0.3 0" />
		</filter>
		<rect width="100%" height="100%" filter="url(#papelF)" />
	</svg>
);

/* Op art: anillos concéntricos que se expanden (lenguaje del programa México 68) */
const OpField: React.FC<{t: Tema}> = ({t}) => {
	const frame = useCurrentFrame();
	const n = 34;
	const off = (frame * 0.9) % 36;
	const drift = Math.sin(frame / 240) * 60;
	return (
		<svg width="1920" height="1080" style={{position: 'absolute', inset: 0}}>
			{Array.from({length: n}).map((_, i) => {
				const r = 20 + i * 36 + off;
				return <rect key={i} x={960 + drift - r * 1.7} y={540 - r} width={r * 3.4} height={r * 2} rx={r} fill="none" stroke={t.linea} strokeWidth={13} opacity={0.2} />;
			})}
		</svg>
	);
};

/* Historieta: puntos Ben-Day + líneas de acción */
const ComicField: React.FC<{t: Tema}> = ({t}) => {
	const frame = useCurrentFrame();
	const x = (frame * 0.4) % 26;
	return (
		<AbsoluteFill>
			<AbsoluteFill
				style={{
					backgroundImage: `radial-gradient(circle, ${t.linea} 3.2px, transparent 3.6px)`,
					backgroundSize: '26px 26px',
					backgroundPosition: `${x}px ${x * 0.5}px`,
					opacity: 0.22,
				}}
			/>
			<svg width="1920" height="1080" style={{position: 'absolute', inset: 0, opacity: 0.08}}>
				{Array.from({length: 40}).map((_, i) => {
					const a = (i / 40) * Math.PI * 2 + frame / 900;
					return <line key={i} x1={960} y1={540} x2={960 + Math.cos(a) * 1400} y2={540 + Math.sin(a) * 1400} stroke="#171412" strokeWidth={i % 3 === 0 ? 10 : 4} />;
				})}
			</svg>
		</AbsoluteFill>
	);
};

/* Metro: retícula + líneas de color que recorren la pantalla + esquina redondeada */
const MetroField: React.FC<{t: Tema}> = ({t}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const lines = ['#E9468F', '#00A2E0', '#7DAA2E', '#F7A600', '#F26B1D'];
	return (
		<AbsoluteFill>
			<AbsoluteFill
				style={{
					opacity: 0.25,
					backgroundImage: `linear-gradient(${t.linea}33 2px, transparent 2px), linear-gradient(90deg, ${t.linea}33 2px, transparent 2px)`,
					backgroundSize: '80px 80px',
				}}
			/>
			<svg width="1920" height="1080" style={{position: 'absolute', inset: 0, opacity: 0.22}}>
				{lines.map((c, i) => {
					const y = 140 + i * 200;
					const shift = ((frame / fps) * 60 + i * 300) % 2400;
					return <path key={i} d={`M${-400 + shift - 2000} ${y} H${shift - 600} q 60 0 60 60 V ${y + 120} H ${shift + 1600}`} fill="none" stroke={c} strokeWidth={26} strokeLinecap="round" />;
				})}
			</svg>
			<svg width="420" height="420" viewBox="0 0 200 200" style={{position: 'absolute', right: -60, bottom: -60, opacity: 0.12, rotate: `${interpolate(frame, [0, 3000], [0, 8])}deg`}}>
				<path d="M0 0 H160 A40 40 0 0 1 200 40 V200 H0 Z" fill={t.linea} />
			</svg>
		</AbsoluteFill>
	);
};

/* Guilloché: curvas de grabado tipo billete (hipotrocoides) que giran lento */
const guillochePath = (R: number, r: number, d: number, cx: number, cy: number, steps = 900) => {
	let p = '';
	for (let i = 0; i <= steps; i++) {
		const th = (i / steps) * Math.PI * 2 * (r / gcd(R, r));
		const x = cx + (R - r) * Math.cos(th) + d * Math.cos(((R - r) / r) * th);
		const y = cy + (R - r) * Math.sin(th) - d * Math.sin(((R - r) / r) * th);
		p += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
	}
	return p;
};
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const GUILL = [guillochePath(420, 66, 170, 0, 0), guillochePath(300, 45, 120, 0, 0), guillochePath(520, 80, 210, 0, 0)];

const GuillocheField: React.FC<{t: Tema}> = ({t}) => {
	const frame = useCurrentFrame();
	return (
		<svg width="1920" height="1080" style={{position: 'absolute', inset: 0, opacity: 0.22}}>
			<g transform={`translate(1500 540) rotate(${frame * 0.05})`}>
				<path d={GUILL[0]} fill="none" stroke={t.linea} strokeWidth={1.6} />
				<path d={GUILL[1]} fill="none" stroke={t.acento} strokeWidth={1.4} />
			</g>
			<g transform={`translate(380 560) rotate(${-frame * 0.04})`}>
				<path d={GUILL[2]} fill="none" stroke={t.linea} strokeWidth={1.4} />
			</g>
		</svg>
	);
};

export const FondoCapitulo: React.FC<{t: Tema}> = ({t}) => (
	<AbsoluteFill style={{backgroundColor: t.base}}>
		{t.fondo === 'op' ? <OpField t={t} /> : null}
		{t.fondo === 'comic' ? <ComicField t={t} /> : null}
		{t.fondo === 'metro' ? <MetroField t={t} /> : null}
		{t.fondo === 'guilloche' ? <GuillocheField t={t} /> : null}
		<PapelTextura />
	</AbsoluteFill>
);
