import Phaser from 'phaser';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  preload(): void {}

  create(): void {
    this.add.text(20, 20, 'ResultScene', {
      color: '#FFFFFF',
      fontSize: '28px',
    });

    const btn = this.add
      .text(195, 420, '→ PuzzleScene', {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#e8320a',
        padding: { x: 16, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('PuzzleScene', { test: true });
      });

    btn.setDepth(10);
  }

  override update(): void {}
}
