const userModel = require('../model/userModel')

const getUserByEmail = async (email) => {
    return await userModel.findOne({ email })
}

module.exports = {
    getUserByEmail,
}
