module.exports = function () {
  return function ($scope, Socks) {
    $scope.posts = [];

    Socks.find('blog', {}, function (error, posts) {
      console.log('//', error, posts);
      if ( error ) {
        return console.error(error);
      }
      $scope.posts = posts;
      $scope.$apply();
    });
  };
};
