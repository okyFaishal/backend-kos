const jwt = require( 'jsonwebtoken' )

function generateToken( payload ) {
	return jwt.sign( payload, 'FOsAnAc4demY' )
}

function verifyToken( token ) {
	return jwt.verify( token, 'FOsAnAc4demY' )
}

module.exports = {
	generateToken,
	verifyToken
}