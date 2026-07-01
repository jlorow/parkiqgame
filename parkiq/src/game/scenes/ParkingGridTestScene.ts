import Phaser from 'phaser';
import { createParkingGrid } from '../components/ParkingGrid';

export class ParkingGridTestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ParkingGridTestScene' });
  }

  create(): void {
    const gridW = 288;
    const gridH = 288;
    const gap = 20;
    const startX = Math.floor((390 - gridW) / 2); // 51

    createParkingGrid(this, {
      environment: 'street',
      x: startX,
      y: 20,
      width: gridW,
      height: gridH,
    });

    createParkingGrid(this, {
      environment: 'garage',
      x: startX,
      y: 20 + gridH + gap,
      width: gridW,
      height: gridH,
    });

    createParkingGrid(this, {
      environment: 'open_lot',
      x: startX,
      y: 20 + (gridH + gap) * 2,
      width: gridW,
      height: gridH,
    });

    this.add.text(startX + 8, 8, 'Street', {
      color: '#FFFFFF',
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
    });

    this.add.text(startX + 8, 20 + gridH + 8, 'Garage', {
      color: '#FFFFFF',
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
    });

    this.add.text(startX + 8, 20 + (gridH + gap) * 2 + 8, 'Open Lot', {
      color: '#FFFFFF',
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
    });
  }
}
