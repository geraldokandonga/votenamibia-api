const Role = require('./role');

module.exports = {
    hasPermission,
    hasPermissionToCart
}


/**
 * hasPermission
 * @param {*} user
 * @param {*} model
 */
function hasPermission(user, model) {

    return user.role === Role.ADMIN;
}


/**
 * hasPermissionToCart
 * @param {*} customer
 * @param {*} cart
 */
function hasPermissionToCart(customer, cart) {

    return customer.id.equals(cart.customerId);
}