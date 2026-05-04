import * as Phaser from 'phaser';
import { Physics } from 'phaser';


export class Player {

    constructor(scene, x, y) {
        this.scene = scene;

        // ── Animaciones ─────────────────────────────────────────────────
        scene.anims.create({
            key: 'player_idle',
            frames: scene.anims.generateFrameNumbers('player_walk', { start: 0, end: 0 }),
            frameRate: 4,
            repeat: -1
        });

        scene.anims.create({
            key: 'player_run',
            frames: scene.anims.generateFrameNumbers('player_walk', { start: 1, end: 3 }),
            frameRate: 25,
            repeat: -1
        });

        scene.anims.create({
            key: 'player_jump',
            frames: scene.anims.generateFrameNumbers('player_jump', { start: 0, end: 0 }),
            frameRate: 4,
            repeat: 0
        });

        scene.anims.create({
            key: 'player_fall',
            frames: scene.anims.generateFrameNumbers('player_jump', { start: 1, end: 1 }),
            frameRate: 4,
            repeat: 0
        });

        // ── Animación Martillazo ────────────────────────────────────────
        scene.anims.create({
            key: 'player_hammer',
            frames: scene.anims.generateFrameNumbers('player_hammerblow', { start: 0, end: 2 }),
            frameRate: 10, // Rápido para que sea impactante (3 frames en ~150ms)
            repeat: 0
        });

        // ── Animaciones de daño ──────────────────────────────────────────
        scene.anims.create({
            key: 'player_hit',
            frames: scene.anims.generateFrameNumbers('player_hit', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: 0
        });

        scene.anims.create({
            key: 'player_hit2',
            frames: scene.anims.generateFrameNumbers('player_hit2', { start: 0, end: 4 }),
            frameRate: 10,
            repeat: -1
        });

        // ── Sprite con física ────────────────────────────────────────────
        this.sprite = scene.physics.add.sprite(x, y, 'player_walk');
        this.sprite.setScale(2);
        this.sprite.setCollideWorldBounds(false);
        

        // Ajuste de hitbox más estrecha y centrada para pasar huecos de 16px
        const bodyWidth = 3;
        const bodyHeight = 16;
        const offsetX = Math.round((this.sprite.displayWidth - bodyWidth) / 2) -8;
        const offsetY = 8;

        this.sprite.setSize(bodyWidth, bodyHeight);
        this.sprite.setOffset(offsetX, offsetY);

        // ── Controles ────────────────────────────────────────────────────
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.hammerKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

        // ── Estado ───────────────────────────────────────────────────────
        this.state = 'idle';
        this.isJumping = false;
        this.isSliding = false;
        this.isHammering = false;
        this.hammerCooldown = false;
        this.isDying = false;
        this.isInvulnerable = false;

        // ── Zona de ataque del martillo (invisible) ──────────────────────
        this.hammerHitbox = scene.physics.add.sprite(0, 0, null);
        this.hammerHitbox.setSize(30, 60); // Área de golpe (ajustable)
        this.hammerHitbox.setVisible(false);
        this.hammerHitbox.body.enable = false; // Desactivado por defecto
        this.hammerHitbox.body.setAllowGravity(false); // ← AGREGAR ESTA LÍNEA

        // ── Referencia al CloudManager ───────────────────────────────────
        this.cloudManager = null;
    }

    setCloudManager(cloudManager) {
        this.cloudManager = cloudManager;
    }

    update() {
    if (this.isDying) return;

    const { sprite, cursors } = this;
    const onGround = sprite.body.blocked.down;
    const speed = onGround ? 120 : 55;

    // ── Gamepad ──────────────────────────────────────────────────────
    const pad = this.scene.input.gamepad?.getPad(0);
    const gpLeft  = pad?.left || pad?.axes[0]?.value < -0.3;
    const gpRight = pad?.right || pad?.axes[0]?.value > 0.3;
    const gpJump  = pad?.A || pad?.buttons[0]?.pressed;
    const gpHammer = pad?.X || pad?.buttons[2]?.pressed;

    // ── Si está martillando, congelar completamente ──────────────────
    if (this.isHammering) {
        sprite.setVelocityX(0);
        return;
    }

    if (onGround) {
        this.isJumping = false;
        this.jumpDirection = null;
        this.hasHitBlock = false;
    }

    // ── Martillazo ───────────────────────────────────────────────────
    if ((Phaser.Input.Keyboard.JustDown(this.hammerKey) || gpHammer) && onGround && !this.hammerCooldown) {
        this.executeHammer();
        return;
    }

    // ── Movimiento horizontal ────────────────────────────────────────
    if (cursors.left.isDown || gpLeft) {
        if (!onGround && sprite.flipX === true) return;
        sprite.setVelocityX(-speed);
        sprite.setFlipX(false);
        if (onGround) {
            this.state = 'running';
            sprite.anims.play('player_run', true);
        }
    } else if (cursors.right.isDown || gpRight) {
        if (!onGround && sprite.flipX === false) return;
        sprite.setVelocityX(speed);
        sprite.setFlipX(true);
        if (onGround) {
            this.state = 'running';
            sprite.anims.play('player_run', true);
        }
    } else {
        if (onGround) {
            const wasRunning = Math.abs(sprite.body.velocity.x) > 20;
            if (wasRunning) {
                sprite.setVelocityX(sprite.body.velocity.x * 0.85);
                this.state = 'sliding';
                this.isSliding = true;
                sprite.setTexture('player_slip');
            } else {
                sprite.setVelocityX(0);
                this.isSliding = false;
                this.state = 'idle';
                sprite.setTexture('player_walk');
                sprite.anims.play('player_idle', true);
            }
        }
    }

    // ── Wrap horizontal ──────────────────────────────────────────────
    const worldWidth = this.scene.physics.world.bounds.width;
    if (sprite.x > worldWidth) sprite.x = 0;
    else if (sprite.x < 0) sprite.x = worldWidth;

    // ── Salto ────────────────────────────────────────────────────────
    if ((cursors.up.isDown || gpJump) && onGround && !this.isJumping && !this.jumpCooldown) {
        sprite.setVelocityY(-400);
        this.isJumping = true;
        this.jumpCooldown = true;
        this.state = 'jumping';

        // Reproducir sonido jump
        const jumpVolume = 0.6;
        this.scene.sound.play('jump', { volume: jumpVolume });

        this.scene.time.delayedCall(700, () => {
            this.jumpCooldown = false;
        });

        if (cursors.left.isDown || gpLeft) {
                this.jumpDirection = 'left';
            } else if (cursors.right.isDown || gpRight) {
                this.jumpDirection = 'right';
            }
        }

    // ── Animación salto y caída ──────────────────────────────────────
    if (!onGround) {
        if (sprite.body.velocity.y < 0) {
            this.state = 'jumping';
            sprite.anims.play('player_jump', true);
        } else {
            this.state = 'falling';
            sprite.anims.play('player_fall', true);
        }
    }
}
    executeHammer() {
    this.isHammering = true;
    this.hammerCooldown = true;
    this.state = 'hammering';

    // Congelar velocidad
    this.sprite.setVelocityX(0);
    
    // Guardar offset original
    const originalOffsetX = this.sprite.body.offset.x;
    const originalOffsetY = this.sprite.body.offset.y;
    
    // Ajustar hitbox para el sprite de martillazo (5px más arriba)
    this.sprite.setOffset(originalOffsetX, 13);

    // Reproducir animación
    this.sprite.anims.play('player_hammer', true);

    // Posicionar hitbox del martillo adelante del jugador
    const offsetX = this.sprite.flipX ? 16 : -16;
    this.hammerHitbox.setPosition(
        this.sprite.x + offsetX,
        this.sprite.y
    );
    this.hammerHitbox.body.enable = true;

    // Escuchar cuando la animación termine
    this.sprite.once('animationcomplete-player_hammer', () => {
        this.isHammering = false;
        this.hammerHitbox.body.enable = false;
        
        // Restaurar offset original
        this.sprite.setOffset(originalOffsetX, originalOffsetY);
    });

    // Cooldown de 500ms antes de poder martillar de nuevo
    this.scene.time.delayedCall(100, () => {
        this.hammerCooldown = false;
    });
}

    getHammerHitbox() {
        return this.hammerHitbox;
    }

    takeDamage(respawnX, respawnY, onDeathComplete = null) {
    this.isDying = true;
    this.isInvulnerable = true;
    this.sprite.setVelocityX(0);
    this.sprite.setVelocityY(0);
    this.sprite.body.enable = false;

    this.sprite.setTint(0x00FFFF);

    this.scene.time.delayedCall(1000, () => {
        this.sprite.clearTint();
        this.sprite.anims.play('player_hit');

        this.sprite.once('animationcomplete-player_hit', () => {
            this.sprite.anims.play('player_hit2');

            this.scene.tweens.add({
                targets: this.sprite,
                y: this.sprite.y - 100,
                duration: 500,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: this.sprite,
                        y: this.scene.cameras.main.scrollY + this.scene.cameras.main.height + 100,
                        duration: 1000,
                        ease: 'Quad.easeIn',
                        onComplete: () => {
                            if (onDeathComplete) {
                                onDeathComplete(); // ← game over
                            } else {
                                this.respawn(respawnX, respawnY); // ← vida normal
                            }
                        }
                    });
                }
            });
        });
    });
}

    respawn(x, y) {
        this.isDying = false;
        this.sprite.body.enable = true;  // Reactivar hitbox
        this.sprite.setPosition(x, y);
        this.sprite.setVelocity(0, 0);
        this.sprite.setAlpha(1);
        this.isInvulnerable = true;

        // Titileo
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 100,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                this.sprite.setAlpha(1);
                this.isInvulnerable = false;
            }
        });
    }
}