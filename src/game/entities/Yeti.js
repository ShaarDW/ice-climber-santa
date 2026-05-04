import * as Phaser from 'phaser';

export class Yeti {
    constructor(scene, x, y, platformLayer, direction, onDestroy) {
        this.scene = scene;
        this.platformLayer = platformLayer;
        this.state = 'WALKING';
        this.direction = direction !== undefined ? direction : x < scene.scale.width / 2 ? 1 : -1;
        this.speed = 60;
        this.stunnedSpeed = 100;
        this.onDestroy = onDestroy;
        this.stateTimer = 0;
        this.stunnedByFall = false;

        if (!scene.anims.exists('yeti_walk_anim')) {
            scene.anims.create({
                key: 'yeti_walk_anim',
                frames: scene.anims.generateFrameNumbers('yeti_walk', { start: 0, end: 2 }),
                frameRate: 8,
                repeat: -1
            });
        }

        if (!scene.anims.exists('yeti_injured_anim')) {
            scene.anims.create({
                key: 'yeti_injured_anim',
                frames: scene.anims.generateFrameNumbers('yeti_injured', { start: 0, end: 1 }),
                frameRate: 10,
                repeat: -1
            });
        }

        this.sprite = scene.physics.add.sprite(x, y, 'yeti_walk');
        this.sprite.setScale(2);
        this.sprite.body.setAllowGravity(true);
        this.sprite.setCollideWorldBounds(false);
        this.sprite.setVelocityX(this.direction * this.speed);
        this.sprite.setFlipX(this.direction > 0);
        this.sprite.anims.play('yeti_walk_anim', true);

        this.iceBlock = scene.physics.add.sprite(0, 0, 'yeti_ice');
        this.iceBlock.body.setAllowGravity(false);
        this.iceBlock.body.immovable = true;
        this.iceBlock.setVisible(false);

        this.detectedHole = null;
    }

    update(delta) {
        if (!this.sprite || !this.sprite.active) return;

        const cameraTop = this.scene.cameras.main.scrollY;
        const cameraBottom = this.scene.cameras.main.scrollY + this.scene.cameras.main.height;
        const cameraLeft = this.scene.cameras.main.scrollX;
        const cameraRight = this.scene.cameras.main.scrollX + this.scene.cameras.main.width;

        const outOfBounds = this.sprite.x < cameraLeft - 150 ||
                            this.sprite.x > cameraRight + 150 ||
                            this.sprite.y < cameraTop - 150 ||
                            this.sprite.y > cameraBottom + 150;

        if (outOfBounds) {
            if (this.onDestroy) {
                this.onDestroy();
                this.onDestroy = null;
            }
            this.destroy();
            return;
        }

        switch (this.state) {
            case 'WALKING':
                this.updateWalking(delta);
                break;
            case 'DETECTING_HOLE':
                this.updateDetectingHole(delta);
                break;
            case 'RETURNING':
                this.updateReturning(delta);
                break;
            case 'WAITING':
                this.updateWaiting(delta);
                break;
            case 'BRINGING_BLOCK':
                this.updateBringingBlock(delta);
                break;
            case 'FILLING':
                this.updateFilling(delta);
                break;
            case 'STUNNED':
                this.updateStunned(delta);
                break;
        }

        if (this.iceBlock && this.iceBlock.visible) {
            const offsetX = this.direction > 0 ? 22 : -22;
            this.iceBlock.setScale(2);
            this.iceBlock.setPosition(this.sprite.x + offsetX, this.sprite.y);
            this.iceBlock.setFlipX(this.direction < 0);
        }
    }

    updateWalking(delta) {
        const onGround = this.sprite.body.blocked.down;
        if (!onGround) return;

        const mapWidth = this.scene.map?.widthInPixels ?? this.scene.physics.world.bounds.width;
        const checkX = this.sprite.x + (this.direction * 16);
        const checkY = this.sprite.body.bottom + 2;

        if (checkX < 0 || checkX >= mapWidth) {
            this.sprite.setVelocityX(this.direction * this.speed);
            return;
        }

        const tileX = this.platformLayer.worldToTileX(checkX);
        const tileY = this.platformLayer.worldToTileY(checkY);
        const tile = this.platformLayer.getTileAt(tileX, tileY);

        if (!tile || !tile.properties?.collidable) {
            this.detectedHole = {
                tileX,
                tileY,
                worldX: this.platformLayer.tileToWorldX(tileX) + this.scene.map.tileWidth / 2,
                worldY: this.platformLayer.tileToWorldY(tileY)
            };
            this.changeState('DETECTING_HOLE');
            return;
        }

        this.sprite.setVelocityX(this.direction * this.speed);
    }

    updateDetectingHole(delta) {
        this.stateTimer += delta;
        this.sprite.setVelocityX(0);

        if (this.stateTimer > 300) {
            this.direction *= -1;
            this.sprite.setFlipX(this.direction > 0);
            this.changeState('RETURNING');
        }
    }

    updateReturning(delta) {
        const cameraLeft = this.scene.cameras.main.scrollX;
        const cameraRight = this.scene.cameras.main.scrollX + this.scene.cameras.main.width;

        this.sprite.setVelocityX(this.direction * this.speed * 2);

        const onGround = this.sprite.body.blocked.down;
        if (onGround) {
            const checkX = this.sprite.x + (this.direction * 16);
            const checkY = this.sprite.body.bottom + 2;
            const tileX = this.platformLayer.worldToTileX(checkX);
            const tileY = this.platformLayer.worldToTileY(checkY);
            const tile = this.platformLayer.getTileAt(tileX, tileY);

            if (!tile || !tile.properties?.collidable) {
                this.hit(true);
                return;
            }
        }

        const reachedEdge = (this.direction < 0 && this.sprite.x < cameraLeft + 50) ||
                            (this.direction > 0 && this.sprite.x > cameraRight - 50);

        if (reachedEdge) {
            this.sprite.setVelocityX(0);
            this.sprite.setVisible(false);
            this.changeState('WAITING');
        }
    }

    updateWaiting(delta) {
        this.stateTimer += delta;

        if (this.stateTimer > 800) {
            this.iceBlock.setVisible(true);
            this.sprite.setVisible(true);
            this.direction *= -1;
            this.sprite.setFlipX(this.direction > 0);
            this.changeState('BRINGING_BLOCK');
        }
    }

    updateBringingBlock(delta) {
        this.sprite.setVelocityX(this.direction * this.speed);

        const onGround = this.sprite.body.blocked.down;
        if (onGround) {
            const checkX = this.sprite.x + (this.direction * 16);
            const checkY = this.sprite.body.bottom + 2;
            const tileX = this.platformLayer.worldToTileX(checkX);
            const tileY = this.platformLayer.worldToTileY(checkY);
            const tile = this.platformLayer.getTileAt(tileX, tileY);

            if (!tile || !tile.properties?.collidable) {
                this.detectedHole = {
                    tileX,
                    tileY,
                    worldX: this.platformLayer.tileToWorldX(tileX) + this.scene.map.tileWidth / 2,
                    worldY: this.platformLayer.tileToWorldY(tileY)
                };
                this.changeState('FILLING');
                return;
            }
        }

        const cameraLeft = this.scene.cameras.main.scrollX;
        const cameraRight = this.scene.cameras.main.scrollX + this.scene.cameras.main.width;
        const reachedEdge = (this.direction < 0 && this.sprite.x < cameraLeft + 50) ||
                            (this.direction > 0 && this.sprite.x > cameraRight - 50);

        if (reachedEdge) {
            this.iceBlock.setVisible(false);
            this.detectedHole = null;
            this.direction *= -1;
            this.sprite.setFlipX(this.direction > 0);
            this.changeState('WALKING');
        }
    }

    updateFilling(delta) {
        this.stateTimer += delta;
        this.sprite.setVelocityX(0);

        if (this.stateTimer > 400) {
            this.fillHole();
            this.iceBlock.setVisible(false);
            this.detectedHole = null;
            this.changeState('WALKING');
        }
    }

    updateStunned(delta) {
    this.sprite.setVelocityX(this.direction * this.stunnedSpeed);

    if (this.stunnedByFall) return; // ya tiene hitbox reducida, no hacer nada más

    // Detectar huecos también en estado stunned normal
    const onGround = this.sprite.body.blocked.down;
    if (onGround) {
        const checkX = this.sprite.x + (this.direction * 16);
        const checkY = this.sprite.body.bottom + 2;
        const tileX = this.platformLayer.worldToTileX(checkX);
        const tileY = this.platformLayer.worldToTileY(checkY);
        const tile = this.platformLayer.getTileAt(tileX, tileY);

        if (!tile || !tile.properties?.collidable) {
            // Reducir hitbox para caer por el hueco
            this.sprite.body.setSize(6, 12);
            this.sprite.body.setOffset(
                (this.sprite.width - 6) / 2,
                this.sprite.height - 12
            );
            this.stunnedByFall = true;
        }
    }
}

    getTileIndexForPiso() {
    const yetiWorldY = this.sprite.y;
    const mapHeight = this.scene.map.heightInPixels;
    const floorHeight = 80;
    const bottomOffset = 48; // 3 tiles vacíos de 16px en la parte inferior
    
    const piso = Math.floor((mapHeight - bottomOffset - yetiWorldY) / floorHeight);

    if (piso <= 2) return 1;
    if (piso <= 5) return 39;
    if (piso <= 8) return 20;
    return 20;
}

    fillHole() {
        if (!this.detectedHole) return;

        const { tileX, tileY } = this.detectedHole;

        if (tileX < 0 || tileY < 0 || tileX >= this.platformLayer.width || tileY >= this.platformLayer.height) {
            return;
        }

        const validTileIndex = this.getTileIndexForPiso();

        const newTile = this.platformLayer.putTileAt(validTileIndex, tileX, tileY);
        if (newTile) {
            newTile.properties = newTile.properties || {};
            newTile.properties.collidable = true;
            newTile.properties.type = 'normal';
            if (typeof this.platformLayer.setCollision === 'function') {
                this.platformLayer.setCollision(validTileIndex, true);
            }

            // Reproducir sonido block_break
            const blockBreakVolume = 0.2;
            this.scene.sound.play('block_break', { volume: blockBreakVolume });
        }
    }

    changeState(newState) {
        this.state = newState;
        this.stateTimer = 0;

        switch (newState) {
            case 'WALKING':
            case 'DETECTING_HOLE':
            case 'RETURNING':
            case 'BRINGING_BLOCK':
                this.sprite.anims.play('yeti_walk_anim', true);
                break;
            case 'STUNNED':
                this.sprite.anims.play('yeti_injured_anim', true);
                break;
        }
    }

    hit(byFall = false) {
        if (this.state === 'STUNNED') return;

        this.stunnedByFall = byFall;
        this.iceBlock.setVisible(false);

        if (byFall) {
            this.sprite.body.setSize(6, 12);
            this.sprite.body.setOffset(
                (this.sprite.width - 6) / 2,
                this.sprite.height - 12
            );
            this.sprite.setVelocityX(this.direction * this.stunnedSpeed);
            this.changeState('STUNNED');
        } else {
            this.direction *= -1;
            this.sprite.setFlipX(this.direction > 0);
            this.sprite.setVelocityX(this.direction * this.stunnedSpeed);
            this.changeState('STUNNED');
        }
    }

    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }

        if (this.iceBlock) {
            this.iceBlock.destroy();
            this.iceBlock = null;
        }

        if (this.onDestroy) {
            this.onDestroy();
            this.onDestroy = null;
        }
    }
}