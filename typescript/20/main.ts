type Pixel = boolean
type Tile = {
    id: number
    pixels: Pixel[][]
}
type ImageDimensions = { width: number; height: number }
type AssembledTiles = [Tile, Transformation][][]

function tabulateArray<T>(length: number, fillWith: (index: number) => T): T[] {
    const array = new Array<T>(length)
    for (let index = 0; index < array.length; index++) {
        array[index] = fillWith(index)
    }
    return array
}

function arraysAreIdentical<T>(
    array1: readonly T[],
    array2: readonly T[],
): boolean {
    return (
        array1.length === array2.length &&
        array1.every((element, index) => element === array2[index])
    )
}

function countElements(grid: readonly (readonly unknown[])[]): number {
    return grid.reduce((count, row) => count + row.length, 0)
}

function predicateHoldsForAllIndexes<T>(
    grid: readonly (readonly T[])[],
    indexes: readonly (readonly [number, number])[],
    predicate: (value: T) => boolean,
): boolean {
    return indexes.every(([rowIndex, columnIndex]) => {
        const value = grid[rowIndex]?.[columnIndex]
        return value !== undefined && predicate(value)
    })
}

function countOccurrences<T>(
    grid: readonly (readonly T[])[],
    indexes: readonly (readonly [number, number])[],
    predicate: (value: T) => boolean,
): number {
    const [regionHeight, regionWidth] = indexes.reduce(
        (size, [rowIndex, columnIndex]) => {
            const requiredHeight = rowIndex + 1
            const requiredWidth = columnIndex + 1
            return [
                requiredHeight > size[0] ? requiredHeight : size[0],
                requiredWidth > size[1] ? requiredWidth : size[1],
            ]
        },
        [0, 0],
    )
    let occurrences = 0
    for (
        let rowOffset = 0;
        rowOffset < grid.length - regionHeight;
        rowOffset++
    ) {
        for (
            let columnOffset = 0;
            columnOffset < grid[rowOffset].length - regionWidth;
            columnOffset++
        ) {
            const offsetIndexes = indexes.map(
                ([rowIndex, columnIndex]) =>
                    [rowIndex + rowOffset, columnIndex + columnOffset] as const,
            )
            if (predicateHoldsForAllIndexes(grid, offsetIndexes, predicate)) {
                occurrences++
            }
        }
    }
    return occurrences
}

// Every possible orientation of pixels is reachable by applying exactly one
// transformation. That is, composing multiple of these together will always
// give you a state that could have been reached via a single transformation.
// This makes it easy to exhaustively iterate transformations.
//
// All rotations are counter-clockwise.
const transformationNames = [
    'nothing',
    'flipHorizontal',
    'flipVertical',
    'rotate270',
    'rotate180',
    'rotate90',
    'rotate90FlipHorizontal',
    'rotate90FlipVertical',
] as const
const transformations = {
    nothing<T>(grid: T[][]): T[][] {
        return grid
    },
    flipHorizontal<T>(grid: T[][]): T[][] {
        return grid.map((row) => [...row].reverse())
    },
    flipVertical<T>(grid: T[][]): T[][] {
        return [...grid].reverse()
    },
    rotate90<T>(grid: T[][]): T[][] {
        return [
            ...grid[0].map((_, index) => grid.map((row) => row[index])),
        ].reverse()
    },
    rotate270<T>(grid: T[][]): T[][] {
        return transformations.rotate90(
            transformations.rotate90(transformations.rotate90(grid)),
        )
    },
    rotate180<T>(grid: T[][]): T[][] {
        return transformations.rotate90(transformations.rotate90(grid))
    },
    rotate90FlipHorizontal<T>(grid: T[][]): T[][] {
        return transformations.flipHorizontal(transformations.rotate90(grid))
    },
    rotate90FlipVertical<T>(grid: T[][]): T[][] {
        return transformations.flipVertical(transformations.rotate90(grid))
    },
}
type Transformation = keyof typeof transformations

function getTopEdge<T>(grid: T[][]): T[] {
    return grid[0]
}
function getRightEdge<T>(grid: T[][]): T[] {
    return grid.map((row) => row[row.length - 1])
}
function getBottomEdge<T>(grid: T[][]): T[] {
    return grid[grid.length - 1]
}
function getLeftEdge<T>(grid: T[][]): T[] {
    return grid.map((row) => row[0])
}
function withoutEdges<T>(grid: T[][]): T[][] {
    return grid.slice(1, -1).map((row) => row.slice(1, -1))
}

function nextEmptyTile(
    partialImage: AssembledTiles,
    finalImageSize: ImageDimensions,
): undefined | { rowIndex: number; columnIndex: number } {
    const nextTileLocation = { rowIndex: 0, columnIndex: 0 }
    while (
        nextTileLocation.columnIndex < finalImageSize.width &&
        nextTileLocation.rowIndex < finalImageSize.height
    ) {
        const nextTile =
            partialImage[nextTileLocation.rowIndex]?.[
                nextTileLocation.columnIndex
            ]
        if (nextTile === undefined) {
            return nextTileLocation
        } else {
            if (nextTileLocation.columnIndex + 1 >= finalImageSize.width) {
                nextTileLocation.columnIndex = 0
                nextTileLocation.rowIndex += 1
            } else {
                nextTileLocation.columnIndex += 1
            }
        }
    }

    // The image is already complete!
    return undefined
}

/**
 * Determines if/how `nextTile` can be slotted into the next available space in
 * `imageSoFar` by applying any transformations to it.
 *
 * Assumes the image is being built up left-to-right, top-to-bottom.
 *
 * Returns an array of new Images with `nextTile` added (one for each different
 * Transformation that can make it fit). If the return value is empty it means
 * there's no way to make `nextTile` fit.
 */
function placeNextTile(
    imageSoFar: AssembledTiles,
    finalImageSize: { height: number; width: number },
    nextTile: Tile,
): readonly AssembledTiles[] {
    const nextTileLocation = nextEmptyTile(imageSoFar, finalImageSize)
    if (nextTileLocation === undefined) {
        // The image is already complete!
        return [imageSoFar]
    }

    // I don't want to enable noUncheckedIndexedAccess for the whole project,
    // but do want those semantics here.
    type OptionalImageElement = [Tile, Transformation] | undefined
    const left = imageSoFar[nextTileLocation.rowIndex]?.[
        nextTileLocation.columnIndex - 1
    ] as OptionalImageElement
    const leftEdge =
        left && getRightEdge(transformations[left[1]](left[0].pixels))

    const above = imageSoFar[nextTileLocation.rowIndex - 1]?.[
        nextTileLocation.columnIndex
    ] as OptionalImageElement
    const topEdge =
        above && getBottomEdge(transformations[above[1]](above[0].pixels))

    const transformationsWhichMakeNextTileFit = transformationNames.filter(
        (transformationName) => {
            const transformation = transformations[transformationName]
            return tileFits(transformation(nextTile.pixels), topEdge, leftEdge)
        },
    )

    return transformationsWhichMakeNextTileFit.map((transformationName) => {
        // Copy things to avoid mutating imageSoFar.
        const newRow = [...imageSoFar[nextTileLocation.rowIndex]]
        newRow[nextTileLocation.columnIndex] = [nextTile, transformationName]
        const newImage = [...imageSoFar]
        newImage[nextTileLocation.rowIndex] = newRow
        return newImage
    })
}

function tileFits(
    pixels: Pixel[][],
    topEdge?: readonly Pixel[],
    leftEdge?: readonly Pixel[],
): boolean {
    return (
        (topEdge === undefined ||
            arraysAreIdentical(topEdge, getTopEdge(pixels))) &&
        (leftEdge === undefined ||
            arraysAreIdentical(leftEdge, getLeftEdge(pixels)))
    )
}

/**
 * Attempts to build a complete image using all given tiles.
 *
 * Note that this just returns the first valid image found, even though any
 * given set of tiles will either have zero or many valid arrangements (because
 * any valid complete image can be flipped/rotated and still be valid).
 */
const allAttempts = new Map<string, AssembledTiles>()
function buildSquareImage(
    remainingTiles: readonly Tile[],
    state?: {
        imageSoFar: AssembledTiles
        finalImageSize: { height: number; width: number }
    },
): AssembledTiles | undefined {
    if (state === undefined) {
        const imageEdgeLength = Math.sqrt(remainingTiles.length)
        state = {
            finalImageSize: { height: imageEdgeLength, width: imageEdgeLength },
            imageSoFar: tabulateArray(imageEdgeLength, () => []),
        }
    }

    for (let tileIndex = 0; tileIndex < remainingTiles.length; tileIndex++) {
        const nextTile = remainingTiles[tileIndex]
        const newImages = placeNextTile(
            state.imageSoFar,
            state.finalImageSize,
            nextTile,
        )
        for (const newImage of newImages) {
            if (
                countElements(newImage) >=
                state.finalImageSize.width * state.finalImageSize.height
            ) {
                return newImage
            } else {
                const completeImage = buildSquareImage(
                    remainingTiles.filter((tile) => tile.id !== nextTile.id),
                    {
                        finalImageSize: state.finalImageSize,
                        imageSoFar: newImage,
                    },
                )
                if (completeImage !== undefined) {
                    // All done!
                    return completeImage
                }
            }
        }
    }

    const imageFingerprint = state.imageSoFar
        .map((row) =>
            row
                .map(([tile, transformation]) => {
                    return `[${tile.id},${transformation}]`
                })
                .join(''),
        )
        .join('')
    if (imageFingerprint.length > 0) {
        allAttempts.set(
            imageFingerprint,
            JSON.parse(JSON.stringify(state.imageSoFar)),
        )
    }

    // If we made it here there is no possible arrangement of tiles that fit.
    return undefined
}

function createActualImage(tiles: AssembledTiles): Pixel[][] {
    return tiles.flatMap((tileRow) => {
        return tileRow
            .map(([tile, transformation]) =>
                transformations[transformation](withoutEdges(tile.pixels)),
            )
            .reduce<boolean[][]>((rowsOfPixels, tileInterior) => {
                for (const interiorPixelRowIndex in tileInterior) {
                    if (rowsOfPixels[interiorPixelRowIndex] === undefined) {
                        rowsOfPixels[interiorPixelRowIndex] = []
                    }
                    rowsOfPixels[interiorPixelRowIndex].push(
                        ...tileInterior[interiorPixelRowIndex],
                    )
                }
                return rowsOfPixels
            }, [])
    })
}

function parsePixelGrid(pixels: string): boolean[][] {
    return pixels
        .split('\n')
        .filter((pixels) => pixels.length !== 0) // ignore empty lines
        .map((row) => row.split('').map((character) => character === '#'))
}

const tileRepresentations = {
    3253: `
###....#..
.#..##....
##.#.#.#.#
#.#.......
#....#...#
#.##...#..
....#.....
##.##.#..#
.###...##.
##.#...##.`,

    2843: `
...#.#.#..
##.....#.#
..#...#...
#.##.##...
#......###
#..#.#.###
........##
#.....##..
........#.
..##..###.`,

    2557: `
..##..#.#.
#.#......#
...#......
..........
.#....#..#
...#....##
####.....#
.##.##..#.
#..#......
#.#.##.#..`,

    2543: `
...#.#####
...#.....#
#..#.#....
.......#..
......#..#
#......#..
.#...#...#
##.#.#..##
#.#..#.#..
.#..####.#`,

    3319: `
#####..###
.#.#......
#.....#...
.....#...#
.#.#.....#
.....#...#
.##......#
##....#..#
##.#...#.#
.#....#..#`,

    1607: `
.##..#####
#....#..#.
.#..#.....
....#.....
...#.#..##
#..###...#
..#.#.....
..##.##.##
#...#..#.#
###..#.##.`,

    3329: `
#.#######.
#.#...###.
###......#
..........
#..#.#...#
#...##...#
#...##...#
##.#..#.#.
#..##.#...
......#.#.`,

    2663: `
#.#..##.#.
...#.....#
###..#....
..#.....#.
...#....##
.#.....#.#
..........
#..#......
####...#.#
###..#.#.#`,

    1619: `
####.#...#
.#....#..#
.......#.#
#.#....#..
#...#.#...
##........
##....#.#.
.#..###...
#..#...###
###.#.....`,

    3779: `
...#..#..#
.....#..#.
.#.....###
......#.#.
#....#...#
##.#.#..#.
...#......
#.........
..........
##.##.#...`,

    3821: `
.###.#...#
##.......#
..#..#.#..
.....#...#
...###..##
.#......#.
..#...#.#.
#...#....#
#.#..#...#
...###.##.`,

    2749: `
#.##.#..##
...#.##.#.
.....#...#
.......##.
..........
#.###.....
#...##...#
....#..###
#.#.##...#
#..#.#...#`,

    1153: `
##....####
..#..#...#
#..#..#...
.#.#...#..
#...##.##.
.....#....
..#..#..##
##....##..
#....#....
###..###..`,

    3181: `
#.#.##..#.
#...##....
....#.##.#
...#......
###.##....
.##.......
........##
....#..#.#
..##..#..#
#.##....#.`,

    3491: `
.#.....##.
..##..#...
.##...#...
##.....#..
##.....#..
..#...#.#.
#......#.#
#.......#.
#.##..##.#
..#...##..`,

    1129: `
#.##.#.#..
#.#..#.#.#
##........
##.....#.#
.#.......#
#........#
..###....#
.#......#.
.#....#..#
.#.#.#.###`,

    3967: `
##.#.#####
#....#...#
#####...#.
#.#....##.
.#...##.#.
#..#..#...
#..#......
.....#.#.#
........##
#....##..#`,

    2131: `
###.....#.
#..#.##...
#..#.##..#
##.....#..
..#.###.##
#........#
##........
...#.#....
##.....##.
.#....###.`,

    1657: `
###.#.#...
#..#.#...#
..........
..#....##.
.#...#....
##.#..##.#
#..#..##..
......#..#
.....#...#
#####.#.##`,

    2521: `
.##..###..
#.......##
.##......#
#...#.....
###...#..#
.......#.#
#.#..####.
#..#......
#.....#...
#.####....`,

    1879: `
...#####..
#...#.#...
....##.###
.......#..
#.....###.
##......#.
##....##..
#.....#..#
...#.#.#.#
.###.###..`,

    2999: `
.####.#..#
...#.....#
.......##.
#..#....#.
.....#.##.
#.....#..#
....#....#
#........#
...#.####.
.......##.`,

    1091: `
#####.####
##.#...##.
..#......#
....#.#...
#...###.##
#..#.#...#
........##
#.....##.#
##..#.##..
...##.#..#`,

    3673: `
..##.#..##
#....#..##
#.#.#....#
...#.....#
...#......
..#....#..
.#.....#..
..........
#.#.##.#.#
###.##..##`,

    3727: `
..#.#..#.#
##...##...
##........
..#..#.#.#
..##.#....
####.....#
....#....#
#..#.....#
#.#.......
.##.#..#.#`,

    3089: `
#.#.##..#.
.....#...#
##........
.#.#.###.#
.#....#..#
.....##...
.....##..#
..#.......
#.......#.
#...##.#.#`,

    2819: `
....##.#.#
#...#.#..#
......#..#
.#.#.#####
...##..#.#
........##
##..###...
.#.......#
..##...#..
..#.#.#.##`,

    3023: `
..#######.
....##..#.
..#.##....
##...##..#
#.##......
....#.....
##....#..#
.#...##..#
#.#..#....
#.##.###.#`,

    2789: `
###.##....
.##.....#.
.......#.#
....#.....
#..#.#....
.#........
#.........
..#.#....#
#........#
####..#...`,

    3583: `
..#####...
#....#..##
.#.#..#.#.
#..#.#....
#.#..###..
#.#.#.#...
#..#...#.#
#.......#.
#....#..##
....###...`,

    1997: `
..#.###..#
#...##....
###.###..#
####.##..#
####..##.#
##.#..##.#
#..#..###.
#.#.......
.#......##
#..#.#..#.`,

    3691: `
.#...#####
..##.##..#
##.#.#...#
#........#
#.#......#
...#......
#.#......#
..#...#.##
#.####...#
##..#.#...`,

    1303: `
#...#.#...
..#.......
........#.
#...###..#
#....#..#.
..........
#.........
#.##..##.#
#.#.....##
.....##...`,

    2287: `
.#.#.####.
......#...
#.###.....
##..#...#.
#..###...#
##.......#
.....#...#
#.#.....##
..###..#..
..###...#.`,

    1733: `
#######...
##..#....#
.....#....
#.##..##..
#...##.###
#.........
###......#
#.#.#.##.#
...#...#.#
##..#..##.`,

    1097: `
#.###..#..
#....#.#..
...###...#
.##.#.##..
#.#...#..#
...#...#.#
......##..
..#..#....
.....###.#
##....#.#.`,

    1637: `
..###.#...
##........
#..#......
###.##...#
##...##..#
#.........
#.........
#..#..##..
.......#..
.#..##.#..`,

    3931: `
.##.#.#.#.
##........
#...#...##
.##.....##
###....#.#
..##..##.#
#..#.#..##
#.##......
..#.......
...#....##`,

    3463: `
...#.##.#.
.#...#..#.
##....#...
#...#.###.
#.....#.##
#....###..
..####.#..
......##..
.###......
.##..#...#`,

    2377: `
.#.##.##.#
#....#.#.#
.........#
...#...#.#
#.#.......
#......#..
....#...#.
.....##..#
#.##..#..#
##..##.###`,

    1249: `
.##..#####
#........#
.#..#.#...
..#..#..##
##.####.#.
...##.#..#
#..##.....
.......##.
#...#....#
..#.#..#.#`,

    3257: `
#####..###
..........
.#....#..#
#...###...
.#......#.
#..#.#..##
#.....#.##
#..#.....#
.....#....
..#####.##`,

    1693: `
...####.#.
....#..#.#
...#....#.
...#.#.#.#
#....#....
..........
####....##
....##..##
..#...#.##
#.#####.##`,

    3671: `
###..#...#
.......#.#
.......#.#
##......#.
..#.....#.
.##....#.#
.##....#.#
#...#.####
....#..##.
.##...##.#`,

    2531: `
#...#.##..
...#.....#
##........
#.#......#
.#.####...
##........
.#..#.....
#....###.#
#.....#...
....###.#.`,

    1553: `
##.#....#.
.##.#..#..
#...#.##..
.#.#.#..#.
.........#
#....#....
..........
#.#...#..#
##....#...
.###.##...`,

    1847: `
.#.##..##.
......#...
.#.#..#...
...##....#
#.........
.#........
#...#.##.#
#...#..#.#
####.#....
####....#.`,

    1423: `
..###..##.
#.#.#.....
....##...#
#.#.##.###
.#....##.#
#......#.#
.....#...#
#..#.#.#..
##.....###
.....####.`,

    3533: `
##.##.#...
........##
..##..#..#
.#....#..#
..........
#.#......#
...#....#.
....#..#.#
....#..##.
##.#...###`,

    1033: `
##.##.#.#.
#.....####
..#....#.#
###....#.#
#....##.#.
#...#...##
#..#.#....
...#..#..#
##.#..##..
..#.....##`,

    3413: `
#.#.#.#.##
#....#....
...#......
.#..#.#.#.
#...#.....
......#..#
...#.#....
..#.#..#..
##..#.###.
.#####.##.`,

    1123: `
.#....####
#....##...
....#.....
...#..#.##
#....#..##
.##.#...#.
#.#.#.#...
#.#...#..#
##.#.....#
#.##.##.#.`,

    2551: `
###..##.#.
.#..#.##.#
.##.##.#..
.#...#..##
##.......#
.....#....
..#.##...#
.........#
.#.#.#..#.
.#.#.####.`,

    3677: `
.#.#.#.###
.#.#.#..##
#........#
..#.......
#.##.....#
......#..#
##........
#...##....
..##......
.####..###`,

    3659: `
#.#.#.#.##
...##.#...
...#.#.#.#
#..#..#...
###...#...
#.##.#..##
.##...#...
.###......
.#..##....
###.##.#.#`,

    1103: `
####..##.#
##.#.#....
#..#.#....
#...#.#...
##......##
..####.#..
..#..##.#.
.#.#.##...
..##.#.##.
#.#.######`,

    1361: `
#.....####
....##..#.
#...#.....
.........#
#.....#.#.
.....##..#
....####.#
...#....#.
#.....#...
#..##...#.`,

    3527: `
..###.##.#
##.......#
.#.....#.#
#..#.#.#..
#...#.....
#....#....
..#....#.#
.........#
....#....#
.#..######`,

    1823: `
.#####..##
#..#.##...
..##.#...#
#...#....#
....#....#
..#.#.#.##
..#.#....#
#.#....##.
...#.##.##
..#.#..##.`,

    1559: `
#....###.#
.###.#.#.#
#.#.......
#....##.##
#....#.#.#
#.#......#
.#...###..
##...#.##.
.##.#.####
.##..##...`,

    2161: `
#..#.####.
.......#.#
#........#
....#...##
#.#.#...#.
#..###...#
#.........
.#.....#.#
..##.#...#
.#.###.###`,

    2633: `
.#...#.###
..#.#....#
#.......##
#....#....
#.#....#.#
#.##....#.
...###..##
#...#...##
####...#..
.#..###.#.`,

    2593: `
##..#..#.#
#.....###.
#.#.......
##....#.#.
#...##.#.#
#.#..#..##
###...##..
..#......#
#.#.##....
#.#####..#`,

    2917: `
#####.....
#....#...#
..##...#.#
##.#.....#
....##.#.#
#.....#...
.....#.#.#
##...#.##.
..........
......###.`,

    3881: `
..#.....#.
......##..
#....#....
...#.###.#
##....#..#
#....#.#..
#....##...
#.....#...
.....#..##
##....#.##`,

    1193: `
#.###.#.#.
.#.##.###.
.######..#
##.##..#.#
#.....#.#.
..#.##.##.
.#.......#
..#......#
..........
.#.#####.#`,

    2467: `
#..#.#.###
#..#...#.#
...#####.#
#........#
#.#.....#.
.#..#...##
...#..##.#
..#..#...#
#..#......
..###...#.`,

    2273: `
##..####.#
..##.#.##.
..##....##
#.#......#
..#...#...
#.........
#.##....##
.#.#..#..#
#..##.....
#.##....#.`,

    3191: `
###...#.##
.......#..
#.#.#.#...
......#..#
...##...##
....#.##..
##.#..#.##
.......#..
#.....#.#.
...###....`,

    2423: `
..#..##.#.
#.......##
.#....#.##
#.#..##...
###.#####.
#.....#.#.
..##..##..
#.#......#
##........
#..#.#####`,

    2719: `
########..
#.#.#.#.#.
#....#..#.
........#.
.#..##.#..
.....##..#
..##...#.#
##.#......
#........#
..#...#..#`,

    3467: `
..#.#...#.
#....#..##
...#.#..##
.#...##..#
#.#.##...#
.........#
#..#..#..#
#....#..#.
#...##..#.
######..#.`,

    3461: `
#..##.#...
.#...##..#
#..#..#..#
#####.....
...#.###..
....###.#.
##.##.....
#.........
#.###.#...
##...##..#`,

    1109: `
.#.#.#....
...#..###.
......#...
#.........
#.#.......
#.#.#.####
.##..#.#.#
#......#..
#......###
#.###.....`,

    2953: `
##.##.##..
#....#...#
##..##...#
#..#.....#
........#.
#.....###.
##...#####
#.....#...
..#.#..###
...#.##.#.`,

    2081: `
##.#.##..#
#....#..##
###......#
##.......#
.#.#.#....
#.#.#....#
...#..#..#
....##....
..#..#..#.
#.####....`,

    2141: `
###..#.###
#.#..#..##
####....#.
.....#..##
......#.#.
..#.##...#
...##.##..
....#....#
......#..#
..#.####..`,

    1523: `
.#.##...#.
#..#..##..
#.#.......
......#.##
#.#.##.##.
#..##..#..
#.###.....
..##.##...
..#.....#.
.#####.###`,

    2411: `
##.###.###
#.#......#
...##....#
....##....
..#......#
.#.#..#...
##..#...#.
.....#.##.
#.......#.
#...#####.`,

    1627: `
..####.#.#
....#..#..
.##......#
.#..#...#.
##.......#
#.#.......
#.##......
.....#.#.#
#.#......#
####..#...`,

    1489: `
#....#.##.
.......#.#
##.....###
#.#...##.#
...#.....#
######...#
..#...####
...#...#..
.#.#.#.#..
#.##.#.##.`,

    2371: `
#.#.##.##.
...#......
.##.#.....
#.........
#....#...#
.##..#..#.
##.##.###.
.###...#.#
..#.....#.
#...#.###.`,

    2221: `
#..#.#.###
#.##..#.#.
.#.###..#.
#.#..#....
##.#...###
..#.##.#.#
..##.###..
..##.##.#.
....#..#..
#..###.#..`,

    2861: `
#.##.#.###
##..#.#...
#...#....#
##......##
#...#.##..
..##..#..#
.......#..
......#...
#..##..#..
.#..#...#.`,

    2707: `
.##.....##
#...###...
##..####.#
####....##
.#.#......
.##.#....#
.##.....##
##.#.....#
#.#.......
.##..#.#..`,

    2083: `
##...##...
..........
.........#
...#.....#
.....#.#..
...#..#...
#........#
.#.##..#.#
....###..#
##.#......`,

    2621: `
.#..#.#.##
##....##..
...#..#...
##.#.###.#
##.#..#.##
..#.....##
#.##..####
.##.##....
.......#.#
###...#..#`,

    1993: `
#...##.##.
..#.....##
.#........
......#..#
#.##....##
#.#.##...#
...#..#..#
#.#....#.#
.......#..
.###....#.`,

    1439: `
..##......
..#......#
..##..#..#
#...##.#.#
.....#...#
..#...#..#
##.#.####.
#....#....
..#...#..#
..#.#...#.`,

    3863: `
.#..###.##
.........#
##.##...#.
#...#..###
#...#....#
#.....#..#
#.....#..#
.#.##.#..#
##.....###
###..###.#`,

    3203: `
#......##.
##.....#.#
....##...#
....#...##
........##
..#......#
...##....#
#...##.#..
###...#..#
###.##....`,

    2677: `
..#.......
.#..#.....
.#..#..#.#
#.##....##
#...#...#.
#.......##
.#.....###
#.........
........##
....##...#`,

    1069: `
..##..#.#.
###.......
#.#....#..
.#....#.#.
##.....#..
#...#.....
.......#..
#........#
.........#
#..#...##.`,

    1171: `
..##.##.#.
#..#......
#...#....#
....##...#
.##......#
#......#.#
..###...#.
.####.####
.....#.#..
#.#..#...#`,

    1049: `
#.##.##..#
##.#..##..
..#...#...
..#.#.....
#.#......#
.....#.##.
#.#.######
...#.#....
#.....#..#
#...##.#..`,

    2683: `
#..#......
.#.#..####
#.#......#
#.#.......
##.....#.#
#....##...
.#.#.....#
##.......#
#...#.##..
.#####....`,

    1213: `
#.##..###.
...###.#.#
.#....#.##
#.....#...
...##.....
#.#.####.#
#.####..##
###.#.##..
#.#..#.##.
#..#.###..`,

    1597: `
#......###
#.#.##..##
...#####.#
######.#.#
...#.##.#.
........#.
....#....#
##......#.
.###..##.#
##..##...#`,

    2909: `
#.##......
#......##.
...#..#...
###.#..#..
#..#..#...
#....#...#
#......#..
.#........
.#.......#
.####.#...`,

    1429: `
####.#####
.........#
##.#...#.#
#..#..#...
..#...#.##
#..#......
##..#.....
..####...#
#..#..#...
#...#.##..`,

    3877: `
.#..#.#.#.
#..#......
###.##.##.
#.###.....
#.......##
##.#....##
...#......
#...##....
#.##...###
.#.#..###.`,

    1019: `
####.....#
#.#..#..##
#.....#...
.#......##
.........#
......#..#
...#.#.##.
#....#...#
......#..#
.###.#..#.`,

    3637: `
#.....#...
.#..##...#
.###..#...
#.#.#.....
..#....#..
#..#..#...
.#.......#
...#..##.#
#.#....#..
.#.#...##.`,

    3301: `
##.##...#.
.#.#.#....
........#.
#.#..#..#.
.#...###..
#....#.#..
..##......
....#....#
.#...#.###
##.##..###`,

    2459: `
######..##
...#..####
....##...#
...#.#.#..
....#..##.
...#..#...
#...##....
.......#..
#.#.......
#..###.###`,

    1741: `
#..#......
..#.......
.....#..#.
....#.#...
#...##....
#.#......#
##.......#
..#..#...#
.#..#...##
###..#.##.`,

    3019: `
###.#.###.
.##...#.##
#.....##..
#.....#..#
.#.#.#...#
.........#
#..##..##.
##...#...#
#...#.#...
..#.....#.`,

    1789: `
#...#.#.#.
.##..#.#..
...##.#.#.
#...#.#...
..#..#...#
..###....#
...#.#....
.#..#.#..#
.....#....
#...#####.`,

    2207: `
..####.##.
#.......##
.##..#....
..#.#.#..#
#....#####
.....#...#
#####.##..
.##...#..#
.#.#.#....
...####.##`,

    1783: `
..#.......
......#..#
#..#...#..
#.........
.........#
.#.......#
.##....##.
##.##.#...
.#.#....#.
.##.#..##.`,

    1609: `
#.##.#.###
...#...#..
#.#......#
#....#...#
.....#....
..........
...#.....#
###.......
#...#.#..#
#..#.#....`,

    3011: `
##.....#..
..#....#..
#..##.#...
......#...
.#.#.#.#.#
...#.##..#
#.#...#.##
.##.####.#
#.#...####
..##..####`,

    3517: `
#.####.##.
#....##..#
#.##..#..#
.....#...#
#..#......
#....#...#
.........#
#....#.###
......###.
#.#.#..##.`,

    2969: `
#....###.#
##..#...#.
.##..#...#
#.#....###
##.......#
#.#....#.#
.#.#...#.#
#....#.#..
##..#.....
#..#...###`,

    1487: `
#.......#.
......##..
......##..
###..#....
#..#......
#.#......#
##..##..##
#.##.....#
#.........
##.##.#.##`,

    1201: `
..#.#.##.#
..#.....#.
...#......
.....#.#.#
##....#.##
#....#.##.
###....##.
###....#.#
#....#.#.#
#.#..##.#.`,

    3371: `
.#.#...##.
#..#.#..#.
##.#..#..#
.......#..
#........#
.#..#.#...
..........
##........
.#........
...##..#.#`,

    1367: `
#..##.###.
..........
#......###
..#..#..#.
#.####....
...##...##
#.#......#
#.#.#.#..#
..##.####.
##.....#.#`,

    2699: `
##...#...#
#.#.#....#
.#..#..#.#
....###...
#.##.##.##
#..#......
##........
#..#...#.#
..........
##..#####.`,

    3761: `
##.##.#..#
#.#.....#.
..#.##...#
.........#
..#..#.###
.##..#...#
###.##..##
.#....#..#
#...##...#
...##.#.##`,

    1697: `
#...#.##.#
#..#.....#
...###....
#..#..#.#.
#........#
.....#....
#...####.#
##.#......
.#........
##.#...##.`,

    3221: `
#.##...##.
###.#...#.
.#..##.#..
.##.......
#.........
..........
.#####....
##.##.....
.....#..#.
#.##.#.#.#`,

    1181: `
..#.###.##
#.#.##.#.#
...#...#..
#....#.#.#
#..#.##..#
.####..#..
..........
.#.....#..
.......##.
.....#....`,

    2617: `
#..##.....
#.#..#..##
##.##....#
#.........
.....#....
#.#..#.##.
##.#.....#
..#..#.#.#
..#....#.#
..#..####.`,

    3739: `
##.#.#..#.
#.#....#..
.#..#..#.#
##...#.##.
.##.......
#.###.#.#.
#....#..##
..###..#.#
.#....##.#
#.###.#.#.`,

    1867: `
######.#..
...##....#
##.....##.
##.#..#.#.
#..#.#..#.
..#......#
#..#..##..
##...#..#.
.#.#.#.#.#
.##.###.#.`,

    2777: `
..#.##.#.#
..#..#....
...#....##
....####.#
.##.#..###
....##.##.
##....#..#
.....#....
#.....##..
#..##.##.#`,

    2039: `
....#####.
..#..##...
##......##
#..#...#.#
#.#....#.#
..#.....##
...#.#....
#..##.....
#..####.##
#.##.#..#.`,

    3229: `
##...####.
..#.#.#..#
#....#.#..
#.#..##..#
##..#.#...
...##....#
#...##.#.#
#..#.##...
..##...#..
......##..`,

    1447: `
#.###.##.#
#..#..#..#
.....###.#
.......#.#
#..#...##.
#..##..#..
##.##.#...
.###..#.##
.......#..
#..##...#.`,

    1601: `
########.#
##......##
###.##....
#####.....
..........
.........#
..#.#...#.
#...#.....
.###...#..
.##.##..##`,

    2897: `
##.#..#..#
##.......#
.##...#..#
###.#....#
##........
#..#.###..
.#..#.#..#
.#.##..#..
.##......#
.#.##..###`,

    2549: `
.#..#####.
##.......#
#....#...#
.##.###...
##.#.##..#
..#...#..#
...##...##
..#.....#.
.##.....##
##.#.###..`,

    1667: `
###...##.#
#....#...#
.##.#..#.#
.......###
#.......##
..#....#..
.........#
###...#..#
#.#.##.#.#
..#.#..#..`,

    1327: `
###....#.#
..#.#..#.#
##..#..#.#
#..#.##..#
.....#....
##..##.#..
..#......#
.#.#.....#
#.##.###..
.#....#.#.`,

    3137: `
....##.##.
..#.......
#.#.##...#
.#.......#
.##......#
##.#.....#
##.#.....#
###.#.#.#.
#.....#...
..##.#..##`,

    1759: `
#.....#.##
.#...#.#..
..#...#..#
#..#..#..#
#....##..#
..##....#.
#......###
#....#.#.#
#...###..#
###.#.##..`,

    1747: `
#..##....#
.....#...#
..#..#.#.#
.##......#
#.#......#
..#......#
##........
....#.....
#.#......#
##.#..#..#`,

    1373: `
.##....###
....#....#
.........#
.##....#.#
..........
..#.#....#
.##.....#.
.........#
.....#.#.#
#...#.#...`,

    3313: `
...##.#.#.
##..#.....
#...##...#
.#..#.....
...#..##..
#...#.####
#........#
......##.#
###..#..#.
..#.#.##..`,

    2441: `
..#.###.##
#.#..#.###
.##.#.##.#
....#.....
.#.....##.
....##.#.#
..........
..#....##.
.#..####..
#.#..###.#`,

    3299: `
#....#####
##....####
#........#
#..#......
#........#
.###.##...
.##.##.###
..#..#.#..
..###..#..
...#.#..#.`,

    1061: `
.....#...#
#..#...#..
#......##.
.##.....#.
###.....##
.........#
#...#.....
.#..##....
#..#.#..##
###.#....#`,

    3833: `
#.#.###.##
..........
.........#
....#.....
#...#....#
#....#.#..
.....##...
#.........
#.##...#..
##.##.#.#.`,
}

const tiles = Object.entries(tileRepresentations).map(
    ([id, representation]) => {
        return {
            id: Number(id),
            pixels: parsePixelGrid(representation),
        }
    },
)

const image = buildSquareImage(tiles)
if (image === undefined) {
    throw new Error('Could not assemble an image from the tiles')
}
const imageSize = countElements(image)
const cornerIndex = Math.sqrt(imageSize) - 1
const corners = [
    image[0][0],
    image[0][cornerIndex],
    image[cornerIndex][0],
    image[cornerIndex][cornerIndex],
]

console.log(
    'Product of corner IDs:',
    corners.reduce((product, [tile, _b]) => tile.id * product, 1),
)

const monsterIndexes = `
                  # 
#    ##    ##    ###
 #  #  #  #  #  #   `
    .slice(1)
    .split('\n')
    .flatMap((row, rowIndex) => {
        return Array.from(row.matchAll(/#/g))
            .map((match) => match.index)
            .filter((index): index is number => index !== undefined)
            .map((columnIndex) => [rowIndex, columnIndex] as const)
    })

const countMonsters = (pixels: Pixel[][]) => {
    return countOccurrences(pixels, monsterIndexes, (pixel) => pixel === true)
}

const actualImage = createActualImage(image)
const counts = transformationNames.map((transformationName) => {
    return countMonsters(transformations[transformationName](actualImage))
})
const seaMonsterCount = counts.sort((a, b) => a - b)[counts.length - 1]
const waveCount = actualImage.reduce((count, row) => {
    return count + row.filter((x) => x).length
}, 0)
const seaMonsterSize = monsterIndexes.length

console.log('Sea monster count:', seaMonsterCount)
console.log('Water roughness:', waveCount - seaMonsterSize * seaMonsterCount)
