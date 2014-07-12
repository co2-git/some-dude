(function () {
  $(document).foundation();

  function isSmall () {
    return +$(window).width() <= 640;
  }

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SHOW SEARCH
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

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
          if ( ! $(window).scrollTop() ) {
            $('form[name=search]').animate({'margin-top': 0}, 'slow',
              function () {
                $('form[name=search] [type=search]').focus();
              });
          }
          else  {
            $('form[name=search] [type=search]').focus();
          }
        });
    }

    e.stopPropagation();
    return false;
  });
})();