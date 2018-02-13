const Writer = require("../primitives/Writer");
/**
 * @typedef {{name: String, highlighted: Boolean, cellId: Number, position: Number}} LeaderboardEntry
 */

/**
 * @type {{[protocol: string]: (writer: Writer, data: LeaderboardEntry[], selfData?: LeaderboardEntry, protocol: Number) => void}}
*/
const protocols = {
    4: leaderboard4,
    5: leaderboard4,
    6: leaderboard4,
    7: leaderboard4,
    8: leaderboard4,
    9: leaderboard4,
    10: leaderboard4,
    11: leaderboard11,
    12: leaderboard11,
    13: leaderboard11,
    14: leaderboard11,
    15: leaderboard11,
    16: leaderboard11,
    17: leaderboard11
};

/**
 * @param {LeaderboardEntry[]} data
 * @param {LeaderboardEntry=} selfData
 * @param {Number} protocol
 */
module.exports = (data, selfData, protocol) => {
    const writer = new Writer();
    protocols[protocol](writer, data, selfData, protocol);
    return writer.finalize();
};

/**
 * @param {Writer} writer
 * @param {LeaderboardEntry[]} data
 * @param {LeaderboardEntry=} selfData
 * @param {Number} protocol
 */
function leaderboard4(writer, data, selfData, protocol) {
    writer.writeUInt8(49);
    writer.writeUInt32(data.length);
    for (let i = 0, l = data.length; i < l; i++) {
        if (protocol === 6) writer.writeUInt32(data[i].highlighted ? 1 : 0);
        else if (protocol < 6) writer.writeUInt32(data[i].cellId);
        writer.writeZTString(data[i].name, protocol);
    }
}

/**
 * @param {Writer} writer
 * @param {LeaderboardEntry[]} data
 * @param {LeaderboardEntry=} selfData
 * @param {Number} protocol
 */
function leaderboard11(writer, data, selfData, protocol) {
    let hitSelfData = false;
    writer.writeUInt8(protocol === 13 ? 51 : 53);
    for (let i = 0, l = data.length; i < l; i++) {
        if (data[i] === selfData) {
            hitSelfData = true;
            writer.writeUInt8(9);
            writer.writeUInt16(data[i].position);
        } else {
            writer.writeUInt8(2);
            writer.writeZTStringUTF8(data[i].name);
        }
    }
    if (selfData !== null && !hitSelfData) {
        writer.writeUInt8(9);
        writer.writeUInt16(selfData.position);
    }
}