import { gsap } from 'gsap';
let cx, cy, mouseX, mouseY, posX, posY, clientX, clientY, dx, dy, tiltx, tilty, request, radius, degree;

$(() => {
  // var Rellax = require('rellax.min.js');
  let rellax = new Rellax('.rellax');

  const body = document.querySelector('body')

  cx = window.innerWidth / 2
  cy = window.innerHeight / 2

  body.addEventListener('mousemove', e => {

    clientX = e.pageX
    clientY = e.pageY

    request = requestAnimationFrame(updateMe)

  })

  function updateMe() {
console.log(1);
    dx     = clientX - cx
    dy     = clientY - cy
    tiltx  = dy / cy
    tilty  = dx / cx
    radius = Math.sqrt(Math.pow(tiltx, 2) + Math.pow(tilty, 2))
    degree = radius * 12
    gsap.to('.card',  { transform: `rotate3d( ${tiltx}, ${tilty}, 0, ${degree}deg )` })

  }

  gsap.to('.card', { zoom: .98 })
  gsap.to('.level-1', { opacity: 1, duration: .1 })
  gsap.to('.level-2', { opacity: 1, left: -10, top: 10, duration: .25, delay: .25 })
  // gsap.to('.l3_main', { opacity: 1, left: -20, top: 20, duration: .25, delay: .25 })
  // gsap.to('.card-russia', { opacity: .07, duration: .1 })
  // gsap.to('.card-logo_w', { opacity: 1, duration: .225 })
  // gsap.to('.card-chip', { opacity: 1, duration: .225 })
  // gsap.to('.card-valid', { opacity: 1, zoom: 1, duration: .1, delay: .25 })
  // gsap.to('.card-number-holder', { opacity: 1, zoom: 1, duration: .1, delay: .25 })



$(window).scroll(function () {
    const top = $(window).scrollTop();
    const heightScreen = $(window).height();

    if(top >= heightScreen){
      $('.arrow-up').css('visibility','visible').css('height','2em');
    } else {
      $('.arrow-up').css('visibility','hidden').css('height','1px')
    }
  });

  $(".arrow-up").on('click', function(e){
    e.preventDefault();
    $('body,html').animate({scrollTop: 0}, 400);
  });

  function toggleClassMenu () {
    $('nav').toggleClass('nav_mobile');
    $('.menu').toggleClass('open');
  }

  $('.mobile-menu').on('click', toggleClassMenu);

  $(window).resize(function () {
    if ($('.menu').hasClass('open')) {
      toggleClassMenu();
    }

  });

  function helloPrint() {
    let today = new Date();
    let currentHours = today.getHours();
    let el = $('#hello');
    if (currentHours>6 && currentHours<=11) {
      el.text('Доброе утро!');
    } else if (currentHours>=12 && currentHours<18) {
      el.text('Добрый день!');
    } else if (currentHours>=18 && currentHours<24) {
      el.text('Добрый вечер!') ;
    } else {
      el.text('Доброй ночи!');
    }

  }

  let animateButton = function(e) {
    e.preventDefault();
    e.target.classList.remove('animate');
    e.target.classList.add('animate');
   setTimeout(function(){
      e.target.classList.remove('animate');
    },3000);
  };

  let classname = document.getElementsByClassName("send-btn");
  // for (var i = 0; i < classname.length; i++) {
    classname[0].addEventListener('click', animateButton, false);
  // }

  function onSubmit(token) {
    let form = $('#contacts__form');
    let data = form.serialize();
    data['g-recaptcha-response'] = token;
    $.ajax({
      type: form.attr('method'),
      url: 'https://musshop-back.letup.date/send-message-nata.php',
      data: data
      // headers: {'Content-Type': 'application/json'}
    }).done(function() {
      console.log('success');
      $('.send-btn').toggleClass('success');
      $('.form-message-send').html('<div style="color:darkgreen;font-size: 20px;padding: 20px;">Сообщение отправлено</div>')
      setTimeout(function(){
        resetForm();
        resetTextareaSize();
      },4000);
      grecaptcha.reset();
    }).fail(function() {
      console.log('fail');
      $('.send-btn').toggleClass('error');

      $('.form-message-send').html('<div style="color:#ff6347;font-size: 20px;padding: 5px;">сообщение не отправлено</div>')
      setTimeout(function(){
        resetForm();
        resetTextareaSize();
      },4000);
      grecaptcha.reset();
    });

  }

  window.onSubmit = onSubmit;

  $('#contacts__form').submit(function(e) {
    grecaptcha.execute();
    e.preventDefault();
  });

  $('#message-to-send').on('input', autosize);

  let TEXTAREA_HEIGHT = null;
  function autosize(){
    let el = this;
    if (TEXTAREA_HEIGHT !== el.scrollHeight ) {
      TEXTAREA_HEIGHT = el.scrollHeight;
      setTimeout(function () {
        el.style.cssText = 'height:auto; ';
        el.style.cssText = 'height:' + (el.scrollHeight) + 'px';
      }, 0);
    }
  }

// Очищение поля textarea после отправки
  function resetForm() {
    $('.form-message-send').html('');
  }


  function resetTextareaSize() {
    let textarea = document.getElementById('message-to-send');
    textarea.value = '';
    textarea.style.height = 'auto';
  }

  helloPrint();



});

