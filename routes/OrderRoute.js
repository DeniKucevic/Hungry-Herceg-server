const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const Poll = require('../models/Poll');

const {getResponse, prepareOrders, deleteOrderItems} = require('../helpers');

// GET
// returns all order items
router.get("/", async (req, res) => {
    const filter = req.query.status == 'true' ? true : false;

    try{
        let orders = await Order.find();
        orders = await orders.filter(order => {
            if(filter){
                return order.status == filter;
            } else {
                return order.status == filter && new Date().getDate() - 2 < new Date(order.createdAt).getDate()
            }
        });

        if(orders.length == 0){
            return res.status(200).json(getResponse([], 'Success'));
        }

        orders = await prepareOrders(orders);
        return res.status(200).json(getResponse(orders, 'Success'));
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

// GET
// returns one order found by id
router.get("/:orderId", async (req, res) => {
    try{
        let order = await Order.findById(req.params.orderId);
        if(order){
            order = await prepareOrders([order]);
            return res.status(200).json(getResponse(order[0], 'Success'));
        } else {
            return res.status(404).json(getResponse(null, 'Not Found'));
        }
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

//POST
//creates new order
router.post("/", async (req, res) => {
    if(!req.logged){
        return res.status(403).json(getResponse(null, 'Unauthorized'));
    }

    const {pollId, restaurantId} = req.body;

    if(pollId == '' || restaurantId == ''){
        return res.status(400).json(getResponse(null, 'Bad Request'));
    }

    // enrich
    const newOrder = new Order({
        pollId: pollId,
        restaurantId: restaurantId,
        createdAt: new Date().toISOString(),
        duration: 20,
        status: true,
        orderItemsList: []
    });
    try {
        const savedOrder = await newOrder.save();
        if(savedOrder){
            return res.status(200).json(getResponse(savedOrder, 'Success'));
        } else {
            return res.status(500).json(getResponse(null, 'Error while saving Order'));
        }
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

//edit
//change order by id
router.put("/:orderId", async (req, res) => {
    if(!req.logged){
        return res.status(403).json(getResponse(null, 'Unauthorized'));
    }

    try {
        let order = await Order.findById(req.params.orderId);
        if(!order){
            return res.status(404).json(getResponse(null, 'Not Found'));
        }
        const poll = await Poll.findById(order.pollId);
        if(req.user != poll.author){
            return res.status(403).json(getResponse(null, 'Unauthorized'));
        }
        if(!order.status){
            return res.status(400).json(getResponse(null, 'Order is not active anymore!'));
        }

        // everything ok, edit order
        await order.updateOne({ ...req.body });
        if(order){
            order = await prepareOrders([order]);
            return res.status(200).json(getResponse({ ...order[0], ...req.body }, 'Success'));
        } else {
            return res.status(404).json(getResponse(null, 'Error while editing poll'));
        }
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

// delete
router.delete("/:orderId", async (req, res) => {
    if(!req.logged){
        return res.status(403).json(getResponse(null, 'Unauthorized'));
    }

    try {
        const order = await Order.findById(req.params.orderId);
        // validacije
        if(!order){
            return res.status(404).json(getResponse(null, 'Not Found'));
        }
        const poll = await Poll.findById(order.pollId);
        if(req.user != poll.author){
            return res.status(403).json(getResponse(null, 'Unauthorized'));
        }
        if(!order.status){
            return res.status(400).json(getResponse(null, 'Order is not active anymore!'));
        }

        // deleting
        if(order.orderItemList.length != 0){
            await deleteOrderItems(order.orderItemList);
        }
        await order.remove();

        // izbrisi sve orderiteme iz user.history (a mozda i ne)
        return res.status(200).json(getResponse(null, 'Success'));
    } catch (err) {
        console.log(err);
    }
});

module.exports = router;
