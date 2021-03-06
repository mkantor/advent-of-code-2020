type InputProgram = (
    | { mask: string }
    | { mem: { address: bigint; value: bigint } }
)[]

type Memory = Map<bigint, bigint>

const max36BitInteger = 2n ** 36n - 1n

function* powerSet<T>(values: T[], offset: number = 0): Generator<T[], void> {
    while (offset < values.length) {
        const first = values[offset++]
        for (const subset of powerSet(values, offset)) {
            subset.push(first)
            yield subset
        }
    }
    yield []
}

function parseMask(
    mask: string,
): { zeroMask: bigint; oneMask: bigint; xMask: bigint } {
    const oneMask = BigInt(`0b${mask.replace(/X/g, '0')}`)
    const zeroMask = BigInt(
        `0b${mask.replace(/1/g, 'X').replace(/0/g, '1').replace(/X/g, '0')}`,
    )
    const xMask = BigInt(`0b${mask.replace(/1/g, '0').replace(/X/g, '1')}`)
    return { oneMask, zeroMask, xMask }
}

function sumMemoryValues(memory: Memory): bigint {
    let sum = 0n
    for (const value of memory.values()) {
        sum += value
    }
    return sum
}

function emulateV1(program: InputProgram): Memory {
    const finalState = program.reduce(
        (state, instruction) => {
            if ('mask' in instruction) {
                return { ...state, ...parseMask(instruction.mask) }
            } else {
                const maskedValue =
                    (instruction.mem.value | state.oneMask) &
                    (state.zeroMask ^ max36BitInteger)
                state.memory.set(instruction.mem.address, maskedValue)
                return state
            }
        },
        { memory: new Map(), zeroMask: 0n, oneMask: 0n },
    )

    return finalState.memory
}

function emulateV2(program: InputProgram): Memory {
    const finalState = program.reduce(
        (state, instruction) => {
            if ('mask' in instruction) {
                return { ...state, ...parseMask(instruction.mask) }
            } else {
                // These represent binary digits starting from the right-hand
                // side of the number: place 0 is the digit for ones, 1 is the
                // digit for twos, 2 is fours, and so on. For example, 0b1011
                // is [0, 1, 3].
                const xPlaces = state.xMask
                    .toString(2)
                    .split('')
                    .reverse()
                    .reduce<bigint[]>(
                        (indexes, character, index) =>
                            character === '1'
                                ? indexes.concat(BigInt(index))
                                : indexes,
                        [],
                    )

                for (const xPlacesSubset of powerSet(xPlaces)) {
                    const xPlacesSubsetAsSet = new Set(xPlacesSubset)
                    const onePositions = xPlacesSubset
                    const zeroPositions = xPlaces.filter(
                        (index) => !xPlacesSubsetAsSet.has(index),
                    )

                    let floatingOneMask = 0n
                    for (const onePosition of onePositions) {
                        floatingOneMask ^= 1n << onePosition
                    }
                    let floatingZeroMask = 0n
                    for (const zeroPosition of zeroPositions) {
                        floatingZeroMask ^= 1n << zeroPosition
                    }

                    const maskedAddress =
                        (instruction.mem.address |
                            state.oneMask |
                            floatingOneMask) &
                        (floatingZeroMask ^ max36BitInteger)

                    state.memory.set(maskedAddress, instruction.mem.value)
                }
                return state
            }
        },
        { memory: new Map(), oneMask: 0n, xMask: 0n },
    )

    return finalState.memory
}

const program: InputProgram = [
    { mask: '110000011XX0000X101000X10X01XX001011' },
    { mem: { address: 49397n, value: 468472n } },
    { mem: { address: 50029n, value: 23224119n } },
    { mem: { address: 39033n, value: 191252712n } },
    { mem: { address: 37738n, value: 25669n } },
    { mem: { address: 45831n, value: 238647542n } },
    { mem: { address: 55749n, value: 1020n } },
    { mem: { address: 29592n, value: 57996n } },
    { mask: '100X10XXX101011X10X0110111X01X0X0010' },
    { mem: { address: 10526n, value: 1843n } },
    { mem: { address: 2144n, value: 177500n } },
    { mem: { address: 33967n, value: 5833292n } },
    { mem: { address: 58979n, value: 25707732n } },
    { mask: '100010X011XX00X11011010011101100XXX1' },
    { mem: { address: 1729n, value: 1042n } },
    { mem: { address: 30433n, value: 366890n } },
    { mem: { address: 7726n, value: 2862n } },
    { mem: { address: 19747n, value: 52273994n } },
    { mask: '11001X0011010110X01X011X001X0XX01010' },
    { mem: { address: 40528n, value: 32637378n } },
    { mem: { address: 16008n, value: 30888145n } },
    { mask: 'X11X1X0X10X10110011X0001X01001X100X0' },
    { mem: { address: 27746n, value: 14986812n } },
    { mem: { address: 45873n, value: 4381392n } },
    { mem: { address: 26216n, value: 538203n } },
    { mask: '1100101011X00010101111001001XX1X0011' },
    { mem: { address: 30777n, value: 84408647n } },
    { mem: { address: 6931n, value: 133210956n } },
    { mem: { address: 5173n, value: 7497n } },
    { mem: { address: 65147n, value: 912575421n } },
    { mem: { address: 12597n, value: 55281597n } },
    { mem: { address: 20417n, value: 909474n } },
    { mem: { address: 65270n, value: 1914920n } },
    { mask: 'X100XX10XX010X10X110000000X0X1100100' },
    { mem: { address: 50768n, value: 3383n } },
    { mem: { address: 59421n, value: 111147n } },
    { mem: { address: 33900n, value: 427465715n } },
    { mem: { address: 33084n, value: 14313354n } },
    { mem: { address: 12648n, value: 17983288n } },
    { mask: '11X0100011X011100X00100X01111000XX11' },
    { mem: { address: 17710n, value: 60n } },
    { mem: { address: 30013n, value: 296n } },
    { mem: { address: 48130n, value: 31469003n } },
    { mem: { address: 45585n, value: 3231589n } },
    { mask: 'X1XX1010110001X0XX000010X0101010X01X' },
    { mem: { address: 20502n, value: 15059188n } },
    { mem: { address: 29762n, value: 375n } },
    { mem: { address: 24169n, value: 594n } },
    { mem: { address: 24197n, value: 64508559n } },
    { mem: { address: 8424n, value: 108440n } },
    { mem: { address: 20424n, value: 21436372n } },
    { mask: 'X10010001XX0X1100000X00000X010X00001' },
    { mem: { address: 18190n, value: 448461n } },
    { mem: { address: 37090n, value: 5353n } },
    { mem: { address: 39942n, value: 5084619n } },
    { mem: { address: 18325n, value: 1962539n } },
    { mask: '10101110110000X010100X1X10XX1X1X1101' },
    { mem: { address: 9299n, value: 6164n } },
    { mem: { address: 8421n, value: 990n } },
    { mem: { address: 23905n, value: 34526767n } },
    { mem: { address: 44233n, value: 39766571n } },
    { mask: '1110X1X01010X1111X0XX1X01110X011001X' },
    { mem: { address: 53340n, value: 16503076n } },
    { mem: { address: 59433n, value: 378862n } },
    { mem: { address: 18190n, value: 1792792n } },
    { mem: { address: 56498n, value: 227n } },
    { mask: '1100100X11000X1X0100X00010X01X010101' },
    { mem: { address: 65168n, value: 265913n } },
    { mem: { address: 40500n, value: 18368848n } },
    { mem: { address: 39558n, value: 1810777n } },
    { mem: { address: 24300n, value: 911n } },
    { mem: { address: 47807n, value: 3491n } },
    { mem: { address: 6201n, value: 267177n } },
    { mem: { address: 17369n, value: 21952n } },
    { mask: '1111101010100X0111001X10011XX1110100' },
    { mem: { address: 32283n, value: 17550n } },
    { mem: { address: 55129n, value: 56452456n } },
    { mem: { address: 7945n, value: 2961n } },
    { mask: '1X00101X0101001011101000010XX1001100' },
    { mem: { address: 1120n, value: 7335n } },
    { mem: { address: 65276n, value: 493090n } },
    { mem: { address: 17104n, value: 220n } },
    { mask: '11001X101101101110111XX01001110X0000' },
    { mem: { address: 15933n, value: 859n } },
    { mem: { address: 50326n, value: 3145522n } },
    { mem: { address: 48794n, value: 367683n } },
    { mem: { address: 24561n, value: 57849668n } },
    { mem: { address: 43526n, value: 103212n } },
    { mem: { address: 33478n, value: 20703997n } },
    { mask: '11001010111X01111001100X100X110X0110' },
    { mem: { address: 718n, value: 1589870n } },
    { mem: { address: 8424n, value: 1123972n } },
    { mem: { address: 966n, value: 7551n } },
    { mask: '11X01010110001X00000X1X0101X10000000' },
    { mem: { address: 16160n, value: 26953n } },
    { mem: { address: 16417n, value: 419431373n } },
    { mem: { address: 54811n, value: 430477n } },
    { mem: { address: 4340n, value: 180411n } },
    { mask: '10X0X00011X100101X1X1010X1X111X00X10' },
    { mem: { address: 37425n, value: 922346n } },
    { mem: { address: 289n, value: 810051n } },
    { mem: { address: 58526n, value: 86518n } },
    { mem: { address: 374n, value: 92968n } },
    { mem: { address: 37165n, value: 6023n } },
    { mem: { address: 61397n, value: 8223350n } },
    { mask: '1X001000X1X11X100000100X1011111X1110' },
    { mem: { address: 43693n, value: 743n } },
    { mem: { address: 9418n, value: 1128022n } },
    { mem: { address: 11571n, value: 47294995n } },
    { mem: { address: 449n, value: 52713877n } },
    { mask: 'X1XX1X1011000110XX0001X01XX001000000' },
    { mem: { address: 29924n, value: 1125544n } },
    { mem: { address: 10782n, value: 342783n } },
    { mem: { address: 15523n, value: 218611n } },
    { mem: { address: 8009n, value: 1866n } },
    { mask: '10XX011X11000X001X100110100111110100' },
    { mem: { address: 40200n, value: 54187n } },
    { mem: { address: 19587n, value: 45108n } },
    { mem: { address: 50857n, value: 1309n } },
    { mem: { address: 18658n, value: 11992852n } },
    { mask: '1X001000XX1001101100001X010X00001001' },
    { mem: { address: 21333n, value: 7608315n } },
    { mem: { address: 9746n, value: 259920n } },
    { mem: { address: 63211n, value: 126262747n } },
    { mem: { address: 59768n, value: 65880460n } },
    { mask: '11X11X100X1000X01X00X011110011111001' },
    { mem: { address: 59121n, value: 293545n } },
    { mem: { address: 14925n, value: 17664197n } },
    { mem: { address: 60673n, value: 1663n } },
    { mem: { address: 45765n, value: 195645n } },
    { mem: { address: 33094n, value: 58807n } },
    { mask: '1X0010X011X1001X1001X0110XX0000000X0' },
    { mem: { address: 32288n, value: 20128n } },
    { mem: { address: 50857n, value: 1189904n } },
    { mem: { address: 18918n, value: 913n } },
    { mem: { address: 7726n, value: 50248226n } },
    { mem: { address: 22429n, value: 18716n } },
    { mem: { address: 7848n, value: 272580n } },
    { mask: '01XX100010010X1X0X1X00X1X110X1100000' },
    { mem: { address: 40002n, value: 72763964n } },
    { mem: { address: 20337n, value: 36642182n } },
    { mem: { address: 19538n, value: 230553n } },
    { mem: { address: 11992n, value: 8409n } },
    { mask: '11001000X11X111000XXX011X0111000111X' },
    { mem: { address: 63876n, value: 969n } },
    { mem: { address: 1336n, value: 5375872n } },
    { mem: { address: 31377n, value: 5165n } },
    { mem: { address: 41185n, value: 161434n } },
    { mem: { address: 38292n, value: 634n } },
    { mask: '1X0010101X00011010X1X10101X011XX1010' },
    { mem: { address: 59768n, value: 10746n } },
    { mem: { address: 27445n, value: 2335n } },
    { mem: { address: 26812n, value: 58960n } },
    { mem: { address: 40116n, value: 104178572n } },
    { mem: { address: 40702n, value: 48107383n } },
    { mask: '00000001X0X1011XX011X00X01111100X11X' },
    { mem: { address: 18702n, value: 150975n } },
    { mem: { address: 62270n, value: 502767513n } },
    { mem: { address: 6931n, value: 15732227n } },
    { mem: { address: 12320n, value: 3799n } },
    { mem: { address: 29975n, value: 99827n } },
    { mask: '1100100X1100XX1000001X00000010X00110' },
    { mem: { address: 17011n, value: 11786404n } },
    { mem: { address: 25382n, value: 98379404n } },
    { mem: { address: 35946n, value: 791341n } },
    { mem: { address: 49767n, value: 719n } },
    { mem: { address: 11664n, value: 738n } },
    { mask: '000XX0011011011000111010X11X111001X1' },
    { mem: { address: 53375n, value: 513n } },
    { mem: { address: 776n, value: 31438875n } },
    { mem: { address: 26228n, value: 6566431n } },
    { mem: { address: 62653n, value: 352n } },
    { mem: { address: 8883n, value: 13700386n } },
    { mem: { address: 17292n, value: 66198210n } },
    { mask: '1110XX001110X110000X1000010001100100' },
    { mem: { address: 65123n, value: 23447n } },
    { mem: { address: 53419n, value: 1784255n } },
    { mem: { address: 32201n, value: 472209n } },
    { mask: '10X0X0001101X01000100X000011001001X1' },
    { mem: { address: 45831n, value: 4941253n } },
    { mem: { address: 17666n, value: 7n } },
    { mem: { address: 52211n, value: 250885474n } },
    { mem: { address: 33711n, value: 38546733n } },
    { mem: { address: 54654n, value: 108397257n } },
    { mem: { address: 54577n, value: 7660097n } },
    { mask: '110010001100X11010000100010XX110X010' },
    { mem: { address: 48263n, value: 203073n } },
    { mem: { address: 46274n, value: 329424784n } },
    { mask: 'XX00000XXX0X0X101011X11001001100X111' },
    { mem: { address: 46639n, value: 245946590n } },
    { mem: { address: 24300n, value: 769n } },
    { mem: { address: 54106n, value: 23763n } },
    { mem: { address: 35221n, value: 970549n } },
    { mem: { address: 23333n, value: 322574122n } },
    { mem: { address: 32283n, value: 9651n } },
    { mem: { address: 38047n, value: 804n } },
    { mask: '01X00XXXX101011010110010X10001010X01' },
    { mem: { address: 52675n, value: 50846938n } },
    { mem: { address: 43900n, value: 69746023n } },
    { mem: { address: 54409n, value: 1786723n } },
    { mem: { address: 30815n, value: 4286n } },
    { mem: { address: 37n, value: 4678667n } },
    { mask: '1X0X1X1010000101110XXX0X0001011X11X0' },
    { mem: { address: 40133n, value: 158160n } },
    { mem: { address: 13432n, value: 984n } },
    { mask: '1110X000011X0110001X10010100X0001000' },
    { mem: { address: 28551n, value: 97731716n } },
    { mem: { address: 21298n, value: 1506013n } },
    { mask: '110XX01X10100110100X01X001001111X001' },
    { mem: { address: 5461n, value: 26227n } },
    { mem: { address: 4650n, value: 1623n } },
    { mask: '110110X0110XX110010000001000101X0001' },
    { mem: { address: 18167n, value: 5899011n } },
    { mem: { address: 45492n, value: 18393n } },
    { mem: { address: 13148n, value: 171228654n } },
    { mem: { address: 59109n, value: 52915776n } },
    { mem: { address: 37n, value: 1212n } },
    { mask: '111X1000110X01X01000110X0X00110X1011' },
    { mem: { address: 13148n, value: 11483926n } },
    { mem: { address: 33841n, value: 22637n } },
    { mem: { address: 60690n, value: 16733n } },
    { mem: { address: 35555n, value: 125444n } },
    { mem: { address: 19999n, value: 10615n } },
    { mem: { address: 49083n, value: 57306580n } },
    { mem: { address: 2958n, value: 113424903n } },
    { mask: '1X00X0X011X010100110011XX0X110000X10' },
    { mem: { address: 16044n, value: 2922n } },
    { mem: { address: 58981n, value: 99n } },
    { mem: { address: 17754n, value: 41326186n } },
    { mem: { address: 57873n, value: 767731n } },
    { mask: '0000110011011X10101110X001X0X1101X00' },
    { mem: { address: 53194n, value: 54243360n } },
    { mem: { address: 15023n, value: 258913n } },
    { mem: { address: 37425n, value: 678n } },
    { mem: { address: 36057n, value: 2068683n } },
    { mem: { address: 6540n, value: 145235n } },
    { mem: { address: 46515n, value: 5824196n } },
    { mask: '1XX0X00X1X0000X010101X00001000101011' },
    { mem: { address: 42985n, value: 2821n } },
    { mem: { address: 17666n, value: 178146480n } },
    { mem: { address: 35891n, value: 111717n } },
    { mem: { address: 37731n, value: 280009n } },
    { mem: { address: 45606n, value: 27440n } },
    { mem: { address: 14991n, value: 26844935n } },
    { mask: '01X0X010X10101101011001001X001110100' },
    { mem: { address: 45084n, value: 377769619n } },
    { mem: { address: 58867n, value: 3974659n } },
    { mem: { address: 48117n, value: 374339883n } },
    { mem: { address: 1141n, value: 1632150n } },
    { mask: '1010X1X0X10000X01010X01010011111XX0X' },
    { mem: { address: 45122n, value: 3222n } },
    { mem: { address: 2300n, value: 16240n } },
    { mem: { address: 58035n, value: 6201n } },
    { mem: { address: 40871n, value: 16257123n } },
    { mem: { address: 24285n, value: 12751n } },
    { mem: { address: 57579n, value: 24679n } },
    { mask: 'X1XX000X11X01110010X0000000011110001' },
    { mem: { address: 10424n, value: 280052n } },
    { mem: { address: 36995n, value: 398570435n } },
    { mem: { address: 160n, value: 6920n } },
    { mem: { address: 42829n, value: 3609n } },
    { mem: { address: 49083n, value: 76851n } },
    { mask: '11001XX011011X100X00000011011X0X011X' },
    { mem: { address: 24655n, value: 976n } },
    { mem: { address: 56929n, value: 23232n } },
    { mem: { address: 63878n, value: 63802677n } },
    { mem: { address: 19968n, value: 15946871n } },
    { mask: '1100101011X1XX1110X100X0X0X11100X100' },
    { mem: { address: 29216n, value: 2636405n } },
    { mem: { address: 3744n, value: 344561n } },
    { mem: { address: 60039n, value: 11290842n } },
    { mem: { address: 45769n, value: 9817n } },
    { mem: { address: 52361n, value: 250607n } },
    { mem: { address: 43526n, value: 6568339n } },
    { mem: { address: 28084n, value: 47601n } },
    { mask: 'X10010101101101X1001X001X00011001000' },
    { mem: { address: 33294n, value: 65108649n } },
    { mem: { address: 39245n, value: 1562390n } },
    { mem: { address: 18702n, value: 880826n } },
    { mask: 'X110X00000100100110000X1X01111X1X011' },
    { mem: { address: 62194n, value: 21047n } },
    { mem: { address: 56498n, value: 8195045n } },
    { mem: { address: 19165n, value: 7369328n } },
    { mem: { address: 13257n, value: 536577153n } },
    { mask: 'XX00100X0X00111000X1X000X0X011110010' },
    { mem: { address: 6133n, value: 795n } },
    { mem: { address: 40702n, value: 1159n } },
    { mem: { address: 49254n, value: 936358n } },
    { mem: { address: 20224n, value: 33223599n } },
    { mask: '10001000111100101X11100XX101111000X1' },
    { mem: { address: 12938n, value: 250757561n } },
    { mem: { address: 8424n, value: 795011162n } },
    { mem: { address: 6681n, value: 444240n } },
    { mask: 'XX001000111011100000X00100X0XX00000X' },
    { mem: { address: 34480n, value: 317n } },
    { mem: { address: 642n, value: 6967048n } },
    { mem: { address: 27203n, value: 3233n } },
    { mask: 'X100100011X011X0000X11X0XX1X10010X11' },
    { mem: { address: 9519n, value: 6889363n } },
    { mem: { address: 48618n, value: 56235450n } },
    { mem: { address: 45084n, value: 3643761n } },
    { mem: { address: 22351n, value: 128696n } },
    { mask: '1X00101011XX001X1000101100X01X011XX0' },
    { mem: { address: 43960n, value: 1039599408n } },
    { mem: { address: 29626n, value: 8360561n } },
    { mem: { address: 31260n, value: 256268877n } },
    { mem: { address: 50373n, value: 1706687n } },
    { mem: { address: 24558n, value: 753n } },
    { mask: '111011X000X0XX1010000X01011XX0XX1101' },
    { mem: { address: 37425n, value: 562n } },
    { mem: { address: 32022n, value: 231573n } },
    { mem: { address: 52827n, value: 36198n } },
    { mem: { address: 1203n, value: 187184n } },
    { mask: '11X0101011110010100X00XX10001010001X' },
    { mem: { address: 27236n, value: 50136301n } },
    { mem: { address: 36499n, value: 18610469n } },
    { mem: { address: 23179n, value: 193n } },
    { mem: { address: 2602n, value: 520829n } },
    { mask: '1X1011000010X1100000X10110X00X1001X1' },
    { mem: { address: 58650n, value: 17011909n } },
    { mem: { address: 30325n, value: 1792n } },
    { mem: { address: 21629n, value: 146235659n } },
    { mask: '1X000010110X011001X0000X10000X10X1X1' },
    { mem: { address: 56201n, value: 65276n } },
    { mem: { address: 45769n, value: 27536n } },
    { mem: { address: 63677n, value: 76310013n } },
    { mem: { address: 32288n, value: 38391157n } },
    { mem: { address: 2732n, value: 553n } },
    { mem: { address: 21153n, value: 674n } },
    { mask: '110010001100X1X0000X00X111X001001010' },
    { mem: { address: 20650n, value: 1639n } },
    { mem: { address: 37394n, value: 2020484n } },
    { mem: { address: 10598n, value: 46526712n } },
    { mem: { address: 18167n, value: 18124530n } },
    { mask: '1100X00XX100X1100X0X000000X0111X000X' },
    { mem: { address: 49767n, value: 503n } },
    { mem: { address: 23201n, value: 170673423n } },
    { mem: { address: 37394n, value: 2873290n } },
    { mask: '11001010X10X00X01011X00XX00101110001' },
    { mem: { address: 12597n, value: 4852003n } },
    { mem: { address: 45585n, value: 241n } },
    { mem: { address: 6816n, value: 252644n } },
    { mem: { address: 55923n, value: 3191n } },
    { mem: { address: 59547n, value: 165517n } },
    { mem: { address: 10853n, value: 1769226n } },
    { mem: { address: 37991n, value: 238n } },
    { mask: '11001000110X11100X0001XX100110X0010X' },
    { mem: { address: 22590n, value: 60452n } },
    { mem: { address: 59590n, value: 18099n } },
    { mem: { address: 50198n, value: 21070930n } },
    { mem: { address: 5308n, value: 5434548n } },
    { mem: { address: 7675n, value: 6165055n } },
    { mask: '11XX1001010011100X01010X011111010010' },
    { mem: { address: 1312n, value: 30936n } },
    { mem: { address: 48263n, value: 2432189n } },
    { mem: { address: 58137n, value: 3014n } },
    { mask: '1000XX101X0100000100X01XX01000000100' },
    { mem: { address: 27203n, value: 610377n } },
    { mem: { address: 11538n, value: 1967996n } },
    { mem: { address: 32288n, value: 26776n } },
    { mem: { address: 7745n, value: 330n } },
    { mem: { address: 43272n, value: 1383n } },
    { mem: { address: 18399n, value: 6837n } },
    { mask: '111X1000X11001X0X0XX11010100X0100X1X' },
    { mem: { address: 17790n, value: 7714503n } },
    { mem: { address: 54074n, value: 32718129n } },
    { mem: { address: 5352n, value: 1054n } },
    { mask: '11001110001001011100X00101X000X10X00' },
    { mem: { address: 18972n, value: 783671072n } },
    { mem: { address: 59100n, value: 54416n } },
    { mem: { address: 59256n, value: 621566n } },
    { mem: { address: 31471n, value: 591n } },
    { mem: { address: 2884n, value: 2615461n } },
    { mem: { address: 51n, value: 790n } },
    { mask: '11101110XX1X0XX11000X1110X1011011000' },
    { mem: { address: 20222n, value: 882n } },
    { mem: { address: 27763n, value: 7914n } },
    { mem: { address: 32294n, value: 145898791n } },
    { mem: { address: 33294n, value: 254866534n } },
    { mem: { address: 24498n, value: 96614215n } },
    { mem: { address: 45811n, value: 59795025n } },
    { mask: '1100X0X0110001100X0001XX000X1X100X01' },
    { mem: { address: 31950n, value: 1352n } },
    { mem: { address: 10853n, value: 766n } },
    { mem: { address: 3709n, value: 5103902n } },
    { mask: '110000X0110001100100011X10X001000XX1' },
    { mem: { address: 30788n, value: 426n } },
    { mem: { address: 19168n, value: 42816n } },
    { mem: { address: 27236n, value: 45039961n } },
    { mem: { address: 21448n, value: 8723202n } },
    { mem: { address: 48744n, value: 11100131n } },
    { mem: { address: 37n, value: 3152n } },
    { mask: '1X0X1010110X0XX001000X00101XX1000101' },
    { mem: { address: 25916n, value: 52795821n } },
    { mem: { address: 1763n, value: 5368864n } },
    { mem: { address: 13148n, value: 378742711n } },
    { mem: { address: 10853n, value: 4345777n } },
    { mem: { address: 64644n, value: 8348080n } },
    { mask: 'X11011000010011110001X011X100X00000X' },
    { mem: { address: 45572n, value: 172063n } },
    { mem: { address: 39527n, value: 19012657n } },
    { mem: { address: 24187n, value: 758186n } },
    { mem: { address: 65360n, value: 97n } },
    { mem: { address: 37394n, value: 2174365n } },
    { mem: { address: 22260n, value: 170639258n } },
    { mem: { address: 11465n, value: 45577n } },
    { mask: '11011X10XXXX01X111000111111X001X1001' },
    { mem: { address: 33046n, value: 40550135n } },
    { mem: { address: 55128n, value: 487381n } },
    { mem: { address: 48068n, value: 7496218n } },
    { mem: { address: 24391n, value: 15110n } },
    { mask: '11XX1010X0X00XXX11000011110X111X1001' },
    { mem: { address: 56260n, value: 2566n } },
    { mem: { address: 40500n, value: 11350955n } },
    { mem: { address: 16482n, value: 470n } },
    { mask: '110110X01100011001X0010X101X001011X0' },
    { mem: { address: 11839n, value: 1035n } },
    { mem: { address: 27964n, value: 455n } },
    { mem: { address: 21803n, value: 109558713n } },
    { mem: { address: 20663n, value: 1163n } },
    { mem: { address: 12474n, value: 36111n } },
    { mask: 'X10010XX1100X11X0010010101001001111X' },
    { mem: { address: 15464n, value: 51852071n } },
    { mem: { address: 59553n, value: 620n } },
    { mem: { address: 28798n, value: 248109182n } },
    { mask: '11X000001X0X0110000X01111X111X110X01' },
    { mem: { address: 22073n, value: 3262n } },
    { mem: { address: 17070n, value: 33580553n } },
    { mem: { address: 11911n, value: 2692n } },
    { mask: '1X100000X1110110001011001X011X110X0X' },
    { mem: { address: 10155n, value: 747210936n } },
    { mem: { address: 57352n, value: 1286964n } },
    { mem: { address: 12621n, value: 3237187n } },
    { mem: { address: 58650n, value: 17477n } },
    { mem: { address: 13702n, value: 759723n } },
    { mask: '11X010X01XX00110XX00X1X001X011101011' },
    { mem: { address: 38922n, value: 205n } },
    { mem: { address: 45585n, value: 99912n } },
    { mem: { address: 53888n, value: 48069n } },
    { mem: { address: 44233n, value: 1788n } },
    { mask: '1110110X00X00110000010X00000100X0XX1' },
    { mem: { address: 11817n, value: 4458n } },
    { mem: { address: 58578n, value: 4618n } },
    { mem: { address: 27624n, value: 173091087n } },
    { mask: 'XX0110X011010100010X00101010010111X1' },
    { mem: { address: 14010n, value: 3227436n } },
    { mem: { address: 492n, value: 6881522n } },
    { mem: { address: 5687n, value: 2478716n } },
    { mem: { address: 12673n, value: 14623351n } },
    { mem: { address: 53812n, value: 140355n } },
    { mask: '110010X0110X0X10X0XX011100X01X10001X' },
    { mem: { address: 3709n, value: 6604n } },
    { mem: { address: 19531n, value: 29597n } },
    { mem: { address: 38507n, value: 2150917n } },
    { mem: { address: 59768n, value: 56061470n } },
    { mem: { address: 54074n, value: 4058n } },
    { mask: '11101XX0X010011XX000X0XX01100X111010' },
    { mem: { address: 60451n, value: 1612n } },
    { mem: { address: 42190n, value: 37042n } },
    { mem: { address: 20069n, value: 96923n } },
    { mem: { address: 21689n, value: 592n } },
    { mem: { address: 1247n, value: 8651172n } },
    { mem: { address: 48777n, value: 40334782n } },
    { mask: 'XX1010X011100110X1100X10010X1000X010' },
    { mem: { address: 18179n, value: 45826n } },
    { mem: { address: 33139n, value: 838529759n } },
    { mask: '01X010001X0X011X00X01001111XX1100X1X' },
    { mem: { address: 33377n, value: 1739n } },
    { mem: { address: 35840n, value: 6769704n } },
    { mem: { address: 14441n, value: 22736868n } },
    { mem: { address: 22630n, value: 1700619n } },
    { mask: 'X110100X1010X11011001110010X0XX0101X' },
    { mem: { address: 39736n, value: 41854026n } },
    { mem: { address: 5320n, value: 172367335n } },
    { mem: { address: 24297n, value: 10252548n } },
    { mask: 'X11X101011000110000XX010000001101010' },
    { mem: { address: 46338n, value: 393890n } },
    { mem: { address: 55364n, value: 969778n } },
    { mem: { address: 32531n, value: 267024186n } },
    { mem: { address: 704n, value: 3741n } },
    { mem: { address: 50527n, value: 218631n } },
    { mask: '11X0X00XX0X001X011000XX0000011110011' },
    { mem: { address: 374n, value: 216n } },
    { mem: { address: 30607n, value: 788n } },
    { mem: { address: 17248n, value: 1204n } },
    { mem: { address: 21290n, value: 356140n } },
    { mem: { address: 11719n, value: 12908630n } },
    { mem: { address: 5338n, value: 98892n } },
    { mask: 'XX00100011010110X0001X001000X0100X1X' },
    { mem: { address: 65147n, value: 16521590n } },
    { mem: { address: 50886n, value: 4725n } },
    { mem: { address: 29082n, value: 846562n } },
    { mem: { address: 26065n, value: 24418411n } },
    { mem: { address: 56929n, value: 403301n } },
    { mem: { address: 489n, value: 2168n } },
    { mask: '1000100011010110XXX01010X10010XX0010' },
    { mem: { address: 36629n, value: 2579n } },
    { mem: { address: 20122n, value: 2088646n } },
    { mem: { address: 2798n, value: 2730n } },
    { mem: { address: 20062n, value: 232728360n } },
    { mem: { address: 27203n, value: 3015n } },
    { mem: { address: 47864n, value: 10789801n } },
    { mask: '1XX00X001100X0100110X1000XX110X1X011' },
    { mem: { address: 25357n, value: 1792n } },
    { mem: { address: 25872n, value: 56296n } },
    { mem: { address: 1964n, value: 26399389n } },
    { mask: '1X00100011010X1X101X0X1X01000100000X' },
    { mem: { address: 61985n, value: 42984n } },
    { mem: { address: 19168n, value: 394494472n } },
    { mem: { address: 30890n, value: 213n } },
    { mem: { address: 58650n, value: 581887n } },
    { mem: { address: 50658n, value: 2763n } },
    { mask: '10X0XX00110XX010X010000X0X010X100010' },
    { mem: { address: 42533n, value: 153956n } },
    { mem: { address: 58867n, value: 470369n } },
    { mem: { address: 59441n, value: 176314n } },
    { mem: { address: 53867n, value: 1949039n } },
    { mem: { address: 59547n, value: 2730n } },
    { mask: '1010X00011XX0X10XX100110X0011X110011' },
    { mem: { address: 62586n, value: 2420073n } },
    { mem: { address: 56548n, value: 7379n } },
    { mem: { address: 50515n, value: 2405893n } },
    { mask: '10001X00110110101010XX1X010X001X0101' },
    { mem: { address: 33606n, value: 211n } },
    { mem: { address: 3055n, value: 106121132n } },
    { mem: { address: 12465n, value: 823n } },
    { mask: '11001X10X0XX010111001011X10XX1X0110X' },
    { mem: { address: 40544n, value: 476165n } },
    { mem: { address: 23184n, value: 280716800n } },
    { mem: { address: 12930n, value: 63529n } },
    { mem: { address: 46092n, value: 2274568n } },
    { mem: { address: 38292n, value: 1051815696n } },
    { mem: { address: 48873n, value: 1125500n } },
    { mask: 'XX00XX10110101100X1X11101000001101X1' },
    { mem: { address: 41185n, value: 228856274n } },
    { mem: { address: 20806n, value: 6455676n } },
    { mem: { address: 10598n, value: 9012n } },
    { mem: { address: 18273n, value: 3452904n } },
    { mem: { address: 43960n, value: 117914n } },
    { mem: { address: 8412n, value: 16428888n } },
    { mem: { address: 56401n, value: 15927n } },
    { mask: '110010XX110101100X000011X0010X010X10' },
    { mem: { address: 15287n, value: 1639969n } },
    { mem: { address: 53222n, value: 60401483n } },
    { mem: { address: 21266n, value: 5960n } },
    { mem: { address: 32861n, value: 7234007n } },
    { mem: { address: 61866n, value: 36199944n } },
    { mem: { address: 19264n, value: 550701n } },
    { mask: 'X0X0X100110110X01X1X001X110XX0110001' },
    { mem: { address: 13148n, value: 3209260n } },
    { mem: { address: 49522n, value: 22692520n } },
    { mem: { address: 45544n, value: 532538n } },
    { mem: { address: 38922n, value: 127394n } },
    { mem: { address: 53475n, value: 850137n } },
    { mem: { address: 41422n, value: 762248838n } },
]

const memoryAfterV1Emulation = emulateV1(program)
console.log(
    'Sum of stored values (v1):',
    sumMemoryValues(memoryAfterV1Emulation),
)

const memoryAfterV2Emulation = emulateV2(program)
console.log(
    'Sum of stored values (v2):',
    sumMemoryValues(memoryAfterV2Emulation),
)
