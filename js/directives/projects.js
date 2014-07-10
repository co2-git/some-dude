module.exports = function () {

  return function () {
    return {
      restrict: 'E',
      templateUrl: '/partials/projects',
      link: function ($scope, $elem, $attrs) {
        console.log('OMG');
      }
    };
  };
};