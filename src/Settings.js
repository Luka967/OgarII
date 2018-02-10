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

    playerRoamSpeed: 32,
    playerRoamViewScale: 0.4,
    playerViewScaleMult: 1,
    playerMinViewScale: 0.01,

    playerMaxNameLength: 16
});