JavaScript Validator
=====

#### Demo

http://jsfiddle.net/RobertHegeraad/geu4j2bh/

#### Simple Usage

To set up validation call the Validator.set() function and pass the ID of the form in the first parameter, the second parameter should contain all the validation rules for each field. The third parameter is the configuration, more on that in the Config section

```js
Validator.set('my-form-id', {
	'firstName': 'required|alpha',
	'lastName': 'required|alpha',
	'password': 'required|enable:confirm_password|maxLength:20',
	'confirm_password': 'required|same:password',
	'message': 'required|crop:100',
	'profile_image': 'image|size:200000|mime:jpg,png'
}, {
	disableSubmit: false,
	success: function(data) {
		// Validation passed
		// data variable contains all field and values
	},
	fail: function(errors) {
		// Validation failed
		// errors variable contains all fields and error messages
	}
});
```

## Rules and Filters

#### Validation Rules

| Rule        		  | Description																														|
| --------------------|---------------------------------------------------------------------------------------------------------------------------------|
| required			  |	Checks if the value for the field in not empty, will be checked first 															|
| alpha				  |	Checks if the value consists of only letters 																					|
| alpha_num 		  |	Checks if the value consists of only letters and/or numbers 																	|
| int 				  |	Checks if the value is a whole number 																							|
| numeric			  |	Checks if the value consists of only numbers 																					|
| decimal			  |	Checks if the value is a decimal value 																							|
| min:4 			  |	Checks if the value is not lower than the given value 																			|
| max:12 			  |	Checks if the value is not higher than the given value 																			|
| length 			  |	Checks if the value is of a certain length 																						|
| minLength:4 		  |	Checks if the value is atleast a minimum amount of characters 																	|
| maxLength:12 		  |	Checks if the value does not exceed a maximum amount of characters 																|
| email 			  |	Checks if the value is a valid email address 																					|
| url 				  |	Checks if the value is a URL 																									|
| in:1,2,3 			  |	Checks if the value is in the list of passed values 																			|
| not_in:1,2,3 		  |	Checks if the value is not in the list of passed values 																		|
| between:1,10 		  |	Checks if the value is between the two passed in numbers not including both 													|
| equal:string 		  |	Checks if the value is equal to the value that is passed in 																 	|
| not_equal:string	  | Checks if the value is not equal to the value that is passed in 															 	|
| day				| Checks if the value is a valid day number, e.g. 1-31
| month				| Checks if the value is a valid month number, e.g. 1-12
| year				| Checks if the value is a valid year number, e.g. four digits
| date				| Checks if the value is a valid date, e.g. 4-11-1989 or 04-11-89
| image 			  |	Checks if the file that should be uploaded is an image by checking the MIME type of the file 									|
| size:60000 		  |	Checks the filesize does not exceed the value that was passed 																	|
| mime:jpg,png 		  |	Checks if the MIME type is allowed, all allowed MIME types are in the mimeTypes object 											|
| different:fieldname | Checks if the value is different than the value of another field 																|
| same:fieldname 	  |	Checks if the value is the same as the value of another field 																	|
| enable:fieldname 	  |	Enables another field if the given field has passed all other validation rules, if it fails the field will be disabled again	|
| contain:int 	  |	Checks if the value contains an integer value or an alpha value		|

#### Filter

Filters will change the value of the field, and are applied the same way as validation rules. For example you can use the ucfirst filter to capitalize the first letter of the value, useful for names.

Here are all the filters

| Rule        		  			| Description																														
| ------------------------------|-----------------------------------------------------------------------------------------------------
| ucfirst						| Convert the first character of the value to uppercase and the rest to lowercase
| lcfirst						| Convert the first character of the value to lowercase and the rest to uppercase
| uppercase 					| Converts the value to uppercase
| lowercase 					| Converts the value to lowercase
| camelcase					| Converts the value to camelcase, removing the spaces, e.g. 'user name' -> 'userName'
| hashtag					| Adds a hashtag to the value
| hyphen					| Remove all spaces from the input value and replaces them with hyphens
| underscore					| Remove all spaces from the input value and replaces them with underscores
| replace:?,!					| replace a certain value with another
| prefix:string 				| Puts a prefix before the value
| suffix:string 				| Puts a suffix after the value
| money 						| Converts a number into a money figure, 100 will become 100.00, 2.5 will become 2.50
| crop:10 						| Crop characters of the end of value that exceed the max length
| trim 							| Remove spaces from the front and the back of the value
| no_spaces 					| Remove all spaces from the input value
| html:boolean 					| If set to true it converts from HTML enitities in the value, if false it converts to HTML entities
| round, round:up, round:down 	| Round the given value either up, down or to the nearest integer if no parameter was passed



## Config

#### Disable submit

If set to true, the submit button will be disabled and only enabled when all the required fields are succesful. When one field has an error the submit button will be disabled again.

```js
disableSubmit: false
```

You can also just disable the submit button in the form directly. It will be enabled and disabled again depending on the current status of the form.

```html
<input type="submit" value="Send" disabled/>
```


#### Success callback

Called if the validation was successful and is passed an object with key value pairs for the fields.

If this function return true the form will be submitted to the form action property like usual. If false is returned the form will not submit.

```js
success: function(data) {
	// Do something with the values
}
```

#### Fail callback

Called if the validation failed and is passed an object with the errors for the fields.

```js
fail: function(errors) {
	// Do something with the errors
}
```

#### Setting custom messages

It is very easy to set custom error messages for each rule per field.

```js
customMessages: {
	firstName: {
		required: 'Please fill in your first name'
	},
	lastName: {
		required: 'Please also fill in your last name'
	}
}
```

#### Setting custom rules

Setting up custom rules is also very easy to do, in the example below we set up a rule called 'myRule'. This rule receives an object called field that contains the following information:

```js
field.element - The HTML input field, can be used to get the value for the field like so: field.element.value
rule - The current rule that is being validated, this will be the same as the custom rule name, in this case 'myRule'
parameters - The parameter(s) passed to the rule, if a single parameter was passed it will be a string, else an array
```

```js
customRules: {
	myRule: function(field, rule, parameters) {
		if(field.element.value == 'HelloWorld')
			return true;

		return false;
	}
}
```

Returning true will tell the validate function to move on to the next rule if any exist.

Returning false will set the error message for the field, in this case the field will receive the message 'MyRule has failed'

## HTML

### Inline rules

With the data-validation attribute you can choose to set the rules in the field element directly. This will overwrite any rules set for this field with the Validator.set() function.

```html
<input type="text" name="firstName" data-validation="required|alpha|maxLength:12"/>
```

#### Errors

By creating an element with the data-error attribute set to the name of the field you can have full control over how and where the errors are displayed. 

The element will also receive a class .validation-error so you can apply additonal styling.

```html
<input type="text" name="firstName"/>
<span data-error="firstName"></span>
```

#### Display

You can set a display for the field with the data-display attribute for the field element which will be used in the error messages. If the data-display attribute is not set the name attribute will be used for the error messages. 

```html
<input type="text" name="firstName" data-display="First name"/>
```
