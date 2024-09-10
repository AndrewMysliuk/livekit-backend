import { createLogger, format, transports } from "winston"
import path from "path"
import fs from "fs"

const { combine, timestamp, printf, colorize } = format

const logsDir = path.join(__dirname, "../logs")

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`
})

const logger = createLogger({
  level: "info",
  format: combine(
    colorize(),
    timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    logFormat
  ),
  transports: [new transports.Console(), new transports.File({ filename: path.join(logsDir, "app.log") })],
})

export default logger
