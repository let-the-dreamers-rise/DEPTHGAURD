import serverless from 'serverless-http'
import app from '../server/index.ts'

export const config = {
  maxDuration: 300,
}

export default serverless(app)
