const crypto = require('crypto');

module.exports = function random(length, chars) {

    chars = chars ||
        'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789';
    var rnd = crypto.randomBytes(length),
        value = new Array(length),
        len = len = Math.min(256, chars.length),
        d = 256 / len

    for (var i = 0; i < length; i++) {
        value[i] = chars[Math.floor(rnd[i] / d)]
    };

    return value.join('');
}