import {useCurrentFrame as useFrameReal, useVideoConfig as useConfigReal} from 'remotion';

/* Las animaciones se escriben en "fotogramas lógicos" de 30 fps; el video se renderiza a 60 fps.
   Estos hooks devuelven el fotograma lógico (con fracciones), así cada animación dura lo mismo
   pero tiene el doble de fotogramas intermedios: movimiento más fluido. */
export const BASE_FPS = 30;
export const useCurrentFrame = () => {
	const f = useFrameReal();
	const {fps} = useConfigReal();
	return (f * BASE_FPS) / fps;
};
export const useVideoConfig = () => {
	const c = useConfigReal();
	return {...c, fps: BASE_FPS};
};
