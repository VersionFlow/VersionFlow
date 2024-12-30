import type { ErrorObject } from 'ajv'

export function getValidationErrorMessage(error: ErrorObject, filePath: string) {
	switch (error.keyword) {
		case 'required':
			return `In ${filePath}, the required field '${error.params.missingProperty}' is missing.`
		case 'type':
			return `In ${filePath}, the field '${error.instancePath}' must be of type ${error.params.type}, but a value of type ${typeof error.data} was found.`
		case 'additionalProperties':
			return `In ${filePath}, the field '${error.instancePath}' contains additional properties that are not allowed by the schema.`
		case 'enum':
			return `In ${filePath}, the field '${error.instancePath}' must be one of the following values: ${error.params.allowedValues.join(', ')}.`
		case 'pattern':
			return `In ${filePath}, the field '${error.instancePath}' does not match the required pattern '${error.params.pattern}'.`
		case 'minimum':
			return `In ${filePath}, the field '${error.instancePath}' must be greater than or equal to ${error.params.limit}.`
		case 'maximum':
			return `In ${filePath}, the field '${error.instancePath}' must be less than or equal to ${error.params.limit}.`
		default:
			return `In ${filePath}, the field '${error.instancePath}' has an invalid value: ${error.message || 'Unknown error'}.`
	}
}
