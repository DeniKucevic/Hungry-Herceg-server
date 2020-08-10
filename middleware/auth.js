const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if(!authHeader){
        req.logged = false;
        return next();
    }

    const token = authHeader.split(' ')[1];
    if(!token){
        req.logged = false;
        return next();
    }

    let decodedToken;
    try{
        decodedToken = jwt.verify(token, 'secretkey');
    } catch(err){
        console.log(err);
    }
    if(!decodedToken){
        req.logged = false;
        return next();
    }

    req.user = decodedToken.username;
    req.userId = decodedToken.userId;
    req.logged = true;
    next();
}