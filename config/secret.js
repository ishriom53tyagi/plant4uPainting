module.exports = {
    database: '',
    port: process.env.PORT || 3000,
    secretKey: "#akshna#@hari#@bhari2019",

	 globalVariables: (req, res, next) => {
        res.locals.success_message = req.flash('success-message');
        res.locals.error_message = req.flash('error-message');              
        next();
    }
};