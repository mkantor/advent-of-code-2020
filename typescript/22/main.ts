type Decks = {
    player1: number[]
    player2: number[]
}

function cloneDecks(decks: Decks): Decks {
    return {
        player1: [...decks.player1],
        player2: [...decks.player2],
    }
}

type NonRecursiveRoundOutcome =
    | {
          player1: [number, number]
          player2: []
      }
    | {
          player1: []
          player2: [number, number]
      }
function playNonRecursiveCombatRound(
    card1: number,
    card2: number,
): NonRecursiveRoundOutcome {
    if (card1 === card2) {
        throw new Error(
            'Someone is cheating; the deck contains more than one of the same card!',
        )
    }
    return card1 > card2
        ? { player1: [card1, card2], player2: [] }
        : { player1: [], player2: [card2, card1] }
}

function playNonRecursiveCombatGame(inputDecks: Decks): Decks {
    const decks = cloneDecks(inputDecks)
    let player1Card
    let player2Card
    while (
        decks.player1.length > 0 &&
        decks.player2.length > 0 &&
        (player1Card = decks.player1.shift()) !== undefined &&
        (player2Card = decks.player2.shift()) !== undefined
    ) {
        const roundOutcome = playNonRecursiveCombatRound(
            player1Card,
            player2Card,
        )
        decks.player1.push(...roundOutcome.player1)
        decks.player2.push(...roundOutcome.player2)
    }
    return decks
}

function fingerprintGameState(decks: Decks): symbol {
    return Symbol.for(`${decks.player1.join(',')}|${decks.player2.join(',')}`)
}

function playRecursiveCombatGame(inputDecks: Decks): Decks {
    const decks = cloneDecks(inputDecks)
    const previousStates = new Set([fingerprintGameState(decks)])
    let player1Card
    let player2Card
    while (
        decks.player1.length > 0 &&
        decks.player2.length > 0 &&
        (player1Card = decks.player1.shift()) !== undefined &&
        (player2Card = decks.player2.shift()) !== undefined
    ) {
        if (
            decks.player1.length >= player1Card &&
            decks.player2.length >= player2Card
        ) {
            const recursiveOutcome = playRecursiveCombatGame({
                player1: decks.player1.slice(0, player1Card),
                player2: decks.player2.slice(0, player2Card),
            })
            if (
                recursiveOutcome.player1.length >
                recursiveOutcome.player2.length
            ) {
                decks.player1.push(player1Card, player2Card)
            } else {
                decks.player2.push(player2Card, player1Card)
            }
        } else {
            const roundOutcome = playNonRecursiveCombatRound(
                player1Card,
                player2Card,
            )
            decks.player1.push(...roundOutcome.player1)
            decks.player2.push(...roundOutcome.player2)
        }
        const stateFingerprint = fingerprintGameState(decks)
        if (previousStates.has(stateFingerprint)) {
            return { player1: decks.player1, player2: [] }
        } else {
            previousStates.add(stateFingerprint)
        }
    }
    return decks
}

function calculateWinnerScore(decks: Decks): number {
    const winnerDeck =
        decks.player1.length > decks.player2.length
            ? decks.player1
            : decks.player2
    return winnerDeck.reduce(
        (score, card, index) => score + card * (winnerDeck.length - index),
        0,
    )
}

const startingDecks = {
    player1: [
        14,
        29,
        25,
        17,
        13,
        50,
        33,
        32,
        7,
        37,
        26,
        34,
        46,
        24,
        3,
        28,
        18,
        20,
        11,
        1,
        21,
        8,
        44,
        10,
        22,
    ],
    player2: [
        5,
        38,
        27,
        15,
        45,
        40,
        43,
        30,
        35,
        9,
        48,
        12,
        16,
        47,
        42,
        4,
        2,
        31,
        41,
        39,
        23,
        19,
        36,
        49,
        6,
    ],
}

const nonRecursiveOutcome = playNonRecursiveCombatGame(startingDecks)
console.log(
    "Winner's score in non-recursive game:",
    calculateWinnerScore(nonRecursiveOutcome),
)

const recursiveOutcome = playRecursiveCombatGame(startingDecks)
console.log(
    "Winner's score in recursive game:",
    calculateWinnerScore(recursiveOutcome),
)
