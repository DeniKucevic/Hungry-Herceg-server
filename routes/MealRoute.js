const router = require('express').Router();
const Meal = require('../models/Meal');
const Restaurant = require('../models/Restaurant');

const {getResponse} = require('../helpers/index');

// find
router.get('/', async (req, res) => {
    try{
        const meals = await Meal.find();
        return res.status(200).json(getResponse(meals, 'Success'));
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

// get one
router.get('/:mealId', async (req, res) => {
    const {mealId} = req.params;
    try{
        const meal = await Meal.findById(mealId);
        if(meal){
            return res.status(200).json(getResponse(meal, 'Success'));
        } else {
            return res.status(404).json(getResponse(null, 'Not Found'))
        }
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

router.post('/', async (req, res) => {
    if(!req.logged && req.user == 'Admin'){
        return res.status(401).json(getResponse(null, 'Unauthorized'));
    }

    const {name, price, tag, restaurantId} = req.body;
    if(name == '' || tag == ''){
        return res.status(400).json(getResponse(null, 'Bad Request'));
    }
    
    try{
        const meal = new Meal({
            restaurantId: restaurantId,
            name: name,
            price: price,
            tag: tag
        });
        
        // save to db
        const savedMeal = await meal.save();
        
        if(savedMeal){
            // add to restaurant
            let restaurant = await Restaurant.findById(restaurantId);
            restaurant.meals.push(savedMeal.id);
            await restaurant.save();

            return res.status(200).json(getResponse(savedMeal._doc, 'Success'));
        } else {
            return res.status(500).json(getResponse(null, 'Error while saving meal to db'));
        }
        // send result
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

// edit
router.put('/:mealId', async (req, res) => {
    if(!req.logged && req.user == 'Admin'){
        return res.status(401).json(getResponse(null, 'Unauthorized'));
    }

    const {name, price, tag} = req.body;
    if(name == '' || tag == ''){
        return res.status(400).json(getResponse(null, 'Bad Request'));
    }
    
    try{
        const id = req.params.mealId;
        const meal = await Meal.findOneAndUpdate({_id: id}, { ...req.body }, {useFindAndModify: false});
        if(meal){
            return res.status(200).json(getResponse({ ...meal._doc, ...req.body }, 'Success'));
        } else {
            return res.status(404).json(getResponse(null, 'Not Found'));
        }
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

// delete
router.delete('/:mealId', async (req, res) => {
    if(!req.logged && req.user == 'Admin'){
        return res.status(401).json(getResponse(null, 'Unauthorized'));
    }

    try{
        const deletedMeal = await Meal.findByIdAndDelete(req.params.mealId);
        if(deletedMeal){
            // remove from restaurant
            let restaurant = await Restaurant.findById(deletedMeal.restaurantId);
            for(let i = 0; i < restaurant.meals.length; i++){
                if(restaurant.meals[i] == deletedMeal.id){
                    restaurant.meals.splice(i, 1);
                    break;
                }
            }
            await restaurant.save();

            return res.status(200).json(getResponse(null, 'Success'));
        } else {
            return res.status(404).json(getResponse(null, 'Not Found'));
        }
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

module.exports = router;