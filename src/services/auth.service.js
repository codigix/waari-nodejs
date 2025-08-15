// app/AuthServices/authServiceAuthService.js
const jwt = require("jsonwebtoken");

class AuthService {
  constructor() {
    // Policies mapping can be stored here
    this.policies = {};
  }

  registerPolicies(policies) {
    // policies = { "ModelName": policyFunction }
    this.policies = policies;
  }

  // Middleware for authentication
  authenticate(req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
      }
      req.user = decoded;
      next();
    });
  }

  // Middleware for authorization based on a policy
  authorize(policyName) {
    return (req, res, next) => {
      const policy = this.policies[policyName];
      if (!policy) {
        return res.status(403).json({ message: "Policy not found" });
      }

      if (!policy(req.user, req)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    };
  }
}

module.exports = new AuthService();
