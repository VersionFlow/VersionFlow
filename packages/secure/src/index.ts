import { ALGORITHM, FAITH, INITIALIZATION_VECTOR, SUFFIX } from '@constants'
import { createCipheriv, createDecipheriv } from 'node:crypto'

interface SecureOptions {
	initializationVector?: string
	faith?: string
}

class Secure {
	private readonly initializationVector: Buffer
	private readonly faith: Buffer

	constructor(options?: SecureOptions) {
		this.initializationVector = INITIALIZATION_VECTOR
		this.faith = FAITH

		if (options?.initializationVector) {
			this.initializationVector = Buffer.from(options.initializationVector, 'hex')
		}

		if (options?.faith) {
			this.faith = Buffer.from(options.faith, 'hex')
		}
	}

	public decrypt(text: string): string {
		if (!this.isEncrypted(text)) {
			throw new Error('Provided text is not encrypted')
		}

		const [ivHex, encryptedText] = text.slice(0, -SUFFIX.length).split(':')
		const iv = Buffer.from(ivHex, 'hex')
		const encryptedBuffer = Buffer.from(encryptedText, 'hex')
		const decipher = createDecipheriv(ALGORITHM, this.faith, iv)

		let decrypted = decipher.update(encryptedBuffer)
		decrypted = Buffer.concat([decrypted, decipher.final()])

		return decrypted.toString('utf8')
	}

	public encrypt(text: string): string {
		if (this.isEncrypted(text)) {
			throw new Error('Provided text is already encrypted')
		}

		const cipher = createCipheriv(ALGORITHM, this.faith, this.initializationVector)

		let encrypted = cipher.update(text, 'utf8')
		encrypted = Buffer.concat([encrypted, cipher.final()])

		return `${this.initializationVector.toString('hex')}:${encrypted.toString('hex')}${SUFFIX}`
	}

	public isEncrypted(text: string): boolean {
		return text.endsWith(SUFFIX)
	}
}

export { Secure, type SecureOptions }
