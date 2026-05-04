import { Scene } from 'phaser';

export class PauseMenu extends Scene {
    constructor() {
        super({ key: 'PauseMenu' });
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Reproducir sonido pause
        const pauseVolume = 0.2;
        this.sound.play('pause', { volume: pauseVolume });

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

        this.add.text(width / 2, height / 3, 'PAUSA', {
            fontFamily: 'NES',
            fontSize: 24,
            color: '#ffffff',
            resolution: 3,
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2, 'START PARA CONTINUAR', {
            fontFamily: 'NES',
            fontSize: 16,
            color: '#aaaaaa',
            resolution: 3,
        }).setOrigin(0.5);

        const reanudar = () => {
            this.scene.resume(this.scene.settings.data.from);
            this.scene.stop();
        };

        this.input.keyboard.once('keydown-ESC', reanudar);

        this.input.gamepad?.on('down', (pad, button) => {
            if (button.index === 9) reanudar();
        });
    }
}