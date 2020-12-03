function findTwoExpensesWithSum(
    expenses: number[],
    sum: number,
): [number, number] | undefined {
    const processedExpenses = new Set<number>()
    for (let expense of expenses) {
        const target = sum - expense
        if (processedExpenses.has(target)) {
            return [expense, target]
        } else {
            processedExpenses.add(expense)
        }
    }
    return undefined
}

const expenseReport = [1721, 979, 366, 299, 675, 1456]

const expenses = findTwoExpensesWithSum(expenseReport, 2020)
if (expenses === undefined) {
    throw new Error("Couldn't find two expenses which sum to 2020")
}
console.log('Multiplied expenses:', expenses[0] * expenses[1])
