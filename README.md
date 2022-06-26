# body-validator-v2

## Description
Validate objects, designed to validate req.body object in Express

## Installation
```sh
npm i body-validator-v2
```

## Usage
```JavaScript
// No ES6
const { Validator } = require('body-validator-v2')

// ES6
import { Validator } from 'body-validator-v2'
```

For example will validate object for hockey player
```JSON
{
  "name": "Simeon Mladenov",
  "number": 13,
  "team": "61d9f9c62411e95f925d7c5e",
  "profilePhoto": "https://my.photos.net/1.jpg",
  "email": "pop@armenia.com",
  "position": "guard",
  "birthDate": "1980-04-01",
  "photos": [
    "https://my.photos.net/1.jpg",
    "https://my.photos.net/2.jpg",
  ],
  "previousTeams": [
    {
      "team": "61d9f9c62411e95f925d7c5e",
      "beginYear": "2000-04-01",
      "endYear": "2001-04-01"
    },
    {
      "team": "61d9f9c62411e95f925d7c5e",
      "beginYear": "2001-04-01",
      "endYear": "2002-04-01"
    }
  ],
  "address": {
    "city": "Sofia",
    "str": "2 None Str."
  }
}
```

First create Validator
```JavaScript
const playerValidator = new Validator()

// Validate primitive fields
playerValidator.addField({ name: 'name', type: 'String', options: { maxWords: 2, allowSpaces: true, include: 'lettersOnly' }, required: true })
playerValidator.addField({ name: 'number', type: 'Number', options: { min: 0, max: 99 }, required: true })
playerValidator.addField({ name: 'team', type: 'Mongo', required: true })
playerValidator.addField({ name: 'profilePhoto', type: 'URL' })
playerValidator.addField({ name: 'email', type: 'Email', required: true })
playerValidator.addField({ name: 'position', type: 'String', options: { enum: ['goalie', 'guard', 'attacker'] }, required: true })
playerValidator.addField({ name: 'birthDate', type: 'Date', required: true })

// Validate array of primitives
playerValidator.addField({ name: 'photos', type: 'Array', options: { minRecords: 1, arrayValuesType: 'URL' }, required: true })

// Validate array of object - in this case we create new validator for objects in array
const addressValidator = new Validator()
addressValidator.addField({ name: 'team', type: 'Mongo', required: true })
addressValidator.addField({ name: 'beginYear', type: 'Date', required: false })
addressValidator.addField({ name: 'endYear', type: 'Date', required: false })

playerValidator.addField({ name: 'previousTeams', type: 'Array', options: { minRecords: 1 }, validator: addressValidator })

// Validate nested object
playerValidator.addField({ name: 'address.city', type: 'String', required: true })
playerValidator.addField({ name: 'address.str', type: 'String', required: true })
```

Validate object (body)
```JavaScript
// Validate all fields in object (body)
const check = playerValidator.validate(body)
console.log(check)
>>> { success: true, errors: null }

// Validate single field from object (body)
const checkSingle = playerValidator.validateSingle('address.city', 3)
console.log(checkSingle)
>>> { success: false, errors: "'3' is not a 'string' type!" }

// Validate few specified fields from object (body)
const checkFewFields = playerValidator.validateFields('name number previousTeams address.city', body, true)
console.log(checkFewFields)
>>> { success: true, errors: null }
```

## Validator methods
* __addField__ - _Add field to validator_
* __validate__ - _Validate all fields in object_
* __validateSingle__ - _Validate single field from object_
* __validateFields__ - _Validate few specified fields from object_

### addField
Param        | Type              |  Predefined
-------------| ------------------|-------------------------------------------------------------------------
name         | String            |
type         | String            | 'String', 'Number', 'Date', 'Boolean', 'Email', 'URL', 'Mongo', 'Array'
options      | Object            | _Look bottom table_
required     | Boolean           |
validator    | Validator object  |

Option              | For type   | Type      | Description                                                        | Predefined
--------------------|------------|-----------|--------------------------------------------------------------------|--------------------------------------------------------------
min                 | Number     | Number    | If field type is Number - min value                                | 
max                 | Number     | Number    | If field type is Number - max value                                | 
minRecords          | Array      | Number    | If field type is Array - min array length                          |
maxRecords          | Array      | Number    | If field type is Array - max array length                          |
arrayValuesType     | Array      | String    | If field type is Array - type of records                           | 'String', 'Number', 'Date', 'Boolean', 'Email', 'URL', 'Mongo', 'Array'
arrayValuesOptions  | Array      | Object    | If field type is Array - validate options for records              | Same like in this table
minSymbols          | String     | Number    | If field type is String - min symbols                              |
maxSymbols          | String     | Number    | If field type is String - max symbols                              |
canBeEmpty          | String     | Boolean   | If field type is String - can be empty string?                     |
allowSpaces         | String     | Boolean   | If field type is String - allow to have spaces?                    |
maxWords            | String     | Number    | If field type is String - max number of words                      |
blackList           | String     | Array     | If field type is String - symbols that are forbidden               |
include             | String     | String    | If field type is String - what type of characters it may contain   | lettersOnly', 'numbersOnly', 'lettersAndNumbers'
enum                | String     | Array     | If field type is String - can only be from predefined values       |

## Using as middleware in Express
```JavaScript
import express from 'express'
const router = express.Router()

// First param - if validator find error - error status (default is 422)
// Second param - check required option (default is false)
router.post('/create', playerValidator.middleware(422, true), (req, res) => {})
```