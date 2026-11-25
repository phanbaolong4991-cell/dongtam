/* =========================================
   ĐỒNG TÂM D&T COFFEE - FORM LIÊN HỆ
   Gửi yêu cầu của khách vào Google Sheet qua Google Apps Script.
========================================= */
(function () {
  'use strict';

  // Dán địa chỉ Web app của Google Apps Script vào đây.
  // Dạng: https://script.google.com/macros/s/XXXXXXXX/exec
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyk-E6cIVqMfF6A0bu1lKSHbFTK6NR53EgfcpiVWR_3qaniXMVclkEiSQADG2r71Bpu/exec';

  var HOTLINE = '0338 851 369';

  var form = document.getElementById('contactForm');
  if (!form) return;

  var statusEl = document.getElementById('formStatus');
  var submitBtn = form.querySelector('button[type="submit"]');
  var submitLabel = submitBtn.textContent;
  var sending = false;

  function showStatus(type, text) {
    statusEl.className = 'form-status ' + type;
    statusEl.textContent = text;
  }

  function isValidPhone(value) {
    var digits = value.replace(/[\s.\-()]/g, '');
    return /^(\+?84|0)\d{8,10}$/.test(digits);
  }

  function isConfigured() {
    return /^https:\/\/script\.google\.com\/macros\/s\/[^\/]+\/exec$/.test(SCRIPT_URL);
  }

  function setSending(state) {
    sending = state;
    submitBtn.disabled = state;
    submitBtn.textContent = state ? 'Đang gửi...' : submitLabel;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (sending) return;

    var phone = form.elements.phone.value.trim();
    if (!isValidPhone(phone)) {
      showStatus('error', 'Số điện thoại chưa đúng. Vui lòng nhập số điện thoại Việt Nam, ví dụ 0338 851 369.');
      form.elements.phone.focus();
      return;
    }

    if (!isConfigured()) {
      showStatus('error', 'Form chưa sẵn sàng nhận yêu cầu. Vui lòng gọi hotline ' + HOTLINE + '.');
      return;
    }

    var data = new URLSearchParams(new FormData(form));
    data.append('page', window.location.pathname);

    setSending(true);
    showStatus('info', 'Đang gửi yêu cầu của bạn...');

    fetch(SCRIPT_URL, { method: 'POST', body: data })
      .then(function (response) { return response.json(); })
      .then(function (result) {
        if (!result || !result.ok) {
          throw new Error(result && result.error ? result.error : 'unknown');
        }
        form.reset();
        showStatus('success', 'Cảm ơn bạn! Chúng tôi đã nhận được yêu cầu và sẽ liên hệ lại với bạn.');
      })
      .catch(function () {
        showStatus('error', 'Chưa gửi được yêu cầu. Vui lòng thử lại hoặc gọi hotline ' + HOTLINE + '.');
      })
      .then(function () {
        setSending(false);
      });
  });
})();
