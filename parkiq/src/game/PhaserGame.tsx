import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { ParkingGridTestScene } from './scenes/ParkingGridTestScene';

export const PhaserGame = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 390,
      height: 844,
      backgroundColor: '#0F0F0F',
      parent: containerRef.current,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [ParkingGridTestScene],
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-[#0F0F0F]"
    />
  );
};
