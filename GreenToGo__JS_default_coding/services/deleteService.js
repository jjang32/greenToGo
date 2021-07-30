'use strict';

const stripe = require('stripe')('sk_test_QmWIt4LmRyEj1c0UgJy1gxH5');

class deleteService {
    /**
     * @param {String} users
     * @returns {Number}
     */
    async deleteUsers(users) { 
        const userArray = JSON.Parse(users);
        for(var user of userArray) {
            Backendless.Data.of('Users').remove(Backendless.Data.of('Users').find());
        }
    }

    deleteBoxes() {

    }

    deleteRewards() {

    }

    async deleteCoupons() {

    }

    async deleteSubscriptions() {

    }
}

deleteService.version = '1.0.0';

Backendless.ServerCode.addService(deleteService);