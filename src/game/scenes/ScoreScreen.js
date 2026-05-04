import * as Phaser from 'phaser';
import { Scene } from 'phaser';
import { scoreManager } from '../systems/ScoreManager';

export class ScoreScreen extends Scene {

    constructor() {
        super('ScoreScreen');
    }

    create() {
        const width  = this.scale.width;
        const height = this.scale.height;

        this.cameras.main.setBackgroundColor(0x000000);

        const scoreboard = this.add.image(width * 0.30, height * 0.5, 'scoreboard_player');
        scoreboard.setOrigin(0.5, 0.5);

        const summary = scoreManager.getSummary();

const filas = [
    { sprite: summary.collectableSprite, puntos: summary.collectables.puntosPorUnidad, cantidad: summary.collectables.cantidad, scale: 1.0, offsetY: 0  },
    { sprite: 'yeti_ice',                puntos: summary.yetiIce.puntosPorUnidad,      cantidad: summary.yetiIce.cantidad,      scale: 2.0, offsetY: -8 },
    { sprite: 'bird_knocked',            puntos: summary.birds.puntosPorUnidad,        cantidad: summary.birds.cantidad,        scale: 2.0, offsetY: 0  },
    { sprite: 'broken_block_green',      puntos: summary.blocks.puntosPorUnidad,       cantidad: summary.blocks.cantidad,       scale: 1.0, offsetY: 0  },
];
        const startX = width * 0.19;
        const startY = 216;
        const rowH   = 33;

        const textStyle = {
            fontFamily: 'NES',
            fontSize: 16,
            color: '#ffffff',
            resolution: 3,
        };

        // ── Título de la montaña ─────────────────────────────────────────
this.add.text(width * 0.50, 50, summary.mountainName, {
    ...textStyle,
    fontSize: 16,
    color: '#ffffff',
}).setOrigin(0.5, 0.5);

         // ── Bonus ────────────────────────────────────────────────────────
        this.time.delayedCall(0, () => {
    const bonusTexto = scoreManager.bonusWon ? `WINNER\nBONUS!\n${summary.bonusPoints}` : 'NO\nBONUS!';

    this.add.text(startX + 46, startY - 60, bonusTexto, {
        ...textStyle,
        color: '#ffffff',
    }).setOrigin(0, 0.5);

    // Sprite solo si perdió el bonus
    if (scoreManager.bonusWon) {
        if (!this.anims.exists('player_celebrating_anim')) {
            this.anims.create({
                key: 'player_celebrating_anim',
                frames: this.anims.generateFrameNumbers('player_celebrating', { start: 1, end: 0 }),
                frameRate: 1,
                repeat: -1
            });
        }

                const celebSprite = this.add.sprite(startX + 26, startY - 60, 'player_celebrating')
        .setOrigin(1, 0.5)
        .setScale(1)
        .play('player_celebrating_anim');

        const baseY = celebSprite.y;

        // Sincronizado con el segundo frame (cada 250ms sube y baja)
        this.time.addEvent({
    delay: 2000,
    loop: true,
    callback: () => {
        this.tweens.add({
            targets: celebSprite,
            y: baseY - 20,
            duration: 400,
            ease: 'Power1',
            yoyo: true,
        });
    }
});

        // Reproducir sonido de salto cada segundo
        this.jumpSoundTimer = this.time.addEvent({
            delay: 2000,
            loop: true,
            callback: () => {
                this.sound.play('jump', { volume: 0.6 });
            }
        });

        // Limpiar sonidos al dejar la escena
        this.events.on('shutdown', () => {
            if (this.jumpSoundTimer) {
                this.jumpSoundTimer.destroy();
            }
        });

    } else {
        if (!this.anims.exists('player_crying_anim')) {
            this.anims.create({
                key: 'player_crying_anim',
                frames: this.anims.generateFrameNumbers('player_crying', { start: 0, end: 3 }),
                frameRate: 2,
                repeat: -1
            });
        }
         // Reproducir sonido de salto cada segundo
        this.crySoundTimer = this.time.addEvent({
            delay: 960,
            loop: true,
            callback: () => {
                this.sound.play('hit_yeti', { volume: 0.6 });
            }
        });

        // Limpiar sonidos al dejar la escena
        this.events.on('shutdown', () => {
            if (this.crySoundTimer) {
                this.crySoundTimer.destroy();
            }
        });

        this.add.sprite(startX + 30, startY - 65, 'player_crying')
            .setOrigin(1, 0.5)
            .setScale(1)
            .play('player_crying_anim');
    }
});





       filas.forEach((fila, i) => {
    this.time.delayedCall(i * 800, () => {
        const y = startY + (i * rowH);

        this.add.image(startX, y + fila.offsetY, fila.sprite)
            .setOrigin(0.5, 0.5)
            .setScale(fila.scale);

        this.add.text(startX + 39, y, `${fila.puntos}`, {
            ...textStyle,
        }).setOrigin(0, 0.5);

        // Texto de cantidad con animación ascendente
        const cantidadTexto = this.add.text(startX + 110, y, '00', {
            ...textStyle,
        }).setOrigin(0, 0.5);

        // Animación ascendente de 0 hasta la cantidad real
        let contador = 0;
        const objetivo = fila.cantidad;
        const pasos = 10; // cuántos pasos tarda en llegar
        const intervalo = 400 / Math.max(objetivo, 1); // duración total ~400ms

        const tick = this.time.addEvent({
            delay: Math.max(intervalo, 30),
            repeat: objetivo,
            callback: () => {
                contador = Math.min(contador + 1, objetivo);
                cantidadTexto.setText(String(contador).padStart(2, '0'));
                if (contador >= objetivo) tick.destroy();
            }
        });
    });
});

       

        // ── Total ────────────────────────────────────────────────────────
        this.time.delayedCall((filas.length * 800) + 800, () => {
            const total = String(summary.totalGeneral).padStart(7, '0');
            this.add.text(startX, startY + (filas.length * rowH) + 45, total, {
                ...textStyle,
                color: '#ffffff',
            }).setOrigin(0, 0.5);
        });

        // ── Continuar ────────────────────────────────────────────────────
        this.time.delayedCall((filas.length * 800) + 3000, () => {
    let yaEjecutado = false;

    const continuar = () => {
        if (yaEjecutado) return;
        yaEjecutado = true;

        scoreManager.cerrarEtapa();

        if (scoreManager.currentLevel === 'Level1') {
            this.scene.start('Level2');
        } else {
            this.scene.start('MainMenu');
        }
    };

    this.input.keyboard.once('keydown-ENTER', continuar);

    this.input.gamepad?.once('down', (pad, button) => {
        if (button.index === 9 || button.index === 0) continuar();
    });

    const textoContinuar = this.add.text(width * 0.50, height * 0.95, 'START PARA CONTINUAR', {
        ...textStyle,
        resolution: 3,
        fontSize: 16,
        color: '#ffffff',
    }).setOrigin(0.5, 0.5);

let visible = true;
this.time.addEvent({
    delay: 600,
    loop: true,
    callback: () => {
        visible = !visible;
        textoContinuar.setVisible(visible);
    }
});
});
}
}