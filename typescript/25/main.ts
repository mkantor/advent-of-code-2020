type PublicKeys = {
    door: number
    card: number
}

const initialSubjectNumber = 7

function getNthValueFromIterator<T>(
    n: number,
    iterator: Iterator<T, unknown>,
): T | undefined {
    while (n-- > 0) {
        if (iterator.next().done) {
            return undefined
        }
    }
    const next = iterator.next()
    return next.done ? undefined : next.value
}

function* subjectNumberTransformer(
    subjectNumber: number,
): Generator<number, never> {
    let value = 1
    while (true) {
        value *= subjectNumber
        value %= 20201227
        yield value
    }
}

function bruteForceLoopSize(publicKey: number): number | undefined {
    let loopSize = 1
    const valueGenerator = subjectNumberTransformer(initialSubjectNumber)
    do {
        const result = valueGenerator.next().value
        if (result === publicKey) {
            return loopSize
        }
        loopSize += 1
    } while (loopSize < Number.MAX_SAFE_INTEGER)
    return undefined
}

const publicKeys = {
    door: 12092626,
    card: 4707356,
}

const cardLoopSize = bruteForceLoopSize(publicKeys.card)
if (cardLoopSize === undefined) {
    throw new Error('Failed to brute force card loop size')
}
const encryptionKey1 = getNthValueFromIterator(
    cardLoopSize - 1,
    subjectNumberTransformer(publicKeys.door),
)
console.log('Suspected encryption key:', encryptionKey1)

const doorLoopSize = bruteForceLoopSize(publicKeys.door)
if (doorLoopSize === undefined) {
    throw new Error('Failed to brute force door loop size')
}
const encryptionKey2 = getNthValueFromIterator(
    doorLoopSize - 1,
    subjectNumberTransformer(publicKeys.card),
)
if (encryptionKey1 === encryptionKey2) {
    console.log('Encryption key confirmed!')
} else {
    console.error(
        'Encryption keys do not match:',
        encryptionKey1,
        encryptionKey2,
    )
}
