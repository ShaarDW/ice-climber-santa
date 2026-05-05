import * as Phaser from 'phaser';
import { Scene } from 'phaser';

export class MainMenu extends Scene {

    constructor() {
        super('MainMenu');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.cameras.main.setBackgroundColor(0x000000);

        this.add.image(width / 2, height / 4, 'title').setOrigin(0.5);
        this.montanas = [
            { label: 'MOUNTAIN 1', scene: 'Level1' },
            { label: 'MOUNTAIN 2', scene: 'Level2' }
        ];

        this.selectedIndex = 0;
        this.opciones = [];
        this.gpCooldown = false; // ← evita que el stick mueva muy rápido

        const espacioEntreOpciones = 50;

        this.montanas.forEach((m, i) => {
            const y = height / 2 + (i * espacioEntreOpciones);
            const texto = this.add.text(width / 3, y, m.label, {
                fontFamily: 'NES',
                fontSize: 16,
                color: '#ffffff',
                stroke: '#000000',
                resolution: 3,
            }).setOrigin(0, 0.5);
            this.opciones.push({ texto, y });
        });

        this.martillo = this.add.image(
            width / 3 - 20,
            this.opciones[0].y,
            'hammer'
        ).setOrigin(1, 0.5);

        // ──────── Mostrar Controles ────────────
        const controlsY = height - 95;

        // Controles de Teclado
        this.add.text(20, controlsY, 'KEYBOARD', {
            fontFamily: 'NES',
            fontSize: 12,
            color: '#00ff00',
            stroke: '#000000',
            resolution: 4,
        }).setOrigin(0, 0);

        this.add.text(20, controlsY + 18, '← → MOVE', {
            fontFamily: 'NES',
            fontSize: 10,
            color: '#ffffff',
            stroke: '#000000',
            resolution: 2,
        }).setOrigin(0, 0);

        this.add.text(20, controlsY + 30, '↑ JUMP', {
            fontFamily: 'NES',
            fontSize: 10,
            color: '#ffffff',
            stroke: '#000000',
            resolution: 2,
        }).setOrigin(0, 0);

        this.add.text(20, controlsY + 42, 'Z HAMMER', {
            fontFamily: 'NES',
            fontSize: 10,
            color: '#ffffff',
            stroke: '#000000',
            resolution: 4,
        }).setOrigin(0, 0);

        // Controles de Joystick
        this.add.text(width - 20, controlsY, 'GAMEPAD', {
            fontFamily: 'NES',
            fontSize: 12,
            color: '#00ff00',
            stroke: '#000000',
            resolution: 4,
        }).setOrigin(1, 0);

        this.add.text(width - 20, controlsY + 18, 'STICK MOVE', {
            fontFamily: 'NES',
            fontSize: 10,
            color: '#ffffff',
            stroke: '#000000',
            resolution: 4,
        }).setOrigin(1, 0);

        this.add.text(width - 20, controlsY + 30, 'A JUMP', {
            fontFamily: 'NES',
            fontSize: 10,
            color: '#ffffff',
            stroke: '#000000',
            resolution: 4,
        }).setOrigin(1, 0);

        this.add.text(width - 20, controlsY + 42, 'X HAMMER', {
            fontFamily: 'NES',
            fontSize: 10,
            color: '#ffffff',
            stroke: '#000000',
            resolution: 4,
        }).setOrigin(1, 0);

        // ──────── Mostrar cómo iniciar ────────────
        this.add.text(width / 2, height - 15, 'PRESS ENTER OR START TO BEGIN', {
            fontFamily: 'NES',
            fontSize: 14,
            color: '#ffff00',
            stroke: '#000000',
            resolution: 3,
        }).setOrigin(0.5, 0.5);

        this.cursors  = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey('ENTER');
        this.spaceKey = this.input.keyboard.addKey('SPACE');

            this.inputHabilitado = false;
    this.time.delayedCall(500, () => {
        this.inputHabilitado = true;
    });

    // ── Sonido del menú con loop y fade ─────────────────────────────────
    // ── Sonido del menú ──────────────────────────────────────────────
this.menuSound = this.sound.add('menu_bonus_st', {
    volume: 0.1,
    loop: true  // ← loop nativo, sin necesidad de fade manual
});
this.menuSound.play();

// Detener cuando se cambia de escena
this.events.once('shutdown', () => {
    if (this.menuSound) {
        this.menuSound.stop();
        this.menuSound.destroy();
    }
});

}

    update() {

        if (!this.inputHabilitado) return; // ← ignorar todo input hasta que pase el delay
        const pad = this.input.gamepad?.getPad(0);
        const gpDown  = pad?.axes[1]?.value > 0.3 || pad?.down;
        const gpUp    = pad?.axes[1]?.value < -0.3 || pad?.up;
        const gpStart = pad?.buttons[9]?.pressed;

        // Cooldown para el stick
        if ((gpDown || gpUp) && !this.gpCooldown) {
            this.gpCooldown = true;
            this.time.delayedCall(200, () => { this.gpCooldown = false; });

            if (gpDown) {
                this.selectedIndex = (this.selectedIndex + 1) % this.montanas.length;
                this.updateMartillo();
            } else if (gpUp) {
                this.selectedIndex = (this.selectedIndex - 1 + this.montanas.length) % this.montanas.length;
                this.updateMartillo();
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.selectedIndex = (this.selectedIndex + 1) % this.montanas.length;
            this.updateMartillo();
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.selectedIndex = (this.selectedIndex - 1 + this.montanas.length) % this.montanas.length;
            this.updateMartillo();
        }

        if (Phaser.Input.Keyboard.JustDown(this.enterKey) ||
            Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
            gpStart) {
            this.scene.start(this.montanas[this.selectedIndex].scene);
        }
    }

    updateMartillo() {
        this.martillo.y = this.opciones[this.selectedIndex].y;
        
        // Reproducir sonido blip al cambiar opción
        const soundVolume = 0.5; // Ajustable (0 a 1)
        this.sound.play('blip', { volume: soundVolume });
    }
}