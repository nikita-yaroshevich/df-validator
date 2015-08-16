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