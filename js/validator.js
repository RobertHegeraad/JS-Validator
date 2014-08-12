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
		length: 'This value must be :ruleValue characters long',
		minLength: 'This value must be atleast :ruleValue characters long',
		maxLength: 'This value cannot be longer than :ruleValue characters',
		email: 'This is not a valid email address',
		url: 'This is not a valid URL',
		in: 'This value is not allowed',
		not_in: 'This value is not allowed',
		between: 'This value does not meet the requirements',
		exact: 'The value must be exactly :ruleValue',
		equal: 'The value must equal :ruleValue',
		not_equal: 'The value may not be equal to :ruleValue',
		image: 'This is not an image',
		size: 'This file is too big',
		mime: 'The file type is not allowed',
		different: 'This value cannot match the value from the :ruleValue field',
		same: 'This does not match the :ruleValue field',
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
		preview: {}	// Holds the names of the fields that should show a preview of the value
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

		rules = rules || {};
		options = options || {};

		// Combine the config with the user provided options
		self._extend(self._config, options);



		self._form  = document.getElementById(id);

		// Does the form exist?
		if(self._form) {

			// Put the fields in a key value object so they are easily accessable
			var fields = self._form.elements;
			for(var i=0; i<fields.length; i++) {
				var name = fields[i].name,
					type = fields[i].type;
				
				// Turn off autocomplete for all fields
				fields[i].setAttribute('autocomplete', 'off');

				if(name != '' && type != 'submit')
					self._fields[name] = fields[i];
			}

			// Combine the rules with the inlineRules
			self._extend(rules, self._getInlineRules());

			// Parse the rules todo: in function plaatsen
			self._rules = self._parseRules(rules);



			self._submit = self._form.querySelector("[type=submit]");

			// Does the submit button need to be disabled?
			if(self._submit.hasAttribute('disabled')) {
				self._config.disableSubmit = true;
			} else if(self._config.disableSubmit) {
				self._submit.setAttribute('disabled', 'disabled');
			}

			// Validate the form when the page loads
			self._validate(self._rules, true);


			/* START EVENT LISTENERS --------------------------------------------- */

			var on = self._config.validateOn;

			for(var name in self._fields) {
				var field = self._fields[name];

				// Are there any fields that have a remaining character count? if so show the default count
				if(self._special.remaining[name]) {
					self._remaining(name, self._special.remaining[name]);
				}

				// Are there any fields that have a remaining character count? if so show the default count
				if(self._special.strength[name]) {
					self._strength(self._fields[name]);
				}

				self._setKeyDownEvent(field, name);

				self._setKeyupEvent(field, name);

				if(self._config.validateOn == 'blur' && field.type != 'file') {
					self._setBlurEvent(field, name);
				}


				// Set change event for non text elements
				if(field.type == 'file' || field.type == 'checkbox' || field.type == 'select-one') {
					self._setChangeEvent(field, name);
				}
			}

			self._form.addEventListener('submit', function(e) {
				e.preventDefault();

				// Validate every rule for each field
				self._validate(self._rules);

				if(self._isSuccessful()) {
					self._success();
				} else {
					self._fail();
				}
			});



			/* END EVENT LISTENERS ----------------------------------------------- */
		}
	},

	_setBlurEvent: function(field, name) {
		var self = this,
			rules = {};

		rules[name] = self._rules[name];

		field.addEventListener('blur', function(e) {

			// Validate the field
			self._validate(rules);

			// Enable/Disable the submit button depending is all the fields are successful and if the submit button was disabled by default
			if(self._config.disableSubmit) {
				self._toggleSubmit();
			}
		});
	},

	_setKeyDownEvent: function(field, name) {
		var self = this;

		field.addEventListener('keydown', function(e) {

			// Does this field have the allow rule set?
			if(self._special.allow[name] == 'int') {
				self._allow(e, name, 'int');
			} else if(self._special.allow[name] == 'alpha') {
				self._allow(e, name, 'alpha');
			}

			// Only check for remaining character count if the pressed key wat not prevented by the _allow rule function
			if( ! e.defaultPrevented) {
				// Are there any fields that have a remaining character count?
				if(self._special.remaining[name]) {
					self._remaining(name, self._special.remaining[name], e);
				}
			}
		});
	},

	_setKeyupEvent: function(field, name) {
		var self = this,
			timer,
			rules = {};

		rules[name] = self._rules[name];

		field.addEventListener('keyup', function(e) {

			// Are there any fields that have a remaining character count?
			if(self._special.remaining[name]) {
				self._remaining(name, self._special.remaining[name], e);
			}

			if(self._special.preview[name]) {
				self._preview(name);
			}

			// Don't validate when the Tab key was pressed
			if(e.keyCode != 9) {			
				clearTimeout(timer);
				
				// Is there a field that is supposed to have the same value as this field?
				if(self._special.same[name]) {
					var	fieldName = self._special.same[name];

					self._clearField(self._fields[fieldName]);
				}

				// Is there a field that is supposed to have a different value as this field?
				if(self._special.different[name]) {
					var	fieldName = self._special.different[name];

					self._clearField(self._fields[fieldName]);
				}

				// Does this field have a strength meter?
				if(self._special.strength[name]) {
					self._strength(self._fields[name]);
				}				

				timer = setTimeout(function() {

					if(self._config.validateOn == 'keyup') {
						self._validate(rules);
					};

					// Enable/Disable the submit button depending is all the fields are successful and if the submit button was disabled by default
					if(self._config.disableSubmit) {
						self._toggleSubmit();
					}
				}, 1000);
			}
		});
	},

	_setChangeEvent: function(field, name) {
		var self = this,
			rules = {};

		rules[name] = self._rules[name];

		field.addEventListener('change', function(e) {
			self._validate(rules);
		});
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Validate all the passed rules for each field, when the config.validateOn is set to 'keyup' or
	 * 'blur' only the rules for the field that had the event are passed
	 */
	_validate: function(rules, pageRefresh) {
		var self = this,
			field = {};

		// Loop through all the fields and get the rules for that field
		for(var name in self._fields) {

			field.element = self._fields[name];
			field.value = field.element.value.trim();

			if(name in rules) {

				// If the page was refreshed, only validate the field that still have a value
				if(pageRefresh && field.value == '') {
					break;
				}

				for(var rule in rules[name]) {

					field.rule = rule;
					field.parameters = rules[name][rule];
					field.message = '';

					// Check if the field is not required and if it is not filled in,
					// if so clear the field of any errors and skip it
					if(self._requiredFields.indexOf(name) == -1 && field.value == '') {
						self._clearField(self._fields[name]);
						continue;
					}

					var validation;

					// First check if there is a custom rule set
					if(typeof self._config.customRules[rule] == 'function') {
						validation = self._config.customRules[rule](field);
					} else if(typeof self['_' + rule] == 'function') {	// Else check if the validator rule function exists
						validation = self['_' + rule](field);
					}


					// If the validation failed
					if( ! validation) {
						self._errors[name] = self._parseError(field);

						// No need to continue
						break;
					} else {
						// Remove the error from the error object

						self._removeErrorMessage(name);
						self._setSuccessClass(name);

						if(self._errors[name]) {
							delete self._errors[name];
						}
					}
				}
			}
		}

		// Place all the errors on the page
		self._handleErrors(self._errors);
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Loops through the _errors object and inserts all the errors and sets the .validation-failed class for all the failed fields
	 *
	 * @param errors Object containig the field names and the error messages for those fields
	 */
	_handleErrors: function(errors) {
		var self = this;

		// Check every field
		for(var name in self._fields) {
			var field = self._fields[name];

			// Does this field have an error?
			if(name in errors) {
				self._insertErrorMessage(name);
				self._setFailClass(name);
			}
		}
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Check if all the required fields have the .validation-success class and if there are no errors in the self._errors object
	 */
	_isSuccessful: function() {
		var self = this,
			successful = self._form.querySelectorAll('.validation-success'),
			requiredCount = self._requiredFields.length,
			field;

		if(self._objLength(self._errors) === 0) {
			for(var i=0; i<self._requiredFields.length; i++) {
				field = self._fields[self._requiredFields[i]];

				// Does the required field have the .validation-success class? if not, the form is not successful
				if( ! /\bvalidation-success\b/.test(field.className)) {
					return false;
				}
			}

			return true;
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

			if(field.hasAttribute('data-validation')) {
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
	 * 		required: 'required',
	 * 		size: 500000,
	 *		mime: ['jpg', 'png']
	 * }
	 *
	 * @param rules Object containg field names and the rule strings
	 */
	_parseRules: function(rules) {
		var self = this,
			string,
			rule,
			ruleName,
			rulesObject = {},
			parametersString,
			parametersArray,
			split;

		for(var name in rules) {
			if(typeof rules[name] === 'string' && name in self._fields) {
				rulesObject[name] = {},

				string = rules[name];

				// Move the required rule infront of the string and remove any trailing | symbols
				if(string.match(/required/)) {
					string = ('required|' + string.replace(/required(\|)?/, '')).replace(/\|+$/, "");
					self._requiredFields.push(name);
				}

				// Place the enable rule to the back of the string
				if(string.match(/enable:[a-zA-Z_]+/)) {
					var enableString = string.match(/enable:[a-zA-Z_]+/);
					string = (string.replace(/enable:[a-zA-Z_]+(\|)?/, '')).replace(/\|+$/, "") + '|' + enableString[0];
				}

				rulesArray = string.split('|');

				// Does the field exist in the form?
				for(var i=0; i<rulesArray.length; i++) {
					rule = rulesArray[i];

					// Does the rule have parameters
					if(/\:/.test(rule)) {
						split = rule.split(':');
						ruleName = split.shift();
						parametersString = split.shift();

						// Does the rule have multiple parameters, e.g. in:1,2,3
						if(/,/.test(parametersString)) {

							parametersArray = parametersString.split(',');

							rulesObject[name][ruleName] = parametersArray;

						// The rule had only one parameter, e.g. min:5
						} else {  
							
							// The rules same and different require special treatment
							// for example the confirm_password field has the rule same:password this way the value should be the
							// same as the password field. These field names will be added to the
							// self._special.same object like so: password: confirm_password
							// now when the password field is changed we can check this object to see if any field
							// depends on the password field. The depending field will then be cleared.
							if(ruleName == 'same') {
								self._special.same[parametersString] = name;
							} else if(ruleName == 'different') {
								self._special.different[parametersString] = name;
							} else if(ruleName == 'allow') {
								self._special.allow[name] = parametersString;
								continue;
							} else if(ruleName == 'remaining') {
								self._special.remaining[name] = parametersString;
								continue;
							}

							rulesObject[name][ruleName] = parametersString;
						}
					} else {
						if(rule == 'preview') {
							self._special.preview[name] = name;
							continue;
						} else if(rule == 'strength') {
							self._special.strength[name] = name;
							continue;
						}

						// The rule had no parameters, e.g. alpha_num
						rulesObject[name][rule] = rule;
					}
				}
			}
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
	_parseError: function(field) {
		var self = this,
			error = '';

		if(field.message == '') {
			// Set the error message, if it doesn't exist use the default error message
			if(self._messages[field.rule]) {
				error = self._messages[field.rule];
			} else {
				error = self._messages.default;
			}

			// If a custom message exist for this field and rule, overwrite the error message
			if(self._config.customMessages[field.element.name]) {
				if(self._config.customMessages[field.element.name][field.rule]) {
					error = self._config.customMessages[field.element.name][field.rule];
				}
			}
		} else {
			error = field.message;
		}

		// Does this field have a data-display property that holds a pretty field name?
		name = (field.element.dataset.display) && field.element.dataset.display;

		return error.replace(':field', field.element.name).replace(':ruleValue', field.parameters);
	},

	/** -----------------------------------------------------------------------------------------------------
	 * 
	 */
	_checkSpecials: function(name) {
		var self = this;

		// Is there a field that is supposed to have the same value as this field?
		if(self._special.same[name]) {
			var	fieldName = self._special.same[name];

			self._clearField(self._fields[fieldName]);
		}

		// Is there a field that is supposed to have a different value as this field?
		if(self._special.different[name]) {
			var	fieldName = self._special.different[name];

			self._clearField(self._fields[fieldName]);
		}
	},


	/* START HTML FUNCTIONS ---------------------------------------------- */


	/** -----------------------------------------------------------------------------------------------------
	 * Looks for an element with the data attribute error set to the name of the field
	 * If found it places the error in the element and adds the .validation-error class
	 */
	_insertErrorMessage: function(name) {
		var self = this;

		// Does the field already have an error element?
		var element = document.querySelector("[data-error=" + name + "]");

		if(element != null) {
			// Does the element already have the .valition-error class, if not add it
			if( ! /\bvalidation-error\b/.test(element.className)) {
				element.className = element.className + ' validation-error';
			}

			element.innerHTML = self._errors[name];
		}
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Looks for an element with the data attribute error set to the name of the field
	 * If found it clears the value of the element, removing the error from the screen
	 */
	_removeErrorMessage: function(name) {
		var self = this,
			element = document.querySelector("[data-error=" + name + "]");

		if(element != null) {
			element.innerHTML = '';
		}
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Looks for an element on the page with the data attribute strengh that is equal to the name of the field.
	 * If found it decides what classname to use for the element depending on the score given by the _strength function.
	 * The strength is then added to the element in a class like so: .validation-strength-strong
	 *
	 * @param name The name of the field
	 * @param score The score received from the _strength function that reflects the strength of the value from the field
	 */
	_insertStrengthMeter: function(name, strength) {
		var self = this,
			element = document.querySelector("[data-strength=" + name + "]");

		if(element != null) {
			// Does the element already have the .valition-error class, if not add it
			if( ! /\bvalidation-strength\b/.test(element.className)) {
				element.className = element.className + ' validation-strength';
			}

			// Remove the old strength classes
			element.className = element.className.replace(' validation-strength-empty','').replace(' validation-strength-weak','').replace(' validation-strength-medium','').replace(' validation-strength-strong','');

			element.className = element.className + ' validation-strength-' + strength;
		}
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Looks for an element on the page with the data attribute remaining that is equal to the name of the field.
	 * If found it will show how many characters the user can type in the field
	 *
	 * @param name The name of the field
	 * @param remaining The amount of characters that are allowed
	 */
	_insertRemainingCharacters: function(name, remaining) {
		var self = this,
			element = document.querySelector("[data-remaining=" + name + "]");

		if(element != null) {
			// Does the element already have the .valition-error class, if not add it
			if( ! /\bvalidation-remaining\b/.test(element.className)) {
				element.className = element.className + ' validation-remaining';
			}

			var text = (remaining == 1) ? ' character remaining' : ' characters remaining';

			element.innerHTML = remaining + text;
		}
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Looks for an element on the page with the data attribute preview that is equal to the name of the field.
	 * If found it will show the value of the field in the HTML element
	 *
	 * @param name The name of the field
	 */
	_insertPreview: function(name) {
		var self = this,
			element = document.querySelector("[data-preview=" + name + "]");

		if(element != null) {
			// Does the element already have the .valition-error class, if not add it
			if( ! /\bvalidation-preview\b/.test(element.className)) {
				element.className = element.className + ' validation-preview';
			}

			element.innerHTML = self._fields[name].value;
		}
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Add the .validation-success class to the field and remove the .validation-failed class if it exists
	 *
	 * @param name The name of the field
	 */
	_setSuccessClass: function(name) {
		var self = this,
			field = self._fields[name];

		// Check if field already has the class
		if( ! /\bvalidation-success\b/.test(field.className)) {
			field.className = field.className.replace(' validation-failed','') + ' validation-success';
		}
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Add the .validation-failed class to the field and remove the .validation-success class if it exists
	 *
	 * @param name The name of the field
	 */
	_setFailClass: function(name) {
		var self = this,
			field = self._fields[name];

		if( ! /\bvalidation-failed\b/.test(field.className)) {
			field.className = field.className.replace(' validation-success','') + ' validation-failed';

			// If the field has the enable rule set, disable the field that was passed
			if(self._rules[name].enable) {
				self._disableField(self._fields[self._rules[name].enable]);
			}
		}
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Clears the value, remove the .validation-success class from the field and
	 * remove the corresponding error message for the field
	 */
	_clearField: function(field) {
		var self = this;

		field.value = '';
		self._removeErrorMessage(field.name);
		field.className = field.className.replace(' validation-success','');
		field.className = field.className.replace(' validation-error','');
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Enable a field
	 */
	_enableField: function(field) {
		field.removeAttribute('disabled');
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Disable a field
	 */
	_disableField: function(field) {
		field.setAttribute('disabled', 'disabled');
	},

	/** -----------------------------------------------------------------------------------------------------
	 * Enable the submit button if the form does not contain any errors, if it does disable the submit buton
	 */
	_toggleSubmit: function() {
		var self = this;

		if(self._isSuccessful()) {
			if(self._submit.hasAttribute('disabled')) {
				self._submit.removeAttribute('disabled');
			}
		} else if( ! self._submit.hasAttribute('disabled')) {
			self._submit.setAttribute('disabled', 'disabled');
		}
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

		var values = {};
		for(var name in self._fields) {
			values[name] = self._fields[name].value;
		}

		if(typeof self._config.success == 'function') {
			if(self._config.success(values))
				self._form.submit();
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

		if(typeof self._config.fail == 'function')
			self._config.fail(self._errors);
	},


	/* START VALIDATIONS ---------------------------------------------------- */


	/**
	 * Checks if the value for the field in not empty
	 *
	 * The required rule will be checked first regardless of what order the rules are in
	 *
	 * Usage: required
	 */
	_required: function(field) {
		var self = this;

		if(field.element.type == 'checkbox') {
			if(field.element.checked)
				return true;

			return false;
		} else {
			if(field.value == null || field.value == "")
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
		return /^\d+$/.test(field.value);
	},

	/**
	 * Checks if the value for the field consists of only numbers
	 *
	 * Usage: numeric
	 */
	_numeric: function(field) {
		return /^[0-9]+(\.[0-9]{1,2})?$/.test(field.value);
	},

	/**
	 * Checks if the value for the field is a decimal value
	 *
	 * Usage: decimal
	 */
	_decimal: function(field) {
		return /^[0-9]+\.[0-9]{1,2}?$/.test(field.value);
	},

	/**
	 * Checks if the value for the field consists of only letters
	 *
	 * Usage: alpha
	 */
	_alpha: function(field) {
		return /^[a-zA-Z]*$/.test(field.value);
	},

	/**
	 * Checks if the value for the field consists of only letters and numbers
	 *
	 * Usage: alpha_nums
	 */
	_alpha_num: function(field) {
		return /^[a-zA-Z0-9_]*$/.test(field.value);
	},


	/**
	 * Checks if the value for the field is not lower than the given value
	 *
	 * Usage: min:5
	 */
	_min: function(field) {
		var value = parseInt(field.value),
			min = parseInt(field.parameters);

		if(value >= min)
			return true;

		return false;
	},

	/**
	 * Checks if the value for the field is not higher than the given value
	 *
	 * Usage: max:10
	 */
	_max: function(field) {
		var value = parseInt(field.value),
			max = parseInt(field.parameters);

		if(value <= max)
			return true;

		return false;
	},

	/**
	 * Checks if the value for the field is of a certain length
	 *
	 * Usage: length:6
	 */
	_length: function(field) {
		var length = field.value.split('').length;

		if(length != field.parameters)
			return false;

		return true;
	},

	/**
	 * Checks if the value for the field is atleast a minimum amount of characters
	 *
	 * Usage: minLength:4
	 */
	_minLength: function(field) {
		var length = field.value.split('').length;

		if(length < field.parameters)
			return false;

		return true;
	},

	/**
	 * Checks if the value for the field does not exceed a maximum length of characters
	 *
	 * Usage: maxLength:10
	 */
	_maxLength: function(field) {
 		var length = field.value.split('').length;

		if(length > field.parameters)
			return false;

		return true;
	},

	/**
	 * Checks if the value for the field is an email address
	 *
	 * Usage: email
	 */
	_email: function(field) {
		return /^[a-zA-Z0-9.!#$%&amp;'*+\-\/=?\^_`{|}~\-]+@[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*$/.test(field.value);
	},

	/**
	 * Checks if the value for the field is a URL
	 *
	 * Usage: url
	 */
	_url: function(field) {
		return /^((http|https):\/\/(\w+:{0,1}\w*@)?(\S+)|)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/.test(field.value);
	},

	/**
	 * Checks if the value for the field is in the list of passed values
	 *
	 * List of values can be strings, numbers of both
	 *
	 * Usage: in:1,2,3 OR in:hello,world OR in:1,2,hello
	 */
	_in: function(field) {
		return (new RegExp('(' + field.parameters.join('|').replace(/\./g, '\\.') + ')$')).test(field.value.toLowerCase());
	},

	/**
	 * Checks if the value for the field is not in the list of passed values
	 *
	 * List of values can be strings, numbers of both
	 *
	 * Usage: not_in:1,2,3 OR not_in:hello,world OR not_in:1,2,hello
	 */
	_not_in: function(field) {
		return ! (new RegExp('(' + field.parameters.join('|').replace(/\./g, '\\.') + ')$')).test(field.value.toLowerCase());
	},

	/**
	 * Checks if the value for the field in between the two passed in numbers not including both
	 *
	 * Usage: between:1,10
	 */
	_between: function(field) {
		var value = parseInt(field.value),
			min = parseInt(field.parameters[0]),
			max = parseInt(field.parameters[field.parameters.length-1]);

		if(value > min && value < max)
			return true;

		return false;
	},

	/**
	 * Checks if the value for the field is equal to the value that is passed in
	 *
	 * Usage: equal:string
	 */
	_equal: function(field) {
		if(field.value.toLowerCase() === field.parameters)
			return true;

		return false;
	},

	/**
	 * Checks if the value for the field is not equal to the value that is passed in
	 *
	 * Usage: not_equal:string
	 */
	_not_equal: function(field) {
		if(field.value.toLowerCase() !== field.parameters)
			return true;

		return false;
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
				if(self._has(['image/jpg', 'image/jpeg', 'image/png'], file.type))
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
	_size: function(field) {
		console.log(field);
		var self = this;

		if(field.element.files) {
			var file = field.element.files[0];

			if(self._image(field) && file.size < field.parameters)
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
	_mime: function(field) {
		var self = this,
			allowed = [];

		if(field.element.files) {
			var file = field.element.files[0];

			if(self._image(field)) {
				// Get the allowed types
				if(typeof field.parameters == 'string') {
					(self._mimeTypes[field.parameters] != undefined) && allowed.push(self._mimeTypes[field.parameters]);
				} else if(field.parameters instanceof Array) {
					for(var i=0; i<field.parameters.length; i++) {
						(self._mimeTypes[field.parameters[i]] != undefined) && allowed.push(self._mimeTypes[field.parameters[i]]);
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
	_different: function(field) {
		var self = this,
			toDiffer = self._fields[field.parameters].value;

		if(field.value.toLowerCase() != toDiffer.toLowerCase())
			return true;

		return false;
	},

	/**
	 * Checks if the value for the field that is being validation is the same as the value of another field
	 *
	 * Usage: same:fieldname
	 */
	_same: function(field) {
		var self = this,
			toMatch = self._fields[field.parameters].value;

		if(field.value == toMatch)
			return true;

		return false;
	},

	/**
	 * Enables another field if the given field has passed all other validation rules
	 *
	 * Usage: enable:fieldname
	 */
	_enable: function(field) {
		var self = this;

		self._enableField(self._fields[field.parameters]);

		return true;
	},


	/**
	 * If this rule is given to a field the value will be tested for it's strength as if it is a password.
	 *
	 * A strong password consists of the following:
	 * - 2 or more uppercase
	 * - 3 or more lowercase
	 * - 2 or more digits
	 * - 1 or more symbol
	 * - 10 characters long
	 *
	 * A medium password consists of the following
	 * - 1 uppercase
	 * - 5 or more lowercase
	 * - 1 digits
	 * - 1 symbol
	 * - 8 characters long
	 *
	 * Usage: strength
	 */
	_strength: function(field) {
		var self = this,
			strength
			strong = new RegExp("^(?=.*[A-Z].*[A-Z])(?=.*[!@#$&*])(?=.*[0-9].*[0-9])(?=.*[a-z].*[a-z].*[a-z]).{10,}$", "g");
			medium = new RegExp("^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9])(?=.*[a-z].*[a-z].*[a-z].*[a-z].*[a-z]).{8,}$", "g");

		if(field.value.length == 0) {
			strength = 'empty';
		} else if(strong.test(field.value)) {
			strength = 'strong';
		} else if(medium.test(field.value)) {
			strength = 'medium';
		} else {
			strength = 'weak';
		}

		self._insertStrengthMeter(field.name, strength);

		return true;
	},

	/**
	 * Show how many characters the user can type in the field and prevent more from being typed
	 * Called when the page loads to show the remaining characters by default and called on keydown
	 *
	 * @param name The name of the field
	 * @param max The maximum characters allowed for the field
	 * @param e The keydown event
	 */
	_remaining: function(name, max, e) {
		var self = this,
			remaining = max - self._fields[name].value.length;

		if(e != undefined && e.type == 'keydown') {
			// If the user typed an input key (alpha, num, symbol)
			if(/^.$/.test(e.key)) {
				if(remaining <= 0) {
					e.preventDefault();
				}
			}
		} else {
			self._insertRemainingCharacters(name, remaining);
		}
	},

	/**
	 * Insert the value for the field into the HTML element with the data-preview attribute set to the name of the element
	 *
	 * @param name The field name
	 */
	_preview: function(name) {
		var self = this;

		self._insertPreview(name);
	},


	/* START FILTERS -------------------------------------------------------- */


	/**
	 * Convert the first character of the value to uppercase and the rest to lowercase, useful for names
	 *
	 * Usage: ucfirst
	 */
	_ucfirst: function(field) {
		field.element.value = field.value.charAt(0).toUpperCase() + (field.value.slice(1)).toLowerCase();

		return true;
	},

	/**
	 * Converts the value to uppercase
	 *
	 * Usage: uppercase
	 */
	_uppercase: function(field) {
		field.element.value = field.value.toUpperCase();

		return true;
	},

	/**
	 * Converts the value to lowercase
	 *
	 * Usage: lowercase
	 */
	_lowercase: function(field) {
		field.element.value = field.value.toLowerCase();

		return true;
	},

	/**
	 * Puts a prefix before the value
	 *
	 * Usage: prefix:string
	 */
	_prefix: function(field) {
		field.element.value = field.parameters + field.value;
	
		return true;
	},

	/**
	 * Puts a suffix after the value
	 *
	 * Usage: suffix:string
	 */
	_suffix: function(field) {
		field.element.value = field.value + field.parameters;
	
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
		field.element.value = parseFloat(field.value.replace(/\,/g, '')).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
	
		return true;
	},

	/**
	 * Remove spaces from the front and the back of the value
	 *
	 * Usage: trim
	 */
	_trim: function(field) {
		field.element.value = field.value.trim();
	
		return true;
	},

	/**
	 * Remove all spaces from the input value
	 *
	 * Usage: no_spaces
	 */
	_no_spaces: function(field) {
		field.element.value = field.value.replace(/\s/g, '');

		return true;
	},

	/**
	 * Crop characters off the value that exceed the max length
	 *
	 * Usage: crop:4
	 * Will crop all the characters after the fourth character
	 */
	_crop: function(field) {
		field.element.value = field.value.substring(0, field.parameters);
	
		return true;
	},

	/**
	 * If true it leaves HTML characters in the field and converts the enitities to HTML
	 * If false it does the opposite
	 *
	 * Usage: htmlentities
	 */
	_html: function(field) {
		if(field.parameters === true) {
			field.element.value = field.value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
		} else {
			field.element.value = field.value.replace(/&$/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
	_round: function(field) {
		var self = this;

		if(self._numeric(field)) {
			if(field.parameters == 'up') {
				field.element.value = Math.ceil(field.value);
			} else if(field.parameters == 'down') {
				field.element.value = Math.floor(field.value);
			} else {
				field.element.value = Math.round(field.value);
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