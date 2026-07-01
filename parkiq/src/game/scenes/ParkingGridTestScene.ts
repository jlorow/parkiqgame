import Phaser from 'phaser';
import { createParkingGrid } from '../components/ParkingGrid';

export class ParkingGridTestScene extends Phaser.Scene {
  private streetGrid?: Phaser.GameObjects.Graphics;
  private garageGrid?: Phaser.GameObjects.Graphics;
  private openLotGrid?: Phaser.GameObjects.Graphics;
  private streetLabel?: Phaser.GameObjects.Text;
  private garageLabel?: Phaser.GameObjects.Text;
  private openLotLabel?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'ParkingGridTestScene' });
  }

  create(): void {
    this.renderGrids();
    this.cameras.main.setBounds(0, 0, this.scale.width, this.getTotalHeight());
    this.scale.on('resize', this.handleResize, this);
  }

  private renderGrids(): void {
    const gridW = 288;
    const gridH = 288;
    const gap = 20;
    const startX = Math.floor((this.scale.width - gridW) / 2);
    const startY = 20;

    this.streetGrid?.destroy();
    this.garageGrid?.destroy();
    this.openLotGrid?.destroy();
    this.streetLabel?.destroy();
    this.garageLabel?.destroy();
    this.openLotLabel?.destroy();

    this.streetGrid = createParkingGrid(this, {
      environment: 'street',
      x: startX,
      y: startY,
      width: gridW,
      height: gridH,
    });

    this.garageGrid = createParkingGrid(this, {
      environment: 'garage',
      x: startX,
      y: startY + gridH + gap,
      width: gridW,
      height: gridH,
    });

    this.openLotGrid = createParkingGrid(this, {
      environment: 'open_lot',
      x: startX,
      y: startY + (gridH + gap) * 2,
      width: gridW,
      height: gridH,
    });

    this.streetLabel = this.add.text(startX + 8, startY - 12, 'Street', {
      color: '#FFFFFF',
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
    });

    this.garageLabel = this.add.text(startX + 8, startY + gridH + gap - 12, 'Garage', {
      color: '#FFFFFF',
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
    });

    this.openLotLabel = this.add.text(
      startX + 8,
      startY + (gridH + gap) * 2 - 12,
      'Open Lot',
      {
        color: '#FFFFFF',
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
      },
    );
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.cameras.main.setBounds(0, 0, gameSize.width, this.getTotalHeight());
    this.renderGrids();
  }

  private getTotalHeight(): number {
    const gridH = 288;
    const gap = 20;
    const startY = 20;
    return startY + (gridH + gap) * 3;
  }
}
