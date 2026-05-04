import * as Phaser from 'phaser';

const STATE = {
    STRAIGHT: 'straight',
    CURVING:  'curving',
    TURNING:  'turning',
    KNOCKED:  'knocked'
};

export class Bird {

    constructor(scene, x, y) {
        this.scene = scene;

        if (!scene.anims.exists('bird_fly')) {
            scene.anims.create({
                key: 'bird_fly',
                frames: scene.anims.generateFrameNumbers('bird_flying', { start: 0, end: 1 }),
                frameRate: 8,
                repeat: -1
            });
        }

        this.sprite = scene.physics.add.sprite(x, y, 'bird_flying');
        this.sprite.body.allowGravity = false;
        this.sprite.setCollideWorldBounds(false);
        this.sprite.setData('points', 800);
        this.sprite.play('bird_fly');
        this.sprite.setScale(2);
        
        // Reducir la hitbox del bird
        this.sprite.setSize(14, 10);
        this.sprite.setOffset(0, 5);

        // QUE SE VEA POR ENCIMA DE TODO
        this.sprite.setDepth(10);

        this.dirX       = x <= 0 ? 1 : -1;
        this.speedX     = 90;
        this.velY       = 0;
        this.targetVelY = 0;
        this.time       = 0;
        this.stateTimer = 0;
        this.state      = STATE.STRAIGHT;

        this.sprite.setVelocityX(this.dirX * this.speedX);
    }

    setState(newState) {
        this.state = newState;

        switch (newState) {
            case STATE.STRAIGHT:
                this.targetVelY = (Math.random() - 0.5) * 20;
                this.stateTimer = 1.0 + Math.random() * 2.0; // 1-3 segundos recto
                break;

            case STATE.CURVING:
                this.targetVelY = (Math.random() - 0.5) * 40;
                this.stateTimer = 0.8 + Math.random() * 1.2; // 0.8-2 segundos curvando
                break;

            case STATE.TURNING:
                this.dirX *= -1;
                this.targetVelY = (Math.random() - 0.5) * 60;
                this.stateTimer = 0.5; // 0.5 segundos girando
                break;

            case STATE.KNOCKED:
                this.sprite.setTexture('bird_knocked');
                this.sprite.stop();
                this.sprite.setVelocityX(0);
                this.sprite.setVelocityY(200);
                this.sprite.body.checkCollision.none = true; // ← desactivar colisiones
                this.stateTimer = -1;
                break;
        }
    }

    update(delta) {
        const { sprite } = this;
        const dt = delta / 1000;

        // ── Verificar si salió de la cámara ──────────────────────────
        const camTop    = this.scene.cameras.main.scrollY;
        const camBottom = camTop + this.scene.cameras.main.height;

        if (sprite.y < camTop - 50 || sprite.y > camBottom + 50) {
            this.destroy();
            if (this.state === STATE.KNOCKED) {
                this.scene.time.delayedCall(3000, () => {
                    const spawnY = this.scene.cameras.main.scrollY + 80;
                    const spawnX = Math.random() > 0.5 ? 0 : this.scene.scale.width;
                    this.scene.spawnBird(spawnX, spawnY);
                });
            }
            return;
        }

        this.time       += dt;
        this.stateTimer -= dt;

        // ── Transiciones de estado ────────────────────────────────────
        if (this.stateTimer <= 0 && this.state !== STATE.KNOCKED) {
            switch (this.state) {
                case STATE.STRAIGHT:
                    // 60% chance de curvar, 40% de seguir recto
                    this.setState(Math.random() < 0.6 ? STATE.CURVING : STATE.STRAIGHT);
                    break;
                case STATE.CURVING:
                    // Siempre vuelve a recto después de curvar
                    this.setState(STATE.STRAIGHT);
                    break;
                case STATE.TURNING:
                    this.setState(STATE.STRAIGHT);
                    break;
            }
        }

        // ── Límites naturales y detección de bordes (solo si no está knocked) ──
if (this.state !== STATE.KNOCKED) {
    const margin = 60;

    // Suavizar la corrección de límites con un factor menor
    if (sprite.y < camTop + margin) {
        this.targetVelY += (camTop + margin - sprite.y) * 0.5; // ← antes era * 3
    } else if (sprite.y > camBottom - margin) {
        this.targetVelY += (camBottom - margin - sprite.y) * 0.5; // ← antes era * 3
    }

    // Limitar targetVelY para que no se dispare
    this.targetVelY = Phaser.Math.Clamp(this.targetVelY, -80, 80);

            if (sprite.x < margin && this.dirX < 0) {
                this.setState(STATE.TURNING);
            } else if (sprite.x > this.scene.scale.width - margin && this.dirX > 0) {
                this.setState(STATE.TURNING);
            }

            // ── Física ────────────────────────────────────────────────────
            this.velY += (this.targetVelY - this.velY) * dt * 3;
            sprite.setVelocityY(this.velY);

            const curveFactor = this.state === STATE.CURVING
                ? 1 - Math.min(Math.abs(this.velY) / 200, 0.45)
                : 1;

            sprite.setVelocityX(this.dirX * this.speedX * curveFactor);
            sprite.setFlipX(this.dirX < 0);
        }
    }

    destroy() {
        this.sprite.destroy();
        this.scene.bird = null;
    }
}