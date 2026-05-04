export class ScoreManager {
    constructor() {
        this.totalAcumulado = 0;
        this.bonusWon = false;
        this.currentLevel = 'Level1';
        this.reset();
    }

    setLevel(level) {
        this.currentLevel = level;
    }

    getPointValues() {
        if (this.currentLevel === 'Level2') {
            return { collectable: 600, yetiIce: 400, bird: 800, block: 30 };
        }
        return { collectable: 300, yetiIce: 400, bird: 800, block: 10 };
    }

    reset() {
        this.collectables = 0;
        this.birds = 0;
        this.blocks = 0;
        this.yetiIce = 0;
    }

    addCollectable() { this.collectables += 1; }
    addBird()        { this.birds += 1; }
    addBlock()       { this.blocks += 1; }
    addYetiIce()     { this.yetiIce += 1; }
    setBonusWon()    { this.bonusWon = true; }

    getBonusPoints() {
    return this.currentLevel === 'Level2' ? 6000 : 3000;
}

getTotal() {
    const p = this.getPointValues();
    const bonus = this.bonusWon ? this.getBonusPoints() : 0;
    return (this.collectables * p.collectable) +
           (this.birds * p.bird) +
           (this.blocks * p.block) +
           (this.yetiIce * p.yetiIce) +
           bonus;
}

    cerrarEtapa() {
        this.totalAcumulado += this.getTotal();
        this.bonusWon = false;
        this.reset();
    }

    getSummary() {
    const p = this.getPointValues();
    const collectableSprite = this.currentLevel === 'Level2' ? 'lettuce' : 'eggplant';
    const mountainName = this.currentLevel === 'Level2' ? 'MOUNTAIN 2' : 'MOUNTAIN 1';
    const bonusPoints = this.getBonusPoints();

    return {
        collectables:  { cantidad: this.collectables, puntosPorUnidad: p.collectable, total: this.collectables * p.collectable },
        birds:         { cantidad: this.birds,        puntosPorUnidad: p.bird,        total: this.birds * p.bird },
        blocks:        { cantidad: this.blocks,       puntosPorUnidad: p.block,       total: this.blocks * p.block },
        yetiIce:       { cantidad: this.yetiIce,      puntosPorUnidad: p.yetiIce,     total: this.yetiIce * p.yetiIce },
        totalEtapa:    this.getTotal(),
        totalGeneral:  this.totalAcumulado + this.getTotal(),
        collectableSprite,
        mountainName,
        bonusPoints,
    };
}
}

export const scoreManager = new ScoreManager();