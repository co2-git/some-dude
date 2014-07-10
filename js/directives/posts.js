module.exports = function () {

  return function (Socks) {
    return {
      restrict: 'E',
      templateUrl: '/partials/blog',
      link: function ($scope, $elem, $attrs) {
        $scope.posts = [];

        Socks.find('blog', {}, function (error, posts) {
          console.log('//', error, posts);
          if ( error ) {
            return console.error(error);
          }
          $scope.posts = posts;
          $scope.$apply();
        });
      }
    };
  };
};