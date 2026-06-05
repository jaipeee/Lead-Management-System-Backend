const { body,validationResult } = require('express-validator')

const leadValidator = [
    body('name').notEmpty().withMessage('Name is required'),
    body('source')
        .notEmpty()
        .isIn(['website', 'meta', 'google'])
        .withMessage('Source must be website, meta, or google'),
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number')
]

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

};


module.exports = { leadValidator, validate, }