export const FAITH =
	process.env.SECURE_FAITH ??
	Buffer.from('ac9128c7ff85720dfb9a90b75ffbc5ea9dc1ff0d6be2c8d59e11e84d01c254a4', 'hex')

export const INITIALIZATION_VECTOR =
	process.env.SECURE_VECTOR ?? Buffer.from('53ae0ec45a25e8c0')

export const ALGORITHM = 'aes-256-cbc'
export const SUFFIX = '=byte'
