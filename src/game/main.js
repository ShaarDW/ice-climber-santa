import { Boot } from './scenes/Boot';
import { Level1 } from './scenes/Level1';
import { Level2 } from './scenes/Level2';
import { BonusStage } from './scenes/BonusStage';
import { ScoreScreen } from './scenes/ScoreScreen';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { UIScene } from './scenes/UIScene';
import { AUTO, Game, Scale, Textures } from 'phaser';
import { BonusStage2 } from './scenes/BonusStage2';
import { PauseMenu } from './scenes/PauseMenu';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config = {
    type: AUTO,
    width: 512,
    render: {
    pixelArt: true,
    antialias: false,
    antialiasGL: false
},
    // ... tu config actual
    input: {
        gamepad: true
    },
    height: 512,
    parent: 'game-container',
    backgroundColor: '#028af8',
    physics: {
    default: 'arcade',
    arcade: {
        gravity: { y: 800 },
        width: 512,     // 32 tiles x 16px
        height: 1408,   // 88 tiles x 16px
        debug: false
    }
    },
    scale: {
    mode: Scale.NONE,
    autoCenter: Scale.CENTER_BOTH
},
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Level1,
        Level2,
        BonusStage,
        BonusStage2,
        ScoreScreen,
        UIScene,
        PauseMenu
    ]
};

const StartGame = (parent) => {

    return new Game({ ...config, parent });

}

export default StartGame;
