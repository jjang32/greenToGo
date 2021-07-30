'use strict';

const stripe = require('stripe')('sk_test_QmWIt4LmRyEj1c0UgJy1gxH5');

class userService {
  /**
   * @param {String} time
   * @returns {String}
   */
  rateOfSub(time) {
    if(time === 'year') {
      return 'ANNUAL';
    }
    else if(time === 'month') {
      return 'MONTHLY';
    }
    return '';
  }

  /**
   * @param {String} res
   * @param {String} num
   * @returns {String}
   */
  prodName(res, num) {
    var result = res + ' ' + num;
    if(num === 1) {
      result += ' box';
    }
    else {
      result += ' boxes';
    }
    return result;
  }
  /**
   * @param {String} n
   * @param {String} time
   * @param {Number} num
   * @param {Number} mon
   * @param {String} e
   * @param {String} pass
   * @param {String} phoneNumber
   * @param {String} ci
   * @param {String} l1
   * @param {String} l2
   * @param {String} code
   * @param {String} st
   * @param {String} how
   * @param {String} where
   * @param {String} payNum
   * @param {Number} expireMonth
   * @param {Number} expireYear
   * @param {String} securityCode
   * @returns {String}
   */
  async createUser(n, time, num, mon, e, pass, phoneNumber, ci, l1, l2, code, st, how, where, payNum, expireMonth, expireYear, securityCode) {
    var res = this.rateOfSub(time);
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: payNum,
        exp_month: expireMonth,
        exp_year: expireYear,
        cvc: securityCode,
      },
    });
    const des = "How did they hear about us?\n" + how + "\nWhere do they work?\n" + where;
    const add = l1 + ", " + l2 + " " + ci + ", " + st + " " + code;
    const customer = await stripe.customers.create({
      address: {
        city: ci,
        country: 'US',
        line1: l1,
        line2: l2,
        postal_code: code,
        state: st,
      },
      description: des,
      phone: phoneNumber,
      name: n,
      email: e,
      payment_method: paymentMethod.id,
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });
    var productName = this.prodName(res, num);
    const prod = await stripe.products.create({
      name: productName,
    });
    const price = await stripe.prices.create({
      currency: 'usd',
      metadata: {
        number_of_boxes: num
      },
      product: prod.id,
      recurring: {
        interval: time,
        interval_count: 1,
      },
      unit_amount: mon,
    });
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      default_payment_method: paymentMethod.id,
      items: [
        {price: price.id},
      ],
    });
    const customerInstance = new Backendless.User();
    customerInstance['name'] = n;
    customerInstance['email'] = e;
    customerInstance['password'] = pass;
    customerInstance['phone'] = phoneNumber;
    customerInstance['address'] = add;
    customerInstance['stripeID'] = customer.id;
    customerInstance['subscriptionID'] = subscription.id;
    customerInstance['subscriptionType'] = productName;
    customerInstance['points'] = 0;
    customerInstance['inventory'] = num;
    customerInstance['status'] = 'User';
    const output = Backendless.UserService.register(customerInstance);
    Backendless.UserService.createEmailConfirmationURL(e);
    return output;
  }

  /**
   * @param {String} email
   * @param {String} pass
   */
  login(email, pass) {
    Backendless.UserService.login(email, pass, true);
  }

  logout() {
    Backendless.UserService.logout();
  }

  /**
   * @param {String} time
   * @param {Number} num
   * @param {Number} mon
   * @returns {String}
   */
  async updateSub(time, num, mon) {
    const curUser = Backendless.UserService.getCurrentUser();
    var productName = this.prodName(this.rateOfSub(time), num);
    const tempSub = await stripe.subscriptions.retrieve(curUser.subscriptionID);
    const prod = await stripe.products.update(
      tempSub.items.price.product,
      {
        name: productName,
      }
    );
    await stripe.prices.update(
      tempSub.items.price.id,
      {
        active: false,
      }
    );
    const price = await stripe.prices.create({
      currency: 'usd',
      metadata: {
        number_of_boxes: num
      },
      product: prod.id,
      recurring: {
        interval: time,
        interval_count: 1,
      },
      unit_amount: mon,
    });
    await stripe.subscriptions.update(
      curUser.subscriptionID,
      {
        items: [
          {price: price.id},
        ],
      }
    );
    curUser.subscriptionType = prodName;
    curUser.inventory = num;
    return Backendless.UserService.updateSync(curUser);
  }
  /**
   * @returns {String}
   */
  async updatePayment() {
    const curUser = Backendless.UserService.getCurrentUser();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'setup',
      customer: curUser.stripeID,
      setup_intent_data: {
        metadata: {
          customer_id: curUser.stripeID,
          subscription_id: curUser.subscriptionID,
        },
      },
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
    });
    var stripePub = Stripe('pk_test_JI1ULSFbwD8ITPkCAzK4Uu1r');
    stripePub.redirectToCheckout({
      sessionId: session.id,
    }).then(function (result) {
      console.log(result.error.message);
    });
    const intent = await stripe.setupIntents.retrieve(session.data.object.setup_intent);
    await stripe.customers.update(curUser.stripeID, {
      invoice_settings: {
        default_payment_method: intent.payment_method,
      },
    });
    return Backendless.Data.of("Users").save(curUser);
  }
  /**
   * @param {String} n
   * @param {String} e
   * @param {String} pass
   * @returns {String}
   */
  async updateCustomerInfo(n, e, pass) {
    const curUser = Backendless.UserService.getCurrentUser();
    await stripe.customers.update(
      curUser.stripeID,
      {
        name: n,
        email: e,
      }
    );
    if(curUser.password !== pass) {
      Backendless.UserService.verifyPassword(curUser.password); 
    }
    curUser.name = n;
    curUser.email = e;
    curUser.password = pass;
    return Backendless.UserService.updateSync(curUser);
  }
  /**
   * @param {String} e
   * @returns {String}
   */
  resetPassword(e) {
    Backendless.UserService.restorePassword(e);
  }
  /**
   * @param {String} time
   * @param {Number} num
   * @param {Number} mon
   * @param {String} newTime
   * @param {Number} newNum
   * @param {Number} newMon
   */
  async updateSetSub(time, num, mon, newTime, newNum, newMon) {
    const queryBuilder = Backendless.DataQueryBuilder.create();
    queryBuilder.addProperties('subscriptionID');
    const users = Backendless.Data.of('Users').find(queryBuilder);
    for(var u of users) {
      const sub = await stripe.subscriptions.retrieve(u);
      const price = await stripe.prices.retrieve(sub.items.price);
      if(price.metadata.number_of_boxes === num && price.recurring.interval === time && price.unit_amount === mon) {
        var productName = this.prodName(this.rateOfSub(newTime), newNum);
        const prod = await stripe.products.update(
          sub.items.price.product,
          {
            name: productName,
          }
        );
        await stripe.prices.update(
          sub.items.price.id,
          {
            active: false,
          }
        );
        price = await stripe.prices.create({
          currency: 'usd',
          metadata: {
            number_of_boxes: newNum
          },
          product: prod.id,
          recurring: {
            interval: newTime,
            interval_count: 1,
          },
          unit_amount: newMon,
        });
        await stripe.subscriptions.update(
          sub.id,
          {
            items: [
              {price: price.id},
            ],
          }
        );
        }
      }
    } 
}

userService.version = '1.0.0';

Backendless.ServerCode.addService(userService);