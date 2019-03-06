/* eslint no-plusplus: 0 */
/* eslint prefer-destructuring: 0 */
/* eslint no-self-compare: 0 */

/**
 * Checks two values for 'deep' equality.
 *
 * Adopted from [fast-deep-equal]{@link https://github.com/epoberezkin/fast-deep-equal/}
 * written by Evgeny Poberezkin
 *
 * @private
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
export default function isEqual(a, b) {
  if (a === b) return true;

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const arrA = Array.isArray(a);
    const arrB = Array.isArray(b);
    let i;
    let length;
    let key;

    if (arrA && arrB) {
      length = a.length;
      if (length !== b.length) return false;
      for (i = length; i-- !== 0;) if (!isEqual(a[i], b[i])) return false;
      return true;
    }

    if (arrA !== arrB) return false;

    const dateA = a instanceof Date;
    const dateB = b instanceof Date;
    if (dateA !== dateB) return false;
    if (dateA && dateB) return a.getTime() === b.getTime();

    const regexpA = a instanceof RegExp;
    const regexpB = b instanceof RegExp;
    if (regexpA !== regexpB) return false;
    if (regexpA && regexpB) return a.toString() === b.toString();

    const keys = Object.keys(a);
    length = keys.length;

    if (length !== Object.keys(b).length) return false;

    for (i = length; i-- !== 0;) if (!b.hasOwnProperty(keys[i])) return false;

    for (i = length; i-- !== 0;) {
      key = keys[i];
      if (!isEqual(a[key], b[key])) return false;
    }

    return true;
  }

  return a !== a && b !== b;
}
