import React from 'react';
import {Composition} from 'remotion';
import {VideoEnsayo} from './Video';
import data from './data/storyboard.json';
import './theme';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition id="VideoEnsayo" component={VideoEnsayo} durationInFrames={Math.ceil(data.duration * 60)} fps={60} width={1920} height={1080} />
		</>
	);
};
