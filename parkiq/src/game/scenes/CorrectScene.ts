import Phaser from 'phaser';

export class CorrectScene extends Phaser.Scene {
  constructor() {
    super('CorrectScene');
  }

  preload(): void {}

  create(): void {
    this.add.text(20, 20, 'CorrectScene', {
      color: '#FFFFFF',
      fontSize: '28px',
    });

    const btn = this.add
      .text(195, 420, '→ ResultScene', {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#e8320a',
        padding: { x: 16, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('ResultScene', { test: true });
      });

    btn.setDepth(10);
  }

  override update(): void {}
}
