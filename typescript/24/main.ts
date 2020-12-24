// A hex grid can be nicely addressed using three dimensions.
// See <https://math.stackexchange.com/a/2643016>.
type CubeCoordinate = {
    x: number
    y: number
    z: number
}
type Direction = 'e' | 'se' | 'sw' | 'w' | 'nw' | 'ne'
type TileLocation = string // Stored stringified for value equality.
type BlackTiles = Set<TileLocation>

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

function step(start: CubeCoordinate, direction: Direction): CubeCoordinate {
    switch (direction) {
        case 'e':
            return {
                x: start.x + 1,
                y: start.y - 1,
                z: start.z,
            }
        case 'se':
            return {
                x: start.x,
                y: start.y - 1,
                z: start.z + 1,
            }
        case 'sw':
            return {
                x: start.x - 1,
                y: start.y,
                z: start.z + 1,
            }
        case 'w':
            return {
                x: start.x - 1,
                y: start.y + 1,
                z: start.z,
            }
        case 'nw':
            return {
                x: start.x,
                y: start.y + 1,
                z: start.z - 1,
            }
        case 'ne':
            return {
                x: start.x + 1,
                y: start.y,
                z: start.z - 1,
            }
    }
}

function stringifyCoordinate(location: CubeCoordinate): string {
    return `${location.x},${location.y},${location.z}`
}
function parseCoordinate(location: string): CubeCoordinate {
    const [x, y, z] = location.split(',').map(Number)
    return { x, y, z }
}

function getNeighbors(
    location: CubeCoordinate,
): [
    CubeCoordinate,
    CubeCoordinate,
    CubeCoordinate,
    CubeCoordinate,
    CubeCoordinate,
    CubeCoordinate,
] {
    return [
        step(location, 'e'),
        step(location, 'se'),
        step(location, 'sw'),
        step(location, 'w'),
        step(location, 'nw'),
        step(location, 'ne'),
    ]
}

function* livingArtExhibit(
    tilesToday: BlackTiles,
): Generator<BlackTiles, undefined> {
    while (true) {
        const blackTileLocations = Array.from(tilesToday).map(parseCoordinate)
        const tilesNextDay = new Set(tilesToday)

        // Any black tile with zero or more than 2 black tiles immediately
        // adjacent to it is flipped to white.
        for (const blackTileLocation of blackTileLocations) {
            const blackNeighborCount = getNeighbors(blackTileLocation)
                .map(stringifyCoordinate)
                .filter((key) => tilesToday.has(key)).length
            if (blackNeighborCount === 0 || blackNeighborCount > 2) {
                tilesNextDay.delete(stringifyCoordinate(blackTileLocation))
            }
        }

        // Any white tile with exactly 2 black tiles immediately adjacent to it
        // is flipped to black.
        const whiteNeighbors = blackTileLocations
            .flatMap(getNeighbors)
            .filter(
                (location) => !tilesToday.has(stringifyCoordinate(location)),
            )
        for (const whiteTileLocation of whiteNeighbors) {
            const blackNeighborCount = getNeighbors(whiteTileLocation)
                .map(stringifyCoordinate)
                .filter((key) => tilesToday.has(key)).length
            if (blackNeighborCount === 2) {
                tilesNextDay.add(stringifyCoordinate(whiteTileLocation))
            }
        }

        tilesToday = tilesNextDay
        yield tilesNextDay
    }
}

function parse(input: string): Direction[] {
    const output: Direction[] = []
    let index = 0
    while (index < input.length) {
        const firstCharacter = input[index]
        if (firstCharacter === 'e' || firstCharacter === 'w') {
            output.push(firstCharacter)
            index += 1
        } else {
            const twoCharacters = `${firstCharacter}${input[index + 1]}`
            if (
                twoCharacters === 'se' ||
                twoCharacters === 'sw' ||
                twoCharacters === 'nw' ||
                twoCharacters === 'ne'
            ) {
                output.push(twoCharacters)
            } else {
                throw new Error(
                    `Invalid input at offset ${index}:` +
                        ` neither "${firstCharacter}" nor "${twoCharacters}" is a known direction`,
                )
            }

            index += 2
        }
    }
    return output
}

const input = [
    'swseeneeswneenwneenwswenenwnewswnesw',
    'neneswnwnwnenenenwnenenenenenwne',
    'sweseeseeeeenwe',
    'wswseneeenweeeeeeneeeseeseswe',
    'nwnwnwnenwnwnwswnwnwswnwnwnwnwnwnwnenwee',
    'ewnenenwnwenenwswsesenenweseeew',
    'seswseseseseswneswsesesesesew',
    'enenwneeneswnwswneneneswseneeneneenwne',
    'sewsesesenwseneswsesenenenewseseesesesesw',
    'eswwseswnwsesenweswnweseswsewsesese',
    'nwnwnwwnwnwswnwnwwnwnwswnwnweenwnww',
    'sewwsenwwwnwnewwwwwwnewnwsenww',
    'swswnwswneseswswseswswwswswnenesweseeswnw',
    'wwwsewswswwswsweswswswnwnweneswsww',
    'swwwwwwwswwswsweswsw',
    'seseswwwswswswseneseswseesenwse',
    'nweeneseswswswswweswswneswswswnewne',
    'nweenwseeseeseeeseseswseeswseese',
    'wwnwswewnesewwwwwwwwswwsww',
    'wseseeweenwesesesewnweeseswesesee',
    'seeswnenwewneeeeeswenwnewswnee',
    'wneseswswseesenwswnwesweeeneeene',
    'neswswseseswsesesenwseseseswseswesewsesw',
    'nwnwnwnwnwnenwwnwsenesenwnwnwnwnwnwswnwnw',
    'esewwnwnewseswwwweswwww',
    'wnwnwnwwneenwnwnwnwnewnwsenwnwenw',
    'wsewwwwnewswwwwwewwswnenesw',
    'seseswwseseswsweswesweswnwnwswswwswse',
    'nenwnwnwsenenenwnwnwnwnwnwnwnwnw',
    'nenenenenenwnesenewnewnewneseeeene',
    'swneswswseseswseseswswseswwesenwswswsesw',
    'wsweswwneswwswwnwswsweswsewsesww',
    'swswnewwswwswnwwnwswsesenwwewww',
    'nwwnwenwnwwwswsewwnwwnwnwnwnwnw',
    'wswnesenwnwwseweswnweseseseesenesese',
    'seswswswseswseswswnwesesenwseswswswnwsw',
    'eenenwesweeneswneswewenwenesene',
    'nwswnwenesesesenwseseeeneeweseseswwse',
    'esenenwnweswnewwswenenesewswseesw',
    'wwwswnwwwsenenwsenweswwneswwwnww',
    'wswswswenweweseswneswnwswwseeswnese',
    'neswneenwseeswnwsewnewnwwwesww',
    'enwnwwsenwnwenwwnwenwwwnwnwnwnenesw',
    'seeeneeeneseeewsewseweweese',
    'ewwwewwswswswswsewwwswwnwsww',
    'neneseseneeneneeneeeenwwe',
    'nwnenwneneenwnenenenwnwswnwswseenenenew',
    'swnenwnwswnwswnwnenwnenwnwnwnwnwnwnwswnwne',
    'eseseswswswnwswseseswseswswsenesenwseswse',
    'enwswnenweseneeeeesenwsweeswee',
    'seswnwnwnenwnwnwnwswnwne',
    'swesewseeseeeseweweseeenweee',
    'nwsewseseweneseseneseseseenwseswseseese',
    'ewnenwswwwwwwwwwwnwsewwwwsew',
    'neswnwnwswswswseseweseseseeseswswwswse',
    'eswnwnwneseenenwwnwnwsenwwnwsenenwne',
    'seenwseswswswnwseswsenwswswswswseseesw',
    'seneswenewsesenwswnesewseeseneewsese',
    'nweewswswnwseswsweneseseeswnw',
    'neneswnenenwneesenwseneneewewneene',
    'nenwnenwnwnwwneneneenene',
    'seweswseseneswswsewswswseswnenene',
    'sewnwswsenweseweswenewse',
    'seseseseseeswseseswsenwsesenwseswsesese',
    'eenenweeneeeseee',
    'swseswseseswnenesesenwnwneseneswwwnwsw',
    'swewnewwwweswwsewswwswswswsww',
    'seswswswswneswswswsw',
    'senwseswswnwswswswswwswwwswwswwswnee',
    'seseswswseesewwneswseneseseswsweswsw',
    'swwswwswswsewwswswwsenwneswswwsww',
    'wwswswnwwewwwswswswwwewswww',
    'nwnenenenenenenenwneswnenewsenenenenwne',
    'neswweeeeneeseeneneeeweeene',
    'swswwswswswsweswswswswswneswsw',
    'seseseeseeeneeeewnwnweeewsweese',
    'swswswswswseswsewseeswswswswnwneswswsw',
    'neesewseneswswnwswneswnwswwnwwswswne',
    'swneswnenenenwneenee',
    'neeseewseeeewnweswnweeweewe',
    'seseswseseswswnenwneswsenenewswseesesw',
    'swnwnwenwnwnwswwneswnwnewnwnenwnwswnenwse',
    'nwwswseneneeswneewswwsesesenw',
    'nenenwnwnwswswneenwnwnenwnenwnenwnwsenwne',
    'sewsewnwneseenwseewsesesesesewseesene',
    'seeesenenwseseseseenwseseseweeswsewse',
    'nweenesenwneeeneneeneeeswnenene',
    'ewwwwwewwnwwwwewswswew',
    'seeseswesesesenenwnwswseenwnwsweeswnw',
    'eseswswseneeswnenwwseseseseseseneswsww',
    'sewseseseeesenweenewseeeseswesese',
    'swseseseseneesesesesewseseeweseesese',
    'seseseesesenwsesenwswsesesesesesesesenesw',
    'eweeeneneswswsewsenee',
    'wswwnewwwwsenwwnewswwewwwww',
    'wwwnwwwwwswenewwwwwwnwnwwse',
    'seseswseseseseseseseesesesenwsenwsesese',
    'seseesenwnenwnewswswneesewswsesw',
    'swnwswwwswsweswwe',
    'wwswenewnewnwswweeswwsewnwswww',
    'nwwneswswswswsweswwswswnewswswswswswswsw',
    'wseswnwneswseeseeeeneeeseseeseew',
    'wwwsewwwewwnewwwwnwwwww',
    'wswswswseeswnwswweseseweswswswswne',
    'nwnwnwnwnwnwsenwnenewnwwwnwnwsewnwww',
    'swswseneswswswswswswsewswswswnwnwe',
    'enenwswswseswseseswswswseswswsenenwsw',
    'nwswneswnenwswsenenweeswsesesewseswse',
    'neesewsweswewseswseseseswseswnwnwswsenw',
    'neeneneeneneneneneeseeneneswwwnee',
    'nwswsewnwswswenesenwneneewseweenwnw',
    'nwnwnewwwsewswseeswenwnwnenwnwneenww',
    'wwewwwnwwwwsewwne',
    'seswesenweswswnwswswswneenw',
    'eeeneeenenewneneeneneenee',
    'swswswnwewwnwwwseswswwswewnwwswswsw',
    'wwwnwnwwwnwwesesewwe',
    'swesesesenwsesesesenwseswseswswsese',
    'nwnwsenwsenwenwnwnewnenwnwnwsenenenew',
    'neenwnenesesewnwnewnenewnenenenesenwne',
    'nwnwseneesenwwnwnwnwnwnwnwnesewsenww',
    'swswneswwswswswwnwswsewswwenwseswsw',
    'wswnwsweweswsenwnwnenwwesenwnenesenwe',
    'nenenenenenwnenenewswnenenwneneseneswnee',
    'seseseenwenewsesesesesesesese',
    'newwneenwsweewnesenee',
    'sewnwnewsewnwwnwnwnenwwwnwenwnw',
    'senwwnenwneswnwnwswnenwnwswnwwnenwwnwnw',
    'wwswneswnwnwwwwsenwnwenwenwwnw',
    'eseswnwnwseswweeseswnenesenwsesesenw',
    'swwseeswswwnewwseswswswneswswswnew',
    'seswseswseswswnwnewswseswseswnewswsesw',
    'seseswnwnwneswswenwnwswswswsewwwwsw',
    'wwwwswswnewswnenwwswswnwewseswe',
    'eeneeeneneneeneesw',
    'sewnenwswswswwswswswseeswswswneswswsw',
    'wneneswnenwswseeswnenenenwseneswnewnene',
    'nwnenwnenenesenewneneneneenwne',
    'swsenwsenwseewewswseeswseeseswswsw',
    'seeseneenwseneseseseseswsesesesesesew',
    'wseswswswwnwsweswwwswwwwwwnew',
    'swswswseswneswswseswswswswswsenwseswnese',
    'nwnewsewwnwnesweswewswnwseswe',
    'weneswsweewswsenwnwnwnwsenwnwwwnw',
    'nenenenwwsenenenesenenwnenenene',
    'swwswenwswseswseswswseswseswswneswswsw',
    'nesenenenwsenenenesenenenenenenenwnenenww',
    'nenwnenwnwnwwsenwnwnenenwsenenenwnenenw',
    'seswswneswseseswswseseswseseenwwwswnw',
    'seswseseesenwnesewnwnweseswenwwswe',
    'eneeesenwenwwsweeseeseseseeesenwsw',
    'swswnwswswseseseeswseseseswsweseswnwsese',
    'nesenenenewnenenee',
    'nwnenwenenwnwnwnwnwnenwnwnwneneswnwswnw',
    'nwnesweswnwnewnenesenweneneeeswnene',
    'seseseseseseseneswseswsw',
    'wwnwsenwnwseneswwnewnwswwnwseswwenw',
    'nwnwwewswswnwnwwwnwnwwnwsenwwnwnwnwne',
    'neeneneeeeswsweeeenesweneeene',
    'swswswsewseswswswnenwsewseswswsesesee',
    'nwenenwwneseswneneneenenewswwnesenw',
    'seseseswseeseseeneseesesenewsenesesww',
    'eeeeeseseesenwse',
    'nwnwnwnwwnenwnenesenwnwnenwnwnw',
    'swnwneswsweseswsesenwswswswswswseswseswsw',
    'neenwseseseweseseseeeeeeeeswne',
    'ewseneseweeewsesesewse',
    'senenwswnwnwenwsesenwnwnenwnenwswnenwnwnw',
    'wswswswsweswswseswswwswswwswswnenesw',
    'nwswswnenwenenenwnwnenene',
    'wnewnwswwwneswweewewswwnewsew',
    'eewnesenewneeeneneeeswneneenee',
    'swswswswswswswneswneswneswswswwswneswne',
    'swsenwwwwnwwsenewenenwwnwwnwnwnwnw',
    'swnwnwwwwwwwwwnwwnwnwwe',
    'nweeneseweeswneewneneneneeneeene',
    'neneseneeneneeeenwneeweseneewse',
    'nwswseeswswswsesesenwswseswseseswswsesw',
    'neeneneneneneneesewneswneeweneenenee',
    'wswwswnwwwswswswsesw',
    'eneneeweeeenenenene',
    'wwwnewswwnewwwwsesewwwwenwse',
    'nwnwsewnwnwnwnwnwnw',
    'neswseswswseswswseswswseesenenwnenenwne',
    'nweeweenwneesenwswseswenw',
    'swnewswswswseeneeswnweenenenwnewnwsene',
    'swneneenewnenewnenwswneneswneenenenesw',
    'nwsenwsewnenwsenwnwnenwnwwswswnwnwnwnwnwe',
    'wewnwewwwewwwnwwswwwswswwsw',
    'nwwwwsenwwnenesenewswwswewwswwsw',
    'esweeneeesweeeneseenwneneeneswe',
    'ewswswwswwwswswwwww',
    'wwwsesenenwnwnewwewsewwswweswnew',
    'nwneswnesenwneneesenwnwnenenwnewsenwnw',
    'wsenenwnwnwseewsenwnwenweneswneseswwnw',
    'swswswswseseswsenwsesweseesesesewswsw',
    'eweeseesweneseeseesesesee',
    'nwewseneswsewsenweseeseswsesenenenw',
    'sesenwwswseeeeseeseseswneseseeesese',
    'nenewneneneneneneneneenenwnwnesenenenesw',
    'swseseeseseseseseseseesenwwswneese',
    'seseseseseseseeeeseeseneseeweswnw',
    'nwswwseneenewsesenenenwnenwsenesenwswnwe',
    'nwnenwwsenwswewsenwnwnwnenwnwnwnwnwnwnwnw',
    'sewswsweweswnwwneneswnese',
    'nwswneseswseswseseseseswenwswswswswswswse',
    'newenwnwswnwswnwnwneeswweswnwesenwsw',
    'eenweeeeenwsenweseeeesewse',
    'wseeeswswwwwwswsesenenenwswnwwwenw',
    'eseeneenenweeesweeenwee',
    'seswswswwseesesese',
    'eeseseeeenwswnwseneseweseeeeseesw',
    'seseseeseeneewwseswneseseneneswnwwe',
    'wwwwwwwnewwwwseww',
    'wseenwnwnwwsenwnewnwwwwweewsww',
    'swwenwwwenwnwneseswesewwneswswse',
    'swswnenenenenenenwnene',
    'nwswneswwnwwswwsewsewnenwwwwenenw',
    'nwswseseseeseswnweseswswseswswnwsesew',
    'swnwswswsesenwsweseswsenwne',
    'eneeneeneeeseeneneswswsweneenenewe',
    'wsesweseswnweeeeeeenwesweenwe',
    'nenenwwnweenenewneseneneswnwnenwswne',
    'wwwweswwseswneswswnwwswneseswswswsw',
    'eswenweseeeeeeweseneeneeseseee',
    'seseseswseseneesesenwswsesesesesesesew',
    'swswneseswswswseneswwwsesweseseseswse',
    'weseeeseeeeeseseeneseeenwseswse',
    'eseeneesenesewnesewseseswseseseesew',
    'nwswswseswseseseseswseeeseneswswsewse',
    'wnwnwsenenwnwsesenwwesewnenwseeswenenw',
    'senweeseswwswseseseeneeese',
    'neswseseseseseesesesesesesese',
    'senwenwnwsweeswswseseseseeseneseeewse',
    'eswnwswswseswsweswnwswnwwswnwswswsesw',
    'seweswswsenwsenwseswsenesw',
    'neneeneswnwnenenenwewnwnewneeswnwne',
    'wswswswsenenwnwswswsweswswneneeswsesww',
    'swnwnenwnenwnenenesesenenenenenenenwnene',
    'enesweeenwswswnesweneneeneeeswee',
    'nwnwnwsenwnwnwewnwnwnwnwnwnwneswnwnwnwnw',
    'enwnesesewesenweseeewseenwesee',
    'swsenewenesewwswwwsewnesw',
    'eneeeneeeeeenwwneneeseeeewse',
    'ewseeeenwnesewesweeeeeeseseee',
    'nwwneneseswnenwnwnesesenesenenwnwswnwwne',
    'eenwnwwwsewwwne',
    'swenwnwnwnwnwewnwewnwswnwnwnwnwwnww',
    'seesewseseswnesenwesenweeswswseswne',
    'wwwweneneewseswsenwwswwwwwnew',
    'enwnwnwwewseswwnwwnwnwnwwnwnwwee',
    'enenenenenwnenenwwnwnenenwswneneenenw',
    'eeweseeewseeesesweeenenwenesese',
    'neswnwneneneneeneeeneneeneeneswnene',
    'swwswwswewwswwswswwneswswwswsesw',
    'neswneneseneneneneneneneneneneneswnwnenene',
    'nwwnwnewnenweswnwweswseenwsewwnwse',
    'eseeeweeeseeeenwswesenweeee',
    'seswseseswswneseneseseseseswseseseseenenw',
    'neseewswswweweeewwenwewsenwnw',
    'seswnwseseseeesenwwseseseswnesesesese',
    'swwnwswnwnwnwwnwnwnwenwenwnwnwnwnwnw',
    'eneseneswewneseenwenwnweseneeneenw',
    'swsenwwwseswswnwswswwenwswswsweswsw',
    'neneneneneneenenewneseeneenenwswene',
    'swswswswswswwswswenwwswswswswswswswe',
    'swnwswwnenwswwneeseseswwnenesewsene',
    'neeesweewneenwneseeeeneeenee',
    'wnwwwswnwnewswnwswsewnwnenweeswnew',
    'swneneneneneeneneeeneneeswnenene',
    'weseswseeswewnwwseseese',
    'eesweeseeeseeeenweee',
    'seswswwsewseswneneswwwneswneewneswww',
    'sewseswsewswwswwwwnwnesweswnwneswe',
    'nwnwnenewnwnenwsenenenwneenwnwnesewnene',
    'swnwswnwnwswesenesesesewnwsenwnwneese',
    'wnwnwwnwwnwnwwenwnwnwenwwwnwseew',
    'nesweseswwnwnwnwnwwswswseenenwwsesw',
    'esesenwneneeneneseneeenewewe',
    'wsesweswnwswneswswswwsesenwswneswswsw',
    'eswnenwenenwneeeswewenweneeesw',
    'wneneeneeswneenenenewneneenenenenwnese',
    'wwnwwwsewnwwwwnenewsenwwwww',
    'nwsenwsenwnwnenwnwwnwnwneswneneneenenwnene',
    'wswnweneswswesweeewwnenwnenwnenwne',
    'wewwwwwnwswwnenwnewswwewswnw',
    'swwwnwweeswewswwwwsewwwnwnw',
    'neeneeeenwneneeweneeseee',
    'swenwneeneswneneewneneeneseseeswew',
    'nweeeeeeseeeeeeswesweeene',
    'nwnwenwnwneseneseswnwnewenwswnwenewnw',
    'wsesesesesesesesesesenesesw',
    'wwwwwnewweswswnwwewwewwsww',
    'wnenwnwwwwwwnwnwwnwwnwnwsew',
    'nwnenesenenenenenewneneweneneneenwnesw',
    'esewnesenwneeswenenewswswwnwsesenwnw',
    'eeeeeeeeeseneewswnweeeneswe',
    'neneseseweswwwwswnwwswnwwsweswwww',
    'seswswneswswswnewsweswswswsenenwwwsw',
    'nenenweneneneneneswneneneeene',
    'sewnwseeneseseeswseeenwseseseneseswee',
    'enewneseeeseneeeeeneeeeneenew',
    'esewswenweseenwseeeeeeesenesw',
    'nwnwenwnwnwewnwswnwswseseneewnw',
    'enwnwnenwnwwswnwnwnenwnwnenwnwsenenenw',
    'nwsenwwnwenwenwnwwenwewswwenwww',
    'senwsesesesesesenenwsesenwsenwneseseww',
    'wsenwswseseswewswneseswswswesw',
    'nwwnewwnwsewwwwwwsewwnwwseww',
    'wsenesesenenwneswwseswswswneneswswseswsw',
    'seseseseseseneseenwsesewseseseesesese',
    'neneenenewnenenenenenenewneneenesew',
    'ewwneswswnenenwswnwswseseeswnwesewsw',
    'seswswewneswwnwnwnwswneneeseswnewe',
    'nenwwnwwsenwswnwnwnwwnwwenwnwnwnwnwnw',
    'wwwnwnwseswwnwwnwneeswwnwneswnwnw',
    'swswwwnwnewwwweswswswwwwsewswsw',
    'eeeeswesweeeeenweeenweenee',
    'senwseweswnwnwswnenenwwnwsenwnwnenenw',
    'nwnwwnwnwsesenwnwnwnwnwnwnwneswe',
    'swseeseswseseseswneseswnwnwwseswnwsenw',
    'nwwewewwnenwnweswsesee',
    'swewwwsewwswswwnwwwswswnw',
    'wnwweenewnwnwsweswwewwsewswse',
    'swenesewsesewsesenesesewsenwesesewnw',
    'eseseeeesenwesenweseseseseswswesese',
    'nwnwnwnwnwnwnwnwnwnwsenwnwwnwnwnwnwsesenw',
    'seeseenwnwwseneswseseseseswsesenwsee',
    'swswswsweswwwswswnwswwswswswwswese',
    'wswwwwnewwnwwswswwnwwsewsesewne',
    'swswnwswneswenwswseswseseneseswwesww',
    'swswneswswswswewswnwswww',
    'nwnwnwnwnenwwnwenwnwnwnwnwnwnwnwseesw',
    'swnwseneenenwneneseneneneeeenewnene',
    'neeeeeseneneneneeeswnwneeswenene',
    'enwwnwnwwnenwnwnwenwwnenwneesenwnene',
    'nwwnenwenwewwesenwnwwswnwwsenww',
    'wnwnwnwnwnwwnwnwswwnwenwnw',
    'swwwwnewswnenwswseseswswnewesewne',
    'nenwwnwnwnwnwnwneenwnwsenwnenwnwswnwnenw',
    'neewsweeeeeeneeeeneeswneeee',
    'wwswwwwseswswswwwswwwwnewwe',
    'nwwswseneenesewswneswswneseswswwnesw',
    'eneneneneneneenewnenenene',
    'nwenwneneeeswwneeneswneneneseneeene',
    'nenweeneenwnesewneswswenew',
    'swwwweswnwwsweswswswwswswswwwsw',
    'swswnwnwswswswswswswseswsweswswwswswsw',
    'nesewswswseswseseneseneseseene',
    'newneswwneeneeenenwswseneeenenwene',
    'neneswseenenewneswwnenweenenenenwsene',
    'seneneneseneswnwnenewenenenenwwswnenw',
    'nwnwsenwnwnwnwnwsenesenwenwwnwnwswnewnwnw',
    'seeesenesenwseeswwswnwnwseneseewenw',
    'swswsesesenweseeseswwsesesenesenwsesesw',
    'swswwneneswswswsweswswswswswswswswswswsw',
    'wseseswneseseseseseseswneswesenwsesese',
    'nwenwneeneseswswwnwnwnwnwwsewswnwne',
    'nwnenenwwneseneenwnwnenwnwnenewne',
    'sesenwseswenweeeeesesesesewsesesee',
    'wnwswnenwwwenwwnwnenwwnwwsewwsww',
    'nenenwnwnenwwnenwnenwwsenwnenwnwsenwewse',
]

const center = { x: 0, y: 0, z: 0 }
const locationsToFlip = input
    .map(parse)
    .map((directions) => directions.reduce(step, center))

const blackTiles: BlackTiles = new Set()
for (const location of locationsToFlip) {
    const stringifiedLocation = stringifyCoordinate(location)
    if (blackTiles.has(stringifiedLocation)) {
        blackTiles.delete(stringifiedLocation)
    } else {
        blackTiles.add(stringifiedLocation)
    }
}

console.log('Black tile count on first day:', blackTiles.size)

const art = livingArtExhibit(blackTiles)
const blackTilesOnDay100 = getNthValueFromIterator(99, art)
if (blackTilesOnDay100 === undefined) {
    throw new Error('The living art exhibit died!')
}
console.log('Black tile count at day 100:', blackTilesOnDay100.size)
