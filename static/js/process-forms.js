
'use strict';

var ProcessForm = function (settings) {
    this._settings = {
        selector: '#contacts__form', // дефолтный селектор
        attachmentsMaxFileSize: 512, // дефолтный максимальный размер файла в Кб
        attachmentsFileExt: ['jpg', 'bmp', 'gif', 'png', 'txt'], // дефолтные допустимые расширения для файлов
        isUseDefaultSuccessMessage: true // отображать дефолтное сообщение об успешной отправки формы
    };

    this._isAgreementSection = false; // имеется ли в форме блок с пользовательским соглашением

    this._attachmentsItems = []; // переменная, хранящая массив файлов, которые нужно прекрепить к форме

    for (var propName in settings) {
        if (settings.hasOwnProperty(propName)) {
            this._settings[propName] = settings[propName];
        }
    }
    this._form = $(this._settings.selector).eq(0);
};

ProcessForm.prototype = function () {
    // переключить во включенное или выключенное состояние кнопку submit
    var _changeStateSubmit = function (_this, state) {
        _this._form.find('[type="submit"]').prop('disabled', state);
    };

    // обновление капчи
    var _refreshCaptcha = function (_this) {
        var
            captchaImg = _this._form.find('.form-captcha__image'),
            captchaSrc = captchaImg.attr('data-src'),
            captchaPrefix = captchaSrc.indexOf('?id') !== -1 ? '&rnd=' : '?rnd=',
            captchaNewSrc = captchaSrc + captchaPrefix + (new Date()).getTime();
        captchaImg.attr('src', captchaNewSrc);
    };

    // изменение состояния элемента формы (success, error, clear)
    var _setStateValidaion = function (input, state, message) {
        input = $(input);
        if (state === 'error') {
            input
                .removeClass('is-valid').addClass('is-invalid')
                .siblings('.invalid-feedback').text(message);
        } else if (state === 'success') {
            input.removeClass('is-invalid').addClass('is-valid');
        } else {
            input.removeClass('is-valid is-invalid');
        }
    };

    // метод, возвращающий результат проверки расширения файла допустимому
    var _validateFileExtension = function (filename, validFileExtensions) {
        // получаем расширение файла
        var fileExtension = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
        // если есть расширение, то проверяем соотвествует ли оно допустимому

        if (fileExtension) {
            for (var i = 0; i <= validFileExtensions.length; i++) {
                if (validFileExtensions[i] === fileExtension.toLowerCase()) {
                    return true;
                }
            }
        }

        return false;
    };

    // валилация формы
    var _validateForm = function (_this) {
        var valid = true;
        _this._form.find('input, textarea').not('[type="file"], [name="agree"]').each(function () {
            if (this.checkValidity()) {
                _setStateValidaion(this, 'success');
            } else {
                _setStateValidaion(this, 'error', this.validationMessage);
                valid = false;
            }
        });


        return valid;
    };

    var _showForm = function (_this) {
        if (!_this._form.find('.form-error').hasClass('d-none')) {
            _this._form.find('.form-error').addClass('d-none');

        }

        _this._form.siblings('.form-result-success').addClass('d-none').removeClass('d-flex');
        _this._form[0].reset();
        _this._form.find('input, textarea').each(function () {
            _setStateValidaion(this, 'clear');
        });

        if (_this._isAgreementSection) {
            _changeStateSubmit(_this, true);
        } else {
            _changeStateSubmit(_this, false);
        }

    };


    // собираем данные для отправки на сервер
    var _collectData = function (_this) {
        var output;
        _changeStateImages(_this, true);
        output = new FormData(_this._form[0]);
        _changeStateImages(_this, false);
        for (var i = 0, length = _this._attachmentsItems.length; i < length; i++) {
            output.append('attachment[]', _this._attachmentsItems[i].file);
        }

        return output;
    };

    // отправка формы
    var _sendForm = function (_this) {
        if (!_validateForm(_this)) {
            if (_this._form.find('.is-invalid').length > 0) {
                if (_this._form.find('.is-invalid').hasClass('file')) {
                    _this._form.find('input[type="file"]').focus();
                } else {
                    _this._form.find('.is-invalid')[0].focus();
                }
            }
            return;
        }

        if (!_this._form.find('.form-error').hasClass('d-none')) {
            _this._form.find('.form-error').addClass('d-none');
        }

        $.ajax({
            context: _this,
            type: "POST",
            url: _this._form.attr('action'),
            data: _collectData(_this), // данные для отправки на сервер
            contentType: false,
            processData: false,
            cache: false,


        })
            .done(_success)
            .fail(_error)
    };

    // при получении успешного ответа от сервера
    var _success = function (data) {
        var _this = this;

        // при успешной отправки формы
        if (data.result === "success") {
            $(document).trigger('pf_success', {data: this});
            if (_this._settings.isUseDefaultSuccessMessage) {
                _this._form.parent().find('.form-result-success')
                    .removeClass('d-none')
                    .addClass('d-flex');
            }
            return;
        }
        // если произошли ошибки при отправке
        _this._form.find('.form-error').removeClass('d-none');
        _changeStateSubmit(this, false);

        _this._form.find('.form-attachments__item').attr('title', '').removeClass('is-valid is-invalid');

        // выводим ошибки которые прислал сервер
        for (var error in data) {
            if (!data.hasOwnProperty(error)) {
                continue;
            }
            switch (error) {
                case 'captcha':
                    _refreshCaptcha(_this);
                    _setStateValidaion(_this._form.find('[name="' + error + '"]'), 'error', data[error]);
                    break;
                case 'attachment':
                    $.each(data[error], function (key, value) {
                        _this._form.find('.form-attachments__item[data-id="' + _this._attachmentsItems[key].id + '"]').attr('title', value).addClass('is-invalid');
                    });
                    break;
                case 'log':
                    $.each(data[error], function (key, value) {
                        console.log(value);
                    });
                    break;
                default:
                    _setStateValidaion(_this._form.find('[name="' + error + '"]'), 'error', data[error]);
            }
        }
        // устанавливаем фокус на 1 невалидный элемент
        if (_this._form.find('.is-invalid').length > 0) {
            if (_this._form.find('.is-invalid').hasClass('file')) {
                _this._form.find('input[type="file"]').focus();
            } else {
                _this._form.find('.is-invalid')[0].focus();
            }
        }
        _this._form.find('.form-attachments__item').not('.is-invalid').addClass('is-valid');
    };

    // если не получили успешный ответ от сервера
    // var _error = function () {
    //     this._form.find('.form-error').removeClass('d-none');
    // };

    // функция для инициализации
    var _init = function () {

        _setupListener(this);
    };

    var _reset = function () {
        _showForm(this);
    };

    // устанавливаем обработчики событий
    var _setupListener = function (_this) {
        $(document).on('change', _this._settings.selector + ' [name="agree"]', function () {
            _changeStateSubmit(_this, !this.checked);
        });
        $(document).on('submit', _this._settings.selector, function (e) {
            e.preventDefault();
            _sendForm(_this);
        });
        $(document).on('click', _this._settings.selector + ' .form-captcha__refresh', function (e) {
            e.preventDefault();
            _refreshCaptcha(_this);
        });
        $(document).on('click', '[data-target="' + _this._settings.selector + '"]', function (e) {
            e.preventDefault();
            _showForm(_this);
        });

    };
    return {
        init: _init,
        reset: _reset
    }
}();
