import { MICROSERVICE_NAME, AUTH_ACTION, CONFIG_OPTIONS } from '@packages/contracts'
import { LoggerInstance, ServiceBroker } from 'moleculer'
import type { ConfigType } from './types/config'
import { Config } from '@packages/config'

const config = new Config<ConfigType>({
	...CONFIG_OPTIONS,
	logger: new LoggerInstance(),
}).load()

const broker = new ServiceBroker({
	transporter: config.rabbit.url,
})

broker.createService({
	name: MICROSERVICE_NAME.AUTH,
	actions: {
		[AUTH_ACTION.SIGNUP]: async (context) => {
			console.log(context.meta)
		},
	},
})

await broker.start()
