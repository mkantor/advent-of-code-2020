// Rows have width 12.
type Trees = readonly (readonly [
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
])[]

type Trajectory = {
    right: number
    down: number
}

function countTreesEncountered(trajectory: Trajectory, trees: Trees): number {
    const rowWidth = trees[0].length
    let treesEncountered = 0
    for (
        let location = { x: 0, y: 0 };
        location.y < trees.length;
        location = {
            x: location.x + trajectory.right,
            y: location.y + trajectory.down,
        }
    ) {
        if (trees[location.y][location.x % rowWidth]) {
            treesEncountered++
        }
    }
    return treesEncountered
}

// These are just to make the map more human-readable.
const _ = false
const t = true

const trajectory = { right: 3, down: 1 }
// prettier-ignore
const trees = [
    [_, _, t, t, _, _, _, _, _, _, _],
    [t, _, _, _, t, _, _, _, t, _, _],
    [_, t, _, _, _, _, t, _, _, t, _],
    [_, _, t, _, t, _, _, _, t, _, t],
    [_, t, _, _, _, t, t, _, _, t, _],
    [_, _, t, _, t, t, _, _, _, _, _],
    [_, t, _, t, _, t, _, _, _, _, t],
    [_, t, _, _, _, _, _, _, _, _, t],
    [t, _, t, t, _, _, _, t, _, _, _],
    [t, _, _, _, t, t, _, _, _, _, t],
    [_, t, _, _, t, _, _, _, t, _, t],
] as const

console.log('Trees encountered:', countTreesEncountered(trajectory, trees))