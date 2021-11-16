/**
 * Calculates a valid partitioning interval for the given intervals and returns them as an array X where X[n]=m means
 * that the interval with index n is in the partition set m. Because the input for this algorithm consists of very few
 * intervals, we omit the usage of a priority queue and implement this naively.
 *
 * Note that the intervals given are closed intervals, meaning that their ends are inclusive. For example, the two
 * intervals [2, 5] and [5, 7] are overlapping by this definition.
 */
export function partitionIntervals(intervals: [number, number][]): number[]
{
    // We greedily add intervals to sets and return them.
    //
    let sets: number[] = [];
    let maxSet = 0;

    for (let interval of intervals)
    {
        let foundSet = false;
        for (let set = 0; set < maxSet; set++)
        {
            let fits = true;
            for (let checkIndex = 0; checkIndex < intervals.length; checkIndex++)
            {
                if (sets[checkIndex] != set) continue;
                let checkInterval = intervals[checkIndex];
                if (interval[0] <= checkInterval[1] && interval[1] >= checkInterval[0])
                {
                    fits = false;
                    break;
                }
            }

            if (fits)
            {
                sets.push(set);
                foundSet = true;
                break;
            }
        }

        if (!foundSet)
        {
            sets.push(maxSet++);
        }
    }

    return sets;
}
