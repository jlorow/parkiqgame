import Phaser from 'phaser';

export class WrongAnswerScene extends Phaser.Scene {
  constructor() {
    super('WrongAnswerScene');
  }

  preload(): void {}

  create(): void {
    this.add.text(20, 20, 'WrongAnswerScene', {
      color: '#FFFFFF',
      fontSize: '28px',
    });

    const btn = this.add
      .text(195, 420, '→ CorrectScene', {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#e8320a',
        padding: { x: 16, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('CorrectScene', { test: true });
      });

    btn.setDepth(10);
  }

  override update(): void {}
}
