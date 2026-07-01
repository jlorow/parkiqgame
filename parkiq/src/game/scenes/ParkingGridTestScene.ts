import Phaser from 'phaser';
import { createParkingGrid } from '../components/ParkingGrid';

export class ParkingGridTestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ParkingGridTestScene' });
  }

  create(): void {
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;
    const thirdHeight = Math.floor(screenHeight / 3);

    createParkingGrid(this, {
      environment: 'street',
      x: 0,
      y: 0,
      width: screenWidth,
      height: thirdHeight,
    });

    createParkingGrid(this, {
      environment: 'garage',
      x: 0,
      y: thirdHeight,
      width: screenWidth,
      height: thirdHeight,
    });

    createParkingGrid(this, {
      environment: 'open_lot',
      x: 0,
      y: thirdHeight * 2,
      width: screenWidth,
      height: screenHeight - thirdHeight * 2,
    });

    this.add.text(12, 12, 'Street', {
      color: '#FFFFFF',
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
    });

    this.add.text(12, thirdHeight + 12, 'Garage', {
      color: '#FFFFFF',
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
    });

    this.add.text(12, thirdHeight * 2 + 12, 'Open Lot', {
      color: '#FFFFFF',
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
    });
  }
}
