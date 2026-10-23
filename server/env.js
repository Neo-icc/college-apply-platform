/**
 * 环境变量加载（必须在任何读取 process.env 的模块之前执行）
 * 固定读取 server/.env，与 npm run server 的 cwd 无关。
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') })
