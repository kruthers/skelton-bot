"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringIteratorToSting = exports.StringSetToSting = void 0;
/**
 * Convert a set of strings into a string (formatted)
 * @param set the input set
 */
function StringSetToSting(set) {
    let results = "";
    let i = 0;
    set.forEach(part => {
        i++;
        results += part;
        if (i < set.size) {
            results += ", ";
        }
    });
    return results;
}
exports.StringSetToSting = StringSetToSting;
/**
 * Convert a array of strings into a string (formatted)
 * @param array the input array
 */
function StringIteratorToSting(it) {
    let results = "";
    let result = it.next();
    while (!result.done) {
        results += `, ${result.value}`;
        result = it.next();
    }
    results = results.slice(2);
    return results;
}
exports.StringIteratorToSting = StringIteratorToSting;
