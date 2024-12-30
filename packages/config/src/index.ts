import { readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs'
import { createContext, runInContext } from 'node:vm'
import { type Document, parseDocument } from 'yaml'
import { FIELDS_TO_ENCRYPT } from '@constants'
import { printValidatorErrors } from '@utils'
import { Secure } from '@packages/secure'
import { join } from 'node:path'
import { Ajv } from 'ajv'

interface ConfigOptions {
	configsDirPath: string
	configsSchemaDirPath: string
	secretsDirPath?: string
	secretsSchemaDirPath?: string
	logger?: ConfigLogger
}

interface ConfigLogger {
	info: (...args: unknown[]) => void
	warn: (...args: unknown[]) => void
	error: (...args: unknown[]) => void
}

class Config<T = Record<string, unknown>> {
	private readonly logger: ConfigLogger = console
	private readonly secure: Secure
	private readonly ajv: Ajv

	constructor(private readonly options: ConfigOptions) {
		if (options.logger) {
			this.logger = options.logger
		}

		this.secure = new Secure()
		this.ajv = new Ajv()
	}

	public load(): T {
		let secrets: Record<string, unknown> = {}

		if (!this.options.secretsDirPath || !this.options.secretsSchemaDirPath) {
			this.logger.warn(
				'Secrets not loaded: the path to the directory of secrets or their schematics is not specified'
			)
		} else {
			secrets = this.loadAndValidateFiles(
				this.options.secretsDirPath,
				this.options.secretsSchemaDirPath
			)
		}

		return this.loadAndValidateFiles(
			this.options.configsDirPath,
			this.options.configsSchemaDirPath,
			secrets
		) as T
	}

	private loadAndValidateFiles(
		dirPath: string,
		schemaDirPath = '',
		secrets: Record<string, unknown> = {}
	) {
		const isDirPathExists = existsSync(dirPath)

		if (!isDirPathExists) {
			this.logger.error(`Check the existence of the path '${dirPath}`)
			process.exit(1)
		}

		const filesPaths = readdirSync(dirPath)
		const result: Record<string, unknown> = {}

		for (const filePath of filesPaths) {
			const fileContent = readFileSync(join(dirPath, filePath), 'utf-8')
			const fileParsed = parseDocument(fileContent)
			const fileSchemaPath = join(schemaDirPath, filePath)

			if (!existsSync(fileSchemaPath)) {
				this.logger.error(
					`Check the existence of the schema along the path: '${fileSchemaPath}'`
				)

				process.exit(1)
			}

			const fileSchemaContent = readFileSync(fileSchemaPath, 'utf-8')
			const fileSchemaParsed = parseDocument(fileSchemaContent)

			try {
				const validate = this.ajv.compile(fileSchemaParsed.toJSON())
				const fileKey = filePath.replace(/\.[^/.]+$/, '')

				if (validate(fileParsed.toJSON())) {
					const decryptedContent = this.decryptFields(fileParsed.toJSON())
					this.updateFields(fileParsed, decryptedContent)

					result[fileKey] = this.resolveReferences(fileParsed.toJSON(), secrets)
					this.encryptAndRewriteFile(dirPath, filePath, fileParsed)
				} else {
					printValidatorErrors(validate.errors || [], filePath, this.logger)
					process.exit(1)
				}
			} catch (error) {
				this.logger.error(
					`Check the correctness of the schema using the path "${fileSchemaPath}":`,
					error instanceof Error
						? error.message
						: JSON.stringify(error, null, 2)
				)

				process.exit(1)
			}
		}

		return result
	}

	private resolveReferences(
		object: Record<string, unknown>,
		secrets: Record<string, unknown>
	) {
		const resolveValue = (value: unknown): unknown => {
			if (Array.isArray(value)) {
				return value.map((item) => resolveValue(item))
			}

			if (typeof value === 'string' && value.startsWith('=>')) {
				const expression = value.slice(2).trim()
				return this.evaluateExpression(expression, secrets)
			}

			if (typeof value === 'object' && value !== null) {
				return this.resolveReferences(value as Record<string, unknown>, secrets)
			}

			return value
		}

		const resolvedObject: Record<string, unknown> = {}

		for (const [key, value] of Object.entries(object)) {
			resolvedObject[key] = resolveValue(value)
		}

		return resolvedObject
	}

	private evaluateExpression(expression: string, secrets: Record<string, unknown>) {
		const context = createContext({
			secrets: secrets,
		})

		try {
			return runInContext(expression, context)
		} catch (error) {
			this.logger.error(
				`Error when executing the expression '${expression}':`,
				error
			)
			process.exit(1)
		}
	}

	private encryptAndRewriteFile(dirPath: string, filePath: string, document: Document) {
		const encryptedData = this.encryptFields(document.toJSON())
		const fullPath = join(dirPath, filePath)

		this.updateFields(document, encryptedData)

		try {
			writeFileSync(fullPath, String(document), 'utf-8')

			this.logger.info(
				`File '${dirPath}/${filePath}' successfully encrypted and overwritten`
			)
		} catch (error) {
			this.logger.error(`Error writing the file '${filePath}':`, error)
			process.exit(1)
		}
	}

	private encryptFields(object: Record<string, unknown>) {
		const result: Record<string, unknown> = {}

		const shouldEncrypt = (key: string): boolean => {
			return FIELDS_TO_ENCRYPT.some((regex) => regex.test(key))
		}

		for (const [key, value] of Object.entries(object)) {
			if (shouldEncrypt(key)) {
				if (
					['string', 'number'].includes(typeof value) &&
					!`${value}`.startsWith('=>') &&
					!this.secure.isEncrypted(`${value}`)
				) {
					result[key] = this.secure.encrypt(`${value}`)
				} else {
					result[key] = value
				}
			} else if (
				typeof value === 'object' &&
				value !== null &&
				!Array.isArray(value)
			) {
				result[key] = this.encryptFields(value as Record<string, unknown>)
			} else {
				result[key] = value
			}
		}

		return result
	}

	private decryptFields(object: Record<string, unknown>) {
		const result: Record<string, unknown> = {}

		const shouldDecrypt = (key: string): boolean =>
			FIELDS_TO_ENCRYPT.some((regex) => regex.test(key))

		for (const [key, value] of Object.entries(object)) {
			if (shouldDecrypt(key)) {
				if (typeof value === 'string' && this.secure.isEncrypted(value)) {
					result[key] = this.secure.decrypt(value)
				} else {
					result[key] = value
				}
			} else if (
				typeof value === 'object' &&
				value !== null &&
				!Array.isArray(value)
			) {
				result[key] = this.decryptFields(value as Record<string, unknown>)
			} else {
				result[key] = value
			}
		}

		return result
	}

	private updateFields(document: Document, object: Record<string, unknown>) {
		for (const [key, value] of Object.entries(object)) {
			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				const childNode = document.get(key) || document.createNode({})

				this.updateFields(childNode as Document, value as Record<string, unknown>)

				document.set(key, childNode)
			} else {
				document.set(key, value)
			}
		}
	}
}

export { Config, type ConfigOptions, type ConfigLogger }
