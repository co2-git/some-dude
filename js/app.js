(function () {
  $(document).foundation();

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
    // $('form[name=search]').css('margin-top', $(window).scrollTop());
    $(window).scrollTop($('form[name=search]').offset().top);

    $('form[name=search] [type=search]').focus();

    e.stopPropagation();
    return false;
  });

  $(window).on('scroll', function () {
    if ( +$(window).width() > 640 ) {
      $('form[name=search]').css('margin-top', $(window).scrollTop());
    }
  });
})();