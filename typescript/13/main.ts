type BusSchedule = (number | 'x')[]

function determineEarliestBusIdAndDepartureTime(
    earliestDeparture: number,
    busIds: number[],
): readonly [number, number] {
    const idsWithPossibleDepartureTimes = busIds
        .map((id) => [id, id * Math.ceil(earliestDeparture / id)] as const)
        .sort(([_id1, time1], [_id2, time2]) => time1 - time2)
    return idsWithPossibleDepartureTimes[0]
}

function earliestTimestampWithSubsequentDepartures(
    busSchedule: BusSchedule,
): number {
    const indexesToCheck = busSchedule.reduce<number[]>(
        (indexes, id, index) => {
            if (typeof id === 'number') {
                indexes.push(index)
            }
            return indexes
        },
        [],
    )

    let possibleAnswer = 0
    let correctAnswer = undefined
    while (correctAnswer === undefined) {
        for (let index of indexesToCheck) {
            const busId = busSchedule[index]
            if (typeof busId !== 'number') {
                throw new Error(
                    'Bug: got a non-numeric bus ID in a place where that should be impossible',
                )
            }
            if ((possibleAnswer + index) % busId !== 0) {
                const increment = busSchedule
                    .slice(0, index)
                    .filter((id): id is number => typeof id === 'number')
                    .reduce((id1, id2) => id1 * id2)
                possibleAnswer += increment
                break
            } else if (index === busSchedule.length - 1) {
                correctAnswer = possibleAnswer
            }
        }
    }

    return correctAnswer
}

const busIds: BusSchedule = [
    13,
    'x',
    'x',
    41,
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    997,
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    23,
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    19,
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    29,
    'x',
    619,
    'x',
    'x',
    'x',
    'x',
    'x',
    37,
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    'x',
    17,
]
const earliestDeparture = 1000390

const [myBusId, actualDeparture] = determineEarliestBusIdAndDepartureTime(
    earliestDeparture,
    busIds.filter((id): id is number => typeof id === 'number'),
)
console.log(
    'Bus ID multiplied by waiting time:',
    myBusId * (actualDeparture - earliestDeparture),
)

console.log('Contest entry:', earliestTimestampWithSubsequentDepartures(busIds))
