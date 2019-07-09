interface Point {
    x: number;
    y: number;
}
interface Rect extends Point {
    w: number;
    h: number;
}
interface Quadrant {
    t: boolean;
    b: boolean;
    l: boolean;
    r: boolean;
}
interface ViewArea extends Rect {
    s: number;
}
interface Boost {
    dx: number;
    dy: number;
    d: number;
}
interface Spawner {
    pelletCount: number;
}

interface ChatSource {
    name: string;
    isServer: string;
    color: number;
}
interface FFALeaderboardEntry {
    name: string;
    highlighted: boolean;
    cellId: number;
    position: number;
}
interface PieLeaderboardEntry {
    weight: number;
    color: number;
}
interface WorldStats {
    limit: number;
    internal: number;
    external: number;
    playing: number;
    spectating: number;
    name: string;
    gamemode: string;
    loadTime: number;
    uptime: number;
}

interface GenCommandTable {
    columns: {
        text: string;
        headPad: string;
        emptyPad: string;
        rowPad: string;
        separated: boolean;
    }[];
    rows: string[][];
}

declare type LogEventLevel = "DEBUG" | "ACCESS" | "INFO" | "WARN" | "ERROR" | "FATAL";
declare type LogEvent = (date: Date, level: LogEventLevel, message: string) => void;
declare type LogMessageData = any[];

/**
 * 0 None, 1 Rigid, 2 Eat, 3 EatInvd
 */
declare type CellEatResult = 0 | 1 | 2 | 3;
/**
 * -1 Idle, 0 Playing, 1 Spectating, 2 Roaming
 */
declare type PlayerState = -1 | 0 | 1 | 2;

declare type LeaderboardType = "ffa" | "pie" | "text";
declare type LeaderboardDataType = {
    "ffa": FFALeaderboardEntry,
    "pie": PieLeaderboardEntry,
    "text": string
};

declare type IPAddress = string;
declare type Indexed<T> = { [name: string]: T };
declare type Identified<T> = { [id: number]: T };
declare type Counter<T> = { [item: string]: number };
