const express = require("express");
const RoleManagementController = require('../controllers/admin/RoleManagementController');

const router = express.Router();

// Example: GET all roles
router.get("/roles", RoleManagementController.getAllRoles);

// Example: POST create role
router.post("/roles", RoleManagementController.createRole);

// Example: PUT update role
router.put("/roles/:roleId", RoleManagementController.updateRole);

// Example: DELETE delete role
router.delete("/roles/:roleId", RoleManagementController.deleteRole);

module.exports = router; // ✅ MUST EXPORT ROUTER
