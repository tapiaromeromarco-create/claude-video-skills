import React from 'react';
import {Composition} from 'remotion';
import {VideoEnsayo} from './Video';
import data from './data/storyboard.json';
import './theme';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition id="VideoEnsayo" component={VideoEnsayo} durationInFrames={Math.ceil(data.duration * 30)} fps={30} width={1920} height={1080} />
		</>
	);
};
