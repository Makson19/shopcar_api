const authService = require("../services/AuthService");

class AuthController {
  async login(req, res) {
    const token = await authService.login(req.body);
    return res.status(200).json({ token });
  }
}

module.exports = new AuthController();
