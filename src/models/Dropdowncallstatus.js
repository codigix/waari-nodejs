// models/DropdownCallStatus.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const DropdownCallStatus = {
  async getAll() {
    const { data, error } = await supabase
      .from('dropdowncallstatus')
      .select('*');

    if (error) throw new Error(error.message);
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('dropdowncallstatus')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message); // No rows found
    return data || null;
  },

  async create(data) {
    const { data: inserted, error } = await supabase
      .from('dropdowncallstatus')
      .insert([data])
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    return inserted.id;
  },

  async update(id, data) {
    const { error } = await supabase
      .from('dropdowncallstatus')
      .update(data)
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  },

  async delete(id) {
    const { error } = await supabase
      .from('dropdowncallstatus')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }
};

module.exports = DropdownCallStatus;
