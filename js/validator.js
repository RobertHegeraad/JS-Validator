var Validator = {

	_config: {
		validateOn: 'submit',	// Validate the form on either 'submit', 'keyup' or 'blur'
		disableSubmit: false,	// If set to true, the submit button will be disabled and only enabled when all the required fields are succesful
		customMessages: {},		// Holds the custom messages that the user has set for each field
		customRules: {}			// Holds the custom rule for the user
	},

	// Alle the error messages for the rules, :field will be replaced by the field name and :ruleValue by the rule's parameter
	_messages: {
		required: 'The :field field is :ruleValue',
		int: 'The :field field can only contain whole numbers',
		numeric: 'The :field field can only contain numbers',
		decimal: 'The :field field can only contain decimal numbers',
		alpha: 'The :field field can only contain letters',
		alpha_num: 'The :field field can only contain letters and numbers',
		min: 'This value is too low',
		max: 'This value is too high',
		length: 'This value must be :parameter characters long',
		minLength: 'This value must be atleast :parameter characters long',
		maxLength: 'This value cannot be longer than :parameter characters',
		email: 'This is not a valid email address',
		url: 'This is not a valid URL',
		in: 'This value is not allowed',
		not_in: 'This value is not allowed',
		between: 'This value does not meet the requirements',
		exact: 'The value must be exactly :parameter',
		equal: 'The value must equal :parameter',
		day: 'This is not a valid day',
		month: 'This is not a valid month',
		year: 'This is not a valid year',
		date: 'The is not a valid date',
		image: 'This is not an image',
		size: 'This file is too big',
		mime: 'The file type is not allowed',
		different: 'This value cannot match the value from the :parameter field',
		same: 'This does not match the :parameter field',
		default: 'Something went wrong with this field'
	},

	// Holds all the allowed mime types that will be used with the mime: rule
	_mimeTypes: {
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		png: 'image/png',
		txt: 'text/plain',
		pdf: 'application/pdf',
		zip: 'application/zip',
		rar: 'application/x-rar-compressed'
	},

	// Some rule require extra attention
	_special: {
		same: {},		// Holds the names of the fields that should be the same, if one changes the field with the same parameter will be cleared
		different: {},	// Holds the names of the fields that should be different, if one changes the field with the different parameter will be cleared
		allow: {},		// Holds the allowed character type for the fields, this will be checked on keydown to prevent non allowed characters from being typed
		strength: {},	// Holds the names of the fields that have a value strength meter
		remaining: {},	// Holds the names of the fields that should show how many characters are remaining for the field
		preview: {}		// Holds the names of the fields that should show a preview of the value
	},

	
	_errors: {},		// Holds the error message for every field and the HTML element that holds the error

	
	_rules: {},			// Holds all the rules for each field
	
	
	_requiredFields: [],// Holds all the names for the required fields


	_form: undefined,	// Holds the form for the validation
	_fields: {},		// Holds all the fieds
	_submit: undefined,	// Holds the submit button, used for enabling and disabling the submit option for the form


	/**
	 * Sets the rules and options and creates the event listeners for all the fields
	 *
	 * @param id The form ID
	 * @param rules Object containing the names of the fields and the rules for those fields
	 * @param options Object containing extra options for the validation process
	 */
	set: function(id, rules, options) {
		var self = this;
		
		self._form = document.getElementById(id);

		rules = rules || {};
		options = options || {};

		// Combine the config with the user provided options
		self._extend(self._config, options);

		// Combine the rules with the inlineRules
		self._extend(rules, self._getInlineRules());

		// Parse the rules
		self._rules = self._parseRules(rules);


		// Does the form exist?
		if(self._form) {

			// Put the fields in a key value object so they are easily accessible
			var fields = self._form.elements;
			for(var i=0; i<fields.length; i++) {
				var field = fields[i];

				if(field.name in self._rules && field.type != 'submit' && field.type != 'file') {

					// Create the field object containing the rules, the error message and the reference to the element itself
					self._fields[field.name] = {
						rules: self._rules[field.name],
						error: false,
						element: field
					}


					// When to validate
					var on = self._config.validateOn;
					if(field.type == 'checkbox' || field.type == 'radio' || field.type == 'file') {
						field.addEventListener('change', function(e) {
							var o = {};
							o[this.name] = self._fields[this.name];
							self._validate(o);
						});
					} else {
						field.addEventListener('blur', function(e) {
							var o = {};
							o[this.name] = self._fields[this.name];
							self._validate(o);
						});
					}

					if(self._config.keyup) {
						var timer;
						field.addEventListener('keyup', function(e) {
							var name = this.name;
							clearTimeout(timer);
							timer = setTimeout(function() {
								var o = {};
								o[name] = self._fields[name];
								self._validate(o);
							}, 1000);
						});
					}
				}
			}

			console.log('All fields in the form');
			console.log(self._fields);


			


			/* ----------------------------------------------------------------------- */


			self._submit = self._form.querySelector("[type=submit]");

			// Does the submit button need to be disabled?
			if(self._submit.hasAttribute('disabled')) {
				self._config.disableSubmit = true;
			} else if(self._config.disableSubmit) {
				self._submit.setAttribute('disabled', 'disabled');
			}


			// Add the form submit event listener
			self._form.addEventListener('submit', function(e) {
				e.preventDefault();

				// Validate every rule for each field
				self._validate(self._fields, true);
			});
		}
	},


	/** -----------------------------------------------------------------------------------------------------
	 * Validate all the passed rules for each field, when the config.validateOn is set to 'keyup' or
	 * 'blur' only the rules for the field that had the event are passed
	 */
	_validate: function(fields, submit) {
		var self = this,
			validation = true;

		submit = submit || false;

		console.log('Fields to be validated');
		console.log(fields);

		for(var name in fields) {
			var field = fields[name];

			validation = true;

			if(field.rules) {
				console.log('validating ' + name);

				field.element.value = field.element.value.trim();

				for(var rule in field.rules) {
					var parameters = field.rules[rule];


					console.log(rule);

					if(typeof self['_' + rule] == 'function') {	// Check if the validator rule function exists
						validation = self['_' + rule](field, rule, parameters);
					}

					// Stop validating the current field if one rule failed
					if( ! validation) {
						console.log(name + ' validation failed at rule: ' + rule);

						field.error = self._parseError(field, rule, parameters);

						self._placeError(field);
						self._setFailClass(field);
						self._disableSubmit();

						field.validated = false;

						// Calls the error callback if it is set
						self._error(field);

						break;
					}
				}

				// If the field was successfuly validated
				if(validation) {
					console.log(name + ' validation success');
					
					self._removeError(field);
					self._setSuccessClass(field);

					field.validated = true;
				}
			}
		}

		if(self._formValidated()) {
			self._enableSubmit();
		}

		// If either the submit button was pressed or all the fields are successfully validated, continue with the success or fail functions
		if(submit && self._formValidated()) {
			// console.log(self._formValidated());
			if( ! validation) {
				self._fail();	// Calls the fail callback if it is set
			} else {
				self._success();	// Calls the success callback if it is set
			}
		}
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Check each field if it is validated
	 */
	_formValidated: function() {
		var validated = true;
		
		for(name in this._fields) {
			if( ! this._fields[name].validated) {
				validated = false;
				break;
			}
		}

		return validated;
	},


	/** -----------------------------------------------------------------------------------------------------
	 * Looks for an element with the data attribute error set to the name of the field
	 * If found it places the error in the element
	 */
	_placeError: function(field) {
		// Does the field already have an error element?
		if((element = document.querySelector("[data-error=" + field.element.name + "]")) != null) {
			element.innerHTML = field.error;
		}
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Looks for an element with the data attribute error set to the name of the field
	 * If found it clears the value of the element, removing the error from the screen
	 */
	_removeError: function(field) {
		if((element = document.querySelector("[data-error=" + field.element.name + "]")) != null) {
			element.innerHTML = '';
		}
	},


	/** -----------------------------------------------------------------------------------------------------
	 * Gets the inline rules for every field if the data-validation attribute is set
	 * It returns an object with rules for the fields that will overwrite the rules that were set with the set() method
	 */
	_getInlineRules: function() {
		var self   = this,
			rules  = {},
			field;

		for(name in self._fields) {
			field = self._fields[name];

			if(field.element.hasAttribute('data-validation')) {
				rules[name] = self._fields[name].getAttribute('data-validation');
			}
		}

		return rules;
	},


	/* START PARSE FUNCTIONS --------------------------------------------- */


	/** -----------------------------------------------------------------------------------------------------
	 * Splits the enitre rules string at every rule en parses the parameters for each rule
	 *
	 * The following example shows how the rules for a field called profile_image will be returned
	 *
	 * profile_image: 'required|size:500000|mime:jpg,png'
	 *
	 * will return
	 *
	 * profile_image: {
	 * 		required: true,
	 * 		size: 500000,
	 *		mime: ['jpg', 'png']
	 * }
	 *
	 * @param rules Object containg field names and the rule strings
	 */
	_parseRules: function(rules) {

		var self = this,
			rule,
			parameters,
			rulesObject = {};

		for(var field in rules) {

			rulesObject[field] = {};

			// Move the required rule infront of the string and remove any trailing | symbols
			if(rules[field].match(/required/)) {
				rules[field] = ('required|' + rules[field].replace(/required(\|)?/, '')).replace(/\|+$/, "");
			}

			// Place the enable rule to the back of the string
			if(rules[field].match(/enable:[a-zA-Z_]+/)) {
				var enableString = rules[field].match(/enable:[a-zA-Z_]+/);
				rules[field] = (rules[field].replace(/enable:[a-zA-Z_]+(\|)?/, '')).replace(/\|+$/, "") + '|' + enableString[0];
			}

			rulesArray = rules[field].split('|');

			for(var i=0; i<rulesArray.length; i++) {

				var o = {};
				rule = rulesArray[i].split(':');
				parameters = (rule[1]) ? rule[1].split(',') : true;
				
				rulesObject[field][rule[0]] = parameters;
			}
		}

		// Add the custom rules to the validator object
		for(rule in self._config.customRules) {
			self['_' + rule] = self._config.customRules[rule];
		}

		return rulesObject;
	},


	/** -----------------------------------------------------------------------------------------------------
	 * Get the error message that belongs to the rule that failed the validation,
	 * if a custom rule is set for the field that will be used
	 *
	 * Also checks if the field has the data attribute display set,
	 * if so that value will be used for the field name in the error message
	 *
	 * Finally replace the placeholders :field and :ruleValue with the correct values
	 */
	_parseError: function(field, rule, parameter) {
		var self = this,
			error = '',
			name;

		error = (self._messages[rule]) ? self._messages[rule] : self._messages.default;

		// // If a custom message exist for this field and rule, overwrite the error message
		if(self._config.customMessages[field.element.name]) {
			if(self._config.customMessages[field.element.name][rule]) {
				error = self._config.customMessages[field.element.name][rule];
			}
		}


		// Does this field have a data-display property that holds a pretty field name?
		name = (field.element.dataset.display) ? field.element.dataset.display : field.element.name;

		return error.replace(':field', name).replace(':ruleValue', rule).replace(':parameter', parameter[0]);
	},


	/** -----------------------------------------------------------------------------------------------------
	 * Add the .validation-success class to the field and remove the .validation-failed class if it exists
	 */
	_setSuccessClass: function(field) {
		// Check if field already has the class
		if( ! /\bvalidation-success\b/.test(field.element.className)) {
			field.element.className = field.element.className.replace(' validation-failed','') + ' validation-success';
		}
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Add the .validation-failed class to the field and remove the .validation-success class if it exists
	 */
	_setFailClass: function(field) {
		if( ! /\bvalidation-failed\b/.test(field.element.className)) {
			field.element.className = field.element.className.replace(' validation-success','') + ' validation-failed';
		}
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Clears the value, remove the .validation-success class from the field and
	 * remove the corresponding error message for the field
	 */
	_clearField: function(field) {
		field.validated = false;
		field.element.value = '';
		this._removeError(field);
		field.element.className = field.element.className.replace(' validation-success','');
		field.element.className = field.element.className.replace(' validation-error','');
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Enable a field
	 */
	_enableField: function(field) {
		field.element.removeAttribute('disabled');
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Disable a field
	 */
	_disableField: function(field) {
		console.log(field.element);
		field.element.setAttribute('disabled', 'disabled');
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Enable the submit button
	 */
	_enableSubmit: function() {
		if(this._config.disableSubmit) {
			this._submit.removeAttribute('disabled');
		}
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Disable the submit button
	 */
	_disableSubmit: function() {
		if(this._config.disableSubmit) {
			this._submit.setAttribute('disabled', 'disabled');
		}
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Called when no errors exist and all the required fields are filled in
	 *
	 * If a success callback function is set it will be called and all the field values will be passed,
	 * if the success callback returns true the form will be submitted
	 *
	 * If there is no success callback set, submit the form right away
	 */
	_success: function() {
		var self = this;

		if(typeof self._config.success == 'function') {
			var values = {};
			
			// Collect the values from the form fields and pass them to the success callback
			for(var name in self._fields) {
				values[name] = self._fields[name].element.value;
			}

			if(self._config.success(values)) {
				self._form.submit();
			}
		} else {
			self._form.submit();
		}
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Called when the form contains errors
	 *
	 * If a fail callback function is set all the errors will be passed to that function
	 */
	_fail: function() {
		var self = this;

		if(typeof self._config.fail == 'function') {
			var errors = {};
			
			// Collect the values from the form fields and pass them to the success callback
			for(var name in self._fields) {
				errors[name] = self._fields[name].error;
			}

			self._config.fail(errors);
		}
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Called when an error occurs
	 *
	 * If an error callback function is set all the errors will be passed to that function
	 */
	_error: function(field) {
		var self = this;

		if(typeof self._config.error == 'function')
			self._config.error(field);
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Extend the given object with all the properties in passed in object
	 *
	 * @param target The object containing the properties that will be overwritten
	 * @param needle The object containing the properties that will overwrite
	 */
	_extend: function(target, source) {
		var self = this;

	    target = target || {};
		
		for (var prop in source) {
			target[prop] = source[prop];
		}
		return target;
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Returns the length of an object
	 *
	 * @param o The object to return the length for
	 */
	_objLength: function(o) {
	    var c = 0;

	    for(var p in o) {
	        if(o.hasOwnProperty(p))
	            ++c;
	    }

	    return c;
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Checks if an array has a value
	 *
	 * @param array The array to check
	 * @param needle The value to search for
	 */
	_has: function(array, needle) {
		return (new RegExp('(' + array.join('|').replace(/\./g, '\\.') + ')$')).test(needle);
	},


	/* START VALIDATIONS ---------------------------------------------------- */


	/**
	 * Checks if the value for the field in not empty
	 *
	 * The required rule will be checked first regardless of what order the rules are in
	 *
	 * Usage: required
	 */
	_required: function(field, rule, parameters) {
		var self = this;

		if(field.element.type == 'checkbox') {
			if(field.element.checked)
				return true;

			return false;
		} else {
			if(field.element.value == null || field.element.value == "")
				return false;


			return true;
		}
	},

	/**
	 * Checks if the value for the field is an integer value
	 *
	 * Usage: int
	 */
	_int: function(field) {
		return /^\d+$/.test(field.element.value);
	},

	/**
	 * Checks if the value for the field consists of only numbers
	 *
	 * Usage: numeric
	 */
	_numeric: function(field) {
		return /^[0-9]+(\.[0-9]{1,2})?$/.test(field.element.value);
	},

	/**
	 * Checks if the value for the field is a decimal value
	 *
	 * Usage: decimal
	 */
	_decimal: function(field) {
		return /^[0-9]+\.[0-9]{1,2}?$/.test(field.element.value);
	},

	/**
	 * Checks if the value for the field consists of only letters
	 *
	 * Usage: alpha
	 */
	_alpha: function(field) {
		return /^[a-zA-Z]*$/.test(field.element.value);
	},

	/**
	 * Checks if the value for the field consists of only letters and numbers
	 *
	 * Usage: alpha_nums
	 */
	_alpha_num: function(field) {
		return /^[a-zA-Z0-9_]*$/.test(field.element.value);
	},


	/**
	 * Checks if the value for the field is not lower than the given value
	 *
	 * Usage: min:5
	 */
	_min: function(field, rule, parameters) {
		return (+field.element.value >= +parameters);
	},

	/**
	 * Checks if the value for the field is not higher than the given value
	 *
	 * Usage: max:10
	 */
	_max: function(field, rule, parameters) {
		return (+field.element.value <= +parameters);
	},

	/**
	 * Checks if the value for the field is of a certain length
	 *
	 * Usage: length:6
	 */
	_length: function(field, rule, parameters) {
		return (field.element.value.split('').length == parameters);
	},

	/**
	 * Checks if the value for the field is atleast a minimum amount of characters
	 *
	 * Usage: minLength:4
	 */
	_minLength: function(field, rule, parameters) {
		return (field.element.value.split('').length >= parameters);
	},

	/**
	 * Checks if the value for the field does not exceed a maximum length of characters
	 *
	 * Usage: maxLength:10
	 */
	_maxLength: function(field, rule, parameters) {
		return (field.element.value.split('').length <= parameters);
	},

	/**
	 * Checks if the value for the field is an email address
	 *
	 * Usage: email
	 */
	_email: function(field) {
		return /^[a-zA-Z0-9.!#$%&amp;'*+\-\/=?\^_`{|}~\-]+@[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*$/.test(field.element.value);
	},

	/**
	 * Checks if the value for the field is a URL
	 *
	 * Usage: url
	 */
	_url: function(field) {
		return /^((http|https):\/\/(\w+:{0,1}\w*@)?(\S+)|)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/.test(field.element.value);
	},

	/**
	 * Checks if the value for the field is in the list of passed values
	 *
	 * List of values can be strings, numbers or both
	 *
	 * Usage: in:1,2,3 OR in:hello,world OR in:1,2,hello
	 */
	_in: function(field, rule, parameters) {
		return (new RegExp('(' + parameters.join('|').replace(/\./g, '\\.') + ')$')).test(field.element.value.toLowerCase());
	},

	/**
	 * Checks if the value for the field is not in the list of passed values
	 *
	 * List of values can be strings, numbers of both
	 *
	 * Usage: not_in:1,2,3 OR not_in:hello,world OR not_in:1,2,hello
	 */
	_not_in: function(field, rule, parameters) {
		return ! (new RegExp('(' + parameters.join('|').replace(/\./g, '\\.') + ')$')).test(field.element.value.toLowerCase());
	},

	/**
	 * Checks if the value for the field in between the two passed in numbers not including both
	 *
	 * Usage: between:1,10
	 */
	_between: function(field, rule, parameters) {
		var value = +field.element.value,
			min = +parameters[0],
			max = +parameters[parameters.length-1];

		if(value > min && value < max)
			return true;

		return false;
	},

	/**
	 * Checks if the value for the field is equal to the value that is passed in
	 *
	 * Usage: equal:string
	 */
	_equal: function(field, rule, parameters) {
		return (field.element.value.toLowerCase() === parameters);
	},

	/**
	 * Checks if the value for the field is not equal to the value that is passed in
	 *
	 * Usage: not_equal:string
	 */
	_not_equal: function(field) {
		return (field.element.value.toLowerCase() !== parameters);
	},

	/**
	 * Checks if the value is a valid day number, e.g. 1-31
	 *
	 * Usage: day
	 */
	_day: function(field) {
		return this._in(field, rule, [1, 31]);
	},

	/**
	 * Checks if the value is a valid month number, e.g. 1-12
	 *
	 * Usage: month
	 */
	_month: function(field) {
		return this._in(field, rule, [1, 12]);
		// return (field.element.value >= 1 && <= 12);
	},

	/**
	 * Checks if the value is a valid year number, e.g. four digits
	 *
	 * Usage: year
	 */
	_year: function(field, rule) {
		return (this._length(field, rule, 4));
	},

	/**
	 * Checks if the value is a valid date, e.g. 4-11-1989 or 04-11-89
	 *
	 * Usage: date
	 */
	_date: function(field, rule, parameters) {
		return ( (new Date(field.element.value) !== "Invalid Date" && !isNaN(new Date(field.element.value)) ));
	},

	/**
	 * Checks if the file that should be uploaded is an image by checking the MIME type of the file.
	 *
	 * Only allowes jpg and png images at the moment.
	 *
	 * Usage: image
	 */
	_image: function(field) {
		var self = this;

		if(field.element.files) {
			var file = field.element.files[0];

			if(file) {
				if(self._has(['image/jpg', 'image/jpeg', 'image/png'], file.element.type))
					return true;
			}
		}

		return false;
	},

	/**
	 * Checks the size of the file that should be uploaded, if the file size is greater than the passed
	 * in value the validation fails.
	 *
	 * The size is measured in bytes, so the usage example below allows files that are less than 60kb in size.
	 *
	 * Usage: size:60000
	 */
	_size: function(field, rule, parameters) {
		var self = this;

		if(field.element.files) {
			var file = field.element.files[0];

			if(self._image(field) && file.size < parameters)
				return true;
		}

		return false;
	},

	/**
	 * Checks if the MIME type of the file that should be uploaded is allowed, all the allowed MIME types are
	 * in the self._mimeTypes object that holds the extensions and the MIME types.
	 *
	 * Pass in one or more extension like shown below.
	 *
	 * Usage: mime:jpg OR mime:jpg,png
	 */
	_mime: function(field, rule, parameters) {
		var self = this,
			allowed = [];

		if(field.element.files) {
			var file = field.element.files[0];

			if(self._image(field)) {
				// Get the allowed types
				if(typeof parameters == 'string') {
					(self._mimeTypes[parameters] != undefined) && allowed.push(self._mimeTypes[parameters]);
				} else if(parameters instanceof Array) {
					for(var i=0; i<field.parameters.length; i++) {
						(self._mimeTypes[parameters[i]] != undefined) && allowed.push(self._mimeTypes[parameters[i]]);
					}
				}

				// Is the file type allowed?
				if(self._has(allowed, file.type))
					return true;
			}
		}

		return false;
	},

	/**
	 * Checks if the value for the field that is being validation is different than the value of another field
	 *
	 * Usage: different:fieldname
	 */
	_different: function(field, rule, parameters) {
		var self = this,
			toDiffer = self._fields[parameters].element.value;

		if(field.element.value.toLowerCase() != toDiffer.toLowerCase())
			return true;

		return false;
	},

	/**
	 * Checks if the value for the field that is being validation is the same as the value of another field
	 *
	 * Usage: same:fieldname
	 */
	_match: function(field, rule, parameters) {
		var self = this,
			toMatch = self._fields[parameters].element.value;

		if(field.element.value == toMatch)
			return true;

		return false;
	},

	/**
	 * Clears another field if the value for the current field is being changed
	 *
	 * Usage: clear:password_confirm
	 */
	_clear: function(field, rule, parameters) {
		var toClear = this._fields[parameters];
		if(field.element.value != toClear.element.value) {
			this._clearField(toClear);
			this._disableSubmit();
		}

		return true;
	},

	/**
	 * Enables another field if the given field has passed all other validation rules
	 *
	 * Usage: enable:fieldname
	 */
	_enable: function(field, rule, parameters) {
		var self = this;

		self._enableField(self._fields[parameters]);

		return true;
	},

	/**
	 * Checks if the value contains an integer or an alpha string
	 *
	 * Usage: contain:int or contain:alpha
	 */
	_contain: function(field, rule, parameters) {
		if(parameters == 'int') {
			return !isNaN(parseFloat(field.element.value));
		}

		return isNaN(parseFloat(field.element.value));
	},



	/* START FILTERS -------------------------------------------------------- */


	/**
	 * Convert the first character of the value to uppercase, e.g. name -> Name, naMe -> NaMe
	 *
	 * Usage: ucfirst
	 */
	_ucfirst: function(field) {
		field.element.value = field.element.value.charAt(0).toUpperCase() + (field.element.value.slice(1));

		return true;
	},

	/**
	 * Convert the first character of the value to lowercase
	 *
	 * Usage: lcfirst
	 */
	_lcfirst: function(field) {
		field.element.value = field.element.value.charAt(0).toLowerCase() + (field.element.value.slice(1));

		return true;
	},

	/**
	 * Converts the value to uppercase
	 *
	 * Usage: uppercase
	 */
	_uppercase: function(field) {
		field.element.value = field.element.value.toUpperCase();

		return true;
	},

	/**
	 * Converts the value to lowercase
	 *
	 * Usage: lowercase
	 */
	_lowercase: function(field) {
		field.element.value = field.element.value.toLowerCase();

		return true;
	},

	/**
	 * Converts the value to camelcase, removing the spaces, e.g. 'user name' -> 'userName'
	 *
	 * Usage: camelcase
	 */
	_camelcase: function(field) {
		field.element.value = field.element.value.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
		    return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
		}).replace(/\s+/g, '');

		return true;
	},

	/**
	 * Adds a hashtag to the value
	 *
	 * Usage: hashtag
	 */
	_hashtag: function(field, rule) {
		this._prefix(field, rule, ['#']);

		return true;
	},

	/**
	 * Remove all spaces from the input value and replaces them with hyphens
	 *
	 * Usage: hyphen
	 */
	_hyphen: function(field) {
		field.element.value = field.element.value.replace(/\s/g, '-');

		return true;
	},

	/**
	 * Remove all spaces from the input value and replaces them with underscores
	 *
	 * Usage: underscore
	 */
	_underscore: function(field) {
		field.element.value = field.element.value.replace(/\s/g, '_');

		return true;
	},

	/**
	 * replace a certain value with another
	 *
	 * Usage: replace:?,!
	 */
	_replace: function(field, rule, parameters) {
		var re = new RegExp(parameters[0], 'g');
		field.element.value = field.element.value.replace(re, parameters[1]);

		return true;
	},

	/**
	 * Puts a prefix before the value
	 *
	 * Usage: prefix:string
	 */
	_prefix: function(field, rule, parameters) {
		field.element.value = parameters + field.element.value;
	
		return true;
	},

	/**
	 * Puts a suffix after the value
	 *
	 * Usage: suffix:string
	 */
	_suffix: function(field, rule, parameters) {
		field.element.value = field.element.value + parameters;
	
		return true;
	},

	/**
	 * Converts a number into a money figure
	 *
	 * 100 will become 100.00
	 * 2.5 will become 2.50
	 * 2,50 will become 2.50
	 * 1000 will become 1,0000
	 *
	 * Usage: money
	 */	
	_money: function(field) {
		// First clear all the comma's from the number, next set the decimal value
		field.element.value = parseFloat(field.element.value.replace(/\,/g, '')).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
	
		return true;
	},

	/**
	 * Remove spaces from the front and the back of the value
	 *
	 * Usage: trim
	 */
	_trim: function(field) {
		field.element.value = field.element.value.trim();
	
		return true;
	},

	/**
	 * Remove all spaces from the input value
	 *
	 * Usage: no_spaces
	 */
	_no_spaces: function(field) {
		field.element.value = field.element.value.replace(/\s/g, '');

		return true;
	},

	/**
	 * Crop characters off the value that exceed the max length
	 *
	 * Usage: crop:4
	 * Will crop all the characters after the fourth character
	 */
	_crop: function(field) {
		field.element.value = field.element.value.substring(0, field.parameters);
	
		return true;
	},

	/**
	 * If true it leaves HTML characters in the field and converts the enitities to HTML
	 * If false it does the opposite
	 *
	 * Usage: htmlentities
	 */
	_html: function(field, rule, parameters) {
		if(parameters === true) {
			field.element.value = field.element.value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
		} else {
			field.element.value = field.element.value.replace(/&$/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		}

		return true;
	},

	/**
	 * If the value for the field is numeric, round the value up or down depending on the parameter
	 *
	 * round without a parameter will round to the nearest integer
	 * round:up will round up, 3.4 will becom 4
	 * round:down will round down, 3.6 will become 3
	 *
	 * Usage: round:up, round:down
	 */
	_round: function(field, rule, parameters) {
		var self = this;

		if(self._numeric(field)) {
			if(parameters == 'up') {
				field.element.value = Math.ceil(field.element.value);
			} else if(parameters == 'down') {
				field.element.value = Math.floor(field.element.value);
			} else {
				field.element.value = Math.round(field.element.value);
			}

			return true;
		}

		return false;
	},

	/**
	 * Only allow either letters or whole numbers to be typed in a field
	 *
	 * @param e The keydown event
	 * @param name The name of the field
	 * @param type The allowed type, either 'alpha' for letters or 'int' for whole numbers
	 */
	_allow: function(e, name, type) {
		var self = this;
		type = type || 'alpha';

		if(type == 'int') {
			if(/^[a-zA-Z]$|^[\W]$/.test(e.key))
				e.preventDefault();
		} else if(type == 'alpha') {
			if( ! /[a-zA-Z]/.test(e.key))
				e.preventDefault();
		}
	}
};
