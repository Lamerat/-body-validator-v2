const common = require('./common')
const validTypes = ['String', 'Number', 'Date', 'Boolean', 'Email', 'URL', 'Mongo', 'Array']

/** @typedef { 'String' | 'Number' | 'Date' | 'Boolean' | 'Email' | 'URL' | 'Mongo' | 'Array' } typeValues */

/** @typedef { 'lettersOnly' | 'numbersOnly' | 'lettersAndNumbers' } includeTypes  */

/**
 * @typedef optionsValues
 * @type { object }
 * @property { number } min - if field type is Number - min value
 * @property { number } max - if field type is Number - max value
 * @property { number } minRecords - if field type is Array - min array length
 * @property { number } maxRecords - if field type is Array - max array length
 * @property { number } minSymbols - if field type is String - min symbols
 * @property { number } maxSymbols - if field type is String - max symbols
 * @property { boolean } canBeEmpty - if field type is String - can be empty string?
 * @property { boolean } allowSpaces - if field type is String - allow to have spaces?
 * @property { number } maxWords - if field type is String - max number of words
 * @property { string[] } blackList - if field type is String - symbols that are forbidden
 * @property { includeTypes } include - if field type is String - what type of characters it may contain
 * @property { string[] } enum - if field type is String - can only be from predefined values
 * @property { typeValues } arrayValuesType - if field type is Array - type of records
 * @property { optionsValues } arrayValuesOptions - if field type is Array - validate options for records
 */

/**
 * @typedef fieldType
 * @type { object }
 * @property { string } name - field name in body
 * @property { typeValues } type - field type
 * @property { optionsValues } [options] - field validate options
 * @property { boolean } [required] - field is required?
 * @property { Validator } [validator] - if type is 'Array' validator for him?
 */

/**
 * @typedef returnObject
 * @type { object }
 * @property { boolean } success
 * @property { string | null } errors
 */



class Validator {
  #fields = {}

  /**
   * Add new field for validate
   * @param {fieldType} field Field for validate
   * @example test.addField({ name: 'myField', type: 'String', options: { maxWords: 3, include: 'lettersOnly' }, required: false })
   */
  addField(field) {
    if (typeof field !== 'object') throw new Error(`Invalid 'field'! Must be object`)
    const fieldFields = Object.keys(field)
    if (!fieldFields.includes('name')) throw new Error(`Missing field 'name'`)
    if (!fieldFields.includes('type')) throw new Error(`Missing field 'type'`)

    const { name, type, options = {}, required = false, validator } = field

    if (this.#fields.hasOwnProperty(name)) throw new Error(`Already have field with name '${name}'`)
    if (!validTypes.includes(type)) throw new Error(`Invalid 'type'!`)
    if (validator && !(validator instanceof Validator)) throw new Error (`Invalid validator! Must be instance of Validator class!`)

    switch (type) {
      case 'String':
        this.#fields[name] = { validate: (value) => common.validateString(value, options), required, type }
        break
      case 'Number':
        this.#fields[name] = { validate: (value) => common.isNumber(value, options), required, type }
        break
      case 'Date':
        this.#fields[name] = { validate: (value) => common.isDate(value), required, type }
        break
      case 'Boolean':
        this.#fields[name] = { validate: (value) => common.isBoolean(value), required, type }
        break
      case 'Email':
        this.#fields[name] = { validate: (value) => common.isEmail(value), required, type }
        break
      case 'URL':
        this.#fields[name] = { validate: (value) => common.isURL(value), required, type }
        break
      case 'Mongo':
        this.#fields[name] = { validate: (value) => common.isMongo(value), required, type }
        break
      case 'Array':
        this.#fields[name] = { validate: (value) => common.isArray(value, options), required, type, validator }
        break
      default:
        break
    }
  }

  /**
   * Validate single field from validator
   * @param { string } field 
   * @param { any } value 
   */
  validateSingle(field, value) {
    if (!this.#fields.hasOwnProperty(field)) throw new Error(`This validator don't have field '${field}'`)
    if (value === undefined) throw new Error(`Missing 'value'!`)
    return this.#fields[field].validate(value)
  }

  /**
   * 
   * @param {object | Array} body - Object for validate
   * @param {boolean} [strict] - Check for required option
   * @returns {returnObject}
   */
  validate(body, strict = true) {
    const errors = []
    
    const validateObject = (current) => {
      Object.keys(this.#fields).forEach(key => {
        const bodyField = common.getBodyField(current, key)
        
        if (!bodyField && this.#fields[key].required && strict) {
          errors.push(`Missing field '${key}'`)
          return
        }

        if (bodyField) {
          const validateField = this.#fields[key].validate(bodyField)
          if (this.#fields[key].type === 'Array' && this.#fields[key].validator) {
            const validateArray  = this.#fields[key].validator.validate(bodyField)
            if (!validateArray.success) errors.push(`'${key}' ${validateArray.errors}`)
          }
          if (validateField !== common.success) errors.push(`'${key}' ${validateField}`)
        }
      })
    }

    Array.isArray(body) ? body.forEach(el => validateObject(el)) : validateObject(body)
    return errors.length ? { success: false, errors: errors.join(' | ') } : { success: true, errors: null }
  }

  /**
   * 
   * @param {number} errStatus - If middleware return error - error code
   * @param {boolean} strict - check required field
   * @returns 
   */
  middleware(errStatus = 422, strict = true) {
    return (req, res, next) => {
      const { body } = req
      const errors = []
      const validateObject = (current) => {
        Object.keys(this.#fields).forEach(key => {
          const bodyField = common.getBodyField(current, key)
          
          if (!bodyField && this.#fields[key].required && strict) {
            errors.push(`Missing field '${key}'`)
            return
          }
  
          if (bodyField) {
            const validateField = this.#fields[key].validate(bodyField)
            if (this.#fields[key].type === 'Array' && this.#fields[key].validator) {
              const validateArray  = this.#fields[key].validator.validate(bodyField)
              if (!validateArray.success) errors.push(`'${key}' ${validateArray.errors}`)
            }
            if (validateField !== common.success) errors.push(`'${key}' ${validateField}`)
          }
        })
      }

      Array.isArray(body) ? body.forEach(el => validateObject(el)) : validateObject(body)
      return errors.length
        ? res.status(errStatus).json({ success: false, errors: errors.join(' | ') })
        : next()
    } 
  }
}


module.exports = {
  Validator,
  validateString: common.validateString,
  validateNumber: common.isNumber,
  validateArray: common.isArray
}
