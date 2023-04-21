import type {TimeOptions} from './types';

export {default as LobbyTimeoutPolicy} from "./lobby/LobbyTimeoutPolicy";
export {default as TimeFromLastInteractionPolicy} from "./lobby/TimeFromLastInteractionTimeoutPolicy";
export {default as DefaultLobbyTimeoutPolicy} from "./lobby/TimeFromLastInteractionTimeoutPolicy";
export {default as ResetAbleTimeoutPolicy} from "./ResetAbleTimeoutPolicy";
export {default as TimeoutPolicy} from "./TimeoutPolicy";


export function getMillisFromTimeOptions(timeOptions: TimeOptions): number {
    let millis = 0;
    if (timeOptions.milliseconds) millis += timeOptions.milliseconds;
    if (timeOptions.seconds) millis += timeOptions.seconds * 1000;
    if (timeOptions.minutes) millis += timeOptions.minutes * 60 * 1000;
    if (timeOptions.hours) millis += timeOptions.hours * 60 * 60 * 1000;
    return millis;
}


