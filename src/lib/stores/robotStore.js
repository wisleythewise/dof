import { writable } from "svelte/store";

// Initialize all joints to 0 radians
export const jointAngles = writable({
    joint1: 0,
    joint2: 0,
    joint3: 0,
    joint4: 0,
    joint5: 0,
    joint6: 0,
    joint7: 0
});
