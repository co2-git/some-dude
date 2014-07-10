module.exports = function () {

  return function () {
    return {
      restrict: 'A',
      // templateUrl: '/partials/blog',
      link: function ($scope, $elem, $attrs) {
        var post = $scope.posts.filter(function (post) {
          return post._id === $attrs.post;
        });

        if ( post.length ) {
          $elem.html(post[0].post);
        }
      }
    };
  };
};