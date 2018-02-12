module.exports = Object.seal({
    /** @type {String} */
    socketAcceptedOrigins: null,
    socketPort: 443,

    mapX: 0,
    mapY: 0,
    mapW: 7071,
    mapH: 7071,
    finderMaxLevel: 32,
    finderMaxItems: 32,
    safeSpawnTries: 16,
    safeSpawnFromEjected: 0.8,

    pelletMinSize: 10,
    pelletMaxSize: 40,
    pelletGrowTicks: 25 * 60,
    pelletCount: 1000,

    virusMinCount: 30,
    virusMaxCount: 90,
    virusSize: 100,
    virusFeedTimes: 7,
    virusPushing: false,
    virusSplitBoost: 780,
    virusPushBoost: 120,
    virusMonotonePops: false,

    ejectedSize: 43,
    ejectingLoss: 48,
    ejectDispersion: 0.3,
    ejectedCellBoost: 780,
    
    playerRoamSpeed: 32,
    playerRoamViewScale: 0.4,
    playerViewScaleMult: 1,
    playerMinViewScale: 0.01,
    playerMaxNameLength: 16,
    
    playerMinSize: 32,
    playerSpawnSize: 100,
    playerMaxSize: 1500,
    playerMinSplitSize: 60,
    playerMinEjectSize: 60,
    playerMaxCells: 16,

    playerMoveMult: 1,
    playerSplitBoost: 780,
    playerNoCollideDelay: 13,
    playerNoMergeDelay: 15,
    playerMergeTime: 30,
    playerMergeTimeIncrease: 0.02,
    playerDecayMult: 0.001
});