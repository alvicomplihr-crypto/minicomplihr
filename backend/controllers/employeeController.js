const pool = require('../db');

/**
 * Get all employees
 * GET /api/employees
 * Admin only
 */
const getAllEmployees = async (req, res) => {
  try {
    const { branch_id, search, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT id, name, email, role, branch_id, created_at, updated_at
      FROM users
      WHERE role = 'employee'
    `;
    const values = [];
    let paramCount = 0;

    // Filter by branch_id
    if (branch_id) {
      paramCount++;
      query += ` AND branch_id = $${paramCount}`;
      values.push(branch_id);
    }

    // Search by name or email
    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      values.push(`%${search}%`);
    }

    // Add pagination
    paramCount++;
    query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
    values.push(parseInt(limit));

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    values.push(offset);

    const result = await pool.query(query, values);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM users WHERE role = 'employee'`;
    const countValues = [];
    let countParamCount = 0;

    if (branch_id) {
      countParamCount++;
      countQuery += ` AND branch_id = $${countParamCount}`;
      countValues.push(branch_id);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR email ILIKE $${countParamCount})`;
      countValues.push(`%${search}%`);
    }

    const totalResult = await pool.query(countQuery, countValues);
    const total = parseInt(totalResult.rows[0].count);

    res.status(200).json({
      success: true,
      data: {
        employees: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get all employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * Get single employee by ID
 * GET /api/employees/:id
 * Admin only
 */
const getEmployeeById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, name, email, role, branch_id, created_at, updated_at
       FROM users
       WHERE id = $1 AND role = 'employee'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        employee: result.rows[0],
      },
    });
  } catch (error) {
    console.error('Get employee by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * Create new employee
 * POST /api/employees
 * Admin only
 * Note: This creates a user with role='employee'
 */
const createEmployee = async (req, res) => {
  const { name, email, password, branch_id } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    // Hash password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new employee
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, branch_id)
       VALUES ($1, $2, $3, 'employee', $4)
       RETURNING id, name, email, role, branch_id, created_at`,
      [name, email.toLowerCase(), hashedPassword, branch_id || null]
    );

    const newEmployee = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: {
        employee: {
          id: newEmployee.id,
          name: newEmployee.name,
          email: newEmployee.email,
          role: newEmployee.role,
          branch_id: newEmployee.branch_id,
        },
      },
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * Update employee
 * PUT /api/employees/:id
 * Admin only
 */
const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { name, email, branch_id } = req.body;

  try {
    // Check if employee exists
    const existingEmployee = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = \'employee\'',
      [id]
    );

    if (existingEmployee.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    // Check email uniqueness if email is being updated
    if (email) {
      const emailExists = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), id]
      );

      if (emailExists.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use.',
        });
      }
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (name) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      values.push(name);
    }

    if (email) {
      paramCount++;
      updates.push(`email = $${paramCount}`);
      values.push(email.toLowerCase());
    }

    if (branch_id !== undefined) {
      paramCount++;
      updates.push(`branch_id = $${paramCount}`);
      values.push(branch_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.',
      });
    }

    paramCount++;
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND role = 'employee'
      RETURNING id, name, email, role, branch_id, updated_at
    `;

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully.',
      data: {
        employee: result.rows[0],
      },
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * Delete employee
 * DELETE /api/employees/:id
 * Admin only
 */
const deleteEmployee = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if employee exists
    const existingEmployee = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = \'employee\'',
      [id]
    );

    if (existingEmployee.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    // Soft delete or hard delete based on preference
    // Using hard delete here
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully.',
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
