import Phaser from 'phaser';

export class PuzzleScene extends Phaser.Scene {
  constructor() {
    super('PuzzleScene');
  }

  preload(): void {}

  create(): void {
    this.add.text(20, 20, 'PuzzleScene', {
      color: '#FFFFFF',
      fontSize: '28px',
    });

    const btn = this.add
      .text(195, 420, '→ WrongAnswerScene', {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#e8320a',
        padding: { x: 16, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('WrongAnswerScene', { test: true });
      });

    btn.setDepth(10);
  }

  override update(): void {}
}
