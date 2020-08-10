const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {getResponse, prepareUsers} = require('../helpers');

// 200 - Ok
// 201 - Created
// 204 - No Content
// 400 - Bad Req
// 401 - Unauthorized
// 404 - Not Found
// 500 - Server Error

// find
router.get('/', async (req, res) => {
    try{
        let users = await User.find();
        if(users.length == 0)
            return res.status(200).json(getResponse([], 'Success'));
        users = await prepareUsers(users);
        return res.status(200).json(getResponse(users, 'Success'));
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, 'Invalid id'));
    }
});

// get
router.get('/:userId', async (req, res) => {
    const {userId} = req.params;
    try{
        let user = await User.findById(userId);
        if(user){
            user = await prepareUsers([user]);
            return res.status(200).json(getResponse({ ...user[0], password: null }, 'Success'));
        } else {
            return res.status(400).json(getResponse(null, 'User does not exist'));
        }
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, 'Invalid id'));
    }
});

// create user
router.post('/', async (req, res) => {
     /*if(!req.logged && req.user == 'Admin'){
         return res.status(403).json(getResponse(null, 'Unauthorized'));
     }*/

    const {username} = req.body;
    const {password} = req.body

    // input check
    if(username === '' || password === ''){
        return res.status(400).json(getResponse(null, 'Invalid input'));
    }
    
    try{
        const userExist = await User.findOne({username: username})
        if(userExist){
            return res.status(200).json(getResponse(null, 'User already exist'));
        }
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }

    // da li je sve ovo moglo da se napise u jedan try/catch ili je ok ovako?
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 12);

        const user = new User({
            username: req.body.username,
            password: hashedPassword,
            history: []
        });

        const savedUser = await user.save();

        if(savedUser){
            // should I send 201 - Create status or just 200?
            return res.status(201).json(getResponse({...savedUser._doc, password: null}, 'Success'));
        } else {
            return res.status(500).json(getResponse(null, 'Error while saving user'));
        }
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

// login
router.post('/login', async (req, res) => {
    const {username} = req.body;
    const {password} = req.body

    try{
        // prvo pronalazimo usera
        const user = await User.findOne({username: username});
        if(!user){
            return res.status(401).json(getResponse(null, 'Wrong credentials'));
        }

        // proveravamo dali je password tacan
        const passwordMatch = await bcrypt.compare(password, user.password);
        if(passwordMatch){
            // pravimo token i saljemo
            const token = await jwt.sign({userId: user._id, username: user.username}, 'secretkey');
            return res.status(200).json(getResponse({
                token: token,
                userId: user._id,
                username: user.username
            }, 'Success'));
        } else {
            // ne valja input
            return res.status(401).json(getResponse(null, 'Wrong credentials'));
        }
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

router.delete('/:userId', async (req, res) => {
    if(!req.logged && req.user == 'Admin'){
        return res.status(403).json(getResponse(null, 'Unauthorized'));
    }

    if(!req.logged && req.user != 'admin'){
        return res.status(403).json(getResponse(null, 'Unauthorized'));
    }

    try{
        const deletedUser = await User.findByIdAndDelete(req.params.userId);
        if(deletedUser){
            return res.status(200).json(getResponse(null, 'Success'));
        } else{
            return res.status(404).json(getResponse(null, 'Not Found'));
        }
    } catch(err){
        console.log(err);
        return res.status(500).json(getResponse(null, err));
    }
});

module.exports = router;