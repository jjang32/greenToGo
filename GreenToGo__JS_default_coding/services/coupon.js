'use strict';

const stripe = require('stripe')('sk_test_QmWIt4LmRyEj1c0UgJy1gxH5');

class coupon { 
    /**
     * @param {String} discountType
     * @param {String} couponType
     * @param {String} email
     * @param {String} identify
     * @param {String} productName
     * @param {String} rate
     * @param {Number} offAmount
     * @param {Number} numMonths
     * @param {Number} numUsers
     * @param {String} n
     * @param {Date} d
     * @returns {String}
     */
  async createCoupon(discountType, couponType, email, identify, productName, rate, offAmount, numMonths, numUsers, n, d) {
    const unixTime = Math.floor(d.getTime() / 1000);
    const coupon = null;
    if(couponType === 'Subscription') {
        var whereClause = "name = " + productName;
        var queryBuilder = Backendless.DataQueryBuilder.create().setWhereClause(whereClause);

        const prods = Backendless.Data.of("Users").find(queryBuilder);
        if(discountType === 'Percentage') {
            coupon = await stripe.coupons.create({
                id: identify,
                applies_to: prods,
                percent_off: offAmount,
                duration: rate,
                duration_in_months: numMonths,
                name: n,
                redeem_by: unixTime,
                max_redemptions: numUsers,
            });
            return Backendless.Data.of("Coupons").save({
                couponID: coupon.id,
                couponType: 'Subscription',
                discountType: 'Percentage',
                rateType: rate,
                duration: numMonths,
                amount: offAmount,
            });
        }
        else if(discountType === 'Fixed') {
            coupon = await stripe.coupons.create({
                id: identify,
                applies_to: prods,
                amount_off: offAmount,
                currency: 'usd',
                duration: rate,
                duration_in_months: numMonths,
                name: n,
                redeem_by: unixTime,
                max_redemptions: numUsers,
            });
            return Backendless.Data.of("Coupons").save({
                couponID: coupon.id,
                couponType: 'Subscription',
                discountType: 'Fixed',
                rateType: rate,
                duration: numMonths,
                amount: offAmount,
            });
        }
    }
    else if(couponType === 'Customer') {
        var whereClause = "email = " + email;
        var queryBuilder = Backendless.DataQueryBuilder.create().setWhereClause(whereClause);

        const user = Backendless.Data.of("Users").find(queryBuilder);
        await stripe.customers.update(
            user.stripeID,
            {
                coupon: coupon.id,
            }
        )
        if(discountType === 'Percentage') {
            coupon = await stripe.coupons.create({
                id: identify,
                percent_off: offAmount,
                duration: rate,
                duration_in_months: numMonths,
                name: n,
                redeem_by: unixTime,
                max_redemptions: numUsers,
            });
            return Backendless.Data.of("Coupons").save({
                couponID: coupon.id,
                couponType: 'Customer',
                discountType: 'Percentage',
                rateType: rate,
                duration: numMonths,
                amount: offAmount,
                stripeID: user.stripeID,
            });
        }
        else if(discountType === 'Fixed') {
            coupon = await stripe.coupons.create({
                id: identify,
                amount_off: offAmount,
                currency: 'usd',
                duration: rate,
                duration_in_months: numMonths,
                name: n,
                redeem_by: unixTime,
                max_redemptions: numUsers,
            });
            return Backendless.Data.of("Coupons").save({
                couponID: coupon.id,
                couponType: 'Customer',
                discountType: 'Fixed',
                rateType: rate,
                duration: numMonths,
                amount: offAmount,
                stripeID: user.stripeID,
            });
        }
    }
  }
}

coupon.version = '1.0.0';

Backendless.ServerCode.addService(coupon);