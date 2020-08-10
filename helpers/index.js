const OrderItem = require("../models/OrderItem");
const Meal = require('../models/Meal');
const Restaurant = require('../models/Restaurant');
const Poll = require('../models/Poll');

const getResponse = (data, message) => {
    return {
        message: message,
        data: data
    }
}

const deleteOrderItems = orderItemIds => {
    return new Promise((resolve, reject) => {
        orderItemIds.forEach((id, i, arr) => {
            OrderItem.findByIdAndRemove(id);

            if(arr.length-1 == i){
                resolve('Success');
            }
        });
    });
}

const prepareOrderItems = orderItems => {
    return new Promise(async (resolve, reject) => {
        if(orderItems.length == 0){
            resolve([]);
        } else {
            let newOrderItems = [];
            for(let i = 0; i < orderItems.length; i++){
                try{
                    if(orderItems[i].meal != null || orderItems[i].meal != undefined){
                        const meal = await Meal.findById(orderItems[i].meal);
        
                        newOrderItems.push({
                            ...orderItems[i]._doc,
                            meal: meal
                        });
                    } else {
                        newOrderItems.push(orderItems[i]._doc);
                    }
                } catch(err){
                    console.log(err);
                    reject(err);
                }
            };
            resolve(newOrderItems);
        }
    });
}   

const getOrderItemList = orderItemIds => {
    return new Promise(async (resolve, reject) => {
        try{
            if(orderItemIds.length == 0){
                resolve([]);
            }
            let orderItems = await OrderItem.find({_id: {$in: orderItemIds}});
            orderItems = await prepareOrderItems(orderItems);
            resolve(orderItems);
        } catch(err){
            console.log(err);
            reject(err);
        }
    });
}

const prepareOrders = orders => {
    // enrich order object orderItems and meals
    return new Promise(async (resolve, reject) => {
        let newOrders = [];
        for(let i = 0; i < orders.length; i++){
            try{
                // prepare data
                const orderItemList = await getOrderItemList(orders[i].orderItemList);
                let restaurant = await Restaurant.findById(orders[i].restaurantId);
                restaurant = await prepareRestaurants([restaurant]);
                const poll = await Poll.findById(orders[i].pollId);

                newOrders.push({
                    orderItemList,
                    poll: poll,
                    restaurant: restaurant[0],
                    _id: orders[i].id,
                    status: orders[i].status,
                    duration: orders[i].duration,
                    createdAt: orders[i].createdAt
                });
            } catch(err){
                console.log(err);
                reject(err);
            }
        }
        resolve(newOrders);
    });
}

const prepareUsers = users => {
    return new Promise(async (resolve, reject) => {
        let newUsers = [];
        for(let i = 0; i < users.length; i++){
            const orderItems = await getOrderItemList(users[i].history);

            newUsers.push({
                ...users[i]._doc,
                history: orderItems,
                password: null
            });
        }
        resolve(newUsers);
    });
}

const findVotedRestaurant = (votedRestaurants, dbRestaurantId) => {
    // returns true if user voted for this dbRestaurant
    return new Promise((resolve, reject) => {
        for(let i = 0; i < votedRestaurants.length; i++){
            if(votedRestaurants[i] == dbRestaurant){
                resolve(true);
            }
        }
        resolve(false);
    });
}

const didUserVote = (votes, userId) => {
    // returns true if user already voted
    return new Promise((resolve, reject) => {
        for(let i = 0; i < votes.length; i++){
            if(votes[i] == userId){
                resolve(true);
            }
        }
        resolve(false);
    });
}

const checkForVotes = (dbPollRestaurants, votedRestaurants, userId) => {
    // returns updated restaurant list with votes IF user didnt vote, IF user already voted returns 'Voted' string
    return new Promise(async (resolve, reject) => {
        let newRestaurants = [];
        for(let i = 0; i < dbPollRestaurants.length; i++){
            if(dbPollRestaurants[i].votes.length != 0){
                const userAlreadyVoted = await didUserVote(dbPollRestaurants[i].votes, userId);
                if(userAlreadyVoted){
                    resolve('Voted')
                }
            }       

            const match = await findVotedRestaurant(votedRestaurants, dbPollRestaurants[i].restaurantId);

            if(match){
                let restaurantVotes = dbPollRestaurants[i].votes;
                restaurantVotes.push(userId)
                newRestaurants.push({
                    restaurantId: dbPollRestaurants[i].restaurantId,
                    votes: restaurantVotes
                });
            } else {
                newRestaurants.push({
                    restaurantId: dbPollRestaurants[i].restaurantId,
                    votes: dbPollRestaurants[i].votes
                });
            }
        };
        resolve(newRestaurants);
    });
}

const preparePollRestaurants = restaurants => {
    return new Promise(async (resolve, reject) => {
        let newRestaurants = [];
        for(let i = 0; i < restaurants.length; i++){
            try{
                const dbRestaurant = await Restaurant.findById(restaurants[i].restaurantId);
                
                if(dbRestaurant){
                    newRestaurants.push({
                        restaurant: dbRestaurant._doc,
                        votes: restaurants[i].votes
                    });
                }
            } catch(err){
                console.log(err);
                reject(err);
            }
        };
        resolve(newRestaurants);
    });
}

const preparePolls = polls => {
    // returns ._doc of poll and gets restaurants
    return new Promise(async (resolve, reject) => {
        let newPolls = [];
        for(let i = 0; i < polls.length; i++){
            try{
                if(polls[i].restaurants.length == 0){
                    newPolls.push(polls[i]._doc);
                } else {
                    const pollRestaurants = await preparePollRestaurants(polls[i].restaurants);
                    
                    newPolls.push({
                        ...polls[i]._doc,
                        restaurants: pollRestaurants
                    });
                }
            } catch(err){
                console.log(err);
                reject(err);
            }
        };
        resolve(newPolls);
    });
}

const deleteRestaurantMeals = mealIds => {
    return new Promise((resolve, reject) => {
        // I dont need async because theres no need to wait for that data
        mealIds.forEach((id, i, arr) => {
            Meal.findByIdAndRemove(id);

            if(arr.length-1 == i){
                resolve('Success');
            }
        });
    });
}

const getDocMeals = async meals => {
    // returns ._doc of object
    return new Promise((resolve, reject) => {
        let newMeals = [];
        for(let i = 0; i < meals.length; i++){
            newMeals.push(meals[i]._doc);
        }
        resolve(newMeals);
    })
}

const getMeals = async mealIds => {
    return new Promise(async (resolve, reject) => {
        try{
            // the query will ensure I get only meals with the provided list of ids
            const meals = await Meal.find({_id: {$in: mealIds}});

            if(meals.length == 0){
                resolve([]);
            }

            const filteredMeals = await getDocMeals(meals);
            resolve(filteredMeals);
        } catch(err){
            console.log(err);
            reject(err);
        }
    });
}

const prepareRestaurants = restaurants => {
    // fill meals object with meals
    return new Promise(async (resolve, reject) => {
        let newRestaurants = [];
        for(let i = 0; i < restaurants.length; i++){
            try{
                if(restaurants[i] != null){
                    const meals = await getMeals(restaurants[i].meals);
                    
                    newRestaurants.push({
                        ...restaurants[i]._doc,
                        meals
                    });
                } else {
                    newRestaurants.push('Doesnt exist');
                }
            } catch(err){
                console.log(err);
                reject(err);
            }
        }
        resolve(newRestaurants);
    });
}

const getWinnerRestaurant = restaurants => {
    return new Promise((resolve, reject) => {
        const votes = restaurants.map(r => r.votes.length);
        let maxIndex = 0;
        for(let i = 1; i < votes.length; i++){
            if(votes[i] > votes[maxIndex]){
                maxIndex = i;
            }
        }
        resolve(maxIndex);
    });
}

module.exports = {
    getResponse,
    preparePolls,
    checkForVotes,
    prepareOrders,
    prepareOrderItems,
    getOrderItemList,
    deleteOrderItems,
    prepareRestaurants,
    getMeals,
    deleteRestaurantMeals,
    prepareUsers,
    getWinnerRestaurant
}