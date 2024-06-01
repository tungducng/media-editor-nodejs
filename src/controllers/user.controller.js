const UserService = require("../services/user.service");

class UserController {
	logUserIn(req, res) {
		const result = UserService.logUserIn(req.body);
		if (result.status === 200) {
			res.setHeader('Set-Cookie', `token=${result.token}; Path=/;`);
		}
		res.status(result.status).json({ message: result.message });
	}

	logUserOut(req, res) {
		const result = UserService.logUserOut(req);
		if (result.status === 200) {
			res.setHeader(
				'Set-Cookie',
				`token=deleted; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
			);
		}
		res.status(result.status).json({ message: result.message });
	}

    sendUserInfo(req, res) {
        const result = UserService.sendUserInfo(req);
        res.json(result);
    }

    updateUser(req, res) {
        const result = UserService.updateUser(req);
        res.status(result.status).json(result);
    }
}

module.exports = new UserController();
