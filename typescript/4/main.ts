type PassportField =
    | 'byr'
    | 'iyr'
    | 'eyr'
    | 'hgt'
    | 'hcl'
    | 'ecl'
    | 'pid'
    | 'cid' // This field is truly optional!

type Passport = Partial<Record<PassportField, unknown>>

function isPassportValid(passport: Passport): boolean {
    return (
        'byr' in passport &&
        'iyr' in passport &&
        'eyr' in passport &&
        'hgt' in passport &&
        'hcl' in passport &&
        'ecl' in passport &&
        'pid' in passport
    )
}

function countValidPassports(passports: Passport[]): number {
    return passports.reduce((count, passport) => {
        return isPassportValid(passport) ? count + 1 : count
    }, 0)
}

const passports: Passport[] = [
    {
        ecl: 'gry',
        pid: '860033327',
        eyr: '2020',
        hcl: '#fffffd',
        byr: '1937',
        iyr: '2017',
        cid: '147',
        hgt: '183cm',
    },
    {
        iyr: '2013',
        ecl: 'amb',
        cid: '350',
        eyr: '2023',
        pid: '028048884',
        hcl: '#cfa07d',
        byr: '1929',
    },
    {
        hcl: '#ae17e1',
        iyr: '2013',
        eyr: '2024',
        ecl: 'brn',
        pid: '760753108',
        byr: '1931',
        hgt: '179cm',
    },
    {
        hcl: '#cfa07d',
        eyr: '2025',
        pid: '166559648',
        iyr: '2011',
        ecl: 'brn',
        hgt: '59in',
    },
]

console.log('Valid passports:', countValidPassports(passports))
