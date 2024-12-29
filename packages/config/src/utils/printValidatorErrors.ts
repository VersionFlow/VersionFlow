import { getValidationErrorMessage } from './getValidationErrorMessage'
import type { ConfigLogger } from '../index'
import type { ErrorObject } from 'ajv'

export function printValidatorErrors(
	errors: ErrorObject[],
	filePath: string,
	logger: ConfigLogger
) {
	const errorsMessages =
		errors?.map((error) => getValidationErrorMessage(error, filePath)) || []

	for (const errorMessage of errorsMessages) {
		logger.error(errorMessage)
	}
}
