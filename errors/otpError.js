class OtpError extends Error {
    constructor(message) {
        super(message)
        this.name = 'OtpError'
    }
}

module.exports = OtpError
