type Letter =
    | 'a'
    | 'b'
    | 'c'
    | 'd'
    | 'e'
    | 'f'
    | 'g'
    | 'h'
    | 'i'
    | 'j'
    | 'k'
    | 'l'
    | 'm'
    | 'n'
    | 'o'
    | 'p'
    | 'q'
    | 'r'
    | 's'
    | 't'
    | 'u'
    | 'v'
    | 'w'
    | 'x'
    | 'y'
    | 'z'

type PasswordPolicy = {
    min: number
    max: number
    letter: Letter
}
type Password = string
type Passwords = [PasswordPolicy, Password][]

function isPasswordValid(policy: PasswordPolicy, password: Password): boolean {
    let policyLetterCount = 0
    for (let character of password) {
        if (character === policy.letter) {
            policyLetterCount++
        }
    }
    return policyLetterCount >= policy.min && policyLetterCount <= policy.max
}

function countValidPasswords(passwords: Passwords): number {
    return passwords.reduce((count, [policy, password]) => {
        return isPasswordValid(policy, password) ? count + 1 : count
    }, 0)
}

const passwords: Passwords = [
    [{ min: 1, max: 3, letter: 'a' }, 'abcde'],
    [{ min: 1, max: 3, letter: 'b' }, 'cdefg'],
    [{ min: 2, max: 9, letter: 'c' }, 'ccccccccc'],
]

console.log('Number of valid passwords:', countValidPasswords(passwords))
