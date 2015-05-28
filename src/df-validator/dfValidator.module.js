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
