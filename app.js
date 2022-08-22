// require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const routing = require('./routing/index')


// app.use(morgan('dev'))
app.use(cors())
app.use(express.urlencoded({extended: false}))
app.use(express.json())


app.use('/', routing)
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