import React from 'react';
import { IsoScene } from './IsoScene';
import { isoScenes, IsoSceneName } from './scenes';

interface IsoIllustrationProps {
  name: IsoSceneName;
  size?: number;
  className?: string;
}

/** One named piece from the isometric spot-illustration suite (see scenes.ts). */
export const IsoIllustration: React.FC<IsoIllustrationProps> = ({ name, size = 180, className }) => {
  const scene = isoScenes[name];
  return <IsoScene blocks={scene.blocks} title={scene.title} size={size} className={className} />;
};
