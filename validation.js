const Joi = require('joi');
const _ = require('lodash');

// Validation for Application Schema
exports.validateApplicationPayload = payload => {
    const now = Date.now();
    const cutoffDate = new Date(now - 1000 * 60 * 60 * 24 * 365 * 18);
    let validationOutput = {};
    let options = [];
    let optionsLowerCase = [];
    if (!payload.hasOwnProperty('affiliate_id')) {
        payload['affiliate_id'] = '';
    }
    if (!payload.hasOwnProperty('referred_by')) {
        payload['referred_by'] = '';
    }
    if (!payload.hasOwnProperty('ip')) {
        payload['ip'] = '';
    }

    if (payload.hasOwnProperty('first_name') && payload.hasOwnProperty('last_name')) {
        payload.first_name = payload.first_name.trim();
        payload.last_name = payload.last_name.trim();
        if (!payload.hasOwnProperty('middle_name')) {
            payload['middle_name'] = '';
        } else {
            payload.middle_name = payload.middle_name.trim();
        }
        options = getEmbossOptions(payload.first_name.trim(), payload.last_name.trim(), payload.middle_name);

        if (options && options.length > 0) {
            optionsLowerCase = options.map(o => o.toLowerCase());
        }
    }

    let schema = Joi.object({
        gender: Joi.string().valid('M', 'F', 'O'),
        first_name: Joi.string()
            .required('First name is required')
            .pattern(/^[a-zA-Z]+\s*[a-zA-Z]+$/)
            .min(2)
            .messages({
                'string.base': `"first_name" should be a type of 'text'`,
                'string.empty': `"first_name" cannot be an empty field`,
                'string.min': `"first_name" should have a minimum length of {#limit}`,
                'any.required': `"first_name" is a required field`,
                'string.pattern.base': `"first_name" should be alphabetics`,
            }),
        middle_name: Joi.string()
            .pattern(/^[a-zA-Z]+\s*[a-zA-Z]+$/)
            .allow('')
            .messages({
                'string.base': `"middle_name" should be a type of 'text'`,
                'string.empty': `"middle_name" cannot be an empty field`,
                'string.min': `"middle_name" should have a minimum length of {#limit}`,
                'any.required': `"middle_name" is a required field`,
                'string.pattern.base': `"middle_name" should be alphabetics`,
            }),
        last_name: Joi.string()
            .required()
            .min(2)
            .pattern(/^[a-zA-Z]+\s*[a-zA-Z]+$/)
            .messages({
                'string.base': `"last_name" should be a type of 'text'`,
                'string.empty': `"last_name" cannot be an empty field`,
                'string.min': `"last_name" should have a minimum length of {#limit}`,
                'any.required': `"last_name" is a required field`,
                'string.pattern.base': `"last_name" should be alphabetics`,
            }),
        emboss: Joi.string(),
        dob: Joi.date().max(cutoffDate).required().messages({
            'string.empty': `"dob"" cannot be an empty field`,
            'date.max': `"dob" is invalid.You must be 18 years old.`,
            'any.required': `dob"" is a required field`,
            'any.pattern': `"dob" should be alphabetics`,
        }),
        sin: Joi.string().allow(''),
        why_do_you_want_the_card: Joi.string()
            .valid('Rebuild your Credit', 'New to Canada', 'Want a rewards Credit Card')
            .allow(''),
        how_did_you_hear_about_us: Joi.string()
            .valid(
                'Mail Offer',
                'Friends or Family',
                'Email Offer Plastk',
                'Search Engine',
                'Online Banner Ad or Video',
                'Facebook Ad or Video',
                'Credit Card Comparisons',
                'Other'
            )
            .allow(''),
        street_address: Joi.string().required(),
        suite_number: Joi.string().allow(''),
        city: Joi.string().required(),
        province: Joi.string().required(),
        postal_code: Joi.string()
            .required()
            .min(6)
            .pattern(/([A-Za-z][0-9][A-Za-z][0-9][A-Za-z][0-9])+$/)
            .messages({
                'string.empty': `"postal_code"" cannot be an empty field`,
                'string.min': `"postal_code" is invalid.It must be at least {#limit} .`,
                'any.required': `postal_code"" is a required field`,
                'string.pattern.base': `"postal_code" should be a valid postal code`,
            }),
        phone_number: Joi.string()
            .required()
            .pattern(/\([0-9]{3}\)\s[0-9]{3}-[0-9]{4}/)
            .messages({
                'string.pattern.base': `"phone_number" should be a valid phone number`,
            }),
        email: Joi.string().required().email(),
        credit_limit: Joi.number().required().min(300).max(10000),
        other_house_income: Joi.string().allow(''),
        annual_salary_before_tax: Joi.number().required(),
        employment_status: Joi.string().valid('Employed', 'Self-Employed', 'Retired', 'Student', 'Unemployed'),
        current_employer: Joi.any().when('employment_status', {
            is: Joi.valid('Employed', 'Self-Employed'),
            then: Joi.string().required(),
            otherwise: Joi.optional(),
        }),
        industry: Joi.any().when('employment_status', {
            is: Joi.valid('Employed', 'Self-Employed'),
            then: Joi.string().required(),
            otherwise: Joi.optional(),
        }),
        mortgage: Joi.string().valid('Yes', 'No').allow(''),
        rent_on_mortgage: Joi.any().allow(''),
        employment_year: Joi.number().min(1).allow('').optional(),
        employment_month: Joi.number().min(1).allow('').optional(),
        job_description: Joi.any().when('employment_status', {
            is: Joi.valid('Employed', 'Self-Employed'),
            then: Joi.string().allow('').required(),
            otherwise: Joi.allow('').optional(),
        }),
        other_source: Joi.string().allow('').optional(),
        affiliate_id: Joi.string().allow('').optional(),
        referred_by: Joi.string().allow('').optional(),
        ip: Joi.string().allow('').optional(),
        hutk: Joi.string().allow('').optional(),
        card_type: Joi.number().valid(1, 2).allow(''),
    });
    const { error, value } = schema.validate(payload);
    let errorDetails = '';
    if (error && error.details && error.details.length > 0) {
        validationOutput.error = errorHelper(error.details);
    }
    if (payload.emboss) {
        if (!optionsLowerCase.includes(payload.emboss.toLowerCase())) {
            validationOutput.error = `"emboss" should be from the  [${options}]`;
        }
    } else {
        validationOutput.error = `"emboss" cant be empty`;
    }

    return validationOutput;
};

// Emboss Name Options Creator
const getEmbossOptions = (first_name, last_name, middle_name, submiteEmboss) => {
    let options = [];
    if (first_name !== '' && last_name !== '') {
        // first _ middle _ last
        if (
            first_name !== '' &&
            last_name !== '' &&
            middle_name !== '' &&
            middle_name.length > 1 &&
            (first_name + ' ' + middle_name + ' ' + last_name).length < 21
        ) {
            options.push(first_name + ' ' + middle_name + ' ' + last_name);
            // expectedEmboss=first_name + ' ' + middle_name + ' ' + last_name;
            // return (expectedEmboss==submiteEmboss)
        }

        // first (initial) _ middle (initial) _ last
        if (
            first_name !== '' &&
            last_name !== '' &&
            middle_name !== '' &&
            (_.capitalize(first_name.split('')[0]) + ' ' + _.capitalize(middle_name.split('')[0]) + ' ' + last_name)
                .length < 21
        ) {
            options.push(
                _.capitalize(first_name.split('')[0]) + ' ' + _.capitalize(middle_name.split('')[0]) + ' ' + last_name
            );
            // emboss="eb"
        }

        // first _ middle ( initial ) _ last
        if (
            first_name !== '' &&
            last_name !== '' &&
            middle_name !== '' &&
            (first_name + ' ' + _.capitalize(middle_name.split('')[0]) + ' ' + last_name).length < 21
        ) {
            options.push(first_name + ' ' + _.capitalize(middle_name.split('')[0]) + ' ' + last_name);
        }
        // first (initial) _ last
        if (
            first_name !== '' &&
            last_name !== '' &&
            (_.capitalize(first_name.split('')[0]) + ' ' + last_name).length < 21
        ) {
            options.push(_.capitalize(first_name.split('')[0]) + ' ' + last_name);
        }
        // first _ last
        if (first_name !== '' && last_name !== '' && (first_name + ' ' + last_name).length < 21) {
            options.push(first_name + ' ' + last_name);
        }
        if (last_name !== '' && middle_name !== '' && (middle_name + ' ' + last_name).length < 21) {
            options.push(middle_name + ' ' + last_name);
        }
    }

    return options;
};

// Default Error Helper
const errorHelper = details => {
    let errorDetails = '';
    details.forEach(element => {
        errorDetails = element.message + ' ';
    });

    return errorDetails;
};
