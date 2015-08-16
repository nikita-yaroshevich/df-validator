(function (angular) {

  // Create all modules and define dependencies to make sure they exist
  // and are loaded in the correct order to satisfy dependency injection
  // before all nested files are concatenated by Gulp

  // Config
  angular.module('df.validator.config', [])
      .value('df.validator.config', {
          debug: true
      });

  // Modules
  angular.module('df.validator.services', []);
  angular.module('df.validator',
      [
          'df.validator.config',
          'df.validator.services'
      ]);

})(angular);

/**
 * Created by nikita on 12/29/14.
 */

'use strict';
angular.module('df.validator')
  .service('defaultValidationRules', function ($interpolate, $q, $filter, $parse) {
    function invalid(value, object, options) {
      var msg = options.message ? options.message : this.message;
      msg = $interpolate(msg)(angular.extend({value: value, object: object}, options));
      throw msg;
      //return $q.reject(msg);
    }

    return {
      required: {
        message: 'This field is required',
        validate: function (value, object, options) {
          options = options || {};
          if (!value || value.length === 0) {
            return invalid.apply(this, [value, object, options]);
          }
          return true;
        }
      },
      minlength: {
        message: 'Must be at least {{rule}} characters',
        validate: function (value, object, options) {
          options = angular.isObject(options) ? options : {rule: options};
          if (!value || value.length < options.rule) {
            return invalid.apply(this, [value, object, options]);
          }
          return true;
        }
      },
      maxlength: {
        message: 'Must be fewer than {{rule}} characters',
        validate: function (value, object, options) {
          options = angular.isObject(options) ? options : {rule: options};
          if (value && value.length > options.rule) {
            return invalid.apply(this, [value, object, options]);
          }
          return true;
        }
      },
      equal: {
        message: 'Must be equal',
        validate: function (value, context, options) {
          options = angular.isObject(options) ? options : {rule: options};
          var secondVal = angular.isObject(options.rule) &&  options.rule.field ? $parse(options.rule.field)(context) : options.rule;
          var compareByVal = options.rule.byValue || false;
          if (compareByVal && value !== secondVal){
            return invalid.apply(this, [value, context, options]);
          }
          if (!compareByVal && value != secondVal){
            return invalid.apply(this, [value, context, options]);
          }

          return true;
        }
      },
      notEqual: {
        message: 'Must be equal',
        validate: function (value, context, options) {
          options = angular.isObject(options) ? options : {rule: options};
          var secondVal = angular.isObject(options.rule) &&  options.rule.field ? $parse(options.rule.field)(context) : options.rule;
          var compareByVal = options.rule.byValue || false;
          if (compareByVal && value === secondVal){
            return invalid.apply(this, [value, context, options]);
          }
          if (!compareByVal && value == secondVal){
            return invalid.apply(this, [value, context, options]);
          }

          return true;
        }
      },
      type: {
        message: 'Must be an {{rule}}',
        validate: function (value, object, options) {
          options = angular.isObject(options) ? options : {rule: options};
          if (value) {
            var stringValue = value.toString();
          } else {
            return true;
          }
          if (options.rule === 'integer' && stringValue && !stringValue.match(/^\-*[0-9]+$/)) {
            return invalid.apply(this, [value, object, options]);
          }

          if (options.rule === 'number' && stringValue && !stringValue.match(/^\-*[0-9\.]+$/)) {
            return invalid.apply(this, [value, object, options]);
          }

          if (options.rule === 'negative' && stringValue && !stringValue.match(/^\-[0-9\.]+$/)) {
            return invalid.apply(this, [value, object, options]);
          }

          if (options.rule === 'positive' && stringValue && !stringValue.match(/^[0-9\.]+$/)) {
            return invalid.apply(this, [value, object, options]);
          }

          if (options.rule === 'email' && stringValue && !stringValue.match(/^.+@.+$/)) {
            return invalid.apply(this, [value, object, options]);
          }

          if (options.rule === 'phone' && stringValue && !stringValue.match(/^\+?[0-9\-]+\*?$/)) {
            return invalid.apply(this, [value, object, options]);
          }
          return true;
        }
      },
      pattern: {
        message: 'Invalid format',
        validate: function (value, object, options) {
          options = angular.isObject(options) ? options : {rule: options};
          var pattern = options.rule instanceof RegExp ? options.rule : new RegExp(options.rule);

          if (value && !pattern.exec(value)) {
            return invalid.apply(this, [value, object, options]);
          }
          return true;
        }
      },
      custom: {
        message: 'Invalid value',
        validate: function (value, object, options) {
          return options.rule(value, object, options);
        }
      },
      email:{
        message: 'Invalid email address',
        validate: function(value, context, options){
          options = angular.isObject(options) ? options : {rule: options};
          var emailRe = /^([\w\-_+]+(?:\.[\w\-_+]+)*)@((?:[\w\-]+\.)*\w[\w\-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
          value += '';
            if ( ! emailRe.test(value) ) return invalid.apply(this, [value, context, options]);
            if ( /\@.*\@/.test(value) ) return invalid.apply(this, [value, context, options]);
            if ( /\@.*_/.test(value) ) return invalid.apply(this, [value, context, options]);

            return true;
        }
      },
      lessThan: {
        message: 'This field should be less than {{errorField}}',
        validate: function (value, context, options) {
          options = angular.isObject(options) ? options : {rule: options};
          options.rule = angular.isString(options.rule) ? options.rule.split(/[ ,;]+/).filter(Boolean) : [options.rule];
          var parsedValue = parseFloat(value);
          var isNumber = true;
          if (isNaN(parsedValue)){
            isNumber = false;
          } else {
            value = parsedValue;
          }
          for (var i = 0; i < options.rule.length; i++){
            var errorName = null;
            var shouldBeLess = context[options.rule[i]] || options.rule[i];
            if (!shouldBeLess){
              continue;
            }
            if (isNumber) {
              if (isNaN(parseFloat(shouldBeLess))){
                continue;
              }
              errorName = shouldBeLess = parseFloat(shouldBeLess);
            }

            if (value > shouldBeLess) {

              //var tmp = $filter('humanize')($filter('tableize')(options.rule[i]));
              errorName = errorName === null ? $filter('humanize')($filter('tableize')(options.rule[i])) : errorName;
              return invalid.apply(this, [value, context, angular.extend(options, {errorField:  errorName})]);
            }
          }
          return true;

        }
      }
    };
  });
/**
 * Created by nikita
 */

(function () {
	'use strict';
	/**
	 * Some of the code below was filched from https://github.com/bvaughn/angular-form-for
	 */
	angular.module('df.validator')
		.service('dfValidationUtils', function () {
			function dfValidationUtils() {

			}

			dfValidationUtils.prototype = {
				/**
				 * Crawls an object and returns a flattened set of all attributes using dot notation.
				 * This converts an Object like: {foo: {bar: true}, baz: true}
				 * Into an Array like ['foo', 'foo.bar', 'baz']
				 * @param {Object} object Object to be flattened
				 * @returns {Array} Array of flattened keys (perhaps containing dot notation)
				 */
				flattenObjectKeys: function (object) {
					var keys = [];
					var queue = [
						{
							object: object,
							prefix: null
						}
					];

					while (true) {
						if (queue.length === 0) {
							break;
						}

						var data = queue.pop();
						var prefix = data.prefix ? data.prefix + '.' : '';

						if (typeof data.object === 'object') {
							for (var prop in data.object) {
								var path = prefix + prop;

								keys.push(path);

								queue.push({
									object: data.object[prop],
									prefix: path
								});
							}
						}
					}

					return keys;
				}
			};

			return new dfValidationUtils();
		});
})();
/**
 * Created by nikita on 12/29/14.
 */


angular.module('df.validator')
  .service('formValidator', function ($q, dfValidationUtils, $parse, validatorRulesCollection) {
    /**
     * @class
     * @constructor
     */
    function FormValidator() {

    }

    /**
     *
     * @type {FormValidator}
     */
    FormValidator.prototype = {
      /**
       * @method
       * @description
       * Strip array brackets from field names so that object values can be mapped to rules.
       * For instance:
       * 'foo[0].bar' should be validated against 'foo.collection.fields.bar'.
       */
      $getRulesForFieldName: function (validationRules, fieldName) {
        fieldName = fieldName.replace(/\[[^\]]+\]/g, '.collection.fields');
        return $parse(fieldName)(validationRules);
      },
      /**
       * @method
       * @description
       * Validates the object against all rules in the validationRules.
       * This method returns a promise to be resolved on successful validation,
       * Or rejected with a map of field-name to error-message.
       * @param {Object} object Form-data object object is contained within
       * @param {Object} validationRules Set of named validation rules
       * @returns {Promise} To be resolved or rejected based on validation success or failure.
       */
      validateAll: function (object, validationRules) {
        throw 'Not Implemented';
        //var fields = dfValidationUtils.flattenObjectKeys(validationRules);
        //return this.validateFields(object, fields, validationRules);
      },

      /**
       * @method
       * @param {*} viewValue
       * @param {*} modelValue
       * @param {*} object
       * @param {string} fieldName
       * @param {*} validationRules
       * @return {promise}
       */
      validateField: function (viewValue, modelValue, object, fieldName, validationRules) {
        validationRules = angular.copy(validationRules);
        var rules = this.$getRulesForFieldName(validationRules, fieldName);
        var value = modelValue || viewValue;
        var validationPromises = [];
        if (angular.isString(value)) {
          value = value.replace(/\s+$/, '');
        }
        if (!rules){
          return $q.resolve();
        }
        var defer = $q.defer();



        (function shiftRule(rules) {
          var rule = rules.shift();

          function processRule(rule) {
            var returnValue;
            if (validatorRulesCollection.has(rule.name)) {
              var validationRule = validatorRulesCollection.get(rule.name);

              try {
                returnValue = validationRule.validate(value, object, rule);
              } catch (error) {
                return $q.reject(error.message || error || validationRule.message);
              }

              if (angular.isObject(returnValue) && angular.isFunction(returnValue.then)) {
                return returnValue.then(
                  function (reason) {
                    return $q.when(reason);
                  },
                  function (reason) {
                    return $q.reject(reason || validationRule.message);
                  });
              } else if (returnValue) {
                return $q.when(returnValue);
              } else {
                return $q.reject(validationRule.message);
              }
            }
            return $q.reject('Unknown validation rule with name ' + rule.name);
          }

          return processRule(rule)
            .then(function () {
              if (rules.length === 0) {
                return defer.resolve();
              }
              return shiftRule(rules);
            })
            .catch(defer.reject);


        }(rules));


        return defer.promise;
      }
    };

    return new FormValidator();
  })
;
/**
 * Created by nikita on 12/29/14.
 */


angular.module('df.validator')
  .service('objectValidator',
  /**
   *
   * @param $q
   * @param dfValidationUtils
   * @param $parse
   * @param {ValidatorRulesCollection} validatorRulesCollection
   */
  function ($q, dfValidationUtils, $parse, validatorRulesCollection) {
    /**
     * @class
     * @constructor
     */
    function ObjectValidator() {

    }

    /**
     *
     * @type ObjectValidator
     */
    ObjectValidator.prototype = {
      /**
       * @method
       * @description
       * Strip array brackets from field names so that object values can be mapped to rules.
       * For instance:
       * 'foo[0].bar' should be validated against 'foo.collection.fields.bar'.
       */
      $getRulesForFieldName: function (validationRules, fieldName) {
        fieldName = fieldName.replace(/\[[^\]]+\]/g, '.collection.fields');
        return $parse(fieldName)(validationRules);
      },
      /**
       * @method
       * @description
       * Validates the object against all rules in the validationRules.
       * This method returns a promise to be resolved on successful validation,
       * Or rejected with a map of field-name to error-message.
       * @param {Object} object Form-data object object is contained within
       * @param {Object} validationRules Set of named validation rules
       * @returns {Promise} To be resolved or rejected based on validation success or failure.
       */
      validateAll: function (object, validationRules) {
        var fields = dfValidationUtils.flattenObjectKeys(validationRules);
        return this.validateFields(object, fields, validationRules);
      },


      /**
       * @method
       * @description
       * Validates the values in object with the rules defined in the current validationRules.
       * This method returns a promise to be resolved on successful validation,
       * Or rejected with a map of field-name to error-message.
       * @param {Object} object Form-data object object is contained within
       * @param {Array} fieldNames Whitelist set of fields to validate for the given object; values outside of this list will be ignored
       * @param {Object} validationRules Set of named validation rules
       * @returns {Promise} To be resolved or rejected based on validation success or failure.
       */
      validateFields: function (object, fieldNames, validationRules) {
        validationRules = angular.copy(validationRules);
        var deferred = $q.defer();
        var promises = [];
        var errorMap = {};

        angular.forEach(fieldNames, function (fieldName) {
          var rules = this.$getRulesForFieldName(validationRules, fieldName);

          if (rules) {
            var promise;

            promise = this.validateField(object, fieldName, validationRules);

            promise.then(
              angular.noop,
              function (error) {
                $parse(fieldName).assign(errorMap, error);
              });

            promises.push(promise);
          }
        }, this);

        $q.all(promises).then(
          deferred.resolve,
          function () {
            deferred.reject(errorMap);
          });

        return deferred.promise;
      },

      /**
       * @method
       * @param object
       * @param fieldName
       * @param validationRules
       * @return {*}
       */
      validateField: function (object, fieldName, validationRules) {
        var rules = this.$getRulesForFieldName(validationRules, fieldName);
        var value = $parse(fieldName)(object);
        var validationPromises = [];
        if (angular.isString(value)) {
          value = value.replace(/\s+$/, '');
        }
        var defer = $q.defer();


        (function shiftRule(rules) {
          var rule = rules.shift();

          function processRule(rule) {
            var returnValue;
            if (validatorRulesCollection.has(rule.name)) {
              var validationRule = validatorRulesCollection.get(rule.name);
              var ruleOptions = rule;

              try {
                returnValue = validationRule.validate(value, object, ruleOptions);
              } catch (error) {
                return $q.reject(error || validationRule.message);
              }

              if (angular.isObject(returnValue) && angular.isFunction(returnValue.then)) {
                return returnValue.then(
                  function (reason) {
                    return $q.when(reason);
                  },
                  function (reason) {
                    return $q.reject(reason || validationRule.message);
                  });
              } else if (returnValue) {
                return $q.when(returnValue);
              } else {
                return $q.reject(validationRule.message);
              }
            }
            return $q.reject('Unknown validation rule with name ' + ruleName);
          }

          return processRule(rules)
            .then(function () {
              if (rules.length === 0) {
                return defer.resolve();
              }
              return shiftRule(rules);
            })
            .catch(defer.reject);


        }(rules));

        return defer.promise;
      },

      /**
       * Convenience method for determining if the specified collection is flagged as required (aka min length).
       */
      isCollectionRequired: function (fieldName, validationRules) {
        var rules = this.$getRulesForFieldName(validationRules, fieldName);

        return rules &&
          rules.collection &&
          rules.collection.min &&
          (angular.isObject(rules.collection.min) ? rules.collection.min.rule : rules.collection.min);
      },

      /**
       * Convenience method for determining if the specified field is flagged as required.
       */
      isFieldRequired: function (fieldName, validationRules) {
        var rules = this.$getRulesForFieldName(validationRules, fieldName);

        return rules &&
          rules.required &&
          (angular.isObject(rules.required) ? rules.required.rule : rules.required);
      }

    };

    return new ObjectValidator();
  })
;
/**
 * Created by nikita on 12/29/14.
 */

angular.module('df.validator')
    .provider('validator', function ($provide) {

        var schemas = {};

        this.add = function (name, schema) {
            schemas[name] = schema;
            return this;
        };

        this.addCollection = function (col) {
            var self = this;
            angular.forEach(col, function (schema, type) {
                self.add(type, schema.validators || schema);
            });
        };

        this.remove = function (name) {
            delete schemas[name];
            return this;
        };


        this.has = function (name) {
            return schemas[name] !== undefined;
        };

        this.get = function (name) {
            return schemas[name] || {};
        };

        var provider = this;


        this.$get =
          /**
           *
           * @param $q
           * @param {ObjectValidator} objectValidator
           * @param {FormValidator} formValidator
           * @param {ValidatorRulesCollection} validatorRulesCollection
           */
          function ($q, objectValidator, formValidator, validatorRulesCollection) {
            /**
             * @class
             * @constructor
             */
            function Validator() {
            }

            /**
             *
             * @type Validator
             */
            Validator.prototype = {
                add: function add(name, schema) {
                    provider.add(name, schema);
                    return this;
                },
                remove: function remove(name) {
                    provider.remove(name);
                    return this;
                },
                has: function has(name) {
                    return provider.has(name);
                },
                get: function get(name) {
                    return provider.get(name);
                },
                addRule: function addRule(name, rule) {
                    validatorRulesCollection.add(name, rule);
                    return this;
                },
                removeRule: function removeRule(name) {
                    validatorRulesCollection.remove(name);
                    return this;
                },
                hasRule: function hasRule(name) {
                    return validatorRulesCollection.has(name);
                },
                getRule: function getRule(name) {
                    return validatorRulesCollection.get(name);
                },

                getValidationRules: function getValidationRules(schema) {
                    schema = angular.isFunction(schema) ? this.get(schema.constructor.name) : schema;
                    schema = angular.isString(schema) ? this.get(schema) : schema;
                    return schema;
                },
                validate: function validate(object, schema) {
                    schema = angular.isObject(schema) ? schema : this.getValidationRules(schema || object);
                    return objectValidator.validateAll(object, schema);
                },
                validateField: function validateField(object, fields, schema) {
                    var fieldNames = angular.isString(fields) ? [fields] : fields;
                    return objectValidator.validateFields(object, fieldNames, this.getValidationRules(schema || object));
                },
                validateFormField: function (viewValue, modelValue, model, field, schema) {
                    return formValidator.validateField(viewValue, modelValue, model, field, schema);
                }
            };

            return new Validator();
        };
    });

/**
 * @ngdoc Services
 * @name ValidatorRulesCollection
 * @description
 * ValidatorRulesCollection service used by EntityBundle to manage validation rules by name.
 */
'use strict';
angular.module('df.validator')
  .service('validatorRulesCollection', function ValidatorRulesCollection($q, defaultValidationRules) {
    var validators = {};

    /**
     * Use this method to add new rule to the validation collection.
     * @memberof ValidatorRulesCollection
     */
    this.add = function (name, rule) {
      if (angular.isFunction(rule)) {
        rule = {
          message: 'Invalid value',
          validate: rule
        };
      }
      if (!angular.isFunction(rule.validate)) {
        throw 'Invalid validator object type';
      }
      validators[name] = rule;
      return this;
    };

    /**
     * Use this method to remove existed rule from the validation collection.
     * @memberof ValidatorRulesCollection
     */
    this.remove = function (name) {
      delete validators[name];
      return this;
    };

    /**
     * Use this method to check is rule existe inside the validation collection.
     * @memberof ValidatorRulesCollection
     */
    this.has = function (name) {
      return validators[name];
    };

    /**
     * Use this method to get the rule from the validation collection.
     * @memberof ValidatorRulesCollection
     */
    this.get = function (name) {
      return validators[name];
    };
//---- add pre defined validator rules to the validation collection
    var self = this;
    angular.forEach(defaultValidationRules, function (rule, name) {
      self.add(name, rule);
    });

  });