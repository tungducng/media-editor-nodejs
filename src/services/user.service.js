const DB = require('../DB');

class UserService {
	static logUserIn({ username, password }) {
		if (this.validateUser(username, password)) {
			const user = this.findUserByUsername(username);
			const token = this.createSession(user.id);
			return { status: 200, token, message: 'Logged in successfully!' };
		} else {
			return { status: 401, message: 'Invalid username or password.' };
		}
	}

	static sendUserInfo = (req) => {
		const user = this.findCurrentUser(req);
		return { username: user.username, name: user.name };
	};

	static logUserOut = (req) => {
		// Remove the session object form the DB SESSIONS array
		const sessionIndex = req;

		if (sessionIndex > -1) {
			DB.sessions.splice(sessionIndex, 1);
			DB.save();
		}

		return { status: 200, message: 'Logged out successfully!' };
	};

    static updateUser = (req) => {
        const { username, name, password } = req.body;
      
        // Grab the user object that is currently logged in
       const user = this.findCurrentUser(req);

        if(username) user.username = username;
        if(name) user.name = name;
        if(password) user.password = password;
        DB.save();
      
       return {status: 200, username: user.username, name: user.name, password_status: password ? "updated" : "not updated"}
      };

    // Reuse functions from the previous UserService class
    static findCurrentUser = (req) => {
        DB.update();
        return DB.users.find((user) => user.id === req.userId);
    }

	static findSessionIndex = (req) => {
		DB.update();
		return DB.sessions.findIndex((session) => session.userId === req.userId);
	};

	static findUserByUsername = (username) => {
		DB.update();
		return DB.users.find((user) => user.username === username);
	};

	static validateUser = (username, password) => {
		const user = this.findUserByUsername(username);
		return user && user.password === password;
	};

	static createSession = (userId) => {
		// Generate a random 10 digit token
		const token = Math.floor(Math.random() * 10000000000).toString();

		// Save the generated token
		DB.sessions.push({ userId, token });
		DB.save();

		return token;
	};
}

module.exports = UserService;
