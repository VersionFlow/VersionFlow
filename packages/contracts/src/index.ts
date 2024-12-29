export const CONFIG_OPTIONS = {
	configsDirPath: './config',
	configsSchemaDirPath: './schemas/config',
	secretsDirPath: '../../secrets',
	secretsSchemaDirPath: '../../schemas/secrets',
}

export const MICROSERVICE_NAME = {
	AUTH: 'auth',
} as const

export const AUTH_ACTION = {
	SIGNUP: 'signup',
} as const

export const AUTH_PATTERN = {
	SIGNUP: `${MICROSERVICE_NAME.AUTH}.${AUTH_ACTION.SIGNUP}`,
} as const
