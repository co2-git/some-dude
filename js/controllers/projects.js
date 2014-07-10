module.exports = function () {
  return function ($scope, Socks) {
    $scope.projects = [];

    Socks.find('projects', {}, function (error, projects) {
      console.log('//', error, projects);
      if ( error ) {
        return console.error(error);
      }
      $scope.projects = projects;
      $scope.$apply();
    });
  };
};