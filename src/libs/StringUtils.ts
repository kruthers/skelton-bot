
/**
 * Convert a set of strings into a string (formatted)
 * @param set the input set
 */
export function StringSetToSting(set: Set<string>): string {
  let results = ""
  let i = 0
  set.forEach(part => {
    i++
    results += part
    if (i < set.size) {
      results += ", "
    }
  })
  return results
}


/**
 * Convert a array of strings into a string (formatted)
 * @param array the input array
 */
export function StringIteratorToSting(it: IterableIterator<string>): string {
  let results = ""
  let result = it.next()
  while (!result.done) {
    results += `, ${result.value}`
    result = it.next()
  }
  results = results.slice(2)
  return results
}
