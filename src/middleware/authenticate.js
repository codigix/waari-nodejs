const authenticate = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }

    if (req.accepts('json')) {
        return res.status(401).json({ error: 'Unauthorized' });
    } else {
        return res.redirect('/login');
    }
};

module.exports = authenticate;