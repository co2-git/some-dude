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

  if ( $('[name=advanced-search]') ) {
    $('[name=advanced-search] .tag, [name=advanced-search] .language').each(function (i, tag) {
      $(tag).on('click', function () {
        if ( $(this).hasClass('secondary') ) {
          $(this).removeClass('secondary');
        }
        else {
          $(this).addClass('secondary');
        }
      });
    });

    $('[name=advanced-search]').on('submit', function () {
      var tags = [];

      $('[name=advanced-search] .tag').not('.secondary').each(function (i, tag) {
        tags.push($(tag).text());
      });

      $('[name=tags]').val(tags.join(','));

      var languages = [];

      $('[name=advanced-search] .language').not('.secondary').each(function (i, language) {
        languages.push($(language).text());
      });

      $('[name=languages]').val(languages.join(','));
    });
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

    // 

    e.stopPropagation();
    return false;
  });

  $(window).on('scroll', function () {

    // // make top bar sticky
    // $('.my-top-bar').css({
    //   position: 'fixed',
    //   width: '100%',
    //   right: '0',
    //   left: '0',
    //   'z-index': 9999
    // });

    // // make top bar unsticky if back to top
    // if ( $(window).scrollTop() === 0 && $('.my-top-bar').css('position') === 'fixed' ) {
    //   $('.my-top-bar').css({
    //     position: 'relative',
    //     width: 'relative'
    //   });
    // }
  });
})();