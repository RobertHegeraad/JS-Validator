JavaScript Validator
=====

#### Demo

http://jsfiddle.net/RobertHegeraad/geu4j2bh/

#### Simple Usage

To set up validation call the Validator.set() function and pass the ID of the form in the first parameter, the second parameter should contain all the validation rules for each field. The third parameter is the configuration, more on that in the Config section

```js
Validator.set('my-form', {
	'firstName': 'required|allow:alpha',
	'lastName': 'required|allow:alpha',
	'password': 'required|enable:confirm_password|strength',
	'confirm_password': 'required|same:password',
	'message': 'required|remaining:100|crop:100|preview',
	'profile_image': 'image|size:200000|mime:jpg,png'
}, {
	validateOn: 'keyup',
	disableSubmit: false,
	success: function(data) {
		return true;
	},
	fail: function(errors) {
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
| image 			  |	Checks if the file that should be uploaded is an image by checking the MIME type of the file 									|
| size:60000 		  |	Checks the filesize does not exceed the value that was passed 																	|
| mime:jpg,png 		  |	Checks if the MIME type is allowed, all allowed MIME types are in the mimeTypes object 											|
| different:fieldname | Checks if the value is different than the value of another field 																|
| same:fieldname 	  |	Checks if the value is the same as the value of another field 																	|
| enable:fieldname 	  |	Enables another field if the given field has passed all other validation rules, if it fails the field will be disabled again	|

#### Filter

Filters will change the value of the field, and are applied the same way as validation rules. For example you can use the ucfirst filter to capitalize the first letter of the value, useful for names.

Here are all the filters

| Rule        		  			| Description																														
| ------------------------------|-----------------------------------------------------------------------------------------------------
| ucfirst						| Convert the first character of the value to uppercase and the rest to lowercase
| uppercase 					| Converts the value to uppercase
| lowercase 					| Converts the value to lowercase
| prefix:string 				| Puts a prefix before the value
| suffix:string 				| Puts a suffix after the value
| money 						| Converts a number into a money figure, 100 will become 100.00, 2.5 will become 2.50
| crop:10 						| Crop characters of the end of value that exceed the max length
| trim 							| Remove spaces from the front and the back of the value
| no_spaces 					| Remove all spaces from the input value
| html:boolean 					| If set to true it converts from HTML enitities in the value, if false it converts to HTML entities
| round, round:up, round:down 	| Round the given value either up, down or to the nearest integer if no parameter was passed
| allow:alpha, allow:int 		| With the allow rule you can allow only either letters or numbers to be typed in the field

#### HTML rules

The following rules work together with HTML elements on the page, more information on these can be read at the bottom of the page.

| Rules 		| Description																														
| --------------|----------------------------------------------------------------------------------------------------------------
| strength 		| Shows a strength meter for the value in an HTML element, useful for passwords
| remaining:100	| Shows how many characters are still remaining for the user to be typed, blocks characters that exceed the limit
| preview 		| Shows a preview of the field value in an HTML element, useful for comments


## Config

#### Validate on

This options allows you to validate the field(s) on either 'submit', 'keyup' or 'blur'. Defaults to 'submit'

```js
validateOn: 'keyup'
```

#### Disable submit

If set to true, the submit button will be disabled and only enabled when all the required fields are succesful. When one field has an error the submit button will be disabled again.

```js
disableSubmit: false
```

You can also just disable the submit button in the form directly.

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
field.element - The HTML input field
field.rule - The current rule that is being validated, this will be the same as the custom rule name, in this case 'myRule'
field.parameters - The parameters passed to the rule, if a single parameter was passed it will be a string, else an array
field.value - The value of the field
field.message - With the message property you can set a custom message directly in the rule function, this will overwrite custom messages
```

```js
customRules: {
	myRule: function(field) {
		field.message = 'MyRule has failed';

		if(field.value == 'HelloWorld')
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

#### Characters remaining

Sometimes you want to show the user how many characters a field can have while the user is typing. You can do this by creating an element with the data-remaining attribute set to the name of the corresponding field and setting the remaining rule. In the example below we allow the user to type 100 characters in the comment textarea.

The element will also receive a class .validation-remaining so you can apply additonal styling.

```html
<label>Comment</label>
<span data-remaining="comment"></span>
<textarea name="comment" data-validation="required|remaining:100"></textarea>
<span data-error="comment"></span>
```

#### Preview

For some fields, like the comment textarea above, it is common to show a preview for the user. You can do this by creating an element with the data-preview attribute set to the name of the field and setting the preview rule. This will put the value in the HTML element when the user is typing.

The element will also receive a class .validation-preview so you can apply additonal styling.

```html
<label>Comment</label>
<span data-remaining="comment"></span>
<textarea name="comment" data-display="Comment" data-validation="required|remaining:100|preview"></textarea>
<span data-error="comment"></span>
<div data-preview="comment"></div>
```

#### Password Strength

For password fields you can show a strength meter to the user. To do this create an element with the data-strength attribute set to the name of the field and set the strength rule.

The element will receive a class .validation-strength and either .validation-strength-empty/weak/medium/strong so you can apply additonal styling.

A strong password consists of the following:
- 2 or more uppercase
- 3 or more lowercase
- 2 or more digits
- 1 or more symbol
- 10 characters long

A medium password consists of the following
- 1 uppercase
- 5 or more lowercase
- 1 digits
- 1 symbol
- 8 characters long

```html
<label>Password</label>
<input type="password" name="password" data-validation="required|strength"/>
<span data-strength="password"></span>
<span data-error="password"></span>
```
