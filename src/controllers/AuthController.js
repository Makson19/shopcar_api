const authService = require("../services/AuthService");

class AuthController {
  async login(req, res) {
    const data = await authService.login(req.body);
    return res.status(200).json({ data });
  }
}

module.exports = new AuthController();
