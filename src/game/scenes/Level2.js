import * as Phaser from 'phaser';
import { Scene } from 'phaser';
import { Player } from '../entities/Player';
import { EventBus } from '../EventBus';
import { CloudManager } from '../systems/CloudManager';
import { Bird } from '../entities/Bird';
import { Yeti } from '../entities/Yeti';
import { scoreManager } from '../systems/ScoreManager';

export class Level2 extends Scene {

    constructor() {
        super('Level2');
    }

    create() {
        //background negro
        this.cameras.main.setBackgroundColor('#000000');

        scoreManager.setLevel('Level2');
        
        // Reproducir música de nivel en bucle
        this.sound.play('level_st', { volume: 0.5, loop: true });
        
        // ── Tilemap ──────────────────────────────────────────────────────
        this.map = this.make.tilemap({ key: 'map_level2' });
        const tileset = this.map.addTilesetImage('Tileset_ice_climber_plataforms', 'tiles_level2');
        
        // ── Layer de background ──────────────────────────────────────────
        this.backgroundLayer = this.map.createLayer('Background', tileset, 0, 0);
        
        this.platformLayer = this.map.createLayer('Platforms', tileset, 0, 0);
        
        this.platformLayer.setCollisionByProperty({ collidable: true });

        //plataformas por arriba de las nubes
        this.platformLayer.setDepth(10);
        this.playerWallLayer = this.map.createLayer('PlayerWalls', tileset, 0, 0);
        this.playerWallLayer.setCollisionByProperty({ collidable: true });
        this.playerWallLayer.setDepth(10);

       

        // Los yetis NO tienen colisión con playerWallLayer, así que la atraviesan

        // ── Jugador ──────────────────────────────────────────────────────
        this.player = new Player(this, 128, this.map.heightInPixels - 128);
        this.lives = 3;
        this.bonusStageTriggered = false;
        this.bonusStageReady = false;
        this.isTransitioningToBonus = false;
        this.playerPreviousY = this.player.sprite.y;

        // ── Colisión jugador con plataformas ─────────────────────────────
        this.physics.add.collider(this.player.sprite, this.platformLayer);
         // Solo el jugador colisiona con ella
        this.physics.add.collider(this.player.sprite, this.playerWallLayer);

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.scrollY = this.map.heightInPixels - this.cameras.main.height;

        // El offset equivale a 2 pisos hacia abajo (2 x 80px = 160px)
        this.cameras.main.setFollowOffset(0, 160);
        this.floorHeight = 80;

        // Límite inferior: la cámara no baja del fondo del mapa
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels - 48);
        this.ultimoPiso = 0;

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

        this.scene.launch('UIScene');

        // ── Pájaro ───────────────────────────────────────────────────────
        // ── Yetis (máximo 2 simultáneos) ──────────────────────────────────
        this.yetis = [];
        this.maxYetis = 2;
        
        // Spawn inicial de Yetis con delay de 3 segundos
        this.time.delayedCall(3000, () => {
            this.spawnBird(0, this.cameras.main.scrollY + 80);
            this.spawnYeti();
        });
        
        // Spawn periódico cada 8-12 segundos
        this.spawnYetiTimer = this.time.addEvent({
            delay: Phaser.Math.Between(8000, 12000),
            callback: this.scheduleYetiSpawnTimer,
            callbackScope: this,
            loop: true,
            startAt: 3000
        });
        // ── Estalactitas ─────────────────────────────────────────────────
this.stalactites = [];

this.time.addEvent({
    delay: Phaser.Math.Between(4000, 5000),
    callback: this.spawnStalactite,
    callbackScope: this,
    loop: true

    
});
this.input.keyboard.on('keydown-ESC', () => {
            this.scene.pause();
            this.scene.launch('PauseMenu', { from: this.scene.key });
        });

        this.input.gamepad?.on('down', (pad, button) => {
            if (button.index === 9) {
                this.scene.pause();
                this.scene.launch('PauseMenu', { from: this.scene.key });
            }
        });
    }

    update() {
        // No actualizar nada del jugador si está en transición a bonus stage
        if (!this.isTransitioningToBonus) {
            this.player.update();
        }
        const playerSprite = this.player.sprite;

        // ── DEBUG: Mostrar posición del jugador ──────────────────────────
        const pisoActual = Math.floor((this.map.heightInPixels - this.player.sprite.y) / this.floorHeight);
        console.log(`Jugador Y: ${this.player.sprite.y.toFixed(2)}, Piso: ${pisoActual}`);

        // ── Romper bloques desde abajo ───────────────────────────────────
        if (this.platformLayer && playerSprite.body.velocity.y < 0 && !this.player.hasHitBlock) {
            const tileY = this.platformLayer.worldToTileY(playerSprite.body.top - 16);
            const tileX = this.platformLayer.worldToTileX(playerSprite.body.center.x);
            const tile = this.platformLayer.getTileAt(tileX, tileY);

            if (tile && tile.properties?.type === 'normal') {
                const tileId = tile.index - 1; // Phaser suma 1 al firstgid, restamos para obtener el ID real
                const tileWorldX = this.platformLayer.tileToWorldX(tile.x) + 8;
                const tileWorldY = this.platformLayer.tileToWorldY(tile.y) + 8;
                
                // Eliminar estalactitas que estén encima de este bloque
                this.removeStalactitesAboveTile(tile.x, tile.y);
                
                this.platformLayer.removeTileAt(tile.x, tile.y);
                playerSprite.setVelocityY(0);
                this.player.hasHitBlock = true;
                scoreManager.addBlock();
                
                // Cortar sonido de salto al romper bloque
                this.sound.stopByKey('jump');
                
                // Reproducir sonido block_break
                const blockBreakVolume = 0.2;
                this.sound.play('block_break', { volume: blockBreakVolume });
                
                this.spawnBrokenBlock(tileWorldX, tileWorldY, tileId);
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

                const speedWith    = 30;  // velocidad cuando va en la misma dirección
                const speedAgainst = 90;  // velocidad cuando va en contra

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
        
        if (this.bird) this.bird.update(this.sys.game.loop.delta);

        // ── Detección de martillazo contra el pájaro ────────────────────
        if (this.bird && this.player.isHammering && this.player.getHammerHitbox().body.enable) {
            const hammerHitbox = this.player.getHammerHitbox();
            const distance = Phaser.Math.Distance.Between(
                hammerHitbox.x,
                hammerHitbox.y,
                this.bird.sprite.x,
                this.bird.sprite.y
            );

            // Si el martillo está cerca del pájaro (dentro del rango de hitbox)
            if (distance < 35) {
                this.onHammerHitBird();
            }
        }

        // Actualizar Yetis
        this.yetis.forEach(yeti => {
            if (yeti && yeti.sprite && yeti.sprite.active) {
                yeti.update(this.sys.game.loop.delta);
            }
        });
        
        // Limpiar Yetis destruidos
        this.yetis = this.yetis.filter(yeti => yeti.sprite && yeti.sprite.active);
        
        // Detectar martillazo contra Yetis
        if (this.player.isHammering && this.player.getHammerHitbox().body.enable) {
            const hammerHitbox = this.player.getHammerHitbox();
            
            this.yetis.forEach(yeti => {
                if (!yeti || !yeti.sprite) return;
                
                const distance = Phaser.Math.Distance.Between(
                    hammerHitbox.x,
                    hammerHitbox.y,
                    yeti.sprite.x,
                    yeti.sprite.y
                );
                
                if (distance < 35 && yeti.state !== 'STUNNED') {
                    yeti.hit();
                    
                    // Reproducir sonido hit_yeti
                    const hitYetiVolume = 0.7;
                    this.sound.play('hit_yeti', { volume: hitYetiVolume });
                }
            });
        }

        // ── Detector para ingresar a BonusStage2 ─────────────────────────
        // Se activa cuando el jugador está en el suelo y alcanza Y=1000
    // Activar bonusStageReady solo cuando el jugador haya subido del piso inicial
if (!this.bonusStageReady && this.player.sprite.y < 1000) {
    this.bonusStageReady = true;
}

if (this.bonusStageReady && this.player.sprite.y >= 1000 && !this.bonusStageTriggered && !this.player.isDying) {
    this.bonusStageTriggered = true;
            // Detener spawn periódico de Yetis
            if (this.spawnYetiTimer) this.spawnYetiTimer.destroy();
            
            // Delay de 500ms para que el sprite llegue a un estado idle
            this.time.delayedCall(500, () => {
                this.isTransitioningToBonus = true;
                
                // Congelar completamente al jugador durante la transición
                this.player.sprite.body.enable = false;
                this.player.sprite.setVelocity(0, 0);
                this.player.sprite.stop();

                // La cámara se mueve sola hasta donde está el jugador
                const targetScrollY = this.player.sprite.y - this.cameras.main.height / 2 - 138;

                this.tweens.add({
                    targets: this.cameras.main,
                    scrollY: targetScrollY,
                    duration: 1200,
                    ease: 'Linear',
                    onComplete: () => {
                        // Detener música de nivel
                        this.sound.stopByKey('level_st');
                        // Fade out y cambiar escena
                        this.cameras.main.fadeOut(600, 0, 0, 0);
                        this.cameras.main.once('camerafadeoutcomplete', () => {
                            this.scene.stop('UIScene');
                            this.scene.start('BonusStage2', {
                                playerX: this.player.sprite.x,
                                playerY: this.player.sprite.y
                            });
                        });
                    }
                });
            });
        }
        // ── Limpiar estalactitas fuera de pantalla ───────────────────────
        this.stalactites = this.stalactites.filter(s => {
            if (s.active && s.y > this.cameras.main.scrollY + this.cameras.main.height + 50) {
                s.destroy();
                return false;
            }
            return s.active;
        });

        // ── Actualizar efecto de flip vertical en estalactitas ──────────
        this.stalactites.forEach(stalactite => {
            if (stalactite.active && (stalactite.isFalling || stalactite.anims?.isPlaying)) {
                stalactite.flipTimer = (stalactite.flipTimer || 0) + 1;
                
                // Alternar flipY cada 0.5 segundos (30 frames a 60fps)
                if (stalactite.flipTimer >= 10) {
                    stalactite.setFlipX(!stalactite.flipX);
                    stalactite.flipTimer = 0;
                }
            }
        });
        
        // Guardar Y anterior para el siguiente frame
        this.playerPreviousY = this.player.sprite.y;

        // ── Eliminar tiles que quedan por debajo de la cámara ────────────
        const camBottomTile = this.platformLayer.worldToTileY(this.cameras.main.scrollY + this.cameras.main.height);

        for (let row = 0; row <= 3; row++) {
            for (let tileX = 0; tileX < this.platformLayer.width; tileX++) {
                const tile = this.platformLayer.getTileAt(tileX, camBottomTile + row);
                if (tile) {
                    this.platformLayer.removeTileAt(tileX, camBottomTile + row);
                }
            }
        }

        // ── Muerte por caída ─────────────────────────────────────────────
        const camBottom = this.cameras.main.scrollY + this.cameras.main.height;
        if (this.player.sprite.y > camBottom && !this.player.isDying && !this.bonusStageTriggered) {
            this.loseLife();
        }
    }

    onHammerHitBird() {
        if (!this.bird) return;
        if (this.bird.isKnocked) return; // ← evita contar múltiples veces

        this.bird.isKnocked = true; // ← marcar como ya golpeado
        this.bird.setState('knocked');
        scoreManager.addBird();
        
        // Reproducir sonido hit_bird
        const hitBirdVolume = 0.7;
        this.sound.play('hit_bird', { volume: hitBirdVolume });
    }

    loseLife() {
        if (this.player.isDying) return;

        this.lives -= 1;
        EventBus.emit('player-died', { lives: this.lives });

        // Reproducir sonido lose_life
        const loseLifeVolume = 0.2;
        this.sound.play('lose_life', { volume: loseLifeVolume });

        if (this.lives <= 0) {
        // Detener música de nivel
        this.sound.stopByKey('level_st');
        this.scene.stop('UIScene');
        
        const respawnY = this.cameras.main.scrollY + this.cameras.main.height - (this.floorHeight * 2);
        
        // Reproducir animación de muerte igual que siempre
        this.player.takeDamage(128, respawnY, () => {
            // Cuando termina la animación, mostrar cartel
            const width = this.scale.width;
            const height = this.scale.height;

            const gameOverImg = this.add.image(width / 2, height + 100, 'game_over')
                .setScrollFactor(0)
                .setDepth(100);

            this.tweens.add({
                targets: gameOverImg,
                y: height / 2,
                x: width / 2,
                duration: 600,
                ease: 'Back.easeOut',
                onComplete: () => {
                    this.time.delayedCall(2000, () => {
                        this.scene.start('ScoreScreen');
                    });
                }
            });
        });

    } else {
        const respawnY = this.cameras.main.scrollY + this.cameras.main.height - (this.floorHeight * 2);
        this.player.takeDamage(128, respawnY);
    }
    }

    spawnBird(x, y) {
        this.bird = new Bird(this, x, y);

        // Overlap para detectar colisión con el jugador (muerte o salto sobre el pájaro)
        this.physics.add.overlap(
            this.player.sprite,
            this.bird.sprite,
            () => {
                if (!this.bird) return; // Ya fue destruido
        
                if (this.player.state === 'jumping' || this.player.state === 'falling') {
    if (this.bird.isKnocked) return; // ← mismo fix acá
    this.bird.isKnocked = true;
    this.bird.setState('knocked');
    scoreManager.addBird();


            
                    // El respawn ahora se hace en Bird.js
                } else {
                    // Si no está saltando, pierde vida
                    if (!this.player.isInvulnerable) {
                        this.loseLife();
                    }
                }
            }
        );
        this.physics.add.overlap(
    this.player.sprite,
    this.bird.sprite,
    () => {
        if (!this.bird) return;
        if (this.bird.state === 'knocked') return; // ← ignorar si ya está golpeado

        if (this.player.state === 'jumping' || this.player.state === 'falling') {
            if (this.bird.isKnocked) return;
            this.bird.isKnocked = true;
            this.bird.setState('knocked');
            scoreManager.addBird();
        } else {
            if (!this.player.isInvulnerable) {
                this.loseLife();
            }
        }
    }
);
    }

spawnYeti() {
        if (this.bonusStageTriggered) return; // No spawnar si ya se activó BonusStage
        
        this.yetis = this.yetis.filter(y => y && y.sprite && y.sprite.active);

        if (this.yetis.length >= this.maxYetis) {
            console.log('Ya hay 2 Yetis, no spawneo más');
            return;
        }

        const spawnSide = Math.random() > 0.5 ? 'right' : 'left';
const spawnDirection = spawnSide === 'right' ? -1 : 1;
const spawnTile = this.findYetiSpawnTile(spawnSide);

if (!spawnTile) return;

const spawnWorldY = this.platformLayer.tileToWorldY(spawnTile.y);
const spawnPiso = Math.floor((this.map.heightInPixels - spawnWorldY) / this.floorHeight);

// Verificar si ya hay un yeti en ese piso
const pisoOcupado = this.yetis.some(y => {
    if (!y || !y.sprite) return false;
    const yetiPiso = Math.floor((this.map.heightInPixels - y.sprite.y) / this.floorHeight);
    return yetiPiso === spawnPiso;
});

if (pisoOcupado) {
    this.time.delayedCall(2000, () => this.spawnYeti());
    return;
}

let spawnX, spawnY;

spawnX = spawnSide === 'right'
    ? this.cameras.main.scrollX + this.cameras.main.width - 20
    : this.cameras.main.scrollX + 20;
spawnY = spawnWorldY - 24;

        console.log('Spawneando Yeti en:', { spawnX, spawnY, spawnSide, spawnDirection, spawnTile });

        const yeti = new Yeti(this, spawnX, spawnY, this.platformLayer, spawnDirection, () => this.scheduleYetiSpawn());

        // Colisión con plataformas
        // Después:
        const yetiCollider = this.physics.add.collider(yeti.sprite, this.platformLayer);
        yeti.platformCollider = yetiCollider;

        // Overlap martillo con bloque de hielo del yeti
this.physics.add.overlap(
    this.player.getHammerHitbox(),
    yeti.iceBlock,
    () => {
        if (!this.player.isHammering) return;
        if (!yeti.iceBlock.visible) return;

        yeti.iceBlock.setVisible(false);
        scoreManager.addYetiIce();
    }
);

        // Colisión con jugador (muerte)
        this.physics.add.overlap(
            this.player.sprite,
            yeti.sprite,
            () => {
                if (yeti && yeti.sprite && yeti.state !== 'STUNNED') {
                    if (!this.player.isInvulnerable) {
                        console.log('¡Colisión con Yeti!');
                        this.loseLife();
                    }
                }
            }
        );

        this.yetis.push(yeti);
        console.log('Total Yetis:', this.yetis.length);
    }

    scheduleYetiSpawn() {
        this.time.delayedCall(4000, () => {
            this.yetis = this.yetis.filter(y => y && y.sprite && y.sprite.active);
            if (this.yetis.length < this.maxYetis) {
                this.spawnYeti();
            }
        });
    }

    scheduleYetiSpawnTimer() {
        this.yetis = this.yetis.filter(y => y && y.sprite && y.sprite.active);
        if (this.yetis.length < this.maxYetis && !this.bonusStageTriggered) {
            this.spawnYeti();
        }
    }

    findYetiSpawnTile(spawnSide) {
        const visibleTopTile = this.platformLayer.worldToTileY(this.cameras.main.scrollY);
        const visibleBottomTile = this.platformLayer.worldToTileY(this.cameras.main.scrollY + this.cameras.main.height);
        const visibleTiles = [];

        for (let tileY = visibleTopTile; tileY <= visibleBottomTile; tileY++) {
        for (let tileX = 0; tileX < this.platformLayer.width; tileX++) {
        const tile = this.platformLayer.getTileAt(tileX, tileY);
        if (tile && tile.properties?.collidable) {
        const tileWorldY = this.platformLayer.tileToWorldY(tileY);
        const piso = Math.floor((this.map.heightInPixels - 48 - tileWorldY) / this.floorHeight);
        
        // Excluir pisos 2 y 7 y superiores a 9
        if (piso === 2 || piso === 7 || piso > 9) continue;
        

        visibleTiles.push({ x: tileX, y: tileY });
         }
            }
        }

        if (visibleTiles.length === 0) {
            return null;
        }

        const filteredTiles = visibleTiles.filter(tile =>
            spawnSide === 'left'
                ? tile.x < this.platformLayer.width / 2
                : tile.x >= this.platformLayer.width / 2
        );

        const pool = filteredTiles.length ? filteredTiles : visibleTiles;
        const randomIndex = Phaser.Math.Between(0, pool.length - 1);
        return pool[randomIndex];
    }

    spawnBrokenBlock(x, y, tileId) {
        const blockMap = {
            0:  'broken_block_green',
            19: 'broken_block_blue',
            38: 'broken_block_brown',
            96: 'broken_block_brown',
            1:  'half_broken_block_green',
            20: 'half_broken_block_blue',
            39: 'half_broken_block_brown',
        };
    
        const spriteKey = blockMap[tileId];
        if (!spriteKey) return;
    
        const piece = this.physics.add.image(x, y, spriteKey);
        piece.setDepth(15);
    
        // Impulso inicial hacia arriba y al costado
        const dir = Math.random() > 0.5 ? 1 : -1;
        piece.setVelocityX(dir * Phaser.Math.Between(60, 120));
        piece.setVelocityY(-Phaser.Math.Between(150, 250));
    
        // Rotación constante mientras cae
        piece.setAngularVelocity(dir * Phaser.Math.Between(100, 200));
    
        // Destruir cuando toca el suelo (cuando su Y supera la posición del tile)
        const groundY = y + 200;
        const check = this.time.addEvent({
            delay: 16,
            loop: true,
            callback: () => {
                if (piece.y >= groundY) {
                    piece.destroy();
                    check.destroy();
                }
            }
        });
    }
    spawnStalactite() {
    if (this.stalactites.length >= 2) return;

    // Buscar tiles del techo (parte inferior de plataformas visibles)
    const visibleTopTile = this.platformLayer.worldToTileY(this.cameras.main.scrollY);
const visibleBottomTile = this.platformLayer.worldToTileY(this.cameras.main.scrollY + this.cameras.main.height);

const candidatos = [];

for (let tileY = visibleTopTile; tileY <= visibleBottomTile; tileY++) {
    for (let tileX = 0; tileX < this.platformLayer.width; tileX++) {
        const tile = this.platformLayer.getTileAt(tileX, tileY);
        const tileAbajo = this.platformLayer.getTileAt(tileX, tileY + 1);

        // Solo tiles rompibles con espacio vacío debajo y dentro de la pantalla
        if (tile && 
    tile.properties?.type === 'normal' && 
    !tileAbajo &&
    this.platformLayer.tileToWorldY(tileY) > this.cameras.main.scrollY + 50 &&
    this.platformLayer.tileToWorldY(tileY) < this.cameras.main.scrollY + this.cameras.main.height - 50) {
    candidatos.push({ tileX, tileY });
}
    }
}

    if (candidatos.length === 0) return;

    const elegido = candidatos[Phaser.Math.Between(0, candidatos.length - 1)];
    const tile = this.platformLayer.getTileAt(elegido.tileX, elegido.tileY);
const tileId = tile.index - 1;
const esMediaBloque = [1, 20, 39].includes(tileId);
const worldX = this.platformLayer.tileToWorldX(elegido.tileX) + 8;
const worldY = this.platformLayer.tileToWorldY(elegido.tileY) + 32 - (esMediaBloque ? 8 : 0);
    

    // Crear animaciones si no existen
    if (!this.anims.exists('stalactite_forming')) {
        this.anims.create({
            key: 'stalactite_forming',
            frames: this.anims.generateFrameNumbers('stalactite', { start: 0, end: 1 }),
            frameRate: 1,
            repeat: 0
        });
    }

    if (!this.anims.exists('stalactite_full')) {
        this.anims.create({
            key: 'stalactite_full',
            frames: this.anims.generateFrameNumbers('stalactite', { start: 2, end: 2 }),
            frameRate: 1,
            repeat: 0
        });
    }

    const stalactite = this.physics.add.sprite(worldX, worldY, 'stalactite');
    stalactite.body.allowGravity = false;
    stalactite.setDepth(15);
    stalactite.setVelocityY(0);
    stalactite.play('stalactite_forming');
    stalactite.isFalling = false;
    stalactite.flipTimer = 0;  // Timer para el efecto de flip vertical

    this.stalactites.push(stalactite);

    // Después de 3 segundos cae
    this.time.delayedCall(3000, () => {
        if (!stalactite.active) return;
        stalactite.play('stalactite_full');
        stalactite.isFalling = true;
        stalactite.setVelocityY(120);

        // Reproducir sonido stalactite_falling
        const stalactiteFallingVolume = 0.1;
        this.sound.play('stalactite_falling', { volume: stalactiteFallingVolume });

        // Overlap con jugador
        this.physics.add.overlap(
            this.player.sprite,
            stalactite,
            () => {
                if (!stalactite.active) return;

                if (this.player.sprite.body.velocity.y < 0) {
                    // Jugador saltando hacia arriba — rompe la estalactita
                    stalactite.destroy();
                    this.stalactites = this.stalactites.filter(s => s !== stalactite);
                } else {
                    // Cualquier otro estado — daño al jugador
                    if (!this.player.isInvulnerable) {
                        stalactite.destroy();
                        this.stalactites = this.stalactites.filter(s => s !== stalactite);
                        this.loseLife();
                    }
                }
            }
        );
    });
}

    // ── Eliminar estalactitas encima de un tile ──────────────────────────
    removeStalactitesAboveTile(tileX, tileY) {
        if (!this.platformLayer || !this.stalactites) return;

        // Calcular la posición mundo del tile
        const tileWorldX = this.platformLayer.tileToWorldX(tileX) + 8;
        const tileWorldY = this.platformLayer.tileToWorldY(tileY);

        // Buscar estalactitas que estén aproximadamente en la misma posición X del tile
        // y estén dentro del rango Y esperado (directamente encima)
        this.stalactites.forEach(stalactite => {
            if (!stalactite.active) return;

            const distX = Math.abs(stalactite.x - tileWorldX);
            const distY = stalactite.y - tileWorldY;

            // Si la estalactita está a menos de 24 píxeles horizontales (medio tile)
            // y está encima del tile (dentro de un rango razonable)
            if (distX < 24 && distY >= -32 && distY <= 32) {
                stalactite.destroy();
                this.stalactites = this.stalactites.filter(s => s !== stalactite);
            }
        });
    }
}
