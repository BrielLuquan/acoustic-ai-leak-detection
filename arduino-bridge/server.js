const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')
const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())

// 🔧 Updated to match your Arduino's verified COM port
const port = new SerialPort({
  path: 'COM8',   
  baudRate: 115200
})

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' })) // \r\n handles Arduino println cleanly

let latestData = { A: 0, B: 0, C: 0 }

parser.on('data', (line) => {
  const parts = line.trim().split(',')

  if (parts.length === 3) {
    const [A, B, C] = parts.map(Number)
    
    // Safety check: ensure we didn't parse NaN (Not a Number) if strings were empty
    latestData = { 
      A: isNaN(A) ? 0 : A, 
      B: isNaN(B) ? 0 : B, 
      C: isNaN(C) ? 0 : C 
    }
    console.log("📡 Streaming to API:", latestData)
  }
})

// Add error handling so your node server doesn't crash if the serial port disconnects
port.on('error', (err) => {
  console.error('❌ Serial Port Error: ', err.message)
})

// API endpoint for your React/Lovable dashboard to hit
app.get('/sensor', (req, res) => {
  res.json(latestData)
})

app.listen(3001, () => {
  console.log("🚀 Acoustic AI Bridge running on http://localhost:3001/sensor")
})