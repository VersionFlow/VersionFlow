import { AUTH_PATTERN, CONFIG_OPTIONS } from '@packages/contracts'
import type { ConfigType } from './types/config'
import { serve } from '@hono/node-server'
import { ServiceBroker } from 'moleculer'
import { Config } from '@packages/config'
import { Hono } from 'hono'

const broker = new ServiceBroker({
	transporter: process.env.RABBIT_MQ_URL as string,
	logger: null,
})

const app = new Hono()
const config = new Config<ConfigType>(CONFIG_OPTIONS).load()

app.post('/auth/signup', async () => {
	const data = { email: '', password: '' }
	console.log(await broker.call(AUTH_PATTERN.SIGNUP, data))
})

serve(
	{
		fetch: app.fetch,
		hostname: '0.0.0.0',
		port: config.http.port,
	},
	async () => {
		console.log(`The server started successfully on port ${config.http.port}`)
		await broker.start()
	}
)
