function* playGame(
    startingNumbers: readonly [number, ...number[]],
): Generator<number, void> {
    let turnNumber = startingNumbers.length - 1
    let lastSaidNumber = startingNumbers[startingNumbers.length - 1]

    // Map of spoken number to the last turn when it was spoken.
    const previousNumbers = new Map(
        startingNumbers.slice(0, -1).map((value, index) => [value, index]),
    )

    while (true) {
        const lastOccurrence = previousNumbers.get(lastSaidNumber) ?? turnNumber
        const numberToSay = turnNumber - lastOccurrence
        previousNumbers.set(lastSaidNumber, turnNumber)
        lastSaidNumber = numberToSay
        turnNumber++
        yield numberToSay
    }
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

const startingNumbers = [17, 1, 3, 16, 19, 0] as const

const numberSpokenAtTurn2020 = getNthValueFromIterator(
    2020 - startingNumbers.length - 1,
    playGame(startingNumbers),
)
console.log('2020th number:', numberSpokenAtTurn2020)

const numberSpokenAtTurn30000000 = getNthValueFromIterator(
    30000000 - startingNumbers.length - 1,
    playGame(startingNumbers),
)
console.log('30000000th number:', numberSpokenAtTurn30000000)
