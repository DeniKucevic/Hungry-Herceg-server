const router = require('express').Router();
const Restaurant = require('../models/Restaurant');
const {getResponse, prepareRestaurants, getMeals, deleteRestaurantMeals} = require('../helpers');

// router middleware

// find
router.get('/', async (req, res) => {
    try{
        let fetchedRestaurants = await Restaurant.find();
        
        if(fetchedRestaurants.length == 0){
            return res.status(200).json(getResponse([], 'Success'));
        }
        
        fetchedRestaurants = await prepareRestaurants(fetchedRestaurants);
        return res.status(200).json(getResponse([...fetchedRestaurants], 'Success'));
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, 'Server Error'));
    }
});

// get one
router.get('/:restaurantId', async (req, res) => {
    try{
        let restaurant = await Restaurant.findById(req.params.restaurantId);
        if(restaurant){
            restaurant = await prepareRestaurants([restaurant]);
            return res.json(getResponse(restaurant[0], 'Success'));
        } else {
            return res.status(404).json(getResponse(null, 'Not Found'));
        }
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

// create
router.post('/', async (req, res) => {
    if(!req.logged && req.user == 'Admin'){
        return res.status(403).json(getResponse(null, 'Unauthorized'));
    }

    if(req.body.name == '' || req.body.address == ''){
        return res.status(400).json(getResponse(null, 'Bad Request'));
    }
    
    const restaurant = new Restaurant({
        name: req.body.name,
        address: req.body.address,
        tags: req.body.tags,
        meals: []
    });

    try{
        let savedRestaurant = await restaurant.save();
        if(savedRestaurant){
            savedRestaurant = await prepareRestaurants([savedRestaurant]);
            return res.status(200).json(getResponse(savedRestaurant[0], 'Success'));
        } else {
            return res.status(500).json(getResponse(null, 'Error while saving restaurant'));
        }
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

// edit
router.put('/:restaurantId', async (req, res) => {
    if(!req.logged && req.user == 'Admin'){
        return res.status(403).json(getResponse(null, 'Unauthorized'));
    }

    try{
        let restaurant = await Restaurant.findOneAndUpdate({_id: req.params.restaurantId}, { ...req.body }, {useFindAndModify: false});
        if(restaurant){
            restaurant = await prepareRestaurants([restaurant]);
            return res.status(200).json(getResponse({ ...restaurant[0], ...req.body }, 'Success'));
        } else {
            return res.status(404).json(getResponse(null, 'Not Found'));
        }
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

// delete
router.delete('/:restaurantId', async (req, res) => {
    if(!req.logged && req.user == 'Admin'){
        return res.status(403).json(getResponse(null, 'Unauthorized'));
    }

    try{
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        if(!restaurant){
            return res.json(404).json(getResponse(null, 'Not Found'));
        }

        // deleting
        if(restaurant.meals != 0){
            await deleteRestaurantMeals(restaurant.meals);
        }
        await restaurant.remove();
        
        return res.status(200).json(getResponse(null, 'Success'));
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

module.exports = router;