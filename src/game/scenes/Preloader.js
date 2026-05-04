import { Scene } from 'phaser';
import WebFont from 'webfontloader';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init() {
    // Fondo negro
    this.cameras.main.setBackgroundColor('#000000');

    // Barra de progreso centrada correctamente (pantalla es 512x512)
    const barBg = this.add.rectangle(256, 250, 400, 40, 0x222222).setStrokeStyle(2, 0xffffff);
    const bar = this.add.rectangle(256 - 198, 250, 4, 36, 0x00ff00);
    
    this.load.on('progress', (progress) => {
        bar.width = 4 + (392 * progress);
    });

    // Texto "Cargando..." con puntos animados
    const loadingText = this.add.text(256, 330, 'CARGANDO', {
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#ffffff',
        align: 'center'
    }).setOrigin(0.5);

    }

    preload() {
    this.load.setPath('assets');

    this.load.spritesheet('player_walk', 'sprites/Sprite-0001.png', {
        frameWidth: 16,
        frameHeight: 24
    });

    this.load.spritesheet('player_jump', 'sprites/Sprite-0003.png', {
        frameWidth: 21,
        frameHeight: 26
    });
    this.load.tilemapTiledJSON('map_level1', 'tilemaps/level1.json');
    this.load.tilemapTiledJSON('map_level2', 'tilemaps/level2.json');
    this.load.tilemapTiledJSON('map_bonusstage1', 'tilemaps/bonusstage1.json');
    this.load.tilemapTiledJSON('map_bonusstage2', 'tilemaps/bonusstage2.json');
    this.load.image('tiles_level1', 'tilemaps/Tileset_ice_climber_plataforms.png');
    this.load.image('tiles_level2', 'tilemaps/Tileset_ice_climber_plataforms.png'); 
    this.load.image('icon_live', 'sprites/icon_live.png');
    this.load.spritesheet('bird_flying', 'sprites/spritesheet_bird.png', {
        frameWidth: 16,
        frameHeight: 16
    });
    this.load.image('bird_knocked', 'sprites/spritesheet_bird_knocked.png');

    this.load.spritesheet('condor_flying', 'sprites/spritesheet_condor.png', {
        frameWidth: 32,
        frameHeight: 16
    });

    this.load.image('player_slip', 'sprites/Sprite-0004.png');
    this.load.image('scoreboard', 'sprites/scoreboard_player.png');
    this.load.image('hammer', 'sprites/hammer.png');
    this.load.image('cloud1', 'sprites/cloud1.png');
    this.load.image('cloud2', 'sprites/cloud2.png');
    this.load.image('cloud3', 'sprites/cloud3.png');
    this.load.image('scoreboard_player', 'sprites/scoreboard_player.png');
    this.load.spritesheet('player_hammerblow', 'sprites/Sprite-0002.png', {
        frameWidth: 24,
        frameHeight: 28
    });
    this.load.spritesheet('yeti_walk', 'sprites/spritesheet_yeti_walk.png', {
        frameWidth: 16,
        frameHeight: 16
    });
    this.load.spritesheet('yeti_injured', 'sprites/spritesheet_yeti_injured.png', {
        frameWidth: 16,
        frameHeight: 16
    });
    this.load.spritesheet('player_hit', 'sprites/spritesheet_eskimo_hit.png', {
        frameWidth: 16,
        frameHeight: 24
    });
    this.load.spritesheet('player_hit2', 'sprites/spritesheet_eskimo_hit2.png', {
        frameWidth: 16,
        frameHeight: 24
    });
    this.load.spritesheet('player_crying', 'sprites/Sprite-0006.png', {
        frameWidth: 32,
        frameHeight: 48
    });
    this.load.spritesheet('player_celebrating', 'sprites/Sprite-0005.png', {
        frameWidth: 48,
        frameHeight: 48
    });
    this.load.image('eggplant', 'sprites/eggplant.png');
    this.load.image('lettuce', 'sprites/lettuce.png');
    this.load.image('title', 'sprites/title.png');
    this.load.spritesheet('stalactite', 'sprites/stalactite.png', {
        frameWidth: 16,
        frameHeight: 32
    });
    this.load.image('marco_timer', 'sprites/marco_timer.png');
    this.load.image('broken_block_green', 'sprites/broken_block_green.png');
    this.load.image('broken_block_blue', 'sprites/broken_block_blue.png');
    this.load.image('broken_block_brown', 'sprites/broken_block_brown.png');
    this.load.image('half_broken_block_green', 'sprites/half_broken_block_green.png');
    this.load.image('half_broken_block_blue', 'sprites/half_broken_block_blue.png');
    this.load.image('half_broken_block_brown', 'sprites/half_broken_block_brown.png');
    this.load.image('yeti_ice', 'sprites/yeti_ice.png');
    this.load.image('game_over', 'sprites/game_over.png');

    // ── Audios ───────────────────────────────────────────────────────
    // NOTA: Descomenta estas líneas cuando tengas los archivos de audio en assets/audio/
    this.load.audio('blip', 'audio/blip.wav');
    this.load.audio('block_break', 'audio/block_break.mp3');
    this.load.audio('collect_veggies', 'audio/collect_veggies.wav');
    this.load.audio('hit_bird', 'audio/hit_bird.wav');
    this.load.audio('hit_yeti', 'audio/hit_yeti.wav');
    this.load.audio('jump', 'audio/jump.wav');
    this.load.audio('lose_life', 'audio/lose_life.mp3');
    this.load.audio('pause', 'audio/pause.mp3');
    this.load.audio('stalactite_falling', 'audio/stalactite_falling.mp3');

    this.load.audio('menu_bonus_st', 'audio/menu-bonus_st.mp3');
    this.load.audio('win_bonus', 'audio/win_bonus.mp3');
    this.load.audio('level_st', 'audio/level_st.mp3');
    }


    create() {
        WebFont.load({
            custom: {
                families: ['NES'],
                urls: ['assets/fonts/nintendo-nes-font.css']
            },
            active: () => {
                this.scene.start('MainMenu');
            }
        });
    }
}
