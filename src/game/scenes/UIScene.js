import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class UIScene extends Scene {

    constructor() {
        super({ key: 'UIScene', active: false });
    }

    create() {
        this.lives = 3;
        this.lifeIcons = [];

        this.drawLives();

        EventBus.on('player-died', (data) => {
            this.lives = data.lives;
            this.drawLives();
        });
    }

    drawLives() {
        // Limpiar íconos anteriores
        this.lifeIcons.forEach(icon => icon.destroy());
        this.lifeIcons = [];

        // Dibujar un ícono por cada vida
        for (let i = 0; i < this.lives; i++) {
            const icon = this.add.image(96 + (i * 24), 96, 'icon_live');
            icon.setScale(1);
            icon.setScrollFactor(0); // Se queda fijo en la pantalla
            this.lifeIcons.push(icon);
        }
    }

    shutdown() {
        EventBus.off('player-died');
    }
}