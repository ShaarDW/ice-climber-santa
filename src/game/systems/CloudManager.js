export class CloudManager {

    constructor(scene, map) {
        this.scene = scene;
        this.map = map;
        this.group = scene.physics.add.group();
        this.activeCloud = null;  // Nube activa bajo el jugador
        this.playerSprite = null;

        this.spawnCloudsFromMap();
    }

    setPlayerSprite(playerSprite) {
        this.playerSprite = playerSprite;
    }

    spawnCloudsFromMap() {
        const cloudLayer = this.map.getObjectLayer('Clouds');
        if (!cloudLayer) return;

        cloudLayer.objects.forEach(obj => {
            const spriteName = obj.properties?.find(p => p.name === 'sprite')?.value;
            const direction  = obj.properties?.find(p => p.name === 'direction')?.value ?? 'right';
            const speed      = obj.properties?.find(p => p.name === 'speed')?.value ?? 90; // 90 por defecto

            const cloud = this.group.create(obj.x, obj.y, spriteName);
            cloud.setOrigin(0, 0);
            cloud.setDepth(1);
            cloud.body.allowGravity = false;
            cloud.body.immovable = true;
            cloud.setVelocityX(direction === 'right' ? speed : -speed);
            cloud.setData('direction', direction);
        });
    }

    update() {
        const mapWidth = this.map.widthInPixels;

        this.group.getChildren().forEach(cloud => {
            if (cloud.x > mapWidth + 10) {
                cloud.x = -10;
            } else if (cloud.x < -10) {
                cloud.x = mapWidth + 10;
            }
        });

        // Limpiar nube activa si el jugador no está en el suelo
        if (this.playerSprite && this.activeCloud) {
            const onGround = this.playerSprite.body.blocked.down;
            if (!onGround) {
                this.activeCloud = null;
            }
        }
    }

    setActiveCloud(cloud) {
        this.activeCloud = cloud;
    }

    clearActiveCloud() {
        this.activeCloud = null;
    }

    getActiveCloud() {
        return this.activeCloud;
    }
}