type JSONValue =
    | Partial<{ [key: string]: JSONValue }>
    | JSONValue[]
    | string
    | number
    | boolean
    | null

type Coordinates3 = [number, number, number]
type Coordinates4 = [number, number, number, number]
type Coordinates = Coordinates3 | Coordinates4

function cartesianProduct<T>(...sets: T[][]): T[][] {
    return sets.reduce<T[][]>(
        (accumulatedSets, set) =>
            accumulatedSets.flatMap((accumulatedSet) =>
                set.map((value) => [...accumulatedSet, value]),
            ),
        [[]],
    )
}

function partition<T>(array: T[], predicate: (t: T) => boolean): [T[], T[]] {
    return array.reduce<[T[], T[]]>(
        (partitioned, value) => {
            partitioned[predicate(value) ? 0 : 1].push(value)
            return partitioned
        },
        [[], []],
    )
}

function getNthValueFromIterator<T>(
    n: number,
    iterator: Iterator<T, unknown>,
): T | undefined {
    for (let turn = 0; turn < n; turn++) {
        const next = iterator.next()
        if (next.done) {
            return undefined
        }
    }
    const next = iterator.next()
    return next.done ? undefined : next.value
}

class Universe<T extends JSONValue> implements Iterable<T> {
    // Entities are stored internally as JSON strings. This is because we want
    // value identity instead of reference identity.
    private entities: Set<string>

    constructor(entities: Iterable<T>) {
        this.entities = new Set()
        for (const location of entities) {
            this.entities.add(JSON.stringify(location))
        }
    }

    has(entity: T): boolean {
        return this.entities.has(JSON.stringify(entity))
    }

    add(entity: T): void {
        this.entities.add(JSON.stringify(entity))
    }

    delete(entity: T): boolean {
        return this.entities.delete(JSON.stringify(entity))
    }

    clone(): Universe<T> {
        const newUniverse = new Universe([])
        newUniverse.entities = new Set(this.entities)
        return newUniverse
    }

    get size(): number {
        return this.entities.size
    }

    [Symbol.iterator](): Iterator<T> {
        const entitiesToIterate = Array.from(this.entities)
        return {
            next(): IteratorResult<T> {
                const value = entitiesToIterate.pop()
                if (value !== undefined) {
                    return { done: false, value: JSON.parse(value) }
                } else {
                    return { done: true, value: undefined }
                }
            },
        }
    }
}

const computedNeighborOffsets: Record<number, number[][] | undefined> = {}
function neighbors<C extends Coordinates>(location: C): C[] {
    let neighborOffsets = computedNeighborOffsets[location.length]

    if (neighborOffsets === undefined) {
        neighborOffsets = cartesianProduct(
            ...Array.from({ length: location.length }, () => [-1, 1, 0]),
        ).filter((relativeNeighbor) => !relativeNeighbor.every((a) => a === 0))
        computedNeighborOffsets[location.length] = neighborOffsets
    }

    return neighborOffsets.map((offset) => {
        return location.map(
            (coordinate, index) => coordinate + offset[index],
        ) as C
    })
}

function areNeighbors<C extends Coordinates>(a: C, b: C): boolean {
    return (
        // They aren't neighbors if they are the same location.
        !a.every((value, index) => value === b[index]) &&
        // All dimensions must be at most 1 distance.
        a.every((value, index) => Math.abs(value - b[index]) <= 1)
    )
}

function* simulate<C extends Coordinates>(
    universe: Universe<C>,
): Generator<Universe<C>, undefined> {
    while (true) {
        const nextUniverse = universe.clone()

        for (const activeCube of universe) {
            const [activeNeighbors, inactiveNeighbors] = partition(
                neighbors(activeCube),
                (cube) => universe.has(cube),
            )

            // If a cube is active and exactly 2 or 3 of its neighbors are also
            // active, the cube remains active. Otherwise, the cube becomes
            // inactive.
            if (activeNeighbors.length !== 2 && activeNeighbors.length !== 3) {
                if (!nextUniverse.delete(activeCube)) {
                    throw new Error(
                        `Bug: next universe was missing an active cube at ${activeCube}`,
                    )
                }
            }

            // If a cube is inactive but exactly 3 of its neighbors are active,
            // the cube becomes active. Otherwise, the cube remains inactive.
            for (const inactiveCube of inactiveNeighbors) {
                const activeNeighbors = neighbors(inactiveCube).filter((cube) =>
                    universe.has(cube),
                )
                if (activeNeighbors.length === 3) {
                    nextUniverse.add(inactiveCube)
                }
            }
        }

        universe = nextUniverse
        yield universe
    }
}

function parse3(stringifiedUniverse: string): Universe<Coordinates3> {
    const activeCubes = stringifiedUniverse.split('\n').flatMap((row, y) =>
        row.split('').reduce<Coordinates3[]>((activeCubes, character, x) => {
            if (character === '#') {
                activeCubes.push([x, y, 0])
                return activeCubes
            } else {
                return activeCubes
            }
        }, []),
    )
    return new Universe(activeCubes)
}

function parse4(stringifiedUniverse: string): Universe<Coordinates4> {
    const activeCubes = stringifiedUniverse.split('\n').flatMap((row, y) =>
        row.split('').reduce<Coordinates4[]>((activeCubes, character, x) => {
            if (character === '#') {
                activeCubes.push([x, y, 0, 0])
                return activeCubes
            } else {
                return activeCubes
            }
        }, []),
    )
    return new Universe(activeCubes)
}

const cycleLimit = 6

const universeDiagram = `
...#...#
..##.#.#
###..#..
........
...##.#.
.#.####.
...####.
..##...#
`

const universe3 = getNthValueFromIterator(
    cycleLimit - 1,
    simulate(parse3(universeDiagram)),
)
if (universe3 === undefined) {
    throw new Error('The universe has ended!')
}
console.log(
    `Active cube count after ${cycleLimit} cycles in 3 dimensions:`,
    universe3.size,
)

const universe4 = getNthValueFromIterator(
    cycleLimit - 1,
    simulate(parse4(universeDiagram)),
)
if (universe4 === undefined) {
    throw new Error('The universe has ended!')
}
console.log(
    `Active cube count after ${cycleLimit} cycles in 4 dimensions:`,
    universe4.size,
)
