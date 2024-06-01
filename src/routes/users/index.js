const express = require('express')
const router = express.Router()
const userController = require('../../controllers/user.controller')

router.post("/api/login", userController.logUserIn);
// Log a user out
router.delete("/api/logout", userController.logUserOut);
// Send user info
router.get("/api/user", userController.sendUserInfo);
// Update a user info
router.put("/api/user", userController.updateUser);

module.exports = router