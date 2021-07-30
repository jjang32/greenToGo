'use strict';

class boxes {
    /**
     * @param {String} locate
     * @param {String} serv
     * @param {Date} dueDate
     * @returns {String}
     */
    createBox(locate, serv, dueDate) {
        const curUser = Backendless.UserService.getCurrentUser();
        if(curUser.inventory === 0) {
            return 'Unable to check-in another box, please check-out one of your existing boxes.';
        }
        curUser.inventory -= 1;
        return Backendless.Data.of("Boxes").save({
            stripeID: curUser.stripeID,
            location: locate,
            service: serv,
            due: dueDate,
        });
    }
}

boxes.version = '1.0.0';

Backendless.ServerCode.addService(boxes);