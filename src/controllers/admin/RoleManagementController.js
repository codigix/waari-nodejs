// controllers/admin/RoleManagementController.js
const supabase = require("../../database/supabaseClient"); // Supabase client

class RoleManagementController {
    // Fetch all roles
    static async getAllRoles(req, res) {
        try {
            const { data, error } = await supabase
                .from('roles')
                .select('*');

            if (error) throw error;

            res.status(200).json({ message: "Roles fetched successfully", roles: data });
        } catch (error) {
            res.status(500).json({ message: "Error fetching roles", error: error.message });
        }
    }

    // Create a new role
    static async createRole(req, res) {
        try {
            const { roleName } = req.body;
            if (!roleName) {
                return res.status(400).json({ message: "Role name is required" });
            }

            const { data, error } = await supabase
                .from('roles')
                .insert([{ name: roleName }])
                .select('*')
                .single();

            if (error) throw error;

            res.status(201).json({ message: "Role created successfully", role: data });
        } catch (error) {
            res.status(500).json({ message: "Error creating role", error: error.message });
        }
    }

    // Update an existing role
    static async updateRole(req, res) {
        try {
            const { roleId } = req.params;
            const { roleName } = req.body;
            if (!roleName) {
                return res.status(400).json({ message: "Role name is required" });
            }

            const { data, error } = await supabase
                .from('roles')
                .update({ name: roleName })
                .eq('id', roleId)
                .select('*')
                .single();

            if (error) throw error;

            res.status(200).json({ message: "Role updated successfully", role: data });
        } catch (error) {
            res.status(500).json({ message: "Error updating role", error: error.message });
        }
    }

    // Delete a role
    static async deleteRole(req, res) {
        try {
            const { roleId } = req.params;

            const { error } = await supabase
                .from('roles')
                .delete()
                .eq('id', roleId);

            if (error) throw error;

            res.status(200).json({ message: "Role deleted successfully", roleId });
        } catch (error) {
            res.status(500).json({ message: "Error deleting role", error: error.message });
        }
    }
}

module.exports = RoleManagementController;
