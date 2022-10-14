require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan'); 
const app = express()
const routing = require('./routing/index')
const errorHandling = require('./middleware/error-handling')

app.use(morgan('dev'))
app.use(express.static('asset'))
app.use(cors())
app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use(routing)
app.use(errorHandling)
app.use((req, res) => {
  res.status(404).json({
      success: false,
      message: 'URL Not found'
  });
})

const port = 5000

app.listen(port, () => {
	console.log(` telah tersambung pada port : ${port}`)
});