const validator = require('validator')
const moment = require('moment')
const success = 'success'
const locales = [ 'bg-BG', 'en-US' ]

/**
 * @typedef optionsString
 * @type { object }
 * @property { number } minSymbols - if field type is String - min symbols
 * @property { number } maxSymbols - if field type is String - max symbols
 * @property { boolean } canBeEmpty - if field type is String - can be empty string?
 * @property { boolean } allowSpaces - if field type is String - allow to have spaces?
 * @property { number } maxWords - if field type is String - max number of words
 * @property { string[] } blackList - if field type is String - symbols that are forbidden
 * @property { includeTypes } include - if field type is String - what type of characters it may contain
 * @property { string[] } enum - if field type is String - can only be from predefined values
 */

/**
 * @typedef optionsNumber
 * @type { object }
 * @property { number } min - if field type is Number - min value
 * @property { number } max - if field type is Number - max value
 */

/**
 * @typedef optionsArray
 * @type { object }
 * @property { number } minRecords - if field type is Array - min array length
 * @property { number } maxRecords - if field type is Array - max array length
 * @property { typeValues } arrayValuesType - if field type is Array - type of records
 * @property { optionsValues } arrayValuesOptions - if field type is Array - validate options for records
 */



/**
 * Validate String
 * @param {any} str 
 * @param {optionsString} options 
 * @returns 
 */
const validateString = (str, options) => {
  if (typeof str === 'undefined') return `Missing value!`
  if (typeof str !== 'string') return `'${str}' is not a 'string' type!`
  if (options?.canBeEmpty === false && !str.trim().length) return `can't be empty!`

  const errors = []
  str = str.trim()

  if (options?.allowSpaces === false && str.split('').some(x => ' ')) errors.push(`can't include spaces`)

  if ((options?.minSymbols || options?.maxSymbols) && !validator.isLength(str, options.minSymbols, options.maxSymbols)) {
    const result = []
    if (options.minSymbols) result.push(`must be min. ${options.minSymbols} characters`)
    if (options.maxSymbols) result.push(`must be max. ${options.maxSymbols} characters`)
    return result.join(' and ') + '!'
  }

  if (options?.include === 'lettersOnly') {
    const symbols = str.split('').filter(x => x !== ' ')
    let invalid = false

    symbols.forEach(symbol => {
      const check = locales.map(locale => validator.isAlpha(symbol, locale))
      if (check.every(x => x === false )) invalid = true
    })
    
    if (invalid) errors.push(`must include only letters!`)
  }

  if (options?.include === 'numbersOnly') {
    const validChars = [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' ]
    if (options?.allowSpaces === true) validChars.push(' ')
    const check = str.split('').some(x => !validChars.includes(x))
    if (check) errors.push(`must include only numbers!`)
  }

  if (options?.include === 'lettersAndNumbers') {
    const symbols = str.split('').filter(x => x !== ' ')
    let invalid = false

    symbols.forEach(symbol => {
      const check = locales.map(locale => validator.isAlphanumeric(symbol, locale))
      if (check.every(x => x === false )) invalid = true
    })
    
    if (invalid) errors.push(`must include only numbers and letters!`)
  }

  if (options?.blackList && options.blackList.map(x => str.includes(x)).some(el => el === true)) errors.push(`can't include symbols [ ${options.blackList} ]!`)

  if (options?.maxWords && str.split(' ').filter(x => x !== '').length > options.maxWords) errors.push(`must be max ${options.maxWords} words!`)

  if (options?.enum && Array.isArray(options.enum) && !options.enum.includes(str)) errors.push(`is invalid, must be ${options.enum.join(' or ')}!`)

  if (errors.length) return errors.join(' | ')
  return success
}


/**
 * Validate MongoDB ID
 * @param {any} str 
 * @returns 
 */
const isMongo = (str) => {
  const checkString = validateString(str, { canBeEmpty: false })
  if (checkString !== success) return checkString
  
  if (validator.isMongoId(str)) return success

  return `must be valid MongoDB Id!`
}


/**
 * Validate string is valid date
 * @param {any} str 
 * @returns 
 */
const isDate = (str) => {
  const checkString = validateString(str, { canBeEmpty: false })
  if (checkString !== success) return checkString

  if (moment(str).isValid()) return success
  return `must be valid Date!`
}


/**
 * Validate number
 * @param {any} str 
 * @param {optionsNumber} options 
 * @returns 
 */
const isNumber = (str, options) => {
  if (!str) return `Missing value!`
  if ((typeof str === 'string' && !str.trim()) || typeof str === 'object') return `is not valid number!`

  if (isNaN(str)) return 'is not valid number!'

  if (options) {
    const { min, max } = options
    if (min && max && min > max) throw new Error ('Wrong params! max must be greater from min!')
    
    str = Number(str)
  
    if (min && str < min) return `must be min ${min}!`
    if (max && str > max) return `must be max ${max}!`
  }

  return success
}


/**
 * Validate boolean
 * @param {any} str 
 * @returns 
 */
const isBoolean = (str) => typeof str === 'boolean' ? success : 'must be Boolean!'


/**
 * Validate email
 * @param {any} str 
 * @returns 
 */
const isEmail = (str) => {
  const checkString = validateString(str, { canBeEmpty: false })
  if (checkString !== success) return checkString

  if (!validator.isEmail(str)) return 'must be valid e-mail address!'
  return success
}


/**
 * Validate url address
 * @param {any} str 
 * @returns 
 */
const isURL = (str) => {
  const checkString = validateString(str, { canBeEmpty: false })
  if (checkString !== success) return checkString

  if (!validator.isURL(str, { require_protocol: true })) return 'must be valid URL address!'
  return success
}


/**
 * Validate array and records
 * @param { array } array 
 * @param { optionsArray } options 
 * @returns 
 */
const isArray = (array, options) => {
  if (!Array.isArray(array)) return 'must be Array!'

  if (options) {
    const { minRecords: min, maxRecords: max, arrayValuesType, arrayValuesOptions } = options
    if (min && max && min > max) throw new Error ('Wrong params! maxRecords must be greater from minRecords!')
  
    if (min && array.length < min) return `must have min ${min} records!`
    if (max && array.length > max) return `must have max ${max} records!`
    
    if (arrayValuesType) {
      const functions = {
        'String': validateString,
        'Number': isNumber,
        'Date': isDate,
        'Boolean': isBoolean,
        'Email': isEmail,
        'URL': isURL,
        'Mongo': isMongo,
        'Array': isArray,
      }

      const validateArray = array.map(x => {
        const result = functions[arrayValuesType](x, arrayValuesOptions)
        if (result === success) return result
        return `'${x}' ${result}`
      })

      const getErrors = validateArray.filter(x => x !== success)
      if (getErrors.length) return (`- error validate array records - ${getErrors.join(' | ')}`)
    }
  }

  return success
}

/**
 * Return body field value
 * @param {object} body 
 * @param {string} field 
 * @returns 
 */
const getBodyField = (body, field) => {
  if (typeof body !== 'object') return null
  if (typeof field !== 'string' || !field.trim().length) return null

  return field.split('.').reduce((acc, el) => acc ? acc[el] : null, body)
}


module.exports = {
  validateString,
  isMongo,
  isDate,
  isNumber,
  isBoolean,
  isEmail,
  isURL,
  isArray,
  getBodyField,
  success
}
