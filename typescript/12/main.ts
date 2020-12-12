type Action = 'N' | 'S' | 'E' | 'W' | 'L' | 'R' | 'F'
type Instruction = [Action, number]

type Point = [number, number]

const north: Point = [0, -1]
const south: Point = [0, 1]
const east: Point = [1, 0]
const west: Point = [-1, 0]

type Position = {
    bearing: Point
    coordinates: Point
    waypoint: Point
}

function iterate<T>(initial: T, times: number, fn: (x: T) => T): T {
    let result = initial
    for (let iteration = 0; iteration < times; iteration++) {
        result = fn(result)
    }
    return result
}

function arraysAreEqual<T>(array1: T[], array2: T[]): boolean {
    return (
        array1.length === array2.length &&
        array1.every((value1, index) => value1 === array2[index])
    )
}

function rotateRightAroundOrigin(point: Point): Point {
    return [-point[1], point[0]]
}
function rotateLeftAroundOrigin(point: Point): Point {
    return [point[1], -point[0]]
}

function followShipInstruction(
    initialPosition: Position,
    instruction: Instruction,
): Position {
    const { bearing, coordinates } = initialPosition
    const [action, value] = instruction
    switch (action) {
        case 'N':
            return {
                ...initialPosition,
                coordinates: [coordinates[0], coordinates[1] - value],
            }
        case 'S':
            return {
                ...initialPosition,
                coordinates: [coordinates[0], coordinates[1] + value],
            }
        case 'E':
            return {
                ...initialPosition,
                coordinates: [coordinates[0] + value, coordinates[1]],
            }
        case 'W':
            return {
                ...initialPosition,
                coordinates: [coordinates[0] - value, coordinates[1]],
            }
        case 'L':
            const leftTurns = value / 90
            if (!Number.isInteger(leftTurns)) {
                throw new Error("Rotation wasn't an increment of 90 degrees")
            }
            return {
                ...initialPosition,
                bearing: iterate(bearing, leftTurns, rotateLeftAroundOrigin),
            }
        case 'R':
            const rightTurns = value / 90
            if (!Number.isInteger(rightTurns)) {
                throw new Error("Rotation wasn't an increment of 90 degrees")
            }
            return {
                ...initialPosition,
                bearing: iterate(bearing, rightTurns, rotateRightAroundOrigin),
            }
        case 'F':
            let action: Action
            if (arraysAreEqual(bearing, north)) {
                action = 'N'
            } else if (arraysAreEqual(bearing, south)) {
                action = 'S'
            } else if (arraysAreEqual(bearing, east)) {
                action = 'E'
            } else if (arraysAreEqual(bearing, west)) {
                action = 'W'
            } else {
                throw new Error(`Invalid bearing: ${bearing}`)
            }
            return followShipInstruction(initialPosition, [action, value])
    }
}

function followWaypointInstruction(
    initialPosition: Position,
    instruction: Instruction,
): Position {
    const { coordinates, waypoint } = initialPosition
    const [action, value] = instruction
    switch (action) {
        case 'N':
            return {
                ...initialPosition,
                waypoint: [waypoint[0], waypoint[1] - value],
            }
        case 'S':
            return {
                ...initialPosition,
                waypoint: [waypoint[0], waypoint[1] + value],
            }
        case 'E':
            return {
                ...initialPosition,
                waypoint: [waypoint[0] + value, waypoint[1]],
            }
        case 'W':
            return {
                ...initialPosition,
                waypoint: [waypoint[0] - value, waypoint[1]],
            }
        case 'L':
            const leftTurns = value / 90
            if (!Number.isInteger(leftTurns)) {
                throw new Error("Rotation wasn't an increment of 90 degrees")
            }
            return {
                ...initialPosition,
                waypoint: iterate(waypoint, leftTurns, rotateLeftAroundOrigin),
            }
        case 'R':
            const rightTurns = value / 90
            if (!Number.isInteger(rightTurns)) {
                throw new Error("Rotation wasn't an increment of 90 degrees")
            }
            return {
                ...initialPosition,
                waypoint: iterate(
                    waypoint,
                    rightTurns,
                    rotateRightAroundOrigin,
                ),
            }
        case 'F':
            const movement = [waypoint[0] * value, waypoint[1] * value]
            return {
                ...initialPosition,
                coordinates: [
                    coordinates[0] + movement[0],
                    coordinates[1] + movement[1],
                ],
            }
    }
}

function navigate(
    instructions: Instruction[],
    followInstruction: (
        initialPosition: Position,
        instruction: Instruction,
    ) => Position,
): Position {
    const initialPosition: Position = {
        bearing: east,
        coordinates: [0, 0],
        waypoint: [10, -1],
    }
    return instructions.reduce(followInstruction, initialPosition)
}

function manhattanDistance(coordinates: [number, number]): number {
    return Math.abs(coordinates[0]) + Math.abs(coordinates[1])
}

const instructions: Instruction[] = [
    ['F', 20],
    ['L', 90],
    ['E', 5],
    ['S', 1],
    ['R', 180],
    ['F', 67],
    ['S', 3],
    ['F', 75],
    ['L', 180],
    ['W', 4],
    ['N', 4],
    ['F', 88],
    ['L', 90],
    ['S', 2],
    ['E', 2],
    ['L', 180],
    ['S', 4],
    ['F', 3],
    ['L', 90],
    ['N', 3],
    ['L', 180],
    ['N', 5],
    ['E', 2],
    ['N', 1],
    ['W', 5],
    ['L', 180],
    ['E', 3],
    ['F', 50],
    ['E', 1],
    ['F', 84],
    ['S', 4],
    ['W', 3],
    ['L', 90],
    ['W', 1],
    ['N', 1],
    ['L', 90],
    ['F', 7],
    ['L', 90],
    ['N', 5],
    ['R', 90],
    ['F', 35],
    ['E', 2],
    ['F', 100],
    ['E', 5],
    ['R', 90],
    ['W', 1],
    ['F', 85],
    ['R', 90],
    ['W', 4],
    ['S', 4],
    ['R', 180],
    ['F', 20],
    ['R', 90],
    ['N', 5],
    ['W', 1],
    ['S', 3],
    ['F', 77],
    ['R', 90],
    ['N', 1],
    ['W', 2],
    ['R', 90],
    ['N', 5],
    ['F', 25],
    ['E', 2],
    ['R', 90],
    ['E', 5],
    ['W', 5],
    ['S', 3],
    ['F', 59],
    ['N', 3],
    ['L', 90],
    ['F', 1],
    ['N', 5],
    ['F', 31],
    ['R', 90],
    ['S', 5],
    ['R', 90],
    ['E', 1],
    ['F', 81],
    ['S', 3],
    ['L', 90],
    ['F', 79],
    ['S', 3],
    ['W', 1],
    ['F', 25],
    ['E', 2],
    ['N', 4],
    ['R', 90],
    ['F', 16],
    ['R', 180],
    ['F', 29],
    ['S', 5],
    ['W', 1],
    ['L', 90],
    ['F', 50],
    ['E', 5],
    ['L', 90],
    ['W', 2],
    ['L', 90],
    ['N', 2],
    ['W', 1],
    ['R', 90],
    ['F', 65],
    ['E', 3],
    ['F', 21],
    ['W', 3],
    ['S', 5],
    ['L', 90],
    ['N', 4],
    ['R', 180],
    ['N', 4],
    ['F', 37],
    ['W', 1],
    ['F', 40],
    ['W', 1],
    ['F', 78],
    ['S', 1],
    ['L', 90],
    ['E', 2],
    ['F', 12],
    ['L', 90],
    ['W', 3],
    ['F', 16],
    ['N', 1],
    ['L', 90],
    ['R', 90],
    ['N', 2],
    ['R', 90],
    ['N', 2],
    ['F', 5],
    ['R', 90],
    ['F', 43],
    ['L', 90],
    ['E', 5],
    ['F', 89],
    ['N', 3],
    ['E', 3],
    ['S', 3],
    ['W', 1],
    ['F', 48],
    ['E', 2],
    ['N', 2],
    ['L', 180],
    ['F', 78],
    ['N', 5],
    ['L', 90],
    ['F', 14],
    ['N', 3],
    ['R', 180],
    ['E', 4],
    ['F', 27],
    ['N', 5],
    ['R', 90],
    ['F', 68],
    ['L', 270],
    ['W', 5],
    ['F', 59],
    ['W', 1],
    ['F', 98],
    ['E', 3],
    ['F', 47],
    ['R', 270],
    ['F', 43],
    ['L', 90],
    ['F', 79],
    ['L', 90],
    ['F', 94],
    ['W', 1],
    ['F', 40],
    ['R', 90],
    ['W', 4],
    ['S', 3],
    ['F', 13],
    ['E', 3],
    ['S', 5],
    ['L', 180],
    ['S', 3],
    ['L', 270],
    ['W', 4],
    ['R', 90],
    ['N', 3],
    ['F', 64],
    ['E', 2],
    ['R', 90],
    ['F', 4],
    ['E', 5],
    ['S', 3],
    ['R', 90],
    ['W', 1],
    ['E', 3],
    ['R', 90],
    ['E', 5],
    ['S', 1],
    ['R', 180],
    ['W', 1],
    ['F', 36],
    ['E', 1],
    ['F', 45],
    ['L', 90],
    ['F', 92],
    ['W', 3],
    ['N', 3],
    ['W', 2],
    ['R', 90],
    ['W', 2],
    ['F', 79],
    ['E', 2],
    ['R', 90],
    ['S', 4],
    ['N', 4],
    ['E', 1],
    ['N', 4],
    ['R', 90],
    ['F', 71],
    ['E', 3],
    ['S', 4],
    ['L', 90],
    ['E', 1],
    ['F', 10],
    ['N', 3],
    ['F', 53],
    ['E', 5],
    ['S', 5],
    ['R', 90],
    ['F', 85],
    ['N', 2],
    ['W', 4],
    ['R', 90],
    ['F', 64],
    ['W', 1],
    ['S', 2],
    ['L', 90],
    ['N', 1],
    ['W', 1],
    ['F', 40],
    ['F', 7],
    ['S', 3],
    ['F', 20],
    ['S', 3],
    ['F', 63],
    ['F', 97],
    ['N', 5],
    ['F', 23],
    ['N', 3],
    ['F', 20],
    ['L', 90],
    ['S', 3],
    ['E', 3],
    ['F', 54],
    ['N', 5],
    ['F', 79],
    ['N', 1],
    ['F', 50],
    ['L', 90],
    ['F', 10],
    ['R', 90],
    ['W', 3],
    ['S', 1],
    ['R', 180],
    ['F', 93],
    ['E', 1],
    ['F', 73],
    ['L', 90],
    ['E', 3],
    ['N', 3],
    ['L', 180],
    ['F', 1],
    ['E', 1],
    ['N', 2],
    ['W', 2],
    ['L', 90],
    ['W', 2],
    ['L', 90],
    ['N', 4],
    ['F', 97],
    ['W', 2],
    ['S', 1],
    ['F', 89],
    ['E', 3],
    ['L', 90],
    ['S', 5],
    ['R', 90],
    ['N', 3],
    ['E', 2],
    ['L', 90],
    ['F', 59],
    ['R', 90],
    ['S', 4],
    ['F', 53],
    ['W', 3],
    ['S', 3],
    ['R', 90],
    ['F', 35],
    ['R', 180],
    ['W', 1],
    ['F', 32],
    ['N', 2],
    ['W', 3],
    ['L', 90],
    ['F', 55],
    ['N', 3],
    ['E', 3],
    ['R', 90],
    ['F', 50],
    ['N', 5],
    ['L', 90],
    ['S', 3],
    ['E', 3],
    ['R', 90],
    ['E', 4],
    ['S', 2],
    ['R', 90],
    ['N', 4],
    ['W', 1],
    ['R', 90],
    ['F', 44],
    ['R', 90],
    ['F', 56],
    ['W', 3],
    ['S', 3],
    ['L', 90],
    ['S', 2],
    ['E', 4],
    ['F', 91],
    ['S', 2],
    ['R', 90],
    ['N', 3],
    ['R', 90],
    ['W', 1],
    ['S', 1],
    ['F', 4],
    ['L', 90],
    ['E', 3],
    ['L', 180],
    ['N', 5],
    ['F', 67],
    ['F', 50],
    ['S', 3],
    ['F', 71],
    ['L', 90],
    ['F', 81],
    ['R', 90],
    ['E', 1],
    ['F', 27],
    ['W', 2],
    ['N', 5],
    ['E', 5],
    ['F', 99],
    ['R', 90],
    ['F', 30],
    ['F', 98],
    ['L', 90],
    ['F', 20],
    ['S', 2],
    ['E', 2],
    ['N', 2],
    ['E', 4],
    ['R', 180],
    ['W', 2],
    ['S', 5],
    ['L', 90],
    ['N', 5],
    ['F', 59],
    ['E', 1],
    ['N', 3],
    ['F', 42],
    ['E', 2],
    ['N', 4],
    ['W', 1],
    ['R', 90],
    ['E', 4],
    ['L', 180],
    ['F', 92],
    ['R', 90],
    ['N', 4],
    ['W', 3],
    ['L', 180],
    ['S', 3],
    ['W', 2],
    ['N', 2],
    ['L', 90],
    ['F', 26],
    ['S', 1],
    ['E', 5],
    ['R', 90],
    ['E', 2],
    ['L', 90],
    ['W', 4],
    ['F', 96],
    ['E', 5],
    ['F', 4],
    ['F', 98],
    ['E', 3],
    ['F', 77],
    ['R', 180],
    ['E', 4],
    ['F', 28],
    ['E', 3],
    ['W', 2],
    ['N', 3],
    ['F', 23],
    ['N', 3],
    ['L', 90],
    ['W', 5],
    ['R', 90],
    ['L', 90],
    ['N', 3],
    ['W', 3],
    ['F', 97],
    ['R', 90],
    ['E', 3],
    ['F', 22],
    ['L', 180],
    ['S', 2],
    ['F', 22],
    ['W', 2],
    ['S', 5],
    ['W', 5],
    ['F', 40],
    ['E', 3],
    ['L', 90],
    ['E', 1],
    ['S', 3],
    ['L', 90],
    ['W', 3],
    ['E', 5],
    ['F', 69],
    ['L', 90],
    ['W', 5],
    ['N', 4],
    ['L', 90],
    ['N', 3],
    ['F', 49],
    ['S', 2],
    ['E', 2],
    ['F', 41],
    ['W', 2],
    ['F', 61],
    ['E', 3],
    ['R', 90],
    ['W', 5],
    ['L', 180],
    ['E', 4],
    ['F', 52],
    ['E', 2],
    ['F', 86],
    ['R', 270],
    ['F', 27],
    ['W', 5],
    ['R', 90],
    ['E', 1],
    ['S', 4],
    ['F', 3],
    ['R', 90],
    ['E', 3],
    ['F', 28],
    ['F', 31],
    ['S', 4],
    ['F', 81],
    ['S', 5],
    ['F', 89],
    ['E', 5],
    ['N', 2],
    ['F', 21],
    ['E', 5],
    ['L', 180],
    ['S', 4],
    ['L', 180],
    ['S', 3],
    ['E', 3],
    ['R', 180],
    ['F', 58],
    ['E', 5],
    ['F', 8],
    ['W', 2],
    ['R', 90],
    ['N', 3],
    ['L', 270],
    ['S', 1],
    ['F', 67],
    ['W', 4],
    ['N', 2],
    ['L', 180],
    ['L', 90],
    ['E', 5],
    ['L', 180],
    ['S', 3],
    ['W', 2],
    ['R', 180],
    ['F', 70],
    ['R', 90],
    ['S', 5],
    ['F', 40],
    ['S', 1],
    ['R', 90],
    ['N', 1],
    ['R', 90],
    ['S', 3],
    ['R', 90],
    ['E', 2],
    ['R', 90],
    ['F', 86],
    ['R', 90],
    ['F', 33],
    ['W', 2],
    ['N', 5],
    ['R', 180],
    ['W', 5],
    ['S', 4],
    ['F', 1],
    ['E', 2],
    ['L', 90],
    ['S', 3],
    ['F', 68],
    ['E', 3],
    ['R', 90],
    ['S', 4],
    ['R', 90],
    ['W', 2],
    ['F', 51],
    ['L', 90],
    ['W', 1],
    ['N', 2],
    ['L', 90],
    ['F', 40],
    ['N', 1],
    ['R', 90],
    ['W', 1],
    ['S', 5],
    ['F', 39],
    ['L', 90],
    ['F', 61],
    ['L', 90],
    ['N', 4],
    ['W', 5],
    ['F', 5],
    ['E', 2],
    ['N', 3],
    ['F', 67],
    ['S', 4],
    ['F', 44],
    ['R', 180],
    ['F', 4],
    ['L', 180],
    ['N', 2],
    ['L', 90],
    ['E', 5],
    ['L', 270],
    ['E', 1],
    ['L', 90],
    ['F', 99],
    ['R', 90],
    ['N', 2],
    ['E', 4],
    ['R', 90],
    ['F', 96],
    ['E', 1],
    ['N', 4],
    ['L', 90],
    ['W', 5],
    ['R', 270],
    ['E', 2],
    ['L', 90],
    ['F', 33],
    ['R', 90],
    ['F', 11],
    ['N', 1],
    ['R', 90],
    ['E', 5],
    ['R', 90],
    ['W', 1],
    ['F', 61],
    ['R', 90],
    ['F', 98],
    ['R', 180],
    ['F', 86],
    ['N', 5],
    ['L', 180],
    ['W', 4],
    ['S', 3],
    ['R', 180],
    ['F', 98],
    ['E', 5],
    ['S', 4],
    ['F', 33],
    ['N', 2],
    ['E', 4],
    ['L', 90],
    ['F', 36],
    ['S', 1],
    ['E', 1],
    ['F', 92],
    ['F', 48],
    ['W', 3],
    ['N', 4],
    ['F', 2],
    ['E', 4],
    ['F', 98],
    ['W', 5],
    ['F', 67],
    ['S', 3],
    ['F', 60],
    ['N', 5],
    ['R', 90],
    ['S', 2],
    ['L', 90],
    ['N', 5],
    ['L', 180],
    ['W', 2],
    ['N', 4],
    ['L', 90],
    ['N', 4],
    ['L', 90],
    ['F', 90],
    ['E', 5],
    ['L', 90],
    ['S', 1],
    ['W', 1],
    ['N', 2],
    ['F', 76],
    ['S', 4],
    ['E', 5],
    ['F', 5],
    ['S', 4],
    ['R', 90],
    ['F', 41],
    ['E', 5],
    ['N', 5],
    ['R', 90],
    ['N', 5],
    ['E', 2],
    ['F', 13],
    ['W', 2],
    ['N', 5],
    ['L', 180],
    ['N', 5],
    ['L', 90],
    ['S', 3],
    ['W', 1],
    ['S', 1],
    ['E', 1],
    ['E', 3],
    ['S', 5],
    ['R', 90],
    ['S', 1],
    ['W', 3],
    ['R', 90],
    ['E', 2],
    ['F', 37],
    ['L', 90],
    ['N', 3],
    ['E', 4],
    ['F', 85],
    ['S', 1],
    ['F', 27],
    ['S', 5],
    ['F', 10],
    ['S', 2],
    ['L', 90],
    ['E', 1],
    ['S', 3],
    ['F', 6],
    ['N', 5],
    ['E', 5],
    ['R', 90],
    ['W', 2],
    ['F', 2],
    ['N', 4],
    ['F', 73],
    ['R', 90],
    ['S', 5],
    ['L', 90],
    ['F', 87],
    ['L', 90],
    ['F', 100],
    ['L', 90],
    ['N', 3],
    ['E', 3],
    ['F', 90],
    ['R', 90],
    ['N', 5],
    ['N', 3],
    ['F', 80],
    ['N', 2],
    ['F', 88],
    ['R', 90],
    ['S', 5],
    ['L', 90],
    ['F', 88],
    ['R', 90],
    ['W', 2],
    ['S', 4],
    ['N', 2],
    ['F', 9],
    ['S', 3],
    ['E', 4],
    ['R', 180],
    ['F', 60],
    ['W', 2],
    ['F', 93],
    ['E', 2],
    ['F', 4],
    ['L', 90],
    ['F', 20],
    ['R', 180],
    ['F', 87],
    ['W', 2],
    ['F', 75],
    ['S', 3],
    ['L', 180],
    ['W', 3],
    ['R', 180],
    ['W', 1],
    ['R', 90],
    ['E', 1],
    ['R', 90],
    ['N', 4],
    ['W', 2],
    ['R', 90],
    ['W', 1],
    ['F', 74],
    ['S', 1],
    ['W', 4],
    ['S', 3],
    ['F', 59],
    ['R', 270],
    ['W', 1],
    ['N', 5],
    ['F', 42],
    ['F', 34],
    ['W', 3],
    ['R', 270],
    ['E', 1],
    ['L', 90],
    ['W', 3],
    ['R', 270],
    ['F', 57],
    ['N', 2],
    ['E', 3],
    ['L', 270],
    ['F', 57],
    ['R', 90],
    ['F', 68],
    ['E', 1],
    ['L', 90],
    ['E', 2],
    ['F', 4],
    ['N', 2],
    ['F', 28],
    ['N', 4],
    ['L', 90],
    ['N', 4],
    ['E', 5],
    ['N', 2],
    ['R', 90],
    ['F', 89],
    ['R', 270],
    ['N', 4],
    ['L', 90],
    ['W', 4],
    ['L', 90],
    ['W', 4],
    ['F', 92],
    ['S', 1],
    ['F', 77],
    ['N', 2],
    ['E', 1],
    ['R', 90],
    ['F', 72],
    ['N', 5],
    ['R', 90],
    ['W', 1],
    ['W', 3],
    ['F', 25],
    ['E', 1],
    ['S', 4],
    ['E', 3],
    ['F', 95],
    ['W', 3],
    ['F', 72],
    ['S', 3],
    ['E', 5],
    ['N', 4],
    ['E', 1],
    ['R', 180],
    ['F', 73],
    ['N', 1],
    ['W', 2],
    ['S', 5],
    ['E', 3],
    ['R', 180],
    ['F', 68],
    ['F', 4],
]

const positionShipBased = navigate(instructions, followShipInstruction)
console.log(
    'Manhattan distance, ship-based:',
    manhattanDistance(positionShipBased.coordinates),
)

const positionWaypointBased = navigate(instructions, followWaypointInstruction)
console.log(
    'Manhattan distance, waypoint-based:',
    manhattanDistance(positionWaypointBased.coordinates),
)
