import * as Phaser from 'phaser';
import { Scene } from 'phaser';
import { Player } from '../entities/Player';
import { EventBus } from '../EventBus';
import { CloudManager } from '../systems/CloudManager';
import { scoreManager } from '../systems/ScoreManager';

export class BonusStage2 extends Scene {

    constructor() {
        super('BonusStage2');
    }

    init(data) {
        // Recibir las coordenadas del jugador desde Level2
        this.playerSpawnX = data.playerX || 128;
        this.playerSpawnY = data.playerY || 128;
    }

    create() {
        this.cameras.main.fadeIn(600, 0, 0, 0);
        // Background negro
        this.cameras.main.setBackgroundColor('#000000');
        
        // ── Tilemap ──────────────────────────────────────────────────────
        this.map = this.make.tilemap({ key: 'map_bonusstage2' });
        const tileset = this.map.addTilesetImage('Tileset_ice_climber_plataforms', 'tiles_level1');
        
        // ── Layer de background ──────────────────────────────────────────
        this.backgroundLayer = this.map.createLayer('Background', tileset, 0, 0);
        
        this.platformLayer = this.map.createLayer('Platforms', tileset, 0, 0);
        
        this.platformLayer.setCollisionByProperty({ collidable: true });

        // Plataformas por arriba de las nubes
        this.platformLayer.setDepth(10);

        // ── Jugador en coordenadas guardadas ──────────────────────────────
        this.player = new Player(this, this.playerSpawnX, this.playerSpawnY);
        
        // ── Colisión jugador con plataformas ─────────────────────────────
        this.physics.add.collider(this.player.sprite, this.platformLayer);

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels - 844);
        this.cameras.main.scrollY = this.map.heightInPixels - this.cameras.main.height;

        // El offset equivale a 2 pisos hacia abajo
        this.cameras.main.setFollowOffset(0, 160);
        this.floorHeight = 80;

        // ── Nubes móviles ────────────────────────────────────────────────
        this.cloudManager = new CloudManager(this, this.map);
        this.cloudManager.setPlayerSprite(this.player.sprite);
        this.player.setCloudManager(this.cloudManager);
        
        // Crear collider con callbacks para rastrear contacto con nubes
        this.physics.add.collider(
            this.player.sprite, 
            this.cloudManager.group,
            null,
            (player, cloud) => {
                // Callback cuando el jugador está sobre la nube
                this.cloudManager.setActiveCloud(cloud);
                return true;
            }
        );

        console.log(`BonusStage2 iniciado. Jugador en: ${this.playerSpawnX}, ${this.playerSpawnY}`);

        this.bonusCompleted = false;

        // ── Sonido del bonus stage ────────────────────────
        const bonusSoundVolume = 0.1; // Ajustable (0 a 1)
        this.sound.play('menu_bonus_st', { volume: bonusSoundVolume });

        // ── Contador de tiempo ───────────────────────────────────────────
this.tiempoRestante = 40;

// ── Marco del timer ──────────────────────────────────────────────
this.add.image(50, 704 -8, 'marco_timer').setOrigin(0.5, 0).setDepth(19).setScale(2);
this.add.image(40, 168 -8, 'marco_timer').setOrigin(0.5, 0).setDepth(19).setScale(2);

// ── Función para formatear el tiempo con ceros ───────────────────
const formatTiempo = (t) => {
    const clamped = Math.max(0, t);
    const entero = Math.floor(clamped).toString().padStart(2, '0');
    const decimal = (clamped % 1).toFixed(1).split('.')[1];
    return `TIME\n${entero}.${decimal}`;
};

this.contadorTexto = this.add.text(50, 704, formatTiempo(40), {
    fontFamily: 'NES',
    fontSize: 16,
    color: '#ff8473',
    resolution: 2,
    align: 'center',
}).setOrigin(0.5, 0).setDepth(20);

this.contadorTexto2 = this.add.text(40, 168, formatTiempo(40), {
    fontFamily: 'NES',
    fontSize: 16,
    color: '#ff8473',
    resolution: 2,
    align: 'center',
}).setOrigin(0.5, 0).setDepth(20);

this.timerEvent = this.time.addEvent({
    delay: 100,
    callback: () => {
        this.tiempoRestante -= 0.1;

        if (this.tiempoRestante <= 0) {
            this.tiempoRestante = 0;
            this.contadorTexto.setText(formatTiempo(0));
            this.contadorTexto2.setText(formatTiempo(0));
            // Detener música
            this.sound.stopByKey('menu_bonus_st');
            this.scene.stop('UIScene');
            this.scene.start('ScoreScreen');
            return;
        }

        const texto = formatTiempo(this.tiempoRestante);
        this.contadorTexto.setText(texto);
        this.contadorTexto2.setText(texto);
    },
    loop: true
});

this.add.text(240, 875, 'BONUS STAGE', {
    fontFamily: 'NES',
    fontSize: 16,
    color: '#ffffff',
    resolution: 3,
    align: 'center',
}).setOrigin(0.5, 0).setDepth(20);

// ── Collectables (Lettuce) ───────────────────────────────────────
this.collectables = this.physics.add.staticGroup();

const collectableLayer = this.map.getObjectLayer('Collectable');
if (collectableLayer) {
    collectableLayer.objects.forEach(obj => {
        const spriteName = obj.properties?.find(p => p.name === 'sprite')?.value;
        // Tiled usa la esquina superior izquierda, así que centramos el objeto
        const centerX = obj.x + (obj.width / 2);
        const centerY = obj.y + (obj.height / 2);
        const item = this.collectables.create(centerX, centerY, spriteName);
        item.setOrigin(0.5, 0.5);
    });
}

// Overlap jugador con collectables
this.physics.add.overlap(
    this.player.sprite,
    this.collectables,
    (player, item) => {
        item.destroy();
        // TODO: agregar puntos acá
        scoreManager.addCollectable();
        
        // Reproducir sonido collect_veggies
        const collectVeggiesVolume = 0.6;
        this.sound.play('collect_veggies', { volume: collectVeggiesVolume });
        
        console.log('¡Lechuga recolectada!');
    }
);


        this.ultimoPiso = 0;

        // ── Condor ───────────────────────────────────────────────────────
        this.spawnCondor();
    }

    spawnCondor() {
        // Crear animación si no existe
        if (!this.anims.exists('condor_fly')) {
            this.anims.create({
                key: 'condor_fly',
                frames: this.anims.generateFrameNumbers('condor_flying', { start: 0, end: 2 }),
                frameRate: 10,
                repeat: -1
            });
        }

        this.condor = this.physics.add.sprite(512, 222, 'condor_flying');
        this.condor.body.allowGravity = false;
        this.condor.setCollideWorldBounds(false);
        this.condor.play('condor_fly');
        this.condor.setScale(2);
        

        // Movimiento horizontal de derecha a izquierda
        this.condor.speedX = 100;
        this.condor.setVelocityX(-this.condor.speedX);

        // Colisión con jugador
        this.physics.add.overlap(
    this.player.sprite,
    this.condor,
    () => {
        if (!this.condor || !this.condor.active) return;
        if (this.bonusCompleted) return; // evitar múltiples triggers
        
        this.bonusCompleted = true;
        this.timerEvent.paused = true; // ← detener el timer
        scoreManager.setBonusWon();
        
        // Detener música y reproducir sonido de victoria
        this.sound.stopByKey('menu_bonus_st');
        const winBonusVolume = 0.6; // Ajustable (0 a 1)
        this.sound.play('win_bonus', { volume: winBonusVolume });

        // Congelar todo
        this.player.sprite.setVelocity(0, 0);
        this.player.sprite.body.enable = false;
        this.condor.setVelocity(0, 0);
        this.physics.world.pause();

        // Esperar 5 segundos y pasar al scorescreen
        this.time.delayedCall(5000, () => {
            this.physics.world.resume();
            this.scene.stop('UIScene');
            this.scene.start('ScoreScreen');
        });
    }
);
    }

    update() {
        this.player.update();
        const playerSprite = this.player.sprite;

        const pisoActual = Math.floor((this.map.heightInPixels - this.player.sprite.y) / this.floorHeight);
        console.log(`Jugador Y: ${this.player.sprite.y.toFixed(2)}, Piso: ${pisoActual}`);

        // ── Romper bloques desde abajo ───────────────────────────────────
        if (this.platformLayer && playerSprite.body.velocity.y < 0 && !this.player.hasHitBlock) {
            const tileY = this.platformLayer.worldToTileY(playerSprite.body.top - 4);
            const tileX = this.platformLayer.worldToTileX(playerSprite.body.center.x);
            const tile = this.platformLayer.getTileAt(tileX, tileY);

            if (tile && tile.properties?.type === 'normal') {
                this.platformLayer.removeTileAt(tile.x, tile.y);
                playerSprite.setVelocityY(0);
                this.player.hasHitBlock = true;
                
                // Cortar sonido de salto al romper bloque
                this.sound.stopByKey('jump');
            }
        }

        // ── Cámara ───────────────────────────────────────────────────────
        const onGround = this.player.sprite.body.blocked.down;
        

        if (onGround) {
            const tileX = this.platformLayer.worldToTileX(playerSprite.body.center.x);
            const tileY = this.platformLayer.worldToTileY(playerSprite.body.bottom);
            const tile = this.platformLayer.getTileAt(tileX, tileY);

            if (tile && tile.properties?.conveyor) {
                const conveyorDir = tile.properties.conveyor; // 'left' o 'right'
                const playerVelX = playerSprite.body.velocity.x;
                const movingWithConveyor = 
                    (conveyorDir === 'right' && playerVelX >= 0) ||
                    (conveyorDir === 'left'  && playerVelX <= 0);

                const speedWith    = 30;
                const speedAgainst = 90;

                const conveyorSpeed = movingWithConveyor ? speedWith : speedAgainst;
                const direction = conveyorDir === 'right' ? 1 : -1;

                playerSprite.setVelocityX(playerVelX + direction * conveyorSpeed);
            }
        }

        if (pisoActual >= 4 && pisoActual !== this.ultimoPiso && onGround && !this.player.isDying) {
            this.ultimoPiso = pisoActual;
            const targetScrollY = this.map.heightInPixels - (pisoActual * this.floorHeight) - this.cameras.main.height + (this.floorHeight * 2);
            
            if (targetScrollY < this.cameras.main.scrollY) {
                this.tweens.add({
                    targets: this.cameras.main,
                    scrollY: targetScrollY,
                    duration: 400,
                    ease: 'Linear'
                });
            }
        }

        this.cloudManager.update();
        // ── Eliminar tiles que quedan por debajo de la cámara ───────────────────
        const camBottomTile = this.platformLayer.worldToTileY(this.cameras.main.scrollY + this.cameras.main.height);

        for (let row = 0; row <= 2; row++) {
            for (let tileX = 0; tileX < this.platformLayer.width; tileX++) {
                const tile = this.platformLayer.getTileAt(tileX, camBottomTile + row);
                if (tile) {
                    this.platformLayer.removeTileAt(tileX, camBottomTile + row);
                }
            }
        }

        // ── Condor: movimiento y warp ────────────────────────────────────
        if (this.condor && this.condor.active) {
            const camera = this.cameras.main;
            const screenLeft = camera.scrollX;
            const screenRight = camera.scrollX + camera.width;

            // Warp: si sale de la pantalla por un lado, aparece del otro
            if (this.condor.x < screenLeft - 50) {
                this.condor.x = screenRight + 50;
            } else if (this.condor.x > screenRight + 50) {
                this.condor.x = screenLeft - 50;
            }
        }

        // ── Muerte por caída: directamente GameOver (sin vidas) ───────────
        const camBottom = this.cameras.main.scrollY + this.cameras.main.height;

        if (this.player.sprite.y > camBottom && !this.player.isDying) {
            console.log('¡Jugador se cayó en BonusStage2! Game Over directo.');            // Detener música
            this.sound.stopByKey('menu_bonus_st');            this.scene.stop('UIScene');
            this.scene.start('ScoreScreen');
        }
    }
}
