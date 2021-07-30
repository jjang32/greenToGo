'use strict';

const stripe = require('stripe')('sk_test_QmWIt4LmRyEj1c0UgJy1gxH5');

class rewards {
    /**
     * @param {Number} pointAdd
     * @returns {String}
     */
    async updatePoints(pointAdd) {
        const curUser = Backendless.UserService.getCurrentUser();
        curUser.points += pointAdd;

        var whereClause = "points at or before " + curUser.points;
        var queryBuilder = Backendless.DataQueryBuilder.create().setWhereClause(whereClause);
        const rewards = Backendless.Data.of("Rewards").find(queryBuilder);
        for(var reward of rewards) {
            if(curUser.points < reward.points) {
                break;
            }
            curUser.points -= reward.points;
            await stripe.customers.update(
                curUser.stripeID,
                {
                    coupon: reward.rewardID,
                }
            );
            //how to display real-time reward notifications?
        }
        return Backendless.UserService.updateSync(curUser);
    }

    /**
     * @param {String} n
     * @param {Number} amount
     * @param {Number} p
     * @param {String} imageFile
     * @param {Number} users
     * @returns {String}
     */
    async createReward(n, amount, p, imageFile, users) {
        const discount = await stripe.coupons.create({
            amount_off: amount,
            currency: 'usd',
            duration: once,
            name: n,
        });
        //image picker component
        return Backendless.Data.of("Rewards").save({
            name: n,
            price: amount,
            points: p,
            image: imageFile,
            number: users,
            rewardID: discount.id,
        });
    }
}

rewards.version = '1.0.0';

Backendless.ServerCode.addService(rewards);