;(function () {
  $(document).foundation();

  function isSmall () {
    return +$(window).width() <= 640;
  }

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        SHOW SEARCH
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  $('.reveal-search').on('click', function (e) {
    if ( isSmall() ) {
      $('body').animate({ scrollTop: $('form[name=search]').offset().top + 35 }, 'slow',
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

  /** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **\
        ADMIN
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/

  // preview

  $('.edit-tabs').on('toggled', function (event, tab) {
    if ( tab.attr('id') === 'tab-preview' ) {
      $.ajax({
        url: '/services/md-to-html',
        type: 'POST',
        data: {
          contents: $('textarea.edit').val()
        }
      })
        .error(console.log)

        .success(function (data) {
          $('.preview').html(data.html);
        });
    }
  });

  // select languages

  $('.editor .language').on('click', function () {

    var _languages = $('[name=languages]').val().trim();

    var languages = _languages ? _languages.split(',') : [];

    if ( $(this).hasClass('secondary') ) {
      $(this).removeClass('secondary');
      languages.push($(this).text());
    }
    else {
      $(this).addClass('secondary');
      languages.splice(languages.indexOf($(this).text()), 1);
    }

    $('[name=languages]').val(languages.join(','));
  });


})();