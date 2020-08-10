const express = require("express");
const router = express.Router();

const Order = require('../models/Order');
const OrderItem = require("../models/OrderItem");
const User = require('../models/User');
const Poll = require('../models/Poll');

const {getResponse, prepareOrderItems} = require('../helpers');

// GET
// returns all order itemss
router.get("/", async (req, res) => {
    try{
        let orderItems = await OrderItem.find();

        if(orderItems.length == 0){
            return res.status(200).json(getResponse([], 'Success'));
        }

        orderItems = await prepareOrderItems(orderItems);
        return res.status(200).json(getResponse(orderItems, 'Success'));
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

router.get('/:orderItemId', async (req, res) => {
    try{
        let orderItem = await OrderItem.findById(req.params.orderItemId);
        if(orderItem){
            orderItem = await prepareOrderItems([orderItem]);
            return res.status(200).json(getResponse(orderItem[0], 'Success'));
        } else {
            return res.status(404).json(getResponse(null, 'Not Found'));
        }
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
})

router.post('/', async (req, res,) => {
    if(!req.logged && req.user != 'admin'){
        return res.status(403).json(getResponse(null, 'Unauthorized'));
    }

    const {orderId, meal, quantity, note} = req.body;

    if(orderId == '' || meal == '' || quantity <= 0){
        return res.status(400).json(getResponse(null, 'Invalid input'));
    }

    try{
        let order = await Order.findById(orderId);
        if(!order){
            return res.status(404).json(getResponse(null, 'Not Found'));
        }

        if(!order.status){
            return res.status(400).json(getResponse(null, 'Order is not active anymore!'));
        }

        const orderItem = new OrderItem({
            orderId: orderId,
            user: req.user,
            meal: meal,
            quantity: quantity,
            note: note
        });

        let savedOrderItem = await orderItem.save();
        if(savedOrderItem){
            // save to user history object
            const user = await User.findById(req.userId);
            user.history.push(savedOrderItem._id);
            await user.save();

            // save to orderItemList in order
            order.orderItemList.push(savedOrderItem._id);
            await order.save();

            // prepare orderItem response
            savedOrderItem = await prepareOrderItems([savedOrderItem]);
            return res.status(200).json(getResponse(savedOrderItem[0], 'Success'));
        } else {
            return res.status(500).json(getResponse(null, 'Error while saving OrderItem'));
        }
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

router.put('/:orderItemId', async (req, res) => {
    if(!req.logged && req.user != 'admin'){
        return res.status(403).json(getResponse(null, 'Unauthorized'));
    }

    const {orderItemId} = req.params;
    
    try{
        let orderItem = await OrderItem.findById(orderItemId);
        // da li orderItem postoji
        if(!orderItem){
            return res.status(404).json(getResponse(null, 'Not Found'));
        }
        // da li user koji pokusava da edituje je user koji je napravio orderItem
        if(req.user != orderItem.user){
            return res.status(401).json(getResponse(null, 'Unauthorized'));
        }

        let order = await Order.findById(orderItem.orderId);
        // da li postoji order
        if(!order){
            return res.status(404).json(getResponse(null, 'Not Found'));
        }
        
        // da li je order aktivan
        if(!order.status){
            return res.status(400).json(getResponse(null, 'Order is not active anymore!'));
        }

        await orderItem.updateOne({...req.body});
        orderItem = await prepareOrderItems([orderItem]);
        return res.status(200).json(getResponse({...orderItem[0], ...req.body}, 'Success'));
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

router.delete('/:orderItemId', async (req, res) => {
    if(!req.logged && req.user != 'admin'){
        return res.status(403).json(getResponse(null, 'Unauthorized'));
    }

    // trebalo bi biti provere da li je Order aktivan, ako jeste onda moze da se izbrise, ako ne, nema smisla...
    const {orderItemId} = req.params;
    
    try{
        const orderItem = await OrderItem.findById(req.params.orderItemId);
        if(!orderItem){
            return res.status(404).json(getResponse(null, 'Not Found'));
        }

        // da li user koji je kreairao orderItem pokusava da izbrise orderItem
        if(req.user != orderItem.user){
            return res.status(401).json(getResponse(null, 'Unauthorized'));
        }

        // da li je order aktivan
        let order = await Order.findById(orderItem.orderId);
        if(!order.status){
            return res.status(400).json(getResponse(null, 'Order is not active anymore!'));
        }

        await orderItem.remove();

        // remove from order
        for(let i = 0; i < order.orderItemList.length; i++){
            if(order.orderItemList[i] == orderItemId){
                order.orderItemList.splice(i, 1);
                break;
            }
        }
        await order.save();

        // remove from user.history 
        let user = await User.findById(req.userId);
        for(let i = 0; user.history.length; i++){
            if(user.history[i]._id == orderItemId){
                user.history.splice(i, 1);
                break;
            }
        }
        await user.save();

        return res.status(200).json(getResponse(null, 'Success'));
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

module.exports = router;
