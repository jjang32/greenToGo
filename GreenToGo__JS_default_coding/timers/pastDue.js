'use strict';

const stripe = require('stripe')('sk_test_QmWIt4LmRyEj1c0UgJy1gxH5');

Backendless.ServerCode.addTimer({

    name: 'pastDue',
  
    startDate: 1627714800000,
  
    frequency: { 
      schedule: 'daily',
  
      repeat: {'every': 1}
    },
  
    /**
    * @param {Object} req
    * @param {String} req.context Application Version Id
    */
    async execute(req){
        var whereClause = "due at or before " + Math.floor(Date.now() / 1000);
        var queryBuilder = Backendless.DataQueryBuilder.create().setWhereClause(whereClause);

        const boxes = Backendless.Data.of("Boxes").find(queryBuilder);
        for(var box of boxes) {
            const customer = await stripe.customers.retrieve(box['stripeID']);
            await stripe.charges.create({
                amount: 1000,
                currency: 'usd',
                customer: customer.id,
                source: customer.invoice_settings.default_payment_method,
            });
        }
        Backendless.Data.of("TimerLog").save({timerContext: JSON.stringify(req)})
    }
  });