(function () {
  $(document).foundation();

  function isScrolledIntoView(elem)
  {
      var docViewTop = $(window).scrollTop();
      var docViewBottom = docViewTop + $(window).height();

      var elemTop = $(elem).offset().top;
      var elemBottom = elemTop + $(elem).height();

      return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
  }

  function isSmall () {
    return +$(window).width() <= 640;
  }

  $('.reveal-search').on('click', function (e) {
    if ( isSmall() ) {
      $('body').animate({ scrollTop: $('form[name=search]').offset().top }, 'slow',
        function () {
          $('form[name=search] [type=search]').focus();
        });
    }
    else {
      $('form[name=search]').animate({'margin-top': ($(window).scrollTop() + 45)}, 'slow',
        function () {
          $('form[name=search] [type=search]').focus();
        });
    }

    e.stopPropagation();
    return false;
  });
})();