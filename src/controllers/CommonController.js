// src/controllers/CommonController.js
const axios = require('axios');
const supabase = require('../database/supabaseClient');

class CommonController {
    // Check token and permissions
    static async checkToken(token, listId) {
        try {
            if (!token) return { status: 408, message: 'Token is required' };

            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('token', token)
                .eq('status', 1)
                .single();

            if (userError || !user) return { status: 408, message: 'Invalid Token' };

            const { data: userWithPermissions, error: permError } = await supabase
                .from('users')
                .select('*, permissions!inner(listId)')
                .eq('token', token)
                .in('permissions.listId', [listId])
                .single();

            if (permError || !userWithPermissions)
                return { status: 403, message: 'No access permission for this' };

            return userWithPermissions;
        } catch (error) {
            return { status: 500, message: error.message };
        }
    }

    // Validate token
    static async token(token) {
        if (!token) return [];
        const { data, error } = await supabase
            .from('influencersaffiliates')
            .select('*')
            .eq('token', token)
            .single();
        if (error || !data) return [];
        return data;
    }

    // Generate guest ID
    static generateGuestId(firstName, lastName) {
        const f = firstName.substring(0, 2).toUpperCase();
        const l = lastName.substring(0, 2).toUpperCase();
        return `${f}${l}${Math.floor(1000 + Math.random() * 9000)}S`;
    }

    // Token check
    static async tokenCheck(token) {
        if (!token) return [];
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('token', token)
            .single();
        if (error || !data) return [];
        return data;
    }

    // Send WhatsApp message
    static async whatsAppMessageSend(jsonData) {
        try {
            const apiKey = process.env.WHATSAPP_API;
            if (!apiKey) throw new Error('WhatsApp API key not set');

            const response = await axios.post(
                'https://api.interakt.ai/v1/public/message/',
                jsonData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Basic ${apiKey}`,
                    },
                }
            );
            return response.data;
        } catch (error) {
            return { status: 400, message: error.message };
        }
    }
}

module.exports = CommonController;
