const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// All routes are protected and admin-only
router.use(authenticateToken);
router.use(authorizeRole('admin'));

/**
 * @route   GET /api/employees
 * @desc    Get all employees with pagination and filters
 * @access  Private (Admin)
 */
router.get('/', employeeController.getAllEmployees);

/**
 * @route   GET /api/employees/:id
 * @desc    Get single employee by ID
 * @access  Private (Admin)
 */
router.get('/:id', employeeController.getEmployeeById);

/**
 * @route   POST /api/employees
 * @desc    Create new employee
 * @access  Private (Admin)
 */
router.post('/', employeeController.createEmployee);

/**
 * @route   PUT /api/employees/:id
 * @desc    Update employee
 * @access  Private (Admin)
 */
router.put('/:id', employeeController.updateEmployee);

/**
 * @route   DELETE /api/employees/:id
 * @desc    Delete employee
 * @access  Private (Admin)
 */
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
