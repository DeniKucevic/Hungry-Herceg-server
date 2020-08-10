const Poll = require('../models/Poll');
const Order = require('../models/Order');
const {getWinnerRestaurant} = require('../helpers');

const isEntityFinished = (entity, name) => {
    return new Promise((resolve, reject) => {
        const createdAt = new Date(entity.createdAt);
        const currentDate = new Date();
        // calculating time in seconds
        const requiredTime = createdAt.getMinutes() * 60 + createdAt.getHours() * 3600 + entity.duration * 60;
        const passedTime = currentDate.getMinutes() * 60 + currentDate.getHours() * 3600;

        // console.log(`${name} - ${entity.id}\npassedTime: ${passedTime / 60}\nrequiredTime: ${requiredTime / 60}\n`);
        // console.log(`${name} - ${entity.id}\npassedTime: ${currentDate.getHours()}:${currentDate.getMinutes() < 10 ? `0${currentDate.getMinutes()}` : currentDate.getMinutes()}\nrequiredTime: ${createdAt.getHours()}:${createdAt.getMinutes() < 10 ? `0${createdAt.getMinutes()}` : createdAt.getMinutes()}\n`);
        if(currentDate.getDate() > createdAt.getDate() ||
               passedTime >= requiredTime){
            // entity is finished
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

const createOrders = pollIds => {
    // sets Poll to unactive and creates Order
    return new Promise((resolve, reject) => {
        pollIds.forEach(async (id, i, arr) => {
            // update poll
            let dbPoll = await Poll.findById(id);
            await dbPoll.updateOne({status: false});

            // create order
            const winnerIndex = await getWinnerRestaurant(dbPoll.restaurants);
            const order = new Order({
                pollId: id,
                restaurantId: dbPoll.restaurants[winnerIndex].restaurantId,
                createdAt: new Date().toISOString(),
                duration: 20,
                status: true,
                orderItemList: []
            });
            await order.save();

            if(arr.length-1 == i){
                resolve('Success');
            }
        });
    });
}

const getFinishedPolls = polls => {
    // returns list of pollIds that are finished
    return new Promise((resolve, reject) => {
        let finishedPollIds = [];
        polls.forEach(async (poll, i, arr) => {
            const entityFinished = await isEntityFinished(poll, 'Poll');
            if(entityFinished){
                finishedPollIds.push(poll._id);
            }

            if(arr.length-1 == i){
                resolve(finishedPollIds);
            }
        });
    });
}

const getFinishedOrders = orders => {
    return new Promise((resolve, reject) => {
        let finishedOrderIds = [];
        orders.forEach(async (order, i, arr) => {
            const entityFinished = await isEntityFinished(order, 'Order');
            if(entityFinished){
                finishedOrderIds.push(order._id);
            }

            if(arr.length-1 == i){
                resolve(finishedOrderIds)
            }
        });
    });
}

const updateOrders = orderIds => {
    orderIds.forEach(async orderId => {
        const order = await Order.findById(orderId);
        await order.updateOne({status: false});
    });
}

module.exports = () => {
    // ends orders and polls automatically
    setInterval(async () => {
        try{
            let polls = await Poll.find();
            // get active polls
            polls = await polls.filter(poll => poll.status);
            
            if(polls.length != 0){
                const finishedPollIds = await getFinishedPolls(polls);
                if(finishedPollIds != 0){
                    await createOrders(finishedPollIds);
                }
            }

            // orders...
            let orders = await Order.find();
            orders = await orders.filter(order => order.status);

            if(orders.length != 0){
                const finishedOrders = await getFinishedOrders(orders);
                // mislim da je ovde promise nepotreban
                updateOrders(finishedOrders);
        }
        } catch(err){
            console.log(err);
        }
    }, 10000);
}