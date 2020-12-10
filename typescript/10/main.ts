type DifferenceCounts = { 1: number; 2: number; 3: number }
function countDifferencesInChain(adapters: number[]): DifferenceCounts {
    const ascendingAdapters = adapters.sort((a, b) => a - b)
    let previousJoltage = 0
    const differences = { 1: 0, 2: 0, 3: 0 }
    for (const adapter of ascendingAdapters) {
        const difference = adapter - previousJoltage
        if (difference === 1 || difference === 2 || difference === 3) {
            differences[difference]++
        } else {
            throw new Error(
                `Cannot complete chain: ${adapter} must be 1, 2, or 3 jolts` +
                    ` greater than the previous adapter (${previousJoltage}).`,
            )
        }
        previousJoltage = adapter
    }
    differences[3]++ // One more for the device connection.
    return differences
}

function getDeviceBuiltInAdapterJoltage(adapters: number[]): number {
    return adapters.sort((a, b) => a - b)[adapters.length - 1] + 3
}

function countAllValidArrangements(adapters: number[]): number {
    const adapterSet = new Set(adapters)
    const finalJoltage = getDeviceBuiltInAdapterJoltage(adapters)

    const knownCounts: Record<number, number | undefined> = {}
    const countFromInitialJoltage = (joltage: number) => {
        const knownCount = knownCounts[joltage]
        if (knownCount !== undefined) {
            return knownCount
        } else if (joltage + 3 === finalJoltage) {
            return 1
        } else {
            let count = 0
            if (adapterSet.has(joltage + 1)) {
                count += countFromInitialJoltage(joltage + 1)
            }
            if (adapterSet.has(joltage + 2)) {
                count += countFromInitialJoltage(joltage + 2)
            }
            if (adapterSet.has(joltage + 3)) {
                count += countFromInitialJoltage(joltage + 3)
            }
            knownCounts[joltage] = count
            return count
        }
    }

    return countFromInitialJoltage(0)
}

const adapters = [
    56,
    139,
    42,
    28,
    3,
    87,
    142,
    57,
    147,
    6,
    117,
    95,
    2,
    112,
    107,
    54,
    146,
    104,
    40,
    26,
    136,
    127,
    111,
    47,
    8,
    24,
    13,
    92,
    18,
    130,
    141,
    37,
    81,
    148,
    31,
    62,
    50,
    80,
    91,
    33,
    77,
    1,
    96,
    100,
    9,
    120,
    27,
    97,
    60,
    102,
    25,
    83,
    55,
    118,
    19,
    113,
    49,
    133,
    14,
    119,
    88,
    124,
    110,
    145,
    65,
    21,
    7,
    74,
    72,
    61,
    103,
    20,
    41,
    53,
    32,
    44,
    10,
    34,
    121,
    114,
    67,
    69,
    66,
    82,
    101,
    68,
    84,
    48,
    73,
    17,
    43,
    140,
]

const differenceCounts = countDifferencesInChain(adapters)
console.log(
    'One-jolt differences times three-jolt differences:',
    differenceCounts[1] * differenceCounts[3],
)

console.log(
    'Count of all valid arrangements:',
    countAllValidArrangements(adapters),
)
