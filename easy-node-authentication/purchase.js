module.exports = function(app, passport) {
	
	var braintree = require("braintree");
	var User = require("./app/models/user.js");
	
	var gateway = braintree.connect({
			environment:  braintree.Environment.Sandbox,
			merchantId:   'nk7x2kp3mhh4rk4f',
			publicKey:    'ddh8gn3ph9h4xs97',
			privateKey:   '37f19598d2c016dc5f13900396303b9b'
		});
	
	
	app.get('/purchase', function(req, res) {
		if(!req.isAuthenticated()) res.redirect('/login');
		
		gateway.clientToken.generate({}, function(err, response) {
			res.render("purchase.ejs", {
				token: response.clientToken,
				credits: req.user.credits,
				hasTransaction: false,
				transactionFailed: true,
				transaction: "",
			});
		});
		
	});
	
	app.post('/purchase', function(req, res) {
		
		if(!req.isAuthenticated()) res.redirect('/login');
		
		var chargeAmt = req.body.credit_number;
		
		var saleRequest = {
			amount: Math.floor(chargeAmt / 100) + "." + (chargeAmt % 100),
			paymentMethodNonce: req.body.payment_method_nonce,
			options: {
				submitForSettlement: true
			}
		};
		
		gateway.transaction.sale(saleRequest, function(err, result) {
			
			var transactionFailed = true;
			var transaction;
			if(err) {
				transaction = err;
			} else if(result.success) {
				transactionFailed = false;
				req.user.credits += parseInt(chargeAmt);
				req.user.save();
				transaction = result.transaction.id;
			} else {
				transaction = result.message;
			}
			
			gateway.clientToken.generate({}, function(err, response) {
				res.render("purchase.ejs", {
					token: response.clientToken,
					credits: req.user.credits,
					hasTransaction: true,
					transactionFailed: transactionFailed,
					transaction: transaction
				});
			});
		});
	});
}